import React from 'react';
import { Terminal, Shield, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RiskSimulatorView: React.FC = () => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8 space-y-6 shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          <Terminal className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white">
            Safe Risk & Attack Scenario Simulator
          </h2>
          <p className="text-xs text-slate-400">
            Model hypothetical threat progressions to understand attack chains and place prevention gates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-bold uppercase">
            <AlertCircle className="w-4 h-4" />
            <span>Stage 1: Lure Delivery</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Attacker transmits urgent notification claiming compromised credentials or fraudulent transactions.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-900">
            Defense Gate: <strong>Email/SMS SPF/DKIM verification</strong>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-orange-400 font-bold uppercase">
            <ArrowRight className="w-4 h-4" />
            <span>Stage 2: Deceptive Portal</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            User is directed to a lookalike domain with homoglyphic deception to harvest username, password, and session token.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-900">
            Defense Gate: <strong>FIDO2 / Hardware Security Keys</strong>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase">
            <Shield className="w-4 h-4" />
            <span>Stage 3: Account Takeover</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Immediate unauthorized password reset, session interception, and secondary extortion attempts.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-900">
            Defense Gate: <strong>Bank Fraud Alert & Account Freeze</strong>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs font-mono text-blue-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          Milestone 3 engine integration ready. Provides dynamic scenario modeling based on active triage results.
        </span>
      </div>
    </div>
  );
};
