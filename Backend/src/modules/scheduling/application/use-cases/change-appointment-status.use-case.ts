import { Inject, Injectable } from '@nestjs/common';
import {
  APPOINTMENT_REPOSITORY,
  AppointmentRepositoryPort,
} from '../../domain/appointment.repository.port';
import { Appointment } from '../../domain/appointment.aggregate';
import { AppointmentStatus } from '../../domain/appointment-status.enum';
import { AppointmentNotFoundError } from '../../domain/scheduling.errors';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';

export interface ChangeAppointmentStatusCommand {
  clinicId: string;
  appointmentId: string;
  status: AppointmentStatus;
}

@Injectable()
export class ChangeAppointmentStatusUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepo: AppointmentRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: ChangeAppointmentStatusCommand): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findById(
      command.clinicId,
      command.appointmentId,
    );
    if (!appointment) {
      throw new AppointmentNotFoundError(command.appointmentId);
    }

    const now = this.clock.now();
    appointment.changeStatus(command.status, now);
    await this.appointmentRepo.save(appointment);
    return appointment;
  }
}
