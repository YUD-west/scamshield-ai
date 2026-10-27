import React, { useEffect, useState } from 'react';

interface GaugeMeterProps {
  value: number;
  color: string;
  label: string;
}

export const GaugeMeter: React.FC<GaugeMeterProps> = ({ value, color, label }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  const curve = 'cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <div role="img" aria-label={`${label}: ${value}% match`}>
      <div className="flex items-end justify-between gap-4">
        <span className="label">{label}</span>
        <span className="display text-[44px] leading-none text-fg sm:text-[56px]">
          {value}
          <span
            className="ml-1 font-mono text-sm font-medium normal-case tracking-normal text-fg3"
            style={{ fontStretch: '100%' }}
          >
            % match
          </span>
        </span>
      </div>

      <div className="relative mt-4 h-9">
        {/* Fine ticks */}
        <div
          className="absolute inset-x-0 bottom-0 h-2 border-r border-line2"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #645f55 0 1px, transparent 1px 2%)',
          }}
        />
        {/* Major ticks */}
        <div
          className="absolute inset-x-0 bottom-0 h-4 border-r border-fg4"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #857f72 0 1px, transparent 1px 10%)',
          }}
        />
        {/* Colored Fill */}
        <div
          className="absolute bottom-4 left-0 h-1.5"
          style={{
            width: animated ? `${value}%` : '0%',
            background: color,
            transition: `width 1.1s ${curve} 0.1s`,
          }}
        />
        {/* Needle Marker */}
        <div
          className="absolute bottom-0 h-8 w-0.5 -translate-x-1/2 bg-char"
          style={{
            left: animated ? `${value}%` : '0%',
            transition: `left 1.1s ${curve} 0.1s`,
          }}
        />
      </div>

      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-fg4">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
};
