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
  AppointmentOverlapConflictException,
  DailyAppointmentsLimitExceededException,
  InvalidTimeSlotError,
  ScheduleBlockConflictException,
} from '../../domain/scheduling.errors';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';

export interface ScheduleAppointmentCommand {
  clinicId: string;
  patientId: string;
  procedureId: string;
  startTime: Date;
  durationMinutes: number;
  notes?: string | null;
}

@Injectable()
export class ScheduleAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepo: AppointmentRepositoryPort,
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly availabilityRepo: AvailabilityRepositoryPort,
    @Inject(SCHEDULE_BLOCK_REPOSITORY)
    private readonly scheduleBlockRepo: ScheduleBlockRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: ScheduleAppointmentCommand): Promise<Appointment> {
    const timeSlot = TimeSlot.create(command.startTime, command.durationMinutes);

    const availability = await this.availabilityRepo.findByClinicId(command.clinicId);
    if (availability && !availability.isAvailableFor(timeSlot)) {
      throw new InvalidTimeSlotError(
        'El horario de la cita está fuera del rango de disponibilidad semanal configurado',
      );
    }

    const collidingBlock = await this.scheduleBlockRepo.findColliding(
      command.clinicId,
      timeSlot.startTime,
      timeSlot.endTime,
    );
    if (collidingBlock) {
      throw new ScheduleBlockConflictException(collidingBlock.reason);
    }

    const conflicting = await this.appointmentRepo.findConflicting(
      command.clinicId,
      timeSlot.startTime,
      timeSlot.endTime,
    );
    if (conflicting) {
      throw new AppointmentOverlapConflictException();
    }

    const maxLimit = availability?.maxDailyAppointments ?? 4;
    const { dayStartUtc, dayEndUtc } = TimeSlot.getBogotaDayBoundsUtc(timeSlot.startTime);
    const activeCount = await this.appointmentRepo.countDailyActiveAppointments(
      command.clinicId,
      dayStartUtc,
      dayEndUtc,
    );
    if (activeCount >= maxLimit) {
      throw new DailyAppointmentsLimitExceededException(maxLimit);
    }

    const now = this.clock.now();
    const appointment = Appointment.create({
      id: this.idGenerator.generate(),
      clinicId: command.clinicId,
      patientId: command.patientId,
      procedureId: command.procedureId,
      timeSlot,
      notes: command.notes,
      createdAt: now,
      updatedAt: now,
    });

    await this.appointmentRepo.save(appointment);
    return appointment;
  }
}
