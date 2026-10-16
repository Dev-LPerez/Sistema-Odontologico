import { OdontogramSnapshot } from './odontogram-snapshot.entity';

export const ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT = Symbol('ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT');

export interface OdontogramSnapshotRepositoryPort {
  findAllByPatientId(clinicId: string, patientId: string): Promise<OdontogramSnapshot[]>;
  save(snapshot: OdontogramSnapshot): Promise<void>;
}
