import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { SimulationResponse, ThreatCategory } from '../../types';
import { apiService } from '../../services/api';

const SCENARIOS: { icon: string; label: string; category: ThreatCategory; defaultStages: { t: string; d: string; sign: string; stop: string }[] }[] = [
  {
    icon: '🏦',
    label: 'Fake Bank SMS',
    category: 'PHISHING',
    defaultStages: [
      {
        t: '1. The Hook',
        d: "A scary text arrives: 'Your bank account is locked due to unusual activity. Verify now!'",
        sign: 'Urgency, threats of account closure, and rushed language.',
        stop: 'Pause. Real banks never ask you to verify logins via an SMS link.',
      },
      {
        t: '2. The Fake Page',
        d: 'The link opens a fake website that looks almost identical to your real bank login portal.',
        sign: "Odd web address like chase-secure.xyz or paypa1.com with typo letters.",
        stop: 'Look closely at the browser address bar. Type your bank website manually.',
      },
      {
        t: '3. The Steal',
        d: 'You are asked to enter your username, password, and the two-factor SMS code sent to your phone.',
        sign: 'Requests for one-time passcodes (OTP) or security PINs.',
        stop: 'Never share security codes. Banks will never ask for them.',
      },
      {
        t: '4. The Damage',
        d: 'The scammer logs into your real bank account and drains your funds or initiates wire transfers.',
        sign: 'Unknown transfer notifications or sudden password reset emails.',
        stop: 'Call your bank immediately using the trusted phone number on the back of your card.',
      },
    ],
  },
  {
    icon: '💸',
    label: 'Crypto Doubler',
    category: 'FINANCIAL_FRAUD',
    defaultStages: [
      {
        t: '1. The Hook',
        d: "An ad or DM promises: 'Send 0.1 BTC and our AI algorithm will double your money in 24 hours!'",
        sign: 'Guaranteed profits, zero risk claims, and high pressure.',
        stop: 'Nobody gives free money. Guaranteed returns in crypto are 100% scams.',
      },
      {
        t: '2. The Fake Dashboard',
        d: 'You deposit a small amount and the website shows a fake dashboard where your balance rapidly multiplies.',
        sign: 'Profits look impossibly high and automatic.',
        stop: 'The dashboard numbers are fake animations. The scammers already pocketed your money.',
      },
      {
        t: '3. The Withdrawal Fee Trap',
        d: "When you try to cash out, they tell you: 'Pay a 10% tax or gas fee first to unlock your funds.'",
        sign: 'Demands for more money to withdraw your own money.',
        stop: 'Stop sending funds. Paying more will never get your initial money back.',
      },
      {
        t: '4. The Ghosting',
        d: 'Once you refuse to send more money, your account is blocked and the scammer stops replying.',
        sign: 'Broken website links and deleted Telegram/WhatsApp accounts.',
        stop: 'Report the scam wallet address and preserve chat screenshots for police dispute.',
      },
    ],
  },
  {
    icon: '📷',
    label: 'Webcam Blackmail',
    category: 'COERCION_EXTORTION',
    defaultStages: [
      {
        t: '1. The Hook',
        d: "An email says: 'I hacked your webcam while you watched dirty videos. Your old password is hunter2.'",
        sign: 'Quoting an old leaked password from a previous public data breach.',
        stop: 'They do not have a video. They bought an old password list on the dark web.',
      },
      {
        t: '2. The Fake Proof',
        d: "The email claims they installed malware that recorded split-screen footage of your face and screen.",
        sign: 'Vague descriptions of what you supposedly watched with no actual video attached.',
        stop: 'Notice they provide zero real screenshot or video proof.',
      },
      {
        t: '3. The Extortion Demand',
        d: "They demand $900 in Bitcoin within 48 hours or threaten to send the video to your family and coworkers.",
        sign: 'Countdown timers and aggressive threats to ruin your reputation.',
        stop: 'Do NOT pay. Paying only proves you are afraid and invites more blackmail demands.',
      },
      {
        t: '4. The Relief',
        d: 'You change the leaked password on any old accounts, enable two-factor auth, and delete the email.',
        sign: 'Nothing happens after the deadline passes because they had no video.',
        stop: 'Block the sender, delete the message, and carry on with your day safely.',
      },
    ],
  },
  {
    icon: '🏛️',
    label: 'IRS / Police Threat',
    category: 'IMPERSONATION',
    defaultStages: [
      {
        t: '1. The Hook',
        d: "An aggressive caller or text claims: 'This is the IRS. A warrant is out for your arrest for tax evasion.'",
        sign: 'Hostile tone, threats of immediate police dispatch, and background sirens.',
        stop: 'Government agencies contact you by official postal mail, never angry texts or phone calls.',
      },
      {
        t: '2. The Isolation',
        d: "They tell you: 'Do NOT hang up or speak to anyone, or officers will immediately raid your home.'",
        sign: 'Attempting to keep you on the line so you cannot ask family or friends for advice.',
        stop: 'Hang up immediately. You will not get arrested for hanging up on a scammer.',
      },
      {
        t: '3. The Untraceable Payment',
        d: "They instruct you to go to Target or Walmart and buy Apple or Google Play gift cards to pay the fine.",
        sign: 'Demands for payment via gift cards, wire transfer, or Bitcoin ATM.',
        stop: 'No government agency accepts gift cards as legal tender. Ever.',
      },
      {
        t: '4. The Loss',
        d: 'You read the card numbers over the phone, and the scammers drain the cards within seconds.',
        sign: 'Immediate hung-up call and loss of non-refundable gift card funds.',
        stop: 'File an official dispute report with the FTC at reportfraud.ftc.gov.',
      },
    ],
  },
];

interface RiskSimulatorViewProps {
  initialCategory?: ThreatCategory;
  initialText?: string;
  initialUrl?: string;
}

export const RiskSimulatorView: React.FC<RiskSimulatorViewProps> = ({
  initialCategory = 'PHISHING',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ThreatCategory>(initialCategory);
  const [loading, setLoading] = useState(false);
  const [backendData, setBackendData] = useState<SimulationResponse | null>(null);

  const currentScenario =
    SCENARIOS.find((s) => s.category === selectedCategory) || SCENARIOS[0];

  useEffect(() => {
    let isMounted = true;
    const loadSim = async () => {
      setLoading(true);
      try {
        const res = await apiService.simulateScenario({ category: selectedCategory });
        if (isMounted) setBackendData(res);
      } catch (err) {
        // Fallback to local default stages if backend is momentarily unreachable
        if (isMounted) setBackendData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadSim();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  const stages =
    backendData?.hypothetical_progression?.map((st) => ({
      t: `${st.stage_number}. ${st.title}`,
      d: st.realistic_action,
      sign: st.warning_signs?.join(', ') || st.attacker_objective,
      stop: st.prevention_gate,
    })) || currentScenario.defaultStages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="py-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          How Scams Work
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          See how scams unfold step by step and exactly where to stop them before you lose money.
        </p>
      </section>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => {
          const isActive = selectedCategory === s.category;
          return (
            <button
              key={s.category}
              onClick={() => setSelectedCategory(s.category)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-secondary text-foreground border border-safe shadow-sm font-bold'
                  : 'btn-ghost'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="glass p-12 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-safe" />
          <span>Loading scam breakdown...</span>
        </div>
      )}

      {/* 4 Cards in 2x2 Grid matching Lovable */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {stages.map((s) => (
            <div key={s.t} className="glass space-y-3.5 p-6 flex flex-col justify-between">
              <div className="space-y-2.5">
                <h2 className="text-2xl font-bold text-foreground">{s.t}</h2>
                <p className="text-muted-foreground leading-relaxed text-base">{s.d}</p>
                <p className="text-sm">
                  ⚠️ <b className="text-foreground">Warning sign:</b>{' '}
                  <span className="text-caution">{s.sign}</span>
                </p>
              </div>

              <div className="rounded-2xl bg-primary p-4 font-semibold text-primary-foreground text-sm shadow-md shadow-primary/20">
                🛡️ <b>How to Stop It Right Here:</b> {s.stop}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
