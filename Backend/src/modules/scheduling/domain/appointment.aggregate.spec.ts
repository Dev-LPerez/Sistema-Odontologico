import { Appointment } from './appointment.aggregate';
import { AppointmentStatus } from './appointment-status.enum';
import { TimeSlot } from './time-slot.vo';
import { InvalidAppointmentStatusTransitionException } from './scheduling.errors';
import { AppointmentScheduledEvent } from './appointment-scheduled.event';
import { AppointmentRescheduledEvent } from './appointment-rescheduled.event';
import { AppointmentCancelledEvent } from './appointment-cancelled.event';
import { AppointmentStatusChangedEvent } from './appointment-status-changed.event';

describe('Appointment Aggregate', () => {
  const createBaseAppointment = () => {
    const timeSlot = TimeSlot.create(new Date('2026-10-20T14:00:00.000Z'), 60);
    return Appointment.create({
      id: 'apt-1',
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      procedureId: 'proc-789',
      timeSlot,
      notes: 'Limpieza dental',
    });
  };

  it('should create a valid appointment in SCHEDULED status and record AppointmentScheduledEvent', () => {
    const appointment = createBaseAppointment();

    expect(appointment.id).toBe('apt-1');
    expect(appointment.clinicId).toBe('clinic-123');
    expect(appointment.patientId).toBe('patient-456');
    expect(appointment.procedureId).toBe('proc-789');
    expect(appointment.status).toBe(AppointmentStatus.SCHEDULED);
    expect(appointment.timeSlot.durationMinutes).toBe(60);
    expect(appointment.notes).toBe('Limpieza dental');

    const events = appointment.domainEvents;
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(AppointmentScheduledEvent);
  });

  it('should transition status from SCHEDULED to CONFIRMED and then ATTENDED', () => {
    const appointment = createBaseAppointment();
    appointment.clearDomainEvents();

    appointment.changeStatus(AppointmentStatus.CONFIRMED, new Date());
    expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);

    appointment.changeStatus(AppointmentStatus.ATTENDED, new Date());
    expect(appointment.status).toBe(AppointmentStatus.ATTENDED);

    const events = appointment.domainEvents;
    expect(events.length).toBe(2);
    expect(events[0]).toBeInstanceOf(AppointmentStatusChangedEvent);
    expect(events[1]).toBeInstanceOf(AppointmentStatusChangedEvent);
  });

  it('should transition status from SCHEDULED to NO_SHOW', () => {
    const appointment = createBaseAppointment();
    appointment.clearDomainEvents();

    appointment.changeStatus(AppointmentStatus.NO_SHOW, new Date());
    expect(appointment.status).toBe(AppointmentStatus.NO_SHOW);
  });

  it('should cancel appointment with reason when not terminal', () => {
    const appointment = createBaseAppointment();
    appointment.clearDomainEvents();

    appointment.cancel('Paciente solicitó cancelar por viaje', new Date());
    expect(appointment.status).toBe(AppointmentStatus.CANCELLED);
    expect(appointment.cancellationReason).toBe('Paciente solicitó cancelar por viaje');

    const events = appointment.domainEvents;
    expect(events.some((e) => e instanceof AppointmentCancelledEvent)).toBe(true);
  });

  it('should reject cancel on already terminal appointments (CANCELLED or ATTENDED)', () => {
    const appointment = createBaseAppointment();
    appointment.cancel('Motivo', new Date());

    expect(() => appointment.cancel('Otro motivo', new Date())).toThrow(
      InvalidAppointmentStatusTransitionException,
    );
  });

  it('should reject status transition from CANCELLED to any other status', () => {
    const appointment = createBaseAppointment();
    appointment.cancel('Motivo', new Date());

    expect(() => appointment.changeStatus(AppointmentStatus.CONFIRMED, new Date())).toThrow(
      InvalidAppointmentStatusTransitionException,
    );
    expect(() => appointment.changeStatus(AppointmentStatus.ATTENDED, new Date())).toThrow(
      InvalidAppointmentStatusTransitionException,
    );
  });

  it('should reschedule appointment when in SCHEDULED or CONFIRMED status', () => {
    const appointment = createBaseAppointment();
    appointment.clearDomainEvents();

    const newTimeSlot = TimeSlot.create(new Date('2026-10-21T15:00:00.000Z'), 45);
    appointment.reschedule(newTimeSlot, new Date());

    expect(appointment.timeSlot.startTime).toEqual(new Date('2026-10-21T15:00:00.000Z'));
    expect(appointment.timeSlot.durationMinutes).toBe(45);

    const events = appointment.domainEvents;
    expect(events.some((e) => e instanceof AppointmentRescheduledEvent)).toBe(true);
  });

  it('should reject reschedule on terminal appointment', () => {
    const appointment = createBaseAppointment();
    appointment.cancel('Motivo', new Date());

    const newTimeSlot = TimeSlot.create(new Date('2026-10-21T15:00:00.000Z'), 45);
    expect(() => appointment.reschedule(newTimeSlot, new Date())).toThrow(
      InvalidAppointmentStatusTransitionException,
    );
  });

  it('should no-op when changing status to current status', () => {
    const appointment = createBaseAppointment();
    appointment.clearDomainEvents();
    appointment.changeStatus(AppointmentStatus.SCHEDULED, new Date());
    expect(appointment.domainEvents).toHaveLength(0);
  });

  it('should reject changeStatus to CANCELLED and require cancel method instead', () => {
    const appointment = createBaseAppointment();
    expect(() => appointment.changeStatus(AppointmentStatus.CANCELLED, new Date())).toThrow(
      InvalidAppointmentStatusTransitionException,
    );
  });

  it('should reject reschedule with null or undefined time slot', () => {
    const appointment = createBaseAppointment();
    expect(() => appointment.reschedule(null as unknown as TimeSlot, new Date())).toThrow();
  });

  it('should validate all mandatory properties on create', () => {
    const validSlot = TimeSlot.create(new Date('2026-10-20T14:00:00.000Z'), 60);
    expect(() =>
      Appointment.create({
        id: '',
        clinicId: 'c-1',
        patientId: 'p-1',
        procedureId: 'proc-1',
        timeSlot: validSlot,
      }),
    ).toThrow();
    expect(() =>
      Appointment.create({
        id: 'a-1',
        clinicId: '',
        patientId: 'p-1',
        procedureId: 'proc-1',
        timeSlot: validSlot,
      }),
    ).toThrow();
    expect(() =>
      Appointment.create({
        id: 'a-1',
        clinicId: 'c-1',
        patientId: '',
        procedureId: 'proc-1',
        timeSlot: validSlot,
      }),
    ).toThrow();
    expect(() =>
      Appointment.create({
        id: 'a-1',
        clinicId: 'c-1',
        patientId: 'p-1',
        procedureId: '',
        timeSlot: validSlot,
      }),
    ).toThrow();
    expect(() =>
      Appointment.create({
        id: 'a-1',
        clinicId: 'c-1',
        patientId: 'p-1',
        procedureId: 'proc-1',
        timeSlot: null as unknown as TimeSlot,
      }),
    ).toThrow();
  });
});
