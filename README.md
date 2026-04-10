
# 🏛️ GovAudit NP: 100-Point Reform Tracker

**GovAudit NP** is an autonomous auditing engine designed to monitor and verify the execution of government reform agendas in Nepal. By combining **OSINT (Open Source Intelligence)** data gathering with **LLM-based policy analysis**, the system provides a real-time accountability dashboard.

---

## 🚀 The Mission
Tracking political promises manually is tedious and prone to bias. This project automates the "Proof of Work" by:
1.  **Scanning:** A Python engine scrapes news portals and official bulletins.
2.  **Verifying:** Uses Google Gemini 1.5 Pro to audit findings against specific reform points.
3.  **Visualizing:** A Next.js 14 dashboard provides live stats and professional PDF report generation.

## 🛠️ Tech Stack

### **Frontend (The Dashboard)**
- **Next.js 14** (App Router)
- **Tailwind CSS** (System Audit UI)
- **Lucide React** (Dynamic Status Icons)
- **jsPDF & html2canvas** (Report Export Logic)

### **Backend (The Auditor)**
- **Python 3.10+**
- **Google Gemini 1.5 Pro** (Reasoning Engine)
- **Autonomous OSINT Logic** (Custom scraping & search integration)
- **JSON Persistence** (Real-time data stream to frontend)

## 📊 Key Features
- **Live Sync:** The dashboard auto-refreshes to reflect the Python script's current progress.
- **Success Rate Analytics:** Dynamic math calculating "Done" vs "Scanned" targets.
- **Evidence-First:** Every audit card includes a direct link to the source for verification.
- **PDF Export:** Generate high-quality accountability reports with a single click.
- **Archive System:** Automatically saves history snapshots of every completed audit run.

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Gemini API Key (from Google AI Studio)

### 2. Backend Setup
```bash
# Navigate to backend folder
cd backend
pip install -r requirements.txt

# Create a .env file and add your key:
# GEMINI_API_KEY=your_actual_key_here

python auditor.py
```

### 3. Frontend Setup
```bash
# Navigate to frontend folder
cd frontend
npm install
npm run dev
```

## 📂 Project Structure
```text
├── frontend/               # Next.js Application
│   ├── app/                # Dashboard UI & Logic
│   │   └── utils/          # Data parsing & cleaning
│   ├── public/data/        # Live audit results (JSON)
├── backend/                # Python OSINT Engine
│   ├── auditor.py          # LLM Reasoning & Scraper
│   └── history/            # Archived audit snapshots
├── .gitignore              # Multi-environment safety rules
└── README.md               # You are here
```

## 🤝 Contributing
This is an open-source technical project. If you'd like to improve the search algorithms or the LLM prompt engineering, feel free to fork the repo and submit a PR.

## 📄 License
MIT License - Developed for local governance and technical transparency.

---
**Developed by Swastik Paudel** *Bachelor of Computer Applications (BCA) Student | Pokhara University*
```

---

