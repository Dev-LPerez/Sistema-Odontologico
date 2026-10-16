import { InvalidClinicalAttentionDataError } from './clinical.errors';
import { ProcedurePerformed } from './clinical-attention.entity';

export interface AttentionSnapshotMaterial {
  id: string;
  materialId: string;
  brand: string;
  reference: string;
  type: string;
  color: string;
  toothNumber: string | null;
  quantity: number;
  notes: string | null;
  createdAt: string;
}

export interface AttentionSnapshotData {
  proceduresPerformed: ProcedurePerformed[];
  evolutionNotes: string;
  prescription: string | null;
  postOperativeIndications: string | null;
  privateNotes: string | null;
  attendedAt: string;
  updatedAt: string;
  materialsUsed: AttentionSnapshotMaterial[];
}

export interface ClinicalAttentionVersionProps {
  id: string;
  clinicId: string;
  attentionId: string;
  versionNumber: number;
  previousData: AttentionSnapshotData;
  changeReason: string;
  amendedByUserId: string;
  createdAt: Date;
}

export class ClinicalAttentionVersion {
  private constructor(private readonly props: ClinicalAttentionVersionProps) {}

  public static create(props: ClinicalAttentionVersionProps): ClinicalAttentionVersion {
    ClinicalAttentionVersion.validateRequiredStrings(props);
    ClinicalAttentionVersion.validateVersionNumber(props.versionNumber);
    ClinicalAttentionVersion.validateChangeReason(props.changeReason);
    ClinicalAttentionVersion.validateCreatedAt(props.createdAt);

    return new ClinicalAttentionVersion({
      ...props,
      changeReason: props.changeReason.trim(),
      previousData: structuredClone(props.previousData),
    });
  }

  private static validateRequiredStrings(props: ClinicalAttentionVersionProps): void {
    const required: Array<[string, string]> = [
      ['ID', props.id],
      ['Clinic ID', props.clinicId],
      ['Attention ID', props.attentionId],
      ['Amended By User ID', props.amendedByUserId],
    ];

    for (const [name, value] of required) {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        throw new InvalidClinicalAttentionDataError(
          `El campo '${name}' de la versión de atención clínica es obligatorio`,
        );
      }
    }
  }

  private static validateVersionNumber(versionNumber: number): void {
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      throw new InvalidClinicalAttentionDataError(
        'El número de versión debe ser un entero mayor o igual a 1',
      );
    }
  }

  private static validateChangeReason(changeReason: string): void {
    if (!changeReason || typeof changeReason !== 'string' || changeReason.trim().length === 0) {
      throw new InvalidClinicalAttentionDataError(
        'El motivo de la modificación (changeReason) es obligatorio',
      );
    }
  }

  private static validateCreatedAt(createdAt: Date): void {
    if (!createdAt || !(createdAt instanceof Date) || isNaN(createdAt.getTime())) {
      throw new InvalidClinicalAttentionDataError(
        'La fecha de creación de la versión de atención clínica es inválida',
      );
    }
  }

  public maskPrivateNotesForViewer(viewerRole: string): ClinicalAttentionVersion {
    const clonedSnapshot = structuredClone(this.props.previousData);
    if (viewerRole !== 'ADMIN') {
      clonedSnapshot.privateNotes = null;
    }

    return new ClinicalAttentionVersion({
      ...this.props,
      previousData: clonedSnapshot,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get clinicId(): string {
    return this.props.clinicId;
  }

  get attentionId(): string {
    return this.props.attentionId;
  }

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get previousData(): AttentionSnapshotData {
    return structuredClone(this.props.previousData);
  }

  get changeReason(): string {
    return this.props.changeReason;
  }

  get amendedByUserId(): string {
    return this.props.amendedByUserId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
