import { DocumentType } from './document-type.enum';
import { InvalidPatientDataError } from './patients.errors';

export class DocumentIdentity {
  private constructor(
    readonly type: DocumentType,
    readonly number: string,
  ) {}

  static create(type: DocumentType, rawNumber: string): DocumentIdentity {
    if (!rawNumber || rawNumber.trim().length === 0) {
      throw new InvalidPatientDataError('El número de documento de identidad no puede estar vacío');
    }

    // Normalizar eliminando puntos, guiones y espacios en blanco
    const normalizedNumber = rawNumber.replace(/[\s.-]/g, '');

    if (normalizedNumber.length === 0) {
      throw new InvalidPatientDataError('El número de documento de identidad no es válido');
    }

    return new DocumentIdentity(type, normalizedNumber);
  }

  equals(other: DocumentIdentity): boolean {
    return this.type === other.type && this.number === other.number;
  }
}
