import os
import json
import shutil
import subprocess
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

# DYNAMIC DATES FOR 2026 ACCURACY
CURRENT_DATE_STR = datetime.now().strftime("%B %Y") # e.g., "April 2026"

# RATE LIMIT SETTINGS
BATCH_SIZE = 25  
PAUSE_DURATION = 65  

# PATH RESOLUTION
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Adjusting these to match your structure
MISSION_JSON = os.path.join(BASE_DIR, '../data/missions.json')
OUTPUT_JSON = os.path.join(BASE_DIR, '../../frontend/public/data/audit_results.json')
HISTORY_DIR = os.path.join(BASE_DIR, '../../frontend/public/data/history')

def search_web_slim(query):
    url = "https://google.serper.dev/search"
    headers = {'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json'}
    # Added the CURRENT_DATE_STR to the query to force 2026 results
    enhanced_query = f"{query} {CURRENT_DATE_STR}"
    payload = json.dumps({"q": enhanced_query, "gl": "np", "tbs": "qdr:m"}) 
    
    try:
        response = requests.post(url, headers=headers, data=payload)
        full_data = response.json()
        return [{"title": r.get("title"), "snippet": r.get("snippet"), "link": r.get("link")} 
                for r in full_data.get('organic', [])[:3]]
    except Exception as e:
        print(f"Search Error: {e}")
        return []

def audit_mission(mission):
    print(f"🔍 Auditing #{mission.get('point_no')}: {mission.get('title')}")
    
    start_date = datetime.strptime(mission['start_date'], "%Y-%m-%d")
    deadline_date = start_date + timedelta(days=mission['deadline_days'])
    today = datetime.now()
    
    search_data = search_web_slim(mission['search_query'])
    
    prompt = f"""
    ROLE: Official System Auditor for Nepal's 2026 Reform Agenda.
    MISSION: {mission['title']}
    TARGET DEADLINE: {deadline_date.strftime('%Y-%m-%d')}
    TODAY'S DATE: {today.strftime('%Y-%m-%d')}
    SEARCH CONTEXT: {json.dumps(search_data)}
    
    CRITICAL AUDIT RULES:
    1. A new 100-point reform agenda started MARCH 27, 2026. 
    2. IGNORE failed actions from 2024 or 2025. We only care about progress made in 2026.
    3. If search shows NTA/Government blocked apps or implemented changes in MARCH/APRIL 2026, status is 'DONE'.
    4. If {today.strftime('%Y-%m-%d')} is past {deadline_date.strftime('%Y-%m-%d')} AND no 2026 action is found, status is 'OVERDUE'.

    FORMAT:
    STATUS: [DONE/OVERDUE/IN_PROGRESS]
    REASON: [Short factual sentence citing 2026 data]
    SOURCE: [Link]
    """

    for attempt in range(3):
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            return completion.choices[0].message.content
        except Exception as e:
            print(f"⚠️ Groq error, retrying... {e}")
            time.sleep(5)
    return "STATUS: ERROR\nREASON: API failed\nSOURCE: #"

def run_full_audit():
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)

    with open(MISSION_JSON, 'r') as f:
        missions = json.load(f)
    
    final_results = []
    
    for i in range(0, len(missions), BATCH_SIZE):
        batch = missions[i : i + BATCH_SIZE]
        print(f"\n--- Processing Batch {(i//BATCH_SIZE)+1} ---")
        
        for m in batch:
            audit_text = audit_mission(m)
            final_results.append({
                "point_no": m.get('point_no'),
                "title": m.get('title'),
                "audit_data": audit_text,
                "checked_at": datetime.now().isoformat()
            })
            time.sleep(1) 

        if i + BATCH_SIZE < len(missions):
            print(f"⏳ Sleeping {PAUSE_DURATION}s to reset Groq Quota...")
            time.sleep(PAUSE_DURATION)

    with open(OUTPUT_JSON, 'w') as f:
        json.dump(final_results, f, indent=4)
    
    print(f"\n✅ Audit File Written: {OUTPUT_JSON}")

def archive_results():
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    if not os.path.exists(HISTORY_DIR):
        os.makedirs(HISTORY_DIR)
        
    dest = os.path.join(HISTORY_DIR, f"audit_{timestamp}.json")
    shutil.copy(OUTPUT_JSON, dest)
    print(f"📦 Archived snapshot to: {dest}")

def push_to_github():
    try:
        # Move to the root of the repo to run git commands
        repo_root = os.path.join(BASE_DIR, "../../")
        
        # Git commands targeting the specific file
        subprocess.run(["git", "add", "frontend/public/data/audit_results.json"], cwd=repo_root, check=True)
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        subprocess.run(["git", "commit", "-m", f"Audit Auto-Update: {timestamp}"], cwd=repo_root, check=True)
        subprocess.run(["git", "push"], cwd=repo_root, check=True)
        
        print("🚀 LIVE: GitHub and Vercel updated successfully!")
    except Exception as e:
        print(f"❌ Git Push Failed: {e}")

if __name__ == "__main__":
    run_full_audit()
    archive_results()
    push_to_github() # Only uncomment this if you have git initialized and connected to a remote