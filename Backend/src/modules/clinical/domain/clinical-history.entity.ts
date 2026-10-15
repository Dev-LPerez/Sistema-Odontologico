import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { MedicalAntecedents } from './medical-antecedents.vo';
import { TreatmentPlanItem } from './treatment-plan-item.entity';
import { TreatmentItemStatus } from './treatment-item-status.enum';
import { InvalidClinicalHistoryDataError, TreatmentPlanItemNotFoundError } from './clinical.errors';

export interface ClinicalHistoryProps {
  id: string;
  clinicId: string;
  patientId: string;
  chiefComplaint: string;
  currentIllness: string;
  medicalAntecedents: MedicalAntecedents;
  clinicalExamination?: string | null;
  diagnoses?: unknown[];
  treatmentItems?: TreatmentPlanItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateClinicalHistoryProps {
  chiefComplaint?: string;
  currentIllness?: string;
  medicalAntecedents?: MedicalAntecedents;
  clinicalExamination?: string | null;
  diagnoses?: unknown[];
  updatedAt: Date;
}

function validateNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidClinicalHistoryDataError(`El campo '${fieldName}' es obligatorio`);
  }
  return value.trim();
}

export class ClinicalHistory extends AggregateRoot<string> {
  private _chiefComplaint: string;
  private _currentIllness: string;
  private _medicalAntecedents: MedicalAntecedents;
  private _clinicalExamination: string | null;
  private _diagnoses: unknown[];
  private readonly _treatmentItems: TreatmentPlanItem[];
  private _updatedAt: Date;

  private constructor(
    id: string,
    readonly clinicId: string,
    readonly patientId: string,
    chiefComplaint: string,
    currentIllness: string,
    medicalAntecedents: MedicalAntecedents,
    clinicalExamination: string | null,
    diagnoses: unknown[],
    treatmentItems: TreatmentPlanItem[],
    readonly createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._chiefComplaint = chiefComplaint;
    this._currentIllness = currentIllness;
    this._medicalAntecedents = medicalAntecedents;
    this._clinicalExamination = clinicalExamination;
    this._diagnoses = diagnoses;
    this._treatmentItems = [...treatmentItems];
    this._updatedAt = updatedAt;
  }

  static create(props: ClinicalHistoryProps): ClinicalHistory {
    const id = validateNonEmptyString(props.id, 'id');
    const clinicId = validateNonEmptyString(props.clinicId, 'clinicId');
    const patientId = validateNonEmptyString(props.patientId, 'patientId');
    const chiefComplaint = validateNonEmptyString(props.chiefComplaint, 'chiefComplaint');
    const currentIllness = validateNonEmptyString(props.currentIllness, 'currentIllness');

    if (!props.medicalAntecedents || !(props.medicalAntecedents instanceof MedicalAntecedents)) {
      throw new InvalidClinicalHistoryDataError(
        'Los antecedentes médicos (medicalAntecedents) son obligatorios',
      );
    }

    const clinicalExamination =
      typeof props.clinicalExamination === 'string' && props.clinicalExamination.trim() !== ''
        ? props.clinicalExamination.trim()
        : null;

    const diagnoses = Array.isArray(props.diagnoses) ? props.diagnoses : [];
    const treatmentItems = Array.isArray(props.treatmentItems) ? props.treatmentItems : [];

    return new ClinicalHistory(
      id,
      clinicId,
      patientId,
      chiefComplaint,
      currentIllness,
      props.medicalAntecedents,
      clinicalExamination,
      diagnoses,
      treatmentItems,
      props.createdAt,
      props.updatedAt,
    );
  }

  get chiefComplaint(): string {
    return this._chiefComplaint;
  }

  get currentIllness(): string {
    return this._currentIllness;
  }

  get medicalAntecedents(): MedicalAntecedents {
    return this._medicalAntecedents;
  }

  get clinicalExamination(): string | null {
    return this._clinicalExamination;
  }

  get diagnoses(): unknown[] {
    return [...this._diagnoses];
  }

  get treatmentItems(): ReadonlyArray<TreatmentPlanItem> {
    return [...this._treatmentItems];
  }

  get totalEstimatedCostCop(): number {
    return this._treatmentItems.reduce((acc, item) => acc + item.estimatedCostCop, 0);
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  update(props: UpdateClinicalHistoryProps): void {
    if (props.chiefComplaint !== undefined) {
      this._chiefComplaint = validateNonEmptyString(props.chiefComplaint, 'chiefComplaint');
    }

    if (props.currentIllness !== undefined) {
      this._currentIllness = validateNonEmptyString(props.currentIllness, 'currentIllness');
    }

    if (props.medicalAntecedents !== undefined) {
      if (!(props.medicalAntecedents instanceof MedicalAntecedents)) {
        throw new InvalidClinicalHistoryDataError('medicalAntecedents debe ser válido');
      }
      this._medicalAntecedents = props.medicalAntecedents;
    }

    if (props.clinicalExamination !== undefined) {
      this._clinicalExamination =
        typeof props.clinicalExamination === 'string' && props.clinicalExamination.trim() !== ''
          ? props.clinicalExamination.trim()
          : null;
    }

    if (props.diagnoses !== undefined) {
      if (!Array.isArray(props.diagnoses)) {
        throw new InvalidClinicalHistoryDataError('diagnoses debe ser un arreglo');
      }
      this._diagnoses = props.diagnoses;
    }

    this._updatedAt = props.updatedAt;
  }

  addTreatmentPlanItem(item: TreatmentPlanItem): void {
    if (!item || !(item instanceof TreatmentPlanItem)) {
      throw new InvalidClinicalHistoryDataError('El ítem del plan de tratamiento debe ser válido');
    }
    this._treatmentItems.push(item);
    this._updatedAt = item.createdAt;
  }

  updateTreatmentPlanItemStatus(
    itemId: string,
    status: TreatmentItemStatus,
    updatedAt: Date,
  ): void {
    const item = this._treatmentItems.find((i) => i.id === itemId);
    if (!item) {
      throw new TreatmentPlanItemNotFoundError(itemId);
    }
    item.updateStatus(status, updatedAt);
    this._updatedAt = updatedAt;
  }
}
