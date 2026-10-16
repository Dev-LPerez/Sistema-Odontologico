import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionNotFoundError } from '../../domain/clinical.errors';
import { UserRole } from '../../../identity';

export interface GetClinicalAttentionByIdParams {
  clinicId: string;
  id: string;
  viewerRole: UserRole;
}

@Injectable()
export class GetClinicalAttentionByIdQuery {
  constructor(
    @Inject(CLINICAL_ATTENTION_REPOSITORY_PORT)
    private readonly attentionRepository: ClinicalAttentionRepositoryPort,
  ) {}

  async execute(params: GetClinicalAttentionByIdParams): Promise<ClinicalAttention> {
    const attention = await this.attentionRepository.findById(params.clinicId, params.id);
    if (!attention || attention.clinicId !== params.clinicId) {
      throw new ClinicalAttentionNotFoundError(params.id);
    }

    if (params.viewerRole === UserRole.ADMIN) {
      return attention;
    }

    return ClinicalAttention.create({
      id: attention.id,
      clinicId: attention.clinicId,
      patientId: attention.patientId,
      clinicalHistoryId: attention.clinicalHistoryId,
      attendedByUserId: attention.attendedByUserId,
      status: attention.status,
      proceduresPerformed: attention.proceduresPerformed,
      evolutionNotes: attention.evolutionNotes,
      prescription: attention.prescription,
      postOperativeIndications: attention.postOperativeIndications,
      privateNotes: null,
      attendedAt: attention.attendedAt,
      createdAt: attention.createdAt,
      updatedAt: attention.updatedAt,
      materialsUsed: attention.materialsUsed,
    });
  }
}
