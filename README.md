# 🏛️ GovAudit NP: 100-Point Reform Tracker

**GovAudit NP** is an autonomous auditing engine designed to monitor and verify the execution of government reform agendas in Nepal. By combining **OSINT (Open Source Intelligence)** data gathering with **LLM-based policy analysis**, the system provides a real-time accountability dashboard for citizens and journalists.

---

## 🚀 The Mission
Tracking political promises manually is tedious and prone to bias. This project automates the "Proof of Work" by:
1.  **Scanning** news portals and government bulletins.
2.  **Verifying** status using Google Gemini's reasoning capabilities.
3.  **Visualizing** the findings in a clean, high-performance dashboard.

## 🛠️ Tech Stack

### **Frontend (The Dashboard)**
- **Next.js 14** (App Router)
- **Tailwind CSS** (System Audit UI)
- **Lucide React** (Dynamic Status Icons)
- **jsPDF & html2canvas** (Professional Report Export)

### **Backend (The Auditor)**
- **Python 3.10+**
- **Google Gemini 1.5 Pro** (Reasoning Engine)
- **Autonomous Scraping Logic** (Custom OSINT implementation)
- **JSON Database** (Real-time persistence)

## 📊 Features
- **Live Sync:** Dashboard updates automatically as the Python engine verifies points.
- **Success Rate Analytics:** Dynamic calculation of "Done" vs "Scanned" targets.
- **Evidence-First:** Every audit point includes a direct link to the source or news article.
- **PDF Generation:** One-click export for generating physical accountability reports.
- **Snapshot Archiving:** Automatically saves history logs of every completed audit run.

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Gemini API Key (from Google AI Studio)

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Create a .env file and add:
# GEMINI_API_KEY=your_key_here
python auditor.py