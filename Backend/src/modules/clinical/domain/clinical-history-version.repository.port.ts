import { ClinicalHistoryVersion } from './clinical-history-version.entity';

export const CLINICAL_HISTORY_VERSION_REPOSITORY_PORT = Symbol(
  'ClinicalHistoryVersionRepositoryPort',
);

export interface ClinicalHistoryVersionRepositoryPort {
  findAllByHistoryId(clinicId: string, historyId: string): Promise<ClinicalHistoryVersion[]>;
  save(version: ClinicalHistoryVersion): Promise<void>;
}
