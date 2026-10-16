import { InvalidOdontogramDataError } from './clinical.errors';

const PERMANENT_TEETH = new Set<number>([
  11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
]);

const TEMPORAL_TEETH = new Set<number>([
  51, 52, 53, 54, 55, 61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 81, 82, 83, 84, 85,
]);

export class ToothNumber {
  private constructor(
    readonly value: number,
    readonly isPermanent: boolean,
    readonly isTemporal: boolean,
  ) {}

  get code(): string {
    return this.value.toString();
  }

  get quadrant(): number {
    return Math.floor(this.value / 10);
  }

  get position(): number {
    return this.value % 10;
  }

  static of(input: number | string): ToothNumber {
    const numeric = typeof input === 'string' ? parseInt(input.trim(), 10) : input;

    if (typeof input === 'string' && (input.trim() === '' || !/^\d+$/.test(input.trim()))) {
      throw new InvalidOdontogramDataError(`El número de diente FDI '${input}' es inválido`);
    }

    if (typeof numeric !== 'number' || isNaN(numeric)) {
      throw new InvalidOdontogramDataError(`El número de diente FDI '${input}' es inválido`);
    }

    if (PERMANENT_TEETH.has(numeric)) {
      return new ToothNumber(numeric, true, false);
    }

    if (TEMPORAL_TEETH.has(numeric)) {
      return new ToothNumber(numeric, false, true);
    }

    throw new InvalidOdontogramDataError(`El número de diente FDI '${input}' es inválido`);
  }

  equals(other?: ToothNumber | null): boolean {
    if (!other || !(other instanceof ToothNumber)) {
      return false;
    }
    return this.value === other.value;
  }
}
