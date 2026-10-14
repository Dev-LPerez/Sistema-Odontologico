import { DomainError, DomainErrorCategory } from '../../../shared/domain/domain-error';

export class DataTreatmentConsentRequiredError extends DomainError {
  readonly category: DomainErrorCategory = 'INVARIANT_VIOLATION';
  readonly code = 'DATA_TREATMENT_CONSENT_REQUIRED';

  constructor() {
    super(
      'Es obligatoria la autorización explícita de tratamiento de datos personales conforme a la Ley 1581 de 2012',
    );
  }
}

export class DuplicatePatientDocumentError extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';
  readonly code = 'DUPLICATE_PATIENT_DOCUMENT';

  constructor(documentNumber: string) {
    super(
      `Ya existe un paciente registrado con el número de documento '${documentNumber}' en este consultorio`,
    );
  }
}

export class PatientNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'PATIENT_NOT_FOUND';

  constructor(patientId: string) {
    super(`Paciente con ID '${patientId}' no encontrado`);
  }
}

export class InvalidPatientDataError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_PATIENT_DATA';

  constructor(message: string) {
    super(message);
  }
}
