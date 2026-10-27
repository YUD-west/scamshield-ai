import React, { useEffect, useState } from 'react';
import { SignalItem } from '../../types';

interface SignalsMeterProps {
  signals: SignalItem[];
}

const TOTAL_BLOCKS = 20;

const SIGNAL_COLORS: Record<string, string> = {
  urgency: '#f0a23a',
  money: '#e2572f',
  lookalike: '#161513',
};

export const SignalsMeter: React.FC<SignalsMeterProps> = ({ signals }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  const allZero = signals.every((s) => s.count === 0);

  return (
    <div>
      <ul className="space-y-5">
        {signals.map((s, idx) => {
          const filledBlocks = Math.round((s.strength / 100) * TOTAL_BLOCKS);
          const blockColor = SIGNAL_COLORS[s.kind] || '#161513';

          return (
            <li key={s.kind}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-fg">{s.label}</span>
                  <span className="ml-2 hidden text-xs text-fg4 md:inline">{s.hint}</span>
                </div>
                <span className="shrink-0 font-mono text-xs text-fg3">
                  {s.count === 0 ? 'none' : `${s.count} ${s.count === 1 ? 'match' : 'matches'}`}
                </span>
              </div>

              <div
                className="mt-2 flex gap-[3px]"
                role="meter"
                aria-label={s.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={s.strength}
              >
                {Array.from({ length: TOTAL_BLOCKS }, (_, bIdx) => {
                  const isLit = animated && bIdx < filledBlocks;
                  return (
                    <span
                      key={bIdx}
                      className="h-3.5 flex-1 rounded-[1px]"
                      style={{
                        background: isLit ? blockColor : '#d6d1c4',
                        transition: `background-color 0.2s linear ${idx * 120 + bIdx * 28}ms`,
                      }}
                    />
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {allZero && (
        <p className="mt-4 text-xs text-fg3">
          No pressure, payment or lookalike-link patterns were found in this message.
        </p>
      )}
    </div>
  );
};
