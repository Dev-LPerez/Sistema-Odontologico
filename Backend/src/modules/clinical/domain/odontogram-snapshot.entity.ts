import { InvalidOdontogramDataError } from './clinical.errors';

export interface OdontogramSnapshotProps {
  id: string;
  clinicId: string;
  patientId: string;
  odontogramId: string;
  hasTemporalDentition: boolean;
  snapshotData: Record<string, unknown>;
  notes?: string | null;
  createdAt: Date;
}

function validateNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidOdontogramDataError(`El campo '${fieldName}' es obligatorio`);
  }
  return value.trim();
}

export class OdontogramSnapshot {
  private constructor(
    readonly id: string,
    readonly clinicId: string,
    readonly patientId: string,
    readonly odontogramId: string,
    readonly hasTemporalDentition: boolean,
    readonly snapshotData: Record<string, unknown>,
    readonly notes: string | null,
    readonly createdAt: Date,
  ) {}

  static create(props: OdontogramSnapshotProps): OdontogramSnapshot {
    const id = validateNonEmptyString(props.id, 'id');
    const clinicId = validateNonEmptyString(props.clinicId, 'clinicId');
    const patientId = validateNonEmptyString(props.patientId, 'patientId');
    const odontogramId = validateNonEmptyString(props.odontogramId, 'odontogramId');
    const hasTemporalDentition = Boolean(props.hasTemporalDentition);

    if (!props.snapshotData || typeof props.snapshotData !== 'object') {
      throw new InvalidOdontogramDataError(
        'Los datos de la instantánea (snapshotData) son obligatorios',
      );
    }

    const immutableSnapshotData = structuredClone(props.snapshotData) as Record<string, unknown>;
    const notes = props.notes && props.notes.trim() !== '' ? props.notes.trim() : null;

    return new OdontogramSnapshot(
      id,
      clinicId,
      patientId,
      odontogramId,
      hasTemporalDentition,
      immutableSnapshotData,
      notes,
      props.createdAt,
    );
  }
}
