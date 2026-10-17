import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  AppointmentQueriesPort,
  AppointmentDto,
  ListAppointmentsFilter,
} from '../../application/ports/appointment-queries.port';
import { AppointmentMapper } from '../mappers/appointment.mapper';

@Injectable()
export class PrismaAppointmentQueries implements AppointmentQueriesPort {
  constructor(private readonly prisma: PrismaService) {}

  async getById(clinicId: string, id: string): Promise<AppointmentDto | null> {
    const record = await this.prisma.client.appointment.findFirst({
      where: { id, clinicId },
    });
    return record ? AppointmentMapper.toDto(record) : null;
  }

  async list(filter: ListAppointmentsFilter): Promise<AppointmentDto[]> {
    const records = await this.prisma.client.appointment.findMany({
      where: {
        clinicId: filter.clinicId,
        ...(filter.status ? { status: AppointmentMapper.statusToPrisma(filter.status) } : {}),
        ...(filter.patientId ? { patientId: filter.patientId } : {}),
        ...(filter.startDate || filter.endDate
          ? {
              startTime: {
                ...(filter.startDate ? { gte: filter.startDate } : {}),
                ...(filter.endDate ? { lte: filter.endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    return records.map((r) => AppointmentMapper.toDto(r));
  }
}
