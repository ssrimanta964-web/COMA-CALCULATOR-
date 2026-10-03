import React, { useState } from 'react';
import { WordSize } from '../types/calculator';
import { getByteBreakdown, getWordMask } from '../utils/numberEngine';
import { ArrowLeftRight, Check, HardDrive } from 'lucide-react';

interface MemoryInspectionProps {
  currentValue: bigint;
  wordSize: WordSize;
  onChangeValue: (newVal: bigint) => void;
}

export const MemoryInspection: React.FC<MemoryInspectionProps> = ({
  currentValue,
  wordSize,
  onChangeValue,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const mask = getWordMask(wordSize);
  const normalized = currentValue & mask;

  const { bigEndian, littleEndian } = getByteBreakdown(normalized, wordSize);

  const handleByteSwap = () => {
    let swapped = 0n;
    const numBytes = wordSize / 8;
    for (let i = 0; i < numBytes; i++) {
      const byteVal = (normalized >> BigInt(i * 8)) & 0xFFn;
      swapped = (swapped << 8n) | byteVal;
    }
    onChangeValue(swapped & mask);
  };

  const copyStr = (str: string, key: string) => {
    navigator.clipboard.writeText(str);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const bigHex = bigEndian.map((b) => b.hex).join(' ');
  const littleHex = littleEndian.map((b) => b.hex).join(' ');

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-teal-400" />
            Byte Order &amp; Memory Preview
          </h2>
          <p className="text-xs text-slate-400">
            Compare Big-Endian (network) and Little-Endian (PC / Phone) byte storage.
          </p>
        </div>

        <button
          onClick={handleByteSwap}
          className="px-3 py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-800/80 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" /> Reverse Bytes (Swap Endian)
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-teal-300">Little-Endian (PC, Phone, x86, ARM)</span>
            <button
              onClick={() => copyStr(littleHex, 'LE')}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              {copiedKey === 'LE' ? <span className="text-emerald-400">Copied!</span> : 'Copy'}
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-sm font-bold text-white tracking-wider border border-slate-800">
            {littleHex}
          </div>
          <p className="text-[11px] text-slate-400">Least significant byte stored first.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-300">Big-Endian (Network Order)</span>
            <button
              onClick={() => copyStr(bigHex, 'BE')}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              {copiedKey === 'BE' ? <span className="text-emerald-400">Copied!</span> : 'Copy'}
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-sm font-bold text-white tracking-wider border border-slate-800">
            {bigHex}
          </div>
          <p className="text-[11px] text-slate-400">Most significant byte stored first.</p>
        </div>
      </div>

      {/* ASCII Character Dump */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2 px-3">Byte</th>
              <th className="py-2 px-3">Hex</th>
              <th className="py-2 px-3">Binary</th>
              <th className="py-2 px-3">Decimal</th>
              <th className="py-2 px-3 text-cyan-400">Character (ASCII)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {bigEndian.map((byte, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30">
                <td className="py-1.5 px-3 text-slate-500">Byte {idx}</td>
                <td className="py-1.5 px-3 text-amber-400 font-bold">0x{byte.hex}</td>
                <td className="py-1.5 px-3 text-emerald-400">{byte.bin}</td>
                <td className="py-1.5 px-3 text-slate-300">{byte.dec}</td>
                <td className="py-1.5 px-3 text-cyan-400 font-bold text-sm">{byte.ascii}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
