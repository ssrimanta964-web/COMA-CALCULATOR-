import React, { useState } from 'react';
import { BaseType, WordSize, SignMode } from '../../types/calculator';
import {
  getWordMask,
  toTwosComplementSigned,
  onesComplement,
  formatBinaryWithSpaces,
  formatHexWithSpaces,
  fractionToBaseString,
  parseBaseFractional,
} from '../../utils/numberEngine';
import { Copy, Check, Delete, SlidersHorizontal } from 'lucide-react';

interface ConverterTabProps {
  currentValue: bigint;
  currentFraction: number;
  onChangeValue: (newVal: bigint) => void;
  onChangeFraction: (newFrac: number) => void;
  wordSize: WordSize;
  signMode: SignMode;
  supportFraction: boolean;
  setSupportFraction: (support: boolean) => void;
  fractionPrecision: number;
}

export const ConverterTab: React.FC<ConverterTabProps> = ({
  currentValue,
  currentFraction,
  onChangeValue,
  onChangeFraction,
  wordSize,
  signMode,
  supportFraction,
  setSupportFraction,
  fractionPrecision,
}) => {
  const [activeBase, setActiveBase] = useState<BaseType>('DEC');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const mask = getWordMask(wordSize);
  const normalizedVal = currentValue & mask;

  // Format representations for the 4 cards
  const formatBaseDisplay = (base: BaseType): { main: string; formatted: string; fullRaw: string } => {
    let intStr = '';
    let fracStr = '';

    switch (base) {
      case 'DEC': {
        intStr = signMode === 'signed'
          ? toTwosComplementSigned(normalizedVal, wordSize).toString(10)
          : normalizedVal.toString(10);
        if (supportFraction && currentFraction > 0) {
          fracStr = currentFraction.toFixed(fractionPrecision).slice(2);
        }
        const full = fracStr ? `${intStr}.${fracStr}` : intStr;
        return { main: full, formatted: full, fullRaw: full };
      }
      case 'HEX': {
        intStr = normalizedVal.toString(16).toUpperCase();
        if (supportFraction && currentFraction > 0) {
          fracStr = fractionToBaseString(currentFraction, 16, fractionPrecision).resultStr;
        }
        const full = fracStr ? `${intStr}.${fracStr}` : intStr;
        const formatted = formatHexWithSpaces(intStr, wordSize) + (fracStr ? ` . ${fracStr}` : '');
        return { main: full, formatted, fullRaw: full };
      }
      case 'OCT': {
        intStr = normalizedVal.toString(8);
        if (supportFraction && currentFraction > 0) {
          fracStr = fractionToBaseString(currentFraction, 8, fractionPrecision).resultStr;
        }
        const full = fracStr ? `${intStr}.${fracStr}` : intStr;
        return { main: full, formatted: full, fullRaw: full };
      }
      case 'BIN': {
        intStr = normalizedVal.toString(2);
        if (supportFraction && currentFraction > 0) {
          fracStr = fractionToBaseString(currentFraction, 2, fractionPrecision).resultStr;
        }
        const full = fracStr ? `${intStr}.${fracStr}` : intStr;
        const formatted = formatBinaryWithSpaces(normalizedVal.toString(2), wordSize) + (fracStr ? ` . ${fracStr}` : '');
        return { main: full, formatted, fullRaw: full };
      }
    }
  };

  const decData = formatBaseDisplay('DEC');
  const hexData = formatBaseDisplay('HEX');
  const octData = formatBaseDisplay('OCT');
  const binData = formatBaseDisplay('BIN');

  // Input processing
  const handleKeypadPress = (key: string) => {
    let currentRaw = '';
    switch (activeBase) {
      case 'DEC': currentRaw = decData.main; break;
      case 'HEX': currentRaw = hexData.main; break;
      case 'OCT': currentRaw = octData.main; break;
      case 'BIN': currentRaw = binData.main; break;
    }

    let nextRaw = currentRaw;

    if (key === 'CLEAR') {
      onChangeValue(0n);
      onChangeFraction(0);
      return;
    }

    if (key === 'BACKSPACE') {
      if (currentRaw.length <= 1) {
        onChangeValue(0n);
        onChangeFraction(0);
        return;
      }
      nextRaw = currentRaw.slice(0, -1);
    } else if (key === '.') {
      if (!supportFraction) setSupportFraction(true);
      if (!currentRaw.includes('.')) {
        nextRaw = currentRaw + '.';
      }
    } else if (key === '+/-') {
      if (activeBase === 'DEC') {
        if (currentRaw.startsWith('-')) {
          nextRaw = currentRaw.slice(1);
        } else if (currentRaw !== '0') {
          nextRaw = '-' + currentRaw;
        }
      } else {
        // Toggle MSB for binary / hex / octal
        const msb = 1n << BigInt(wordSize - 1);
        onChangeValue(normalizedVal ^ msb);
        return;
      }
    } else {
      // Append digit
      if (currentRaw === '0' && key !== '.') {
        nextRaw = key;
      } else {
        nextRaw = currentRaw + key;
      }
    }

    // Parse the updated string in the active base
    const radix = activeBase === 'HEX' ? 16 : activeBase === 'DEC' ? 10 : activeBase === 'OCT' ? 8 : 2;
    const { intBigInt, fractionVal, isNegative } = parseBaseFractional(nextRaw, radix);

    // Prevent typing values that exceed the current word size capacity
    if (intBigInt > mask) {
      return;
    }

    let maskedInt = intBigInt & mask;
    if (isNegative && activeBase === 'DEC') {
      maskedInt = (mask + 1n - (intBigInt & mask)) & mask;
    }

    onChangeValue(maskedInt);
    onChangeFraction(fractionVal);
  };

  // Keyboard listener for desktop and physical keyboards
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const key = e.key.toUpperCase();
      if ((key >= '0' && key <= '9') || (key >= 'A' && key <= 'F')) {
        if (isKeyActive(key)) {
          e.preventDefault();
          handleKeypadPress(key);
        }
      } else if (key === '.') {
        e.preventDefault();
        handleKeypadPress('.');
      } else if (key === 'BACKSPACE') {
        e.preventDefault();
        handleKeypadPress('BACKSPACE');
      } else if (key === 'ESCAPE') {
        e.preventDefault();
        handleKeypadPress('CLEAR');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBase, decData.main, hexData.main, octData.main, binData.main, wordSize, mask]);

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Determine which keys are active based on the selected card
  const isKeyActive = (key: string): boolean => {
    if (['CLEAR', 'BACKSPACE', '+/-', '.'].includes(key)) return true;
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

  const cards: {
    base: BaseType;
    label: string;
    radix: number;
    value: string;
    subValue?: string;
    raw: string;
    color: string;
    activeBorder: string;
    activeGlow: string;
    badgeBg: string;
  }[] = [
    {
      base: 'DEC',
      label: 'Decimal',
      radix: 10,
      value: decData.main,
      raw: decData.fullRaw,
      color: 'text-cyan-400',
      activeBorder: 'border-cyan-400',
      activeGlow: 'shadow-cyan-500/20 ring-1 ring-cyan-400/50',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    },
    {
      base: 'HEX',
      label: 'Hexadecimal',
      radix: 16,
      value: hexData.main,
      subValue: hexData.formatted !== hexData.main ? hexData.formatted : undefined,
      raw: hexData.fullRaw,
      color: 'text-amber-400',
      activeBorder: 'border-amber-400',
      activeGlow: 'shadow-amber-500/20 ring-1 ring-amber-400/50',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    {
      base: 'OCT',
      label: 'Octal',
      radix: 8,
      value: octData.main,
      raw: octData.fullRaw,
      color: 'text-purple-400',
      activeBorder: 'border-purple-400',
      activeGlow: 'shadow-purple-500/20 ring-1 ring-purple-400/50',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    },
    {
      base: 'BIN',
      label: 'Binary',
      radix: 2,
      value: binData.main,
      subValue: binData.formatted,
      raw: binData.fullRaw,
      color: 'text-emerald-400',
      activeBorder: 'border-emerald-400',
      activeGlow: 'shadow-emerald-500/20 ring-1 ring-emerald-400/50',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-20 sm:pb-6 max-w-xl mx-auto w-full">
      {/* 4 LARGE VERTICALLY STACKED CARDS */}
      <div className="flex flex-col gap-2.5">
        {cards.map((card) => {
          const isActive = activeBase === card.base;
          const isCopied = copiedKey === card.base;

          return (
            <div
              key={card.base}
              onClick={() => setActiveBase(card.base)}
              className={`p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border transition-all cursor-pointer relative shadow-md select-none ${
                isActive
                  ? `bg-slate-900 ${card.activeBorder} ${card.activeGlow}`
                  : 'border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/70'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${card.badgeBg}`}
                  >
                    BASE {card.radix}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    {card.label}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 animate-pulse">
                      ● Active Input
                    </span>
                  )}
                </div>

                {/* Copy Button */}
                <button
                  onClick={(e) => copyToClipboard(card.raw, card.base, e)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title={`Copy ${card.label}`}
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Large Value Display */}
              <div
                className={`font-mono text-xl sm:text-2xl font-bold tracking-tight break-all ${
                  isActive ? card.color : 'text-slate-200'
                }`}
              >
                {card.value || '0'}
              </div>

              {/* Formatted Nibble / Byte preview for Binary/Hex */}
              {card.subValue && card.subValue !== card.value && (
                <div className="text-[11px] font-mono text-slate-400 truncate mt-1">
                  Grouped: <span className="text-slate-300">{card.subValue}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FRACTION TOGGLE STRIP */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
        <span className="text-slate-400 font-medium">Fractional Digits:</span>
        <button
          onClick={() => setSupportFraction(!supportFraction)}
          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
            supportFraction
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          {supportFraction ? 'Fractions: ON' : 'Fractions: OFF'}
        </button>
      </div>

      {/* CONTEXTUAL ON-SCREEN KEYPAD (Only inputs numbers/letters, dynamically disables invalid keys) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
          <span>Keypad ({activeBase} Mode)</span>
          <span className="text-cyan-400 font-semibold">Tapping edits {activeBase}</span>
        </div>

        {/* Keypad Grid */}
        <div className="flex flex-col gap-1.5">
          {/* Hex Row (A - F) */}
          <div className="grid grid-cols-6 gap-1.5">
            {['A', 'B', 'C', 'D', 'E', 'F'].map((k) => {
              const active = isKeyActive(k);
              return (
                <button
                  key={k}
                  disabled={!active}
                  onClick={() => handleKeypadPress(k)}
                  className={`h-11 sm:h-12 rounded-xl font-mono text-sm sm:text-base font-bold transition-all flex items-center justify-center select-none ${
                    active
                      ? 'bg-amber-950/40 hover:bg-amber-900/60 active:scale-95 text-amber-300 border border-amber-800/60 shadow-sm'
                      : 'bg-slate-950/40 text-slate-700 border border-slate-900 cursor-not-allowed'
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>

          {/* Digits & Edits Grid (4 columns) */}
          <div className="grid grid-cols-4 gap-1.5">
            {/* Row 1: 7, 8, 9, Backspace */}
            {['7', '8', '9'].map((k) => {
              const active = isKeyActive(k);
              return (
                <button
                  key={k}
                  disabled={!active}
                  onClick={() => handleKeypadPress(k)}
                  className={`h-12 sm:h-14 rounded-xl font-mono text-lg font-bold transition-all flex items-center justify-center select-none ${
                    active
                      ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700/80 shadow-sm'
                      : 'bg-slate-950/40 text-slate-700 border border-slate-900 cursor-not-allowed'
                  }`}
                >
                  {k}
                </button>
              );
            })}
            <button
              onClick={() => handleKeypadPress('BACKSPACE')}
              className="h-12 sm:h-14 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-300 border border-slate-700/80 flex items-center justify-center transition-all select-none"
              title="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>

            {/* Row 2: 4, 5, 6, Clear */}
            {['4', '5', '6'].map((k) => {
              const active = isKeyActive(k);
              return (
                <button
                  key={k}
                  disabled={!active}
                  onClick={() => handleKeypadPress(k)}
                  className={`h-12 sm:h-14 rounded-xl font-mono text-lg font-bold transition-all flex items-center justify-center select-none ${
                    active
                      ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700/80 shadow-sm'
                      : 'bg-slate-950/40 text-slate-700 border border-slate-900 cursor-not-allowed'
                  }`}
                >
                  {k}
                </button>
              );
            })}
            <button
              onClick={() => handleKeypadPress('CLEAR')}
              className="h-12 sm:h-14 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 active:scale-95 text-rose-300 border border-rose-800/80 font-mono text-xs sm:text-sm font-bold flex items-center justify-center transition-all select-none"
            >
              CLR
            </button>

            {/* Row 3: 1, 2, 3, ± */}
            {['1', '2', '3'].map((k) => {
              const active = isKeyActive(k);
              return (
                <button
                  key={k}
                  disabled={!active}
                  onClick={() => handleKeypadPress(k)}
                  className={`h-12 sm:h-14 rounded-xl font-mono text-lg font-bold transition-all flex items-center justify-center select-none ${
                    active
                      ? 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700/80 shadow-sm'
                      : 'bg-slate-950/40 text-slate-700 border border-slate-900 cursor-not-allowed'
                  }`}
                >
                  {k}
                </button>
              );
            })}
            <button
              onClick={() => handleKeypadPress('+/-')}
              className="h-12 sm:h-14 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 border border-slate-700/80 font-mono text-base font-bold flex items-center justify-center transition-all select-none"
              title="Toggle negative (±)"
            >
              ±
            </button>

            {/* Row 4: 0 (span 2), . (decimal point), Next Base Switch */}
            <button
              disabled={!isKeyActive('0')}
              onClick={() => handleKeypadPress('0')}
              className="col-span-2 h-12 sm:h-14 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-700/80 font-mono text-lg font-bold flex items-center justify-center transition-all select-none"
            >
              0
            </button>
            <button
              disabled={!isKeyActive('.')}
              onClick={() => handleKeypadPress('.')}
              className="h-12 sm:h-14 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 border border-slate-700/80 font-mono text-xl font-bold flex items-center justify-center transition-all select-none"
            >
              .
            </button>
            <button
              onClick={() => {
                const baseOrder: BaseType[] = ['DEC', 'HEX', 'BIN', 'OCT'];
                const nextIdx = (baseOrder.indexOf(activeBase) + 1) % baseOrder.length;
                setActiveBase(baseOrder[nextIdx]);
              }}
              className="h-12 sm:h-14 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 active:scale-95 text-cyan-300 border border-cyan-800/80 font-mono text-xs font-bold flex items-center justify-center transition-all select-none"
              title="Cycle to next base"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
