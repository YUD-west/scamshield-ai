import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  Globe,
  Flag,
  Check,
  Copy,
  Save,
} from 'lucide-react';
import { ScanResultView } from '../../types';
import { isLookalikeUrl } from '../../utils/scamShieldEngine';
import { GaugeMeter } from './GaugeMeter';
import { SignalsMeter } from './SignalsMeter';
import { SpecimenSlip } from './SpecimenSlip';

interface ReadoutCardProps {
  result: ScanResultView | null;
  message: string;
  caseLabel: string;
  loading: boolean;
  doneChecklist: Record<number, boolean>;
  onToggleChecklist: (index: number) => void;
  copied: boolean;
  onCopyChecklist: () => void;
  saved: boolean;
  onSaveReport: () => void;
}

const VERDICT_THEMES = {
  danger: {
    badge: 'High risk scam',
    headline: 'Do not interact with this message',
    Icon: AlertOctagon,
    text: 'text-rust',
    band: 'bg-rust',
    hex: '#e2572f',
  },
  caution: {
    badge: 'Caution advised',
    headline: 'Suspicious elements detected',
    Icon: AlertTriangle,
    text: 'text-amber-700',
    band: 'bg-amber-400',
    hex: '#f0a23a',
  },
  safe: {
    badge: 'Verified safe',
    headline: 'No common scam patterns found',
    Icon: ShieldCheck,
    text: 'text-sage',
    band: 'bg-sage',
    hex: '#6b8460',
  },
};

const FormattedSummary: React.FC<{ text: string }> = ({ text }) => {
  const match = text.match(/^([A-Z ]{4,}):\s*(.*)$/s);
  if (match) {
    const prefix = match[1].charAt(0) + match[1].slice(1).toLowerCase();
    return (
      <>
        <strong className="font-semibold text-fg">{prefix}.</strong> {match[2]}
      </>
    );
  }
  return <>{text}</>;
};

const PanelSection: React.FC<{
  title: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ title, hint, children }) => (
  <section className="panel">
    <header className="border-b border-line px-4 py-3 sm:px-5">
      <h3 className="label !text-fg">{title}</h3>
      {hint && <p className="mt-1 text-xs text-fg3">{hint}</p>}
    </header>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

export const ReadoutCard: React.FC<ReadoutCardProps> = ({
  result,
  message,
  caseLabel,
  loading,
  doneChecklist,
  onToggleChecklist,
  copied,
  onCopyChecklist,
  saved,
  onSaveReport,
}) => {
  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center border border-dashed border-line2 p-6 font-mono text-xs uppercase tracking-[0.16em] text-amber-700 lg:min-h-[420px]">
        Reading specimen…
      </div>
    );
  }

  if (!result) {
    return (
      <div className="hidden min-h-[420px] flex-col justify-between border border-dashed border-line2 p-6 lg:flex">
        <div>
          <div className="label">Readout</div>
          <div className="display mt-3 text-[44px] text-line2">Awaiting specimen</div>
        </div>

        <div className="space-y-6 opacity-60" aria-hidden="true">
          <div
            className="h-9 border-b border-line2"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, #9a9484 0 1px, transparent 1px 2%)',
              backgroundSize: '100% 10px',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom',
            }}
          />
          {['Pressure & urgency', 'Payment demand', 'Lookalike domain'].map((lbl) => (
            <div key={lbl}>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-fg4">
                {lbl}
              </div>
              <div className="flex gap-[3px]">
                {Array.from({ length: 20 }, (_, i) => (
                  <span key={i} className="h-3.5 flex-1 bg-sunk" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-fg4">
          Pick an example or paste a message. The verdict, flagged phrases and a safety checklist
          appear here.
        </p>
      </div>
    );
  }

  const theme = VERDICT_THEMES[result.verdict] || VERDICT_THEMES.safe;
  const totalActions = result.recommendations.length;
  const completedActions = Object.values(doneChecklist).filter(Boolean).length;

  return (
    <div className="animate-rise space-y-4" role="region" aria-label="Scan result" aria-live="polite">
      {/* Top Banner & Verdict Card */}
      <section className="overflow-hidden rounded-md border border-line bg-surface">
        <div
          className={`flex items-center justify-between gap-3 px-4 py-2 text-char sm:px-5 ${theme.band}`}
        >
          <span className="flex items-center gap-2 font-mono text-[11.5px] font-semibold uppercase tracking-[0.14em]">
            <theme.Icon className="h-4 w-4" strokeWidth={2.25} />
            {theme.badge}
          </span>
          <span className="hidden truncate font-mono text-[11px] uppercase tracking-[0.1em] opacity-80 sm:block">
            {result.categoryTitle}
          </span>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          <div>
            <h2 className="display text-[40px] sm:text-[56px]">{theme.headline}</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-fg2">
              <FormattedSummary text={result.summary} />
            </p>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-fg4 sm:hidden">
              {result.categoryTitle}
            </div>
          </div>

          {/* AI Certainty Gauge */}
          <GaugeMeter value={result.certainty} color={theme.hex} label="AI certainty" />

          {/* Save to Evidence Vault Button */}
          <button
            onClick={onSaveReport}
            disabled={saved}
            className="inline-flex items-center gap-2 rounded-sm border border-line2 px-3.5 py-2 text-sm font-medium text-fg transition hover:border-amber-400 hover:text-amber-700 disabled:cursor-default disabled:border-line disabled:text-fg3 disabled:hover:text-fg3 cursor-pointer"
          >
            {saved ? (
              <Check className="h-4 w-4 text-[#4f6648]" />
            ) : (
              <Save className="h-4 w-4" strokeWidth={1.75} />
            )}
            <span>{saved ? 'Saved to reports' : 'Save report'}</span>
          </button>
        </div>
      </section>

      {/* Highlighted Specimen Slip */}
      <SpecimenSlip text={message} caseLabel={caseLabel} />

      {/* Extracted Links Panel */}
      {result.extractedUrls.length > 0 && (
        <PanelSection title="Links found" hint="Read as text. Never opened.">
          <ul className="space-y-2">
            {result.extractedUrls.map((url, i) => (
              <li key={i} className="flex items-start gap-3 border border-line bg-page px-3 py-2">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-fg4" strokeWidth={1.75} />
                <code className="min-w-0 flex-1 break-all font-mono text-xs text-fg">{url}</code>
                {isLookalikeUrl(url) && (
                  <span className="shrink-0 rounded-sm bg-rust px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-char">
                    Suspicious
                  </span>
                )}
              </li>
            ))}
          </ul>
        </PanelSection>
      )}

      {/* Signal Breakdown Meter */}
      <PanelSection
        title="Signal breakdown"
        hint="How strongly each known scam pattern appears."
      >
        <SignalsMeter signals={result.signals} />
      </PanelSection>

      {/* Red Flags Accordion */}
      {result.flags.length > 0 && (
        <details className="panel group" open>
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 select-none sm:px-5">
            <span className="label flex items-center gap-2 !text-fg">
              <Flag className="h-3.5 w-3.5 text-rustink" />
              <span>Red flags found</span>
              <span className="ml-1 rounded-sm bg-rust px-1.5 py-0.5 text-char font-mono">
                {result.flags.length}
              </span>
            </span>
            <span className="font-mono text-xs text-fg3 group-open:hidden">Show</span>
            <span className="hidden font-mono text-xs text-fg3 group-open:inline">Hide</span>
          </summary>
          <ul className="divide-y divide-line border-t border-line">
            {result.flags.map((f, i) => (
              <li
                key={i}
                className="grid gap-1.5 px-4 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-5 sm:px-5"
              >
                <code className="break-all font-mono text-xs font-medium text-rustink">
                  {f.phrase}
                </code>
                <span className="text-sm leading-relaxed text-fg2">{f.why}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* What To Do Right Now Checklist */}
      <PanelSection title="What to do right now">
        <div className="mb-4 flex items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-wider text-fg3">
          <span>
            Completed <span className="text-fg font-semibold">{completedActions}</span> of{' '}
            <span className="text-fg font-semibold">{totalActions}</span> safety actions
          </span>
          <div className="flex h-1.5 w-28 gap-[2px]" aria-hidden="true">
            {result.recommendations.map((_, i) => (
              <span
                key={i}
                className={`flex-1 transition-colors ${
                  i < completedActions ? 'bg-amber-400' : 'bg-line'
                }`}
              />
            ))}
          </div>
        </div>

        <ul className="space-y-2">
          {result.recommendations.map((action, i) => {
            const isDone = !!doneChecklist[i];
            return (
              <li key={i}>
                <label
                  className={`flex cursor-pointer items-start gap-3 border px-3.5 py-3 transition-colors ${
                    isDone
                      ? 'border-line bg-page/60'
                      : 'border-line bg-page hover:border-line2'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isDone}
                    onChange={() => onToggleChecklist(i)}
                  />
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-fg4 text-char transition peer-checked:border-amber-400 peer-checked:bg-amber-400 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-page [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
                    <Check className="h-3.5 w-3.5 text-char" strokeWidth={3.5} />
                  </span>
                  <span className="text-sm leading-relaxed text-fg transition-colors peer-checked:text-fg4 peer-checked:line-through">
                    {action}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <button
          onClick={onCopyChecklist}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-sm border border-line2 px-3.5 py-2.5 text-sm font-medium text-fg transition hover:border-amber-400 hover:text-amber-700 cursor-pointer"
        >
          {copied ? (
            <Check className="h-4 w-4 text-[#4f6648]" />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.75} />
          )}
          <span>{copied ? 'Copied to clipboard' : 'Share / Copy Checklist'}</span>
        </button>
      </PanelSection>
    </div>
  );
};
