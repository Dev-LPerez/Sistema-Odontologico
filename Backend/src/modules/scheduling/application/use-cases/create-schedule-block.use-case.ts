import { Inject, Injectable } from '@nestjs/common';
import {
  SCHEDULE_BLOCK_REPOSITORY,
  ScheduleBlockRepositoryPort,
} from '../../domain/schedule-block.repository.port';
import { ScheduleBlock } from '../../domain/schedule-block.entity';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';

export interface CreateScheduleBlockCommand {
  clinicId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

@Injectable()
export class CreateScheduleBlockUseCase {
  constructor(
    @Inject(SCHEDULE_BLOCK_REPOSITORY)
    private readonly scheduleBlockRepo: ScheduleBlockRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: CreateScheduleBlockCommand): Promise<ScheduleBlock> {
    const now = this.clock.now();
    const id = this.idGenerator.generate();

    const block = ScheduleBlock.create({
      id,
      clinicId: command.clinicId,
      startDate: command.startDate,
      endDate: command.endDate,
      reason: command.reason,
      createdAt: now,
      updatedAt: now,
    });

    await this.scheduleBlockRepo.save(block);
    return block;
  }
}
