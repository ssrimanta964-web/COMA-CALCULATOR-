import React, { useState } from 'react';
import { BaseType, WordSize, SignMode } from '../types/calculator';
import {
  toTwosComplementSigned,
  onesComplement,
  formatBinaryWithSpaces,
  formatHexWithSpaces,
  fractionToBaseString,
  getWordMask,
} from '../utils/numberEngine';
import { Copy, Check, ArrowRightLeft, SlidersHorizontal, AlertCircle } from 'lucide-react';

interface BaseConverterProps {
  currentValue: bigint;
  currentFraction: number;
  onChangeInteger: (newVal: bigint) => void;
  onChangeFraction: (newFrac: number) => void;
  wordSize: WordSize;
  signMode: SignMode;
  supportFraction: boolean;
  setSupportFraction: (val: boolean) => void;
  fractionPrecision: number;
  setFractionPrecision: (val: number) => void;
}

export const BaseConverter: React.FC<BaseConverterProps> = ({
  currentValue,
  currentFraction,
  onChangeInteger,
  onChangeFraction,
  wordSize,
  signMode,
  supportFraction,
  setSupportFraction,
  fractionPrecision,
  setFractionPrecision,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mask = getWordMask(wordSize);
  const normalizedVal = currentValue & mask;

  // Formatted representations
  const hexIntStr = normalizedVal.toString(16).toUpperCase();
  const hexFracInfo = fractionToBaseString(currentFraction, 16, fractionPrecision);
  const hexFullStr = supportFraction && currentFraction > 0
    ? `${hexIntStr}.${hexFracInfo.resultStr}`
    : hexIntStr;

  let decIntStr = normalizedVal.toString(10);
  if (signMode === 'signed') {
    const signed = toTwosComplementSigned(normalizedVal, wordSize);
    decIntStr = signed.toString(10);
  } else if (signMode === 'ones_complement') {
    const ones = onesComplement(normalizedVal, wordSize);
    decIntStr = ones.toString(10);
  }
  const decFullStr = supportFraction && currentFraction > 0
    ? `${decIntStr}.${currentFraction.toFixed(fractionPrecision).slice(2)}`
    : decIntStr;

  const octIntStr = normalizedVal.toString(8);
  const octFracInfo = fractionToBaseString(currentFraction, 8, fractionPrecision);
  const octFullStr = supportFraction && currentFraction > 0
    ? `${octIntStr}.${octFracInfo.resultStr}`
    : octIntStr;

  const binIntStr = normalizedVal.toString(2).padStart(wordSize, '0');
  const binFracInfo = fractionToBaseString(currentFraction, 2, fractionPrecision);
  const binFullStr = supportFraction && currentFraction > 0
    ? `${binIntStr}.${binFracInfo.resultStr}`
    : binIntStr;

  const copyValue = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleInputChange = (rawVal: string, base: BaseType) => {
    const cleanVal = rawVal.trim();
    if (!cleanVal) {
      onChangeInteger(0n);
      onChangeFraction(0);
      setErrorMessage(null);
      return;
    }

    let regex: RegExp;
    let baseRadix: number;
    switch (base) {
      case 'BIN':
        regex = /^[0-1]+(\.[0-1]*)?$/;
        baseRadix = 2;
        break;
      case 'OCT':
        regex = /^[0-7]+(\.[0-7]*)?$/;
        baseRadix = 8;
        break;
      case 'DEC':
        regex = /^-?[0-9]+(\.[0-9]*)?$/;
        baseRadix = 10;
        break;
      case 'HEX':
        regex = /^[0-9a-fA-F]+(\.[0-9a-fA-F]*)?$/;
        baseRadix = 16;
        break;
    }

    if (!regex.test(cleanVal)) {
      setErrorMessage(`Please enter valid digits for ${base} (Base ${baseRadix})`);
      return;
    }
    setErrorMessage(null);

    const parts = cleanVal.split('.');
    const intPartStr = parts[0] || '0';
    const fracPartStr = parts[1] || '';

    let newInt = 0n;
    try {
      if (base === 'DEC') {
        const decVal = BigInt(intPartStr);
        if (decVal < 0n) {
          newInt = (decVal + (1n << BigInt(wordSize))) & mask;
        } else {
          newInt = decVal & mask;
        }
      } else if (base === 'HEX') {
        newInt = BigInt('0x' + intPartStr) & mask;
      } else if (base === 'OCT') {
        newInt = BigInt('0o' + intPartStr) & mask;
      } else if (base === 'BIN') {
        newInt = BigInt('0b' + intPartStr) & mask;
      }
    } catch {
      return;
    }

    let newFrac = 0;
    if (supportFraction && fracPartStr) {
      for (let i = 0; i < fracPartStr.length; i++) {
        const digitVal = parseInt(fracPartStr[i], baseRadix);
        if (!isNaN(digitVal)) {
          newFrac += digitVal * Math.pow(baseRadix, -(i + 1));
        }
      }
    }

    onChangeInteger(newInt);
    onChangeFraction(newFrac);
  };

  const cards = [
    {
      key: 'DEC' as BaseType,
      name: 'Decimal (Base 10)',
      value: decFullStr,
      prefix: '',
      hint: 'Digits: 0-9',
      color: 'blue',
      badge: 'Normal / Everyday',
    },
    {
      key: 'HEX' as BaseType,
      name: 'Hexadecimal (Base 16)',
      value: hexFullStr,
      prefix: '0x',
      hint: 'Digits: 0-9, A-F',
      color: 'amber',
      badge: 'Code & Memory',
    },
    {
      key: 'BIN' as BaseType,
      name: 'Binary (Base 2)',
      value: binFullStr,
      prefix: '0b',
      hint: 'Digits: 0, 1',
      color: 'emerald',
      badge: 'Raw Bits',
      spaced: formatBinaryWithSpaces(binIntStr, wordSize),
    },
    {
      key: 'OCT' as BaseType,
      name: 'Octal (Base 8)',
      value: octFullStr,
      prefix: '0o',
      hint: 'Digits: 0-7',
      color: 'purple',
      badge: 'Permissions / Legacy',
    },
  ];

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
      {/* Friendly Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-400" />
            Base Number Converter
          </h2>
          <p className="text-xs text-slate-400">
            Type any number below — all bases update instantly.
          </p>
        </div>

        {/* Friendly Fractions Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSupportFraction(!supportFraction)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              supportFraction
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {supportFraction ? 'Fractions: Enabled' : 'Enable Fractions'}
          </button>

          {supportFraction && (
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Decimals:</span>
              {[4, 8, 12].map((p) => (
                <button
                  key={p}
                  onClick={() => setFractionPrecision(p)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                    fractionPrecision === p
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error message banner if any */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* 4 Clean Base Input Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {cards.map((c) => {
          const isCopied = copiedKey === c.key;
          return (
            <div
              key={c.key}
              className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 hover:border-slate-700 transition-all focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/30"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">
                    {c.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {c.hint}
                  </span>
                </div>
                <button
                  onClick={() => copyValue(c.value, c.key)}
                  className="px-2 py-1 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 transition-colors"
                  title="Copy value"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Input field */}
              <div className="relative">
                {c.prefix && (
                  <span className="absolute left-3 top-2.5 font-mono text-sm text-slate-400 select-none font-bold">
                    {c.prefix}
                  </span>
                )}
                <input
                  type="text"
                  value={c.value}
                  onChange={(e) => handleInputChange(e.target.value, c.key)}
                  className={`w-full bg-slate-900 border border-slate-800 rounded-lg text-base font-mono font-bold text-white py-2 px-3 outline-none transition-all ${
                    c.prefix ? 'pl-9' : ''
                  }`}
                  placeholder={`Enter ${c.key}...`}
                  spellCheck={false}
                />
              </div>

              {/* Friendly spaced binary preview if binary */}
              {c.key === 'BIN' && (
                <div className="mt-2 text-[11px] font-mono text-slate-400 truncate">
                  <span className="text-slate-400">4-bit groups: </span>
                  <span className="text-emerald-400 font-semibold">{c.spaced}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
