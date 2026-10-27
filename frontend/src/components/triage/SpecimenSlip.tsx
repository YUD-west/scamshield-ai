import React from 'react';
import { highlightSpecimen } from '../../utils/scamShieldEngine';

interface SpecimenSlipProps {
  text: string;
  caseLabel: string;
}

const HIGHLIGHT_STYLES = {
  urgency: 'bg-[#f0a23a]/70 text-char px-0.5 box-decoration-clone',
  money:
    'bg-transparent text-char underline decoration-double decoration-rust decoration-2 underline-offset-[5px] font-semibold',
  lookalike:
    'bg-char px-1.5 py-0.5 font-mono text-[0.86em] text-bone break-all box-decoration-clone',
};

const LEGEND_ITEMS = [
  { kind: 'urgency' as const, label: 'Pressure', swatch: 'bg-[#f0a23a]/70' },
  { kind: 'money' as const, label: 'Payment', swatch: 'border-b-[3px] border-double border-rust' },
  { kind: 'lookalike' as const, label: 'Lookalike link', swatch: 'bg-char' },
];

export const SpecimenSlip: React.FC<SpecimenSlipProps> = ({ text, caseLabel }) => {
  const segments = highlightSpecimen(text);
  const detectedKinds = new Set(segments.map((s) => s.kind).filter(Boolean));

  return (
    <div className="slip px-5 pb-4 pt-6 sm:px-6">
      <div className="mb-3 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.16em] text-fg4">
        <span>Specimen</span>
        <span>{caseLabel}</span>
      </div>

      <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.9] text-char">
        {segments.map((seg, i) =>
          seg.kind ? (
            <mark key={i} className={HIGHLIGHT_STYLES[seg.kind]}>
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </p>

      {detectedKinds.size > 0 && (
        <ul
          className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-dashed border-line2/60 pt-3 font-mono text-[10.5px] uppercase tracking-wider text-fg3"
          aria-label="Highlight legend"
        >
          {LEGEND_ITEMS.filter((item) => detectedKinds.has(item.kind)).map((item) => (
            <li key={item.kind} className="flex items-center gap-2">
              <span className={`inline-block h-3 w-5 ${item.swatch}`} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
