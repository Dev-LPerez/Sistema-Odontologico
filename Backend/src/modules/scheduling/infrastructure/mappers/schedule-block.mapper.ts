import { ScheduleBlock as ScheduleBlockModel } from '@prisma/client';
import { ScheduleBlock } from '../../domain/schedule-block.entity';

export class ScheduleBlockMapper {
  static toDomain(record: ScheduleBlockModel): ScheduleBlock {
    return ScheduleBlock.create({
      id: record.id,
      clinicId: record.clinicId,
      startDate: record.startDate,
      endDate: record.endDate,
      reason: record.reason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPrisma(domain: ScheduleBlock): ScheduleBlockModel {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      startDate: domain.startDate,
      endDate: domain.endDate,
      reason: domain.reason,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
