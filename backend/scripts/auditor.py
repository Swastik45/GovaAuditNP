import os
import json
import shutil
import time
import requests
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

# 1. Config
GROQ_KEY = os.getenv("GROQ_API_KEY")
SERPER_KEY = os.getenv("SERPER_API_KEY")
client = Groq(api_key=GROQ_KEY)

# CURRENT_DATE_STR for search boosting
CURRENT_YEAR = 2026
CURRENT_DATE_STR = datetime.now().strftime("%B %Y") 

# PATH RESOLUTION
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MISSION_JSON = os.path.join(BASE_DIR, '../data/missions.json')
OUTPUT_JSON = os.path.join(BASE_DIR, '../../frontend/public/data/audit_results.json')
HISTORY_DIR = os.path.join(BASE_DIR, '../../frontend/public/data/history')

def search_web_slim(query):
    """Fetches high-quality snippets from Google via Serper."""
    url = "https://google.serper.dev/search"
    headers = {'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json'}
    # Boost query for Nepal + 2026
    enhanced_query = f"{query} Nepal {CURRENT_YEAR}"
    payload = json.dumps({
        "q": enhanced_query, 
        "gl": "np", 
        "tbs": "qdr:m" # qdr:m = past month; ensures 2026 freshness
    }) 
    
    try:
        response = requests.post(url, headers=headers, data=payload)
        response.raise_for_status()
        results = response.json().get('organic', [])
        return [{"title": r.get("title"), "snippet": r.get("snippet"), "link": r.get("link")} 
                for r in results[:4]]
    except Exception as e:
        print(f"Search Error: {e}")
        return []

def audit_mission(mission):
    """Performs the LLM-based audit on a single mission."""
    print(f"🔍 Auditing #{mission.get('point_no')}: {mission.get('title')}")
    
    deadline_date = datetime.strptime(mission['start_date'], "%Y-%m-%d") + timedelta(days=mission['deadline_days'])
    today = datetime.now()
    search_data = search_web_slim(mission['search_query'])
    
    # IMPROVED PROMPT
    system_prompt = f"""You are a Cold-Fact Auditor for the Nepal 2026 Reform Ledger. 
    You must classify the mission status based on evidence from {CURRENT_YEAR}.
    
    GROUNDING RULES:
    1. THE CURRENT DATE IS {today.strftime('%Y-%m-%d')}.
    2. THE TARGET DEADLINE IS {deadline_date.strftime('%Y-%m-%d')}.
    3. Ignore results from 2025 or earlier.
    4. Classification:
       - 'DONE': Definite news/report of implementation in {CURRENT_YEAR}.
       - 'OVERDUE': Current date > Deadline AND no verified implementation found in {CURRENT_YEAR}.
       - 'IN_PROGRESS': Within deadline AND partial signs of work found.
    """

    user_prompt = f"""
    MISSION: {mission['title']}
    SEARCH RESULTS: {json.dumps(search_data)}
    
    RETURN ONLY A JSON OBJECT:
    {{
      "status": "DONE" | "OVERDUE" | "IN_PROGRESS",
      "reason": "One short sentence explaining why.",
      "source": "URL from the provided context or '#'"
    }}
    """

    for attempt in range(3):
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0, # Zero for maximum factual consistency
                response_format={"type": "json_object"}
            )
            return completion.choices[0].message.content
        except Exception as e:
            # Smart Sleep: Check if Groq tells us how long to wait
            wait_time = 10
            if "retry-after" in str(e).lower():
                print("⏳ Rate limited. Exponential backoff active...")
                wait_time = 30 * (attempt + 1)
            time.sleep(wait_time)
            
    return json.dumps({"status": "ERROR", "reason": "Audit timeout", "source": "#"})

def run_full_audit():
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(MISSION_JSON, 'r') as f:
        missions = json.load(f)
    
    final_results = []
    for m in missions:
        audit_raw = audit_mission(m)
        final_results.append({
            "point_no": m.get('point_no'),
            "title": m.get('title'),
            "audit_data": audit_raw,
            "checked_at": datetime.now().isoformat()
        })
        time.sleep(2) # Base delay to respect Groq RPM

    with open(OUTPUT_JSON, 'w') as f:
        json.dump(final_results, f, indent=4)
    print(f"\n✅ Audit File Written: {OUTPUT_JSON}")

def archive_results():
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    os.makedirs(HISTORY_DIR, exist_ok=True)
    dest = os.path.join(HISTORY_DIR, f"audit_{timestamp}.json")
    shutil.copy(OUTPUT_JSON, dest)
    print(f"📦 Archived snapshot to: {dest}")

if __name__ == "__main__":
    run_full_audit()
    archive_results()