import { ClinicalAttentionStatus } from './clinical-attention-status.enum';
import { InvalidClinicalAttentionDataError, ClinicalAttentionClosedError } from './clinical.errors';
import { AttentionMaterialUsed } from './attention-material-used.entity';

export interface ProcedurePerformed {
  code: string;
  name?: string | null;
  toothNumber?: string | null;
  surface?: string | null;
  notes?: string | null;
}

export interface ClinicalAttentionProps {
  id: string;
  clinicId: string;
  patientId: string;
  clinicalHistoryId: string;
  attendedByUserId: string;
  status: ClinicalAttentionStatus;
  proceduresPerformed: ProcedurePerformed[];
  evolutionNotes: string;
  prescription?: string | null;
  postOperativeIndications?: string | null;
  privateNotes?: string | null;
  attendedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  materialsUsed?: AttentionMaterialUsed[];
}

export interface UpdateClinicalAttentionProps {
  evolutionNotes?: string;
  prescription?: string | null;
  postOperativeIndications?: string | null;
  privateNotes?: string | null;
  proceduresPerformed?: ProcedurePerformed[];
  updatedAt: Date;
}

export class ClinicalAttention {
  private readonly _materialsUsed: AttentionMaterialUsed[];

  private constructor(private readonly props: ClinicalAttentionProps) {
    this._materialsUsed = props.materialsUsed ? [...props.materialsUsed] : [];
  }

  public static create(props: ClinicalAttentionProps): ClinicalAttention {
    ClinicalAttention.validateRequiredIds(props);
    ClinicalAttention.validateEvolutionNotes(props.evolutionNotes);
    ClinicalAttention.validateDates(props.attendedAt, props.createdAt, props.updatedAt);

    return new ClinicalAttention({
      ...props,
      evolutionNotes: props.evolutionNotes.trim(),
      prescription: props.prescription ? props.prescription.trim() : null,
      postOperativeIndications: props.postOperativeIndications
        ? props.postOperativeIndications.trim()
        : null,
      privateNotes: props.privateNotes ? props.privateNotes.trim() : null,
      proceduresPerformed: props.proceduresPerformed ?? [],
      materialsUsed: props.materialsUsed ?? [],
    });
  }

  private static validateRequiredIds(props: ClinicalAttentionProps): void {
    const ids: Array<[string, string]> = [
      ['ID', props.id],
      ['Clinic ID', props.clinicId],
      ['Patient ID', props.patientId],
      ['Clinical History ID', props.clinicalHistoryId],
      ['Attended By User ID', props.attendedByUserId],
    ];

    for (const [name, val] of ids) {
      if (!val || typeof val !== 'string' || val.trim().length === 0) {
        throw new InvalidClinicalAttentionDataError(
          `El campo '${name}' de la atención clínica es obligatorio`,
        );
      }
    }
  }

  private static validateEvolutionNotes(evolutionNotes: string): void {
    if (
      !evolutionNotes ||
      typeof evolutionNotes !== 'string' ||
      evolutionNotes.trim().length === 0
    ) {
      throw new InvalidClinicalAttentionDataError('Las notas de evolución no pueden estar vacías');
    }
  }

  private static validateDates(attendedAt: Date, createdAt: Date, updatedAt: Date): void {
    const dates: Array<[string, Date]> = [
      ['attendedAt', attendedAt],
      ['createdAt', createdAt],
      ['updatedAt', updatedAt],
    ];

    for (const [name, d] of dates) {
      if (!d || !(d instanceof Date) || isNaN(d.getTime())) {
        throw new InvalidClinicalAttentionDataError(
          `La fecha '${name}' de la atención clínica es inválida`,
        );
      }
    }
  }

  public update(data: UpdateClinicalAttentionProps): void {
    if (this.props.status === ClinicalAttentionStatus.CLOSED) {
      throw new ClinicalAttentionClosedError(this.id);
    }

    if (data.evolutionNotes !== undefined) {
      ClinicalAttention.validateEvolutionNotes(data.evolutionNotes);
      this.props.evolutionNotes = data.evolutionNotes.trim();
    }

    if (data.prescription !== undefined) {
      this.props.prescription = data.prescription ? data.prescription.trim() : null;
    }

    if (data.postOperativeIndications !== undefined) {
      this.props.postOperativeIndications = data.postOperativeIndications
        ? data.postOperativeIndications.trim()
        : null;
    }

    if (data.privateNotes !== undefined) {
      this.props.privateNotes = data.privateNotes ? data.privateNotes.trim() : null;
    }

    if (data.proceduresPerformed !== undefined) {
      this.props.proceduresPerformed = [...data.proceduresPerformed];
    }

    ClinicalAttention.validateDates(this.props.attendedAt, this.props.createdAt, data.updatedAt);
    this.props.updatedAt = data.updatedAt;
  }

  public addMaterialUsed(material: AttentionMaterialUsed, updatedAt: Date): void {
    if (this.props.status === ClinicalAttentionStatus.CLOSED) {
      throw new ClinicalAttentionClosedError(this.id);
    }

    ClinicalAttention.validateDates(this.props.attendedAt, this.props.createdAt, updatedAt);
    this._materialsUsed.push(material);
    this.props.updatedAt = updatedAt;
  }

  public close(updatedAt: Date): void {
    ClinicalAttention.validateDates(this.props.attendedAt, this.props.createdAt, updatedAt);
    this.props.status = ClinicalAttentionStatus.CLOSED;
    this.props.updatedAt = updatedAt;
  }

  get id(): string {
    return this.props.id;
  }

  get clinicId(): string {
    return this.props.clinicId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get clinicalHistoryId(): string {
    return this.props.clinicalHistoryId;
  }

  get attendedByUserId(): string {
    return this.props.attendedByUserId;
  }

  get status(): ClinicalAttentionStatus {
    return this.props.status;
  }

  get proceduresPerformed(): ProcedurePerformed[] {
    return [...this.props.proceduresPerformed];
  }

  get evolutionNotes(): string {
    return this.props.evolutionNotes;
  }

  get prescription(): string | null {
    return this.props.prescription ?? null;
  }

  get postOperativeIndications(): string | null {
    return this.props.postOperativeIndications ?? null;
  }

  get privateNotes(): string | null {
    return this.props.privateNotes ?? null;
  }

  get attendedAt(): Date {
    return this.props.attendedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get materialsUsed(): AttentionMaterialUsed[] {
    return [...this._materialsUsed];
  }
}
