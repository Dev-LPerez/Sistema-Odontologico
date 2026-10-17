import { AvailabilityConfig } from '@prisma/client';
import { WeeklyAvailability, AvailabilitySlotItem } from '../../domain/weekly-availability.entity';

export class AvailabilityMapper {
  static toDomain(record: AvailabilityConfig): WeeklyAvailability {
    const slots = (record.slotsJson as unknown as AvailabilitySlotItem[]) || [];
    return WeeklyAvailability.reconstitute({
      clinicId: record.clinicId,
      slots,
      maxDailyAppointments: record.maxDailyAppointments,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPrisma(domain: WeeklyAvailability) {
    return {
      clinicId: domain.clinicId,
      maxDailyAppointments: domain.maxDailyAppointments,
      slotsJson: domain.slots as unknown as object,
      updatedAt: domain.updatedAt,
    };
  }
}
