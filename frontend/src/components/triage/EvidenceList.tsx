import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Quote } from 'lucide-react';
import { EvidenceItem } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';

interface EvidenceListProps {
  evidence: EvidenceItem[];
}

export const EvidenceList: React.FC<EvidenceListProps> = ({ evidence }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!evidence || evidence.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400">
        No specific scam flags were detected in this message.
      </div>
    );
  }

  const getFriendlyTitle = (item: EvidenceItem) => {
    switch (item.indicator_type) {
      case 'HOMOGLYPH_DECEPTION':
        return 'Fake Lookalike Letters (Typo Trick)';
      case 'LOOKALIKE_DOMAIN':
        return 'Impersonating a Real Brand Name';
      case 'PRESSURE_TACTIC':
        return 'Artificial Urgency (Rushing You to Act)';
      case 'FINANCIAL_TRIGGER':
        return 'Suspicious Money or Crypto Demand';
      case 'AUTHORITY_CLAIM':
        return 'Falsely Claiming to be an Official Agency';
      case 'THREAT_LANGUAGE':
        return 'Aggressive Threats or Coercion';
      case 'KEYWORD_PATTERN':
        return 'Known Scam Phrasing Match';
      case 'IP_HOST':
        return 'Direct Number Address (Hiding Real Domain)';
      case 'SUSPICIOUS_TLD':
        return 'Unusual / Cheap Web Extension';
      case 'HIGH_ENTROPY_URL':
        return 'Disguised or Messy Web Address';
      default:
        return item.title;
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm backdrop-blur">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between hover:bg-slate-850 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold tracking-tight text-white">
            Red Flags We Found
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {evidence.length} {evidence.length === 1 ? 'flag' : 'flags'}
          </span>
        </div>
        <div className="text-slate-400 flex items-center gap-1.5 text-xs font-medium">
          <span>{isOpen ? 'Hide details' : 'Show details'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 space-y-3">
          {evidence.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2 hover:border-slate-800 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {getFriendlyTitle(item)}
                  </span>
                </div>
                <SeverityBadge severity={item.severity_contribution} size="sm" />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                {item.description}
              </p>

              {item.matched_pattern && (
                <div className="ml-7 mt-2 pt-2 border-t border-slate-900 flex items-start gap-2 text-xs text-slate-300 bg-black/40 px-3 py-2 rounded-lg">
                  <Quote className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 text-[11px]">Suspicious text found: </span>
                    <strong className="text-blue-300 font-mono">{item.matched_pattern}</strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
