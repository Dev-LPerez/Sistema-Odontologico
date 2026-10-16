import { InvalidClinicalHistoryDataError } from './clinical.errors';
import { ClinicalHistorySnapshotData } from './clinical-history.entity';

export interface ClinicalHistoryVersionProps {
  id: string;
  clinicId: string;
  clinicalHistoryId: string;
  versionNumber: number;
  previousData: ClinicalHistorySnapshotData | Record<string, unknown>;
  changeReason?: string | null;
  updatedByUserId?: string | null;
  createdAt: Date;
}

export class ClinicalHistoryVersion {
  private constructor(private readonly props: ClinicalHistoryVersionProps) {}

  public static create(props: ClinicalHistoryVersionProps): ClinicalHistoryVersion {
    ClinicalHistoryVersion.validateRequiredStrings(props);
    ClinicalHistoryVersion.validateVersionNumber(props.versionNumber);
    ClinicalHistoryVersion.validatePreviousData(props.previousData);
    ClinicalHistoryVersion.validateCreatedAt(props.createdAt);

    return new ClinicalHistoryVersion({
      ...props,
      changeReason: props.changeReason?.trim() || null,
      updatedByUserId: props.updatedByUserId?.trim() || null,
      previousData: structuredClone(props.previousData),
    });
  }

  private static validateRequiredStrings(props: ClinicalHistoryVersionProps): void {
    const required: Array<[string, string]> = [
      ['ID', props.id],
      ['Clinic ID', props.clinicId],
      ['Clinical History ID', props.clinicalHistoryId],
    ];

    for (const [name, value] of required) {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new InvalidClinicalHistoryDataError(
          `El campo '${name}' de la versión de historia clínica es obligatorio`,
        );
      }
    }
  }

  private static validateVersionNumber(versionNumber: number): void {
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      throw new InvalidClinicalHistoryDataError(
        'El número de versión debe ser un entero mayor o igual a 1',
      );
    }
  }

  private static validatePreviousData(previousData: unknown): void {
    if (!previousData || typeof previousData !== 'object' || Array.isArray(previousData)) {
      throw new InvalidClinicalHistoryDataError(
        'Los datos previos (previousData) de la versión deben ser un objeto válido',
      );
    }
  }

  private static validateCreatedAt(createdAt: Date): void {
    if (!createdAt || !(createdAt instanceof Date) || isNaN(createdAt.getTime())) {
      throw new InvalidClinicalHistoryDataError(
        'La fecha de creación de la versión de historia clínica es inválida',
      );
    }
  }

  get id(): string {
    return this.props.id;
  }

  get clinicId(): string {
    return this.props.clinicId;
  }

  get clinicalHistoryId(): string {
    return this.props.clinicalHistoryId;
  }

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get previousData(): Record<string, unknown> {
    return structuredClone(this.props.previousData as Record<string, unknown>);
  }

  get changeReason(): string | null {
    return this.props.changeReason ?? null;
  }

  get updatedByUserId(): string | null {
    return this.props.updatedByUserId ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
