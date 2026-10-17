import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AppointmentRepositoryPort } from '../../domain/appointment.repository.port';
import { Appointment } from '../../domain/appointment.aggregate';
import { AppointmentMapper } from '../mappers/appointment.mapper';
import { AppointmentOverlapConflictException } from '../../domain/scheduling.errors';

@Injectable()
export class PrismaAppointmentRepository implements AppointmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(clinicId: string, id: string): Promise<Appointment | null> {
    const record = await this.prisma.client.appointment.findFirst({
      where: { id, clinicId },
    });
    return record ? AppointmentMapper.toDomain(record) : null;
  }

  async findConflicting(
    clinicId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<Appointment | null> {
    const record = await this.prisma.client.appointment.findFirst({
      where: {
        clinicId,
        status: { not: 'CANCELLED' },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
    });
    return record ? AppointmentMapper.toDomain(record) : null;
  }

  async countDailyActiveAppointments(
    clinicId: string,
    dayStartUtc: Date,
    dayEndUtc: Date,
    excludeAppointmentId?: string,
  ): Promise<number> {
    return this.prisma.client.appointment.count({
      where: {
        clinicId,
        status: { not: 'CANCELLED' },
        startTime: {
          gte: dayStartUtc,
          lte: dayEndUtc,
        },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
    });
  }

  async save(appointment: Appointment): Promise<void> {
    const data = AppointmentMapper.toPrisma(appointment);
    try {
      await this.prisma.client.appointment.upsert({
        where: { id: data.id },
        create: data,
        update: {
          startTime: data.startTime,
          endTime: data.endTime,
          durationMinutes: data.durationMinutes,
          status: data.status,
          cancellationReason: data.cancellationReason,
          notes: data.notes,
          updatedAt: data.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppointmentOverlapConflictException(
          'Conflicto de unicidad al registrar la cita en el consultorio',
        );
      }
      throw error;
    }
  }
}
