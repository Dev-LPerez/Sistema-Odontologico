import { AppointmentStatus } from '../../domain/appointment-status.enum';

export interface AppointmentDto {
  id: string;
  clinicId: string;
  patientId: string;
  procedureId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAppointmentsFilter {
  clinicId: string;
  startDate?: Date;
  endDate?: Date;
  patientId?: string;
  status?: AppointmentStatus;
}

export interface AppointmentQueriesPort {
  getById(clinicId: string, id: string): Promise<AppointmentDto | null>;
  list(filter: ListAppointmentsFilter): Promise<AppointmentDto[]>;
}

export const APPOINTMENT_QUERIES = Symbol('APPOINTMENT_QUERIES');
