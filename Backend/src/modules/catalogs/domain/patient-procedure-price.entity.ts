import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { Money } from './money.vo';
import { InvalidCatalogDataError, PatientPriceReasonRequiredError } from './catalogs.errors';

export interface PatientProcedurePriceProps {
  id: string;
  clinicId: string;
  patientId: string;
  procedureId: string;
  customPrice: Money;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePatientProcedurePriceProps {
  customPrice?: Money;
  reason?: string;
  updatedAt: Date;
}

function validateRequiredField(value: unknown, errorMessage: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidCatalogDataError(errorMessage);
  }
  return value.trim();
}

function validatePriceObject(price: unknown): Money {
  if (!price || !(price instanceof Money)) {
    throw new InvalidCatalogDataError('El precio personalizado es obligatorio y debe ser Money');
  }
  return price;
}

export class PatientProcedurePrice extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly clinicId: string,
    readonly patientId: string,
    readonly procedureId: string,
    private _customPrice: Money,
    private _reason: string,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(id);
  }

  static create(props: PatientProcedurePriceProps): PatientProcedurePrice {
    const id = validateRequiredField(props.id, 'El ID del precio especial es obligatorio');
    const clinicId = validateRequiredField(
      props.clinicId,
      'El consultorio (clinicId) es obligatorio',
    );
    const patientId = validateRequiredField(
      props.patientId,
      'El paciente (patientId) es obligatorio',
    );
    const procedureId = validateRequiredField(
      props.procedureId,
      'El procedimiento (procedureId) es obligatorio',
    );
    const customPrice = validatePriceObject(props.customPrice);
    const reason = PatientProcedurePrice.validateReason(props.reason);

    return new PatientProcedurePrice(
      id,
      clinicId,
      patientId,
      procedureId,
      customPrice,
      reason,
      props.createdAt,
      props.updatedAt,
    );
  }

  static validateReason(reason: string): string {
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      throw new PatientPriceReasonRequiredError();
    }
    return reason.trim();
  }

  get customPrice(): Money {
    return this._customPrice;
  }

  get reason(): string {
    return this._reason;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  update(props: UpdatePatientProcedurePriceProps): void {
    if (props.customPrice !== undefined) {
      this._customPrice = validatePriceObject(props.customPrice);
    }

    if (props.reason !== undefined) {
      this._reason = PatientProcedurePrice.validateReason(props.reason);
    }

    this._updatedAt = props.updatedAt;
  }
}
