import React from 'react';
import { ShieldCheck, Shield, BookOpen, FileCheck, CheckCircle2 } from 'lucide-react';
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
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#080C14]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div
          onClick={() => onTabChange('triage')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/10 group-hover:scale-105 transition-transform duration-200">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Scam<span className="text-blue-400">Shield</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                AI Assistant
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Check messages, emails, and links before you click
            </p>
          </div>
        </div>

        {/* Friendly Navigation Pills */}
        <nav className="flex items-center p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-inner">
          <button
            onClick={() => onTabChange('triage')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'triage'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Check for Scams</span>
          </button>

          <button
            onClick={() => onTabChange('simulator')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">How Scams Work</span>
            <span className="sm:hidden">Scams</span>
          </button>

          <button
            onClick={() => onTabChange('incident')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'incident'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Saved Reports</span>
            <span className="sm:hidden">Reports</span>
          </button>
        </nav>

        {/* Protection Active Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${
              healthLoading
                ? 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                : isHealthy
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                healthLoading ? 'bg-slate-400' : isHealthy ? 'bg-emerald-400' : 'bg-red-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                healthLoading ? 'bg-slate-500' : isHealthy ? 'bg-emerald-500' : 'bg-red-500'
              }`} />
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">
              {healthLoading ? 'Connecting AI...' : isHealthy ? 'AI Defense Active' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
