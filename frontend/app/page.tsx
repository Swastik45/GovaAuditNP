"use client";

import { useEffect, useState, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Activity,
  FileDown
} from 'lucide-react';
import { parseAuditData } from './utils/parser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AuditResult {
  point_no: number;
  title: string;
  audit_data: string;
  checked_at: string;
}

export default function GovAuditDashboard() {
  const [data, setData] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportAreaRef = useRef<HTMLDivElement>(null); // Dedicated Ref for the PDF area

  const fetchData = async () => {
    try {
      const response = await fetch(`/data/audit_results.json?t=${Date.now()}`);
      if (!response.ok) throw new Error("File not found");
      const json = await response.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error("Audit Sync Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const scannedCount = data.length;
  const doneCount = data.filter(m => parseAuditData(m.audit_data).status === 'DONE').length;
  const overdueCount = data.filter(m => parseAuditData(m.audit_data).status === 'OVERDUE').length;
  const successRate = scannedCount > 0 ? (doneCount / scannedCount) * 100 : 0;

  // --- FIXED PDF EXPORT LOGIC ---
  const handleExportPDF = async () => {
    if (!reportAreaRef.current) return;
    setIsExporting(true);
    
    try {
      // Small timeout to ensure the DOM is idle
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(reportAreaRef.current, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: "#FBFBFE", // Match your page bg
        logging: false,
        removeContainer: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`GovAudit-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Export Failed:", error);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-mono">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 text-xs animate-pulse tracking-[0.2em] uppercase">Initializing Auditor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFE] text-[#0F172A] font-sans selection:bg-red-100 selection:text-red-900">
      
      {/* Navigation Bar - NOT included in PDF */}
      <nav className="border-b bg-white/80 backdrop-blur-xl px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-100">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="font-black tracking-tighter uppercase text-xl italic">GovAudit <span className="text-red-600">NP</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <FileDown size={14} />}
              {isExporting ? "Rendering..." : "Export Report"}
            </button>
            <button onClick={fetchData} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
              <RefreshCw size={18} className="text-slate-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* REFRESHED CONTENT AREA */}
      <main ref={reportAreaRef} className="max-w-7xl mx-auto px-6 py-12 bg-[#FBFBFE]">
        
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live System Audit</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">
            Nepal Reform <br /> <span className="text-slate-300">Accountability.</span>
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
          <div className="lg:col-span-8 bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Activity size={14} className="text-blue-500" /> Success Metrics
                </p>
                <h2 className="text-7xl font-black">{Math.round(successRate)}%</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Scanned</p>
                <p className="text-2xl font-black">{scannedCount}</p>
              </div>
            </div>
            <div className="h-5 w-full bg-slate-100 rounded-2xl p-1">
              <div className="h-full bg-slate-900 rounded-xl transition-all" style={{ width: `${successRate}%` }} />
            </div>
          </div>
          
          <div className="lg:col-span-4 grid grid-cols-1 gap-4">
            <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-lg">
              <h3 className="text-4xl font-black">{doneCount} <span className="text-xs block opacity-70">Verified Done</span></h3>
              <CheckCircle2 size={40} className="opacity-30" />
            </div>
            <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] flex justify-between items-center text-rose-600">
              <h3 className="text-4xl font-black">{overdueCount} <span className="text-xs block text-slate-400">Delayed</span></h3>
              <AlertCircle size={40} className="opacity-20" />
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((item) => {
            const { status, reason, source } = parseAuditData(item.audit_data);
            return (
              <div key={item.point_no} className="bg-white border border-slate-200 rounded-[2rem] p-8 relative flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-[10px] font-mono text-slate-400">#{item.point_no}</span>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                      status === 'DONE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {status}
                    </div>
                  </div>
                  <h3 className="font-bold text-xl mb-4">{item.title}</h3>
                  <p className="text-slate-500 text-sm mb-6">{reason}</p>
                </div>
                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <a href={source} target="_blank" className="text-[10px] font-black uppercase text-red-600 flex items-center gap-1">
                    Evidence <ExternalLink size={12} />
                  </a>
                  <span className="text-[10px] font-bold text-slate-300">
                    {new Date(item.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}