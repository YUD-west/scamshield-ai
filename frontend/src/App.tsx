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

      {/* Modern Friendly Footer */}
      <footer className="border-t border-white/5 bg-[#080C14] py-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-white font-bold">ScamShield AI</span>
            <span className="text-slate-500">&bull;</span>
            <span>Protecting everyday people from online scams</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              100% Private (No Log Retention)
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-400" />
              Never Opens Suspicious Links
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Real AI Threat Detection
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
