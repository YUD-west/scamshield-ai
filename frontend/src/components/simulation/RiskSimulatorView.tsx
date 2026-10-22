import React, { useEffect, useState } from 'react';
import { Loader2, ArrowRight, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';
import { SimulationResponse, ThreatCategory } from '../../types';
import { apiService } from '../../services/api';

const SCENARIOS: {
  icon: string;
  label: string;
  category: ThreatCategory;
  shortDesc: string;
  defaultStages: {
    t: string;
    sub: string;
    d: string;
    sign: string;
    stop: string;
  }[];
}[] = [
  {
    icon: '🏦',
    label: 'Fake Bank Alert',
    category: 'PHISHING',
    shortDesc: 'Fake text alerts lure you to lookalike login portals.',
    defaultStages: [
      {
        t: '1. The Hook',
        sub: 'Initial Scare or Prize',
        d: "A scary text arrives: 'URGENT: Your Chase account is locked due to unusual activity. Verify now!'",
        sign: 'Artificial urgency, rushed language, threatening to close your account within 24 hours.',
        stop: 'Pause and take a breath. Real banks never send SMS links asking you to log in to fix a freeze.',
      },
      {
        t: '2. The Fake Page',
        sub: 'Cloned Website Replica',
        d: 'The link opens a website that looks identical to your real bank, but the web address has trick letters.',
        sign: "Subtle domain differences like chase-secure.xyz or paypa1.com with numbers replacing letters.",
        stop: 'Check the browser address bar. Type your bank’s real web address manually or open your official mobile app.',
      },
      {
        t: '3. The Steal',
        sub: 'Harvesting Passwords & Codes',
        d: 'You are prompted for your login password and the two-factor security code sent to your phone.',
        sign: 'Forms asking for your PIN, Social Security Number, or one-time verification passcodes (OTP).',
        stop: 'Never give verification codes to anyone. Real bank employees will never ask for your temporary code.',
      },
      {
        t: '4. The Damage',
        sub: 'Account Takeover & Theft',
        d: 'The scammer uses your credentials to drain funds, transfer money via Zelle, or buy gift cards.',
        sign: 'Sudden confirmation alerts for transfers you never authorized or being locked out of your account.',
        stop: 'Call the trusted phone number printed directly on the back of your debit card to freeze the account immediately.',
      },
    ],
  },
  {
    icon: '💸',
    label: 'Crypto Doubler',
    category: 'FINANCIAL_FRAUD',
    shortDesc: 'Fake investment platforms that show fake profits then demand extra fees.',
    defaultStages: [
      {
        t: '1. The Hook',
        sub: 'Too Good to Be True',
        d: "A social media post or message says: 'Send 0.1 BTC to our automated AI trading bot and double it in 24 hours!'",
        sign: 'Promises of 100% guaranteed returns with zero risk and testimonials from fake celebrity accounts.',
        stop: 'Remember: In finance, guaranteed double returns are 100% mathematically impossible scams. Block and ignore.',
      },
      {
        t: '2. The Fake Dashboard',
        sub: 'Illusion of Rapid Wealth',
        d: 'You deposit a small test sum, and the platform shows a flashy dashboard where your balance multiplies by 10x.',
        sign: 'The balance numbers increase on the screen, but you cannot independently verify it on a real blockchain.',
        stop: 'The dashboard numbers are just computer code written by the scammer. Your initial crypto is already gone.',
      },
      {
        t: '3. The Withdrawal Fee Trap',
        sub: 'Extorting Additional Money',
        d: "When you try to cash out, support says: 'You must pay a $450 liquidity tax before your funds can be released.'",
        sign: 'Demanding additional upfront money to withdraw money you supposedly already own.',
        stop: 'Do NOT send another dollar. Paying the fee will not release anything; it only increases your total loss.',
      },
      {
        t: '4. The Disappearance',
        sub: 'Total Ghosting',
        d: 'Once you refuse to pay more fees, your login is deleted and the scammer stops answering your messages.',
        sign: 'Broken website links, deleted Telegram groups, and non-responsive support tickets.',
        stop: 'Preserve wallet addresses and chat screenshots, then file a report with your local police and the FTC.',
      },
    ],
  },
  {
    icon: '📷',
    label: 'Webcam Blackmail',
    category: 'COERCION_EXTORTION',
    shortDesc: 'Scammers use old leaked passwords to trick you into believing they recorded you.',
    defaultStages: [
      {
        t: '1. The Hook',
        sub: 'Old Leaked Password Scare',
        d: "An email arrives saying: 'I recorded you through your webcam on adult sites. Your password is hunter2.'",
        sign: 'They cite an old password of yours that was leaked years ago in a public database breach.',
        stop: 'Don’t panic. They do not have video of you. They bought a cheap leaked password list on the dark web.',
      },
      {
        t: '2. The Fake Malware Claim',
        sub: 'Technical Jargon Bluff',
        d: 'The sender claims they installed remote trojan malware and filmed split-screen footage of you and your screen.',
        sign: 'Vague descriptions of what you supposedly did, without attaching any real screenshot or proof.',
        stop: 'Notice they provide zero actual video or photo evidence. It is a mass-mailed generic template sent to millions.',
      },
      {
        t: '3. The Bitcoin Ransom',
        sub: 'Countdown Pressure',
        d: "They demand $900 in Bitcoin within 48 hours or threaten to send the video to your friends, family, and coworkers.",
        sign: 'Aggressive countdown timers, threats to ruin your reputation, and Bitcoin payment demands.',
        stop: 'Never pay blackmailers. Paying signals that you are terrified and encourages them to demand even more.',
      },
      {
        t: '4. The Safe Resolution',
        sub: 'Nothing Happens',
        d: 'You change any accounts that still used that old password, turn on two-factor authentication, and delete the email.',
        sign: 'The countdown passes and absolutely nothing happens because they had no video to begin with.',
        stop: 'Mark the email as phishing spam, update any old reused passwords, and enjoy your peace of mind.',
      },
    ],
  },
  {
    icon: '🏛️',
    label: 'IRS / Police Threat',
    category: 'IMPERSONATION',
    shortDesc: 'Scammers pose as government agents demanding gift cards or wire transfers.',
    defaultStages: [
      {
        t: '1. The Hook',
        sub: 'Hostile Law Enforcement Scare',
        d: "An aggressive call or text says: 'This is the IRS. A warrant is out for your arrest due to unpaid federal taxes.'",
        sign: 'Aggressive threats of immediate police arrival, federal lawsuits, and background siren sound effects.',
        stop: 'Hang up. Real government agencies (IRS, Police, FBI) communicate by certified postal mail, never angry texts.',
      },
      {
        t: '2. The Isolation Tactic',
        sub: 'Preventing Second Opinions',
        d: "They tell you: 'Do NOT hang up or speak to your family or a lawyer, or police units will enter your home.'",
        sign: 'Forcing you to stay on the line to prevent you from calmly calling someone who would spot the scam.',
        stop: 'Immediately hang up the phone. Nobody gets arrested for disconnecting a phone call.',
      },
      {
        t: '3. The Untraceable Payment',
        sub: 'Retail Gift Card Scheme',
        d: "They direct you to drive to a nearby store and buy Apple, Target, or Google Play gift cards to clear the fine.",
        sign: 'Demanding payment via retail gift cards, wire transfer, Western Union, or a Bitcoin ATM.',
        stop: 'No government agency or court ever accepts gift cards as payment. Gift cards are strictly for gifts.',
      },
      {
        t: '4. The Consequence',
        sub: 'Irreversible Loss',
        d: 'If you read the gift card PINs to the scammer, they redeem them online within seconds and disconnect.',
        sign: 'Sudden call disconnection and loss of non-refundable cash.',
        stop: 'If you were targeted, file a complaint with the FTC at reportfraud.ftc.gov to help alert authorities.',
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
      sub: `Stage ${st.stage_number} Attack Phase`,
      d: st.realistic_action,
      sign: st.warning_signs?.join(', ') || st.attacker_objective,
      stop: st.prevention_gate,
    })) || currentScenario.defaultStages;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <section className="text-center pt-2 pb-6 max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 border border-border px-4 py-1.5 text-xs font-semibold shadow-sm">
          <HelpCircle className="w-3.5 h-3.5 text-safe" />
          <span className="text-foreground">Interactive Scam Defense Guide</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display">
          How Scams{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-teal-300 bg-clip-text text-transparent">
            Actually Work
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed">
          See the psychological tricks scammers use at every step of an attack — and exactly where you can stop them dead in their tracks.
        </p>
      </section>

      {/* Scenario Selector Pills */}
      <div className="glass p-3 rounded-2xl flex flex-wrap gap-2 justify-center shadow-lg">
        {SCENARIOS.map((s) => {
          const isActive = selectedCategory === s.category;
          return (
            <button
              key={s.category}
              onClick={() => setSelectedCategory(s.category)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 select-none ${
                isActive
                  ? 'bg-safe text-primary-foreground font-bold shadow-md shadow-safe/30 scale-[1.02]'
                  : 'btn-ghost'
              }`}
            >
              <span className="text-base">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="glass p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-safe" />
          <span className="text-sm font-medium">Mapping out scenario kill-chain and safety gates...</span>
        </div>
      )}

      {/* 4 Interactive Responsive Stage Cards */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stages.map((s, idx) => (
            <div
              key={s.t}
              className="glass p-6 sm:p-7 space-y-5 card-interactive flex flex-col justify-between border border-border/80 shadow-xl relative overflow-hidden"
            >
              {/* Top Accent Pill */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-safe flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span>{s.sub}</span>
                  </span>

                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border font-medium">
                    Step {idx + 1} of 4
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
                  {s.t}
                </h2>

                <p className="text-foreground/90 leading-relaxed text-sm sm:text-base font-medium">
                  {s.d}
                </p>

                {/* Warning Signs */}
                <div className="p-3.5 rounded-xl bg-caution/10 border border-caution/30 text-xs sm:text-sm text-foreground/90 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-caution shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-caution font-bold block mb-0.5">Warning sign:</strong>
                    <span>{s.sign}</span>
                  </div>
                </div>
              </div>

              {/* Stop Gate Emerald Box */}
              <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 p-4 sm:p-5 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100">
                  <ShieldCheck className="w-4 h-4" />
                  <span>How to Stop It Right Here:</span>
                </div>
                <p className="text-white leading-relaxed font-bold text-sm sm:text-base pt-0.5">
                  {s.stop}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Takeaway Card */}
      <div className="glass p-6 sm:p-8 rounded-3xl border border-border/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-white font-display">
            Have a message that matches this pattern?
          </h3>
          <p className="text-sm text-muted-foreground">
            Paste it into our main scanner to get an instant AI safety check and custom action checklist.
          </p>
        </div>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn-primary text-sm py-3 px-6 shrink-0 flex items-center gap-2"
        >
          <span>Check a Message Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
