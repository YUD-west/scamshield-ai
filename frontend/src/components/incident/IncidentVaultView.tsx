import React from 'react';
import { ShieldAlert, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const IncidentVaultView: React.FC = () => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-8 space-y-6 shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white">
            Incident Response & Evidence Vault
          </h2>
          <p className="text-xs text-slate-400">
            Cryptographically preserve user-authorized incident logs, hashes, and standardized reporting bundles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
        <div className="p-5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold uppercase">
            <Lock className="w-4 h-4" />
            <span>Cryptographic Integrity</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">
            Every submitted message, URL, and header artifact is computed with a verifiable SHA-256 checksum at the exact capture timestamp.
          </p>
          <div className="p-2.5 bg-black/50 rounded border border-slate-900 text-[11px] text-slate-400">
            Hash: <span className="text-blue-300">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase">
            <FileText className="w-4 h-4" />
            <span>Official Reporting Bundle</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">
            Prepares formatted dispute packages ready for export to financial fraud departments, IC3, or local police authorities.
          </p>
          <div className="text-[11px] text-slate-500 font-sans">
            Includes consent-based geolocation verification boundary (never inferred from IP address or text).
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs font-mono text-blue-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          Milestone 5 engine integration ready. Provides exportable PDF/JSON incident packets.
        </span>
      </div>
    </div>
  );
};
