import { ChangeAppointmentStatusUseCase } from './change-appointment-status.use-case';
import { AppointmentRepositoryPort } from '../../domain/appointment.repository.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { Appointment } from '../../domain/appointment.aggregate';
import { TimeSlot } from '../../domain/time-slot.vo';
import { AppointmentStatus } from '../../domain/appointment-status.enum';
import {
  AppointmentNotFoundError,
  InvalidAppointmentStatusTransitionException,
} from '../../domain/scheduling.errors';

class FakeAppointmentRepository implements AppointmentRepositoryPort {
  appointments: Appointment[] = [];

  async save(appointment: Appointment): Promise<void> {
    const idx = this.appointments.findIndex((a) => a.id === appointment.id);
    if (idx >= 0) {
      this.appointments[idx] = appointment;
    } else {
      this.appointments.push(appointment);
    }
  }

  async findById(clinicId: string, id: string): Promise<Appointment | null> {
    return this.appointments.find((a) => a.clinicId === clinicId && a.id === id) || null;
  }

  async findConflicting(): Promise<Appointment | null> {
    return null;
  }

  async countDailyActiveAppointments(): Promise<number> {
    return 0;
  }
}

describe('ChangeAppointmentStatusUseCase', () => {
  let useCase: ChangeAppointmentStatusUseCase;
  let repo: FakeAppointmentRepository;
  let fakeClock: ClockPort;

  const fixedNow = new Date('2026-10-20T08:00:00.000Z');
  const appointmentSlot = new Date('2026-10-20T14:00:00.000Z');

  beforeEach(() => {
    repo = new FakeAppointmentRepository();
    fakeClock = {
      now: jest.fn().mockReturnValue(fixedNow),
      todayInBogota: jest.fn().mockReturnValue('2026-10-20'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-20 03:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    useCase = new ChangeAppointmentStatusUseCase(repo, fakeClock);
  });

  it('should transition appointment status through SCHEDULED, CONFIRMED and ATTENDED', async () => {
    const appointment = Appointment.create({
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      timeSlot: TimeSlot.create(appointmentSlot, 60),
    });
    await repo.save(appointment);

    // Transition to CONFIRMED
    const confirmed = await useCase.execute({
      clinicId: 'clinic-123',
      appointmentId: 'appt-1',
      status: AppointmentStatus.CONFIRMED,
    });
    expect(confirmed.status).toBe(AppointmentStatus.CONFIRMED);

    // Transition to ATTENDED
    const attended = await useCase.execute({
      clinicId: 'clinic-123',
      appointmentId: 'appt-1',
      status: AppointmentStatus.ATTENDED,
    });
    expect(attended.status).toBe(AppointmentStatus.ATTENDED);
  });

  it('should reject invalid status transition on cancelled appointment with 400', async () => {
    const appointment = Appointment.create({
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      timeSlot: TimeSlot.create(appointmentSlot, 60),
    });
    appointment.cancel('Cancelada', fixedNow);
    await repo.save(appointment);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        appointmentId: 'appt-1',
        status: AppointmentStatus.ATTENDED,
      }),
    ).rejects.toThrow(InvalidAppointmentStatusTransitionException);
  });

  it('should throw AppointmentNotFoundError when appointment does not exist', async () => {
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        appointmentId: 'non-existent',
        status: AppointmentStatus.CONFIRMED,
      }),
    ).rejects.toThrow(AppointmentNotFoundError);
  });
});
