"use client";

import { useEffect, useState } from 'react';
import { 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Activity,
  FileDown,
  Terminal,
  History,
  Database
} from 'lucide-react';
import { parseAuditData } from './utils/parser';
import jsPDF from 'jspdf';

interface AuditResult {
  point_no: number;
  title: string;
  audit_data: string;
  checked_at: string;
}

export default function GovAuditDashboard() {
  const [data, setData] = useState<AuditResult[]>([]);
  const [historyFiles, setHistoryFiles] = useState<string[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState<string>("LIVE");
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch Live Data
  const fetchData = async () => {
    setLoading(true);
    setCurrentSnapshot("LIVE");
    try {
      const response = await fetch(`/data/audit_results.json?t=${Date.now()}`);
      if (!response.ok) throw new Error("Sync failed");
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch History List (Filenames)
  const fetchHistoryList = async () => {
    try {
      const res = await fetch('/api/history'); // Note: Requires the API route we discussed
      if (res.ok) {
        const files = await res.json();
        setHistoryFiles(files);
      }
    } catch (err) {
      console.error("History listing failed", err);
    }
  };

  // 3. Load a specific historical JSON
  const loadSnapshot = async (fileName: string) => {
    setLoading(true);
    setCurrentSnapshot(fileName);
    try {
      const res = await fetch(`/data/history/${fileName}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load snapshot", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchHistoryList();
    const interval = setInterval(fetchData, 300000); // Auto-refresh live data every 5 mins
    return () => clearInterval(interval);
  }, []);

  // Stats Calculations
  const scannedCount = data.length;
  const doneCount = data.filter(m => parseAuditData(m.audit_data).status === 'DONE').length;
  const overdueCount = data.filter(m => parseAuditData(m.audit_data).status === 'OVERDUE').length;
  const successRate = scannedCount > 0 ? (doneCount / scannedCount) * 100 : 0;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;

      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      pdf.setTextColor(245, 158, 11);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.text("NP REFORM AUDIT", 15, 22);
      
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(9);
      pdf.text(`SNAPSHOT: ${currentSnapshot}`, 15, 30);
      pdf.text(`TIMESTAMP: ${new Date().toLocaleString()}`, 15, 35);
      pdf.text(`TOTAL_SUCCESS_RATE: ${Math.round(successRate)}%`, 15, 40);

      yPos = 55;
      data.forEach((item) => {
        const { status, reason, source } = parseAuditData(item.audit_data);
        if (yPos > 260) { pdf.addPage(); yPos = 20; }
        pdf.setDrawColor(230, 230, 230);
        pdf.line(15, yPos, pageWidth - 15, yPos);
        yPos += 8;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(`${item.point_no.toString().padStart(3, '0')} | ${item.title.toUpperCase()}`, 15, yPos);
        
        const sColor = status === 'DONE' ? [16, 185, 129] : (status === 'OVERDUE' ? [239, 68, 68] : [245, 158, 11]);
        pdf.setFillColor(sColor[0], sColor[1], sColor[2]);
        pdf.rect(pageWidth - 40, yPos - 4, 25, 6, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text(status, pageWidth - 27.5, yPos, { align: 'center' });
        yPos += 8;
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(9);
        const splitText = pdf.splitTextToSize(reason, pageWidth - 40);
        pdf.text(splitText, 15, yPos);
        yPos += (splitText.length * 5) + 5;
        pdf.setTextColor(150, 150, 150);
        pdf.text(`REF: ${source}`, 15, yPos);
        yPos += 10;
      });
      pdf.save(`Audit_${currentSnapshot}_${Date.now()}.pdf`);
    } catch (err) { console.error(err); } finally { setIsExporting(false); }
  };

  if (loading && data.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#f59e0b]" style={{ fontFamily: 'Satoshi, sans-serif' }}>
      <div className="flex flex-col items-center gap-4">
        <Terminal className="animate-pulse" />
        <p className="text-xs font-black tracking-[0.5em] uppercase">Synchronizing Ledger...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e7eb] selection:bg-[#f59e0b] selection:text-black" style={{ fontFamily: 'Satoshi, sans-serif' }}>
      
      <header className="border-b-[1px] border-white/10 bg-black/40 backdrop-blur-xl px-8 py-6 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 text-black">
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-black text-xl tracking-tight uppercase leading-none text-white">GovAudit</h2>
              <span className="text-[9px] text-[#f59e0b] font-bold uppercase tracking-[0.2em]">Node 2026</span>
            </div>
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-[#f59e0b] text-black px-6 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2"
          >
            {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <FileDown size={14} />}
            {isExporting ? "Compiling..." : "Export Report"}
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-16">
        
        <section className="mb-16">
          <div className="inline-block border border-[#f59e0b] px-3 py-1 mb-6">
             <p className="text-[10px] font-black uppercase text-[#f59e0b] tracking-widest">System Active</p>
          </div>
          <h1 className="font-black tracking-[-0.04em] leading-[0.9] uppercase text-white mb-8" style={{ fontSize: 'clamp(3rem, 10vw, 8.5rem)' }}>
            Nepal Reform <br /> <span className="text-white/20">Accountability.</span>
          </h1>
          <p className="text-[#9ca3af] text-lg md:text-2xl max-w-2xl font-medium leading-snug">
            Independent OSINT verification of national reform progress. Monitoring data integrity across 100 missions.
          </p>
        </section>

        {/* History / Snapshot Selector */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4 text-[#f59e0b]">
            <History size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Audit History Ledger</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            <button 
              onClick={fetchData}
              className={`px-4 py-2 text-[10px] font-black uppercase border transition-all shrink-0 ${currentSnapshot === "LIVE" ? "bg-[#f59e0b] text-black border-[#f59e0b]" : "border-white/20 text-white/40 hover:border-white"}`}
            >
              Live Monitor
            </button>
            {historyFiles.map((file) => (
              <button 
                key={file}
                onClick={() => loadSnapshot(file)}
                className={`px-4 py-2 text-[10px] font-black uppercase border transition-all shrink-0 ${currentSnapshot === file ? "bg-white text-black border-white" : "border-white/10 text-white/40 hover:border-white/40"}`}
              >
                {file.replace('audit_', '').replace('.json', '').replace('_', ' ')}
              </button>
            ))}
          </div>
        </section>

        {/* Analytics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-white/5 border border-white/10 mb-20">
          <div className="p-10 bg-black/40">
            <p className="text-[11px] font-black uppercase text-[#f59e0b] mb-4 flex items-center gap-2">
              <Activity size={14} /> System Resolution
            </p>
            <div className="text-8xl font-black text-white tabular-nums tracking-tighter">{Math.round(successRate)}%</div>
          </div>
          <div className="p-10 bg-black/40 border-l border-white/5">
            <p className="text-[11px] font-black uppercase text-[#10b981] mb-4">Verified Done</p>
            <div className="text-8xl font-black text-white tabular-nums tracking-tighter">{doneCount}</div>
          </div>
          <div className="p-10 bg-black/40 border-l border-white/5">
            <p className="text-[11px] font-black uppercase text-[#ef4444] mb-4">Critical Latency</p>
            <div className="text-8xl font-black text-white tabular-nums tracking-tighter">{overdueCount}</div>
          </div>
        </section>

        {/* The Ledger */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative">
          {loading && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center text-[#f59e0b] font-black uppercase tracking-widest text-xs">Reloading Ledger...</div>}
          {data.map((item) => {
            const { status, reason, source } = parseAuditData(item.audit_data);
            return (
              <div key={item.point_no} className="bg-[#111] border-t-2 border-white/10 p-8 hover:bg-[#161616] hover:border-[#f59e0b] transition-all group">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[11px] font-bold text-white/30 tracking-widest">#{item.point_no.toString().padStart(3, '0')}</span>
                  <div className={`text-[10px] font-black px-3 py-1 uppercase tracking-tighter ${
                    status === 'DONE' ? 'bg-[#10b981] text-black' : 
                    status === 'OVERDUE' ? 'bg-[#ef4444] text-white' : 'bg-[#f59e0b] text-black'
                  }`}>{status}</div>
                </div>
                <h3 className="font-black text-2xl mb-4 leading-tight text-white uppercase tracking-tight group-hover:text-[#f59e0b] transition-colors">{item.title}</h3>
                <p className="text-[#888] text-sm leading-relaxed mb-8 font-medium line-clamp-4 italic">"{reason}"</p>
                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <a href={source} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase text-white hover:text-[#f59e0b] flex items-center gap-1 transition-colors">
                    Source Node <ExternalLink size={12} />
                  </a>
                  <span className="text-[10px] font-bold text-white/20 uppercase">ID_{new Date(item.checked_at).getTime().toString().slice(-4)}</span>
                </div>
              </div>
            );
          })}
        </section>
      </main>
      
      <footer className="px-8 py-20 border-t border-white/5 mt-20 opacity-30 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Independent Audit System // 2026</p>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-2"><Database size={12}/> Data Source: Local FS + Serper OSINT</p>
      </footer>
    </div>
  );
}