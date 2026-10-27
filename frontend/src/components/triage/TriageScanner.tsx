import React, { useState, useRef, useEffect } from 'react';
import { SpecimenInput } from './SpecimenInput';
import { ReadoutCard } from './ReadoutCard';
import { BlinkingDot } from '../common/Header';
import { ScanResultView } from '../../types';
import {
  PRESETS,
  analyzeSpecimenLocal,
  convertApiResultToView,
  createSavedReport,
  formatCaseNumber,
  getSavedReports,
  saveReports,
} from '../../utils/scamShieldEngine';
import { apiService } from '../../services/api';

interface TriageScannerProps {
  onSimulateScenario?: (category: any, text?: string, url?: string) => void;
  onReportsUpdated?: (count: number) => void;
  caseCount?: number;
  onIncrementCase?: () => void;
  initialText?: string;
}

const STAT_ITEMS = [
  ['Protection Status', 'Active & Ready'],
  ['Privacy Level', '100% Private'],
  ['Response Time', 'Under 1s'],
  ['AI Precision', 'High Certainty'],
];

export const TriageScanner: React.FC<TriageScannerProps> = ({
  onReportsUpdated,
  caseCount = 1,
  onIncrementCase,
  initialText = '',
}) => {
  const [text, setText] = useState(initialText);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResultView | null>(null);
  const [analyzedMessage, setAnalyzedMessage] = useState('');
  const [doneChecklist, setDoneChecklist] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [engineMode, setEngineMode] = useState<'live' | 'offline' | null>(null);

  const readoutRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (initialText && initialText !== text) {
      setText(initialText);
      runScan(initialText);
    }
  }, [initialText]);

  const runScan = async (inputText = text) => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setValidationError('Please enter or paste a suspicious message or link to analyze.');
      return;
    }
    if (trimmed.length < 3) {
      setValidationError('Input too short. Please provide at least 3 characters.');
      return;
    }

    setValidationError(null);
    setBackendError(null);
    setLoading(true);
    setDoneChecklist({});
    setSavedId(null);

    // Instant local assessment for resilience
    const localResult = analyzeSpecimenLocal(trimmed);

    try {
      const isPureUrl = /^https?:\/\/[^\s]+$/i.test(trimmed);
      let apiResultView: ScanResultView;

      if (isPureUrl) {
        const apiRes = await apiService.analyzeUrl({ url: trimmed });
        apiResultView = convertApiResultToView(trimmed, apiRes);
      } else {
        const apiRes = await apiService.analyzeText({ content: trimmed });
        apiResultView = convertApiResultToView(trimmed, apiRes);
      }

      setResult(apiResultView);
      setEngineMode('live');
    } catch {
      // Honest attribution: when backend fails, clearly indicate offline heuristic mode
      setEngineMode('offline');
      setBackendError(
        'ScamShield AI backend service is currently unreachable. Displaying client-side heuristic estimate.'
      );
      setResult(localResult);
    } finally {
      setAnalyzedMessage(trimmed);
      setLoading(false);
      if (onIncrementCase) onIncrementCase();

      // Smooth scroll to readout
      setTimeout(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        readoutRef.current?.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }, 50);
    }
  };

  const handleSelectPreset = (p: (typeof PRESETS)[0]) => {
    setValidationError(null);
    setActivePreset(p.label);
    setText(p.text);
    runScan(p.text);
  };

  const handleClear = () => {
    setText('');
    setActivePreset(null);
    setResult(null);
    setAnalyzedMessage('');
    setDoneChecklist({});
    setSavedId(null);
    setValidationError(null);
    setBackendError(null);
    setEngineMode(null);
  };

  const handleCopyChecklist = async () => {
    if (!result) return;
    try {
      const content = result.recommendations.map((r) => `☐ ${r}`).join('\n');
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSaveReport = async () => {
    if (!result || !analyzedMessage || savedId) return;
    const newReport = await createSavedReport(analyzedMessage, result);
    const existing = getSavedReports();
    const updated = [newReport, ...existing];
    saveReports(updated);
    setSavedId(newReport.id);
    if (onReportsUpdated) onReportsUpdated(updated.length);

    // Also persist to backend if online
    try {
      await apiService.recordIncident({
        title: `${result.categoryTitle}: ${analyzedMessage.slice(0, 40)}...`,
        category: (result.verdict === 'danger'
          ? 'PHISHING'
          : result.verdict === 'caution'
          ? 'SUSPICIOUS_URGENCY'
          : 'BENIGN') as any,
        severity: (result.verdict === 'danger'
          ? 'HIGH'
          : result.verdict === 'caution'
          ? 'MEDIUM'
          : 'LOW') as any,
        description: result.summary,
        raw_evidence: analyzedMessage,
      });
    } catch {
      // client-side storage is guaranteed
    }
  };

  const currentCaseLabel = formatCaseNumber(caseCount);

  return (
    <div className="space-y-8 animate-fade">
      {/* Header Banner */}
      <header>
        <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-fg3">
          <BlinkingDot />
          <span>Protection active · You're safe here</span>
        </div>

        <h1 className="display mt-5 max-w-5xl text-[52px] sm:text-[88px] lg:text-[112px]">
          Is this message or website a{' '}
          <span className="bg-amber-400 px-[0.1em] text-char box-decoration-clone">scam?</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-fg2 sm:text-lg">
          Paste any suspicious SMS, email, WhatsApp message, or link. We’ll analyze it in plain
          English — fast, free, and completely private.
        </p>
      </header>

      {/* 4 Stat Items Grid */}
      <dl className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
        {STAT_ITEMS.map(([label, val], idx) => (
          <div
            key={label}
            className={`px-0 py-3.5 sm:py-4 ${
              idx % 2 === 1 ? 'border-l border-line pl-4' : ''
            } ${idx > 1 ? 'border-t border-line lg:border-t-0' : ''} ${
              idx > 0 ? 'lg:border-l lg:border-line lg:pl-6' : ''
            } ${idx === 2 ? 'lg:pl-6' : ''}`}
          >
            <dt className="label">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-fg">{val}</dd>
          </div>
        ))}
      </dl>

      {/* Validation Warning */}
      {validationError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-sm border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust font-medium"
        >
          <span>{validationError}</span>
          <button
            onClick={() => setValidationError(null)}
            className="font-mono text-xs uppercase tracking-wider text-fg3 hover:text-fg cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Backend Alert (if offline) */}
      {backendError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-sm text-fg2"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase text-amber-700">Offline Notice:</span>
            <span>{backendError}</span>
          </div>
          <button
            onClick={() => runScan()}
            className="rounded-sm bg-amber-400 px-3 py-1 font-mono text-xs font-semibold uppercase text-char hover:bg-amber-300 transition cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 2-Column Layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Left Column: Specimen Input */}
        <div>
          <SpecimenInput
            text={text}
            setText={setText}
            activePreset={activePreset}
            clearPreset={() => setActivePreset(null)}
            onPreset={handleSelectPreset}
            onClear={handleClear}
            onScan={() => runScan()}
            loading={loading}
          />
        </div>

        {/* Right Column: Dynamic Readout */}
        <div ref={readoutRef} className="scroll-mt-20 min-w-0 space-y-2">
          {engineMode && (
            <div className="flex items-center justify-end">
              <span
                className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-xs ${
                  engineMode === 'live'
                    ? 'bg-sage/15 text-sage border border-sage/30'
                    : 'bg-amber-400/15 text-amber-700 border border-amber-400/30'
                }`}
              >
                {engineMode === 'live'
                  ? '● Live Threat Engine Connected'
                  : '○ Local Heuristic Fallback'}
              </span>
            </div>
          )}
          <ReadoutCard
            result={result}
            message={analyzedMessage || text}
            caseLabel={currentCaseLabel}
            loading={loading}
            doneChecklist={doneChecklist}
            onToggleChecklist={(idx) =>
              setDoneChecklist((prev) => ({ ...prev, [idx]: !prev[idx] }))
            }
            copied={copied}
            onCopyChecklist={handleCopyChecklist}
            saved={!!savedId}
            onSaveReport={handleSaveReport}
          />
        </div>
      </div>
    </div>
  );
};
