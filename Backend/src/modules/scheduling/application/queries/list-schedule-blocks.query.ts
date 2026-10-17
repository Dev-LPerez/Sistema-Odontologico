import { Inject, Injectable } from '@nestjs/common';
import {
  SCHEDULE_BLOCK_REPOSITORY,
  ScheduleBlockRepositoryPort,
} from '../../domain/schedule-block.repository.port';
import { ScheduleBlock } from '../../domain/schedule-block.entity';

export interface ListScheduleBlocksParams {
  clinicId: string;
  fromDate?: Date;
}

@Injectable()
export class ListScheduleBlocksQuery {
  constructor(
    @Inject(SCHEDULE_BLOCK_REPOSITORY)
    private readonly scheduleBlockRepo: ScheduleBlockRepositoryPort,
  ) {}

  async execute(params: ListScheduleBlocksParams): Promise<ScheduleBlock[]> {
    return this.scheduleBlockRepo.listByClinicId(params.clinicId, params.fromDate);
  }
}
