import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { ClinicalAttentionStatus } from './clinical-attention-status.enum';
import {
  InvalidClinicalAttentionDataError,
  InvalidOdontogramDataError,
  ClinicalAttentionClosedError,
  IncompleteClinicalAttentionError,
  ClinicalAttentionNotClosedError,
} from './clinical.errors';
import { AttentionMaterialUsed } from './attention-material-used.entity';
import { AttentionSnapshotData } from './clinical-attention-version.entity';
import { AttentionClosedEvent } from './attention-closed.event';
import { ToothNumber } from './tooth-number.vo';
import { ToothSurface } from './tooth-surface.enum';

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

export interface AmendClinicalAttentionProps {
  changeReason: string;
  evolutionNotes?: string;
  prescription?: string | null;
  postOperativeIndications?: string | null;
  privateNotes?: string | null;
  proceduresPerformed?: ProcedurePerformed[];
  updatedAt: Date;
}

export class ClinicalAttention extends AggregateRoot<string> {
  private readonly _materialsUsed: AttentionMaterialUsed[];

  private constructor(private readonly props: ClinicalAttentionProps) {
    super(props.id);
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
      proceduresPerformed: ClinicalAttention.validateAndNormalizeProcedures(
        props.proceduresPerformed ?? [],
      ),
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

  private static normalizeProcedureTooth(rawTooth: unknown): string | null {
    if (rawTooth === undefined || rawTooth === null) {
      return null;
    }
    const trimmed = String(rawTooth).trim();
    return trimmed !== '' ? ToothNumber.of(trimmed).code : null;
  }

  private static normalizeProcedureSurface(rawSurface: unknown): string | null {
    if (rawSurface === undefined || rawSurface === null) {
      return null;
    }
    const trimmed = String(rawSurface).trim();
    if (trimmed === '') {
      return null;
    }
    const upper = trimmed.toUpperCase();
    const surfaceMap: Record<string, ToothSurface> = {
      OCCLUSAL: ToothSurface.OCCLUSAL,
      OCLUSAL: ToothSurface.OCCLUSAL,
      VESTIBULAR: ToothSurface.VESTIBULAR,
      LINGUAL: ToothSurface.LINGUAL,
      PALATINO: ToothSurface.LINGUAL,
      PALATINA: ToothSurface.LINGUAL,
      MESIAL: ToothSurface.MESIAL,
      DISTAL: ToothSurface.DISTAL,
      WHOLE_TOOTH: ToothSurface.WHOLE_TOOTH,
      'DIENTE COMPLETO': ToothSurface.WHOLE_TOOTH,
      DIENTECOMPLETO: ToothSurface.WHOLE_TOOTH,
    };

    const matched = surfaceMap[upper];
    if (!matched) {
      throw new InvalidOdontogramDataError(`La superficie dental '${trimmed}' es inválida`);
    }
    return matched;
  }

  public static validateAndNormalizeProcedures(
    procedures: ProcedurePerformed[],
  ): ProcedurePerformed[] {
    if (!procedures || !Array.isArray(procedures)) {
      return [];
    }

    return procedures.map((p) => {
      const normalizedCode = p && typeof p.code === 'string' ? p.code.trim() : '';
      return {
        code: normalizedCode,
        name: p?.name ? p.name.trim() : null,
        toothNumber: ClinicalAttention.normalizeProcedureTooth(p?.toothNumber),
        surface: ClinicalAttention.normalizeProcedureSurface(p?.surface),
        notes: p?.notes ? p.notes.trim() : null,
      };
    });
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
      this.props.proceduresPerformed = ClinicalAttention.validateAndNormalizeProcedures(
        data.proceduresPerformed,
      );
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
    if (this.props.status === ClinicalAttentionStatus.CLOSED) {
      throw new ClinicalAttentionClosedError(this.id);
    }

    if (
      !this.props.proceduresPerformed ||
      this.props.proceduresPerformed.length === 0 ||
      this.props.proceduresPerformed.some(
        (p) => !p.code || typeof p.code !== 'string' || p.code.trim().length === 0,
      )
    ) {
      throw new IncompleteClinicalAttentionError(
        this.id,
        `No se puede cerrar la atención clínica '${this.id}' sin al menos un procedimiento realizado válido`,
      );
    }

    if (
      !this.props.evolutionNotes ||
      typeof this.props.evolutionNotes !== 'string' ||
      this.props.evolutionNotes.trim().length === 0
    ) {
      throw new IncompleteClinicalAttentionError(
        this.id,
        `No se puede cerrar la atención clínica '${this.id}' sin notas de evolución`,
      );
    }

    ClinicalAttention.validateDates(this.props.attendedAt, this.props.createdAt, updatedAt);
    this.props.status = ClinicalAttentionStatus.CLOSED;
    this.props.updatedAt = updatedAt;

    this.addDomainEvent(
      new AttentionClosedEvent({
        aggregateId: this.id,
        occurredOn: updatedAt,
        clinicId: this.props.clinicId,
        patientId: this.props.patientId,
        clinicalHistoryId: this.props.clinicalHistoryId,
        attendedByUserId: this.props.attendedByUserId,
        proceduresPerformed: this.props.proceduresPerformed,
      }),
    );
  }

  public toSnapshotData(): AttentionSnapshotData {
    return structuredClone({
      proceduresPerformed: this.props.proceduresPerformed.map((p) => ({ ...p })),
      evolutionNotes: this.props.evolutionNotes,
      prescription: this.props.prescription ?? null,
      postOperativeIndications: this.props.postOperativeIndications ?? null,
      privateNotes: this.props.privateNotes ?? null,
      attendedAt: this.props.attendedAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      materialsUsed: this._materialsUsed.map((m) => ({
        id: m.id,
        materialId: m.materialId,
        brand: m.brand,
        reference: m.reference,
        type: m.type,
        color: m.color,
        toothNumber: m.toothNumber,
        quantity: m.quantity,
        notes: m.notes,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  }

  public maskPrivateNotesForViewer(viewerRole: string): ClinicalAttention {
    if (viewerRole === 'ADMIN') {
      return this;
    }
    return new ClinicalAttention({
      ...this.props,
      privateNotes: null,
      materialsUsed: this._materialsUsed,
    });
  }

  public amend(data: AmendClinicalAttentionProps): void {
    this.validateAmendPreconditions(data);
    this.applyAmendedEvolutionNotes(data.evolutionNotes);
    this.applyAmendedProcedures(data.proceduresPerformed);
    this.applyAmendedOptionalFields(data);

    ClinicalAttention.validateDates(this.props.attendedAt, this.props.createdAt, data.updatedAt);
    this.props.updatedAt = data.updatedAt;
  }

  private validateAmendPreconditions(data: AmendClinicalAttentionProps): void {
    if (this.props.status !== ClinicalAttentionStatus.CLOSED) {
      throw new ClinicalAttentionNotClosedError(this.id);
    }

    if (
      !data.changeReason ||
      typeof data.changeReason !== 'string' ||
      data.changeReason.trim().length === 0
    ) {
      throw new InvalidClinicalAttentionDataError(
        'El motivo de la enmienda (changeReason) es obligatorio',
      );
    }
  }

  private applyAmendedEvolutionNotes(evolutionNotes?: string): void {
    if (evolutionNotes !== undefined) {
      if (typeof evolutionNotes !== 'string' || evolutionNotes.trim().length === 0) {
        throw new InvalidClinicalAttentionDataError(
          'Las notas de evolución no pueden estar vacías tras una enmienda',
        );
      }
      this.props.evolutionNotes = evolutionNotes.trim();
    }
  }

  private applyAmendedProcedures(proceduresPerformed?: ProcedurePerformed[]): void {
    if (proceduresPerformed !== undefined) {
      if (!Array.isArray(proceduresPerformed) || proceduresPerformed.length === 0) {
        throw new IncompleteClinicalAttentionError(
          this.id,
          'Una atención enmendada debe conservar al menos un procedimiento realizado válido',
        );
      }
      this.props.proceduresPerformed =
        ClinicalAttention.validateAndNormalizeProcedures(proceduresPerformed);
    }
  }

  private applyAmendedOptionalFields(data: AmendClinicalAttentionProps): void {
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
