import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import {
  CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT,
  ClinicalAttentionVersionRepositoryPort,
} from '../../domain/clinical-attention-version.repository.port';
import { ClinicalAttentionVersion } from '../../domain/clinical-attention-version.entity';
import { ClinicalAttentionNotFoundError } from '../../domain/clinical.errors';
import { UserRole } from '../../../identity';

export interface ListClinicalAttentionVersionsParams {
  clinicId: string;
  attentionId: string;
  viewerRole: UserRole;
}

@Injectable()
export class ListClinicalAttentionVersionsQuery {
  constructor(
    @Inject(CLINICAL_ATTENTION_REPOSITORY_PORT)
    private readonly attentionRepository: ClinicalAttentionRepositoryPort,
    @Inject(CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT)
    private readonly versionRepository: ClinicalAttentionVersionRepositoryPort,
  ) {}

  async execute(params: ListClinicalAttentionVersionsParams): Promise<ClinicalAttentionVersion[]> {
    const attention = await this.attentionRepository.findById(params.clinicId, params.attentionId);
    if (!attention || attention.clinicId !== params.clinicId) {
      throw new ClinicalAttentionNotFoundError(params.attentionId);
    }

    const versions = await this.versionRepository.findAllByAttentionId(
      params.clinicId,
      params.attentionId,
    );

    const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);

    return sortedVersions.map((version) => version.maskPrivateNotesForViewer(params.viewerRole));
  }
}
