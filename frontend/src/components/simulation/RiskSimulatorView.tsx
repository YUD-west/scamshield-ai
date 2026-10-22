import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { SimulationResponse, ThreatCategory } from '../../types';
import { apiService } from '../../services/api';

const SCENARIO_PRESETS: { icon: string; label: string; category: ThreatCategory; desc: string }[] = [
  {
    icon: '🎣',
    label: 'Fake Bank Login',
    category: 'PHISHING',
    desc: 'How scammers send fake text alerts to lure you to lookalike login portals.',
  },
  {
    icon: '💸',
    label: 'Get-Rich Crypto Scam',
    category: 'FINANCIAL_FRAUD',
    desc: 'How fake investment sites show fake profits then demand extra fees to withdraw.',
  },
  {
    icon: '📷',
    label: 'Webcam Blackmail',
    category: 'COERCION_EXTORTION',
    desc: 'How scammers use old leaked passwords to trick you into believing they filmed you.',
  },
  {
    icon: '🏛️',
    label: 'Fake IRS / Police Call',
    category: 'IMPERSONATION',
    desc: 'How scammers pose as government agents and demand gift cards or wire transfers.',
  },
  {
    icon: '🚨',
    label: 'Dangerous Threats',
    category: 'VIOLENT_THREAT',
    desc: 'How threats to physical safety work and what real emergency steps to take.',
  },
];

interface RiskSimulatorViewProps {
  initialCategory?: ThreatCategory;
  initialText?: string;
  initialUrl?: string;
}

export const RiskSimulatorView: React.FC<RiskSimulatorViewProps> = ({
  initialCategory = 'PHISHING',
  initialText = '',
  initialUrl = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ThreatCategory>(initialCategory);
  const [customText, setCustomText] = useState(initialText);
  const [customUrl, setCustomUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [scenarioData, setScenarioData] = useState<SimulationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSimulation = async (category: ThreatCategory, text?: string, url?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiService.simulateScenario({
        category,
        observed_text: text?.trim() || undefined,
        domain_or_url: url?.trim() || undefined,
      });
      setScenarioData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load this scam guide.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulation(selectedCategory, customText, customUrl);
  }, []);

  const handleSelectPreset = (cat: ThreatCategory) => {
    setSelectedCategory(cat);
    fetchSimulation(cat, customText, customUrl);
  };

  const handleCustomSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSimulation(selectedCategory, customText, customUrl);
  };

  const handleReset = () => {
    setCustomText('');
    setCustomUrl('');
    setSelectedCategory('PHISHING');
    fetchSimulation('PHISHING');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                How Scammers Trick People (Interactive Guide)
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                See the exact steps scammers take, the warning signs at each step, and how to stop them before you lose money.
              </p>
            </div>
          </div>
        </div>

        {/* Preset Category Switcher */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Choose a scam type to see how it works:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {SCENARIO_PRESETS.map((p) => {
              const active = selectedCategory === p.category;
              return (
                <button
                  key={p.category}
                  onClick={() => handleSelectPreset(p.category)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    active
                      ? 'bg-indigo-950/70 border-indigo-500/80 text-white shadow-lg shadow-indigo-950/50 scale-[1.02]'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{p.icon}</span>
                      {active && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                    </div>
                    <span className="text-xs font-bold text-white block mb-1">{p.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Context Form */}
        <form onSubmit={handleCustomSimulate} className="pt-3 border-t border-white/5 space-y-3">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Want to see how your specific suspicious message or website works? (Optional):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="e.g. paste suspicious website link here"
              className="glass-input rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. paste words from the message here"
              className="glass-input rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Building Guide...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Show Me How This Scam Works
                </>
              )}
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-16 text-center space-y-3 glass-panel rounded-3xl">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            Mapping out the scam progression and safety steps...
          </p>
        </div>
      )}

      {/* Output Story */}
      {!isLoading && scenarioData && (
        <div className="space-y-6">
          {/* Overview Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-[#080C14] border border-indigo-500/30 shadow-xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Scam Breakdown
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {scenarioData.scenario_name}
            </h2>
            <p className="text-sm text-slate-300 pt-1 leading-relaxed">
              <strong>How they reach you:</strong> {scenarioData.attack_vector}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>The 4 Steps of this Scam:</span>
            </div>

            <div className="space-y-4">
              {scenarioData.hypothetical_progression.map((stage) => (
                <div
                  key={stage.stage_number}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors shadow-sm backdrop-blur"
                >
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {stage.stage_number}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {stage.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold uppercase text-[11px] block">
                        What the Scammer is Trying to Do:
                      </span>
                      <p className="text-slate-200 leading-relaxed font-sans">{stage.attacker_objective}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold uppercase text-[11px] block">
                        What Actually Happens:
                      </span>
                      <p className="text-slate-200 leading-relaxed font-sans">{stage.realistic_action}</p>
                    </div>
                  </div>

                  {/* Warning signs */}
                  {stage.warning_signs && stage.warning_signs.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Warning Signs to Spot at this Step:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                        {stage.warning_signs.map((ws, i) => (
                          <li key={i} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                            <span className="text-amber-400 font-bold">&bull;</span>
                            <span>{ws}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prevention Gate Highlight */}
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-emerald-300 font-bold text-xs uppercase tracking-wide block">
                        🛡️ How You Can Stop the Scam Right Here:
                      </strong>
                      <span className="text-emerald-100/90 leading-relaxed">
                        {stage.prevention_gate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Potential Consequences & Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-3 backdrop-blur">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>What Happens if You Fall for It:</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {scenarioData.potential_consequences.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                    <ArrowRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-3 backdrop-blur">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Summary: Rules to Stay Safe:</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {scenarioData.recommended_prevention_gates.map((g, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
