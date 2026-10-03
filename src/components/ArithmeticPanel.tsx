import React, { useState } from 'react';
import { WordSize, BaseType, ArithmeticOp, SignMode } from '../types/calculator';
import {
  executeOperation,
  getWordMask,
  toTwosComplementSigned,
  onesComplement,
} from '../utils/numberEngine';
import {
  Calculator,
  ArrowRight,
  ArrowUpRight,
  Delete,
  Check,
} from 'lucide-react';

interface ArithmeticPanelProps {
  wordSize: WordSize;
  signMode: SignMode;
  onSendToRegister: (val: bigint) => void;
  activeRegisterValue: bigint;
  onSelectBreakdownOp?: (opA: bigint, opB: bigint, op: ArithmeticOp) => void;
}

export const ArithmeticPanel: React.FC<ArithmeticPanelProps> = ({
  wordSize,
  signMode,
  onSendToRegister,
  activeRegisterValue,
  onSelectBreakdownOp,
}) => {
  const [activeBase, setActiveBase] = useState<BaseType>('HEX');
  const [operandAStr, setOperandAStr] = useState<string>('0');
  const [operandBStr, setOperandBStr] = useState<string>('0');
  const [selectedOp, setSelectedOp] = useState<ArithmeticOp>('+');
  const [activeInput, setActiveInput] = useState<'A' | 'B'>('A');

  const mask = getWordMask(wordSize);

  const parseOperand = (str: string, base: BaseType): bigint => {
    const trimmed = str.trim();
    if (!trimmed) return 0n;
    try {
      if (base === 'HEX') return BigInt('0x' + trimmed) & mask;
      if (base === 'DEC') {
        const val = BigInt(trimmed);
        if (val < 0n) return (val + (1n << BigInt(wordSize))) & mask;
        return val & mask;
      }
      if (base === 'OCT') return BigInt('0o' + trimmed) & mask;
      if (base === 'BIN') return BigInt('0b' + trimmed) & mask;
      return 0n;
    } catch {
      return 0n;
    }
  };

  const opA = parseOperand(operandAStr, activeBase);
  const opB = parseOperand(operandBStr, activeBase);

  const { resultMasked, flags, error } = executeOperation(
    selectedOp,
    opA,
    opB,
    wordSize
  );

  const formatResultInBase = (val: bigint, base: BaseType): string => {
    switch (base) {
      case 'HEX':
        return '0x' + val.toString(16).toUpperCase();
      case 'DEC': {
        if (signMode === 'signed') {
          return toTwosComplementSigned(val, wordSize).toString(10);
        } else if (signMode === 'ones_complement') {
          return onesComplement(val, wordSize).toString(10);
        }
        return val.toString(10);
      }
      case 'OCT':
        return '0o' + val.toString(8);
      case 'BIN':
        return '0b' + val.toString(2).padStart(wordSize, '0');
    }
  };

  const handleSwitchBase = (newBase: BaseType) => {
    if (newBase === activeBase) return;

    const convertValueToStr = (val: bigint, b: BaseType): string => {
      switch (b) {
        case 'HEX':
          return val.toString(16).toUpperCase();
        case 'DEC':
          return signMode === 'signed'
            ? toTwosComplementSigned(val, wordSize).toString(10)
            : val.toString(10);
        case 'OCT':
          return val.toString(8);
        case 'BIN':
          return val.toString(2);
      }
    };

    setOperandAStr(convertValueToStr(opA, newBase));
    setOperandBStr(convertValueToStr(opB, newBase));
    setActiveBase(newBase);
  };

  const handleKeypadPress = (key: string) => {
    const currentStr = activeInput === 'A' ? operandAStr : operandBStr;
    const setter = activeInput === 'A' ? setOperandAStr : setOperandBStr;

    if (key === 'CLEAR') {
      setter('0');
      return;
    }
    if (key === 'BACKSPACE') {
      if (currentStr.length <= 1) {
        setter('0');
      } else {
        setter(currentStr.slice(0, -1));
      }
      return;
    }

    if (key === '+/-') {
      if (activeBase === 'DEC') {
        if (currentStr.startsWith('-')) {
          setter(currentStr.slice(1));
        } else if (currentStr !== '0') {
          setter('-' + currentStr);
        }
      }
      return;
    }

    if (currentStr === '0') {
      setter(key);
    } else {
      setter(currentStr + key);
    }
  };

  const isKeyActive = (key: string): boolean => {
    if (['CLEAR', 'BACKSPACE', '+/-'].includes(key)) return true;
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

  const operations: { op: ArithmeticOp; label: string; desc: string }[] = [
    { op: '+', label: '+', desc: 'Add' },
    { op: '-', label: '−', desc: 'Subtract' },
    { op: '×', label: '×', desc: 'Multiply' },
    { op: '÷', label: '÷', desc: 'Divide' },
    { op: '%', label: '%', desc: 'Modulo' },
    { op: '&', label: 'AND', desc: 'Bitwise AND' },
    { op: '|', label: 'OR', desc: 'Bitwise OR' },
    { op: '^', label: 'XOR', desc: 'Bitwise XOR' },
    { op: '~', label: 'NOT', desc: 'Bitwise NOT' },
    { op: '<<', label: '<<', desc: 'Shift Left' },
    { op: '>>', label: '>>', desc: 'Shift Right' },
  ];

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
      {/* Header with Base selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-400" />
            Computer Calculator &amp; Bitwise Math
          </h2>
          <p className="text-xs text-slate-400">
            Perform arithmetic and bitwise logic across any base.
          </p>
        </div>

        {/* Base switcher tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 px-2 font-medium">Base:</span>
          {(['HEX', 'DEC', 'OCT', 'BIN'] as BaseType[]).map((base) => (
            <button
              key={base}
              onClick={() => handleSwitchBase(base)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                activeBase === base
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {base}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Operands & Result (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Numbers box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            {/* Number A */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-200">
                  First Number (Operand A)
                </span>
                <button
                  onClick={() => {
                    const str = activeBase === 'HEX' ? activeRegisterValue.toString(16).toUpperCase()
                              : activeBase === 'DEC' ? activeRegisterValue.toString(10)
                              : activeBase === 'OCT' ? activeRegisterValue.toString(8)
                              : activeRegisterValue.toString(2);
                    setOperandAStr(str);
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <ArrowUpRight className="w-3 h-3" /> Use Active Value
                </button>
              </div>
              <input
                type="text"
                value={operandAStr}
                onFocus={() => setActiveInput('A')}
                onChange={(e) => setOperandAStr(e.target.value)}
                className={`w-full bg-slate-900 border rounded-lg text-lg font-mono font-bold text-white px-3 py-2 outline-none transition-all ${
                  activeInput === 'A'
                    ? 'border-blue-500 ring-1 ring-blue-500/40'
                    : 'border-slate-800'
                }`}
                placeholder="Enter value A..."
              />
            </div>

            {/* Selected Operation Banner */}
            <div className="flex items-center justify-center">
              <span className="px-3 py-1 rounded-full bg-slate-900 text-blue-400 font-bold text-sm border border-slate-800">
                {selectedOp}
              </span>
            </div>

            {/* Number B */}
            {selectedOp !== '~' && (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-200">
                    Second Number (Operand B)
                  </span>
                  <button
                    onClick={() => {
                      const str = activeBase === 'HEX' ? activeRegisterValue.toString(16).toUpperCase()
                                : activeBase === 'DEC' ? activeRegisterValue.toString(10)
                                : activeBase === 'OCT' ? activeRegisterValue.toString(8)
                                : activeRegisterValue.toString(2);
                      setOperandBStr(str);
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <ArrowUpRight className="w-3 h-3" /> Use Active Value
                  </button>
                </div>
                <input
                  type="text"
                  value={operandBStr}
                  onFocus={() => setActiveInput('B')}
                  onChange={(e) => setOperandBStr(e.target.value)}
                  className={`w-full bg-slate-900 border rounded-lg text-lg font-mono font-bold text-white px-3 py-2 outline-none transition-all ${
                    activeInput === 'B'
                      ? 'border-blue-500 ring-1 ring-blue-500/40'
                      : 'border-slate-800'
                  }`}
                  placeholder="Enter value B..."
                />
              </div>
            )}

            {/* Calculation Result */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">Result:</span>
                <button
                  onClick={() => onSendToRegister(resultMasked)}
                  className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-[11px] font-semibold transition-colors"
                >
                  Set as Active Value
                </button>
              </div>

              {error ? (
                <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs">
                  {error}
                </div>
              ) : (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                  <span className="text-xl md:text-2xl font-mono font-bold text-cyan-400">
                    {formatResultInBase(resultMasked, activeBase)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Decimal: {resultMasked.toString(10)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Simple Keypad */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Keypad ({activeBase} mode)</span>
              <span className="text-blue-400 font-semibold">Editing Operand {activeInput}</span>
            </div>

            {/* Hex keys row if HEX */}
            <div className="grid grid-cols-6 gap-1">
              {['A', 'B', 'C', 'D', 'E', 'F'].map((k) => {
                const active = isKeyActive(k);
                return (
                  <button
                    key={k}
                    disabled={!active}
                    onClick={() => handleKeypadPress(k)}
                    className={`py-1.5 rounded font-mono font-bold text-xs transition-all ${
                      active
                        ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40'
                        : 'bg-slate-900/40 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {k}
                  </button>
                );
              })}
            </div>

            {/* Numbers row 7-9, 4-6, 1-3 */}
            <div className="grid grid-cols-4 gap-1">
              {['7', '8', '9'].map((k) => (
                <button
                  key={k}
                  disabled={!isKeyActive(k)}
                  onClick={() => handleKeypadPress(k)}
                  className={`py-2 rounded font-mono font-bold text-sm ${
                    isKeyActive(k)
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-slate-900/40 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {k}
                </button>
              ))}
              <button
                onClick={() => handleKeypadPress('BACKSPACE')}
                className="py-2 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 flex items-center justify-center"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>

              {['4', '5', '6'].map((k) => (
                <button
                  key={k}
                  disabled={!isKeyActive(k)}
                  onClick={() => handleKeypadPress(k)}
                  className={`py-2 rounded font-mono font-bold text-sm ${
                    isKeyActive(k)
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-slate-900/40 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {k}
                </button>
              ))}
              <button
                onClick={() => handleKeypadPress('CLEAR')}
                className="py-2 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold font-mono"
              >
                CLR
              </button>

              {['1', '2', '3'].map((k) => (
                <button
                  key={k}
                  disabled={!isKeyActive(k)}
                  onClick={() => handleKeypadPress(k)}
                  className={`py-2 rounded font-mono font-bold text-sm ${
                    isKeyActive(k)
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-slate-900/40 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {k}
                </button>
              ))}
              <button
                onClick={() => handleKeypadPress('+/-')}
                disabled={activeBase !== 'DEC'}
                className={`py-2 rounded font-mono font-bold text-xs ${
                  activeBase === 'DEC'
                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                    : 'bg-slate-900/40 text-slate-600 cursor-not-allowed'
                }`}
              >
                ±
              </button>

              <button
                onClick={() => handleKeypadPress('0')}
                className="col-span-2 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-mono font-bold"
              >
                0
              </button>
              <button
                onClick={() => setActiveInput(activeInput === 'A' ? 'B' : 'A')}
                className="col-span-2 py-2 rounded bg-blue-950/70 hover:bg-blue-900/80 text-blue-300 border border-blue-800 text-xs font-medium flex items-center justify-center gap-1"
              >
                Switch to Op {activeInput === 'A' ? 'B' : 'A'} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Operations & Status Flags (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Operations list */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              Choose Operation:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {operations.map((o) => (
                <button
                  key={o.op}
                  onClick={() => setSelectedOp(o.op)}
                  className={`py-2 px-2 text-xs font-mono font-bold rounded-lg transition-all ${
                    selectedOp === o.op
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                  title={o.desc}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Simple CPU Status Flags */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 block">
              CPU Status Flags:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className={`p-2 rounded-lg border flex items-center justify-between ${
                  flags.zero
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span>Zero (Z)</span>
                <span className="font-bold">{flags.zero ? 'YES' : 'NO'}</span>
              </div>
              <div
                className={`p-2 rounded-lg border flex items-center justify-between ${
                  flags.sign
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span>Negative (S)</span>
                <span className="font-bold">{flags.sign ? 'YES' : 'NO'}</span>
              </div>
              <div
                className={`p-2 rounded-lg border flex items-center justify-between ${
                  flags.carry
                    ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span>Carry (C)</span>
                <span className="font-bold">{flags.carry ? 'YES' : 'NO'}</span>
              </div>
              <div
                className={`p-2 rounded-lg border flex items-center justify-between ${
                  flags.overflow
                    ? 'bg-purple-950/60 border-purple-800 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <span>Overflow (V)</span>
                <span className="font-bold">{flags.overflow ? 'YES' : 'NO'}</span>
              </div>
            </div>

            {/* Inspect Breakdown Button */}
            {['+', '-'].includes(selectedOp) && onSelectBreakdownOp && (
              <button
                onClick={() => onSelectBreakdownOp(opA, opB, selectedOp)}
                className="w-full mt-2 py-2 rounded-lg bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                Inspect Carries in Step-by-Step Guide <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
