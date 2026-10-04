import React, { useState } from 'react';
import { WordSize, BaseType, SignMode, ArithmeticOp, CpuFlags } from '../../types/calculator';
import {
  getWordMask,
  toTwosComplementSigned,
  onesComplement,
  twosComplementNegate,
  executeOperation,
  formatBinaryWithSpaces,
  formatHexWithSpaces,
} from '../../utils/numberEngine';
import { safeCopyToClipboard } from '../../utils/clipboard';
import {
  Layers,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';

interface ProgrammerTabProps {
  currentValue: bigint;
  onChangeValue: (newVal: bigint) => void;
  wordSize: WordSize;
  setWordSize: (size: WordSize) => void;
  signMode: SignMode;
  setSignMode: (mode: SignMode) => void;
  flags: CpuFlags;
  setFlags: (flags: CpuFlags) => void;
  onOperationRecorded: (opA: bigint, opB: bigint, op: ArithmeticOp) => void;
}

export const ProgrammerTab: React.FC<ProgrammerTabProps> = ({
  currentValue,
  onChangeValue,
  wordSize,
  setWordSize,
  signMode,
  setSignMode,
  flags,
  setFlags,
  onOperationRecorded,
}) => {
  const [activeBase, setActiveBase] = useState<BaseType>('HEX');
  const [operandAStr, setOperandAStr] = useState<string>('0');
  const [selectedOp, setSelectedOp] = useState<ArithmeticOp>('&');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const mask = getWordMask(wordSize);
  const normalizedVal = currentValue & mask;

  // Toggle individual bit
  const handleToggleBit = (bitIndex: number) => {
    const bitMask = 1n << BigInt(bitIndex);
    const toggled = (normalizedVal ^ bitMask) & mask;
    onChangeValue(toggled);
    const isZero = toggled === 0n;
    const isNegative = ((toggled >> BigInt(wordSize - 1)) & 1n) === 1n;
    setFlags({
      ...flags,
      zero: isZero,
      sign: isNegative,
    });
  };

  // Quick Bit Actions with live CPU flag calculation
  const handleSetAllZeros = () => {
    onChangeValue(0n);
    setFlags({ zero: true, sign: false, carry: false, overflow: false, parity: true });
  };
  const handleSetAllOnes = () => {
    onChangeValue(mask);
    const { flags: f } = executeOperation('|', mask, 0n, wordSize);
    setFlags(f);
  };
  const handleInvertAll = () => {
    const { resultMasked, flags: f } = executeOperation('~', normalizedVal, 0n, wordSize);
    onChangeValue(resultMasked);
    setFlags(f);
  };
  const handleNegate = () => {
    const { resultMasked, flags: f } = executeOperation('-', 0n, normalizedVal, wordSize);
    onChangeValue(resultMasked);
    setFlags(f);
  };

  const handleShiftLeft = () => {
    const { resultMasked, flags: f } = executeOperation('<<', normalizedVal, 1n, wordSize);
    onChangeValue(resultMasked);
    setFlags(f);
  };
  const handleShiftRight = () => {
    const { resultMasked, flags: f } = executeOperation('>>', normalizedVal, 1n, wordSize);
    onChangeValue(resultMasked);
    setFlags(f);
  };

  const handleRotateLeft = () => {
    const { resultMasked, flags: f } = executeOperation('ROL', normalizedVal, 1n, wordSize);
    onChangeValue(resultMasked);
    setFlags(f);
  };

  const handleRotateRight = () => {
    const { resultMasked, flags: f } = executeOperation('ROR', normalizedVal, 1n, wordSize);
    onChangeValue(resultMasked);
    setFlags(f);
  };

  // Execute bitwise operation with operand A
  const handleExecuteBitwise = (op: ArithmeticOp) => {
    let opBVal = 0n;
    try {
      if (activeBase === 'HEX') opBVal = BigInt('0x' + (operandAStr || '0')) & mask;
      else if (activeBase === 'DEC') opBVal = BigInt(operandAStr || '0') & mask;
      else if (activeBase === 'OCT') opBVal = BigInt('0o' + (operandAStr || '0')) & mask;
      else if (activeBase === 'BIN') opBVal = BigInt('0b' + (operandAStr || '0')) & mask;
    } catch {
      opBVal = 0n;
    }

    const { resultMasked, flags: newFlags } = executeOperation(
      op,
      normalizedVal,
      opBVal,
      wordSize
    );

    setFlags(newFlags);
    onOperationRecorded(normalizedVal, opBVal, op);
    onChangeValue(resultMasked);
  };

  // Formatted displays
  const hexStr = normalizedVal.toString(16).toUpperCase();
  const decStr = signMode === 'signed'
    ? toTwosComplementSigned(normalizedVal, wordSize).toString(10)
    : normalizedVal.toString(10);
  const binStr = normalizedVal.toString(2).padStart(wordSize, '0');

  // Group bits in 4-bit nibbles from MSB to LSB
  const nibbles = [];
  for (let i = wordSize - 1; i >= 0; i -= 4) {
    const bits = [];
    for (let b = i; b > i - 4 && b >= 0; b--) {
      const isSet = ((normalizedVal >> BigInt(b)) & 1n) === 1n;
      bits.push({ index: b, isSet });
    }
    nibbles.push({ startBit: i, bits });
  }

  const isSignBitSet = ((normalizedVal >> BigInt(wordSize - 1)) & 1n) === 1n;

  const copyValue = () => {
    safeCopyToClipboard(hexStr).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-24 sm:pb-6 max-w-xl mx-auto w-full">
      {/* 1. ARCHITECTURE & WORD SIZE TOGGLES */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
        {/* Word Size (8, 16, 32, 64) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 px-2 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" /> Size:
          </span>
          {([8, 16, 32, 64] as WordSize[]).map((bits) => {
            const isActive = wordSize === bits;
            return (
              <button
                key={bits}
                onClick={() => setWordSize(bits)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {bits}b
              </button>
            );
          })}
        </div>

        {/* Signed / Unsigned Mode */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'signed', label: "2's Comp (±)" },
            { id: 'unsigned', label: 'Unsigned (+)' },
          ].map((mode) => {
            const isActive = signMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSignMode(mode.id as SignMode)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN REGISTER DISPLAY WITH STATUS FLAGS */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 shadow-inner space-y-3">
        {/* Status Flags LED Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
            CPU Status Flags
          </span>
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
            {[
              { label: 'Z', tip: 'Zero Flag', set: flags.zero },
              { label: 'S', tip: 'Sign / Negative Flag', set: flags.sign },
              { label: 'C', tip: 'Carry / Borrow Flag', set: flags.carry },
              { label: 'V', tip: 'Overflow Flag', set: flags.overflow },
              { label: 'P', tip: 'Parity Flag', set: flags.parity },
            ].map((f) => (
              <div
                key={f.label}
                title={f.tip}
                className={`px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-all ${
                  f.set
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${f.set ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Register Value Display */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-slate-400 mb-0.5">
              Hex: <span className="text-amber-400 font-bold">0x{hexStr}</span> • Dec:{' '}
              <span className="text-cyan-400 font-bold">{decStr}</span>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight break-all">
              {hexStr}
            </div>
          </div>
          <button
            onClick={copyValue}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0"
            title="Copy Hex"
          >
            {isCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. INTERACTIVE BIT STRIP (The Visual Bit Matrix) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Interactive Bit-Strip</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                isSignBitSet
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              Sign = {isSignBitSet ? '1 (Neg)' : '0 (Pos)'}
            </span>
          </div>

          {/* Quick bit actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleShiftLeft}
              className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              title="Shift Left (&lt;&lt; 1)"
            >
              &lt;&lt; 1
            </button>
            <button
              onClick={handleShiftRight}
              className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              title="Shift Right (&gt;&gt; 1)"
            >
              &gt;&gt; 1
            </button>
            <button
              onClick={handleInvertAll}
              className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded border border-slate-700"
              title="Invert bits (NOT ~)"
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

        {/* 4-Bit Nibbles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {nibbles.map((nibble, nIdx) => (
            <div
              key={nIdx}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-1.5"
            >
              <div className="text-[9px] text-slate-400 font-mono text-center mb-1">
                {nibble.startBit}..{nibble.bits[nibble.bits.length - 1].index}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {nibble.bits.map(({ index, isSet }) => {
                  const isSign = index === wordSize - 1;
                  return (
                    <button
                      key={index}
                      onClick={() => handleToggleBit(index)}
                      className={`h-7 rounded-md font-mono text-xs font-bold transition-all flex items-center justify-center select-none ${
                        isSet
                          ? isSign
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                      title={`Bit ${index} (2^${index})`}
                    >
                      {isSet ? '1' : '0'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Set / Clear buttons */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSetAllZeros}
              className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white text-[11px] font-mono"
            >
              All 0s
            </button>
            <button
              onClick={handleSetAllOnes}
              className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white text-[11px] font-mono"
            >
              All 1s
            </button>
            <button
              onClick={handleRotateLeft}
              className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white text-[11px] font-mono"
            >
              RoL
            </button>
            <button
              onClick={handleRotateRight}
              className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white text-[11px] font-mono"
            >
              RoR
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {wordSize} bits active
          </div>
        </div>
      </div>

      {/* 4. BITWISE LOGIC OPERATOR CONTROLS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
        <span className="text-xs font-bold font-mono text-slate-300 block">
          Bitwise Logic Engine (Current Register [OP] Operand B):
        </span>

        {/* Operand B Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={operandAStr}
            onChange={(e) => setOperandAStr(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-400"
            placeholder={`Operand B in ${activeBase}...`}
          />
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['HEX', 'DEC', 'BIN'] as BaseType[]).map((b) => (
              <button
                key={b}
                onClick={() => setActiveBase(b)}
                className={`px-2 py-1 text-xs font-mono font-bold rounded-lg ${
                  activeBase === b ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Bitwise Operator Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {[
            { label: 'AND (&)', op: '&' as ArithmeticOp },
            { label: 'OR (|)', op: '|' as ArithmeticOp },
            { label: 'XOR (^)', op: '^' as ArithmeticOp },
            { label: 'NOT (~)', action: handleInvertAll },
            { label: 'SHL (<<)', op: '<<' as ArithmeticOp },
            { label: 'SAR (>>)', op: '>>' as ArithmeticOp },
            { label: 'RoL', action: handleRotateLeft },
            { label: 'RoR', action: handleRotateRight },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if ('action' in item && item.action) item.action();
                else if ('op' in item && item.op) handleExecuteBitwise(item.op);
              }}
              className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-cyan-300 border border-slate-700/80 font-mono text-xs font-bold transition-all shadow-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
