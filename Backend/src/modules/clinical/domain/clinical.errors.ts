import { DomainError, DomainErrorCategory } from '../../../shared/domain/domain-error';

export class InvalidClinicalHistoryDataError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_CLINICAL_HISTORY_DATA';

  constructor(message: string) {
    super(message);
  }
}

export class ClinicalHistoryNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'CLINICAL_HISTORY_NOT_FOUND';

  constructor(identifier: string) {
    super(`Historia clínica con identificador '${identifier}' no encontrada`);
  }
}

export class DuplicateClinicalHistoryError extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';
  readonly code = 'DUPLICATE_CLINICAL_HISTORY';

  constructor(patientId: string) {
    super(
      `Ya existe una historia clínica registrada para el paciente '${patientId}' en este consultorio`,
    );
  }
}

export class TreatmentPlanItemNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'TREATMENT_PLAN_ITEM_NOT_FOUND';

  constructor(itemId: string) {
    super(`Ítem de plan de tratamiento con ID '${itemId}' no encontrado`);
  }
}

export class InvalidOdontogramDataError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_ODONTOGRAM_DATA';

  constructor(message: string) {
    super(message);
  }
}

export class OdontogramNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'ODONTOGRAM_NOT_FOUND';

  constructor(identifier: string) {
    super(`Odontograma con identificador '${identifier}' no encontrado`);
  }
}

export class DuplicateOdontogramError extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';
  readonly code = 'DUPLICATE_ODONTOGRAM';

  constructor(patientId: string) {
    super(
      `Ya existe un odontograma registrado para el paciente '${patientId}' en este consultorio`,
    );
  }
}

export class InvalidClinicalAttentionDataError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_CLINICAL_ATTENTION_DATA';

  constructor(message: string) {
    super(message);
  }
}

export class ClinicalAttentionNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'CLINICAL_ATTENTION_NOT_FOUND';

  constructor(identifier: string) {
    super(`Atención clínica con identificador '${identifier}' no encontrada`);
  }
}

export class ClinicalAttentionClosedError extends DomainError {
  readonly category: DomainErrorCategory = 'INVARIANT_VIOLATION';
  readonly code = 'CLINICAL_ATTENTION_CLOSED';

  constructor(identifier: string) {
    super(`La atención clínica '${identifier}' se encuentra cerrada y no permite modificaciones`);
  }
}

export class IncompleteClinicalAttentionError extends DomainError {
  readonly category: DomainErrorCategory = 'INVARIANT_VIOLATION';
  readonly code = 'INCOMPLETE_CLINICAL_ATTENTION';

  constructor(identifier: string, reason?: string) {
    super(
      reason ??
        `No se puede cerrar la atención clínica '${identifier}' porque requiere al menos un procedimiento realizado y notas de evolución`,
    );
  }
}

export class ClinicalAttentionNotClosedError extends DomainError {
  readonly category: DomainErrorCategory = 'INVARIANT_VIOLATION';
  readonly code = 'CLINICAL_ATTENTION_NOT_CLOSED';

  constructor(identifier: string) {
    super(`La atención clínica '${identifier}' no se encuentra cerrada y no permite enmiendas`);
  }
}

export class DuplicateClinicalAttentionVersionError extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';
  readonly code = 'DUPLICATE_CLINICAL_ATTENTION_VERSION';

  constructor(attentionId: string, versionNumber: number) {
    super(`Ya existe la versión '${versionNumber}' para la atención clínica '${attentionId}'`);
  }
}
