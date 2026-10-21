import React from 'react';
import { Gauge } from 'lucide-react';

interface ConfidenceMeterProps {
  confidence: number; // 0.0 to 1.0
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);

  const getCertaintyLabel = (val: number) => {
    if (val >= 0.90) return { label: 'High Certainty', color: 'text-blue-400', bar: 'bg-blue-500' };
    if (val >= 0.75) return { label: 'Strong Pattern Match', color: 'text-cyan-400', bar: 'bg-cyan-500' };
    if (val >= 0.60) return { label: 'Moderate Indicator Support', color: 'text-amber-400', bar: 'bg-amber-500' };
    return { label: 'Low Heuristic Certainty', color: 'text-slate-400', bar: 'bg-slate-500' };
  };

  const { label, color, bar } = getCertaintyLabel(confidence);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-400 font-mono uppercase tracking-wider">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          Model Confidence
        </span>
        <span className={`font-mono font-bold text-sm ${color}`}>{percentage}%</span>
      </div>

      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-slate-500 text-[10px]">Deterministic Heuristic + Rule Weights</span>
      </div>
    </div>
  );
};
