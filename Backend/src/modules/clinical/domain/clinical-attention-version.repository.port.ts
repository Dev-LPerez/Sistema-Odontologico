import { ClinicalAttentionVersion } from './clinical-attention-version.entity';

export const CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT = Symbol(
  'ClinicalAttentionVersionRepositoryPort',
);

export interface ClinicalAttentionVersionRepositoryPort {
  findAllByAttentionId(clinicId: string, attentionId: string): Promise<ClinicalAttentionVersion[]>;
  save(version: ClinicalAttentionVersion): Promise<void>;
}
