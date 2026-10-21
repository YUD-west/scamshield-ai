import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileCode, ShieldAlert } from 'lucide-react';
import { EvidenceItem } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';

interface EvidenceListProps {
  evidence: EvidenceItem[];
}

export const EvidenceList: React.FC<EvidenceListProps> = ({ evidence }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!evidence || evidence.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 text-sm text-slate-400 font-mono">
        No specific technical threat signatures detected in this submission.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between hover:bg-slate-850 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-sm font-semibold tracking-wide text-white uppercase">
            Detected Evidence & Threat Signals
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800/80">
            {evidence.length}
          </span>
        </div>
        <div className="text-slate-400 flex items-center gap-1 text-xs font-mono">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3">
          {evidence.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    #{idx + 1} {item.indicator_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-semibold text-slate-100">{item.title}</span>
                </div>
                <SeverityBadge severity={item.severity_contribution} size="sm" />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

              {item.matched_pattern && (
                <div className="mt-2 pt-2 border-t border-slate-850 flex items-start gap-2 text-xs font-mono text-slate-400 bg-black/40 px-3 py-2 rounded">
                  <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="overflow-x-auto">
                    <span className="text-slate-500">Pattern: </span>
                    <span className="text-blue-300 font-semibold">{item.matched_pattern}</span>
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
