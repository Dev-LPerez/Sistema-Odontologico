import { InMemoryAppointmentQueries } from './in-memory-appointment.queries';
import { InMemoryAppointmentRepository } from '../repositories/in-memory-appointment.repository';
import { Appointment } from '../../domain/appointment.aggregate';
import { TimeSlot } from '../../domain/time-slot.vo';
import { AppointmentStatus } from '../../domain/appointment-status.enum';

describe('InMemoryAppointmentQueries', () => {
  let queries: InMemoryAppointmentQueries;
  let repo: InMemoryAppointmentRepository;

  const fixedNow = new Date('2026-10-20T10:00:00.000Z');
  const start1 = new Date('2026-10-20T14:00:00.000Z');
  const start2 = new Date('2026-10-21T14:00:00.000Z');

  beforeEach(async () => {
    repo = new InMemoryAppointmentRepository();
    queries = new InMemoryAppointmentQueries(repo);

    const appt1 = Appointment.create({
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      timeSlot: TimeSlot.create(start1, 60),
      notes: 'Nota 1',
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    const appt2 = Appointment.create({
      id: 'appt-2',
      clinicId: 'clinic-123',
      patientId: 'patient-2',
      procedureId: 'proc-2',
      timeSlot: TimeSlot.create(start2, 60),
      notes: 'Nota 2',
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    await repo.save(appt1);
    await repo.save(appt2);
  });

  it('should get appointment by id', async () => {
    const res = await queries.getById('clinic-123', 'appt-1');
    expect(res).not.toBeNull();
    expect(res?.id).toBe('appt-1');

    const nonExistent = await queries.getById('clinic-123', 'non-existent');
    expect(nonExistent).toBeNull();
  });

  it('should list and filter appointments correctly', async () => {
    const all = await queries.list({ clinicId: 'clinic-123' });
    expect(all).toHaveLength(2);

    const byPatient = await queries.list({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
    });
    expect(byPatient).toHaveLength(1);
    expect(byPatient[0].id).toBe('appt-1');

    const byStatus = await queries.list({
      clinicId: 'clinic-123',
      status: AppointmentStatus.SCHEDULED,
    });
    expect(byStatus).toHaveLength(2);

    const byDate = await queries.list({
      clinicId: 'clinic-123',
      startDate: new Date('2026-10-20T00:00:00.000Z'),
      endDate: new Date('2026-10-20T23:59:59.000Z'),
    });
    expect(byDate).toHaveLength(1);
    expect(byDate[0].id).toBe('appt-1');

    const otherClinic = await queries.list({ clinicId: 'other-clinic' });
    expect(otherClinic).toHaveLength(0);
  });
});
