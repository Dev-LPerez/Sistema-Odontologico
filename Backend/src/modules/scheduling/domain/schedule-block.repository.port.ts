import { ScheduleBlock } from './schedule-block.entity';

export interface ScheduleBlockRepositoryPort {
  save(block: ScheduleBlock): Promise<void>;
  findById(clinicId: string, id: string): Promise<ScheduleBlock | null>;
  findColliding(clinicId: string, startTime: Date, endTime: Date): Promise<ScheduleBlock | null>;
  listByClinicId(clinicId: string, fromDate?: Date): Promise<ScheduleBlock[]>;
}

export const SCHEDULE_BLOCK_REPOSITORY = Symbol('SCHEDULE_BLOCK_REPOSITORY');
