import React from 'react';
import { ShieldCheck, ShieldAlert, Activity, Lock, Terminal } from 'lucide-react';
import { HealthResponse } from '../../types';

interface HeaderProps {
  health: HealthResponse | null;
  healthLoading: boolean;
  activeTab: 'triage' | 'simulator' | 'incident';
  onTabChange: (tab: 'triage' | 'simulator' | 'incident') => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  healthLoading,
  activeTab,
  onTabChange,
}) => {
  const isHealthy = health?.status === 'operational';

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-white font-mono">
                SCAMSHIELD<span className="text-blue-500">.AI</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 font-semibold">
                SEC-OPS v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Threat Triage, Non-Executing URL Inspection & Incident Defense
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => onTabChange('triage')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'triage'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Triage Scanner
          </button>
          <button
            onClick={() => onTabChange('simulator')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Risk Simulator
          </button>
          <button
            onClick={() => onTabChange('incident')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'incident'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Incident Vault
          </button>
        </nav>

        {/* System Engine Health Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
              healthLoading
                ? 'bg-slate-900 border-slate-800 text-slate-400'
                : isHealthy
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-red-950/40 border-red-500/40 text-red-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                healthLoading
                  ? 'bg-slate-500 animate-ping'
                  : isHealthy
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <Activity className="w-3 h-3" />
            <span className="hidden md:inline">
              {healthLoading
                ? 'Connecting to Engine...'
                : isHealthy
                ? `Ready (${health?.active_services?.length || 4} engines)`
                : 'Backend Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
