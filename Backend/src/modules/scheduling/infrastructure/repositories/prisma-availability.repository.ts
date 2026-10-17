import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AvailabilityRepositoryPort } from '../../domain/availability.repository.port';
import { WeeklyAvailability } from '../../domain/weekly-availability.entity';
import { AvailabilityMapper } from '../mappers/availability.mapper';

@Injectable()
export class PrismaAvailabilityRepository implements AvailabilityRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByClinicId(clinicId: string): Promise<WeeklyAvailability | null> {
    const record = await this.prisma.client.availabilityConfig.findUnique({
      where: { clinicId },
    });
    return record ? AvailabilityMapper.toDomain(record) : null;
  }

  async save(availability: WeeklyAvailability): Promise<void> {
    const data = AvailabilityMapper.toPrisma(availability);
    await this.prisma.client.availabilityConfig.upsert({
      where: { clinicId: availability.clinicId },
      create: {
        id: undefined,
        clinicId: data.clinicId,
        maxDailyAppointments: data.maxDailyAppointments,
        slotsJson: data.slotsJson,
      },
      update: {
        maxDailyAppointments: data.maxDailyAppointments,
        slotsJson: data.slotsJson,
        updatedAt: data.updatedAt,
      },
    });
  }
}
