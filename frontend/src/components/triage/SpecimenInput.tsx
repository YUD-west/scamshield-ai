import React from 'react';
import {
  Landmark,
  Bitcoin,
  Camera,
  Building2,
  Link2,
  Coffee,
  Globe,
  RotateCcw,
  Lock,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { PRESETS, extractUrls } from '../../utils/scamShieldEngine';

interface SpecimenInputProps {
  text: string;
  setText: (val: string) => void;
  activePreset: string | null;
  clearPreset: () => void;
  onPreset: (preset: (typeof PRESETS)[0]) => void;
  onClear: () => void;
  onScan: () => void;
  loading: boolean;
}

const PRESET_ICONS: Record<string, React.ElementType> = {
  'Fake Bank SMS': Landmark,
  'Crypto Doubler': Bitcoin,
  'Webcam Blackmail': Camera,
  'IRS Threat': Building2,
  'Lookalike PayPal': Link2,
  'Safe Real Message': Coffee,
};

export const SpecimenInput: React.FC<SpecimenInputProps> = ({
  text,
  setText,
  activePreset,
  clearPreset,
  onPreset,
  onClear,
  onScan,
  loading,
}) => {
  const detectedUrls = extractUrls(text);

  return (
    <section className="panel relative overflow-hidden" aria-label="Scam checker">
      {/* Top Sweep Progress Line */}
      {loading && (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-line" aria-hidden="true">
          <div className="h-full w-1/4 animate-sweep bg-amber-400" />
        </div>
      )}

      {/* Preset List Header */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 sm:px-5">
        <h2 className="label">Click an example to test</h2>
        {text && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-fg3 transition hover:text-amber-700 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear text</span>
          </button>
        )}
      </div>

      {/* Presets List */}
      <ul className="divide-y divide-line/70">
        {PRESETS.map((p) => {
          const Icon = PRESET_ICONS[p.label] || Globe;
          const isSelected = activePreset === p.label;

          return (
            <li key={p.label}>
              <button
                onClick={() => onPreset(p)}
                aria-pressed={isSelected}
                className={`group relative flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer sm:px-5 ${
                  isSelected ? 'bg-sunk' : 'hover:bg-sunk/60'
                }`}
              >
                <span
                  className={`absolute inset-y-0 left-0 w-0.5 bg-amber-400 transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isSelected ? 'text-amber-700' : 'text-fg4 group-hover:text-fg'
                  }`}
                  strokeWidth={1.75}
                />
                <span className={`flex-1 text-sm ${isSelected ? 'font-medium text-fg' : 'text-fg2'}`}>
                  {p.label}
                </span>
                <span
                  className={`font-mono text-[10.5px] uppercase tracking-wider ${
                    isSelected ? 'text-amber-700' : 'text-fg4'
                  }`}
                >
                  {p.badge}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Textarea & Actions Section */}
      <div className="space-y-4 border-t border-line p-4 sm:p-5">
        <label htmlFor="message" className="sr-only">
          Suspicious message or link
        </label>

        {/* Notched Slip Input */}
        <div className="slip pt-2 [--notch:#f4f2ec] transition focus-within:ring-2 focus-within:ring-amber-400 focus-within:ring-offset-2 focus-within:ring-offset-surface">
          <div className="flex items-center justify-between px-4 pb-0 pt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-fg4">
            <span>Specimen</span>
            <span>{text.length} chars</span>
          </div>

          <textarea
            id="message"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              clearPreset();
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && text.trim() && !loading) {
                e.preventDefault();
                onScan();
              }
            }}
            rows={6}
            placeholder="Paste a suspicious text message, email, or web address here..."
            className="block min-h-[150px] w-full resize-y bg-transparent px-4 py-2 text-base leading-relaxed text-char placeholder:text-fg4 outline-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-dashed border-line2/60 px-4 py-2 font-mono text-[10.5px] uppercase tracking-wider text-fg3">
            {detectedUrls.length > 0 ? (
              <span className="flex items-center gap-1.5 font-semibold text-char">
                <Globe className="h-3.5 w-3.5" />
                {detectedUrls.length} link{detectedUrls.length > 1 ? 's' : ''} detected
              </span>
            ) : (
              <span>No links</span>
            )}
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              Never opens links on your device
            </span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          disabled={!text.trim() || loading}
          onClick={onScan}
          className="group flex w-full items-center justify-center gap-2.5 rounded-sm bg-amber-400 px-6 py-3.5 text-[15px] font-semibold text-char transition hover:bg-amber-300 active:translate-y-px disabled:cursor-not-allowed disabled:bg-sunk disabled:text-fg4 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
              <span>Checking message with AI Engine...</span>
            </>
          ) : (
            <>
              <span>Check This For Me</span>
              <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <p className="hidden items-center justify-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider text-fg4 sm:flex">
          Ctrl + Enter to check
        </p>
      </div>
    </section>
  );
};
