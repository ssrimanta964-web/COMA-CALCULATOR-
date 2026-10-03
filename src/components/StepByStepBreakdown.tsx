import React, { useState } from 'react';
import { WordSize, ArithmeticOp } from '../types/calculator';
import {
  generateDivisionSteps,
  generateMultiplicationSteps,
  generateBinaryAdditionSteps,
  generateBinarySubtractionSteps,
  generateTwosComplementSteps,
} from '../utils/stepBreakdown';
import { parseIeee754, getWordMask } from '../utils/numberEngine';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Table,
  Columns,
  Binary,
  Cpu,
} from 'lucide-react';

interface StepByStepBreakdownProps {
  currentValue: bigint;
  currentFraction: number;
  wordSize: WordSize;
  operandA: bigint;
  operandB: bigint;
  arithmeticOp: ArithmeticOp;
}

export const StepByStepBreakdown: React.FC<StepByStepBreakdownProps> = ({
  currentValue,
  currentFraction,
  wordSize,
  operandA,
  operandB,
  arithmeticOp,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'conversion' | 'arithmetic' | 'twosComp' | 'ieee754'>(
    'conversion'
  );
  const [targetBase, setTargetBase] = useState<number>(2);

  const mask = getWordMask(wordSize);
  const normalizedVal = currentValue & mask;

  const divisionSteps = generateDivisionSteps(normalizedVal, targetBase);
  const multiplicationSteps = generateMultiplicationSteps(currentFraction, targetBase, 6);
  const additionBreakdown = generateBinaryAdditionSteps(operandA, operandB, wordSize);
  const subtractionBreakdown = generateBinarySubtractionSteps(operandA, operandB, wordSize);
  const twosCompBreakdown = generateTwosComplementSteps(normalizedVal, wordSize);
  const ieee754Breakdown = parseIeee754(normalizedVal, wordSize);

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-lg overflow-hidden transition-all">
      {/* Clickable Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 select-none transition-colors border-b border-slate-800"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Step-by-Step Educational Guide
            </h2>
            <p className="text-xs text-slate-400">
              Clear visual explanations of how base conversions, binary carries, and two's complement work.
            </p>
          </div>
        </div>

        <button className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* Subtabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            {[
              { id: 'conversion', label: '1. Base Conversion Steps', icon: Table },
              { id: 'arithmetic', label: '2. Binary Addition & Carries', icon: Columns },
              { id: 'twosComp', label: "3. Two's Complement", icon: Binary },
              { id: 'ieee754', label: '4. Float (IEEE-754)', icon: Cpu },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: Base Conversion */}
          {activeTab === 'conversion' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300">
                  Converting Decimal <strong className="text-white">{normalizedVal.toString()}</strong> to:
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { base: 2, label: 'Binary (Base 2)' },
                    { base: 8, label: 'Octal (Base 8)' },
                    { base: 16, label: 'Hexadecimal (Base 16)' },
                  ].map((b) => (
                    <button
                      key={b.base}
                      onClick={() => setTargetBase(b.base)}
                      className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                        targetBase === b.base
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table of steps */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Step</th>
                      <th className="py-2 px-3">Division (Value ÷ {targetBase})</th>
                      <th className="py-2 px-3">Quotient</th>
                      <th className="py-2 px-3">Remainder</th>
                      <th className="py-2 px-3 text-cyan-400">Digit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {divisionSteps.map((step) => (
                      <tr key={step.step} className="hover:bg-slate-800/30">
                        <td className="py-1.5 px-3 text-slate-500">{step.step}</td>
                        <td className="py-1.5 px-3 text-slate-300">
                          {step.dividend} ÷ {step.divisor}
                        </td>
                        <td className="py-1.5 px-3 text-slate-300">{step.quotient}</td>
                        <td className="py-1.5 px-3 text-amber-400 font-bold">{step.remainder}</td>
                        <td className="py-1.5 px-3 text-cyan-400 font-bold">{step.digitChar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 flex items-center justify-between">
                <span>
                  Result (Read remainders from bottom to top):{' '}
                  <strong className="text-white text-sm font-mono font-bold">
                    {divisionSteps.map((s) => s.digitChar).reverse().join('')}
                  </strong>
                </span>
                <span className="text-slate-400 text-[11px]">Base {targetBase} Integer</span>
              </div>

              {/* Fractional Steps (if fraction present) */}
              {currentFraction > 0 && multiplicationSteps.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-300 block">
                    Part B: Fractional Part via Repeated Multiplication by {targetBase}
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Step</th>
                          <th className="py-2 px-3">Fraction × Base</th>
                          <th className="py-2 px-3">Product</th>
                          <th className="py-2 px-3 text-cyan-400">Extracted Digit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {multiplicationSteps.map((step) => (
                          <tr key={step.step} className="hover:bg-slate-800/30">
                            <td className="py-1.5 px-3 text-slate-500">{step.step}</td>
                            <td className="py-1.5 px-3 text-slate-300">
                              {step.fraction} × {step.multiplier}
                            </td>
                            <td className="py-1.5 px-3 text-slate-300">{step.product}</td>
                            <td className="py-1.5 px-3 text-cyan-400 font-bold">{step.digitChar}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 flex items-center justify-between">
                    <span>
                      Fractional Result (Read top to bottom):{' '}
                      <strong className="text-white text-sm font-mono font-bold">
                        0.{multiplicationSteps.map((s) => s.digitChar).join('')}
                      </strong>
                    </span>
                    <span className="text-slate-400 text-[11px]">Base {targetBase} Fraction</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Binary Arithmetic */}
          {activeTab === 'arithmetic' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">
                  Column-by-Column Binary Addition Diagram:
                </span>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs sm:text-sm overflow-x-auto space-y-1">
                  <div className="text-amber-400">
                    Carries:  {additionBreakdown.carries}
                  </div>
                  <div className="text-slate-200">
                    Number A: {additionBreakdown.binaryA}
                  </div>
                  <div className="text-slate-200">
                    Number B: {additionBreakdown.binaryB}
                  </div>
                  <div className="border-t border-slate-700 my-1" />
                  <div className="text-cyan-400 font-bold">
                    Sum:      {additionBreakdown.binaryResult}
                  </div>
                </div>
              </div>

              {/* Explanations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {additionBreakdown.columns.slice(0, 16).map((col) => (
                  <div
                    key={col.column}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between"
                  >
                    <span>{col.explanation}</span>
                    <span className="text-[10px] text-amber-400 font-bold font-mono">
                      Carry: {col.carryOut}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Two's Complement */}
          {activeTab === 'twosComp' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-blue-400">Step 1: Original</span>
                <p className="text-xs text-slate-400">Start with the positive number:</p>
                <div className="p-2 rounded bg-slate-900 font-mono text-xs text-blue-300 break-all">
                  {twosCompBreakdown.originalBin}
                </div>
                <div className="text-xs text-slate-400">Value: {twosCompBreakdown.originalDecimal}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-400">Step 2: Flip Bits (NOT)</span>
                <p className="text-xs text-slate-400">Flip all 0s to 1s and 1s to 0s:</p>
                <div className="p-2 rounded bg-slate-900 font-mono text-xs text-indigo-300 break-all">
                  {twosCompBreakdown.onesCompBin}
                </div>
                <div className="text-xs text-slate-400">One's complement</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400">Step 3: Add 1</span>
                <p className="text-xs text-slate-400">Add 1 to complete the negation:</p>
                <div className="p-2 rounded bg-slate-900 font-mono text-xs text-emerald-300 break-all font-bold">
                  {twosCompBreakdown.finalTwosCompBin}
                </div>
                <div className="text-xs text-emerald-400 font-bold">
                  Signed: {twosCompBreakdown.twosCompDecimal}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: IEEE-754 */}
          {activeTab === 'ieee754' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-200 block">
                Floating Point Bits (Sign, Exponent, Mantissa):
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300">
                  <span className="text-[10px] text-rose-400 block">Sign [1b]</span>
                  <strong className="text-sm">{ieee754Breakdown.signBit}</strong>
                </div>
                <div className="p-2 rounded bg-amber-950/60 border border-amber-800 text-amber-300 flex-1 min-w-[120px]">
                  <span className="text-[10px] text-amber-400 block">Exponent [8b]</span>
                  <strong className="text-sm">{ieee754Breakdown.exponentBits}</strong>
                </div>
                <div className="p-2 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 flex-2 min-w-[160px]">
                  <span className="text-[10px] text-cyan-400 block">Mantissa</span>
                  <strong className="text-xs truncate block">{ieee754Breakdown.mantissaBits}</strong>
                </div>
              </div>
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                Formula: Value = (-1)ˢ × 2^(Exponent - {ieee754Breakdown.bias}) × (1 + Fraction)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
