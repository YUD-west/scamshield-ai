import React, { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  FileText,
  Printer,
  MapPin,
  Lock,
  Search,
  Hash,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { IncidentRecord } from '../../types';

interface SavedReport {
  id: string;
  title: string;
  description: string;
  proof: string;
  sender: string;
  lost: string;
  location?: string | undefined;
  date: string;
  seal: string;
  rawExport?: string;
}

const STORAGE_KEY = 'scamshield-reports';

async function calculateSeal(data: Record<string, any>) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(data))
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
    .toUpperCase();
}

const emptyForm = {
  title: '',
  description: '',
  proof: '',
  sender: '',
  lost: '',
};

export const IncidentVaultView: React.FC = () => {
  const [list, setList] = useState<SavedReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SavedReport | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [useLoc, setUseLoc] = useState(false);
  const [loc, setLoc] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadReports = async () => {
      const local: SavedReport[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );

      try {
        const backendList: IncidentRecord[] = await apiService.listIncidents();
        const merged: SavedReport[] = [...local];

        backendList.forEach((b) => {
          if (!merged.some((m) => m.id === b.incident_id)) {
            merged.push({
              id: b.incident_id,
              title: b.title,
              description: b.description,
              proof: b.raw_evidence,
              sender: b.sender_information || '',
              lost: b.financial_loss_amount ? `$${b.financial_loss_amount.toFixed(2)}` : '',
              location:
                b.consent_location?.user_consent_granted
                  ? `${b.consent_location.latitude.toFixed(4)}, ${b.consent_location.longitude.toFixed(4)}`
                  : undefined,
              date: new Date(b.created_at).toLocaleString(),
              seal: b.evidence_sha256.slice(0, 16).toUpperCase(),
            });
          }
        });

        if (isMounted) {
          setList(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      } catch (err) {
        if (isMounted) setList(local);
      }
    };

    loadReports();
    return () => {
      isMounted = false;
    };
  }, []);

  const persist = (items: SavedReport[]) => {
    setList(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const toggleLocation = (enabled: boolean) => {
    setUseLoc(enabled);
    if (enabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLoc(`${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`),
        () => setUseLoc(false)
      );
    } else {
      setLoc(undefined);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() && !form.proof.trim()) return;
    setLoading(true);

    const baseData = {
      ...form,
      id: crypto.randomUUID(),
      date: new Date().toLocaleString(),
      location: useLoc ? loc : undefined,
    };

    const sealCode = await calculateSeal(baseData);
    const newReport: SavedReport = {
      ...baseData,
      seal: sealCode,
    };

    try {
      await apiService.recordIncident({
        title: form.title.trim() || 'Untitled Scam Report',
        category: 'PHISHING',
        severity: 'HIGH',
        description: form.description.trim() || 'Suspicious scam message encountered.',
        raw_evidence: form.proof.trim() || form.title.trim(),
        sender_information: form.sender.trim() || undefined,
        financial_loss_amount: form.lost ? parseFloat(form.lost.replace(/[^0-9.]/g, '')) : undefined,
      });
    } catch (e) {
      // Handled locally
    }

    persist([newReport, ...list]);
    setForm(emptyForm);
    setUseLoc(false);
    setLoc(undefined);
    setOpen(false);
    setLoading(false);
  };

  const handleOpenExportView = async (report: SavedReport) => {
    setView(report);
    try {
      const exp = await apiService.exportIncidentReport(report.id);
      setView((prev) => (prev ? { ...prev, rawExport: exp.markdown_report } : prev));
    } catch (e) {
      // Keep report
    }
  };

  const filteredList = list.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.seal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLoss = list.reduce((acc, r) => {
    const num = parseFloat(r.lost.replace(/[^0-9.]/g, '')) || 0;
    return acc + num;
  }, 0);

  const fieldCls =
    'w-full rounded-2xl border border-input bg-black/40 p-3.5 text-sm sm:text-base text-foreground outline-none focus:ring-2 focus:ring-safe placeholder-muted-foreground/50 transition-all';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Card */}
      <section className="text-center pt-2 pb-6 max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 border border-border px-4 py-1.5 text-xs font-semibold shadow-sm">
          <Lock className="w-3.5 h-3.5 text-safe" />
          <span className="text-foreground">Cryptographic Evidence Vault</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display">
          Saved Reports &{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-teal-300 bg-clip-text text-transparent">
            Evidence
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed">
          Lock in untampered proof of scams, fraudulent charges, or threats. Export official reports with cryptographic SHA-256 seals ready for your bank or police department.
        </p>
      </section>

      {/* Control Bar: Search + Stats + New Button */}
      <div className="glass p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl border border-border/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved reports by title, sender, or seal..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-black/40 text-sm text-foreground placeholder-muted-foreground/50 outline-none focus:ring-2 focus:ring-safe"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end">
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground pr-2">
            <span>
              <b className="text-white text-sm">{list.length}</b> Reports
            </span>
            <span>&bull;</span>
            <span>
              Total Loss: <b className="text-danger text-sm">${totalLoss.toFixed(2)}</b>
            </span>
          </div>

          <button
            className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2 shadow-md shadow-safe/25 shrink-0"
            onClick={() => setOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Save New Scam Report</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredList.length === 0 && (
        <div className="glass p-16 text-center text-muted-foreground space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-secondary/50 border border-border flex items-center justify-center text-3xl mx-auto">
            📁
          </div>
          <h3 className="text-lg font-bold text-white font-display">
            {list.length === 0 ? 'No Reports Saved Yet' : 'No Matching Reports Found'}
          </h3>
          <p className="text-sm max-w-md mx-auto leading-relaxed">
            {list.length === 0
              ? 'Whenever you encounter a suspicious message, phone call, or website, click "Save New Scam Report" above to preserve proof.'
              : 'Try searching with a different keyword or clear your search query.'}
          </p>
        </div>
      )}

      {/* Flexible Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredList.map((r) => (
          <div
            key={r.id}
            className="glass p-6 space-y-4 card-interactive flex flex-col justify-between border border-border/80 shadow-lg relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-secondary text-safe border border-border font-bold flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  SEAL {r.seal}
                </span>
                <span className="text-xs text-muted-foreground">{r.date.split(',')[0]}</span>
              </div>

              <h2 className="text-xl font-bold text-white font-display line-clamp-1">
                {r.title || 'Untitled Scam Report'}
              </h2>

              <p className="text-xs sm:text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                {r.description || r.proof || 'No description provided.'}
              </p>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                {r.sender && (
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 text-muted-foreground border border-border">
                    From: <b className="text-white">{r.sender}</b>
                  </span>
                )}
                {r.lost && (
                  <span className="px-2.5 py-1 rounded-lg bg-danger/15 text-danger font-bold border border-danger/30">
                    Loss: {r.lost}
                  </span>
                )}
                {r.location && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-safe border border-emerald-500/30 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    GPS Attached
                  </span>
                )}
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
              <button
                className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5 flex-1 justify-center"
                onClick={() => handleOpenExportView(r)}
              >
                <FileText className="w-3.5 h-3.5 text-safe" />
                <span>View & Export</span>
              </button>
              <button
                className="btn-ghost text-xs py-2 px-3 text-muted-foreground hover:text-danger hover:border-danger/40"
                onClick={() => persist(list.filter((x) => x.id !== r.id))}
                title="Delete Report"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Report Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass max-h-[92vh] w-full max-w-xl space-y-4 overflow-auto bg-[#0a2416] p-6 sm:p-8 shadow-2xl border border-border rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border/70 pb-3">
              <h2 className="text-2xl font-bold text-white font-display">
                Save New Scam Report
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lock tamper-evident proof to use in bank disputes or law enforcement reports.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Report Title *
                </label>
                <input
                  className={fieldCls}
                  placeholder="e.g. Fake Bank of America alert asking for login"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  What Happened? (Brief description)
                </label>
                <textarea
                  className={fieldCls}
                  rows={2}
                  placeholder="Describe how they contacted you, what they demanded, and if you replied..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Paste the Scam Message or Link (Proof) *
                </label>
                <textarea
                  className={fieldCls}
                  rows={3}
                  placeholder="Paste the raw text message, email headers, or URL here. A cryptographic SHA-256 seal will lock this content."
                  value={form.proof}
                  onChange={(e) => setForm({ ...form, proof: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Sender Phone or Email
                  </label>
                  <input
                    className={fieldCls}
                    placeholder="e.g. +1-800-555-0199"
                    value={form.sender}
                    onChange={(e) => setForm({ ...form, sender: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Money Lost, if any ($ USD)
                  </label>
                  <input
                    className={fieldCls}
                    placeholder="e.g. $250.00"
                    value={form.lost}
                    onChange={(e) => setForm({ ...form, lost: e.target.value })}
                  />
                </div>
              </div>

              {/* Location Toggle */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-border cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded accent-safe cursor-pointer"
                  checked={useLoc}
                  onChange={(e) => toggleLocation(e.target.checked)}
                />
                <div className="text-xs text-foreground leading-relaxed">
                  <span className="font-bold block">Attach My Location for Police Context</span>
                  <span className="text-muted-foreground">
                    Only attach if filing with local authorities. {loc && <b className="text-safe">({loc})</b>}
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border/70">
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary text-sm flex items-center gap-2"
                disabled={loading || (!form.title.trim() && !form.proof.trim())}
                onClick={handleSave}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sealing Evidence...</span>
                  </>
                ) : (
                  <span>Save & Seal Evidence</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Export Modal */}
      {view && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setView(null)}
        >
          <div
            className="glass max-h-[92vh] w-full max-w-2xl space-y-5 overflow-auto bg-[#0a2416] p-6 sm:p-8 shadow-2xl border border-border rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white font-display">
                  Official Scam Dispute Report
                </h2>
                <span className="text-xs text-muted-foreground">
                  Standard format for bank fraud disputes & police reports
                </span>
              </div>
              <span className="font-mono text-xs px-3 py-1 rounded-full bg-secondary text-safe border border-border font-bold">
                🔏 SEAL {view.seal}
              </span>
            </div>

            <div className="space-y-2.5 text-sm">
              {[
                ['Incident Title', view.title],
                ['Timestamp', view.date],
                ['Incident Summary', view.description],
                ['Evidence Payload', view.proof],
                ['Sender Coordinates', view.sender],
                ['Financial Loss', view.lost || 'No financial loss reported'],
                ['GPS Coordinates', view.location || 'Not attached'],
                ['Cryptographic Seal', view.seal],
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-black/30 border border-border/50">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {k}
                  </div>
                  <div className="whitespace-pre-wrap text-foreground font-medium mt-1">
                    {v || '—'}
                  </div>
                </div>
              ))}
            </div>

            {view.rawExport && (
              <details className="p-3.5 rounded-xl bg-black/40 border border-border text-xs">
                <summary className="cursor-pointer font-bold text-muted-foreground">
                  View Full Formatted Legal Dispute Text
                </summary>
                <pre className="mt-2.5 font-mono whitespace-pre-wrap text-foreground leading-relaxed overflow-x-auto">
                  {view.rawExport}
                </pre>
              </details>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/70">
              <button
                className="btn-ghost text-xs sm:text-sm flex items-center gap-1.5"
                onClick={() => {
                  const reportSummary = `OFFICIAL SCAM REPORT\nTitle: ${view.title}\nDate: ${view.date}\nProof: ${view.proof}\nSender: ${view.sender}\nLoss: ${view.lost}\nSeal: ${view.seal}`;
                  navigator.clipboard.writeText(view.rawExport || reportSummary);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-safe" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Report Text'}</span>
              </button>

              <div className="flex gap-2">
                <button className="btn-ghost text-xs sm:text-sm" onClick={() => setView(null)}>
                  Close
                </button>
                <button
                  className="btn-primary text-xs sm:text-sm flex items-center gap-1.5"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
