/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { WordSize, SignMode, ArithmeticOp, CpuFlags } from './types/calculator';
import { getWordMask } from './utils/numberEngine';
import { Navigation, TabId } from './components/Navigation';
import { ConverterTab } from './components/tabs/ConverterTab';
import { CalculatorTab } from './components/tabs/CalculatorTab';
import { ProgrammerTab } from './components/tabs/ProgrammerTab';
import { LearnTab } from './components/tabs/LearnTab';
import { FunnyLoadingScreen } from './components/FunnyLoadingScreen';

// Strict session lock: ensures the intro can only run ONCE per page session
let hasIntroRunThisSession = false;

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (hasIntroRunThisSession) {
      return false;
    }
    return true;
  });

  const handleFinishLoading = useCallback(() => {
    hasIntroRunThisSession = true;
    setIsLoading(false);
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>('converter');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Core Persistent State across all tabs
  const [wordSize, setWordSize] = useState<WordSize>(32);
  const [signMode, setSignMode] = useState<SignMode>('signed');
  const [currentValue, setCurrentValue] = useState<bigint>(42n);
  const [currentFraction, setCurrentFraction] = useState<number>(0);
  const [supportFraction, setSupportFraction] = useState<boolean>(false);
  const [fractionPrecision] = useState<number>(6);

  // Status flags
  const [flags, setFlags] = useState<CpuFlags>({
    zero: false,
    sign: false,
    carry: false,
    overflow: false,
    parity: true,
  });

  // Last performed arithmetic operation (for educational step tab)
  const [lastOperation, setLastOperation] = useState<{
    opA: bigint;
    opB: bigint;
    op: ArithmeticOp;
  }>({
    opA: 42n,
    opB: 10n,
    op: '+',
  });

  // Clamp current value when wordSize changes
  useEffect(() => {
    const mask = getWordMask(wordSize);
    setCurrentValue((prev) => prev & mask);
  }, [wordSize]);

  const handleRecordOperation = (opA: bigint, opB: bigint, op: ArithmeticOp) => {
    setLastOperation({ opA, opB, op });
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-200 flex flex-col ${
        isDarkMode
          ? 'bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200'
          : 'light-mode bg-slate-100 text-slate-900 selection:bg-blue-500/30'
      }`}
    >
      {/* Cartoon Funny Splash Loading Screen (Runs strictly once on app launch) */}
      {isLoading && <FunnyLoadingScreen onFinish={handleFinishLoading} />}

      {/* Mobile-First Navigation Header & Bottom Nav */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onReplayIntro={() => setIsLoading(true)}
      />

      {/* Main Tab Content Viewport */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 flex flex-col justify-start">
        {/* TAB 1: CONVERTER MODE */}
        {activeTab === 'converter' && (
          <div className="w-full animate-in fade-in duration-200">
            <ConverterTab
              currentValue={currentValue}
              currentFraction={currentFraction}
              onChangeValue={setCurrentValue}
              onChangeFraction={setCurrentFraction}
              wordSize={wordSize}
              signMode={signMode}
              supportFraction={supportFraction}
              setSupportFraction={setSupportFraction}
              fractionPrecision={fractionPrecision}
            />
          </div>
        )}

        {/* TAB 2: CALCULATOR MODE */}
        {activeTab === 'calculator' && (
          <div className="w-full animate-in fade-in duration-200">
            <CalculatorTab
              currentValue={currentValue}
              currentFraction={currentFraction}
              onChangeValue={setCurrentValue}
              onChangeFraction={setCurrentFraction}
              wordSize={wordSize}
              signMode={signMode}
              onOperationRecorded={handleRecordOperation}
              setFlags={setFlags}
            />
          </div>
        )}

        {/* TAB 3: PROGRAMMER & BITWISE MODE */}
        {activeTab === 'programmer' && (
          <div className="w-full animate-in fade-in duration-200">
            <ProgrammerTab
              currentValue={currentValue}
              onChangeValue={setCurrentValue}
              wordSize={wordSize}
              setWordSize={setWordSize}
              signMode={signMode}
              setSignMode={setSignMode}
              flags={flags}
              setFlags={setFlags}
              onOperationRecorded={handleRecordOperation}
            />
          </div>
        )}

        {/* TAB 4: LEARN / STEP-BY-STEP MODE */}
        {activeTab === 'learn' && (
          <div className="w-full animate-in fade-in duration-200">
            <LearnTab
              currentValue={currentValue}
              currentFraction={currentFraction}
              wordSize={wordSize}
              operandA={lastOperation.opA}
              operandB={lastOperation.opB}
              arithmeticOp={lastOperation.op}
            />
          </div>
        )}
      </main>
    </div>
  );
}
