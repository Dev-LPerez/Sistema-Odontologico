import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_HISTORY_REPOSITORY_PORT,
  ClinicalHistoryRepositoryPort,
} from '../../domain/clinical-history.repository.port';
import {
  CLINICAL_HISTORY_VERSION_REPOSITORY_PORT,
  ClinicalHistoryVersionRepositoryPort,
} from '../../domain/clinical-history-version.repository.port';
import { ClinicalHistoryVersion } from '../../domain/clinical-history-version.entity';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';

export interface ListClinicalHistoryVersionsParams {
  clinicId: string;
  patientId: string;
}

@Injectable()
export class ListClinicalHistoryVersionsQuery {
  constructor(
    @Inject(CLINICAL_HISTORY_REPOSITORY_PORT)
    private readonly historyRepository: ClinicalHistoryRepositoryPort,
    @Inject(CLINICAL_HISTORY_VERSION_REPOSITORY_PORT)
    private readonly versionRepository: ClinicalHistoryVersionRepositoryPort,
  ) {}

  async execute(params: ListClinicalHistoryVersionsParams): Promise<ClinicalHistoryVersion[]> {
    const history = await this.historyRepository.findByPatientId(params.clinicId, params.patientId);
    if (!history || history.clinicId !== params.clinicId) {
      throw new ClinicalHistoryNotFoundError(params.patientId);
    }

    const versions = await this.versionRepository.findAllByHistoryId(params.clinicId, history.id);

    return [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
  }
}
