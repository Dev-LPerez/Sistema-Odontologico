import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { UserRole } from '../../../identity';

export interface ListClinicalAttentionsByPatientParams {
  clinicId: string;
  patientId: string;
  viewerRole: UserRole;
}

@Injectable()
export class ListClinicalAttentionsByPatientQuery {
  constructor(
    @Inject(CLINICAL_ATTENTION_REPOSITORY_PORT)
    private readonly attentionRepository: ClinicalAttentionRepositoryPort,
  ) {}

  async execute(params: ListClinicalAttentionsByPatientParams): Promise<ClinicalAttention[]> {
    const attentions = await this.attentionRepository.findAllByPatientId(
      params.clinicId,
      params.patientId,
    );

    if (params.viewerRole === UserRole.ADMIN) {
      return attentions;
    }

    return attentions.map((attention) =>
      ClinicalAttention.create({
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
      }),
    );
  }
}
