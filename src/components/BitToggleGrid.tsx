import React from 'react';
import { WordSize, SignMode } from '../types/calculator';
import { getWordMask, onesComplement, twosComplementNegate } from '../utils/numberEngine';
import {
  ToggleLeft,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface BitToggleGridProps {
  currentValue: bigint;
  onChangeValue: (newVal: bigint) => void;
  wordSize: WordSize;
  signMode: SignMode;
}

export const BitToggleGrid: React.FC<BitToggleGridProps> = ({
  currentValue,
  onChangeValue,
  wordSize,
  signMode,
}) => {
  const mask = getWordMask(wordSize);
  const normalized = currentValue & mask;

  const handleToggleBit = (bitIndex: number) => {
    const bitMask = 1n << BigInt(bitIndex);
    const toggled = normalized ^ bitMask;
    onChangeValue(toggled & mask);
  };

  const handleSetAllZeros = () => onChangeValue(0n);
  const handleSetAllOnes = () => onChangeValue(mask);
  const handleInvertAll = () => onChangeValue(onesComplement(normalized, wordSize));
  const handleNegate = () => onChangeValue(twosComplementNegate(normalized, wordSize));

  const handleShiftLeft = () => onChangeValue((normalized << 1n) & mask);
  const handleShiftRight = () => onChangeValue((normalized >> 1n) & mask);

  // Group bits in 4-bit nibbles from MSB to LSB
  const nibbles: { nibbleIndex: number; bits: { index: number; isSet: boolean }[] }[] = [];
  for (let i = wordSize - 1; i >= 0; i -= 4) {
    const nibbleBits = [];
    for (let b = i; b > i - 4 && b >= 0; b--) {
      const isSet = ((normalized >> BigInt(b)) & 1n) === 1n;
      nibbleBits.push({ index: b, isSet });
    }
    nibbles.push({ nibbleIndex: Math.floor(i / 4), bits: nibbleBits });
  }

  const isSignBitSet = ((normalized >> BigInt(wordSize - 1)) & 1n) === 1n;

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-emerald-400" />
            Interactive Bit Strip ({wordSize}-Bit)
          </h2>
          <p className="text-xs text-slate-400">
            Click any bit below to toggle it on (1) or off (0).
          </p>
        </div>

        {/* Friendly Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleShiftLeft}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors flex items-center gap-1"
            title="Shift all bits left by 1"
          >
            <ArrowLeft className="w-3 h-3" /> Shift Left
          </button>
          <button
            onClick={handleShiftRight}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors flex items-center gap-1"
            title="Shift all bits right by 1"
          >
            Shift Right <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={handleInvertAll}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-md border border-slate-700 transition-colors"
            title="Invert all bits (0 becomes 1, 1 becomes 0)"
          >
            Invert (NOT)
          </button>
          <button
            onClick={handleNegate}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-md border border-slate-700 transition-colors"
            title="Negate value (Two's complement)"
          >
            Negate (±)
          </button>
          <button
            onClick={handleSetAllZeros}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md border border-slate-700 transition-colors"
            title="Set all bits to 0"
          >
            All 0s
          </button>
          <button
            onClick={handleSetAllOnes}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md border border-slate-700 transition-colors"
            title="Set all bits to 1"
          >
            All 1s
          </button>
        </div>
      </div>

      {/* Sign Bit Status Note */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>Highest Bit (Bit {wordSize - 1}):</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${
              isSignBitSet
                ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
            }`}
          >
            {isSignBitSet ? '1 (Negative in signed mode)' : '0 (Positive)'}
          </span>
        </div>
        <div className="text-slate-400 hidden sm:block">
          Lowest Bit (Bit 0): Value = 1
        </div>
      </div>

      {/* Clean, readable bit boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
        {nibbles.map((nibble, nIdx) => (
          <div
            key={nIdx}
            className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 flex flex-col justify-between"
          >
            {/* Nibble label */}
            <div className="text-[10px] text-slate-400 font-mono text-center mb-1.5">
              Bits {nibble.bits[0].index}..{nibble.bits[nibble.bits.length - 1].index}
            </div>

            {/* 4 bits in this group */}
            <div className="grid grid-cols-4 gap-1">
              {nibble.bits.map(({ index, isSet }) => {
                const isSignBit = index === wordSize - 1;
                return (
                  <button
                    key={index}
                    onClick={() => handleToggleBit(index)}
                    className={`py-2 rounded-lg font-mono flex flex-col items-center justify-center transition-all select-none ${
                      isSet
                        ? isSignBit
                          ? 'bg-rose-600 text-white font-bold shadow-sm'
                          : 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                    }`}
                    title={`Bit ${index} (Weight: 2^${index})`}
                  >
                    <span className="text-sm font-bold leading-none">
                      {isSet ? '1' : '0'}
                    </span>
                    <span className="text-[9px] mt-1 text-slate-400 leading-none">
                      {index}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
