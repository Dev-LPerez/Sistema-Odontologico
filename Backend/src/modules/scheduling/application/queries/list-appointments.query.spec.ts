import { ListAppointmentsQuery } from './list-appointments.query';
import {
  AppointmentDto,
  AppointmentQueriesPort,
  ListAppointmentsFilter,
} from '../ports/appointment-queries.port';
import { AppointmentStatus } from '../../domain/appointment-status.enum';

class FakeAppointmentQueries implements AppointmentQueriesPort {
  appointments: AppointmentDto[] = [];

  async getById(clinicId: string, id: string): Promise<AppointmentDto | null> {
    return this.appointments.find((a) => a.clinicId === clinicId && a.id === id) || null;
  }

  async list(filter: ListAppointmentsFilter): Promise<AppointmentDto[]> {
    return this.appointments.filter((a) => {
      if (a.clinicId !== filter.clinicId) return false;
      if (filter.patientId && a.patientId !== filter.patientId) return false;
      if (filter.status && a.status !== filter.status) return false;
      return true;
    });
  }
}

describe('ListAppointmentsQuery', () => {
  let query: ListAppointmentsQuery;
  let queries: FakeAppointmentQueries;

  beforeEach(() => {
    queries = new FakeAppointmentQueries();
    query = new ListAppointmentsQuery(queries);
  });

  it('should list appointments matching filter criteria', async () => {
    const now = new Date();
    queries.appointments.push({
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      startTime: new Date('2026-10-20T14:00:00.000Z'),
      endTime: new Date('2026-10-20T15:00:00.000Z'),
      durationMinutes: 60,
      status: AppointmentStatus.SCHEDULED,
      cancellationReason: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });
    queries.appointments.push({
      id: 'appt-2',
      clinicId: 'clinic-123',
      patientId: 'patient-2',
      procedureId: 'proc-2',
      startTime: new Date('2026-10-20T16:00:00.000Z'),
      endTime: new Date('2026-10-20T17:00:00.000Z'),
      durationMinutes: 60,
      status: AppointmentStatus.SCHEDULED,
      cancellationReason: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });

    const result = await query.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('appt-1');
    expect(result[0].status).toBe(AppointmentStatus.SCHEDULED);
  });
});
