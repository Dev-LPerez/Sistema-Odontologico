import { ClinicalHistory } from './clinical-history.entity';

export const CLINICAL_HISTORY_REPOSITORY_PORT = Symbol('CLINICAL_HISTORY_REPOSITORY_PORT');

export interface ClinicalHistoryRepositoryPort {
  findById(clinicId: string, id: string): Promise<ClinicalHistory | null>;
  findByPatientId(clinicId: string, patientId: string): Promise<ClinicalHistory | null>;
  save(clinicalHistory: ClinicalHistory): Promise<void>;
}
