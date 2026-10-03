import React from 'react';
import { WordSize, SignMode } from '../types/calculator';
import {
  Sun,
  Moon,
  RotateCcw,
  Sparkles,
  Layers,
  Binary,
} from 'lucide-react';

interface HeaderProps {
  wordSize: WordSize;
  setWordSize: (size: WordSize) => void;
  signMode: SignMode;
  setSignMode: (mode: SignMode) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onReset: () => void;
  onSetPreset: (preset: 'allZeros' | 'allOnes' | 'maxSigned' | 'minSigned' | 'random') => void;
}

export const Header: React.FC<HeaderProps> = ({
  wordSize,
  setWordSize,
  signMode,
  setSignMode,
  isDarkMode,
  setIsDarkMode,
  onReset,
  onSetPreset,
}) => {
  return (
    <header className="border-b border-slate-800/70 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Simple & Friendly App Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold">
              <Binary className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg text-white tracking-tight flex items-center gap-2">
                Number System Calculator
              </h1>
              <p className="text-xs text-slate-400">
                Easy base converter, arithmetic &amp; bit visualizer
              </p>
            </div>
          </div>

          {/* Mobile Theme Toggle */}
          <div className="md:hidden flex items-center gap-1.5">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>
          </div>
        </div>

        {/* Clean, Simple Controls */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
          {/* Word Size (8, 16, 32, 64) */}
          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-0.5 shadow-inner">
            <span className="text-[11px] font-medium text-slate-400 px-2 hidden sm:inline">
              Size:
            </span>
            {([8, 16, 32, 64] as WordSize[]).map((bits) => {
              const isActive = wordSize === bits;
              return (
                <button
                  key={bits}
                  onClick={() => setWordSize(bits)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`${bits}-bit size`}
                >
                  {bits}-bit
                </button>
              );
            })}
          </div>

          {/* Signed / Unsigned Mode */}
          <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-0.5 shadow-inner">
            {[
              { id: 'signed', label: 'Signed (±)' },
              { id: 'unsigned', label: 'Unsigned (+)' },
            ].map((mode) => {
              const isActive = signMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSignMode(mode.id as SignMode)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={mode.id === 'signed' ? "Allow negative numbers (Two's complement)" : 'Positive numbers only'}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetPreset('allZeros')}
              className="px-2 py-1 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700/80 transition-colors"
              title="Set to 0"
            >
              0
            </button>
            <button
              onClick={() => onSetPreset('random')}
              className="px-2 py-1 text-xs bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-md border border-slate-700/80 transition-colors flex items-center gap-1"
              title="Random value"
            >
              <Sparkles className="w-3 h-3 text-amber-400" /> Random
            </button>
            <button
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-700 rounded-md border border-slate-700/80 transition-colors"
              title="Reset everything to 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="hidden md:flex p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
            title="Toggle Light / Dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
