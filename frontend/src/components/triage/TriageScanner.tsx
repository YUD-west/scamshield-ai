import React, { useState } from 'react';
import {
  Loader2,
  ArrowRight,
  ExternalLink,
  Globe,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Copy,
  BookOpen,
} from 'lucide-react';
import { TextAnalysisResult, UrlAnalysisResult } from '../../types';
import { apiService } from '../../services/api';

export const PRESETS = [
  {
    icon: '🏦',
    label: 'Fake Bank SMS',
    text: 'URGENT: Your Chase account is locked due to unusual activity. Verify your account within 24 hours: http://chase-secure.xyz',
    badge: 'Phishing',
  },
  {
    icon: '💸',
    label: 'Crypto Doubler',
    text: 'Send 0.1 BTC and we will double your bitcoin! Guaranteed returns, act now!',
    badge: 'Investment',
  },
  {
    icon: '📷',
    label: 'Webcam Blackmail',
    text: 'I recorded you through your webcam. Your password is hunter2. Pay $900 in bitcoin or I share the video.',
    badge: 'Extortion',
  },
  {
    icon: '🏛️',
    label: 'IRS Threat',
    text: 'IRS FINAL NOTICE: An arrest warrant is issued. Pay with gift cards immediately to avoid police.',
    badge: 'Impersonation',
  },
  {
    icon: '🔗',
    label: 'Lookalike PayPal',
    text: 'Your payment failed. Log in at https://paypa1.com/login to fix it.',
    badge: 'Typo Trick',
  },
  {
    icon: '☕',
    label: 'Safe Real Message',
    text: 'Hey! Want to grab coffee Saturday morning at the usual place?',
    badge: 'Legitimate',
  },
];

interface TriageScannerProps {
  onSimulateScenario?: (category: any, text?: string, url?: string) => void;
  onSaveToVault?: (title: string, proof: string) => void;
}

export const TriageScanner: React.FC<TriageScannerProps> = ({
  onSimulateScenario,
}) => {
  const [text, setText] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
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
      setErrorMessage(err.message || 'Failed to check message. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (p: (typeof PRESETS)[0]) => {
    setActivePreset(p.label);
    setText(p.text);
    runScan(p.text);
  };

  const handleClear = () => {
    setText('');
    setActivePreset(null);
    setTextResult(null);
    setUrlResult(null);
    setErrorMessage(null);
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
  const completedCount = Object.values(done).filter(Boolean).length;
  const flags = currentResult
    ? currentResult.evidence.map((e) => ({
        phrase: e.matched_pattern || e.title,
        why: e.description,
      }))
    : [];

  const detectedUrls = text.match(/https?:\/\/[^\s]+/gi) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <section className="text-center pt-2 pb-6 max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 border border-border px-4 py-1.5 text-xs font-semibold shadow-sm">
          <span className="h-2 w-2 rounded-full bg-safe animate-pulse" />
          <span className="text-foreground">Protection active · You're safe here</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display">
          Is this message or website a{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-teal-300 bg-clip-text text-transparent">
            scam?
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed">
          Paste any suspicious SMS text, email, WhatsApp message, or website link. We’ll analyze it in plain English — fast, free, and completely private.
        </p>
      </section>

      {/* 4 Responsive Flexible Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass p-4 sm:p-5 card-interactive flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
            🛡️
          </div>
          <div>
            <div className="text-xs text-muted-foreground/90 font-medium">Protection Status</div>
            <div className="font-extrabold text-safe text-base sm:text-lg">Active & Ready</div>
          </div>
        </div>

        <div className="glass p-4 sm:p-5 card-interactive flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
            🔒
          </div>
          <div>
            <div className="text-xs text-muted-foreground/90 font-medium">Privacy Level</div>
            <div className="font-extrabold text-safe text-base sm:text-lg">100% Private</div>
          </div>
        </div>

        <div className="glass p-4 sm:p-5 card-interactive flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
            ⚡
          </div>
          <div>
            <div className="text-xs text-muted-foreground/90 font-medium">Response Time</div>
            <div className="font-extrabold text-safe text-base sm:text-lg">Under 1s</div>
          </div>
        </div>

        <div className="glass p-4 sm:p-5 card-interactive flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
            🎯
          </div>
          <div>
            <div className="text-xs text-muted-foreground/90 font-medium">AI Precision</div>
            <div className="font-extrabold text-safe text-base sm:text-lg">High Certainty</div>
          </div>
        </div>
      </div>

      {/* Main Scanner Card */}
      <section className="glass p-5 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl border border-border/80">
        {/* Preset Pills */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-safe" />
              <span>Click a sample preset to test:</span>
            </span>
            {text && (
              <button
                onClick={handleClear}
                className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear text</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const isSelected = activePreset === p.label;
              return (
                <button
                  key={p.label}
                  onClick={() => handleSelectPreset(p)}
                  className={`text-xs px-3.5 py-2 rounded-xl border transition-all duration-200 flex items-center gap-2 select-none ${
                    isSelected
                      ? 'bg-safe text-primary-foreground font-bold border-safe shadow-md shadow-safe/25 scale-[1.02]'
                      : 'btn-ghost'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Box */}
        <div className="space-y-2 relative">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setActivePreset(null);
            }}
            rows={5}
            placeholder="Paste a suspicious text message, email, or web address here (e.g. URGENT: Your bank account is locked)..."
            className="w-full rounded-2xl border border-input bg-black/40 p-4 sm:p-5 text-base sm:text-lg outline-none focus:ring-2 focus:ring-safe text-foreground placeholder-muted-foreground/50 transition-all leading-relaxed"
          />

          {/* Telemetry pill inside input */}
          <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground/80 pt-1 px-1">
            <div className="flex items-center gap-3">
              <span>{text.length} characters</span>
              {detectedUrls.length > 0 && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {detectedUrls.length} link{detectedUrls.length > 1 ? 's' : ''} detected
                </span>
              )}
            </div>
            <span>Never opens links on your device</span>
          </div>
        </div>

        {/* Check Button */}
        <button
          className="btn-primary w-full text-base sm:text-lg py-4 flex items-center justify-center gap-2 group font-bold tracking-tight select-none"
          disabled={!text.trim() || loading}
          onClick={() => runScan()}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Checking message with AI Engine...</span>
            </>
          ) : (
            <>
              <span>Check This For Me</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-danger/15 border border-danger/40 text-danger text-sm flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </section>

      {/* Dynamic Results Display */}
      {currentResult && (
        <section
          className={`glass p-6 sm:p-8 space-y-6 animate-fade-in border transition-all duration-500 ${
            verdict === 'danger'
              ? 'border-danger/40 shadow-2xl shadow-danger/10 bg-gradient-to-b from-red-950/20 via-card to-card'
              : verdict === 'caution'
              ? 'border-caution/40 shadow-2xl shadow-caution/10 bg-gradient-to-b from-yellow-950/20 via-card to-card'
              : 'border-safe/40 shadow-2xl shadow-safe/10 bg-gradient-to-b from-emerald-950/20 via-card to-card'
          }`}
        >
          {/* Top Verdict & Certainty Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/60 pb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shadow-lg shrink-0 ${
                  verdict === 'danger'
                    ? 'bg-danger/20 border-danger/40 text-danger'
                    : verdict === 'caution'
                    ? 'bg-caution/20 border-caution/40 text-caution'
                    : 'bg-safe/20 border-safe/40 text-safe'
                }`}
              >
                {verdict === 'danger' ? '🚨' : verdict === 'caution' ? '⚠️' : '✅'}
              </div>

              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-1 ${
                    verdict === 'danger'
                      ? 'bg-danger/20 text-danger border border-danger/40'
                      : verdict === 'caution'
                      ? 'bg-caution/20 text-yellow-300 border border-caution/40'
                      : 'bg-safe/20 text-safe border border-safe/40'
                  }`}
                >
                  {verdict === 'danger'
                    ? 'High Risk Scam'
                    : verdict === 'caution'
                    ? 'Caution Advised'
                    : 'Verified Safe'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
                  {verdict === 'danger'
                    ? 'Do Not Interact With This Message'
                    : verdict === 'caution'
                    ? 'Suspicious Elements Detected'
                    : 'No Common Scam Patterns Found'}
                </h2>
              </div>
            </div>

            {/* AI Certainty Gauge */}
            <div className="min-w-[220px] bg-black/40 p-3.5 rounded-2xl border border-border/70">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-medium">
                <span>AI Certainty:</span>
                <b className="text-white text-sm">{certainty}% Match</b>
              </div>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    { danger: 'bg-danger', caution: 'bg-caution', safe: 'bg-safe' }[verdict]
                  }`}
                  style={{ width: `${certainty}%` }}
                />
              </div>
            </div>
          </div>

          {/* Plain English Summary */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-border/70">
            <p className="text-base sm:text-lg leading-relaxed text-foreground font-medium">
              {currentResult.summary}
            </p>
          </div>

          {/* Action Checklist */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground font-display">
                  What You Should Do Right Now
                </h3>
                <span className="text-xs text-muted-foreground">
                  Completed {completedCount} of {actions.length} protection steps
                </span>
              </div>

              <button
                className="btn-ghost text-xs flex items-center gap-1.5 py-1.5 px-3"
                onClick={() => {
                  navigator.clipboard.writeText(actions.map((a) => '☐ ' + a).join('\n'));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-safe" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Share / Copy Checklist'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {actions.map((action, i) => (
                <label
                  key={action}
                  className={`flex cursor-pointer items-start gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 select-none ${
                    done[i]
                      ? 'bg-safe/10 border-safe/30 opacity-75'
                      : 'bg-card/40 border-border/70 hover:border-border hover:bg-card/70'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded mt-0.5 accent-safe cursor-pointer shrink-0"
                    checked={!!done[i]}
                    onChange={() => setDone({ ...done, [i]: !done[i] })}
                  />
                  <span
                    className={`text-sm sm:text-base leading-relaxed ${
                      done[i] ? 'line-through text-muted-foreground' : 'text-foreground font-medium'
                    }`}
                  >
                    {action}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Extracted Links Section */}
          {textResult && textResult.extracted_urls && textResult.extracted_urls.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-border/80 space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                🔗 Web Links Found Inside Message ({textResult.extracted_urls.length})
              </span>
              <div className="space-y-2">
                {textResult.extracted_urls.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-secondary/50 border border-border text-sm"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Globe className="w-4 h-4 text-safe shrink-0" />
                      <span className="font-mono text-xs text-foreground truncate">{link}</span>
                    </div>
                    <button
                      onClick={() => runScan(link)}
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Check Link Safely</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Homoglyph / Fake Lookalike Alert */}
          {urlResult && urlResult.has_homoglyphs && urlResult.punycode_decoded && (
            <div className="p-5 rounded-2xl bg-caution/15 border border-caution/40 text-foreground space-y-2">
              <div className="flex items-center gap-2 text-caution font-bold text-base">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Trick Letters Found: Impersonating {urlResult.punycode_decoded}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                This website uses foreign alphabet characters that look identical to standard letters. Scammers use this trick so you think you are on a real site like PayPal or Bank of America, but your login credentials will be stolen!
              </p>
            </div>
          )}

          {/* Red Flags Accordion */}
          {flags.length > 0 && (
            <details className="rounded-2xl bg-black/30 border border-border/80 p-4 sm:p-5" open>
              <summary className="cursor-pointer font-bold text-foreground text-base select-none flex items-center justify-between">
                <span>🚩 Red Flags We Found ({flags.length})</span>
                <span className="text-xs text-muted-foreground">Click to toggle</span>
              </summary>
              <ul className="mt-4 space-y-3">
                {flags.map((f, i) => (
                  <li
                    key={i}
                    className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex items-start gap-3"
                  >
                    <code className="rounded-lg bg-danger/25 text-danger px-2.5 py-1 text-xs font-mono font-bold shrink-0 mt-0.5">
                      {f.phrase}
                    </code>
                    <span className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                      {f.why}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-border/60">
            {currentResult.is_threat && onSimulateScenario && (
              <button
                onClick={() =>
                  onSimulateScenario(
                    currentResult.primary_category,
                    textResult ? text : undefined,
                    urlResult ? urlResult.domain : undefined
                  )
                }
                className="btn-ghost text-xs sm:text-sm flex items-center gap-2 py-2 px-4"
              >
                <BookOpen className="w-4 h-4 text-safe" />
                <span>See How This Scam Unfolds Step-by-Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
