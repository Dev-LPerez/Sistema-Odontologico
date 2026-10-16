import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionNotFoundError } from '../../domain/clinical.errors';

export interface CloseClinicalAttentionCommand {
  clinicId: string;
  id: string;
}

@Injectable()
export class CloseClinicalAttentionUseCase {
  constructor(
    @Inject(CLINICAL_ATTENTION_REPOSITORY_PORT)
    private readonly attentionRepository: ClinicalAttentionRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: CloseClinicalAttentionCommand): Promise<ClinicalAttention> {
    const attention = await this.attentionRepository.findById(command.clinicId, command.id);
    if (!attention || attention.clinicId !== command.clinicId) {
      throw new ClinicalAttentionNotFoundError(command.id);
    }

    const now = this.clock.now();
    attention.close(now);
    await this.attentionRepository.save(attention);

    return attention;
  }
}
