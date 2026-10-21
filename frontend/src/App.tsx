import React, { useEffect, useState } from 'react';
import { Shield, EyeOff, Lock, Cpu } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 font-sans">
      {/* Header Bar */}
      <Header
        health={health}
        healthLoading={healthLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Security Operations Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-slate-400 font-bold">ScamShield AI</span>
            <span>&bull; Defensive Threat Operations</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
              Zero Log Retention
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              Non-Executing Analysis
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Decoupled Severity & Confidence
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
