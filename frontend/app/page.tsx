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
  Database,
  Search,
  ArrowUpDown
} from 'lucide-react';
import { parseAuditData } from './utils/parser';
import jsPDF from 'jspdf';

interface AuditResult {
  point_no: number;
  title: string;
  audit_data: Record<string, any> | string;
  checked_at: string;
}

export default function GovAuditDashboard() {
  const [data, setData] = useState<AuditResult[]>([]);
  const [historyFiles, setHistoryFiles] = useState<string[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState<string>("LIVE");
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DONE' | 'OVERDUE' | 'IN_PROGRESS' | 'NO_DATA'>('ALL');
  const [sortKey, setSortKey] = useState<'point_no' | 'confidence' | 'status'>('point_no');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const statusFilters = [
    { key: 'ALL', label: 'All' },
    { key: 'DONE', label: 'Done' },
    { key: 'OVERDUE', label: 'Overdue' },
    { key: 'IN_PROGRESS', label: 'In progress' },
    { key: 'NO_DATA', label: 'No data' },
  ] as const;

  const filteredData = data
    .filter((item) => {
      const { status } = parseAuditData(item.audit_data);
      const search = `${item.title} ${item.point_no}`.toLowerCase();
      const matchesSearch = searchText.trim() === '' || search.includes(searchText.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .slice()
    .sort((a, b) => {
      if (sortKey === 'confidence') {
        const aConfidence = parseAuditData(a.audit_data).confidence || 0;
        const bConfidence = parseAuditData(b.audit_data).confidence || 0;
        return bConfidence - aConfidence;
      }

      if (sortKey === 'status') {
        const order = ['OVERDUE', 'IN_PROGRESS', 'NO_DATA', 'DONE'];
        return order.indexOf(parseAuditData(a.audit_data).status) - order.indexOf(parseAuditData(b.audit_data).status);
      }

      return a.point_no - b.point_no;
    });

  const visibleCount = filteredData.length;
  const visibleDoneCount = filteredData.filter((m) => parseAuditData(m.audit_data).status === 'DONE').length;
  const visibleOverdueCount = filteredData.filter((m) => parseAuditData(m.audit_data).status === 'OVERDUE').length;
  const visibleSuccessRate = visibleCount > 0 ? (visibleDoneCount / visibleCount) * 100 : 0;

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

        {/* Search, Filters, and History */}
        <section className="mb-12">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_auto] items-end">
            <div className="grid gap-4">
              <div className="relative">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search mission title, number or keyword..."
                  className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-14 pr-4 text-sm text-white outline-none transition focus:border-[#f59e0b] focus:bg-white/10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] transition ${statusFilter === filter.key ? 'bg-[#f59e0b] text-black border-[#f59e0b]' : 'border border-white/10 text-white/50 hover:border-white/30 hover:text-white'}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60">
                  Showing {visibleCount} of {data.length} missions
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60">
                  Sorted by {sortKey.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:justify-end">
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  onClick={fetchData}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f59e0b] px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-black transition hover:bg-white"
                >
                  <RefreshCw size={14} /> Refresh Live
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setSearchText('');
                    setCurrentSnapshot('LIVE');
                    fetchData();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white transition hover:border-[#f59e0b]"
                >
                  Live Monitor
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">History snapshots</span>
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-white">{historyFiles.length}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {historyFiles.slice(0, 6).map((file) => (
                    <button
                      key={file}
                      onClick={() => loadSnapshot(file)}
                      className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition ${currentSnapshot === file ? 'bg-white text-black' : 'border border-white/10 text-white/50 hover:border-white/30'}`}
                    >
                      {file.replace('audit_', '').replace('.json', '').replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/50 p-4">
                <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-white/40">Sort results</label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as 'point_no' | 'confidence' | 'status')}
                  className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none transition focus:border-[#f59e0b]"
                >
                  <option value="point_no">Mission ID</option>
                  <option value="confidence">Confidence</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Analytics Grid */}
        <section className="grid grid-cols-1 gap-4 mb-20 md:grid-cols-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_32px_120px_rgba(0,0,0,0.25)]">
            <p className="text-[11px] font-black uppercase text-[#f59e0b] mb-4 flex items-center gap-2">
              <Activity size={14} /> Audit Confidence
            </p>
            <div className="text-6xl font-black text-white tabular-nums tracking-tighter">{Math.round(visibleSuccessRate)}%</div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#f59e0b] transition-all" style={{ width: `${Math.round(visibleSuccessRate)}%` }} />
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_32px_120px_rgba(0,0,0,0.25)]">
            <p className="text-[11px] font-black uppercase text-[#10b981] mb-4">Visible Missions</p>
            <div className="text-6xl font-black text-white tabular-nums tracking-tighter">{visibleCount}</div>
            <p className="mt-3 text-sm text-white/50">Showing filtered results from {data.length} total.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_32px_120px_rgba(0,0,0,0.25)]">
            <p className="text-[11px] font-black uppercase text-[#38bdf8] mb-4">Verified Done</p>
            <div className="text-6xl font-black text-white tabular-nums tracking-tighter">{visibleDoneCount}</div>
            <p className="mt-3 text-sm text-white/50">Confirmed mission progress in current viewport.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_32px_120px_rgba(0,0,0,0.25)]">
            <p className="text-[11px] font-black uppercase text-[#ef4444] mb-4">At Risk Alerts</p>
            <div className="text-6xl font-black text-white tabular-nums tracking-tighter">{visibleOverdueCount}</div>
            <p className="mt-3 text-sm text-white/50">High-priority issues needing fresh verification.</p>
          </div>
        </section>

        {/* The Ledger */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3 relative">
          {loading && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center text-[#f59e0b] font-black uppercase tracking-widest text-xs">Reloading Ledger...</div>}
          {filteredData.map((item) => {
            const { status, reason, source, confidence } = parseAuditData(item.audit_data);
            const isExpanded = expandedId === item.point_no;
            const barColor = status === 'DONE' ? 'bg-emerald-500' : status === 'OVERDUE' ? 'bg-red-500' : 'bg-amber-400';

            return (
              <div key={item.point_no} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-[#f59e0b] hover:bg-slate-900/95">
                <div className="pointer-events-none absolute -right-14 top-4 h-40 w-40 rounded-full bg-[#f59e0b]/10 blur-3xl" />
                <div className="flex items-center justify-between gap-4 mb-5">
                  <span className="text-[11px] font-bold text-white/30 tracking-widest">#{item.point_no.toString().padStart(3, '0')}</span>
                  <div className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] ${status === 'DONE' ? 'bg-[#10b981] text-black' : status === 'OVERDUE' ? 'bg-[#ef4444] text-white' : 'bg-[#f59e0b] text-black'}`}>
                    {status}
                  </div>
                </div>

                <h3 className="font-black text-2xl mb-4 leading-tight text-white uppercase tracking-tight group-hover:text-[#f59e0b] transition-colors">{item.title}</h3>
                <p className={`text-[#cbd5e1] text-sm leading-relaxed mb-6 font-medium italic ${isExpanded ? '' : 'line-clamp-4'}`}>"{reason}"</p>

                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Confidence index</div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${confidence}%` }} />
                    </div>
                    <div className="text-[11px] text-white/50">{confidence}% reliable</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Last checked</div>
                    <div className="text-sm font-semibold text-white">{new Date(item.checked_at).toLocaleDateString()}</div>
                    <div className="text-[11px] text-white/50">Snapshot: {currentSnapshot === 'LIVE' ? 'Live' : 'History'}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <a href={source} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-[0.3em] text-white transition hover:text-[#f59e0b] flex items-center gap-2">
                    Source ⇾ <ExternalLink size={12} />
                  </a>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.point_no)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white transition hover:border-[#f59e0b] hover:text-[#f59e0b]"
                  >
                    {isExpanded ? 'Collapse' : 'Inspect'}
                  </button>
                </div>
              </div>
            );
          })}
          {filteredData.length === 0 && (
            <div className="col-span-full rounded-[2rem] border border-white/10 bg-slate-950/80 p-16 text-center text-white/60">
              No missions match this filter. Adjust the search or status chips to reveal more audit entries.
            </div>
          )}
        </section>
      </main>
      
      <footer className="px-8 py-20 border-t border-white/5 mt-20 opacity-30 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Independent Audit System // 2026</p>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-2"><Database size={12}/> Data Source: Local FS + Serper OSINT</p>
      </footer>
    </div>
  );
}