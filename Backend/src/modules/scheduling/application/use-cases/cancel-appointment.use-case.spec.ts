import { CancelAppointmentUseCase } from './cancel-appointment.use-case';
import { AppointmentRepositoryPort } from '../../domain/appointment.repository.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { Appointment } from '../../domain/appointment.aggregate';
import { TimeSlot } from '../../domain/time-slot.vo';
import { AppointmentStatus } from '../../domain/appointment-status.enum';
import {
  AppointmentNotFoundError,
  InvalidAppointmentStatusTransitionException,
  InvalidTimeSlotError,
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

describe('CancelAppointmentUseCase', () => {
  let useCase: CancelAppointmentUseCase;
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
    useCase = new CancelAppointmentUseCase(repo, fakeClock);
  });

  it('should cancel appointment when valid cancellation reason is provided', async () => {
    const appointment = Appointment.create({
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      timeSlot: TimeSlot.create(appointmentSlot, 60),
    });
    await repo.save(appointment);

    const cancelled = await useCase.execute({
      clinicId: 'clinic-123',
      appointmentId: 'appt-1',
      cancellationReason: 'Paciente solicitó cancelar por viaje',
    });

    expect(cancelled.status).toBe(AppointmentStatus.CANCELLED);
    expect(cancelled.cancellationReason).toBe('Paciente solicitó cancelar por viaje');
    expect(cancelled.updatedAt).toEqual(fixedNow);
  });

  it('should reject cancellation without reason', async () => {
    const appointment = Appointment.create({
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      timeSlot: TimeSlot.create(appointmentSlot, 60),
    });
    await repo.save(appointment);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        appointmentId: 'appt-1',
        cancellationReason: '   ',
      }),
    ).rejects.toThrow(InvalidTimeSlotError);
  });

  it('should throw AppointmentNotFoundError when appointment does not exist', async () => {
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        appointmentId: 'non-existent',
        cancellationReason: 'Motivo',
      }),
    ).rejects.toThrow(AppointmentNotFoundError);
  });

  it('should reject cancelling an already cancelled appointment', async () => {
    const appointment = Appointment.create({
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      timeSlot: TimeSlot.create(appointmentSlot, 60),
    });
    appointment.cancel('Primera cancelación', fixedNow);
    await repo.save(appointment);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        appointmentId: 'appt-1',
        cancellationReason: 'Segunda cancelación',
      }),
    ).rejects.toThrow(InvalidAppointmentStatusTransitionException);
  });
});
