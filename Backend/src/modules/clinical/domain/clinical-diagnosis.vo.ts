import { InvalidClinicalHistoryDataError } from './clinical.errors';

export interface PlainClinicalDiagnosis {
  code?: string | null;
  description: string;
}

export class ClinicalDiagnosis {
  private constructor(
    readonly code: string | null,
    readonly description: string,
  ) {
    Object.freeze(this);
  }

  static create(input: unknown): ClinicalDiagnosis {
    if (typeof input === 'string') {
      return ClinicalDiagnosis.createFromString(input);
    }

    if (input && typeof input === 'object') {
      return ClinicalDiagnosis.createFromObject(input as Record<string, unknown>);
    }

    throw new InvalidClinicalHistoryDataError('El diagnóstico debe ser un objeto o texto válido');
  }

  private static createFromString(input: string): ClinicalDiagnosis {
    const trimmed = input.trim();
    if (trimmed === '') {
      throw new InvalidClinicalHistoryDataError('La descripción del diagnóstico es obligatoria');
    }
    return new ClinicalDiagnosis(null, trimmed);
  }

  private static createFromObject(obj: Record<string, unknown>): ClinicalDiagnosis {
    const descCandidate = obj.description ?? obj.name;
    const code = typeof obj.code === 'string' && obj.code.trim() !== '' ? obj.code.trim() : null;

    if (typeof descCandidate === 'string' && descCandidate.trim() !== '') {
      return new ClinicalDiagnosis(code, descCandidate.trim());
    }

    if (code !== null) {
      return new ClinicalDiagnosis(code, code);
    }

    throw new InvalidClinicalHistoryDataError('La descripción del diagnóstico es obligatoria');
  }

  toPlainObject(): PlainClinicalDiagnosis {
    return {
      code: this.code,
      description: this.description,
    };
  }

  equals(other?: ClinicalDiagnosis | null): boolean {
    if (!other || !(other instanceof ClinicalDiagnosis)) {
      return false;
    }
    return this.code === other.code && this.description === other.description;
  }
}
