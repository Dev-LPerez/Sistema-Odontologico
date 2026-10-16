import { ClinicalAttention } from './clinical-attention.entity';

export const CLINICAL_ATTENTION_REPOSITORY_PORT = Symbol('ClinicalAttentionRepositoryPort');

export interface ClinicalAttentionRepositoryPort {
  findById(clinicId: string, id: string): Promise<ClinicalAttention | null>;
  findAllByPatientId(clinicId: string, patientId: string): Promise<ClinicalAttention[]>;
  save(attention: ClinicalAttention): Promise<void>;
}
