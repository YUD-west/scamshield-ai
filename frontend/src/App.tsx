import React, { useEffect, useState } from 'react';
import { EyeOff, Lock, Cpu } from 'lucide-react';
import { Header } from './components/common/Header';
import { TriageScanner } from './components/triage/TriageScanner';
import { RiskSimulatorView } from './components/simulation/RiskSimulatorView';
import { IncidentVaultView } from './components/incident/IncidentVaultView';
import { HealthResponse } from './types';
import { apiService } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'triage' | 'simulator' | 'incident'>('triage');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Cross-module simulation context
  const [simContext, setSimContext] = useState<{
    category?: any;
    text?: string;
    url?: string;
  }>({});

  const handleTriggerSimulation = (category: any, text?: string, url?: string) => {
    setSimContext({ category, text, url });
    setActiveTab('simulator');
  };

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const res = await apiService.getHealth();
        if (isMounted) setHealth(res);
      } catch (err) {
        if (isMounted) setHealth(null);
      } finally {
        if (isMounted) setHealthLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col text-foreground font-sans">
      {/* Header Bar */}
      <Header
        health={health}
        healthLoading={healthLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 pb-20">
        {activeTab === 'triage' && (
          <TriageScanner onSimulateScenario={handleTriggerSimulation} />
        )}
        {activeTab === 'simulator' && (
          <RiskSimulatorView
            key={`${simContext.category}-${simContext.url}-${simContext.text}`}
            initialCategory={simContext.category || 'PHISHING'}
            initialText={simContext.text || ''}
            initialUrl={simContext.url || ''}
          />
        )}
        {activeTab === 'incident' && <IncidentVaultView />}
      </main>

      {/* Friendly Footer */}
      <footer className="border-t border-border bg-black/20 py-8 text-xs text-muted-foreground mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span className="text-foreground font-bold">ScamShield AI</span>
            <span>&bull;</span>
            <span>Protecting everyday people from online scams</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-safe" />
              100% Private (No Log Retention)
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-safe" />
              Never Opens Suspicious Links
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-safe" />
              Real AI Threat Detection
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
