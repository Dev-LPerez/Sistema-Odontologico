import { Clinic } from './clinic.entity';

export const CLINIC_REPOSITORY_PORT = Symbol('CLINIC_REPOSITORY_PORT');

export interface ClinicRepositoryPort {
  findById(id: string): Promise<Clinic | null>;
  save(clinic: Clinic): Promise<void>;
}
