import os
import json
import shutil
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
import trafilatura
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

# Optional NLP (safe fallback if not installed)
try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except:
    nlp = None

load_dotenv()

# -------------------------------
# CONFIG
# -------------------------------
Tavily_API_KEY = os.getenv("TAVILY_API_KEY")  # Using Tavily as the search API

CURRENT_YEAR = 2026
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MISSION_JSON = os.path.join(BASE_DIR, '../data/missions.json')
OUTPUT_JSON = os.path.join(BASE_DIR, '../../frontend/public/data/audit_results.json')
HISTORY_DIR = os.path.join(BASE_DIR, '../../frontend/public/data/history')

# -------------------------------
# GLOBAL OPTIMIZATION
# -------------------------------
session = requests.Session()
cache = {}
cache_lock = Lock()

# -------------------------------
# 🔍 SEARCH
# -------------------------------
def search_web(query):
    url = "https://api.tavily.com/search"

    # Fix 1: Correct Authentication Header
    headers = {
        "Authorization": f"Bearer {Tavily_API_KEY}",
        "Content-Type": "application/json"
    }

    # Fix 2: Correct Payload Parameters
    payload = {
        "query": f"{query} Nepal",           # Use 'query' instead of 'q'
        "search_depth": "basic",             # 'basic' or 'advanced'
        "include_domains": [],               # Optional filters
        "max_results": 8
    }

    try:
        # Note: res.json() directly instead of json.dumps for requests session
        res = session.post(url, headers=headers, json=payload, timeout=15)
        res.raise_for_status()
        
        # Fix 3: Use 'results' instead of 'organic'
        data = res.json()
        results = data.get("results", [])

        clean = []
        for r in results:
            link = r.get("url") # Tavily uses 'url', not 'link'

            with cache_lock:
                if link in cache:
                    content = cache[link]
                else:
                    content = fetch_page_content(link)
                    cache[link] = content

            clean.append({
                "title": r.get("title"),
                "snippet": r.get("content"), # Tavily's 'content' is the snippet
                "link": link,
                "content": content
            })

        return clean

    except Exception as e:
        print(f"Search Error: {e}")
        return []
# -------------------------------
# 📄 CONTENT EXTRACTION
# -------------------------------
def fetch_page_content(url):
    try:
        downloaded = trafilatura.fetch_url(url)
        text = trafilatura.extract(downloaded)

        if text:
            return text[:1200]

        # fallback
        res = session.get(url, timeout=5)
        return res.text[:800]

    except:
        return ""

# -------------------------------
# 🧠 SMART TEXT EXTRACTION
# -------------------------------
def extract_relevant_text(text):
    keywords = [
        "project", "construction", "government",
        "completed", "launched", "started",
        "in progress", "ongoing", "deadline"
    ]

    sentences = text.split(".")
    selected = [
        s for s in sentences
        if any(k in s.lower() for k in keywords)
    ]

    return " ".join(selected[:10])


def spacy_extract(text):
    if not nlp:
        return text[:500]

    doc = nlp(text)
    sentences = [sent.text for sent in doc.sents]

    important = [
        s for s in sentences
        if any(k in s.lower() for k in ["project", "construction", "completed", "government"])
    ]

    return " ".join(important[:5])


# -------------------------------
# 🧠 CLASSIFICATION ENGINE
# -------------------------------
def classify_status(text, deadline_passed):
    text = text.lower()

    done_keywords = [
        "completed", "inaugurated", "launched",
        "finished", "operational"
    ]

    progress_keywords = [
        "ongoing", "under construction",
        "in progress", "started", "developing"
    ]

    stalled_keywords = [
        "delayed", "halted", "stopped", "issue"
    ]

    done_score = sum(k in text for k in done_keywords)
    progress_score = sum(k in text for k in progress_keywords)
    stalled_score = sum(k in text for k in stalled_keywords)

    if done_score > 0:
        return "DONE", min(90, 60 + done_score * 10)

    if progress_score > 0:
        return "IN_PROGRESS", min(80, 50 + progress_score * 10)

    if deadline_passed:
        return "OVERDUE", 70

    if stalled_score > 0:
        return "OVERDUE", 60

    return "NO_DATA", 30


# -------------------------------
# 🔍 AUDIT MISSION
# -------------------------------
def audit_mission(mission):
    print(f"🔍 Auditing #{mission.get('point_no')}: {mission.get('title')}")

    deadline_date = datetime.strptime(
        mission['start_date'], "%Y-%m-%d"
    ) + timedelta(days=mission['deadline_days'])

    search_data = search_web(mission['search_query'])

    combined_text = ""

    for r in search_data:
        raw = r["content"]
        extracted = extract_relevant_text(raw)

        if len(extracted) < 200:
            extracted = spacy_extract(raw)
       
        combined_text += extracted + " "

    combined_text = combined_text[:2000]

    deadline_passed = datetime.now() > deadline_date

    status, confidence = classify_status(combined_text, deadline_passed)

    return {
        "status": status,
        "reason": "Auto-classified from extracted public data",
        "source": search_data[0]["link"] if search_data else "#",
        "confidence": confidence
    }


# -------------------------------
# 🚀 RUN FULL AUDIT
# -------------------------------
def run_full_audit():
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)

    with open(MISSION_JSON, 'r') as f:
        missions = json.load(f)

    results = []

    def process(m):
        try:
            audit = audit_mission(m)

            return {
                "point_no": m.get("point_no"),
                "title": m.get("title"),
                "audit_data": audit,
                "checked_at": datetime.now().isoformat()
            }

        except Exception as e:
            print(f"Error: {e}")

            return {
                "point_no": m.get("point_no"),
                "title": m.get("title"),
                "audit_data": {
                    "status": "ERROR",
                    "reason": str(e),
                    "source": "#",
                    "confidence": 0
                },
                "checked_at": datetime.now().isoformat()
            }

    # ⚡ Parallel workers
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(process, m) for m in missions]

        for future in as_completed(futures):
            results.append(future.result())

    with open(OUTPUT_JSON, 'w') as f:
        json.dump(results, f, indent=4)

    print(f"✅ Written: {OUTPUT_JSON}")


# -------------------------------
# 📦 ARCHIVE
# -------------------------------
def archive_results():
    os.makedirs(HISTORY_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    dest = os.path.join(HISTORY_DIR, f"audit_{timestamp}.json")

    shutil.copy(OUTPUT_JSON, dest)
    print(f"📦 Archived: {dest}")


# -------------------------------
# ▶️ MAIN
# -------------------------------
if __name__ == "__main__":
    run_full_audit()
    archive_results()