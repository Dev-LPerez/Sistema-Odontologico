import { Appointment as AppointmentModel, AppointmentStatusDb } from '@prisma/client';
import { Appointment } from '../../domain/appointment.aggregate';
import { AppointmentStatus } from '../../domain/appointment-status.enum';
import { TimeSlot } from '../../domain/time-slot.vo';
import { AppointmentDto } from '../../application/ports/appointment-queries.port';

export class AppointmentMapper {
  static toDomain(record: AppointmentModel): Appointment {
    const timeSlot = TimeSlot.create(record.startTime, record.durationMinutes);
    return Appointment.reconstitute({
      id: record.id,
      clinicId: record.clinicId,
      patientId: record.patientId,
      procedureId: record.procedureId,
      timeSlot,
      status: AppointmentMapper.statusToDomain(record.status),
      cancellationReason: record.cancellationReason,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPrisma(domain: Appointment): AppointmentModel {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      patientId: domain.patientId,
      procedureId: domain.procedureId,
      startTime: domain.timeSlot.startTime,
      endTime: domain.timeSlot.endTime,
      durationMinutes: domain.timeSlot.durationMinutes,
      status: AppointmentMapper.statusToPrisma(domain.status),
      cancellationReason: domain.cancellationReason,
      notes: domain.notes,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toDto(record: AppointmentModel): AppointmentDto {
    return {
      id: record.id,
      clinicId: record.clinicId,
      patientId: record.patientId,
      procedureId: record.procedureId,
      startTime: record.startTime,
      endTime: record.endTime,
      durationMinutes: record.durationMinutes,
      status: AppointmentMapper.statusToDomain(record.status),
      cancellationReason: record.cancellationReason,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static statusToDomain(status: AppointmentStatusDb): AppointmentStatus {
    switch (status) {
      case AppointmentStatusDb.SCHEDULED:
        return AppointmentStatus.SCHEDULED;
      case AppointmentStatusDb.CONFIRMED:
        return AppointmentStatus.CONFIRMED;
      case AppointmentStatusDb.ATTENDED:
        return AppointmentStatus.ATTENDED;
      case AppointmentStatusDb.NO_SHOW:
        return AppointmentStatus.NO_SHOW;
      case AppointmentStatusDb.CANCELLED:
        return AppointmentStatus.CANCELLED;
      default:
        return AppointmentStatus.SCHEDULED;
    }
  }

  static statusToPrisma(status: AppointmentStatus): AppointmentStatusDb {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return AppointmentStatusDb.SCHEDULED;
      case AppointmentStatus.CONFIRMED:
        return AppointmentStatusDb.CONFIRMED;
      case AppointmentStatus.ATTENDED:
        return AppointmentStatusDb.ATTENDED;
      case AppointmentStatus.NO_SHOW:
        return AppointmentStatusDb.NO_SHOW;
      case AppointmentStatus.CANCELLED:
        return AppointmentStatusDb.CANCELLED;
      default:
        return AppointmentStatusDb.SCHEDULED;
    }
  }
}
