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

# RATE LIMIT SETTINGS (For Groq Free Tier)
BATCH_SIZE = 25  # Process 25 missions, then pause
PAUSE_DURATION = 65  # Wait 65 seconds to reset the 1-minute quota

def search_web_slim(query):
    url = "https://google.serper.dev/search"
    headers = {'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json'}
    payload = json.dumps({"q": query, "gl": "np", "tbs": "qdr:m"}) 
    
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
    ROLE: Official Auditor for Nepal's 100-Point Reform Agenda.
    MISSION: {mission['title']}
    EXPECTED DEADLINE: {deadline_date.strftime('%Y-%m-%d')}
    CURRENT DATE: {today.strftime('%Y-%m-%d')}
    SEARCH CONTEXT: {json.dumps(search_data)}
    
    LOGIC: 
    - STATUS is 'DONE' if search shows government action occurred (ignore if late).
    - STATUS is 'OVERDUE' if deadline passed AND no positive action found.
    - STATUS is 'IN_PROGRESS' if deadline is future.
    
    FORMAT:
    STATUS: [DONE/OVERDUE/IN_PROGRESS]
    REASON: [Short sentence]
    SOURCE: [Link]
    """

    # Retry logic for individual request failures
    for attempt in range(3):
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            return completion.choices[0].message.content
        except Exception as e:
            print(f"⚠️ Groq error on point {mission['point_no']}, retrying...")
            time.sleep(5)
    return "STATUS: ERROR\nREASON: API failed\nSOURCE: #"

def run_full_audit():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, '../data/missions.json')
    output_path = os.path.join(base_dir, '../../frontend/public/data/audit_results.json')
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(json_path, 'r') as f:
        missions = json.load(f)
    
    final_results = []
    
    # BATCH PROCESSING LOGIC
    for i in range(0, len(missions), BATCH_SIZE):
        batch = missions[i : i + BATCH_SIZE]
        print(f"\n--- Processing Batch {(i//BATCH_SIZE)+1} ({len(batch)} items) ---")
        
        for m in batch:
            audit_text = audit_mission(m)
            final_results.append({
                "point_no": m.get('point_no'),
                "title": m.get('title'),
                "audit_data": audit_text,
                "checked_at": datetime.now().isoformat()
            })
            time.sleep(1) # Small gap between searches for Serper

        # Wait if there are more batches to go
        if i + BATCH_SIZE < len(missions):
            print(f"⏳ Rate limit protection: Sleeping for {PAUSE_DURATION} seconds...")
            time.sleep(PAUSE_DURATION)

    with open(output_path, 'w') as f:
        json.dump(final_results, f, indent=4)
    
    print(f"\n✅ FULL AUDIT COMPLETE: 100/100 points processed.")

def archive_results():
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    history_dir = "public/data/history"
    
    if not os.path.exists(history_dir):
        os.makedirs(history_dir)
        
    shutil.copy("public/data/audit_results.json", f"{history_dir}/audit_{timestamp}.json")
    print(f"✅ Audit archived to history/audit_{timestamp}.json")

# Call this at the end of your main loop
archive_results()

def push_to_github():
    try:
        # 1. Add the updated JSON file
        subprocess.run(["git", "add", "public/data/audit_results.json"], check=True)
        
        # 2. Commit with a timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        subprocess.run(["git", "commit", "-m", f"Audit Auto-Update: {timestamp}"], check=True)
        
        # 3. Push to GitHub
        subprocess.run(["git", "push"], check=True)
        
        print("🚀 Live Dashboard Updated via GitHub/Vercel!")
    except Exception as e:
        print(f"❌ Auto-push failed: {e}")

if __name__ == "__main__":
    run_full_audit()