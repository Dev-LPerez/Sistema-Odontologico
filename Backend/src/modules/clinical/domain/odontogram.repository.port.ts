import { Odontogram } from './odontogram.entity';

export const ODONTOGRAM_REPOSITORY_PORT = Symbol('ODONTOGRAM_REPOSITORY_PORT');

export interface OdontogramRepositoryPort {
  findByPatientId(clinicId: string, patientId: string): Promise<Odontogram | null>;
  save(odontogram: Odontogram): Promise<void>;
}
