import React, { useState } from 'react';
import { WordSize, ArithmeticOp } from '../../types/calculator';
import {
  generateDivisionSteps,
  generateMultiplicationSteps,
  generateBinaryAdditionSteps,
  generateTwosComplementSteps,
} from '../../utils/stepBreakdown';
import { parseIeee754, getWordMask, getByteBreakdown } from '../../utils/numberEngine';
import {
  BookOpen,
  Table,
  Columns,
  Binary,
  Cpu,
  HardDrive,
  Check,
} from 'lucide-react';

interface LearnTabProps {
  currentValue: bigint;
  currentFraction: number;
  wordSize: WordSize;
  operandA: bigint;
  operandB: bigint;
  arithmeticOp: ArithmeticOp;
}

export const LearnTab: React.FC<LearnTabProps> = ({
  currentValue,
  currentFraction,
  wordSize,
  operandA,
  operandB,
  arithmeticOp,
}) => {
  const [activeSection, setActiveSection] = useState<'division' | 'carries' | 'twos' | 'float' | 'endian'>('division');
  const [targetBase, setTargetBase] = useState<number>(2);

  const mask = getWordMask(wordSize);
  const normalizedVal = currentValue & mask;

  const divisionSteps = generateDivisionSteps(normalizedVal, targetBase);
  const multiplicationSteps = generateMultiplicationSteps(currentFraction, targetBase, 6);
  const additionBreakdown = generateBinaryAdditionSteps(operandA, operandB, wordSize);
  const twosBreakdown = generateTwosComplementSteps(normalizedVal, wordSize);
  const ieee754 = parseIeee754(normalizedVal, wordSize);
  const { bigEndian, littleEndian } = getByteBreakdown(normalizedVal, wordSize);

  const sections = [
    { id: 'division' as const, label: 'Base Division', icon: Table },
    { id: 'carries' as const, label: 'Ripple Carries', icon: Columns },
    { id: 'twos' as const, label: "2's Complement", icon: Binary },
    { id: 'float' as const, label: 'IEEE-754 Float', icon: Cpu },
    { id: 'endian' as const, label: 'Endian Memory', icon: HardDrive },
  ];

  return (
    <div className="flex flex-col gap-4 pb-20 sm:pb-6 max-w-xl mx-auto w-full">
      {/* 1. SECTION PICKER PILLS */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-inner">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex-1 py-2 px-2.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. SCROLLABLE EDUCATIONAL CONTENT AREA */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* SECTION 1: DIVISION-BY-BASE STEPS */}
        {activeSection === 'division' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-cyan-400" />
                  Repeated Division Conversion Algorithm
                </h3>
                <p className="text-xs text-slate-400">
                  Converting Decimal <strong className="text-white">{normalizedVal.toString()}</strong> into:
                </p>
              </div>

              {/* Base Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { b: 2, label: 'Base 2' },
                  { b: 8, label: 'Base 8' },
                  { b: 16, label: 'Base 16' },
                ].map(({ b, label }) => (
                  <button
                    key={b}
                    onClick={() => setTargetBase(b)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      targetBase === b ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Division Steps Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Step</th>
                    <th className="py-2.5 px-3">Division</th>
                    <th className="py-2.5 px-3">Quotient</th>
                    <th className="py-2.5 px-3">Remainder</th>
                    <th className="py-2.5 px-3 text-cyan-400">Digit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {divisionSteps.map((step) => (
                    <tr key={step.step} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-500">{step.step}</td>
                      <td className="py-2 px-3 text-slate-300">
                        {step.dividend} ÷ {step.divisor}
                      </td>
                      <td className="py-2 px-3 text-slate-200">{step.quotient}</td>
                      <td className="py-2 px-3 text-amber-400 font-bold">{step.remainder}</td>
                      <td className="py-2 px-3 text-cyan-400 font-extrabold">{step.digitChar}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Result callout */}
            <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 flex items-center justify-between">
              <span>
                Read remainders from bottom to top:
                <strong className="text-white text-base font-mono font-bold block sm:inline sm:ml-2">
                  {divisionSteps.map((s) => s.digitChar).reverse().join('')}
                </strong>
              </span>
              <span className="text-slate-400 text-[11px] font-mono">Radix {targetBase}</span>
            </div>

            {/* Fractional steps if present */}
            {currentFraction > 0 && multiplicationSteps.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300 block">
                  Repeated Multiplication for Fraction:
                </span>
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Step</th>
                        <th className="py-2 px-3">Multiply</th>
                        <th className="py-2 px-3">Product</th>
                        <th className="py-2 px-3 text-cyan-400">Digit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {multiplicationSteps.map((s) => (
                        <tr key={s.step}>
                          <td className="py-1.5 px-3 text-slate-500">{s.step}</td>
                          <td className="py-1.5 px-3 text-slate-300">{s.fraction} × {s.multiplier}</td>
                          <td className="py-1.5 px-3 text-slate-300">{s.product}</td>
                          <td className="py-1.5 px-3 text-cyan-400 font-bold">{s.digitChar}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: RIPPLE CARRIES */}
        {activeSection === 'carries' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Columns className="w-4 h-4 text-blue-400" />
              Bitwise Column Ripple-Carry Addition
            </h3>
            <p className="text-xs text-slate-400">
              Breakdown of how binary columns add bit-by-bit from LSB to MSB with carries:
            </p>

            {/* Diagram */}
            <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs sm:text-sm border border-slate-800 overflow-x-auto space-y-1">
              <div className="text-amber-400">
                Carries:  {additionBreakdown.carries}
              </div>
              <div className="text-slate-300">
                Number A: {additionBreakdown.binaryA}
              </div>
              <div className="text-slate-300">
                + Op B:   {additionBreakdown.binaryB}
              </div>
              <div className="border-t border-slate-700 my-1" />
              <div className="text-cyan-400 font-bold">
                Sum:      {additionBreakdown.binaryResult}
              </div>
            </div>

            {/* Column explanations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {additionBreakdown.columns.slice(0, 16).map((col) => (
                <div
                  key={col.column}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono flex items-center justify-between"
                >
                  <span className="text-slate-300">{col.explanation}</span>
                  <span className="text-[10px] text-amber-400 font-bold">
                    C_out: {col.carryOut}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: TWO'S COMPLEMENT PROOF */}
        {activeSection === 'twos' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Binary className="w-4 h-4 text-emerald-400" />
              Two's Complement Negation Proof
            </h3>
            <p className="text-xs text-slate-400">
              Modern processors represent negative integers using Two's Complement. Negation is performed in 3 clear steps:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-mono font-bold text-blue-400">Step 1: Original</span>
                <p className="text-xs text-slate-400">Original binary bits:</p>
                <div className="p-2 rounded-xl bg-slate-900 font-mono text-xs text-blue-300 break-all font-semibold">
                  {twosBreakdown.originalBin}
                </div>
                <div className="text-[11px] text-slate-400">Dec: {twosBreakdown.originalDecimal}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-mono font-bold text-indigo-400">Step 2: Flip (NOT)</span>
                <p className="text-xs text-slate-400">Invert all 0s to 1s &amp; 1s to 0s:</p>
                <div className="p-2 rounded-xl bg-slate-900 font-mono text-xs text-indigo-300 break-all font-semibold">
                  {twosBreakdown.onesCompBin}
                </div>
                <div className="text-[11px] text-slate-400">One's complement</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400">Step 3: Add 1</span>
                <p className="text-xs text-slate-400">Add +1 to LSB to finish:</p>
                <div className="p-2 rounded-xl bg-slate-900 font-mono text-xs text-emerald-300 break-all font-bold">
                  {twosBreakdown.finalTwosCompBin}
                </div>
                <div className="text-[11px] text-emerald-400 font-bold">
                  Signed: {twosBreakdown.twosCompDecimal}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: IEEE-754 FLOATING POINT */}
        {activeSection === 'float' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              IEEE-754 Floating-Point Machine Representation
            </h3>
            <p className="text-xs text-slate-400">
              Formula: (-1)ˢ × 2^(Exponent - Bias) × (1 + Fraction)
            </p>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300">
                  <span className="text-[10px] text-rose-400 block">Sign [1b]</span>
                  <strong className="text-sm">{ieee754.signBit}</strong>
                </div>
                <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 flex-1 min-w-[120px]">
                  <span className="text-[10px] text-amber-400 block">Exponent [{ieee754.exponentBits.length}b]</span>
                  <strong className="text-sm tracking-wider">{ieee754.exponentBits}</strong>
                </div>
                <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 flex-2 min-w-[160px]">
                  <span className="text-[10px] text-cyan-400 block">Mantissa [{ieee754.mantissaBits.length}b]</span>
                  <strong className="text-xs truncate block">{ieee754.mantissaBits}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-slate-300">
                Decoded Float: <strong className="text-cyan-400">{ieee754.decimalValue.toExponential(4)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: ENDIAN MEMORY */}
        {activeSection === 'endian' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-teal-400" />
              Byte Ordering (Little-Endian vs Big-Endian)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-teal-300 block">Little-Endian (PC / Phone)</span>
                <div className="p-2 rounded-xl bg-slate-900 font-mono text-sm text-white font-bold tracking-wider">
                  {littleEndian.map((b) => b.hex).join(' ')}
                </div>
                <p className="text-[11px] text-slate-400">LSB at lowest memory address</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-blue-300 block">Big-Endian (Network)</span>
                <div className="p-2 rounded-xl bg-slate-900 font-mono text-sm text-white font-bold tracking-wider">
                  {bigEndian.map((b) => b.hex).join(' ')}
                </div>
                <p className="text-[11px] text-slate-400">MSB at lowest memory address</p>
              </div>
            </div>

            {/* ASCII Character Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Offset</th>
                    <th className="py-2 px-3">Hex</th>
                    <th className="py-2 px-3">Binary</th>
                    <th className="py-2 px-3 text-cyan-400">ASCII</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {bigEndian.map((b, i) => (
                    <tr key={i}>
                      <td className="py-1.5 px-3 text-slate-500">Byte {i}</td>
                      <td className="py-1.5 px-3 text-amber-400 font-bold">0x{b.hex}</td>
                      <td className="py-1.5 px-3 text-emerald-400">{b.bin}</td>
                      <td className="py-1.5 px-3 text-cyan-400 font-bold text-sm">{b.ascii}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
