import React from 'react';
import { ShieldCheck, BookOpen, FileCheck, Sparkles, Activity } from 'lucide-react';
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

  const navLinks = [
    { id: 'triage' as const, label: 'Check for Scams', icon: ShieldCheck, badge: 'Live AI' },
    { id: 'simulator' as const, label: 'How Scams Work', icon: BookOpen, badge: 'Guide' },
    { id: 'incident' as const, label: 'Saved Reports', icon: FileCheck, badge: 'Vault' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#06150d]/80 border-b border-border/60 transition-all duration-300">
      <div className="w-full max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 h-20 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => onTabChange('triage')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-green-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 border border-white/20 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300">
              <span className="text-2xl">🛡️</span>
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#06150d]" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                ScamShield <span className="text-primary font-extrabold">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5" />
                NextGen 2.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground/80 hidden md:block">
              Intelligent Scam Triage & Evidence Protection
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1.5 rounded-2xl bg-black/40 border border-border/80 backdrop-blur-xl shadow-inner">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                <span>{link.label}</span>
                {isActive && (
                  <span className="hidden lg:inline-block text-[9px] uppercase px-1.5 py-0.2 rounded-md bg-white/20 font-bold tracking-wide">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Protection Status Pill */}
        <div className="hidden md:flex items-center gap-3">
          <div className="inline-flex items-center gap-2.5 rounded-full bg-secondary/70 border border-border px-3.5 py-1.5 text-xs">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  healthLoading
                    ? 'bg-amber-400'
                    : isHealthy
                    ? 'bg-emerald-400'
                    : 'bg-red-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  healthLoading
                    ? 'bg-amber-400'
                    : isHealthy
                    ? 'bg-emerald-400'
                    : 'bg-red-500'
                }`}
              />
            </span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-foreground">
              {healthLoading ? 'Connecting AI...' : isHealthy ? 'AI Defense Active' : 'System Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
