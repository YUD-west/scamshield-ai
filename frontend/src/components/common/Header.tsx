import React from 'react';
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
    { id: 'triage' as const, label: 'Check for Scams' },
    { id: 'simulator' as const, label: 'How Scams Work' },
    { id: 'incident' as const, label: 'Saved Reports' },
  ];

  return (
    <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5">
      {/* Brand */}
      <button
        onClick={() => onTabChange('triage')}
        className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
      >
        <span className="text-2xl">🛡️</span>
        <span>
          ScamShield <span className="text-primary">AI</span>
        </span>
      </button>

      {/* Nav Links */}
      <div className="flex items-center gap-3">
        <nav className="flex gap-1 text-sm bg-card/60 p-1 rounded-2xl border border-border backdrop-blur">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`rounded-xl px-3.5 py-2 transition-all font-medium ${
                  isActive
                    ? 'bg-secondary text-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Protection Active Indicator */}
        <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-secondary/80 border border-border px-3.5 py-1.5 text-xs text-muted-foreground">
          <span
            className={`h-2 w-2 rounded-full ${
              healthLoading
                ? 'bg-amber-400 animate-pulse'
                : isHealthy
                ? 'bg-safe animate-pulse'
                : 'bg-danger'
            }`}
          />
          <span className="font-semibold text-foreground">
            {healthLoading ? 'Connecting...' : isHealthy ? 'Active' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
