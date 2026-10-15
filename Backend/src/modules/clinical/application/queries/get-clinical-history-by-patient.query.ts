import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_HISTORY_REPOSITORY_PORT,
  ClinicalHistoryRepositoryPort,
} from '../../domain/clinical-history.repository.port';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';
import { ClinicalHistory } from '../../domain/clinical-history.entity';

export interface GetClinicalHistoryByPatientParams {
  clinicId: string;
  patientId: string;
}

@Injectable()
export class GetClinicalHistoryByPatientQuery {
  constructor(
    @Inject(CLINICAL_HISTORY_REPOSITORY_PORT)
    private readonly historyRepository: ClinicalHistoryRepositoryPort,
  ) {}

  async execute(params: GetClinicalHistoryByPatientParams): Promise<ClinicalHistory> {
    const history = await this.historyRepository.findByPatientId(params.clinicId, params.patientId);
    if (!history) {
      throw new ClinicalHistoryNotFoundError(params.patientId);
    }

    return history;
  }
}
