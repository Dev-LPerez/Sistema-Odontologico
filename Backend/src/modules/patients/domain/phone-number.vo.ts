import { InvalidPatientDataError } from './patients.errors';

export class PhoneNumber {
  private constructor(readonly value: string) {}

  static create(raw: string): PhoneNumber {
    if (!raw || raw.trim().length === 0) {
      throw new InvalidPatientDataError('El número de teléfono no puede estar vacío');
    }

    // Normalizar conservando '+' inicial si existe y quitando espacios, guiones, paréntesis y puntos
    const hasPlus = raw.trim().startsWith('+');
    const digitsOnly = raw.replace(/\D/g, '');

    if (digitsOnly.length < 7) {
      throw new InvalidPatientDataError('El número de teléfono debe contener al menos 7 dígitos');
    }

    const normalized = hasPlus ? `+${digitsOnly}` : digitsOnly;
    return new PhoneNumber(normalized);
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }
}
