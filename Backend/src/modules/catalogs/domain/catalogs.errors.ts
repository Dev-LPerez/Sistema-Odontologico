import { DomainError, DomainErrorCategory } from '../../../shared/domain/domain-error';

export class InvalidCatalogDataError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_CATALOG_DATA';

  constructor(message: string) {
    super(message);
  }
}

export class InvalidMoneyAmountError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_MONEY_AMOUNT';

  constructor(message = 'El importe monetario debe ser un número entero mayor o igual a cero') {
    super(message);
  }
}

export class PatientPriceReasonRequiredError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'PATIENT_PRICE_REASON_REQUIRED';

  constructor(message = 'El motivo del precio especial por paciente es obligatorio') {
    super(message);
  }
}

export class ProcedureNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'PROCEDURE_NOT_FOUND';

  constructor(procedureId: string) {
    super(`Procedimiento con ID '${procedureId}' no encontrado`);
  }
}

export class MaterialNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'MATERIAL_NOT_FOUND';

  constructor(materialId: string) {
    super(`Material con ID '${materialId}' no encontrado`);
  }
}

export class DuplicateProcedureCodeError extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';
  readonly code = 'DUPLICATE_PROCEDURE_CODE';

  constructor(code: string) {
    super(`Ya existe un procedimiento con el código '${code}' en este consultorio`);
  }
}

export class DuplicateMaterialCatalogError extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';
  readonly code = 'DUPLICATE_MATERIAL_CATALOG';

  constructor(brand: string, reference: string, color: string) {
    super(
      `Ya existe un material con la combinación de marca '${brand}', referencia '${reference}' y color '${color}' en este consultorio`,
    );
  }
}

export class InsufficientMaterialStockError extends DomainError {
  readonly category: DomainErrorCategory = 'INVARIANT_VIOLATION';
  readonly code = 'INSUFFICIENT_MATERIAL_STOCK';

  constructor(available: number, requested: number) {
    super(
      `Existencias insuficientes para el material: stock disponible ${available}, cantidad solicitada ${requested}`,
    );
  }
}
