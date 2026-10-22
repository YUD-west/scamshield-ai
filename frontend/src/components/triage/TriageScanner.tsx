import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Globe,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { TextAnalysisResult, UrlAnalysisResult } from '../../types';
import { apiService } from '../../services/api';
import { RiskScorecard } from './RiskScorecard';

const SAMPLE_PRESETS = [
  {
    icon: '🏦',
    label: 'Fake Bank SMS',
    type: 'text' as const,
    content:
      'SECURITY ALERT: Unauthorized login attempt detected on your bank account. Your card has been temporarily locked. Verify your credentials immediately at https://secure-bank-verify.net/restore or your account will be closed within 24 hours.',
    sender: '+1 (800) 555-0199',
  },
  {
    icon: '💸',
    label: 'Crypto Doubler',
    type: 'text' as const,
    content:
      'Guaranteed returns! Send 0.1 BTC to our high-yield automated crypto trading bot and double your bitcoin in 24 hours! Visit https://crypto-doubler-free.top to claim your bonus.',
    sender: 'crypto-vip-alerts@telegram',
  },
  {
    icon: '📷',
    label: 'Webcam Blackmail',
    type: 'text' as const,
    content:
      'I have recorded you with your webcam watching dirty videos. I have all your contacts. Pay $800 in bitcoin to bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq within 48 hours or I will leak your video to everyone.',
    sender: 'blackhat-ops@anonymous.org',
  },
  {
    icon: '🏛️',
    label: 'IRS Tax Threat',
    type: 'text' as const,
    content:
      'Internal Revenue Service: Active warrant for your arrest has been issued due to federal tax tax fraud. Call our legal department immediately at 800-555-0144 to settle before law enforcement is dispatched.',
    sender: 'irs-enforcement@dept.gov.notice-mail.com',
  },
  {
    icon: '🔗',
    label: 'Fake PayPal Link',
    type: 'url' as const,
    url: 'https://p\u0430ypal.com/restore-account', // Cyrillic 'а'
  },
  {
    icon: '☕',
    label: 'Safe Real Message',
    type: 'text' as const,
    content:
      'Hi Alex, thank you for sending over the project slides. Let us sync on Tuesday morning at 10am to go over the final notes.',
    sender: 'sarah.miller@acme-corp.com',
  },
];

interface TriageScannerProps {
  onSimulateScenario?: (category: any, text?: string, url?: string) => void;
}

export const TriageScanner: React.FC<TriageScannerProps> = ({ onSimulateScenario }) => {
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
      setErrorMessage('Please paste the suspicious text or email message first.');
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
      setErrorMessage(err.message || 'Failed to check this text.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlScan = async (urlToScan?: string) => {
    const targetUrl = urlToScan || urlInput;
    if (!targetUrl.trim()) {
      setErrorMessage('Please type or paste a website link to check.');
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
      setErrorMessage(err.message || 'Failed to inspect this link.');
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
    <div className="space-y-10 animate-fade-in">
      {/* Hero Title Section */}
      <div className="text-center max-w-2xl mx-auto space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple, Fast & 100% Safe Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Is this message or website a scam?
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
          Paste any suspicious message, email, or web link below. ScamShield AI will tell you in plain English if it is safe or a trick.
        </p>
      </div>

      {/* Main Glass Input Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Simple Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('text');
                setErrorMessage(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'text'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Check Text or Email</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('url');
                setErrorMessage(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'url'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Check a Web Link</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:block">
            {activeTab === 'text' ? 'Detects fake logins & blackmail' : 'Checks for fake lookalike websites safely'}
          </span>
        </div>

        {/* Quick Sample Examples */}
        <div className="space-y-2.5">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <span>Or try an example to see how it works:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>{p.icon}</span>
                <span className="font-medium">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Form */}
        {activeTab === 'text' && (
          <form onSubmit={handleTextScan} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Paste the suspicious message here:</span>
                <span className="text-slate-500 font-normal">{textContent.length} characters</span>
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={4}
                placeholder="Paste the SMS text, WhatsApp message, email, or DM here..."
                className="w-full glass-input rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Who sent it? (Optional phone number, email, or handle)
                </label>
                <input
                  type="text"
                  value={senderHint}
                  onChange={(e) => setSenderHint(e.target.value)}
                  placeholder="e.g. +1-800-555-0199 or support@verify-account.com"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-end justify-end gap-2.5 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !textContent.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking for scams...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Check This For Me
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* URL Form */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Paste the web address or link here:
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="e.g. https://pаypal.com or http://192.168.1.1/login"
                  className="flex-1 glass-input rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUrlScan()}
                    disabled={isLoading || !urlInput.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking link...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        Inspect Link Safely
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              🔒 <strong>100% Safe Check:</strong> ScamShield AI checks the link structure and safety records without ever opening the destination website on your phone or computer.
            </p>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5">
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
          onSimulateScenario={(cat) => onSimulateScenario && onSimulateScenario(cat, textContent)}
        />
      )}

      {activeTab === 'url' && urlResult && (
        <RiskScorecard
          result={urlResult}
          type="url"
          onSimulateScenario={(cat) => onSimulateScenario && onSimulateScenario(cat, undefined, urlResult.domain)}
        />
      )}
    </div>
  );
};
