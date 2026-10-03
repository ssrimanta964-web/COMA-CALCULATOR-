import { WordSize, DivisionStep, MultiplicationStep, ArithmeticColumnStep } from '../types/calculator';
import { getWordMask } from './numberEngine';

/**
 * Generates the repeated division steps for converting a non-negative decimal integer to target base.
 */
export function generateDivisionSteps(value: bigint, targetBase: number): DivisionStep[] {
  if (value === 0n) {
    return [
      {
        step: 1,
        dividend: '0',
        divisor: targetBase,
        quotient: '0',
        remainder: 0,
        digitChar: '0',
      },
    ];
  }

  const steps: DivisionStep[] = [];
  let current = value;
  let stepIndex = 1;
  const digits = '0123456789ABCDEF';
  const targetBaseBig = BigInt(targetBase);

  // Maximum 64 steps to prevent UI bloat
  while (current > 0n && stepIndex <= 64) {
    const quotient = current / targetBaseBig;
    const remainder = Number(current % targetBaseBig);
    const digitChar = digits[remainder];

    steps.push({
      step: stepIndex,
      dividend: current.toString(),
      divisor: targetBase,
      quotient: quotient.toString(),
      remainder,
      digitChar,
    });

    current = quotient;
    stepIndex++;
  }

  return steps;
}

/**
 * Generates repeated multiplication steps for converting a fractional number (0 to 1) to target base.
 */
export function generateMultiplicationSteps(
  fraction: number,
  targetBase: number,
  maxSteps: number = 8
): MultiplicationStep[] {
  if (fraction <= 0) return [];

  const steps: MultiplicationStep[] = [];
  let current = fraction;
  let stepIndex = 1;
  const digits = '0123456789ABCDEF';

  while (current > 1e-12 && stepIndex <= maxSteps) {
    const product = current * targetBase;
    const intPart = Math.floor(product + 1e-11);
    const digitChar = digits[Math.min(intPart, targetBase - 1)];
    const nextFrac = product - intPart;

    steps.push({
      step: stepIndex,
      fraction: current.toFixed(6).replace(/\.?0+$/, ''),
      multiplier: targetBase,
      product: product.toFixed(6).replace(/\.?0+$/, ''),
      intPart,
      digitChar,
    });

    current = nextFrac;
    stepIndex++;
  }

  return steps;
}

/**
 * Generates a bit-by-bit column breakdown for binary addition of two unsigned operands.
 */
export function generateBinaryAdditionSteps(
  opA: bigint,
  opB: bigint,
  bits: WordSize
): {
  columns: ArithmeticColumnStep[];
  binaryA: string;
  binaryB: string;
  binaryResult: string;
  carries: string;
  finalCarryOut: number;
} {
  const mask = getWordMask(bits);
  const a = opA & mask;
  const b = opB & mask;
  const columns: ArithmeticColumnStep[] = [];

  let carry = 0;
  const bitLength = bits;
  const carryBits: number[] = [];
  const resultBits: number[] = [];

  for (let i = 0; i < bitLength; i++) {
    const bitA = Number((a >> BigInt(i)) & 1n);
    const bitB = Number((b >> BigInt(i)) & 1n);
    const carryIn = carry;
    const total = bitA + bitB + carryIn;
    const resultBit = total % 2;
    const carryOut = total >= 2 ? 1 : 0;

    carryBits.unshift(carryIn);
    resultBits.unshift(resultBit);

    let explanation = `Bit ${i}: `;
    if (carryIn === 0 && bitA === 0 && bitB === 0) {
      explanation += `0 + 0 = 0 (no carry)`;
    } else if (total === 1) {
      explanation += `${bitA} + ${bitB}${carryIn ? ' + carry(1)' : ''} = 1 (no carry)`;
    } else if (total === 2) {
      explanation += `${bitA} + ${bitB}${carryIn ? ' + carry(1)' : ''} = 2 (binary 10) → sum bit: 0, carry: 1`;
    } else {
      explanation += `${bitA} + ${bitB} + carry(1) = 3 (binary 11) → sum bit: 1, carry: 1`;
    }

    columns.push({
      column: i,
      bitA,
      bitB,
      carryIn,
      resultBit,
      carryOut,
      explanation,
    });

    carry = carryOut;
  }

  const binaryA = a.toString(2).padStart(bits, '0');
  const binaryB = b.toString(2).padStart(bits, '0');
  const binaryResult = ((a + b) & mask).toString(2).padStart(bits, '0');
  const carries = carryBits.join('');

  return {
    columns,
    binaryA,
    binaryB,
    binaryResult,
    carries,
    finalCarryOut: carry,
  };
}

/**
 * Generates a bit-by-bit column breakdown for binary subtraction (A - B) using borrows.
 */
export function generateBinarySubtractionSteps(
  opA: bigint,
  opB: bigint,
  bits: WordSize
): {
  columns: ArithmeticColumnStep[];
  binaryA: string;
  binaryB: string;
  binaryResult: string;
  borrows: string;
  finalBorrowOut: number;
} {
  const mask = getWordMask(bits);
  const a = opA & mask;
  const b = opB & mask;
  const columns: ArithmeticColumnStep[] = [];

  let borrow = 0;
  const borrowBits: number[] = [];
  const resultBits: number[] = [];

  for (let i = 0; i < bits; i++) {
    const bitA = Number((a >> BigInt(i)) & 1n);
    const bitB = Number((b >> BigInt(i)) & 1n);
    const borrowIn = borrow;

    // Calculate (bitA - borrowIn) - bitB
    const effectiveA = bitA - borrowIn;
    let resultBit = 0;
    let borrowOut = 0;

    if (effectiveA >= bitB) {
      resultBit = effectiveA - bitB;
      borrowOut = 0;
    } else {
      // Need to borrow 2 from next column: (effectiveA + 2) - bitB
      resultBit = effectiveA + 2 - bitB;
      borrowOut = 1;
    }

    borrowBits.unshift(borrowIn);
    resultBits.unshift(resultBit);

    let explanation = `Bit ${i}: `;
    if (borrowIn === 1) {
      explanation += `A(${bitA}) - borrow(1) = ${bitA - 1}; `;
    }
    explanation += `(${bitA - borrowIn}) - B(${bitB}) = ${resultBit >= 0 ? resultBit : resultBit + 2}${borrowOut ? ' (borrowed 1 from Bit ' + (i + 1) + ')' : ''}`;

    columns.push({
      column: i,
      bitA,
      bitB,
      carryIn: borrowIn, // used for borrowIn
      resultBit,
      carryOut: borrowOut, // used for borrowOut
      explanation,
    });

    borrow = borrowOut;
  }

  const binaryA = a.toString(2).padStart(bits, '0');
  const binaryB = b.toString(2).padStart(bits, '0');
  const res = a >= b ? a - b : (mask + 1n - (b - a)) & mask;
  const binaryResult = res.toString(2).padStart(bits, '0');
  const borrows = borrowBits.join('');

  return {
    columns,
    binaryA,
    binaryB,
    binaryResult,
    borrows,
    finalBorrowOut: borrow,
  };
}

/**
 * Breakdown for Two's Complement Negation:
 * Original -> Invert bits (One's Complement) -> Add 1 -> Result.
 */
export function generateTwosComplementSteps(
  value: bigint,
  bits: WordSize
): {
  originalBin: string;
  onesCompBin: string;
  plusOneBin: string;
  finalTwosCompBin: string;
  originalDecimal: string;
  twosCompDecimal: string;
} {
  const mask = getWordMask(bits);
  const val = value & mask;
  const ones = (val ^ mask) & mask;
  const twos = (ones + 1n) & mask;

  const originalBin = val.toString(2).padStart(bits, '0');
  const onesCompBin = ones.toString(2).padStart(bits, '0');
  const plusOneBin = '1'.padStart(bits, '0');
  const finalTwosCompBin = twos.toString(2).padStart(bits, '0');

  // Check signed interpretation
  const signBit = (twos >> BigInt(bits - 1)) & 1n;
  const signedVal = signBit === 1n ? twos - (1n << BigInt(bits)) : twos;

  return {
    originalBin,
    onesCompBin,
    plusOneBin,
    finalTwosCompBin,
    originalDecimal: val.toString(),
    twosCompDecimal: signedVal.toString(),
  };
}
