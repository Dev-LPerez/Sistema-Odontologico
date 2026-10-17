import { Inject, Injectable } from '@nestjs/common';
import {
  APPOINTMENT_REPOSITORY,
  AppointmentRepositoryPort,
} from '../../domain/appointment.repository.port';
import { Appointment } from '../../domain/appointment.aggregate';
import { AppointmentNotFoundError } from '../../domain/scheduling.errors';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';

export interface CancelAppointmentCommand {
  clinicId: string;
  appointmentId: string;
  cancellationReason: string;
}

@Injectable()
export class CancelAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepo: AppointmentRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: CancelAppointmentCommand): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findById(
      command.clinicId,
      command.appointmentId,
    );
    if (!appointment) {
      throw new AppointmentNotFoundError(command.appointmentId);
    }

    const now = this.clock.now();
    appointment.cancel(command.cancellationReason, now);
    await this.appointmentRepo.save(appointment);
    return appointment;
  }
}
