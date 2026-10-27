import React, { useState, useEffect } from 'react';
import { ScanSearch, BookOpen, Archive, Download, WifiOff, X, Share, User as UserIcon } from 'lucide-react';
import { HealthResponse, User } from '../../types';

export const ShieldLogo: React.FC<{ className?: string }> = ({ className = 'h-8 w-8 sm:h-9 sm:w-9' }) => (
  <img
    src="/logo.jpg"
    alt="ScamShield Logo"
    className={`${className} rounded-full object-cover shadow-md border border-amber-400/60 ring-1 ring-amber-400/20 shrink-0`}
  />
);

export const BlinkingDot: React.FC = () => (
  <span className="h-1.5 w-1.5 animate-blink rounded-full bg-amber-400" aria-hidden="true" />
);

export const TABS = [
  { id: 'triage' as const, label: 'Check for Scams', short: 'Check', Icon: ScanSearch },
  { id: 'guide' as const, label: 'How Scams Work', short: 'Guide', Icon: BookOpen },
  { id: 'reports' as const, label: 'Saved Reports', short: 'Reports', Icon: Archive },
];

interface HeaderProps {
  health: HealthResponse | null;
  healthLoading: boolean;
  activeTab: 'triage' | 'simulator' | 'incident';
  onTabChange: (tab: 'triage' | 'simulator' | 'incident') => void;
  reportCount?: number;
  caseCount?: number;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  activeTab,
  onTabChange,
  reportCount = 0,
  caseCount = 1,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);

  useEffect(() => {
    // Detect standalone display mode
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };
    checkStandalone();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      const isIos =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosModal(true);
      } else {
        alert(
          'To install ScamShield AI, open your browser menu (⋮ or ...) and tap "Install app" or "Add to Home Screen".'
        );
      }
    }
  };

  const isHealthy = health?.status === 'operational';
  const mappedActive =
    activeTab === 'simulator' ? 'guide' : activeTab === 'incident' ? 'reports' : 'triage';

  const handleTabClick = (tabId: 'triage' | 'guide' | 'reports') => {
    if (tabId === 'triage') onTabChange('triage');
    else if (tabId === 'guide') onTabChange('simulator');
    else if (tabId === 'reports') onTabChange('incident');
  };

  const caseLabel = `Case ${String(caseCount).padStart(4, '0')}`;

  return (
    <>
      {/* Desktop Sticky Header Bar */}
      <header className="sticky top-0 z-40 border-b border-ink-600 bg-ink-900 text-bone">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 sm:gap-6 sm:px-8">
          {/* Logo */}
          <div
            onClick={() => handleTabClick('triage')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <ShieldLogo />
            <span
              className="display whitespace-nowrap text-[19px] leading-none sm:text-[22px]"
              style={{ fontStretch: '100%', fontVariationSettings: "'wdth' 100" }}
            >
              ScamShield<span className="text-amber-400"> AI</span>
            </span>
          </div>

          {/* Primary Nav */}
          <nav aria-label="Primary" className="hidden h-full items-stretch gap-1 lg:flex">
            {TABS.map(({ id, label }) => {
              const isActive = mappedActive === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-4 font-mono text-[12px] font-medium uppercase tracking-[0.12em] transition-colors cursor-pointer ${
                    isActive ? 'text-bone' : 'text-ash-400 hover:text-bone'
                  }`}
                >
                  {label}
                  {id === 'reports' && reportCount > 0 && (
                    <span className="ml-2 rounded-sm bg-ink-600 px-1.5 py-0.5 text-[10px] text-bone">
                      {reportCount}
                    </span>
                  )}
                  <span
                    className={`absolute inset-x-3 bottom-0 h-0.5 bg-amber-400 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Right Status Indicator & Install App Action */}
          <div className="ml-auto flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em]">
            {/* Account / Vault Sync Action */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-sm bg-ink-700/80 px-2 py-1 text-bone font-mono text-[11px]">
                  <UserIcon className="h-3 w-3 text-amber-400" />
                  <span className="font-semibold">{currentUser.username}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="hidden sm:inline-block text-[10px] uppercase font-mono text-ash-400 hover:text-amber-300 transition cursor-pointer"
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 rounded-sm border border-amber-400/50 bg-amber-400/10 px-2.5 py-1 text-amber-300 font-mono text-[10.5px] font-bold uppercase tracking-wider hover:bg-amber-400 hover:text-char transition cursor-pointer"
                title="Sign in to sync your evidence locker"
              >
                <UserIcon className="h-3 w-3" />
                <span>Sign In</span>
              </button>
            )}

            {/* PWA Install Button */}
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="hidden md:inline-flex items-center gap-1.5 rounded-sm bg-amber-400 px-2.5 py-1 text-char font-mono text-[10.5px] font-bold uppercase tracking-wider hover:bg-amber-300 transition-colors cursor-pointer"
                title="Install ScamShield AI app on this device"
              >
                <Download className="h-3 w-3" />
                <span>Install App</span>
              </button>
            )}

            {/* Offline vs Online Indicator */}
            {!isOnline ? (
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-xs border border-amber-400/30">
                <WifiOff className="h-3 w-3" />
                <span className="hidden md:inline">Offline Mode</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-ash-400">
                <BlinkingDot />
                <span className="whitespace-nowrap text-bone">
                  <span className="hidden sm:inline">AI Defense </span>
                  {isHealthy ? 'Active' : 'Live'}
                </span>
                <span className="hidden text-ink-500 sm:inline">/</span>
                <span className="hidden sm:inline">{caseLabel}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* iOS PWA Install Modal */}
      {showIosModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-char/80 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-sm rounded-md border border-line bg-surface p-5 shadow-2xl space-y-4 animate-rise">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <ShieldLogo className="h-6 w-6" />
                <span className="font-display font-bold text-base text-fg">
                  Install ScamShield AI
                </span>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="p-1 text-fg4 hover:text-fg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-fg2 leading-relaxed">
              Install ScamShield AI to your iPhone or iPad for 1-tap scam triage, offline protection, and full-screen experience:
            </p>

            <ol className="space-y-2.5 text-xs text-fg font-mono">
              <li className="flex items-center gap-2 border border-line bg-page p-2 rounded-xs">
                <Share className="h-4 w-4 text-amber-700 shrink-0" />
                <span>1. Tap the <strong>Share</strong> button in Safari's toolbar.</span>
              </li>
              <li className="flex items-center gap-2 border border-line bg-page p-2 rounded-xs">
                <span className="font-bold text-base text-amber-700 leading-none">＋</span>
                <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </li>
              <li className="flex items-center gap-2 border border-line bg-page p-2 rounded-xs">
                <span className="font-bold text-amber-700 font-sans">✓</span>
                <span>3. Tap <strong>Add</strong> in the top-right corner.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full rounded-sm bg-amber-400 py-2 font-mono text-xs font-semibold uppercase text-char hover:bg-amber-300 transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-600 bg-ink-800/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {TABS.map(({ id, short, Icon }) => {
            const isActive = mappedActive === id;
            return (
              <li key={id}>
                <button
                  onClick={() => handleTabClick(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex w-full flex-col items-center gap-1 pb-2 pt-3 font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] cursor-pointer ${
                    isActive ? 'text-bone' : 'text-ash-500'
                  }`}
                >
                  <span
                    className={`absolute top-0 h-0.5 w-10 bg-amber-400 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <span className="relative">
                    <Icon
                      className={`h-5 w-5 ${isActive ? 'text-amber-400' : ''}`}
                      strokeWidth={1.75}
                    />
                    {id === 'reports' && reportCount > 0 && (
                      <span className="absolute -right-3 -top-2 min-w-[16px] rounded-sm bg-amber-400 px-1 text-center text-[10px] leading-4 text-ink-900">
                        {reportCount}
                      </span>
                    )}
                  </span>
                  <span>{short}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};
