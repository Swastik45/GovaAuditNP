# 🏛️ GovAudit NP: 100-Point Reform Tracker

**GovAudit NP** is a Nepal government reform monitoring tool that uses automated web search analysis and a live dashboard to track progress across a set of reform missions.

The repository includes:
- a Python backend auditor,
- a Next.js dashboard frontend, and
- a history snapshot archive for previous audit runs.

---

## 🚀 What It Does

- Reads reform mission data from `backend/data/missions.json`
- Searches public sources via the Tavily search API
- Extracts relevant text and classifies each mission's status
- Writes results to `frontend/public/data/audit_results.json`
- Archives each run to `frontend/public/data/history/`
- Displays current status, filters, sorting, and PDF export in the dashboard

## 🛠️ Tech Stack

### Backend
- Python 3.10+
- `requests`
- `python-dotenv`
- `trafilatura`
- Optional `spacy` support
- Tavily search API integration

### Frontend
- Next.js 16.2.3
- React 19.2.4
- Tailwind CSS 4
- `lucide-react`
- `jspdf`
- `html2canvas`
- `dom-to-image-more`

## 📊 Key Features

- **Automated audit scanning** for reform mission progress
- **Live dashboard** with search and status filters
- **PDF export** for reports
- **Archived snapshots** for historical audit review
- **Source references** for transparency
- **Status classification** into `DONE`, `IN_PROGRESS`, `OVERDUE`, and `NO_DATA`

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- `pnpm`
- Tavily API key

### Backend Setup

1. Change into the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install requests python-dotenv trafilatura
   ```

4. Create a `.env` file in `backend/` with your API key:
   ```env
   TAVILY_API_KEY=your_tavily_api_key_here
   ```

5. Run the auditor:
   ```bash
   python scripts/auditor.py
   ```

### Frontend Setup

1. Change into the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the frontend server:
   ```bash
   pnpm run dev
   ```

4. Visit:
   ```bash
   http://localhost:3000
   ```

## 📂 Project Structure

```
nepal-gov-audit/
├── README.md
├── backend/
│   ├── .env
│   ├── .venv/
│   ├── data/
│   │   └── missions.json
│   └── scripts/
│       └── auditor.py
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   └── history/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── utils/parser.ts
│   ├── public/
│   │   └── data/
│   │       ├── audit_results.json
│   │       └── history/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   └── eslint.config.mjs
└── types/
    └── dom-to-image-more.d.ts
```

## 🚀 Usage

1. Run `python scripts/auditor.py` in `backend/` to generate the latest audit results.
2. Start the frontend in `frontend/` with `pnpm run dev`.
3. Open the dashboard at `http://localhost:3000`.
4. Export reports using the dashboard export button.
5. Review historical snapshots in `frontend/public/data/history/`.

## 🤝 Contributing

Contributions are welcome.
- Report bugs
- Request new features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License

---

**Developed by Swastik Paudel**
*Bachelor of Computer Applications (BCA) Student | Pokhara University*
