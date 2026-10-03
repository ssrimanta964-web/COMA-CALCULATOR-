export type WordSize = 8 | 16 | 32 | 64;

export type BaseType = 'BIN' | 'OCT' | 'DEC' | 'HEX';

export type SignMode = 'unsigned' | 'signed' | 'ones_complement';

export type ArithmeticOp =
  | '+'
  | '-'
  | '×'
  | '÷'
  | '%'
  | '&'
  | '|'
  | '^'
  | '~'
  | '<<'
  | '>>'
  | '>>>'
  | 'ROL'
  | 'ROR';

export interface CpuFlags {
  zero: boolean;      // Z: Result is zero
  sign: boolean;      // S: MSB is 1
  carry: boolean;     // C: Unsigned overflow or borrow
  overflow: boolean;  // V: Signed overflow (two positives -> negative or vice versa)
  parity: boolean;    // P: Even parity in least significant byte
}

export interface DivisionStep {
  step: number;
  dividend: string;
  divisor: number;
  quotient: string;
  remainder: number;
  digitChar: string;
}

export interface MultiplicationStep {
  step: number;
  fraction: string;
  multiplier: number;
  product: string;
  intPart: number;
  digitChar: string;
}

export interface ArithmeticColumnStep {
  column: number;
  bitA: number;
  bitB: number;
  carryIn: number;
  resultBit: number;
  carryOut: number;
  explanation: string;
}

export interface Ieee754Breakdown {
  precision: 'single' | 'double';
  signBit: string;
  exponentBits: string;
  mantissaBits: string;
  signValue: number;
  rawExponent: number;
  bias: number;
  actualExponent: number;
  mantissaFraction: number;
  decimalValue: number;
  formulaString: string;
  isSpecial: boolean;
  specialDescription?: string;
}

export interface CalculationHistoryItem {
  id: string;
  expression: string;
  resultStr: string;
  resultBigInt: bigint;
  base: BaseType;
  flags: CpuFlags;
  timestamp: string;
}

