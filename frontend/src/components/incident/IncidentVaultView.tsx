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
      setErrorMessage(err.message || 'Failed to load saved reports.');
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
        setLocationError(`Location permission denied or unavailable: ${err.message}`);
        setLocationLoading(false);
        setEnableLocationConsent(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim() || !formEvidence.trim()) {
      setErrorMessage('Please fill in the title, description, and message proof.');
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
      setErrorMessage(err.message || 'Failed to save report.');
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
      setErrorMessage(err.message || 'Failed to build official report.');
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
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Saved Scam Reports & Evidence
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Preserve untampered proof of scams, threats, or financial fraud to share with your bank, credit card company, or police.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setErrorMessage(null);
              setShowCreateModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/30 shrink-0 self-start sm:self-center hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Save New Scam Report
          </button>
        </div>

        {/* Clear Privacy & Safety Promise */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 text-xs text-slate-300 font-sans leading-relaxed">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-white text-xs block">
              100% Private & In Your Control:
            </strong>
            <p>
              ScamShield AI compiles your evidence into an official report. <strong>Nothing is ever sent to authorities automatically without your permission</strong>. You can download or copy the report and hand it directly to your bank or police department.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Incident Records Vault List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Your Saved Reports ({incidents.length})
          </span>
          <span className="text-slate-500 font-normal">Tamper-Proof Digital Seal Active</span>
        </div>

        {isLoading && (
          <div className="p-16 text-center space-y-2 glass-panel rounded-3xl">
            <Loader2 className="w-8 h-8 text-red-400 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-400">Loading your saved reports...</p>
          </div>
        )}

        {!isLoading && incidents.length === 0 && (
          <div className="p-16 text-center space-y-3 glass-panel rounded-3xl">
            <Lock className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-base font-bold text-white">No saved reports yet.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Whenever you encounter a scam or threatening message, click "Save New Scam Report" above. It will lock the timestamps and evidence as official proof.
            </p>
          </div>
        )}

        {!isLoading &&
          incidents.map((inc) => (
            <div
              key={inc.incident_id}
              className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors shadow-sm backdrop-blur"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Tamper-Proof Evidence Sealed
                    </span>
                    <span className="text-xs text-slate-400">
                      Saved on: {new Date(inc.created_at).toLocaleDateString()} at {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {inc.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <SeverityBadge severity={inc.severity} size="sm" />
                  <button
                    onClick={() => handleExportReport(inc.incident_id)}
                    disabled={isExporting}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/25"
                  >
                    <FileText className="w-4 h-4" />
                    View & Export Report
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{inc.description}</p>

              {/* Digital Proof Fingerprint */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Hash className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-slate-400 font-semibold shrink-0">Tamper-Proof Fingerprint:</span>
                  <span className="text-blue-300 font-mono text-[11px] truncate">{inc.evidence_sha256}</span>
                </div>
                <button
                  onClick={() => handleCopyText(inc.evidence_sha256, 'hash', inc.incident_id)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 transition-colors font-medium"
                >
                  {copiedHash === inc.incident_id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Copy Fingerprint
                    </>
                  )}
                </button>
              </div>

              {/* Context row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                {inc.sender_information && (
                  <div>
                    <span className="text-slate-500">Sent by:</span>{' '}
                    <span className="text-white font-medium">{inc.sender_information}</span>
                  </div>
                )}
                {inc.financial_loss_amount !== null && inc.financial_loss_amount !== undefined && (
                  <div>
                    <span className="text-slate-500">Financial Loss:</span>{' '}
                    <span className="text-red-400 font-bold">
                      ${inc.financial_loss_amount.toFixed(2)} USD
                    </span>
                  </div>
                )}
                {inc.consent_location && inc.consent_location.user_consent_granted && (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Location Context Attached</span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-bold text-white">Save & Lock Scam Evidence</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">What happened? (Short title) *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Fake Bank of America Text asking for login"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">Type of Scam *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ThreatCategory)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="PHISHING">Fake Login Portal (Phishing)</option>
                    <option value="FINANCIAL_FRAUD">Money or Investment Scam</option>
                    <option value="COERCION_EXTORTION">Webcam Blackmail / Extortion</option>
                    <option value="IMPERSONATION">Fake Police or IRS Agent</option>
                    <option value="VIOLENT_THREAT">Threat to Physical Safety</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">Danger Level *</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as RiskSeverity)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="CRITICAL">Extremely Dangerous (Immediate Action)</option>
                    <option value="HIGH">High Risk Scam</option>
                    <option value="MEDIUM">Suspicious / Caution</option>
                    <option value="LOW">Low Risk</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">What happened? Describe in your own words *</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explain what the person said, how they contacted you, and if you replied or gave any info..."
                  className="w-full glass-input rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">Paste the text message, email, or link (Your Proof) *</label>
                <textarea
                  required
                  rows={4}
                  value={formEvidence}
                  onChange={(e) => setFormEvidence(e.target.value)}
                  placeholder="Paste the exact words, links, phone number, or email headers here. A tamper-proof SHA-256 seal will lock this content."
                  className="w-full glass-input rounded-xl p-3 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Who sent it? (Phone number or email)</label>
                  <input
                    type="text"
                    value={formSender}
                    onChange={(e) => setFormSender(e.target.value)}
                    placeholder="e.g. +1-800-555-0199 or alerts@fake-bank.com"
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Money Lost ($ USD, if any)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formLoss}
                    onChange={(e) => setFormLoss(e.target.value)}
                    placeholder="0.00"
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Location Sharing Box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Attach My Location (Optional)
                  </span>
                  {!capturedLocation ? (
                    <button
                      type="button"
                      onClick={handleRequestLocation}
                      disabled={locationLoading}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                      Attach GPS Location
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Location Attached
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  We <strong>never track your location automatically</strong>. Only attach this if you are filing a police report for local jurisdiction help.
                </p>

                {capturedLocation && (
                  <div className="text-[11px] text-slate-300 bg-black/40 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
                    <span>
                      Latitude: {capturedLocation.latitude.toFixed(4)}, Longitude: {capturedLocation.longitude.toFixed(4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedLocation(null);
                        setEnableLocationConsent(false);
                      }}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {locationError && (
                  <p className="text-xs text-red-400">{locationError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <Lock className="w-4 h-4" />
                  Save & Lock This Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Export Modal */}
      {exportData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Official Scam Dispute Report
                </h2>
                <span className="text-xs text-slate-400">
                  Case Docket: <strong>{exportData.docket_number}</strong>
                </span>
              </div>
              <button
                onClick={() => setExportData(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status callout */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 block text-[11px] uppercase font-bold">Report Status</span>
                <span className="text-emerald-400 font-bold text-sm">✓ Sealed & Ready for Official Filing</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyText(exportData.markdown_report, 'report')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  {copiedReport ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copy Report Text</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            </div>

            {/* Formatted Report View */}
            <pre className="p-5 bg-slate-950 rounded-2xl border border-slate-850 text-xs font-mono text-slate-200 max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {exportData.markdown_report}
            </pre>

            <div className="p-4 bg-blue-500/10 border border-blue-500/25 rounded-2xl text-xs text-blue-200 font-sans leading-relaxed">
              <strong>How to use this report:</strong> You can copy or download this file to present directly
              to your bank's fraud department, file with the Federal Trade Commission at <strong>reportfraud.ftc.gov</strong>,
              or hand to local police as proof of the incident.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
