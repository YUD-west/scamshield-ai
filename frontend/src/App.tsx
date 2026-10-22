import React, { useEffect, useState } from 'react';
import { EyeOff, Lock, ShieldCheck, Zap } from 'lucide-react';
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen flex flex-col text-foreground font-sans relative overflow-x-hidden selection:bg-safe selection:text-black">
      {/* Dynamic Ambient Background Orbs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 left-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header Bar */}
      <Header
        health={health}
        healthLoading={healthLoading}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Full-Width Responsive Container */}
      <main className="flex-1 w-full max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-10">
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

      {/* Modern Live Feature Bar */}
      <section className="w-full border-t border-border/50 bg-[#06150d]/60 backdrop-blur-xl py-6">
        <div className="w-full max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/40 border border-border/50">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                <EyeOff className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-semibold">100% Private Checks</strong>
                <span className="text-muted-foreground/80">Zero logs stored remotely</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/40 border border-border/50">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Sandbox Link Safety</strong>
                <span className="text-muted-foreground/80">Inspects links without opening</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/40 border border-border/50">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Real-Time AI Inspection</strong>
                <span className="text-muted-foreground/80">Analyzes trick letters & traps</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card/40 border border-border/50">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Police-Grade Evidence</strong>
                <span className="text-muted-foreground/80">SHA-256 sealed reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* World-Class Modern Footer */}
      <footer className="border-t border-border/40 bg-[#040e09] py-8 text-xs text-muted-foreground">
        <div className="w-full max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <span className="text-white font-bold text-sm tracking-tight font-display">
                ScamShield AI
              </span>
            </div>
            <span className="hidden sm:inline text-muted-foreground/50">&bull;</span>
            <span className="text-muted-foreground/90">
              Empowering people against online deception, phishing & digital fraud.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground/80">
            <span className="flex items-center gap-1.5 text-safe">
              <span className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse" />
              Engine Online
            </span>
            <span>FastAPI Backend 1.0</span>
            <span>Vite + React 18</span>
            <span>SHA-256 Tamper Proof</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
