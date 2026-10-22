import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Copy } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SavedReport | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [useLoc, setUseLoc] = useState(false);
  const [loc, setLoc] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync from backend and localStorage on mount
  useEffect(() => {
    let isMounted = true;
    const loadReports = async () => {
      // 1. Load cached local reports
      const local: SavedReport[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );

      try {
        // 2. Fetch backend recorded incidents
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

    // Also persist into backend if possible
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
      // Offline fallback: saved locally
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
    // Optionally fetch full markdown export from backend
    try {
      const exp = await apiService.exportIncidentReport(report.id);
      setView((prev) => (prev ? { ...prev, rawExport: exp.markdown_report } : prev));
    } catch (e) {
      // Standard local report presentation
    }
  };

  const fieldCls =
    'w-full rounded-xl border border-input bg-background/50 p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary placeholder-muted-foreground/60 transition-all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Saved Reports & Evidence
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Save scam evidence and export a clean, tamper-evident report for your bank or police.
          </p>
        </div>
        <button className="btn-primary text-base" onClick={() => setOpen(true)}>
          + Save New Scam Report
        </button>
      </div>

      {/* Empty State */}
      {list.length === 0 && (
        <div className="glass p-12 text-center text-muted-foreground text-base">
          No reports yet. Your saved evidence will appear here.
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-3">
        {list.map((r) => (
          <div
            key={r.id}
            className="glass flex flex-wrap items-center justify-between gap-3 p-5 transition-transform hover:-translate-y-0.5"
          >
            <div>
              <div className="text-lg font-bold text-foreground">
                {r.title || 'Untitled Report'}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{r.date}</span>
                <span>·</span>
                <span className="font-mono text-safe">🔏 Seal {r.seal}</span>
                {r.lost && (
                  <>
                    <span>·</span>
                    <span className="text-danger font-semibold">{r.lost}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="btn-ghost text-sm"
                onClick={() => handleOpenExportView(r)}
              >
                View & Export Official Report
              </button>
              <button
                className="btn-ghost text-sm text-muted-foreground hover:text-danger"
                onClick={() => persist(list.filter((x) => x.id !== r.id))}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Report Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass max-h-[90vh] w-full max-w-lg space-y-3.5 overflow-auto bg-popover p-6 shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-foreground">New Scam Report</h2>
            <p className="text-xs text-muted-foreground">
              Lock timestamped proof of a scam message to share with authorities or your bank.
            </p>

            <input
              className={fieldCls}
              placeholder="Title (e.g. Fake bank text message)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className={fieldCls}
              rows={3}
              placeholder="What happened? (Describe briefly)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <textarea
              className={fieldCls}
              rows={3}
              placeholder="Paste the scam message, email or link (Proof)"
              value={form.proof}
              onChange={(e) => setForm({ ...form, proof: e.target.value })}
            />
            <input
              className={fieldCls}
              placeholder="Sender phone or email (e.g. +1-800-555-0199)"
              value={form.sender}
              onChange={(e) => setForm({ ...form, sender: e.target.value })}
            />
            <input
              className={fieldCls}
              placeholder="Money lost, if any (e.g. $250)"
              value={form.lost}
              onChange={(e) => setForm({ ...form, lost: e.target.value })}
            />

            <label className="flex items-center gap-3 text-sm cursor-pointer select-none text-foreground pt-1">
              <input
                type="checkbox"
                className="h-5 w-5 rounded accent-primary cursor-pointer"
                checked={useLoc}
                onChange={(e) => toggleLocation(e.target.checked)}
              />
              <span>Attach Location for Police Context</span>
              {loc && <span className="text-xs text-safe font-mono">({loc})</span>}
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary text-sm flex items-center gap-1.5"
                disabled={loading || (!form.title.trim() && !form.proof.trim())}
                onClick={handleSave}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Report</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Report View Modal */}
      {view && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setView(null)}
        >
          <div
            className="glass max-h-[90vh] w-full max-w-2xl space-y-4 overflow-auto bg-popover p-6 sm:p-8 shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-2xl font-bold text-foreground">
                Official Scam Incident Report
              </h2>
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-secondary text-safe border border-border">
                🔏 SEAL {view.seal}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {[
                ['Title', view.title],
                ['Date Recorded', view.date],
                ['What Happened', view.description],
                ['Message Proof', view.proof],
                ['Sender Information', view.sender],
                ['Money Lost', view.lost],
                ['Location Attached', view.location || 'Not attached'],
                ['Digital Seal (SHA-256 Digest)', view.seal],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-border/50 py-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {k}
                  </div>
                  <div className="whitespace-pre-wrap text-foreground font-medium mt-0.5">
                    {v || '—'}
                  </div>
                </div>
              ))}
            </div>

            {view.rawExport && (
              <details className="p-3 rounded-xl bg-background/50 border border-border text-xs">
                <summary className="cursor-pointer font-bold text-muted-foreground">
                  View Full Police/Bank Dispute Docket Text
                </summary>
                <pre className="mt-2 font-mono whitespace-pre-wrap text-foreground leading-relaxed overflow-x-auto">
                  {view.rawExport}
                </pre>
              </details>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
              <button
                className="btn-ghost text-sm flex items-center gap-1.5"
                onClick={() => {
                  const reportSummary = `OFFICIAL SCAM REPORT\nTitle: ${view.title}\nDate: ${view.date}\nProof: ${view.proof}\nSender: ${view.sender}\nSeal: ${view.seal}`;
                  navigator.clipboard.writeText(view.rawExport || reportSummary);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-safe" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Report Text'}</span>
              </button>

              <div className="flex gap-2">
                <button className="btn-ghost text-sm" onClick={() => setView(null)}>
                  Close
                </button>
                <button
                  className="btn-primary text-sm flex items-center gap-1.5"
                  onClick={() => window.print()}
                >
                  <span>🖨️ Print / Save PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
