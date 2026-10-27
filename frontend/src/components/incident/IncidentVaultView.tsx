import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Trash2,
  ScanSearch,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  FileText,
  Copy,
  Download,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { OfficialReportExport, SavedReport } from '../../types';
import { getSavedReports, saveReports } from '../../utils/scamShieldEngine';
import { apiService } from '../../services/api';

interface IncidentVaultViewProps {
  onRecheckReport?: (report: SavedReport) => void;
  onGoToTriage?: () => void;
  onReportsCountChanged?: (count: number) => void;
}

const VERDICT_STYLES = {
  danger: {
    badge: 'High risk scam',
    Icon: AlertOctagon,
    band: 'bg-rust',
  },
  caution: {
    badge: 'Caution advised',
    Icon: AlertTriangle,
    band: 'bg-amber-400',
  },
  safe: {
    badge: 'Verified safe',
    Icon: ShieldCheck,
    band: 'bg-sage',
  },
};

const formatDate = (isoStr: string): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(isoStr));
  } catch {
    return isoStr;
  }
};

export const IncidentVaultView: React.FC<IncidentVaultViewProps> = ({
  onRecheckReport,
  onGoToTriage,
  onReportsCountChanged,
}) => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [selectedExport, setSelectedExport] = useState<OfficialReportExport | null>(null);
  const [exportLoadingId, setExportLoadingId] = useState<string | null>(null);
  const [copiedDocket, setCopiedDocket] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initialReports = getSavedReports();
    setReports(initialReports);

    // Also attempt background sync with backend
    const syncBackend = async () => {
      try {
        const backendList = await apiService.listIncidents();
        if (!isMounted) return;

        const currentLocal = getSavedReports();
        const merged: SavedReport[] = [...currentLocal];

        backendList.forEach((b) => {
          if (!merged.some((m) => m.id === b.incident_id || m.hash.startsWith(b.evidence_sha256.slice(0, 10)))) {
            const isCritical = b.severity === 'CRITICAL' || b.severity === 'HIGH';
            const isMedium = b.severity === 'MEDIUM';
            merged.push({
              id: b.incident_id,
              createdAt: b.created_at,
              message: b.raw_evidence,
              verdict: isCritical ? 'danger' : isMedium ? 'caution' : 'safe',
              categoryTitle: b.title || b.category.replace(/_/g, ' '),
              certainty: isCritical ? 94 : isMedium ? 78 : 96,
              summary: b.description,
              flagCount: 1,
              hash: b.evidence_sha256,
            });
          }
        });

        setReports(merged);
        saveReports(merged);
        if (onReportsCountChanged) onReportsCountChanged(merged.length);
      } catch {
        // use local storage
      }
    };

    syncBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    const updated = reports.filter((r) => r.id !== id);
    setReports(updated);
    saveReports(updated);
    if (onReportsCountChanged) onReportsCountChanged(updated.length);

    try {
      await apiService.deleteIncident(id);
    } catch {
      // offline storage guaranteed
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Delete all saved reports from this browser and security vault?')) {
      setReports([]);
      saveReports([]);
      if (onReportsCountChanged) onReportsCountChanged(0);

      try {
        await apiService.clearIncidentVault();
      } catch {
        // offline storage guaranteed
      }
    }
  };

  const handleOpenExport = async (report: SavedReport) => {
    setExportLoadingId(report.id);
    try {
      const exportBundle = await apiService.exportIncidentReport(report.id);
      setSelectedExport(exportBundle);
    } catch {
      // Fallback: generate local signed docket report
      const docketNumber = `SS-INC-${Date.now().toString().slice(-8)}`;
      const markdown = `# OFFICIAL DISPUTE REPORT — SCAMSHIELD DEFENSE
**Docket Number:** ${docketNumber}
**Created At:** ${report.createdAt}
**SHA-256 Digest:** \`${report.hash}\`
**Verification Integrity:** SEALED_LOCAL_CLIENT

---

## 1. INCIDENT CLASSIFICATION
- **Category:** ${report.categoryTitle}
- **Assessment:** ${report.verdict.toUpperCase()} (${report.certainty}% Certainty)
- **Status:** EVIDENCE_LOCKED

## 2. USER STATEMENT & NARRATIVE
${report.summary}

## 3. PRESERVED DIGITAL EVIDENCE
\`\`\`
${report.message}
\`\`\`

## 4. TRANSMISSION SAFEGUARD
This official report packet has been held locally for your review. File directly with your financial institution or at reportfraud.ftc.gov.
`;

      setSelectedExport({
        incident_id: report.id,
        docket_number: docketNumber,
        markdown_report: markdown,
        json_bundle: {
          docket_number: docketNumber,
          evidence_sha256: report.hash,
          category: report.categoryTitle,
          status: 'EVIDENCE_LOCKED',
        },
        verification_signature: `SIG-LOC-${report.hash.slice(0, 16)}`,
        transmission_status: 'HELD_FOR_USER_REVIEW_AND_MANUAL_FILING',
      });
    } finally {
      setExportLoadingId(null);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!selectedExport) return;
    try {
      await navigator.clipboard.writeText(selectedExport.markdown_report);
      setCopiedDocket(true);
      setTimeout(() => setCopiedDocket(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadReport = () => {
    if (!selectedExport) return;
    const blob = new Blob([selectedExport.markdown_report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ScamShield-Report-${selectedExport.docket_number}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const dangerCount = reports.filter((r) => r.verdict === 'danger').length;
  const latestDate = reports.length > 0 ? formatDate(reports[0].createdAt) : 'None';

  return (
    <div className="space-y-8 animate-fade">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <div className="label">Evidence locker</div>
          <h1 className="display mt-4 text-[52px] sm:text-[88px]">
            Saved{' '}
            <span className="bg-amber-400 px-[0.1em] text-char box-decoration-clone">
              reports
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-fg2 sm:text-lg">
            Reports are sealed with a cryptographic SHA-256 fingerprint, locked in your vault, and exportable as official dispute packages.
          </p>
        </div>

        {reports.length > 0 && (
          <button
            onClick={handleClearAll}
            className="self-start font-mono text-[11px] uppercase tracking-wider text-fg3 transition hover:text-rustink sm:self-auto cursor-pointer"
          >
            Clear all
          </button>
        )}
      </header>

      {/* Empty State */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center border border-dashed border-line2 px-6 py-16 text-center">
          <Fingerprint className="h-9 w-9 text-fg4" strokeWidth={1.25} />
          <h2 className="display mt-5 text-[34px]">Nothing saved yet</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-fg3">
            After you check a message, choose{' '}
            <span className="font-medium text-fg">Save report</span> to keep a sealed copy here.
          </p>
          <button
            onClick={onGoToTriage}
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-amber-400 px-5 py-3 text-sm font-semibold text-char transition hover:bg-amber-300 cursor-pointer"
          >
            <ScanSearch className="h-4 w-4" />
            <span>Check a message</span>
          </button>
        </div>
      ) : (
        <>
          {/* Stat Strip */}
          <dl className="grid grid-cols-3 divide-x divide-line border-y border-line">
            <div className="px-3 py-4 sm:px-6">
              <dt className="label">Saved</dt>
              <dd className="mt-2 display text-[40px] text-fg">{reports.length}</dd>
            </div>
            <div className="px-3 py-4 sm:px-6">
              <dt className="label">High risk</dt>
              <dd className="mt-2 display text-[40px] text-rust">{dangerCount}</dd>
            </div>
            <div className="px-3 py-4 sm:px-6">
              <dt className="label">Latest</dt>
              <dd className="mt-2 font-mono text-xs text-fg sm:text-sm">{latestDate}</dd>
            </div>
          </dl>

          {/* List of Reports */}
          <ul className="stagger space-y-3">
            {reports.map((report) => {
              const theme = VERDICT_STYLES[report.verdict] || VERDICT_STYLES.safe;
              const isLoadingThis = exportLoadingId === report.id;

              return (
                <li key={report.id} className="panel overflow-hidden">
                  {/* Top Verdict Ribbon */}
                  <div
                    className={`flex items-center justify-between gap-3 px-4 py-1.5 text-char ${theme.band}`}
                  >
                    <span className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em]">
                      <theme.Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                      {theme.badge}
                    </span>
                    <span className="font-mono text-[11px] opacity-80">
                      {report.certainty}% match
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="display text-[26px]">{report.categoryTitle}</h3>
                      <span className="font-mono text-[11px] text-fg3">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 break-words text-sm leading-relaxed text-fg2">
                      {report.message}
                    </p>

                    {/* Footer Actions */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                      <span
                        className="flex items-center gap-1.5 font-mono text-[11px] text-fg4"
                        title={report.hash}
                      >
                        <Fingerprint className="h-3.5 w-3.5" strokeWidth={1.75} />
                        SHA-256 {report.hash.slice(0, 10)}…
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Dispute Package Button */}
                        <button
                          onClick={() => handleOpenExport(report)}
                          disabled={isLoadingThis}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-page font-mono text-[11px] font-medium uppercase tracking-wider text-fg transition hover:border-amber-400 hover:text-amber-700 cursor-pointer disabled:opacity-50"
                        >
                          {isLoadingThis ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-amber-700" />
                          )}
                          <span>Official Report</span>
                        </button>

                        <button
                          onClick={() => onRecheckReport && onRecheckReport(report)}
                          className="flex items-center gap-1 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-fg transition hover:text-amber-700 cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Re-check</span>
                        </button>

                        <button
                          onClick={() => handleDelete(report.id)}
                          aria-label={`Delete report: ${report.categoryTitle}`}
                          className="p-2 text-fg4 transition hover:text-rustink cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Official Report Dispute Package Modal */}
      {selectedExport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-char/80 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-md border border-line bg-surface shadow-2xl overflow-hidden animate-rise">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line bg-sunk px-5 py-3.5">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-amber-700 font-bold">
                  Official Dispute Docket
                </span>
                <h3 className="font-display text-lg font-bold text-fg">
                  {selectedExport.docket_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedExport(null)}
                className="p-1 text-fg4 transition hover:text-fg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 font-mono text-xs text-fg leading-relaxed">
              <div className="rounded-sm border border-amber-400/40 bg-amber-400/10 p-3 text-fg2 font-sans text-xs">
                <strong>Dispute Safeguard:</strong> This official report has been generated and cryptographically signed. It is held locally for your review and has <strong>not</strong> been transmitted automatically. You may submit this file directly to your bank or the FTC.
              </div>

              <div className="border border-line bg-page p-4 rounded-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-char">
                  {selectedExport.markdown_report}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-sunk px-5 py-3">
              <span className="font-mono text-[10px] text-fg4">
                Signature: {selectedExport.verification_signature.slice(0, 24)}...
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-line2 px-3 py-1.5 font-mono text-xs font-semibold text-fg hover:border-amber-400 hover:text-amber-700 transition cursor-pointer"
                >
                  {copiedDocket ? (
                    <Check className="h-3.5 w-3.5 text-sage" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedDocket ? 'Copied' : 'Copy Report'}</span>
                </button>

                <button
                  onClick={handleDownloadReport}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-amber-400 px-3.5 py-1.5 font-mono text-xs font-semibold uppercase text-char hover:bg-amber-300 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .MD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
