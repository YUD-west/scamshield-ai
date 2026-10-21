import React from 'react';
import {
  ExternalLink,
  Globe,
  Info,
  ShieldAlert,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { TextAnalysisResult, UrlAnalysisResult } from '../../types';
import { ConfidenceMeter } from '../common/ConfidenceMeter';
import { SeverityBadge } from '../common/SeverityBadge';
import { EvidenceList } from './EvidenceList';
import { RecommendationsCard } from './RecommendationsCard';

interface RiskScorecardProps {
  result: TextAnalysisResult | UrlAnalysisResult;
  type: 'text' | 'url';
  onInspectExtractedUrl?: (url: string) => void;
  onSimulateScenario?: (category: string) => void;
}

export const RiskScorecard: React.FC<RiskScorecardProps> = ({
  result,
  type,
  onInspectExtractedUrl,
  onSimulateScenario,
}) => {
  const isUrlResult = type === 'url' && 'domain' in result;
  const urlData = isUrlResult ? (result as UrlAnalysisResult) : null;
  const textData = !isUrlResult ? (result as TextAnalysisResult) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Verdict */}
      <div
        className={`p-5 rounded-xl border transition-all ${
          result.is_threat
            ? 'bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border-red-500/50 shadow-lg shadow-red-950/20'
            : 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-lg border shrink-0 ${
                result.is_threat
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {result.is_threat ? (
                <ShieldAlert className="w-7 h-7" />
              ) : (
                <ShieldCheck className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {type === 'text' ? 'Message Triage Verdict' : 'Passive URL Verdict'}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    result.is_threat
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {result.is_threat ? 'Threat Detected' : 'No Threat Detected'}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white font-mono">
                {result.primary_category.replace(/_/g, ' ')}
              </h2>
              {textData?.secondary_categories && textData.secondary_categories.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400">Secondary signals:</span>
                  {textData.secondary_categories.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {c.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {onSimulateScenario && result.is_threat && (
              <button
                onClick={() => onSimulateScenario(result.primary_category)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Terminal className="w-3.5 h-3.5" />
                Simulate Scenario
              </button>
            )}
            <SeverityBadge severity={result.severity} size="lg" />
          </div>
        </div>

        {/* Executive Summary Paragraph */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <p className="text-sm text-slate-200 leading-relaxed font-sans">{result.summary}</p>
        </div>
      </div>

      {/* Metrics Row: Confidence & Structural Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Confidence Meter */}
        <div className="md:col-span-1">
          <ConfidenceMeter confidence={result.confidence} />
        </div>

        {/* Key Indicators Panel */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-2.5">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Analysis Telemetry & Boundaries
          </span>

          {isUrlResult && urlData && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DOMAIN</span>
                <span className="text-slate-200 font-bold truncate block">{urlData.domain}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">PUNYCODE / HOMOGLYPH</span>
                <span
                  className={`font-bold block ${
                    urlData.has_homoglyphs ? 'text-red-400' : 'text-slate-400'
                  }`}
                >
                  {urlData.has_homoglyphs ? 'LOOKALIKE FOUND' : 'CLEAN'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SHANNON ENTROPY</span>
                <span className="text-slate-200 font-bold block">{urlData.shannon_entropy}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">DIRECT IP HOST</span>
                <span
                  className={`font-bold block ${
                    urlData.is_ip_address ? 'text-orange-400' : 'text-slate-400'
                  }`}
                >
                  {urlData.is_ip_address ? 'YES (HIGH RISK)' : 'NO (FQDN)'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">SUSPICIOUS TLD</span>
                <span
                  className={`font-bold block ${
                    urlData.is_suspicious_tld ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {urlData.is_suspicious_tld ? 'FLAGGED TLD' : 'STANDARD TLD'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">THREAT INTEL FEED</span>
                <span
                  className={`font-bold block ${
                    urlData.threat_intel_match ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {urlData.threat_intel_match ? 'KNOWN MALICIOUS' : 'UNLISTED'}
                </span>
              </div>
            </div>
          )}

          {!isUrlResult && textData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>Embedded URLs Detected:</span>
                <span className="font-bold text-blue-400">{textData.extracted_urls.length}</span>
              </div>
              {textData.extracted_urls.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {textData.extracted_urls.map((url, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 p-2 rounded bg-slate-950 border border-slate-850 text-xs font-mono"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="text-slate-300 truncate">{url}</span>
                      </div>
                      {onInspectExtractedUrl && (
                        <button
                          onClick={() => onInspectExtractedUrl(url)}
                          className="shrink-0 px-2 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Inspect Passively
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Homoglyph Alert Detail (if detected) */}
      {urlData?.has_homoglyphs && urlData.punycode_decoded && (
        <div className="p-4 rounded-lg bg-orange-950/40 border border-orange-500/40 text-xs font-mono text-orange-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">
              Internationalized Domain Name (IDN) Homoglyph Attack Warning
            </span>
            <p className="text-orange-300/90 font-sans">
              The inspected domain visually mimics <strong>{urlData.punycode_decoded}</strong> using
              non-Latin characters. Attackers register lookalike characters to trick users into
              entering credentials on fake login portals.
            </p>
          </div>
        </div>
      )}

      {/* Evidence Breakdown */}
      <EvidenceList evidence={result.evidence} />

      {/* Recommendations Checklist */}
      <RecommendationsCard
        recommendations={result.recommendations}
        isThreat={result.is_threat}
      />

      {/* Safe Analysis Disclaimer Footer */}
      <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-slate-500 text-[11px] flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">{result.disclaimer}</p>
      </div>
    </div>
  );
};
