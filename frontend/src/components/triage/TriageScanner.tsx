import React, { useState } from 'react';
import { Loader2, ArrowRight, ExternalLink, Globe } from 'lucide-react';
import { TextAnalysisResult, UrlAnalysisResult } from '../../types';
import { apiService } from '../../services/api';

export const PRESETS = [
  {
    label: '🏦 Fake Bank SMS',
    text: 'URGENT: Your Chase account is locked due to unusual activity. Verify your account within 24 hours: http://chase-secure.xyz',
  },
  {
    label: '💸 Crypto Doubler',
    text: 'Send 0.1 BTC and we will double your bitcoin! Guaranteed returns, act now!',
  },
  {
    label: '📷 Webcam Blackmail',
    text: 'I recorded you through your webcam. Your password is hunter2. Pay $900 in bitcoin or I share the video.',
  },
  {
    label: '🏛️ IRS Threat',
    text: 'IRS FINAL NOTICE: An arrest warrant is issued. Pay with gift cards immediately to avoid police.',
  },
  {
    label: '🔗 Lookalike PayPal',
    text: 'Your payment failed. Log in at https://paypa1.com/login to fix it.',
  },
  {
    label: '☕ Safe Message',
    text: 'Hey! Want to grab coffee Saturday morning at the usual place?',
  },
];

const badge = {
  danger: { text: '🚨 High Risk Scam', cls: 'bg-danger text-white shadow-lg shadow-danger/25' },
  caution: { text: '⚠️ Be Careful', cls: 'bg-caution text-slate-900 shadow-lg shadow-caution/25' },
  safe: { text: '✅ Verified Safe', cls: 'bg-safe text-primary-foreground shadow-lg shadow-safe/25' },
};

interface TriageScannerProps {
  onSimulateScenario?: (category: any, text?: string, url?: string) => void;
}

export const TriageScanner: React.FC<TriageScannerProps> = ({ onSimulateScenario }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [textResult, setTextResult] = useState<TextAnalysisResult | null>(null);
  const [urlResult, setUrlResult] = useState<UrlAnalysisResult | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runScan = async (inputText = text) => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setErrorMessage(null);
    setLoading(true);
    setDone({});
    setTextResult(null);
    setUrlResult(null);

    try {
      const isPureUrl = /^https?:\/\/[^\s]+$/i.test(trimmed);
      if (isPureUrl) {
        const res = await apiService.analyzeUrl({ url: trimmed });
        setUrlResult(res);
      } else {
        const res = await apiService.analyzeText({ content: trimmed });
        setTextResult(res);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to check message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentResult = textResult || urlResult;

  const getVerdict = (): 'danger' | 'caution' | 'safe' => {
    if (!currentResult) return 'safe';
    if (!currentResult.is_threat) return 'safe';
    if (currentResult.severity === 'CRITICAL' || currentResult.severity === 'HIGH') return 'danger';
    return 'caution';
  };

  const verdict = getVerdict();
  const certainty = currentResult ? Math.round(currentResult.confidence * 100) : 0;
  const actions = currentResult ? currentResult.recommendations.map((r) => r.action) : [];
  const flags = currentResult
    ? currentResult.evidence.map((e) => ({
        phrase: e.matched_pattern || e.title,
        why: e.description,
      }))
    : [];

  const handleInspectUrl = async (extractedUrl: string) => {
    setText(extractedUrl);
    await runScan(extractedUrl);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="py-10 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium border border-border">
          <span className="h-2 w-2 animate-pulse rounded-full bg-safe" />
          <span>Protection active · You're safe here</span>
        </div>
        <h1 className="text-4xl font-bold md:text-6xl tracking-tight text-foreground">
          Is this message or website a scam?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Paste it below. We'll tell you in plain words — fast, free, and private.
        </p>
      </section>

      {/* 3 Stat Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ['🛡️', 'Protection Status', 'Active'],
          ['✅', 'Checks run on your device', 'Private'],
          ['⚡', 'Results in', '1 second'],
        ].map(([icon, label, value]) => (
          <div key={label} className="glass p-5 transition-transform hover:-translate-y-0.5">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="font-bold text-safe text-lg">{value}</div>
          </div>
        ))}
      </div>

      {/* Input Glass Card */}
      <section className="glass p-5 md:p-7 space-y-4">
        {/* Preset Quick Pills */}
        <div className="mb-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="btn-ghost text-sm transition-all"
              onClick={() => {
                setText(p.text);
                runScan(p.text);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Paste a text message, email, or web address here…"
          className="w-full rounded-2xl border border-input bg-background/50 p-4 text-base outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground/60 transition-all"
        />

        {/* Check Button */}
        <button
          className="btn-primary w-full text-lg flex items-center justify-center gap-2"
          disabled={!text.trim() || loading}
          onClick={() => runScan()}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Checking for scams...</span>
            </>
          ) : (
            <>
              <span>Check This For Me</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-danger/20 border border-danger/40 text-danger text-sm">
            {errorMessage}
          </div>
        )}
      </section>

      {/* Results Section */}
      {currentResult && (
        <section className="glass mt-6 space-y-6 p-5 md:p-7 animate-fade-in">
          {/* Top Verdict & Certainty Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <span className={`rounded-full px-5 py-2 text-xl font-bold ${badge[verdict].cls}`}>
              {badge[verdict].text}
            </span>

            <div className="min-w-48 flex-1 sm:max-w-xs">
              <div className="mb-1 text-sm text-muted-foreground flex justify-between">
                <span>AI Certainty:</span>
                <b className="text-foreground">{certainty}% Match</b>
              </div>
              <div className="h-3 rounded-full bg-secondary/80 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${
                    { danger: 'bg-danger', caution: 'bg-caution', safe: 'bg-safe' }[verdict]
                  }`}
                  style={{ width: `${certainty}%` }}
                />
              </div>
            </div>
          </div>

          {/* Plain English Summary */}
          <p className="text-lg leading-relaxed text-foreground font-medium">
            {currentResult.summary}
          </p>

          {/* Action Checklist with Checkboxes */}
          <div>
            <h3 className="mb-3 text-xl font-bold text-foreground">
              What You Should Do Right Now
            </h3>
            <div className="space-y-1.5">
              {actions.map((action, i) => (
                <label
                  key={action}
                  className="flex cursor-pointer items-start gap-3 py-2 px-3 rounded-xl hover:bg-secondary/40 transition-colors select-none"
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded mt-0.5 accent-primary cursor-pointer"
                    checked={!!done[i]}
                    onChange={() => setDone({ ...done, [i]: !done[i] })}
                  />
                  <span
                    className={`text-base leading-relaxed ${
                      done[i] ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {action}
                  </span>
                </label>
              ))}
            </div>

            <button
              className="btn-ghost mt-3 text-sm flex items-center gap-2"
              onClick={() => {
                navigator.clipboard.writeText(actions.map((a) => '☐ ' + a).join('\n'));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <span>{copied ? 'Copied ✓' : '📋 Share / Copy Checklist'}</span>
            </button>
          </div>

          {/* Extracted URLs if any */}
          {textResult && textResult.extracted_urls && textResult.extracted_urls.length > 0 && (
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                🔗 Web Links Found Inside This Message
              </span>
              <div className="space-y-2">
                {textResult.extracted_urls.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-background/50 border border-border text-sm"
                  >
                    <div className="flex items-center gap-2 font-mono text-xs overflow-hidden">
                      <Globe className="w-4 h-4 text-safe shrink-0" />
                      <span className="truncate">{link}</span>
                    </div>
                    <button
                      onClick={() => handleInspectUrl(link)}
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Check Link Safely
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Homoglyph / Fake lookalike warning callout if URL was inspected */}
          {urlResult && urlResult.has_homoglyphs && urlResult.punycode_decoded && (
            <div className="p-4 rounded-2xl bg-caution/15 border border-caution/40 text-sm text-foreground">
              <strong className="block text-caution font-bold text-base mb-1">
                ⚠️ Trick Letters Detected: Mimicking {urlResult.punycode_decoded}
              </strong>
              <p className="text-muted-foreground leading-relaxed">
                This website uses foreign alphabet characters that look identical to regular letters.
                It is designed to trick you into entering your real login details!
              </p>
            </div>
          )}

          {/* Red Flags Dropdown Accordion */}
          {flags.length > 0 && (
            <details className="rounded-2xl bg-background/30 border border-border p-4" open>
              <summary className="cursor-pointer font-bold text-foreground text-base select-none">
                🚩 Red Flags We Found ({flags.length})
              </summary>
              <ul className="mt-3 space-y-2.5 text-sm">
                {flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                    <code className="rounded bg-danger/25 px-2 py-0.5 text-danger font-semibold shrink-0 font-mono text-xs mt-0.5">
                      {f.phrase}
                    </code>
                    <span className="text-muted-foreground">{f.why}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Link to Scam Guide if Threat */}
          {currentResult.is_threat && onSimulateScenario && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() =>
                  onSimulateScenario(
                    currentResult.primary_category,
                    textResult ? text : undefined,
                    urlResult ? urlResult.domain : undefined
                  )
                }
                className="btn-ghost text-sm flex items-center gap-2"
              >
                <span>See how this scam unfolds step-by-step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
