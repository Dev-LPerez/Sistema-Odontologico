import { Inject, Injectable } from '@nestjs/common';
import {
  APPOINTMENT_REPOSITORY,
  AppointmentRepositoryPort,
} from '../../domain/appointment.repository.port';
import {
  AVAILABILITY_REPOSITORY,
  AvailabilityRepositoryPort,
} from '../../domain/availability.repository.port';
import {
  SCHEDULE_BLOCK_REPOSITORY,
  ScheduleBlockRepositoryPort,
} from '../../domain/schedule-block.repository.port';
import { Appointment } from '../../domain/appointment.aggregate';
import { TimeSlot } from '../../domain/time-slot.vo';
import {
  AppointmentNotFoundError,
  AppointmentOverlapConflictException,
  DailyAppointmentsLimitExceededException,
  InvalidTimeSlotError,
  ScheduleBlockConflictException,
} from '../../domain/scheduling.errors';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';

export interface RescheduleAppointmentCommand {
  clinicId: string;
  appointmentId: string;
  newStartTime: Date;
  newDurationMinutes?: number;
}

@Injectable()
export class RescheduleAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepo: AppointmentRepositoryPort,
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepo: AvailabilityRepositoryPort,
    @Inject(SCHEDULE_BLOCK_REPOSITORY)
    private readonly scheduleBlockRepo: ScheduleBlockRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: RescheduleAppointmentCommand): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findById(
      command.clinicId,
      command.appointmentId,
    );
    if (!appointment) {
      throw new AppointmentNotFoundError(command.appointmentId);
    }

    const duration = command.newDurationMinutes ?? appointment.timeSlot.durationMinutes;
    const newTimeSlot = TimeSlot.create(command.newStartTime, duration);

    const availability = await this.availabilityRepo.findByClinicId(command.clinicId);
    if (availability && !availability.isAvailableFor(newTimeSlot)) {
      throw new InvalidTimeSlotError(
        'El horario de la cita está fuera del rango de disponibilidad semanal configurado',
      );
    }

    const collidingBlock = await this.scheduleBlockRepo.findColliding(
      command.clinicId,
      newTimeSlot.startTime,
      newTimeSlot.endTime,
    );
    if (collidingBlock) {
      throw new ScheduleBlockConflictException(collidingBlock.reason);
    }

    const conflicting = await this.appointmentRepo.findConflicting(
      command.clinicId,
      newTimeSlot.startTime,
      newTimeSlot.endTime,
      appointment.id,
    );
    if (conflicting) {
      throw new AppointmentOverlapConflictException();
    }

    const maxLimit = availability?.maxDailyAppointments ?? 4;
    const { dayStartUtc, dayEndUtc } = TimeSlot.getBogotaDayBoundsUtc(newTimeSlot.startTime);
    const activeCount = await this.appointmentRepo.countDailyActiveAppointments(
      command.clinicId,
      dayStartUtc,
      dayEndUtc,
      appointment.id,
    );
    if (activeCount >= maxLimit) {
      throw new DailyAppointmentsLimitExceededException(maxLimit);
    }

    const now = this.clock.now();
    appointment.reschedule(newTimeSlot, now);
    await this.appointmentRepo.save(appointment);
    return appointment;
  }
}
