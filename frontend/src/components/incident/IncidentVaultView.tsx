import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Hash,
  Info,
  Loader2,
  Lock,
  MapPin,
  Plus,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  ConsentLocation,
  IncidentCreateRequest,
  IncidentRecord,
  OfficialReportExport,
  RiskSeverity,
  ThreatCategory,
} from '../../types';
import { apiService } from '../../services/api';
import { SeverityBadge } from '../common/SeverityBadge';

export const IncidentVaultView: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exportData, setExportData] = useState<OfficialReportExport | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ThreatCategory>('PHISHING');
  const [formSeverity, setFormSeverity] = useState<RiskSeverity>('HIGH');
  const [formDescription, setFormDescription] = useState('');
  const [formEvidence, setFormEvidence] = useState('');
  const [formSender, setFormSender] = useState('');
  const [formLoss, setFormLoss] = useState('');

  // Location Consent State
  const [enableLocationConsent, setEnableLocationConsent] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState<ConsentLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fetchVault = async () => {
    setIsLoading(true);
    try {
      const list = await apiService.listIncidents();
      setIncidents(list);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to retrieve incident vault records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, []);

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your current browser.');
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCapturedLocation({
          user_consent_granted: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_meters: pos.coords.accuracy,
          captured_at: new Date().toISOString(),
        });
        setLocationLoading(false);
        setEnableLocationConsent(true);
      },
      (err) => {
        setLocationError(`Location request denied or unavailable: ${err.message}`);
        setLocationLoading(false);
        setEnableLocationConsent(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim() || !formEvidence.trim()) {
      setErrorMessage('Please complete all required incident fields.');
      return;
    }
    setIsLoading(true);
    try {
      const payload: IncidentCreateRequest = {
        title: formTitle.trim(),
        category: formCategory,
        severity: formSeverity,
        description: formDescription.trim(),
        raw_evidence: formEvidence.trim(),
        sender_information: formSender.trim() || undefined,
        financial_loss_amount: formLoss ? parseFloat(formLoss) : undefined,
        consent_location: enableLocationConsent && capturedLocation ? capturedLocation : undefined,
      };

      await apiService.recordIncident(payload);
      setShowCreateModal(false);
      // Reset form
      setFormTitle('');
      setFormDescription('');
      setFormEvidence('');
      setFormSender('');
      setFormLoss('');
      setEnableLocationConsent(false);
      setCapturedLocation(null);
      await fetchVault();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record incident.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (incidentId: string) => {
    setIsExporting(true);
    try {
      const exp = await apiService.exportIncidentReport(incidentId);
      setExportData(exp);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to compile official report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyText = (text: string, type: 'report' | 'hash', hashVal?: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'report') {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } else if (hashVal) {
      setCopiedHash(hashVal);
      setTimeout(() => setCopiedHash(null), 2000);
    }
  };

  const handleDownloadJson = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData.json_bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportData.docket_number}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
                <span className="text-red-400">#</span> Incident Response & Cryptographic Evidence Vault
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Seal unalterable digital evidence with SHA-256 digests, verify consent-based emergency location, and prepare standardized dispute dockets.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setErrorMessage(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md shadow-red-600/30 shrink-0 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            Preserve New Incident
          </button>
        </div>

        {/* Safeguards Notice */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-300 font-sans leading-relaxed">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white font-mono text-[11px] uppercase tracking-wider block">
              Official Reporting Boundary Safeguard:
            </strong>
            <p>
              ScamShield AI compiles tamper-evident reports for legal filing (FTC, IC3, police, or your bank).
              <strong> Reports are NEVER automatically transmitted to authorities</strong> without verified integration channels and explicit user sign-off.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Incident Records Vault List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            Sealed Incident Records ({incidents.length})
          </span>
          <span className="text-slate-500 text-[11px]">Integrity Check: SHA-256 Enforced</span>
        </div>

        {isLoading && (
          <div className="p-12 text-center space-y-2 bg-slate-900/60 border border-slate-800 rounded-xl">
            <Loader2 className="w-7 h-7 text-red-400 animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400">Loading evidence vault records...</p>
          </div>
        )}

        {!isLoading && incidents.length === 0 && (
          <div className="p-12 text-center space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <Lock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-mono text-slate-300">Your Incident Vault is currently empty.</p>
            <p className="text-xs text-slate-500 font-sans max-w-md mx-auto">
              When you encounter a confirmed scam or extortion attempt, record it here to seal timestamps and generate official dispute bundles.
            </p>
          </div>
        )}

        {!isLoading &&
          incidents.map((inc) => (
            <div
              key={inc.incident_id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-colors shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      {inc.status}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Captured: {new Date(inc.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-mono text-white tracking-tight">
                    {inc.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <SeverityBadge severity={inc.severity} size="sm" />
                  <button
                    onClick={() => handleExportReport(inc.incident_id)}
                    disabled={isExporting}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Export Report
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">{inc.description}</p>

              {/* Cryptographic SHA-256 Evidence Seal */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Hash className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-slate-500 shrink-0">SHA-256 Digest:</span>
                  <span className="text-blue-300 font-bold truncate">{inc.evidence_sha256}</span>
                </div>
                <button
                  onClick={() => handleCopyText(inc.evidence_sha256, 'hash', inc.incident_id)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] shrink-0 self-start sm:self-auto flex items-center gap-1 transition-colors"
                >
                  {copiedHash === inc.incident_id ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Hash
                    </>
                  )}
                </button>
              </div>

              {/* Badges / Context row */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                {inc.sender_information && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Source:</span>
                    <span className="text-slate-200">{inc.sender_information}</span>
                  </div>
                )}
                {inc.financial_loss_amount !== null && inc.financial_loss_amount !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Loss:</span>
                    <span className="text-red-400 font-bold">
                      ${inc.financial_loss_amount.toFixed(2)} USD
                    </span>
                  </div>
                )}
                {inc.consent_location && inc.consent_location.user_consent_granted && (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <MapPin className="w-3 h-3" />
                    <span>Consent-Verified GPS Attached</span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-mono font-bold text-white">Record & Seal Incident Evidence</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-medium">Incident Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Urgent Payroll Wire Impersonation SMS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ThreatCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="PHISHING">Phishing / Credential Harvesting</option>
                    <option value="FINANCIAL_FRAUD">Financial Fraud & Scams</option>
                    <option value="COERCION_EXTORTION">Coercion & Extortion</option>
                    <option value="IMPERSONATION">Authority / Brand Impersonation</option>
                    <option value="VIOLENT_THREAT">Violent Threat Protocol</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Harm Severity *</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as RiskSeverity)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="CRITICAL">Critical Severity</option>
                    <option value="HIGH">High Severity</option>
                    <option value="MEDIUM">Medium Severity</option>
                    <option value="LOW">Low Severity</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Incident Statement / Narrative *</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe how contact occurred, what instructions were given, and what steps you took..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-sans text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Preserved Raw Digital Evidence *</label>
                <textarea
                  required
                  rows={4}
                  value={formEvidence}
                  onChange={(e) => setFormEvidence(e.target.value)}
                  placeholder="Paste the exact message text, URL, email headers, or crypto wallet address (SHA-256 digest will seal this content)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Sender / Contact Handle</label>
                  <input
                    type="text"
                    value={formSender}
                    onChange={(e) => setFormSender(e.target.value)}
                    placeholder="e.g. +1-800-555-0199 or fraud@spoofed.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Financial Loss ($ USD, if any)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formLoss}
                    onChange={(e) => setFormLoss(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Explicit Consent-Based Geolocation Sharing Box */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Consent-Based Location Context (Optional)
                  </span>
                  {!capturedLocation ? (
                    <button
                      type="button"
                      onClick={handleRequestLocation}
                      disabled={locationLoading}
                      className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-mono border border-emerald-500/40 flex items-center gap-1 transition-colors"
                    >
                      {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                      Request GPS Location
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Coordinates Attached
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Your physical location is <strong>never estimated from IP addresses or links</strong>.
                  Only attach GPS coordinates if filing a report involving immediate danger or local jurisdiction filing.
                </p>

                {capturedLocation && (
                  <div className="text-[10px] font-mono text-slate-400 bg-black/40 p-2 rounded border border-slate-850 flex items-center justify-between">
                    <span>
                      Lat: {capturedLocation.latitude.toFixed(4)}, Lon: {capturedLocation.longitude.toFixed(4)} (±{capturedLocation.accuracy_meters?.toFixed(0)}m)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedLocation(null);
                        setEnableLocationConsent(false);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {locationError && (
                  <p className="text-[11px] font-mono text-red-400">{locationError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Seal & Preserve Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Export Modal */}
      {exportData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-mono font-bold text-white">Standardized Dispute Docket</h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Docket: <strong>{exportData.docket_number}</strong>
                </span>
              </div>
              <button
                onClick={() => setExportData(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verification Signature & Transmission Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block text-[10px]">VERIFICATION SIGNATURE</span>
                <span className="text-blue-300 font-bold truncate block">
                  {exportData.verification_signature}
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-500 block text-[10px]">TRANSMISSION STATUS</span>
                <span className="text-amber-400 font-bold block">
                  {exportData.transmission_status}
                </span>
              </div>
            </div>

            {/* Markdown Report View */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Official Report Markdown:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyText(exportData.markdown_report, 'report')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-mono flex items-center gap-1 border border-slate-700"
                  >
                    {copiedReport ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Markdown
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono flex items-center gap-1 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download JSON Bundle
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {exportData.markdown_report}
              </pre>
            </div>

            <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded text-xs text-blue-200/90 font-sans leading-relaxed">
              <strong>Official Filing Guide:</strong> Copy or download this docket and submit it to
              your bank fraud department, the Federal Trade Commission at <strong>reportfraud.ftc.gov</strong>,
              or the FBI Internet Crime Complaint Center at <strong>ic3.gov</strong>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
