import { TreatmentItemStatus } from './treatment-item-status.enum';
import { ToothNumber } from './tooth-number.vo';
import { InvalidClinicalHistoryDataError } from './clinical.errors';

export interface TreatmentPlanItemProps {
  id: string;
  clinicId: string;
  clinicalHistoryId: string;
  procedureId: string;
  procedureCode: string;
  procedureName: string;
  toothNumber?: string | null;
  status?: TreatmentItemStatus;
  estimatedCostCop: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function validateNonEmpty(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidClinicalHistoryDataError(`El campo '${fieldName}' es obligatorio`);
  }
  return value.trim();
}

export class TreatmentPlanItem {
  private constructor(
    readonly id: string,
    readonly clinicId: string,
    readonly clinicalHistoryId: string,
    readonly procedureId: string,
    readonly procedureCode: string,
    readonly procedureName: string,
    readonly toothNumber: string | null,
    private _status: TreatmentItemStatus,
    readonly estimatedCostCop: number,
    readonly notes: string | null,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: TreatmentPlanItemProps): TreatmentPlanItem {
    const id = validateNonEmpty(props.id, 'id');
    const clinicId = validateNonEmpty(props.clinicId, 'clinicId');
    const clinicalHistoryId = validateNonEmpty(props.clinicalHistoryId, 'clinicalHistoryId');
    const procedureId = validateNonEmpty(props.procedureId, 'procedureId');
    const procedureCode = validateNonEmpty(props.procedureCode, 'procedureCode');
    const procedureName = validateNonEmpty(props.procedureName, 'procedureName');

    if (
      typeof props.estimatedCostCop !== 'number' ||
      !Number.isFinite(props.estimatedCostCop) ||
      props.estimatedCostCop < 0
    ) {
      throw new InvalidClinicalHistoryDataError(
        'El costo estimado del ítem del plan debe ser un número entero mayor o igual a 0',
      );
    }

    let toothNumber: string | null = null;
    if (props.toothNumber !== undefined && props.toothNumber !== null) {
      const rawTooth = String(props.toothNumber).trim();
      if (rawTooth !== '') {
        const parsed = ToothNumber.of(rawTooth);
        toothNumber = parsed.code;
      }
    }

    const notes =
      typeof props.notes === 'string' && props.notes.trim() !== '' ? props.notes.trim() : null;

    const status = props.status ?? TreatmentItemStatus.PENDING;

    return new TreatmentPlanItem(
      id,
      clinicId,
      clinicalHistoryId,
      procedureId,
      procedureCode,
      procedureName,
      toothNumber,
      status,
      Math.round(props.estimatedCostCop),
      notes,
      props.createdAt,
      props.updatedAt,
    );
  }

  get status(): TreatmentItemStatus {
    return this._status;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateStatus(status: TreatmentItemStatus, updatedAt: Date): void {
    this._status = status;
    this._updatedAt = updatedAt;
  }
}
