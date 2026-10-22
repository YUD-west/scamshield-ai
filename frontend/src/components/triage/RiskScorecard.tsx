import React, { useState } from 'react';
import {
  ExternalLink,
  Globe,
  Info,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const isUrlResult = type === 'url' && 'domain' in result;
  const urlData = isUrlResult ? (result as UrlAnalysisResult) : null;
  const textData = !isUrlResult ? (result as TextAnalysisResult) : null;

  const getFriendlyCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'PHISHING':
        return 'Fake Login Portal (Password Stealer)';
      case 'CREDENTIAL_HARVESTING':
        return 'Security Code / 2FA Theft Attempt';
      case 'FINANCIAL_FRAUD':
        return 'Fake Investment or Money Scam';
      case 'COERCION_EXTORTION':
        return 'Blackmail & Webcam Extortion';
      case 'IMPERSONATION':
        return 'Fake Company or Government Impersonation';
      case 'VIOLENT_THREAT':
        return 'Dangerous Threat to Physical Safety';
      case 'MALICIOUS_LINK':
        return 'Dangerous Deceptive Web Link';
      case 'SUSPICIOUS_URGENCY':
        return 'Pushy Urgency Trick';
      case 'BENIGN':
        return 'Standard Safe Communication';
      default:
        return cat.replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Big Visual Verdict Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          result.is_threat
            ? 'bg-gradient-to-br from-red-950/80 via-slate-900 to-[#080C14] border-red-500/40 shadow-2xl shadow-red-950/30'
            : 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-[#080C14] border-emerald-500/40 shadow-2xl shadow-emerald-950/30'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-4 rounded-2xl border shrink-0 ${
                result.is_threat
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {result.is_threat ? (
                <ShieldAlert className="w-8 h-8" />
              ) : (
                <ShieldCheck className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {type === 'text' ? 'Message Analysis Verdict' : 'Website Link Verdict'}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    result.is_threat
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {result.is_threat ? 'Scam Detected' : 'No Scam Found'}
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white">
                {getFriendlyCategoryTitle(result.primary_category)}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {onSimulateScenario && result.is_threat && (
              <button
                onClick={() => onSimulateScenario(result.primary_category)}
                className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <span>See How This Scam Works</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <SeverityBadge severity={result.severity} size="lg" />
          </div>
        </div>

        {/* Human-Friendly Summary Banner */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
            {result.summary}
          </p>
        </div>
      </div>

      {/* Confidence & Quick Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Confidence Meter */}
        <div className="md:col-span-1">
          <ConfidenceMeter confidence={result.confidence} />
        </div>

        {/* Human Findings Summary */}
        <div className="md:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-3 backdrop-blur">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Key Checks Completed
          </span>

          {isUrlResult && urlData && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Domain Name</span>
                <span className="text-white font-semibold truncate block mt-0.5">{urlData.domain}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Trick Letters</span>
                <span
                  className={`font-bold block mt-0.5 ${
                    urlData.has_homoglyphs ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {urlData.has_homoglyphs ? 'Fake Lookalikes' : 'Clean / Normal'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-850">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Global Scam Database</span>
                <span
                  className={`font-bold block mt-0.5 ${
                    urlData.threat_intel_match ? 'text-red-400' : 'text-slate-300'
                  }`}
                >
                  {urlData.threat_intel_match ? 'Confirmed Scam' : 'No Reports Found'}
                </span>
              </div>
            </div>
          )}

          {!isUrlResult && textData && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Links inside this message:</span>
                <span className="font-bold text-blue-400">{textData.extracted_urls.length} link(s)</span>
              </div>
              {textData.extracted_urls.length > 0 && (
                <div className="space-y-2">
                  {textData.extracted_urls.map((url, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-850 text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-slate-200 truncate font-mono">{url}</span>
                      </div>
                      {onInspectExtractedUrl && (
                        <button
                          onClick={() => onInspectExtractedUrl(url)}
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600/25 hover:bg-blue-600/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Check This Link Safely
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

      {/* Homoglyph / Fake lookalike alert callout */}
      {urlData?.has_homoglyphs && urlData.punycode_decoded && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 font-sans">
            <strong className="text-sm font-bold block text-white">
              Watch Out: This website uses trick letters to look like {urlData.punycode_decoded}
            </strong>
            <p className="text-amber-200/90 leading-relaxed">
              Scammers registered characters from foreign alphabets (like Russian or Greek) that look identical to
              English letters. When you look quickly, it looks real, but it takes you to a fake website to steal your login!
            </p>
          </div>
        </div>
      )}

      {/* Action Checklist */}
      <RecommendationsCard
        recommendations={result.recommendations}
        isThreat={result.is_threat}
      />

      {/* Evidence Breakdown */}
      <EvidenceList evidence={result.evidence} />

      {/* Optional Technical Details Toggle */}
      <div className="pt-2">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1 transition-colors mx-auto"
        >
          <span>{showTechnicalDetails ? 'Hide Technical Metadata' : 'Looking for technical security details? Click here'}</span>
          {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs font-mono text-slate-400 space-y-2">
            <div><strong>Raw Input:</strong> {type === 'url' ? urlData?.original_input : 'Text Payload'}</div>
            {isUrlResult && urlData && (
              <>
                <div><strong>Shannon Randomness Entropy:</strong> {urlData.shannon_entropy}</div>
                <div><strong>Direct IP:</strong> {urlData.is_ip_address ? 'True' : 'False'}</div>
                <div><strong>Suspicious TLD Extension:</strong> {urlData.is_suspicious_tld ? 'True' : 'False'}</div>
              </>
            )}
            <div><strong>Analyzed At:</strong> {result.analyzed_at}</div>
          </div>
        )}
      </div>

      {/* Safe Analysis Disclaimer Footer */}
      <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl text-slate-400 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">{result.disclaimer}</p>
      </div>
    </div>
  );
};
