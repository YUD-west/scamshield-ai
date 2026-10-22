import React from 'react';
import { Sparkles } from 'lucide-react';

interface ConfidenceMeterProps {
  confidence: number; // 0.0 to 1.0
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);

  const getCertaintyInfo = (val: number) => {
    if (val >= 0.90) {
      return {
        label: 'Very High Certainty',
        desc: 'Direct match with confirmed scam patterns',
        bar: 'from-blue-500 to-indigo-500',
        textColor: 'text-blue-400',
      };
    }
    if (val >= 0.75) {
      return {
        label: 'Strong Match',
        desc: 'Matches known phishing & deception indicators',
        bar: 'from-cyan-500 to-blue-500',
        textColor: 'text-cyan-400',
      };
    }
    if (val >= 0.60) {
      return {
        label: 'Moderate Suspicion',
        desc: 'Several suspicious signs were detected',
        bar: 'from-amber-500 to-orange-500',
        textColor: 'text-amber-400',
      };
    }
    return {
      label: 'Early Warning',
      desc: 'Minor anomalies detected',
      bar: 'from-slate-500 to-slate-400',
      textColor: 'text-slate-400',
    };
  };

  const { label, desc, bar, textColor } = getCertaintyInfo(confidence);

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          AI Analysis Certainty
        </span>
        <span className={`font-bold text-sm ${textColor}`}>{percentage}% Match</span>
      </div>

      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-850">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs pt-0.5">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-500 text-[11px]">{desc}</span>
      </div>
    </div>
  );
};
