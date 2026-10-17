import { RescheduleAppointmentUseCase } from './reschedule-appointment.use-case';
import { AppointmentRepositoryPort } from '../../domain/appointment.repository.port';
import { AvailabilityRepositoryPort } from '../../domain/availability.repository.port';
import { ScheduleBlockRepositoryPort } from '../../domain/schedule-block.repository.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { Appointment } from '../../domain/appointment.aggregate';
import { TimeSlot } from '../../domain/time-slot.vo';
import { WeeklyAvailability } from '../../domain/weekly-availability.entity';
import { ScheduleBlock } from '../../domain/schedule-block.entity';
import { AppointmentStatus } from '../../domain/appointment-status.enum';
import {
  AppointmentNotFoundError,
  AppointmentOverlapConflictException,
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

describe('RescheduleAppointmentUseCase', () => {
  let useCase: RescheduleAppointmentUseCase;
  let appointmentRepo: FakeAppointmentRepository;
  let availabilityRepo: FakeAvailabilityRepository;
  let scheduleBlockRepo: FakeScheduleBlockRepository;
  let fakeClock: ClockPort;

  const fixedNow = new Date('2026-10-20T08:00:00.000Z');
  const slot1 = new Date('2026-10-20T14:00:00.000Z'); // 09:00 Bogota
  const slot2 = new Date('2026-10-20T16:00:00.000Z'); // 11:00 Bogota

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

    const availability = WeeklyAvailability.create({
      clinicId: 'clinic-123',
      slots: [{ dayOfWeek: 2, startTime: '09:00', endTime: '18:00' }],
      maxDailyAppointments: 4,
    });
    await availabilityRepo.save(availability);

    useCase = new RescheduleAppointmentUseCase(
      appointmentRepo,
      availabilityRepo,
      scheduleBlockRepo,
      fakeClock,
    );
  });

  it('should reschedule appointment successfully to available time slot', async () => {
    const appointment = Appointment.create({
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      timeSlot: TimeSlot.create(slot1, 60),
    });
    await appointmentRepo.save(appointment);

    const rescheduled = await useCase.execute({
      clinicId: 'clinic-123',
      appointmentId: 'appt-1',
      newStartTime: slot2,
      newDurationMinutes: 60,
    });

    expect(rescheduled.timeSlot.startTime).toEqual(slot2);
    expect(rescheduled.updatedAt).toEqual(fixedNow);
  });

  it('should throw AppointmentNotFoundError when appointment does not exist', async () => {
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        appointmentId: 'non-existent',
        newStartTime: slot2,
      }),
    ).rejects.toThrow(AppointmentNotFoundError);
  });

  it('should reject reschedule when colliding with another active appointment', async () => {
    const appointment1 = Appointment.create({
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      timeSlot: TimeSlot.create(slot1, 60),
    });
    const appointment2 = Appointment.create({
      id: 'appt-2',
      clinicId: 'clinic-123',
      patientId: 'patient-2',
      procedureId: 'proc-1',
      timeSlot: TimeSlot.create(slot2, 60),
    });
    await appointmentRepo.save(appointment1);
    await appointmentRepo.save(appointment2);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        appointmentId: 'appt-1',
        newStartTime: slot2,
      }),
    ).rejects.toThrow(AppointmentOverlapConflictException);
  });

  it('should reject rescheduling a cancelled appointment', async () => {
    const appointment = Appointment.create({
      id: 'appt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      timeSlot: TimeSlot.create(slot1, 60),
    });
    appointment.cancel('Paciente canceló', fixedNow);
    await appointmentRepo.save(appointment);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        appointmentId: 'appt-1',
        newStartTime: slot2,
      }),
    ).rejects.toThrow(InvalidAppointmentStatusTransitionException);
  });
});
