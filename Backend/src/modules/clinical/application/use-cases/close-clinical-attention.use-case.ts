import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_ATTENTION_REPOSITORY_PORT,
  ClinicalAttentionRepositoryPort,
} from '../../domain/clinical-attention.repository.port';
import {
  UNIT_OF_WORK_PORT,
  UnitOfWorkPort,
} from '../../../../shared/application/ports/unit-of-work.port';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import { EVENT_BUS_PORT, EventBusPort } from '../../../../shared/application/ports/event-bus.port';
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
    @Inject(UNIT_OF_WORK_PORT)
    private readonly unitOfWork: UnitOfWorkPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(EVENT_BUS_PORT)
    private readonly eventBus: EventBusPort,
  ) {}

  async execute(command: CloseClinicalAttentionCommand): Promise<ClinicalAttention> {
    return this.unitOfWork.execute(async () => {
      const attention = await this.attentionRepository.findById(command.clinicId, command.id);
      if (!attention || attention.clinicId !== command.clinicId) {
        throw new ClinicalAttentionNotFoundError(command.id);
      }

      const now = this.clock.now();
      attention.close(now);
      await this.attentionRepository.save(attention);
      await this.eventBus.publishAll(attention.domainEvents);
      attention.clearDomainEvents();

      return attention;
    });
  }
}
