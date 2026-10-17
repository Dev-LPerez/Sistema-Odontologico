import { SchedulingController } from './scheduling.controller';
import { ConfigureAvailabilityUseCase } from '../application/use-cases/configure-availability.use-case';
import { GetAvailabilityQuery } from '../application/queries/get-availability.query';
import { CreateScheduleBlockUseCase } from '../application/use-cases/create-schedule-block.use-case';
import { ListScheduleBlocksQuery } from '../application/queries/list-schedule-blocks.query';
import { ScheduleAppointmentUseCase } from '../application/use-cases/schedule-appointment.use-case';
import { RescheduleAppointmentUseCase } from '../application/use-cases/reschedule-appointment.use-case';
import { CancelAppointmentUseCase } from '../application/use-cases/cancel-appointment.use-case';
import { ChangeAppointmentStatusUseCase } from '../application/use-cases/change-appointment-status.use-case';
import { GetAppointmentByIdQuery } from '../application/queries/get-appointment-by-id.query';
import { ListAppointmentsQuery } from '../application/queries/list-appointments.query';
import { WeeklyAvailability } from '../domain/weekly-availability.entity';
import { ScheduleBlock } from '../domain/schedule-block.entity';
import { Appointment } from '../domain/appointment.aggregate';
import { TimeSlot } from '../domain/time-slot.vo';
import { AppointmentStatus } from '../domain/appointment-status.enum';
import { AppointmentNotFoundError } from '../domain/scheduling.errors';

describe('SchedulingController', () => {
  let controller: SchedulingController;
  let configureAvailabilityUseCase: jest.Mocked<ConfigureAvailabilityUseCase>;
  let getAvailabilityQuery: jest.Mocked<GetAvailabilityQuery>;
  let createScheduleBlockUseCase: jest.Mocked<CreateScheduleBlockUseCase>;
  let listScheduleBlocksQuery: jest.Mocked<ListScheduleBlocksQuery>;
  let scheduleAppointmentUseCase: jest.Mocked<ScheduleAppointmentUseCase>;
  let rescheduleAppointmentUseCase: jest.Mocked<RescheduleAppointmentUseCase>;
  let cancelAppointmentUseCase: jest.Mocked<CancelAppointmentUseCase>;
  let changeAppointmentStatusUseCase: jest.Mocked<ChangeAppointmentStatusUseCase>;
  let getAppointmentByIdQuery: jest.Mocked<GetAppointmentByIdQuery>;
  let listAppointmentsQuery: jest.Mocked<ListAppointmentsQuery>;

  const clinicId = 'clinic-123';
  const fixedNow = new Date('2026-10-20T10:00:00.000Z');

  const sampleAvailability = WeeklyAvailability.create({
    clinicId,
    slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }],
    maxDailyAppointments: 4,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });

  const sampleBlock = ScheduleBlock.create({
    id: 'block-1',
    clinicId,
    startDate: new Date('2026-12-20T00:00:00.000Z'),
    endDate: new Date('2026-12-25T23:59:59.000Z'),
    reason: 'Vacaciones',
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });

  const sampleAppointment = Appointment.create({
    id: 'appt-1',
    clinicId,
    patientId: 'patient-1',
    procedureId: 'proc-1',
    timeSlot: TimeSlot.create(new Date('2026-10-20T14:00:00.000Z'), 60),
    notes: 'Nota clínica',
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });

  beforeEach(() => {
    configureAvailabilityUseCase = {
      execute: jest.fn().mockResolvedValue(sampleAvailability),
    } as unknown as jest.Mocked<ConfigureAvailabilityUseCase>;

    getAvailabilityQuery = {
      execute: jest.fn().mockResolvedValue(sampleAvailability),
    } as unknown as jest.Mocked<GetAvailabilityQuery>;

    createScheduleBlockUseCase = {
      execute: jest.fn().mockResolvedValue(sampleBlock),
    } as unknown as jest.Mocked<CreateScheduleBlockUseCase>;

    listScheduleBlocksQuery = {
      execute: jest.fn().mockResolvedValue([sampleBlock]),
    } as unknown as jest.Mocked<ListScheduleBlocksQuery>;

    scheduleAppointmentUseCase = {
      execute: jest.fn().mockResolvedValue(sampleAppointment),
    } as unknown as jest.Mocked<ScheduleAppointmentUseCase>;

    rescheduleAppointmentUseCase = {
      execute: jest.fn().mockResolvedValue(sampleAppointment),
    } as unknown as jest.Mocked<RescheduleAppointmentUseCase>;

    cancelAppointmentUseCase = {
      execute: jest.fn().mockResolvedValue(sampleAppointment),
    } as unknown as jest.Mocked<CancelAppointmentUseCase>;

    changeAppointmentStatusUseCase = {
      execute: jest.fn().mockResolvedValue(sampleAppointment),
    } as unknown as jest.Mocked<ChangeAppointmentStatusUseCase>;

    getAppointmentByIdQuery = {
      execute: jest.fn().mockResolvedValue({
        id: 'appt-1',
        clinicId,
        patientId: 'patient-1',
        procedureId: 'proc-1',
        startTime: new Date('2026-10-20T14:00:00.000Z'),
        endTime: new Date('2026-10-20T15:00:00.000Z'),
        durationMinutes: 60,
        status: AppointmentStatus.SCHEDULED,
        cancellationReason: null,
        notes: 'Nota clínica',
        createdAt: fixedNow,
        updatedAt: fixedNow,
      }),
    } as unknown as jest.Mocked<GetAppointmentByIdQuery>;

    listAppointmentsQuery = {
      execute: jest.fn().mockResolvedValue([
        {
          id: 'appt-1',
          clinicId,
          patientId: 'patient-1',
          procedureId: 'proc-1',
          startTime: new Date('2026-10-20T14:00:00.000Z'),
          endTime: new Date('2026-10-20T15:00:00.000Z'),
          durationMinutes: 60,
          status: AppointmentStatus.SCHEDULED,
          cancellationReason: null,
          notes: 'Nota clínica',
          createdAt: fixedNow,
          updatedAt: fixedNow,
        },
      ]),
    } as unknown as jest.Mocked<ListAppointmentsQuery>;

    controller = new SchedulingController(
      configureAvailabilityUseCase,
      getAvailabilityQuery,
      createScheduleBlockUseCase,
      listScheduleBlocksQuery,
      scheduleAppointmentUseCase,
      rescheduleAppointmentUseCase,
      cancelAppointmentUseCase,
      changeAppointmentStatusUseCase,
      getAppointmentByIdQuery,
      listAppointmentsQuery,
    );
  });

  it('should configure availability', async () => {
    const res = await controller.configureAvailability(clinicId, {
      slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }],
      maxDailyAppointments: 4,
    });
    expect(res.clinicId).toBe(clinicId);
    expect(res.maxDailyAppointments).toBe(4);
  });

  it('should get availability when configured', async () => {
    const res = await controller.getAvailability(clinicId);
    expect(res).not.toBeNull();
    expect(res?.clinicId).toBe(clinicId);
  });

  it('should return null when availability is not configured', async () => {
    getAvailabilityQuery.execute.mockResolvedValueOnce(null);
    const res = await controller.getAvailability(clinicId);
    expect(res).toBeNull();
  });

  it('should create schedule block', async () => {
    const res = await controller.createScheduleBlock(clinicId, {
      startDate: '2026-12-20T00:00:00.000Z',
      endDate: '2026-12-25T23:59:59.000Z',
      reason: 'Vacaciones',
    });
    expect(res.id).toBe('block-1');
    expect(res.reason).toBe('Vacaciones');
  });

  it('should list schedule blocks', async () => {
    const res = await controller.listScheduleBlocks(clinicId, {});
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('block-1');
  });

  it('should schedule appointment', async () => {
    const res = await controller.scheduleAppointment(clinicId, {
      patientId: 'patient-1',
      procedureId: 'proc-1',
      startTime: '2026-10-20T14:00:00.000Z',
      durationMinutes: 60,
      notes: 'Nota',
    });
    expect(res.id).toBe('appt-1');
    expect(res.patientId).toBe('patient-1');
  });

  it('should list appointments with filter', async () => {
    const res = await controller.listAppointments(clinicId, {
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-31T23:59:59.000Z',
      patientId: 'patient-1',
      status: AppointmentStatus.SCHEDULED,
    });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('appt-1');
  });

  it('should get appointment by id', async () => {
    const res = await controller.getAppointmentById(clinicId, 'appt-1');
    expect(res.id).toBe('appt-1');
  });

  it('should throw AppointmentNotFoundError when appointment by id does not exist', async () => {
    getAppointmentByIdQuery.execute.mockResolvedValueOnce(null);
    await expect(controller.getAppointmentById(clinicId, 'non-existent')).rejects.toThrow(
      AppointmentNotFoundError,
    );
  });

  it('should reschedule appointment', async () => {
    const res = await controller.rescheduleAppointment(clinicId, 'appt-1', {
      newStartTime: '2026-10-21T14:00:00.000Z',
      newDurationMinutes: 60,
    });
    expect(res.id).toBe('appt-1');
  });

  it('should cancel appointment', async () => {
    const res = await controller.cancelAppointment(clinicId, 'appt-1', {
      cancellationReason: 'Motivo de cancelación',
    });
    expect(res.id).toBe('appt-1');
  });

  it('should change appointment status', async () => {
    const res = await controller.changeAppointmentStatus(clinicId, 'appt-1', {
      status: AppointmentStatus.CONFIRMED,
    });
    expect(res.id).toBe('appt-1');
  });
});
