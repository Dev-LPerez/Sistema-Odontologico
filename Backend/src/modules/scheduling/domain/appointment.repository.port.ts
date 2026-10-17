import { Appointment } from './appointment.aggregate';

export interface AppointmentRepositoryPort {
  save(appointment: Appointment): Promise<void>;
  findById(clinicId: string, id: string): Promise<Appointment | null>;
  findConflicting(
    clinicId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<Appointment | null>;
  countDailyActiveAppointments(
    clinicId: string,
    dayStartUtc: Date,
    dayEndUtc: Date,
    excludeAppointmentId?: string,
  ): Promise<number>;
}

export const APPOINTMENT_REPOSITORY = Symbol('APPOINTMENT_REPOSITORY');
