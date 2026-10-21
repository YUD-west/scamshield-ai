import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { SimulationResponse, ThreatCategory } from '../../types';
import { apiService } from '../../services/api';

const SCENARIO_PRESETS: { label: string; category: ThreatCategory; desc: string }[] = [
  {
    label: 'Credential Phishing (AiTM)',
    category: 'PHISHING',
    desc: 'Simulate urgent lures leading to fake login portals and real-time 2FA interception.',
  },
  {
    label: 'High-Yield Investment Fraud',
    category: 'FINANCIAL_FRAUD',
    desc: 'Simulate windfall crypto offers, fake profit dashboards, and advance-fee lockouts.',
  },
  {
    label: 'Sextortion & Coercion',
    category: 'COERCION_EXTORTION',
    desc: 'Simulate leaked password bluffs, webcam exposure threats, and crypto extortion demands.',
  },
  {
    label: 'Authority Impersonation',
    category: 'IMPERSONATION',
    desc: 'Simulate false arrest warrants, victim isolation, and gift card / safe account coercion.',
  },
  {
    label: 'Violent Threat Protocol',
    category: 'VIOLENT_THREAT',
    desc: 'Simulate aggressive danger signals and emergency intervention pathways.',
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
      setErrorMessage(err.message || 'Failed to generate simulation scenario.');
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
                <span className="text-indigo-400">#</span> Risk Simulation & Attack Kill-Chain Modeler
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Explore hypothetical attack progressions to uncover warning signs and establish defensive friction gates before interacting.
              </p>
            </div>
          </div>
        </div>

        {/* Preset Category Switcher */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Select Threat Vector to Model:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {SCENARIO_PRESETS.map((p) => {
              const active = selectedCategory === p.category;
              return (
                <button
                  key={p.category}
                  onClick={() => handleSelectPreset(p.category)}
                  className={`p-3 rounded-lg border text-left transition-all font-mono ${
                    active
                      ? 'bg-indigo-950/70 border-indigo-500/70 text-white shadow-md shadow-indigo-950/50'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{p.label}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 font-sans">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Context Form */}
        <form onSubmit={handleCustomSimulate} className="pt-2 border-t border-slate-850 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Tailor Scenario with Custom Evidence (Optional):
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="e.g. target-domain.xyz or suspicious link"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. message snippet, claimed authority, or demand"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Context
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Simulation...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Run Custom Simulation
                </>
              )}
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Simulation Output Area */}
      {isLoading && (
        <div className="p-12 text-center space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-sm font-mono text-slate-300">
            Synthesizing hypothetical kill chain & defense gates...
          </p>
        </div>
      )}

      {!isLoading && scenarioData && (
        <div className="space-y-6">
          {/* Scenario Overview Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/40 shadow-lg shadow-indigo-950/20 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Modeled Attack Kill-Chain
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold uppercase">
                {scenarioData.threat_category.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-xl font-bold font-mono tracking-tight text-white">
              {scenarioData.scenario_name}
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-1">
              <span>Attack Vector:</span>
              <span className="text-slate-200 font-semibold">{scenarioData.attack_vector}</span>
            </div>
          </div>

          {/* Sequential Attack Stages Timeline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Hypothetical Progression Stages:</span>
            </div>

            <div className="space-y-4">
              {scenarioData.hypothetical_progression.map((stage) => (
                <div
                  key={stage.stage_number}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {stage.stage_number}
                      </span>
                      <h3 className="font-mono text-base font-bold text-white tracking-tight">
                        {stage.title}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="space-y-1">
                      <span className="font-mono text-[11px] text-slate-400 uppercase font-semibold">
                        Attacker Objective:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{stage.attacker_objective}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-[11px] text-slate-400 uppercase font-semibold">
                        Hypothetical Action:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{stage.realistic_action}</p>
                    </div>
                  </div>

                  {/* Warning Signs */}
                  {stage.warning_signs && stage.warning_signs.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <span className="font-mono text-[11px] text-amber-400 uppercase font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Warning Signs at this Phase:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 text-xs text-slate-300 font-sans">
                        {stage.warning_signs.map((ws, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">&bull;</span>
                            <span>{ws}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Critical Prevention Gate */}
                  <div className="mt-3 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs font-sans text-emerald-200 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-mono uppercase tracking-wider text-[11px] text-emerald-300 block">
                        Defense Prevention Gate (Interrupt Kill-Chain Here):
                      </strong>
                      <span className="text-emerald-200/90 leading-relaxed">
                        {stage.prevention_gate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impact and Consequences Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Potential Consequences */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Potential Consequences if Unchecked:</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-sans">
                {scenarioData.potential_consequences.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 rounded bg-slate-950 border border-slate-850">
                    <ArrowRight className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Prevention Gates */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strategic Prevention Checklist:</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-sans">
                {scenarioData.recommended_prevention_gates.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 rounded bg-slate-950 border border-slate-850">
                    <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-lg text-slate-500 text-[11px] flex items-start gap-2 font-mono">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-sans">{scenarioData.safety_disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};
