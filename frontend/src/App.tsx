import React, { useEffect, useState } from 'react';
import { Header, ShieldLogo } from './components/common/Header';
import { AuthModal } from './components/common/AuthModal';
import { TriageScanner } from './components/triage/TriageScanner';
import { RiskSimulatorView } from './components/simulation/RiskSimulatorView';
import { IncidentVaultView } from './components/incident/IncidentVaultView';
import { HealthResponse, SavedReport, User } from './types';
import { apiService } from './services/api';
import { getSavedReports, PRESETS } from './utils/scamShieldEngine';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'triage' | 'simulator' | 'incident'>('triage');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [reportCount, setReportCount] = useState(0);
  const [caseCount, setCaseCount] = useState(1);
  const [specimenToAnalyze, setSpecimenToAnalyze] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Cross-module simulation context
  const [simContext, setSimContext] = useState<{
    category?: any;
    text?: string;
    url?: string;
  }>({});

  useEffect(() => {
    // Check URL parameters for PWA shortcut navigation
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'vault' || tabParam === 'incident' || tabParam === 'reports') {
      setActiveTab('incident');
    } else if (tabParam === 'simulator' || tabParam === 'guide') {
      setActiveTab('simulator');
    } else if (tabParam === 'triage') {
      setActiveTab('triage');
    }

    // Restore active user session if token exists
    if (apiService.getStoredToken()) {
      apiService
        .getMe()
        .then((user) => setCurrentUser(user))
        .catch(() => apiService.clearStoredToken());
    }

    // Initial reports count
    const reports = getSavedReports();
    setReportCount(reports.length);

    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const res = await apiService.getHealth();
        if (isMounted) setHealth(res);
      } catch {
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

  const handleTabChange = (tab: 'triage' | 'simulator' | 'incident') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTriggerSimulation = (category: any, text?: string, url?: string) => {
    setSimContext({ category, text, url });
    setActiveTab('simulator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTryPreset = (preset: (typeof PRESETS)[0]) => {
    setSpecimenToAnalyze(preset.text);
    setActiveTab('triage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecheckReport = (report: SavedReport) => {
    setSpecimenToAnalyze(report.message);
    setActiveTab('triage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await apiService.logout();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-page text-fg selection:bg-amber-400 selection:text-char flex flex-col justify-between">
      <div>
        {/* Sticky Header Bar & Mobile Drawer */}
        <Header
          health={health}
          healthLoading={healthLoading}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          reportCount={reportCount}
          caseCount={caseCount}
          currentUser={currentUser}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Auth Modal for Simple Non-Technical Account Access */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => setCurrentUser(user)}
        />

        {/* Main Content Container matching ScamShield AI.html */}
        <main className="mx-auto w-full max-w-[1240px] px-4 pb-28 pt-8 sm:px-8 lg:pb-16 lg:pt-12">
          {activeTab === 'triage' && (
            <TriageScanner
              key={specimenToAnalyze}
              initialText={specimenToAnalyze}
              caseCount={caseCount}
              onIncrementCase={() => setCaseCount((c) => c + 1)}
              onReportsUpdated={(count) => setReportCount(count)}
              onSimulateScenario={handleTriggerSimulation}
            />
          )}

          {activeTab === 'simulator' && (
            <RiskSimulatorView
              onTryPreset={handleTryPreset}
              initialCategory={simContext.category}
              initialText={simContext.text}
              initialUrl={simContext.url}
            />
          )}

          {activeTab === 'incident' && (
            <IncidentVaultView
              onRecheckReport={handleRecheckReport}
              onGoToTriage={() => handleTabChange('triage')}
              onReportsCountChanged={(count) => setReportCount(count)}
            />
          )}

          {/* Editorial Footer */}
          <footer className="mt-16 flex flex-col gap-2 border-t border-line pt-6 text-xs text-fg4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldLogo className="h-5 w-5" />
              <span>
                <strong className="font-semibold text-fg">ScamShield AI</strong> — Protecting everyday people from scams.
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>SQLite Embedded DB Active</span>
              <span>•</span>
              <span>Zero Tracking</span>
              <span>•</span>
              <span>SHA-256 Sealed Evidence</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
