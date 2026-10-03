import React from 'react';
import { ArrowRightLeft, Calculator, Cpu, BookOpen, Sun, Moon } from 'lucide-react';

export type TabId = 'converter' | 'calculator' | 'programmer' | 'learn';

interface NavigationProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onReplayIntro?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  onReplayIntro,
}) => {
  const tabs = [
    {
      id: 'converter' as TabId,
      label: 'Converter',
      shortLabel: 'Convert',
      icon: ArrowRightLeft,
      badge: 'Base 2/8/10/16',
    },
    {
      id: 'calculator' as TabId,
      label: 'Calculator',
      shortLabel: 'Calc',
      icon: Calculator,
      badge: 'Math',
    },
    {
      id: 'programmer' as TabId,
      label: 'Programmer',
      shortLabel: 'Bitwise',
      icon: Cpu,
      badge: '64b • Bits',
    },
    {
      id: 'learn' as TabId,
      label: 'Learn',
      shortLabel: 'Steps',
      icon: BookOpen,
      badge: 'Proofs',
    },
  ];

  return (
    <>
      {/* TOP HEADER (Branding & Desktop Tab Navigation) */}
      <header
        className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-6 py-2.5 transition-colors"
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top, 0px))' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Funny Coma Logo / App Name */}
          <div
            onClick={onReplayIntro}
            className="flex items-center gap-2.5 group cursor-pointer select-none"
            title="Click to replay funny chase animation! 🎬"
          >
            {/* Funny Dizzy / Coma Mascot Logo */}
            <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-[2px] shadow-lg shadow-rose-500/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                {/* Funny Face */}
                <div className="flex flex-col items-center justify-center -space-y-0.5">
                  {/* Eyes: One huge googly eye, one dizzy cross eye (x_O) */}
                  <div className="flex items-center gap-1">
                    {/* Left Eye: Dizzy X eye */}
                    <div className="text-[11px] font-black text-rose-400 leading-none">
                      ✕
                    </div>
                    {/* Right Eye: Big crazy googly eye with pupil */}
                    <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-end p-0.5 shadow-inner">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                  {/* Derpy Smile / Tongue */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-3 h-1.5 border-b-2 border-amber-300 rounded-b-full" />
                    <span className="absolute -bottom-1 -right-0.5 text-[8px] leading-none">
                      👅
                    </span>
                  </div>
                </div>

                {/* Comical floating 'zZ' snoring indicator */}
                <span className="absolute -top-0.5 -right-0.5 text-[9px] font-mono font-extrabold text-cyan-300 animate-pulse">
                  zZ
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base text-white tracking-tight uppercase group-hover:text-amber-300 transition-colors">
                  COMA <span className="text-cyan-400">CALCULATOR</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold hidden sm:inline">
                  (x_O) zZ
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Top Tabs (Visible on tablet & desktop) */}
          <nav className="hidden sm:flex items-center bg-slate-900/90 border border-slate-800/80 p-1 rounded-xl shadow-inner gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25 ring-1 ring-cyan-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Theme Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Toggle Dark / Light Theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (Sticky at bottom on small screens) */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 px-2 py-1.5 shadow-2xl"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200 active:scale-95'
                }`}
              >
                {/* Active Indicator Glow Pip */}
                {isActive && (
                  <span className="absolute top-0.5 w-6 h-0.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                )}
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-cyan-400 scale-110' : ''}`} />
                <span className="text-[10px] leading-tight font-medium tracking-tight">
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
