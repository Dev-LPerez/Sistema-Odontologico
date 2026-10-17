import { GetAppointmentByIdQuery } from './get-appointment-by-id.query';
import { AppointmentDto, AppointmentQueriesPort } from '../ports/appointment-queries.port';
import { AppointmentStatus } from '../../domain/appointment-status.enum';

class FakeAppointmentQueries implements AppointmentQueriesPort {
  appointments: AppointmentDto[] = [];

  async getById(clinicId: string, id: string): Promise<AppointmentDto | null> {
    return this.appointments.find((a) => a.clinicId === clinicId && a.id === id) || null;
  }

  async list(): Promise<AppointmentDto[]> {
    return this.appointments;
  }
}

describe('GetAppointmentByIdQuery', () => {
  let query: GetAppointmentByIdQuery;
  let queries: FakeAppointmentQueries;

  beforeEach(() => {
    queries = new FakeAppointmentQueries();
    query = new GetAppointmentByIdQuery(queries);
  });

  it('should return null when appointment not found', async () => {
    const result = await query.execute({
      clinicId: 'clinic-123',
      appointmentId: 'non-existent',
    });
    expect(result).toBeNull();
  });

  it('should return appointment dto when found', async () => {
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

    const result = await query.execute({
      clinicId: 'clinic-123',
      appointmentId: 'appt-1',
    });
    expect(result).not.toBeNull();
    expect(result?.id).toBe('appt-1');
    expect(result?.patientId).toBe('patient-1');
  });
});
