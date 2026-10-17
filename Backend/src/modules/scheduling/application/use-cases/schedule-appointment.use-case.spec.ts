import { ScheduleAppointmentUseCase } from './schedule-appointment.use-case';
import { AppointmentRepositoryPort } from '../../domain/appointment.repository.port';
import { AvailabilityRepositoryPort } from '../../domain/availability.repository.port';
import { ScheduleBlockRepositoryPort } from '../../domain/schedule-block.repository.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { Appointment } from '../../domain/appointment.aggregate';
import { WeeklyAvailability } from '../../domain/weekly-availability.entity';
import { ScheduleBlock } from '../../domain/schedule-block.entity';
import { AppointmentStatus } from '../../domain/appointment-status.enum';
import {
  AppointmentOverlapConflictException,
  DailyAppointmentsLimitExceededException,
  InvalidTimeSlotError,
  ScheduleBlockConflictException,
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

  async findConflicting(
    clinicId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<Appointment | null> {
    return (
      this.appointments.find((a) => {
        if (a.clinicId !== clinicId) return false;
        if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
        if (a.status === AppointmentStatus.CANCELLED) return false;
        return (
          startTime.getTime() < a.timeSlot.endTime.getTime() &&
          endTime.getTime() > a.timeSlot.startTime.getTime()
        );
      }) || null
    );
  }

  async countDailyActiveAppointments(
    clinicId: string,
    dayStartUtc: Date,
    dayEndUtc: Date,
    excludeAppointmentId?: string,
  ): Promise<number> {
    return this.appointments.filter((a) => {
      if (a.clinicId !== clinicId) return false;
      if (excludeAppointmentId && a.id === excludeAppointmentId) return false;
      if (a.status === AppointmentStatus.CANCELLED) return false;
      const start = a.timeSlot.startTime.getTime();
      return start >= dayStartUtc.getTime() && start <= dayEndUtc.getTime();
    }).length;
  }
}

class FakeAvailabilityRepository implements AvailabilityRepositoryPort {
  private availability: WeeklyAvailability | null = null;

  async save(availability: WeeklyAvailability): Promise<void> {
    this.availability = availability;
  }

  async findByClinicId(clinicId: string): Promise<WeeklyAvailability | null> {
    if (this.availability?.clinicId === clinicId) {
      return this.availability;
    }
    return null;
  }
}

class FakeScheduleBlockRepository implements ScheduleBlockRepositoryPort {
  private blocks: ScheduleBlock[] = [];

  async save(block: ScheduleBlock): Promise<void> {
    this.blocks.push(block);
  }

  async findById(clinicId: string, id: string): Promise<ScheduleBlock | null> {
    return this.blocks.find((b) => b.clinicId === clinicId && b.id === id) || null;
  }

  async findColliding(
    clinicId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<ScheduleBlock | null> {
    return (
      this.blocks.find(
        (b) =>
          b.clinicId === clinicId &&
          startTime.getTime() < b.endDate.getTime() &&
          endTime.getTime() > b.startDate.getTime(),
      ) || null
    );
  }

  async listByClinicId(clinicId: string, fromDate?: Date): Promise<ScheduleBlock[]> {
    return this.blocks.filter((b) => {
      if (b.clinicId !== clinicId) return false;
      if (fromDate && b.endDate.getTime() < fromDate.getTime()) return false;
      return true;
    });
  }
}

describe('ScheduleAppointmentUseCase', () => {
  let useCase: ScheduleAppointmentUseCase;
  let appointmentRepo: FakeAppointmentRepository;
  let availabilityRepo: FakeAvailabilityRepository;
  let scheduleBlockRepo: FakeScheduleBlockRepository;
  let fakeClock: ClockPort;
  let fakeIdGenerator: IdGeneratorPort;

  const fixedNow = new Date('2026-10-20T08:00:00.000Z');
  // 2026-10-20 is Tuesday (day 2). 14:00 UTC = 09:00 Bogota.
  const validStartTime = new Date('2026-10-20T15:00:00.000Z'); // 10:00 Bogota

  beforeEach(async () => {
    appointmentRepo = new FakeAppointmentRepository();
    availabilityRepo = new FakeAvailabilityRepository();
    scheduleBlockRepo = new FakeScheduleBlockRepository();

    fakeClock = {
      now: jest.fn().mockReturnValue(fixedNow),
      todayInBogota: jest.fn().mockReturnValue('2026-10-20'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-20 03:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    fakeIdGenerator = {
      generate: jest.fn().mockReturnValue('appt-uuid-1'),
    };

    const availability = WeeklyAvailability.create({
      clinicId: 'clinic-123',
      slots: [{ dayOfWeek: 2, startTime: '09:00', endTime: '18:00' }],
      maxDailyAppointments: 4,
    });
    await availabilityRepo.save(availability);

    useCase = new ScheduleAppointmentUseCase(
      appointmentRepo,
      availabilityRepo,
      scheduleBlockRepo,
      fakeClock,
      fakeIdGenerator,
    );
  });

  it('should successfully schedule an appointment within availability', async () => {
    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      startTime: validStartTime,
      durationMinutes: 60,
      notes: 'Primera cita',
    });

    expect(result.id).toBe('appt-uuid-1');
    expect(result.status).toBe(AppointmentStatus.SCHEDULED);
    expect(result.patientId).toBe('patient-1');
    expect(result.timeSlot.durationMinutes).toBe(60);
  });

  it('should reject appointment outside configured availability', async () => {
    const earlyStartTime = new Date('2026-10-20T12:00:00.000Z');

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-1',
        procedureId: 'proc-1',
        startTime: earlyStartTime,
        durationMinutes: 60,
      }),
    ).rejects.toThrow(InvalidTimeSlotError);
  });

  it('should reject overlapping appointment with AppointmentOverlapConflictException (409)', async () => {
    await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      startTime: validStartTime,
      durationMinutes: 60,
    });

    const overlappingStartTime = new Date('2026-10-20T15:30:00.000Z');
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-2',
        procedureId: 'proc-2',
        startTime: overlappingStartTime,
        durationMinutes: 60,
      }),
    ).rejects.toThrow(AppointmentOverlapConflictException);
  });

  it('should reject appointment colliding with a schedule block with ScheduleBlockConflictException (409)', async () => {
    const block = ScheduleBlock.create({
      id: 'block-1',
      clinicId: 'clinic-123',
      startDate: new Date('2026-10-20T14:00:00.000Z'),
      endDate: new Date('2026-10-20T17:00:00.000Z'),
      reason: 'Reunión clínica de emergencia',
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });
    await scheduleBlockRepo.save(block);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-1',
        procedureId: 'proc-1',
        startTime: validStartTime,
        durationMinutes: 60,
      }),
    ).rejects.toThrow(ScheduleBlockConflictException);
  });

  it('should reject appointment when daily limit of 4 is exceeded with DailyAppointmentsLimitExceededException (422)', async () => {
    const hours = [14, 15, 16, 17];
    for (let i = 0; i < 4; i++) {
      (fakeIdGenerator.generate as jest.Mock).mockReturnValue(`appt-${i}`);
      await useCase.execute({
        clinicId: 'clinic-123',
        patientId: `patient-${i}`,
        procedureId: 'proc-1',
        startTime: new Date(`2026-10-20T${hours[i]}:00:00.000Z`),
        durationMinutes: 60,
      });
    }

    (fakeIdGenerator.generate as jest.Mock).mockReturnValue('appt-5');
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-5',
        procedureId: 'proc-1',
        startTime: new Date('2026-10-20T19:00:00.000Z'),
        durationMinutes: 60,
      }),
    ).rejects.toThrow(DailyAppointmentsLimitExceededException);
  });
});
