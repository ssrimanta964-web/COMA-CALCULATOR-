import { WordSize, BaseType, CpuFlags, Ieee754Breakdown } from '../types/calculator';

/**
 * Returns bitmask for a given word size (e.g. 8 bits -> 0xFFn, 64 bits -> 0xFFFFFFFFFFFFFFFFn).
 */
export function getWordMask(bits: WordSize): bigint {
  return (1n << BigInt(bits)) - 1n;
}

/**
 * Returns the maximum unsigned value for a given word size.
 */
export function getMaxUnsigned(bits: WordSize): bigint {
  return getWordMask(bits);
}

/**
 * Returns the minimum and maximum signed values (Two's complement) for a given word size.
 */
export function getSignedRange(bits: WordSize): { min: bigint; max: bigint } {
  const max = (1n << BigInt(bits - 1)) - 1n;
  const min = -(1n << BigInt(bits - 1));
  return { min, max };
}

/**
 * Converts an unsigned BigInt (masked to bits) into its signed Two's Complement representation.
 */
export function toTwosComplementSigned(value: bigint, bits: WordSize): bigint {
  const mask = getWordMask(bits);
  const normalized = value & mask;
  const signBit = (normalized >> BigInt(bits - 1)) & 1n;
  if (signBit === 1n) {
    // Negative number in two's complement: val - 2^bits
    return normalized - (1n << BigInt(bits));
  }
  return normalized;
}

/**
 * Converts a signed BigInt into its unsigned Two's Complement bit representation.
 */
export function fromSignedToUnsigned(value: bigint, bits: WordSize): bigint {
  const mask = getWordMask(bits);
  if (value < 0n) {
    return (value + (1n << BigInt(bits))) & mask;
  }
  return value & mask;
}

/**
 * Inverts all bits within word size (One's Complement).
 */
export function onesComplement(value: bigint, bits: WordSize): bigint {
  const mask = getWordMask(bits);
  return (value ^ mask) & mask;
}

/**
 * Negates a value in Two's Complement: ~value + 1
 */
export function twosComplementNegate(value: bigint, bits: WordSize): bigint {
  const mask = getWordMask(bits);
  return (~value + 1n) & mask;
}

/**
 * Validates whether a character is valid for the specified base.
 */
export function isValidDigit(char: string, base: BaseType): boolean {
  if (char === '.' || char === '-') return true;
  switch (base) {
    case 'BIN':
      return /^[01]$/.test(char);
    case 'OCT':
      return /^[0-7]$/.test(char);
    case 'DEC':
      return /^[0-9]$/.test(char);
    case 'HEX':
      return /^[0-9a-fA-F]$/.test(char);
  }
}

/**
 * Cleans and filters input string according to base constraints.
 */
export function sanitizeInputForBase(rawInput: string, base: BaseType): string {
  let cleaned = '';
  let hasDecimalPoint = false;
  let hasMinus = false;

  const trimmed = rawInput.trim();
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '-' && i === 0 && !hasMinus) {
      cleaned += '-';
      hasMinus = true;
    } else if (ch === '.' && !hasDecimalPoint) {
      cleaned += '.';
      hasDecimalPoint = true;
    } else if (isValidDigit(ch, base)) {
      cleaned += ch.toUpperCase();
    }
  }
  return cleaned;
}

/**
 * Formats a raw binary string with nibble spaces (e.g. 1101 0010).
 */
export function formatBinaryWithSpaces(binStr: string, bits: WordSize): string {
  const padded = binStr.padStart(bits, '0');
  const nibbles: string[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    nibbles.push(padded.slice(i, i + 4));
  }
  return nibbles.join(' ');
}

/**
 * Formats a hex string with byte spaces (e.g. DE AD BE EF).
 */
export function formatHexWithSpaces(hexStr: string, bits: WordSize): string {
  const hexChars = bits / 4;
  const padded = hexStr.padStart(hexChars, '0');
  const bytes: string[] = [];
  for (let i = 0; i < padded.length; i += 2) {
    bytes.push(padded.slice(i, i + 2));
  }
  return bytes.join(' ');
}

/**
 * Parses integer and fractional components in arbitrary base to an exact or high-precision value.
 */
export function parseBaseFractional(str: string, baseNum: number): {
  isValid: boolean;
  isNegative: boolean;
  intBigInt: bigint;
  fractionVal: number;
} {
  const trimmed = str.trim();
  if (!trimmed) {
    return { isValid: true, isNegative: false, intBigInt: 0n, fractionVal: 0 };
  }

  const isNegative = trimmed.startsWith('-');
  const unsignedStr = isNegative ? trimmed.slice(1) : trimmed;
  const parts = unsignedStr.split('.');

  if (parts.length > 2) {
    return { isValid: false, isNegative, intBigInt: 0n, fractionVal: 0 };
  }

  const intPartStr = parts[0] || '0';
  const fracPartStr = parts[1] || '';

  // Parse integer part as BigInt
  let intBigInt = 0n;
  try {
    if (baseNum === 10) {
      intBigInt = BigInt(intPartStr);
    } else if (baseNum === 16) {
      intBigInt = BigInt('0x' + (intPartStr || '0'));
    } else if (baseNum === 8) {
      intBigInt = BigInt('0o' + (intPartStr || '0'));
    } else if (baseNum === 2) {
      intBigInt = BigInt('0b' + (intPartStr || '0'));
    }
  } catch {
    return { isValid: false, isNegative, intBigInt: 0n, fractionVal: 0 };
  }

  // Parse fractional part
  let fractionVal = 0;
  for (let i = 0; i < fracPartStr.length; i++) {
    const digitChar = fracPartStr[i];
    const digitVal = parseInt(digitChar, baseNum);
    if (isNaN(digitVal)) {
      return { isValid: false, isNegative, intBigInt, fractionVal: 0 };
    }
    fractionVal += digitVal * Math.pow(baseNum, -(i + 1));
  }

  return { isValid: true, isNegative, intBigInt, fractionVal };
}

/**
 * Converts a fractional value [0, 1) into a target base string with given precision.
 */
export function fractionToBaseString(fraction: number, targetBase: number, maxDigits: number = 8): {
  resultStr: string;
  isExact: boolean;
} {
  if (fraction <= 0) return { resultStr: '', isExact: true };

  let current = fraction;
  let result = '';
  let count = 0;
  const chars = '0123456789ABCDEF';

  while (current > 1e-12 && count < maxDigits) {
    current *= targetBase;
    const digit = Math.floor(current + 1e-11);
    result += chars[Math.min(digit, targetBase - 1)];
    current = current - digit;
    count++;
  }

  const isExact = current <= 1e-10;
  return { resultStr: result, isExact };
}

/**
 * Computes CPU flags for an arithmetic or bitwise operation.
 */
export function computeFlags(
  op: string,
  opA: bigint,
  opB: bigint,
  resultUnmasked: bigint,
  resultMasked: bigint,
  bits: WordSize
): CpuFlags {
  const mask = getWordMask(bits);
  const signBitMask = 1n << BigInt(bits - 1);

  // Zero flag (Z): Masked result is 0
  const zero = resultMasked === 0n;

  // Sign flag (S): Most significant bit is 1
  const sign = (resultMasked & signBitMask) !== 0n;

  // Parity flag (P): Even number of 1s in the lowest byte (8 bits)
  const lowestByte = Number(resultMasked & 0xFFn);
  let bitCount = 0;
  for (let i = 0; i < 8; i++) {
    if ((lowestByte >> i) & 1) bitCount++;
  }
  const parity = bitCount % 2 === 0;

  let carry = false;
  let overflow = false;

  const signA = (opA & signBitMask) !== 0n;
  const signB = (opB & signBitMask) !== 0n;
  const signR = (resultMasked & signBitMask) !== 0n;

  if (op === '+') {
    // Unsigned Carry: raw sum exceeds mask
    carry = resultUnmasked > mask;
    // Signed Overflow: (A and B have same sign) AND (result has different sign)
    overflow = signA === signB && signA !== signR;
  } else if (op === '-') {
    // Unsigned Borrow (Carry): A < B
    carry = opA < opB;
    // Signed Overflow: (A and B have different signs) AND (result has different sign than A)
    overflow = signA !== signB && signA !== signR;
  } else if (op === '×') {
    carry = resultUnmasked > mask;
    overflow = carry;
  }

  return { zero, sign, carry, overflow, parity };
}

/**
 * Executes a bitwise or arithmetic operation on two BigInt operands within word size bounds.
 */
export function executeOperation(
  op: string,
  valA: bigint,
  valB: bigint,
  bits: WordSize
): {
  resultUnmasked: bigint;
  resultMasked: bigint;
  flags: CpuFlags;
  error?: string;
} {
  const mask = getWordMask(bits);
  const a = valA & mask;
  const b = valB & mask;

  let raw = 0n;

  try {
    switch (op) {
      case '+':
        raw = a + b;
        break;
      case '-':
        raw = a >= b ? a - b : mask + 1n - (b - a);
        break;
      case '×':
        raw = a * b;
        break;
      case '÷':
        if (b === 0n) return { resultUnmasked: 0n, resultMasked: 0n, flags: { zero: true, sign: false, carry: false, overflow: false, parity: true }, error: 'Division by zero' };
        raw = a / b;
        break;
      case '%':
        if (b === 0n) return { resultUnmasked: 0n, resultMasked: 0n, flags: { zero: true, sign: false, carry: false, overflow: false, parity: true }, error: 'Modulo by zero' };
        raw = a % b;
        break;
      case '&':
        raw = a & b;
        break;
      case '|':
        raw = a | b;
        break;
      case '^':
        raw = a ^ b;
        break;
      case '~':
        raw = (~a) & mask;
        break;
      case '<<': {
        const shift = Number(b % BigInt(bits));
        raw = a << BigInt(shift);
        break;
      }
      case '>>': {
        // Arithmetic right shift (preserves sign bit)
        const shift = Number(b % BigInt(bits));
        const isNegative = ((a >> BigInt(bits - 1)) & 1n) === 1n;
        const shifted = a >> BigInt(shift);
        if (isNegative) {
          // Fill top bits with 1s
          const signFill = (mask >> BigInt(bits - shift)) << BigInt(bits - shift);
          raw = shifted | signFill;
        } else {
          raw = shifted;
        }
        break;
      }
      case '>>>': {
        // Logical right shift (zero-fill)
        const shift = Number(b % BigInt(bits));
        raw = a >> BigInt(shift);
        break;
      }
      case 'ROL': {
        // Rotate left
        const shift = Number(b % BigInt(bits));
        if (shift === 0) {
          raw = a;
        } else {
          raw = ((a << BigInt(shift)) | (a >> BigInt(bits - shift))) & mask;
        }
        break;
      }
      case 'ROR': {
        // Rotate right
        const shift = Number(b % BigInt(bits));
        if (shift === 0) {
          raw = a;
        } else {
          raw = ((a >> BigInt(shift)) | (a << BigInt(bits - shift))) & mask;
        }
        break;
      }
      default:
        raw = a;
    }
  } catch (err) {
    return {
      resultUnmasked: 0n,
      resultMasked: 0n,
      flags: { zero: true, sign: false, carry: false, overflow: false, parity: true },
      error: (err as Error).message,
    };
  }

  const resultMasked = raw & mask;
  const flags = computeFlags(op, a, b, raw, resultMasked, bits);

  return { resultUnmasked: raw, resultMasked, flags };
}

/**
 * Endianness and byte inspection.
 * Splits BigInt into an array of bytes from MSB to LSB or reversed.
 */
export function getByteBreakdown(value: bigint, bits: WordSize): {
  bigEndian: { byteIndex: number; hex: string; bin: string; dec: number; ascii: string }[];
  littleEndian: { byteIndex: number; hex: string; bin: string; dec: number; ascii: string }[];
} {
  const mask = getWordMask(bits);
  const val = value & mask;
  const numBytes = bits / 8;
  const bytesBigEndian: { byteIndex: number; hex: string; bin: string; dec: number; ascii: string }[] = [];

  for (let i = numBytes - 1; i >= 0; i--) {
    const byteVal = Number((val >> BigInt(i * 8)) & 0xFFn);
    const hex = byteVal.toString(16).toUpperCase().padStart(2, '0');
    const bin = byteVal.toString(2).padStart(8, '0');
    // Readable ASCII character or placeholder dot
    const ascii = byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : '·';
    bytesBigEndian.push({
      byteIndex: i,
      hex,
      bin,
      dec: byteVal,
      ascii,
    });
  }

  const bytesLittleEndian = [...bytesBigEndian].reverse();
  return { bigEndian: bytesBigEndian, littleEndian: bytesLittleEndian };
}

/**
 * Decodes the IEEE-754 binary floating-point representation.
 * Supports 32-bit single precision and 64-bit double precision.
 */
export function parseIeee754(value: bigint, bits: WordSize): Ieee754Breakdown {
  if (bits === 64) {
    // 64-bit Double: 1 sign bit, 11 exponent bits (bias 1023), 52 mantissa bits
    const binStr = (value & getWordMask(64)).toString(2).padStart(64, '0');
    const signBit = binStr[0];
    const exponentBits = binStr.slice(1, 12);
    const mantissaBits = binStr.slice(12, 64);

    const signValue = signBit === '1' ? -1 : 1;
    const rawExponent = parseInt(exponentBits, 2);
    const bias = 1023;

    // Convert raw bits into JavaScript double using DataView
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, value & getWordMask(64), false);
    const floatVal = view.getFloat64(0, false);

    let actualExponent = rawExponent - bias;
    let mantissaFraction = 0;
    for (let i = 0; i < mantissaBits.length; i++) {
      if (mantissaBits[i] === '1') {
        mantissaFraction += Math.pow(2, -(i + 1));
      }
    }

    let isSpecial = false;
    let specialDescription: string | undefined;

    if (rawExponent === 2047) {
      isSpecial = true;
      specialDescription = mantissaFraction === 0 ? (signValue === 1 ? '+Infinity' : '-Infinity') : 'NaN (Not a Number)';
    } else if (rawExponent === 0) {
      isSpecial = true;
      actualExponent = 1 - bias; // subnormal
      specialDescription = mantissaFraction === 0 ? (signValue === 1 ? '+0.0' : '-0.0') : 'Subnormal Number';
    }

    const formulaString = `(-1)^${signBit} × 2^(${rawExponent} - ${bias}) × (1 + ${mantissaFraction.toFixed(6)})`;

    return {
      precision: 'double',
      signBit,
      exponentBits,
      mantissaBits,
      signValue,
      rawExponent,
      bias,
      actualExponent,
      mantissaFraction,
      decimalValue: floatVal,
      formulaString,
      isSpecial,
      specialDescription,
    };
  } else {
    // 32-bit Single: 1 sign bit, 8 exponent bits (bias 127), 23 mantissa bits
    // For 8 or 16 bit word sizes, we zero-extend to 32-bit float for inspection
    const val32 = value & getWordMask(32);
    const binStr = val32.toString(2).padStart(32, '0');
    const signBit = binStr[0];
    const exponentBits = binStr.slice(1, 9);
    const mantissaBits = binStr.slice(9, 32);

    const signValue = signBit === '1' ? -1 : 1;
    const rawExponent = parseInt(exponentBits, 2);
    const bias = 127;

    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, Number(val32), false);
    const floatVal = view.getFloat32(0, false);

    let actualExponent = rawExponent - bias;
    let mantissaFraction = 0;
    for (let i = 0; i < mantissaBits.length; i++) {
      if (mantissaBits[i] === '1') {
        mantissaFraction += Math.pow(2, -(i + 1));
      }
    }

    let isSpecial = false;
    let specialDescription: string | undefined;

    if (rawExponent === 255) {
      isSpecial = true;
      specialDescription = mantissaFraction === 0 ? (signValue === 1 ? '+Infinity' : '-Infinity') : 'NaN (Not a Number)';
    } else if (rawExponent === 0) {
      isSpecial = true;
      actualExponent = 1 - bias;
      specialDescription = mantissaFraction === 0 ? (signValue === 1 ? '+0.0' : '-0.0') : 'Subnormal Number';
    }

    const formulaString = `(-1)^${signBit} × 2^(${rawExponent} - ${bias}) × (1 + ${mantissaFraction.toFixed(6)})`;

    return {
      precision: 'single',
      signBit,
      exponentBits,
      mantissaBits,
      signValue,
      rawExponent,
      bias,
      actualExponent,
      mantissaFraction,
      decimalValue: floatVal,
      formulaString,
      isSpecial,
      specialDescription,
    };
  }
}
