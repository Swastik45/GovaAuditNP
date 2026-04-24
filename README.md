
# 🏛️ GovAudit NP: 100-Point Reform Tracker

**GovAudit NP** is an autonomous auditing engine designed to monitor and verify the execution of government reform agendas in Nepal. By combining **OSINT (Open Source Intelligence)** data gathering with **LLM-based policy analysis**, the system provides a real-time accountability dashboard for tracking the 100-point reform agenda.

---

## 🚀 The Mission

Tracking political promises manually is tedious and prone to bias. This project automates the "Proof of Work" by:

1. **Scanning:** A Python engine scrapes news portals and official bulletins using web search APIs.
2. **Verifying:** Uses Groq's LLM to audit findings against specific reform points.
3. **Visualizing:** A Next.js dashboard provides live stats and professional PDF report generation.

## 🛠️ Tech Stack

### **Frontend (The Dashboard)**
- **Next.js 14** (App Router with TypeScript)
- **Tailwind CSS** (Modern UI styling)
- **Lucide React** (Status icons)
- **jsPDF & html2canvas** (PDF export functionality)
- **dom-to-image-more** (Enhanced image generation)

### **Backend (The Auditor)**
- **Python 3.10+**
- **Groq API** (LLM for reasoning and analysis)
- **Serper API** (Google search integration)
- **Requests** (HTTP client)
- **python-dotenv** (Environment variable management)
- **JSON** (Data persistence)

## 📊 Key Features

- **Real-time Monitoring:** Dashboard auto-refreshes to show current audit progress
- **Progress Analytics:** Calculates completion rates for each reform point
- **Evidence-Based:** Every audit includes source links for verification
- **PDF Reports:** Generate comprehensive accountability reports
- **Historical Archive:** Automatic snapshots of audit runs with timestamps
- **Deadline Tracking:** Monitors reform deadlines and progress timelines

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Groq API Key (from [Groq Console](https://console.groq.com/))
- Serper API Key (from [Serper](https://serper.dev/))

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install required packages:
   ```bash
   pip install groq requests python-dotenv
   ```

4. Create a `.env` file in the `backend` directory:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   SERPER_API_KEY=your_serper_api_key_here
   ```

5. Run the auditor script:
   ```bash
   python scripts/auditor.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
nepal-gov-audit/
├── README.md
├── backend/
│   ├── .env                    # Environment variables (API keys)
│   ├── .venv/                  # Python virtual environment
│   ├── data/
│   │   └── missions.json       # 100 reform points data
│   └── scripts/
│       └── auditor.py          # Main auditing script
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   └── history/
│   │   │       └── route.ts    # API endpoint for history
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main dashboard page
│   │   └── utils/
│   │       └── parser.ts       # Data parsing utilities
│   ├── public/
│   │   └── data/
│   │       ├── audit_results.json    # Current audit results
│   │       └── history/              # Archived audit snapshots
│   ├── package.json            # Node.js dependencies
│   ├── pnpm-lock.yaml          # Package lock file
│   ├── tsconfig.json           # TypeScript configuration
│   ├── next.config.ts          # Next.js configuration
│   ├── postcss.config.mjs      # PostCSS configuration
│   └── eslint.config.mjs       # ESLint configuration
└── types/
    └── dom-to-image-more.d.ts  # Type definitions
```

## 🚀 Usage

1. **Run the Backend Auditor:** Execute `python scripts/auditor.py` to perform the latest audit scan.

2. **View Dashboard:** Open the frontend at `http://localhost:3000` to see real-time results.

3. **Generate Reports:** Use the dashboard's export feature to create PDF reports.

4. **Review History:** Access previous audit runs through the history API.

## 🤝 Contributing

This is an open-source project for promoting government transparency. Contributions are welcome:

- **Bug Reports:** Open issues for any problems encountered
- **Feature Requests:** Suggest improvements or new functionality
- **Code Contributions:** Fork the repository and submit pull requests
- **Documentation:** Help improve setup guides and documentation

## 📄 License

MIT License - Developed for local governance and technical transparency.

---

**Developed by Swastik Paudel**  
*Bachelor of Computer Applications (BCA) Student | Pokhara University*
```

---

