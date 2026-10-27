import React, { useState } from 'react';
import {
  Hourglass,
  Landmark,
  Wallet,
  Link2,
  ArrowUpRight,
  Bitcoin,
  Camera,
  Building2,
  Coffee,
  Globe,
  Loader2,
} from 'lucide-react';
import { PRESETS } from '../../utils/scamShieldEngine';
import { apiService } from '../../services/api';
import { SimulationResponse, ThreatCategory } from '../../types';

interface RiskSimulatorViewProps {
  onTryPreset?: (preset: (typeof PRESETS)[0]) => void;
  initialCategory?: ThreatCategory;
  initialText?: string;
  initialUrl?: string;
}

const TACTICS = [
  {
    Icon: Hourglass,
    title: 'Manufactured urgency',
    body: 'A deadline or a threat leaves no time to think. Rushed people skip the checks that would expose the scam.',
    sample: 'Verify your account within 24 hours',
  },
  {
    Icon: Landmark,
    title: 'Borrowed authority',
    body: 'Banks, tax agencies, couriers and police are impersonated because we are trained to comply with them.',
    sample: 'IRS FINAL NOTICE: An arrest warrant is issued',
  },
  {
    Icon: Wallet,
    title: 'Payment you can’t undo',
    body: 'Gift cards, crypto and wire transfers are favoured because the money is almost impossible to recover.',
    sample: 'Pay with gift cards immediately',
  },
  {
    Icon: Link2,
    title: 'Lookalike links',
    body: 'One swapped character or an odd ending sends you to a copy of a real site built to harvest your login.',
    sample: 'https://paypa1.com/login',
  },
];

const PRESET_DESCRIPTIONS: Record<string, string> = {
  'Fake Bank SMS':
    'Pretends to be your bank and pushes you to “verify” on a fake page, handing over your login.',
  'Crypto Doubler':
    'Promises guaranteed returns. Anything you send is gone; there is no doubling.',
  'Webcam Blackmail':
    'Claims to hold footage and quotes an old leaked password to seem real. It is almost always a bluff.',
  'IRS Threat':
    'Threatens arrest or penalties. Real agencies do not demand gift cards or immediate payment by text.',
  'Lookalike PayPal':
    'Swaps letters for numbers in a brand name so the link looks right at a glance.',
  'Safe Real Message':
    'For contrast: ordinary, specific, no pressure, no money, no link to act on.',
};

const PRESET_ICONS: Record<string, React.ElementType> = {
  'Fake Bank SMS': Landmark,
  'Crypto Doubler': Bitcoin,
  'Webcam Blackmail': Camera,
  'IRS Threat': Building2,
  'Lookalike PayPal': Link2,
  'Safe Real Message': Coffee,
};

const RULES = [
  ['Pause', 'Urgency is the tell. A real problem survives five minutes of checking.'],
  ['Go direct', 'Open the official app or type the address yourself. Never use the link you were sent.'],
  ['Guard your codes', 'No genuine company asks for PINs or one-time codes by message or phone.'],
  ['Tell someone', 'Scammers rely on secrecy. A second opinion breaks the spell.'],
];

const SIMULATION_CATEGORIES: { category: ThreatCategory; label: string; desc: string }[] = [
  {
    category: 'PHISHING',
    label: 'Phishing & Fake Logins',
    desc: 'Harvests credentials via deceptive lookalike websites and urgent re-authentication alerts.',
  },
  {
    category: 'FINANCIAL_FRAUD',
    label: 'Crypto & Investment Scams',
    desc: 'Lures victims with fake doubling offers, Ponzi schemes, and advance fees.',
  },
  {
    category: 'COERCION_EXTORTION',
    label: 'Blackmail & Sextortion',
    desc: 'Pretends to hold compromising webcam footage and demands non-reversible crypto.',
  },
  {
    category: 'IMPERSONATION',
    label: 'Authority & Brand Spoofing',
    desc: 'Presents fake law enforcement badges or tech support alerts to intimidate victims.',
  },
  {
    category: 'VIOLENT_THREAT',
    label: 'Coercion & Physical Threats',
    desc: 'Extremist threats or violent intimidation demanding ransom payments.',
  },
];

export const RiskSimulatorView: React.FC<RiskSimulatorViewProps> = ({
  onTryPreset,
  initialCategory,
  initialText,
  initialUrl,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ThreatCategory>(
    initialCategory || 'PHISHING'
  );
  const [activeSimulation, setActiveSimulation] = useState<SimulationResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Deep attack progression simulation
  const handleSimulateCategory = async (cat: ThreatCategory = selectedCategory) => {
    setSimLoading(true);
    try {
      const res = await apiService.simulateScenario({
        category: cat,
        observed_text: initialText,
        domain_or_url: initialUrl,
      });
      setActiveSimulation(res);
    } catch {
      setActiveSimulation(null);
    } finally {
      setSimLoading(false);
    }
  };

  // Run automatically if initialCategory was passed from scanner
  React.useEffect(() => {
    if (initialCategory) {
      handleSimulateCategory(initialCategory);
    }
  }, [initialCategory]);

  return (
    <div className="space-y-12 animate-fade">
      {/* Header */}
      <header className="max-w-3xl">
        <div className="label">Field guide</div>
        <h1 className="display mt-4 text-[52px] sm:text-[88px]">
          How scams{' '}
          <span className="bg-amber-400 px-[0.1em] text-char box-decoration-clone">work</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-fg2 sm:text-lg">
          Almost every scam pulls the same four levers. Learn to spot them and you can ignore the rest.
        </p>
      </header>

      {/* Four Common Tactics Section */}
      <section aria-labelledby="levers">
        <h2 id="levers" className="sr-only">
          Four common tactics
        </h2>
        <div className="stagger grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-2">
          {TACTICS.map(({ Icon, title, body, sample }) => (
            <article key={title} className="flex flex-col bg-surface p-5 sm:p-6">
              <Icon className="h-5 w-5 text-amber-700" strokeWidth={1.75} />
              <h3 className="display mt-4 text-[28px]">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-fg2">{body}</p>
              <p className="slip mt-5 px-4 pb-3 pt-4 font-mono text-xs leading-relaxed break-words">
                “{sample}”
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Common Scam Types List */}
      <section aria-labelledby="types">
        <h2 id="types" className="display text-[34px] sm:text-[44px]">
          Common scam types
        </h2>
        <p className="mb-5 mt-2 text-sm text-fg3">
          Run any of these through the checker to see how it reads.
        </p>
        <ul className="panel divide-y divide-line overflow-hidden">
          {PRESETS.map((preset) => {
            const Icon = PRESET_ICONS[preset.label] || Globe;
            return (
              <li key={preset.label}>
                <button
                  onClick={() => onTryPreset && onTryPreset(preset)}
                  className="group flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-sunk sm:items-center sm:px-5 cursor-pointer"
                >
                  <Icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-fg4 group-hover:text-amber-700 sm:mt-0"
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-[15px] font-medium text-fg">{preset.label}</span>
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-amber-700">
                        {preset.badge}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-fg3">
                      {PRESET_DESCRIPTIONS[preset.label]}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-fg3 group-hover:text-amber-700">
                    <span className="hidden sm:inline">Try it</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Four Rules That Beat Most Scams */}
      <section className="rounded-md bg-char p-6 text-bone sm:p-9" aria-labelledby="rules">
        <h2 id="rules" className="display text-[38px] sm:text-[56px]">
          Four rules that beat most scams
        </h2>
        <ul className="mt-8 grid gap-x-12 gap-y-6 sm:grid-cols-2">
          {RULES.map(([title, desc]) => (
            <li key={title} className="border-t-2 border-amber-400 pt-3">
              <div className="font-display text-lg font-bold">{title}</div>
              <p className="mt-1 text-sm leading-relaxed text-ash-300">{desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* AI Attack Vector Deep Dive */}
      <section className="panel p-5 sm:p-7 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="label">Live Attack Simulation</span>
            <h3 className="display text-[32px] sm:text-[44px] mt-2">Interactive Cyber Killchain</h3>
            <p className="text-sm text-fg2 mt-1 max-w-xl">
              Select an attack vector below to simulate the exact 4-stage killchain an adversary executes, along with the defensive gate to stop them.
            </p>
          </div>
          <button
            onClick={() => handleSimulateCategory(selectedCategory)}
            disabled={simLoading}
            className="inline-flex items-center gap-2 rounded-sm bg-amber-400 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-char hover:bg-amber-300 transition-colors cursor-pointer disabled:bg-sunk disabled:text-fg4 self-start sm:self-auto"
          >
            {simLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <span>Run AI Simulation</span>
            )}
          </button>
        </div>

        {/* Category Pill Selector */}
        <div className="flex flex-wrap gap-2 border-y border-line py-3">
          {SIMULATION_CATEGORIES.map((item) => {
            const isSelected = selectedCategory === item.category;
            return (
              <button
                key={item.category}
                onClick={() => {
                  setSelectedCategory(item.category);
                  handleSimulateCategory(item.category);
                }}
                className={`rounded-sm px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-char text-bone border border-char'
                    : 'border border-line bg-page text-fg hover:border-amber-400'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {activeSimulation ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-amber-700 uppercase">
                Observed Scenario: {activeSimulation.threat_category.replace(/_/g, ' ')}
              </span>
              <span className="font-mono text-xs text-fg3">
                Risk Model: 4-Stage Predictive Tree
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activeSimulation.hypothetical_progression.map((stage) => (
                <div key={stage.stage_number} className="border border-line bg-page p-4 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10.5px] uppercase font-bold text-amber-700">
                      Stage {stage.stage_number}
                    </span>
                    <h4 className="font-display text-base font-bold text-fg mt-1">{stage.title}</h4>
                    <p className="text-xs text-fg2 leading-relaxed mt-2">{stage.attacker_objective}</p>
                  </div>
                  <div className="border-t border-dashed border-line pt-2.5 mt-3">
                    <span className="text-[10px] font-mono uppercase text-fg4 block font-semibold">
                      Defensive Gate:
                    </span>
                    <span className="text-xs font-medium text-char block mt-0.5">{stage.prevention_gate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-line2 p-6 text-center text-sm text-fg3">
            Click <strong>Run AI Simulation</strong> or choose a threat category above to inspect its multi-stage attack lifecycle.
          </div>
        )}
      </section>
    </div>
  );
};
