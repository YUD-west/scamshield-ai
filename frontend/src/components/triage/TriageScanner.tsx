import React, { useState } from 'react';
import {
  AlertTriangle,
  FileText,
  Globe,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import { TextAnalysisResult, UrlAnalysisResult } from '../../types';
import { apiService } from '../../services/api';
import { RiskScorecard } from './RiskScorecard';

const SAMPLE_PRESETS = [
  {
    label: 'Bank Phishing SMS',
    type: 'text' as const,
    content:
      'SECURITY ALERT: Unauthorized login attempt detected on your bank account. Your card has been temporarily locked. Verify your credentials immediately at https://secure-bank-verify.net/restore or your account will be closed within 24 hours.',
    sender: '+1 (800) 555-0199',
  },
  {
    label: 'Crypto Doubler Fraud',
    type: 'text' as const,
    content:
      'Guaranteed returns! Send 0.1 BTC to our high-yield automated crypto trading bot and double your bitcoin in 24 hours! Visit https://crypto-doubler-free.top to claim your bonus.',
    sender: 'crypto-vip-alerts@telegram',
  },
  {
    label: 'Webcam Sextortion',
    type: 'text' as const,
    content:
      'I have recorded you with your webcam watching dirty videos. I have all your contacts. Pay $800 in bitcoin to bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq within 48 hours or I will leak your video to everyone.',
    sender: 'blackhat-ops@anonymous.org',
  },
  {
    label: 'IRS Impersonation',
    type: 'text' as const,
    content:
      'Internal Revenue Service: Active warrant for your arrest has been issued due to federal tax tax fraud. Call our legal department immediately at 800-555-0144 to settle before law enforcement is dispatched.',
    sender: 'irs-enforcement@dept.gov.notice-mail.com',
  },
  {
    label: 'Homoglyph URL Spoof',
    type: 'url' as const,
    url: 'https://p\u0430ypal.com/restore-account', // Cyrillic 'а'
  },
  {
    label: 'Direct IP Login URL',
    type: 'url' as const,
    url: 'http://192.168.1.100/admin-login.php',
  },
  {
    label: 'Benign Customer Email',
    type: 'text' as const,
    content:
      'Hi Alex, thank you for sending over the quarterly slides. Let us sync on Tuesday morning at 10am to go over the final deck.',
    sender: 'sarah.miller@acme-corp.com',
  },
];

export const TriageScanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'url'>('text');
  const [textContent, setTextContent] = useState('');
  const [senderHint, setSenderHint] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [textResult, setTextResult] = useState<TextAnalysisResult | null>(null);
  const [urlResult, setUrlResult] = useState<UrlAnalysisResult | null>(null);

  const handleTextScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textContent.trim()) {
      setErrorMessage('Please paste or type suspicious message text before running analysis.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await apiService.analyzeText({
        content: textContent,
        sender_hint: senderHint.trim() || undefined,
      });
      setTextResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze text content.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlScan = async (urlToScan?: string) => {
    const targetUrl = urlToScan || urlInput;
    if (!targetUrl.trim()) {
      setErrorMessage('Please provide a valid URL to analyze.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await apiService.analyzeUrl({ url: targetUrl.trim() });
      setUrlResult(res);
      setActiveTab('url');
      if (urlToScan) setUrlInput(urlToScan);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to inspect URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setErrorMessage(null);
    if (preset.type === 'text') {
      setActiveTab('text');
      setTextContent(preset.content || '');
      setSenderHint(preset.sender || '');
      setTextResult(null);
    } else {
      setActiveTab('url');
      setUrlInput(preset.url || '');
      setUrlResult(null);
    }
  };

  const handleReset = () => {
    setTextContent('');
    setSenderHint('');
    setUrlInput('');
    setTextResult(null);
    setUrlResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-8">
      {/* Input Section Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
              <span className="text-blue-500">#</span> Threat Triage Console
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Safely inspect messages and analyze domains without executing code or triggering tracking pixels.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-center font-mono text-xs">
            <button
              onClick={() => {
                setActiveTab('text');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeTab === 'text'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Analyze Text
            </button>
            <button
              onClick={() => {
                setActiveTab('url');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeTab === 'url'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Safe URL Inspector
            </button>
          </div>
        </div>

        {/* Threat Presets / Test Fixtures */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Load Curated Test Cases:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p)}
                className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input Form */}
        {activeTab === 'text' && (
          <form onSubmit={handleTextScan} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-medium flex items-center justify-between">
                <span>Suspicious Message / Email Body / Chat Text:</span>
                <span className="text-slate-500">{textContent.length}/10,000 characters</span>
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={5}
                placeholder="Paste the suspicious SMS, phishing email, social media message, or extortion demand here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">
                  Sender Handle / Email / Phone (Optional):
                </label>
                <input
                  type="text"
                  value={senderHint}
                  onChange={(e) => setSenderHint(e.target.value)}
                  placeholder="e.g. support@verify-mail.com, +1-800-555-0199"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end justify-end gap-2 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !textContent.trim()}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing Text...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Run Security Triage
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* URL Input Form */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-medium">
                Target URL or Domain to Inspect Safely:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="e.g. https://paypal-security-check.xyz/login or http://192.168.1.1/admin"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono border border-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUrlScan()}
                    disabled={isLoading || !urlInput.trim()}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Inspecting...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        Inspect URL Safely
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Passive inspection only. The target web server is never contacted or requested.
            </p>
          </div>
        )}

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {activeTab === 'text' && textResult && (
        <RiskScorecard
          result={textResult}
          type="text"
          onInspectExtractedUrl={(url) => handleUrlScan(url)}
        />
      )}

      {activeTab === 'url' && urlResult && (
        <RiskScorecard result={urlResult} type="url" />
      )}
    </div>
  );
};
