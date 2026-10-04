import React, { useState, useEffect, useCallback } from 'react';
import { BaseType, WordSize, SignMode, ArithmeticOp, CpuFlags } from '../../types/calculator';
import {
  getWordMask,
  toTwosComplementSigned,
  twosComplementNegate,
  executeOperation,
  parseBaseFractional,
} from '../../utils/numberEngine';
import { safeCopyToClipboard } from '../../utils/clipboard';
import { Delete, Copy, Check, Equal } from 'lucide-react';

interface CalculatorTabProps {
  currentValue: bigint;
  currentFraction: number;
  onChangeValue: (newVal: bigint) => void;
  onChangeFraction: (newFrac: number) => void;
  wordSize: WordSize;
  signMode: SignMode;
  onOperationRecorded: (opA: bigint, opB: bigint, op: ArithmeticOp) => void;
  setFlags: (flags: CpuFlags) => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  currentValue,
  currentFraction,
  onChangeValue,
  onChangeFraction,
  wordSize,
  signMode,
  onOperationRecorded,
  setFlags,
}) => {
  const [activeBase, setActiveBase] = useState<BaseType>('DEC');
  const [displayStr, setDisplayStr] = useState<string>('0');
  const [pendingOp, setPendingOp] = useState<ArithmeticOp | null>(null);
  const [prevOperand, setPrevOperand] = useState<bigint | null>(null);
  const [equationPreview, setEquationPreview] = useState<string>('');
  const [isNextNumberNew, setIsNextNumberNew] = useState<boolean>(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const mask = getWordMask(wordSize);
  const normalizedVal = currentValue & mask;

  // Format value for current base
  const formatValueInBase = useCallback(
    (val: bigint, base: BaseType): string => {
      const v = val & mask;
      switch (base) {
        case 'HEX':
          return v.toString(16).toUpperCase();
        case 'DEC':
          return signMode === 'signed'
            ? toTwosComplementSigned(v, wordSize).toString(10)
            : v.toString(10);
        case 'OCT':
          return v.toString(8);
        case 'BIN':
          return v.toString(2);
      }
    },
    [mask, wordSize, signMode]
  );

  // Sync display with global state when tab opens or changes
  useEffect(() => {
    if (!calcError) {
      setDisplayStr(formatValueInBase(currentValue, activeBase));
    }
  }, [currentValue, activeBase, formatValueInBase, calcError]);

  // Switch base
  const handleSelectBase = (base: BaseType) => {
    if (base === activeBase) return;
    setActiveBase(base);
    setCalcError(null);
    setDisplayStr(formatValueInBase(normalizedVal, base));
  };

  // Parse input
  const parseDisplayToBigInt = (str: string, base: BaseType): bigint => {
    const clean = str.trim();
    if (!clean || clean === '0' || clean === '-') return 0n;
    const radix = base === 'HEX' ? 16 : base === 'DEC' ? 10 : base === 'OCT' ? 8 : 2;
    const { intBigInt, isNegative } = parseBaseFractional(clean, radix);
    let masked = intBigInt & mask;
    if (isNegative && base === 'DEC') {
      masked = (mask + 1n - (intBigInt & mask)) & mask;
    }
    return masked;
  };

  // Keypad Click
  const handleInputDigit = (digit: string) => {
    setCalcError(null);
    let nextStr = displayStr;

    if (digit === '.') {
      if (isNextNumberNew) {
        nextStr = '0.';
        setIsNextNumberNew(false);
      } else if (!displayStr.includes('.')) {
        nextStr = displayStr + '.';
      }
    } else {
      if (isNextNumberNew || displayStr === '0') {
        nextStr = digit;
        setIsNextNumberNew(false);
      } else {
        nextStr = displayStr + digit;
      }
    }

    setDisplayStr(nextStr);
    const parsed = parseDisplayToBigInt(nextStr, activeBase);
    onChangeValue(parsed);
  };

  const handleClear = () => {
    setDisplayStr('0');
    setCalcError(null);
    onChangeValue(0n);
    onChangeFraction(0);
    setPendingOp(null);
    setPrevOperand(null);
    setEquationPreview('');
    setIsNextNumberNew(false);
  };

  const handleBackspace = () => {
    setCalcError(null);
    if (isNextNumberNew || displayStr.length <= 1) {
      setDisplayStr('0');
      onChangeValue(0n);
      return;
    }
    const nextStr = displayStr.slice(0, -1);
    setDisplayStr(nextStr);
    onChangeValue(parseDisplayToBigInt(nextStr, activeBase));
  };

  const handleNegate = () => {
    setCalcError(null);
    if (activeBase === 'DEC') {
      if (displayStr.startsWith('-')) {
        const pos = displayStr.slice(1);
        setDisplayStr(pos);
        onChangeValue(parseDisplayToBigInt(pos, activeBase));
      } else if (displayStr !== '0') {
        const neg = '-' + displayStr;
        setDisplayStr(neg);
        onChangeValue(parseDisplayToBigInt(neg, activeBase));
      }
    } else {
      const negated = twosComplementNegate(normalizedVal, wordSize);
      onChangeValue(negated);
      setDisplayStr(formatValueInBase(negated, activeBase));
    }
  };

  const handleOperator = (op: ArithmeticOp) => {
    setCalcError(null);
    if (pendingOp && prevOperand !== null && !isNextNumberNew) {
      calculateResult(op);
    } else {
      setPrevOperand(normalizedVal);
      setPendingOp(op);
      setEquationPreview(`${formatValueInBase(normalizedVal, activeBase)} ${op}`);
      setIsNextNumberNew(true);
    }
  };

  const handleEquals = () => {
    if (pendingOp && prevOperand !== null) {
      calculateResult(null);
    }
  };

  const calculateResult = (nextOp: ArithmeticOp | null) => {
    if (prevOperand === null || pendingOp === null) return;

    const opA = prevOperand;
    const opB = normalizedVal;

    const { resultMasked, flags: newFlags, error } = executeOperation(
      pendingOp,
      opA,
      opB,
      wordSize
    );

    if (error) {
      setCalcError(error);
      setDisplayStr('Error');
      setPendingOp(null);
      setPrevOperand(null);
      setIsNextNumberNew(true);
      return;
    }

    setFlags(newFlags);
    onOperationRecorded(opA, opB, pendingOp);

    const resultFormatted = formatValueInBase(resultMasked, activeBase);
    const fullEquation = `${formatValueInBase(opA, activeBase)} ${pendingOp} ${formatValueInBase(opB, activeBase)} =`;

    onChangeValue(resultMasked);
    setDisplayStr(resultFormatted);

    if (nextOp) {
      setPrevOperand(resultMasked);
      setPendingOp(nextOp);
      setEquationPreview(`${resultFormatted} ${nextOp}`);
      setIsNextNumberNew(true);
    } else {
      setPrevOperand(null);
      setPendingOp(null);
      setEquationPreview(fullEquation);
      setIsNextNumberNew(true);
    }
  };

  const copyDisplay = () => {
    safeCopyToClipboard(displayStr).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    });
  };

  // Keyboard listener for physical typing in Calculator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key.toUpperCase();

      if ((key >= '0' && key <= '9') || (key >= 'A' && key <= 'F')) {
        if (isKeyActive(key)) {
          e.preventDefault();
          handleInputDigit(key);
        }
      } else if (key === '.') {
        e.preventDefault();
        handleInputDigit('.');
      } else if (key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (key === '%') {
        e.preventDefault();
        handleOperator('%');
      } else if (key === 'ENTER' || key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'BACKSPACE') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'ESCAPE') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayStr, isNextNumberNew, activeBase, pendingOp, prevOperand, normalizedVal]);

  const isKeyActive = (key: string): boolean => {
    if (['C', '⌫', '±', '%', '÷', '×', '-', '+', '=', '.'].includes(key)) return true;
    switch (activeBase) {
      case 'BIN':
        return ['0', '1'].includes(key);
      case 'OCT':
        return /^[0-7]$/.test(key);
      case 'DEC':
        return /^[0-9]$/.test(key);
      case 'HEX':
        return /^[0-9A-F]$/.test(key);
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:gap-3 pb-24 sm:pb-6 max-w-sm sm:max-w-md mx-auto w-full">
      {/* 1. TOP BASE SELECTOR TOGGLE */}
      <div className="flex items-center justify-between p-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
        {(['HEX', 'DEC', 'OCT', 'BIN'] as BaseType[]).map((base) => {
          const isActive = activeBase === base;
          return (
            <button
              key={base}
              onClick={() => handleSelectBase(base)}
              className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {base}
            </button>
          );
        })}
      </div>

      {/* 2. SMARTPHONE CALCULATOR DISPLAY */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-inner flex flex-col justify-end min-h-[85px] sm:min-h-[120px] relative">
        <div className="text-right text-[11px] sm:text-xs font-mono text-slate-400 min-h-[18px] truncate">
          {equationPreview}
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-0.5 sm:mt-1">
          <button
            onClick={copyDisplay}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Copy value"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <div
            className={`text-right font-mono text-2xl sm:text-4xl font-extrabold tracking-tight break-all select-all flex-1 ${
              calcError ? 'text-rose-400' : 'text-white'
            }`}
          >
            {calcError ? calcError : displayStr || '0'}
          </div>
        </div>
      </div>

      {/* 3. HEX BUTTONS ROW (Visible or active when in HEX mode) */}
      {activeBase === 'HEX' && (
        <div className="grid grid-cols-6 gap-1 p-1 bg-slate-900/60 rounded-xl sm:rounded-2xl border border-slate-800/80">
          {['A', 'B', 'C', 'D', 'E', 'F'].map((k) => (
            <button
              key={k}
              onClick={() => handleInputDigit(k)}
              className="h-8 sm:h-10 rounded-lg sm:rounded-xl bg-amber-950/40 hover:bg-amber-900/60 active:scale-95 text-amber-300 border border-amber-800/60 font-mono text-xs sm:text-sm font-bold flex items-center justify-center transition-all select-none"
            >
              {k}
            </button>
          ))}
        </div>
      )}

      {/* 4. STANDARD SMARTPHONE CALCULATOR KEYPAD */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-xl">
        {/* Row 1: C, ±, %, ÷ */}
        <button
          onClick={handleClear}
          className="h-11 sm:h-15 rounded-xl sm:rounded-2xl bg-rose-950/50 hover:bg-rose-900/70 active:scale-95 text-rose-300 font-mono text-sm sm:text-base font-bold flex items-center justify-center transition-all select-none"
        >
          C
        </button>
        <button
          onClick={handleNegate}
          className="h-11 sm:h-15 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-mono text-sm sm:text-base font-bold flex items-center justify-center transition-all select-none"
        >
          ±
        </button>
        <button
          onClick={() => handleOperator('%')}
          className={`h-11 sm:h-15 rounded-xl sm:rounded-2xl font-mono text-sm sm:text-base font-bold flex items-center justify-center transition-all select-none ${
            pendingOp === '%'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-300'
          }`}
        >
          %
        </button>
        <button
          onClick={() => handleOperator('÷')}
          className={`h-11 sm:h-15 rounded-xl sm:rounded-2xl font-mono text-lg sm:text-xl font-bold flex items-center justify-center transition-all select-none ${
            pendingOp === '÷'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-blue-600/30 hover:bg-blue-600/50 active:scale-95 text-blue-400 border border-blue-500/30'
          }`}
        >
          ÷
        </button>

        {/* Row 2: 7, 8, 9, × */}
        {['7', '8', '9'].map((k) => (
          <button
            key={k}
            disabled={!isKeyActive(k)}
            onClick={() => handleInputDigit(k)}
            className={`h-11 sm:h-15 rounded-xl sm:rounded-2xl font-mono text-base sm:text-xl font-bold flex items-center justify-center transition-all select-none ${
              isKeyActive(k)
                ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-white'
                : 'bg-slate-950/40 text-slate-700 cursor-not-allowed'
            }`}
          >
            {k}
          </button>
        ))}
        <button
          onClick={() => handleOperator('×')}
          className={`h-11 sm:h-15 rounded-xl sm:rounded-2xl font-mono text-lg sm:text-xl font-bold flex items-center justify-center transition-all select-none ${
            pendingOp === '×'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-blue-600/30 hover:bg-blue-600/50 active:scale-95 text-blue-400 border border-blue-500/30'
          }`}
        >
          ×
        </button>

        {/* Row 3: 4, 5, 6, − */}
        {['4', '5', '6'].map((k) => (
          <button
            key={k}
            disabled={!isKeyActive(k)}
            onClick={() => handleInputDigit(k)}
            className={`h-11 sm:h-15 rounded-xl sm:rounded-2xl font-mono text-base sm:text-xl font-bold flex items-center justify-center transition-all select-none ${
              isKeyActive(k)
                ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-white'
                : 'bg-slate-950/40 text-slate-700 cursor-not-allowed'
            }`}
          >
            {k}
          </button>
        ))}
        <button
          onClick={() => handleOperator('-')}
          className={`h-11 sm:h-15 rounded-xl sm:rounded-2xl font-mono text-lg sm:text-xl font-bold flex items-center justify-center transition-all select-none ${
            pendingOp === '-'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-blue-600/30 hover:bg-blue-600/50 active:scale-95 text-blue-400 border border-blue-500/30'
          }`}
        >
          −
        </button>

        {/* Row 4: 1, 2, 3, + */}
        {['1', '2', '3'].map((k) => (
          <button
            key={k}
            disabled={!isKeyActive(k)}
            onClick={() => handleInputDigit(k)}
            className={`h-11 sm:h-15 rounded-xl sm:rounded-2xl font-mono text-base sm:text-xl font-bold flex items-center justify-center transition-all select-none ${
              isKeyActive(k)
                ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-white'
                : 'bg-slate-950/40 text-slate-700 border border-slate-900 cursor-not-allowed'
            }`}
          >
            {k}
          </button>
        ))}
        <button
          onClick={() => handleOperator('+')}
          className={`h-11 sm:h-15 rounded-xl sm:rounded-2xl font-mono text-lg sm:text-xl font-bold flex items-center justify-center transition-all select-none ${
            pendingOp === '+'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-blue-600/30 hover:bg-blue-600/50 active:scale-95 text-blue-400 border border-blue-500/30'
          }`}
        >
          +
        </button>

        {/* Row 5: 0, ., ⌫, = */}
        <button
          disabled={!isKeyActive('0')}
          onClick={() => handleInputDigit('0')}
          className="h-11 sm:h-15 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono text-base sm:text-xl font-bold flex items-center justify-center transition-all select-none"
        >
          0
        </button>
        <button
          disabled={!isKeyActive('.')}
          onClick={() => handleInputDigit('.')}
          className="h-11 sm:h-15 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono text-lg sm:text-2xl font-bold flex items-center justify-center transition-all select-none"
        >
          .
        </button>
        <button
          onClick={handleBackspace}
          className="h-11 sm:h-15 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-300 flex items-center justify-center transition-all select-none"
          title="Backspace"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={handleEquals}
          className="h-11 sm:h-15 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:scale-95 text-white shadow-lg shadow-cyan-500/25 font-mono text-xl sm:text-2xl font-bold flex items-center justify-center transition-all select-none"
        >
          =
        </button>
      </div>
    </div>
  );
};
