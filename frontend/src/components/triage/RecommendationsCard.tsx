import React, { useState } from 'react';
import { CheckCircle2, CheckSquare, Copy, ShieldAlert, Square } from 'lucide-react';
import { ProtectionRecommendation } from '../../types';

interface RecommendationsCardProps {
  recommendations: ProtectionRecommendation[];
  isThreat: boolean;
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
  isThreat,
}) => {
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopyChecklist = () => {
    const checklistText = recommendations
      .map((r, i) => `${i + 1}. ${r.action}\n   Why: ${r.rationale}`)
      .join('\n\n');
    navigator.clipboard.writeText(
      `🛡️ SCAMSHIELD DEFENSE CHECKLIST:\n\n${checklistText}\n\nChecked with ScamShield AI`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              What You Should Do Right Now
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Follow these simple steps to protect yourself, your money, and your accounts.
          </p>
        </div>

        <button
          onClick={handleCopyChecklist}
          disabled={!recommendations || recommendations.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 transition-all shadow-sm"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-400" />
              <span>Share / Copy Checklist</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const isDone = !!checkedItems[index];
          const isUrgent = rec.priority === 'URGENT';

          return (
            <div
              key={index}
              onClick={() => toggleCheck(index)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 opacity-75'
                  : isUrgent
                  ? 'bg-red-950/20 border-red-500/40 hover:border-red-500/60'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                className="mt-0.5 shrink-0 text-slate-400 hover:text-white transition-colors"
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500" />
                )}
              </button>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-bold ${
                      isDone
                        ? 'line-through text-slate-400'
                        : isUrgent
                        ? 'text-red-200'
                        : 'text-slate-100'
                    }`}
                  >
                    {rec.action}
                  </span>
                  {isUrgent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">
                      Important
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed font-sans">
                  {rec.rationale}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {isThreat && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Golden Rule:</strong> Legitimate banks, Amazon, and government agencies will
            <strong> never</strong> ask you for your password or threaten immediate arrest over a text message.
          </p>
        </div>
      )}
    </div>
  );
};
