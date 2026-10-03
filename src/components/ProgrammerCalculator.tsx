import React, { useState, useEffect, useCallback } from 'react';
import {
  WordSize,
  BaseType,
  SignMode,
  ArithmeticOp,
  CpuFlags,
  CalculationHistoryItem,
} from '../types/calculator';
import {
  getWordMask,
  toTwosComplementSigned,
  onesComplement,
  twosComplementNegate,
  executeOperation,
  formatBinaryWithSpaces,
  formatHexWithSpaces,
  fractionToBaseString,
  parseBaseFractional,
} from '../utils/numberEngine';
import {
  Delete,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ProgrammerCalculatorProps {
  wordSize: WordSize;
  setWordSize: (size: WordSize) => void;
  signMode: SignMode;
  setSignMode: (mode: SignMode) => void;
  currentBigInt: bigint;
  onChangeValue: (val: bigint) => void;
  currentFraction: number;
  onChangeFraction: (frac: number) => void;
  flags: CpuFlags;
  setFlags: (flags: CpuFlags) => void;
  onOperationPerformed: (opA: bigint, opB: bigint, op: ArithmeticOp) => void;
  history: CalculationHistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<CalculationHistoryItem[]>>;
  showBitStrip: boolean;
  setShowBitStrip: (show: boolean) => void;
}

export const ProgrammerCalculator: React.FC<ProgrammerCalculatorProps> = ({
  wordSize,
  setWordSize,
  signMode,
  setSignMode,
  currentBigInt,
  onChangeValue,
  currentFraction,
  onChangeFraction,
  flags,
  setFlags,
  onOperationPerformed,
  history,
  setHistory,
  showBitStrip,
  setShowBitStrip,
}) => {
  const [activeBase, setActiveBase] = useState<BaseType>('DEC');
  const [displayStr, setDisplayStr] = useState<string>('42');
  const [pendingOp, setPendingOp] = useState<ArithmeticOp | null>(null);
  const [prevOperand, setPrevOperand] = useState<bigint | null>(null);
  const [equationPreview, setEquationPreview] = useState<string>('');
  const [isNextNumberNew, setIsNextNumberNew] = useState<boolean>(false);
  const [copiedBase, setCopiedBase] = useState<string | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  const mask = getWordMask(wordSize);
  const normalizedVal = currentBigInt & mask;

  // Format a BigInt value to string for a specific base
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

  // Sync display string whenever currentBigInt changes externally
  useEffect(() => {
    if (!calcError) {
      if (currentFraction > 0) {
        const intStr = formatValueInBase(currentBigInt, activeBase);
        const radix = activeBase === 'HEX' ? 16 : activeBase === 'DEC' ? 10 : activeBase === 'OCT' ? 8 : 2;
        const fracStr = fractionToBaseString(currentFraction, radix, 6).resultStr;
        setDisplayStr(fracStr ? `${intStr}.${fracStr}` : intStr);
      } else {
        setDisplayStr(formatValueInBase(currentBigInt, activeBase));
      }
    }
  }, [currentBigInt, currentFraction, activeBase, formatValueInBase, calcError]);

  // Handle switching active base (HEX, DEC, OCT, BIN)
  const handleSelectBase = (newBase: BaseType) => {
    if (newBase === activeBase) return;
    setActiveBase(newBase);
    setCalcError(null);

    const intStr = formatValueInBase(normalizedVal, newBase);
    if (currentFraction > 0) {
      const radix = newBase === 'HEX' ? 16 : newBase === 'DEC' ? 10 : newBase === 'OCT' ? 8 : 2;
      const fracStr = fractionToBaseString(currentFraction, radix, 6).resultStr;
      setDisplayStr(fracStr ? `${intStr}.${fracStr}` : intStr);
    } else {
      setDisplayStr(intStr);
    }
  };

  // Convert input text to BigInt and fraction
  const parseDisplayToValues = (str: string, base: BaseType): { intVal: bigint; fracVal: number } => {
    const clean = str.trim();
    if (!clean || clean === '0' || clean === '-') return { intVal: 0n, fracVal: 0 };

    const radix = base === 'HEX' ? 16 : base === 'DEC' ? 10 : base === 'OCT' ? 8 : 2;
    const { intBigInt, fractionVal, isNegative } = parseBaseFractional(clean, radix);

    let maskedInt = intBigInt & mask;
    if (isNegative && base === 'DEC') {
      maskedInt = (mask + 1n - (intBigInt & mask)) & mask;
    }

    return { intVal: maskedInt, fracVal: fractionVal };
  };

  // Handle number/character keypad clicks
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
    const { intVal, fracVal } = parseDisplayToValues(nextStr, activeBase);
    onChangeValue(intVal);
    onChangeFraction(fracVal);
  };

  // Clear entry / Clear all
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

  const handleClearEntry = () => {
    setDisplayStr('0');
    setCalcError(null);
    onChangeValue(0n);
    onChangeFraction(0);
  };

  // Backspace
  const handleBackspace = () => {
    setCalcError(null);
    if (isNextNumberNew || displayStr.length <= 1) {
      setDisplayStr('0');
      onChangeValue(0n);
      onChangeFraction(0);
      return;
    }
    const nextStr = displayStr.slice(0, -1);
    setDisplayStr(nextStr);
    const { intVal, fracVal } = parseDisplayToValues(nextStr, activeBase);
    onChangeValue(intVal);
    onChangeFraction(fracVal);
  };

  // Negate (±)
  const handleNegate = () => {
    setCalcError(null);
    if (activeBase === 'DEC' && !displayStr.includes('.')) {
      if (displayStr.startsWith('-')) {
        const positiveStr = displayStr.slice(1);
        setDisplayStr(positiveStr);
        const { intVal } = parseDisplayToValues(positiveStr, 'DEC');
        onChangeValue(intVal);
        return;
      } else if (displayStr !== '0') {
        const negativeStr = '-' + displayStr;
        setDisplayStr(negativeStr);
        const { intVal } = parseDisplayToValues(negativeStr, 'DEC');
        onChangeValue(intVal);
        return;
      }
    }

    const negated = twosComplementNegate(normalizedVal, wordSize);
    onChangeValue(negated);
    setDisplayStr(formatValueInBase(negated, activeBase));
  };

  // Bitwise NOT (~)
  const handleNot = () => {
    setCalcError(null);
    const inverted = onesComplement(normalizedVal, wordSize);
    onChangeValue(inverted);
    setDisplayStr(formatValueInBase(inverted, activeBase));
  };

  // Apply binary operator (+, -, ×, ÷, %, &, |, ^, <<, >>, etc.)
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

  // Equals (=)
  const handleEquals = () => {
    if (pendingOp && prevOperand !== null) {
      calculateResult(null);
    }
  };

  const calculateResult = (nextOpAfter: ArithmeticOp | null) => {
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
    onOperationPerformed(opA, opB, pendingOp);

    const resultStr = formatValueInBase(resultMasked, activeBase);
    const fullEq = `${formatValueInBase(opA, activeBase)} ${pendingOp} ${formatValueInBase(opB, activeBase)} =`;

    // Record in history
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        expression: `${formatValueInBase(opA, activeBase)} ${pendingOp} ${formatValueInBase(opB, activeBase)}`,
        resultStr,
        resultBigInt: resultMasked,
        base: activeBase,
        flags: newFlags,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev.slice(0, 19),
    ]);

    onChangeValue(resultMasked);
    onChangeFraction(0);
    setDisplayStr(resultStr);

    if (nextOpAfter) {
      setPrevOperand(resultMasked);
      setPendingOp(nextOpAfter);
      setEquationPreview(`${resultStr} ${nextOpAfter}`);
      setIsNextNumberNew(true);
    } else {
      setPrevOperand(null);
      setPendingOp(null);
      setEquationPreview(fullEq);
      setIsNextNumberNew(true);
    }
  };

  // Shift directly
  const handleBitShift = (direction: 'left' | 'right') => {
    setCalcError(null);
    let shifted = 0n;
    if (direction === 'left') {
      shifted = (normalizedVal << 1n) & mask;
    } else {
      shifted = (normalizedVal >> 1n) & mask;
    }
    onChangeValue(shifted);
    setDisplayStr(formatValueInBase(shifted, activeBase));
  };

  // Toggle individual bit on bit keyboard
  const handleToggleBit = (index: number) => {
    setCalcError(null);
    const bitMask = 1n << BigInt(index);
    const toggled = (normalizedVal ^ bitMask) & mask;
    onChangeValue(toggled);
    setDisplayStr(formatValueInBase(toggled, activeBase));
  };

  // One-click copy
  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBase(key);
    setTimeout(() => setCopiedBase(null), 1500);
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key >= '0' && key <= '9') {
        if (isKeyActive(key)) {
          e.preventDefault();
          handleInputDigit(key);
        }
      } else if (key >= 'A' && key <= 'F') {
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
      } else if (key === '&') {
        e.preventDefault();
        handleOperator('&');
      } else if (key === '|') {
        e.preventDefault();
        handleOperator('|');
      } else if (key === '^') {
        e.preventDefault();
        handleOperator('^');
      } else if (key === '~') {
        e.preventDefault();
        handleNot();
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

  const isKeyActive = (k: string): boolean => {
    if (k === '.') return true;
    switch (activeBase) {
      case 'BIN':
        return ['0', '1'].includes(k);
      case 'OCT':
        return /^[0-7]$/.test(k);
      case 'DEC':
        return /^[0-9]$/.test(k);
      case 'HEX':
        return /^[0-9A-F]$/.test(k);
    }
  };

  // 4 Bases values for synchronous readout
  const baseReadouts: {
    key: BaseType;
    label: string;
    radix: number;
    rawStr: string;
    formatted: string;
  }[] = [
    {
      key: 'HEX',
      label: 'HEX',
      radix: 16,
      rawStr: formatValueInBase(normalizedVal, 'HEX'),
      formatted: formatHexWithSpaces(formatValueInBase(normalizedVal, 'HEX'), wordSize) +
        (currentFraction > 0 ? ` . ${fractionToBaseString(currentFraction, 16, 6).resultStr}` : ''),
    },
    {
      key: 'DEC',
      label: 'DEC',
      radix: 10,
      rawStr: formatValueInBase(normalizedVal, 'DEC'),
      formatted: formatValueInBase(normalizedVal, 'DEC') +
        (currentFraction > 0 ? `.${currentFraction.toFixed(6).slice(2)}` : ''),
    },
    {
      key: 'OCT',
      label: 'OCT',
      radix: 8,
      rawStr: formatValueInBase(normalizedVal, 'OCT'),
      formatted: formatValueInBase(normalizedVal, 'OCT') +
        (currentFraction > 0 ? ` . ${fractionToBaseString(currentFraction, 8, 6).resultStr}` : ''),
    },
    {
      key: 'BIN',
      label: 'BIN',
      radix: 2,
      rawStr: formatValueInBase(normalizedVal, 'BIN'),
      formatted: formatBinaryWithSpaces(formatValueInBase(normalizedVal, 'BIN'), wordSize) +
        (currentFraction > 0 ? ` . ${fractionToBaseString(currentFraction, 2, 6).resultStr}` : ''),
    },
  ];

  // Group bits in 4-bit nibbles for visual bit keyboard
  const nibbles = [];
  for (let i = wordSize - 1; i >= 0; i -= 4) {
    const bits = [];
    for (let b = i; b > i - 4 && b >= 0; b--) {
      const isSet = ((normalizedVal >> BigInt(b)) & 1n) === 1n;
      bits.push({ index: b, isSet });
    }
    nibbles.push({ startBit: i, bits });
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 backdrop-blur-xl flex flex-col gap-4">
      {/* 1. TOP CALC SCREEN: EQUATION + BIG PRIMARY DISPLAY */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-inner flex flex-col justify-between min-h-[110px]">
        {/* Pending equation line */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 min-h-[20px]">
          <span className="truncate">{equationPreview}</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
            {activeBase} • {wordSize}-BIT
          </span>
        </div>

        {/* Big crisp display with error indicator if needed */}
        <div className="flex items-center justify-between gap-3 mt-1">
          <div
            className={`font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight break-all select-all flex-1 ${
              calcError ? 'text-rose-400' : 'text-white'
            }`}
          >
            {calcError ? calcError : displayStr || '0'}
          </div>

          <button
            onClick={() => copyText(displayStr, 'MAIN')}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0"
            title="Copy current value"
          >
            {copiedBase === 'MAIN' ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. FOUR-BASE SYNCHRONOUS LIST (Clickable rows, like Windows Programmer Calc) */}
      <div className="grid grid-cols-1 gap-1.5 bg-slate-950/60 p-2 rounded-2xl border border-slate-800/80">
        {baseReadouts.map((base) => {
          const isActive = activeBase === base.key;
          return (
            <div
              key={base.key}
              onClick={() => handleSelectBase(base.key)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                isActive
                  ? 'bg-blue-600/20 border border-blue-500/50 shadow-sm'
                  : 'hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-10 text-xs font-mono font-bold px-1.5 py-0.5 rounded text-center ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {base.label}
                </span>
                <span
                  className={`font-mono text-sm sm:text-base font-semibold truncate max-w-[260px] sm:max-w-md ${
                    isActive ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {base.formatted || '0'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isActive && (
                  <span className="text-[10px] font-mono text-blue-400 hidden sm:inline">
                    Active Input Base
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyText(base.rawStr, base.key);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title={`Copy ${base.label}`}
                >
                  {copiedBase === base.key ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. INTERACTIVE BIT KEYBOARD / TOGGLE STRIP */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">
              Interactive Bit Strip ({wordSize} bits)
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Click any bit to flip 0 ↔ 1
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleBitShift('left')}
              className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              title="Shift Left (&lt;&lt; 1)"
            >
              &lt;&lt; 1
            </button>
            <button
              onClick={() => handleBitShift('right')}
              className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              title="Shift Right (&gt;&gt; 1)"
            >
              &gt;&gt; 1
            </button>
            <button
              onClick={handleNot}
              className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded border border-slate-700"
              title="Invert all bits (NOT ~)"
            >
              NOT
            </button>
            <button
              onClick={handleNegate}
              className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 rounded border border-slate-700"
              title="Two's complement negation (±)"
            >
              ±
            </button>
          </div>
        </div>

        {/* Bit Cells Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {nibbles.map((nibble, nIdx) => (
            <div
              key={nIdx}
              className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-1.5"
            >
              <div className="text-[9px] text-slate-400 font-mono text-center mb-1">
                {nibble.startBit}..{nibble.bits[nibble.bits.length - 1].index}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {nibble.bits.map(({ index, isSet }) => {
                  const isSignBit = index === wordSize - 1;
                  return (
                    <button
                      key={index}
                      onClick={() => handleToggleBit(index)}
                      className={`h-7 rounded-md font-mono text-xs font-bold transition-all flex items-center justify-center select-none ${
                        isSet
                          ? isSignBit
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                      title={`Bit ${index} (Weight: 2^${index})`}
                    >
                      {isSet ? '1' : '0'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. CPU STATUS FLAGS LED BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
        <span className="text-slate-400 font-bold">Status Flags:</span>
        <div className="flex items-center gap-3">
          {[
            { label: 'Zero (Z)', set: flags.zero, tip: 'Result is 0' },
            { label: 'Sign (S)', set: flags.sign, tip: 'Sign bit is 1 (negative)' },
            { label: 'Carry (C)', set: flags.carry, tip: 'Unsigned carry / borrow occurred' },
            { label: 'Overflow (V)', set: flags.overflow, tip: 'Signed Two\'s complement overflow' },
            { label: 'Parity (P)', set: flags.parity, tip: 'Even number of 1s in lower byte' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-1.5" title={f.tip}>
              <span
                className={`w-2 h-2 rounded-full ${
                  f.set ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-slate-700'
                }`}
              />
              <span className={f.set ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. PROFESSIONAL PROGRAMMER KEYPAD */}
      <div className="space-y-2">
        {/* Bitwise Operations Top Row */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {[
            { label: 'AND', op: '&' as ArithmeticOp },
            { label: 'OR', op: '|' as ArithmeticOp },
            { label: 'XOR', op: '^' as ArithmeticOp },
            { label: 'NOT', action: handleNot },
            { label: 'Lsh', op: '<<' as ArithmeticOp },
            { label: 'Rsh', op: '>>' as ArithmeticOp },
            { label: 'RoL', op: 'ROL' as ArithmeticOp },
            { label: 'RoR', op: 'ROR' as ArithmeticOp },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if ('action' in item && item.action) item.action();
                else if ('op' in item && item.op) handleOperator(item.op);
              }}
              className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700/80 font-mono text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Keypad Grid: Hex A-F columns + Standard Digits + Operations */}
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
          {/* Hex Keys Column: A, B, C, D, E, F */}
          <div className="col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {['A', 'B', 'C', 'D', 'E', 'F'].map((k) => {
              const active = isKeyActive(k);
              return (
                <button
                  key={k}
                  disabled={!active}
                  onClick={() => handleInputDigit(k)}
                  className={`py-3 rounded-xl font-mono text-sm sm:text-base font-bold transition-all ${
                    active
                      ? 'bg-amber-950/40 hover:bg-amber-900/70 text-amber-300 border border-amber-800/60 shadow-sm active:scale-95'
                      : 'bg-slate-950/40 text-slate-700 border border-slate-900 cursor-not-allowed'
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>

          {/* Standard 4-Column Number & Operations Grid */}
          <div className="col-span-4 sm:col-span-5 grid grid-cols-4 gap-1.5">
            {/* Row 1: CE, C, Backspace, Divide */}
            <button
              onClick={handleClearEntry}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-xs font-bold"
            >
              CE
            </button>
            <button
              onClick={handleClear}
              className="py-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 font-mono text-xs font-bold"
            >
              C
            </button>
            <button
              onClick={handleBackspace}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 flex items-center justify-center"
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleOperator('÷')}
              className={`py-3 rounded-xl font-mono text-base font-bold transition-all ${
                pendingOp === '÷'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800'
              }`}
            >
              ÷
            </button>

            {/* Row 2: 7, 8, 9, Multiply */}
            {['7', '8', '9'].map((k) => (
              <button
                key={k}
                disabled={!isKeyActive(k)}
                onClick={() => handleInputDigit(k)}
                className={`py-3 rounded-xl font-mono text-lg font-bold transition-all ${
                  isKeyActive(k)
                    ? 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 active:scale-95'
                    : 'bg-slate-950/40 text-slate-700 border border-slate-900 cursor-not-allowed'
                }`}
              >
                {k}
              </button>
            ))}
            <button
              onClick={() => handleOperator('×')}
              className={`py-3 rounded-xl font-mono text-base font-bold transition-all ${
                pendingOp === '×'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800'
              }`}
            >
              ×
            </button>

            {/* Row 3: 4, 5, 6, Subtract */}
            {['4', '5', '6'].map((k) => (
              <button
                key={k}
                disabled={!isKeyActive(k)}
                onClick={() => handleInputDigit(k)}
                className={`py-3 rounded-xl font-mono text-lg font-bold transition-all ${
                  isKeyActive(k)
                    ? 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 active:scale-95'
                    : 'bg-slate-950/40 text-slate-700 border border-slate-900 cursor-not-allowed'
                }`}
              >
                {k}
              </button>
            ))}
            <button
              onClick={() => handleOperator('-')}
              className={`py-3 rounded-xl font-mono text-base font-bold transition-all ${
                pendingOp === '-'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800'
              }`}
            >
              −
            </button>

            {/* Row 4: 1, 2, 3, Add */}
            {['1', '2', '3'].map((k) => (
              <button
                key={k}
                disabled={!isKeyActive(k)}
                onClick={() => handleInputDigit(k)}
                className={`py-3 rounded-xl font-mono text-lg font-bold transition-all ${
                  isKeyActive(k)
                    ? 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 active:scale-95'
                    : 'bg-slate-950/40 text-slate-700 border border-slate-900 cursor-not-allowed'
                }`}
              >
                {k}
              </button>
            ))}
            <button
              onClick={() => handleOperator('+')}
              className={`py-3 rounded-xl font-mono text-base font-bold transition-all ${
                pendingOp === '+'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-950/70 hover:bg-blue-900 text-blue-300 border border-blue-800'
              }`}
            >
              +
            </button>

            {/* Row 5: ±, 0, ., Equals */}
            <button
              onClick={handleNegate}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-mono text-base font-bold"
              title="Negate (Two's complement ±)"
            >
              ±
            </button>
            <button
              onClick={() => handleInputDigit('0')}
              className="py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 font-mono text-lg font-bold"
            >
              0
            </button>
            <button
              onClick={() => handleInputDigit('.')}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-mono text-lg font-bold"
              title="Decimal Point (.) for fractions"
            >
              .
            </button>
            <button
              onClick={handleEquals}
              className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xl font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
            >
              =
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
