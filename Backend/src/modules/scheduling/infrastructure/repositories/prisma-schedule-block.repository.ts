import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ScheduleBlockRepositoryPort } from '../../domain/schedule-block.repository.port';
import { ScheduleBlock } from '../../domain/schedule-block.entity';
import { ScheduleBlockMapper } from '../mappers/schedule-block.mapper';

@Injectable()
export class PrismaScheduleBlockRepository implements ScheduleBlockRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(clinicId: string, id: string): Promise<ScheduleBlock | null> {
    const record = await this.prisma.client.scheduleBlock.findFirst({
      where: { id, clinicId },
    });
    return record ? ScheduleBlockMapper.toDomain(record) : null;
  }

  async findColliding(
    clinicId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<ScheduleBlock | null> {
    const record = await this.prisma.client.scheduleBlock.findFirst({
      where: {
        clinicId,
        startDate: { lt: endTime },
        endDate: { gt: startTime },
      },
    });
    return record ? ScheduleBlockMapper.toDomain(record) : null;
  }

  async listByClinicId(clinicId: string, fromDate?: Date): Promise<ScheduleBlock[]> {
    const records = await this.prisma.client.scheduleBlock.findMany({
      where: {
        clinicId,
        ...(fromDate ? { endDate: { gte: fromDate } } : {}),
      },
      orderBy: {
        startDate: 'asc',
      },
    });
    return records.map((r) => ScheduleBlockMapper.toDomain(r));
  }

  async save(block: ScheduleBlock): Promise<void> {
    const data = ScheduleBlockMapper.toPrisma(block);
    await this.prisma.client.scheduleBlock.upsert({
      where: { id: data.id },
      create: data,
      update: {
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        updatedAt: data.updatedAt,
      },
    });
  }
}
