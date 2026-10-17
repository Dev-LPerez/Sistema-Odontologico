import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { CLINIC_REPOSITORY_PORT } from '../src/modules/identity/domain/clinic.repository.port';
import { USER_REPOSITORY_PORT } from '../src/modules/identity/domain/user.repository.port';
import { REFRESH_SESSION_REPOSITORY_PORT } from '../src/modules/identity/domain/refresh-session.repository.port';
import { PATIENT_REPOSITORY_TOKEN } from '../src/modules/patients/domain/patient.repository.port';
import { PATIENT_QUERIES_TOKEN } from '../src/modules/patients/application/ports/patient.queries.port';
import { PROCEDURE_REPOSITORY_PORT } from '../src/modules/catalogs';
import { UNIT_OF_WORK_PORT } from '../src/shared/application/ports/unit-of-work.port';
import { InMemoryClinicRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-clinic.repository';
import { InMemoryUserRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-user.repository';
import { InMemoryRefreshSessionRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-refresh-session.repository';
import { InMemoryPatientRepository } from '../src/modules/patients/infrastructure/repositories/in-memory-patient.repository';
import { InMemoryPatientQueriesAdapter } from '../src/modules/patients/infrastructure/queries/in-memory-patient.queries';
import { InMemoryProcedureRepository } from '../src/modules/catalogs/infrastructure/repositories/in-memory-procedure.repository';
import {
  AVAILABILITY_REPOSITORY,
  SCHEDULE_BLOCK_REPOSITORY,
  APPOINTMENT_REPOSITORY,
  APPOINTMENT_QUERIES,
  AppointmentStatus,
} from '../src/modules/scheduling';
import { InMemoryAvailabilityRepository } from '../src/modules/scheduling/infrastructure/repositories/in-memory-availability.repository';
import { InMemoryScheduleBlockRepository } from '../src/modules/scheduling/infrastructure/repositories/in-memory-schedule-block.repository';
import { InMemoryAppointmentRepository } from '../src/modules/scheduling/infrastructure/repositories/in-memory-appointment.repository';
import { InMemoryAppointmentQueries } from '../src/modules/scheduling/infrastructure/queries/in-memory-appointment.queries';
import {
  PasswordHasherPort,
  PASSWORD_HASHER_PORT,
} from '../src/modules/identity/application/ports/password-hasher.port';
import { Clinic } from '../src/modules/identity/domain/clinic.entity';
import { User } from '../src/modules/identity/domain/user.entity';
import { Email } from '../src/modules/identity/domain/email.vo';
import { UserRole } from '../src/modules/identity/domain/role.enum';
import { Patient } from '../src/modules/patients/domain/patient.entity';
import { DocumentIdentity } from '../src/modules/patients/domain/document-identity.vo';
import { PhoneNumber } from '../src/modules/patients/domain/phone-number.vo';
import { DocumentType } from '../src/modules/patients/domain/document-type.enum';
import { AcquisitionSource } from '../src/modules/patients/domain/acquisition-source.enum';
import { Procedure } from '../src/modules/catalogs/domain/procedure.entity';
import { Money } from '../src/modules/catalogs/domain/money.vo';

describe('Scheduling Management (e2e) (RF-B-060, RF-B-061, RF-B-063, RF-B-065, RC-005, RC-054)', () => {
  let app: INestApplication;
  let clinicRepo: InMemoryClinicRepository;
  let userRepo: InMemoryUserRepository;
  let refreshSessionRepo: InMemoryRefreshSessionRepository;
  let patientRepo: InMemoryPatientRepository;
  let patientQueriesAdapter: InMemoryPatientQueriesAdapter;
  let procedureRepo: InMemoryProcedureRepository;
  let availabilityRepo: InMemoryAvailabilityRepository;
  let scheduleBlockRepo: InMemoryScheduleBlockRepository;
  let appointmentRepo: InMemoryAppointmentRepository;
  let appointmentQueries: InMemoryAppointmentQueries;
  let passwordHasher: PasswordHasherPort;

  const testClinicId = 'a1111111-1111-4111-8111-111111111111';
  const adminId = 'b2222222-2222-4222-8222-222222222222';
  const auxiliaryId = 'c3333333-3333-4333-8333-333333333333';
  const testPatientId = 'd4444444-4444-4444-8444-444444444444';
  const testProcedureId = 'e5555555-5555-4555-8555-555555555555';
  const rawPassword = 'Password123!';

  let adminAccessToken: string;
  let auxiliaryAccessToken: string;

  beforeAll(async () => {
    clinicRepo = new InMemoryClinicRepository();
    userRepo = new InMemoryUserRepository();
    refreshSessionRepo = new InMemoryRefreshSessionRepository();
    patientRepo = new InMemoryPatientRepository();
    patientQueriesAdapter = new InMemoryPatientQueriesAdapter(patientRepo);
    procedureRepo = new InMemoryProcedureRepository();
    availabilityRepo = new InMemoryAvailabilityRepository();
    scheduleBlockRepo = new InMemoryScheduleBlockRepository();
    appointmentRepo = new InMemoryAppointmentRepository();
    appointmentQueries = new InMemoryAppointmentQueries(appointmentRepo);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CLINIC_REPOSITORY_PORT)
      .useValue(clinicRepo)
      .overrideProvider(USER_REPOSITORY_PORT)
      .useValue(userRepo)
      .overrideProvider(REFRESH_SESSION_REPOSITORY_PORT)
      .useValue(refreshSessionRepo)
      .overrideProvider(PATIENT_REPOSITORY_TOKEN)
      .useValue(patientRepo)
      .overrideProvider(PATIENT_QUERIES_TOKEN)
      .useValue(patientQueriesAdapter)
      .overrideProvider(PROCEDURE_REPOSITORY_PORT)
      .useValue(procedureRepo)
      .overrideProvider(AVAILABILITY_REPOSITORY)
      .useValue(availabilityRepo)
      .overrideProvider(SCHEDULE_BLOCK_REPOSITORY)
      .useValue(scheduleBlockRepo)
      .overrideProvider(APPOINTMENT_REPOSITORY)
      .useValue(appointmentRepo)
      .overrideProvider(APPOINTMENT_QUERIES)
      .useValue(appointmentQueries)
      .overrideProvider(UNIT_OF_WORK_PORT)
      .useValue({
        execute: async <T>(work: () => Promise<T>): Promise<T> => work(),
      })
      .compile();

    passwordHasher = moduleFixture.get<PasswordHasherPort>(PASSWORD_HASHER_PORT);

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const now = new Date('2026-10-15T10:00:00.000Z');
    await clinicRepo.save(
      Clinic.create({
        id: testClinicId,
        name: 'Consultorio Dra. Angelee Pacheco',
        createdAt: now,
        updatedAt: now,
      }),
    );

    const hashedPwd = await passwordHasher.hash(rawPassword);
    await userRepo.save(
      User.create({
        id: adminId,
        clinicId: testClinicId,
        email: Email.create('admin.sched@clinica.com'),
        passwordHash: hashedPwd,
        fullName: 'Dra. Angelee Pacheco',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    await userRepo.save(
      User.create({
        id: auxiliaryId,
        clinicId: testClinicId,
        email: Email.create('aux.sched@clinica.com'),
        passwordHash: hashedPwd,
        fullName: 'Carlos Auxiliar',
        role: UserRole.AUXILIARY,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    await patientRepo.save(
      Patient.create({
        id: testPatientId,
        clinicId: testClinicId,
        firstName: 'Juan',
        lastName: 'Pérez',
        document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
        birthDate: new Date('1990-05-15T00:00:00.000Z'),
        phone: PhoneNumber.create('3001234567'),
        acquisitionSource: AcquisitionSource.INSTAGRAM,
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: now,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    await procedureRepo.save(
      Procedure.create({
        id: testProcedureId,
        clinicId: testClinicId,
        code: 'PROC-001',
        name: 'Profilaxis Dental',
        basePrice: Money.from(80000),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    // Login Admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin.sched@clinica.com', password: rawPassword })
      .expect(200);
    adminAccessToken = adminLoginRes.body.accessToken;

    // Login Auxiliary
    const auxLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'aux.sched@clinica.com', password: rawPassword })
      .expect(200);
    auxiliaryAccessToken = auxLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Availability & Schedule Blocks', () => {
    it('should configure weekly availability as ADMIN and allow AUXILIARY to view it', async () => {
      // 1..5 Monday to Friday from 09:00 to 18:00
      const slots = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        dayOfWeek,
        startTime: '09:00',
        endTime: '18:00',
      }));

      const putRes = await request(app.getHttpServer())
        .put('/v1/scheduling/availability')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          slots,
          maxDailyAppointments: 4,
        })
        .expect(200);

      expect(putRes.body.clinicId).toBe(testClinicId);
      expect(putRes.body.maxDailyAppointments).toBe(4);
      expect(putRes.body.slots).toHaveLength(5);

      const getRes = await request(app.getHttpServer())
        .get('/v1/scheduling/availability')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .expect(200);

      expect(getRes.body.clinicId).toBe(testClinicId);
      expect(getRes.body.slots).toHaveLength(5);
    });

    it('should reject availability with start time before 09:00 or invalid max appointments', async () => {
      // Start time before 09:00
      await request(app.getHttpServer())
        .put('/v1/scheduling/availability')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          slots: [{ dayOfWeek: 1, startTime: '08:00', endTime: '18:00' }],
          maxDailyAppointments: 4,
        })
        .expect(400);

      // Max appointments out of range
      await request(app.getHttpServer())
        .put('/v1/scheduling/availability')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }],
          maxDailyAppointments: 20,
        })
        .expect(400);
    });

    it('should reject AUXILIARY attempt to configure availability with 403 FORBIDDEN', async () => {
      await request(app.getHttpServer())
        .put('/v1/scheduling/availability')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          slots: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }],
          maxDailyAppointments: 4,
        })
        .expect(403);
    });

    it('should allow ADMIN to register schedule block and AUXILIARY to list blocks', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/scheduling/blocks')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          startDate: '2026-12-20T00:00:00.000Z',
          endDate: '2026-12-25T23:59:59.000Z',
          reason: 'Vacaciones de fin de año',
        })
        .expect(201);

      expect(createRes.body.id).toBeDefined();
      expect(createRes.body.reason).toBe('Vacaciones de fin de año');

      const listRes = await request(app.getHttpServer())
        .get('/v1/scheduling/blocks')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .expect(200);

      expect(listRes.body).toBeInstanceOf(Array);
      expect(listRes.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Appointments Lifecycle', () => {
    let createdAppointmentId: string;
    // 2026-10-20 is Tuesday (day 2).
    // 15:00 UTC = 10:00 Bogota.
    const appointmentDateIso = '2026-10-20T15:00:00.000Z';

    it('should create scheduled appointment within availability slot', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/scheduling/appointments')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: testProcedureId,
          startTime: appointmentDateIso,
          durationMinutes: 60,
          notes: 'Cita de valoración inicial',
        })
        .expect(201);

      createdAppointmentId = res.body.id;
      expect(createdAppointmentId).toBeDefined();
      expect(res.body.status).toBe(AppointmentStatus.SCHEDULED);
      expect(res.body.patientId).toBe(testPatientId);
      expect(res.body.procedureId).toBe(testProcedureId);
    });

    it('should reject overlapping appointment with 409 CONFLICT', async () => {
      // Overlaps 15:00 - 16:00 with 15:30 - 16:30
      const overlapStart = '2026-10-20T15:30:00.000Z';

      const res = await request(app.getHttpServer())
        .post('/v1/scheduling/appointments')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: testProcedureId,
          startTime: overlapStart,
          durationMinutes: 60,
        })
        .expect(409);

      expect(res.body.errorCode).toBe('APPOINTMENT_OVERLAP_CONFLICT');
    });

    it('should reject appointment exceeding daily max limit with 422 UNPROCESSABLE', async () => {
      // Appointment 1 already exists at 15:00-16:00 UTC (10:00 Bogota)
      // Add appointment 2: 16:00-17:00 UTC
      await request(app.getHttpServer())
        .post('/v1/scheduling/appointments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: testProcedureId,
          startTime: '2026-10-20T16:00:00.000Z',
          durationMinutes: 60,
        })
        .expect(201);

      // Add appointment 3: 17:00-18:00 UTC
      await request(app.getHttpServer())
        .post('/v1/scheduling/appointments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: testProcedureId,
          startTime: '2026-10-20T17:00:00.000Z',
          durationMinutes: 60,
        })
        .expect(201);

      // Add appointment 4: 18:00-19:00 UTC (total = 4 = maxDailyAppointments)
      await request(app.getHttpServer())
        .post('/v1/scheduling/appointments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: testProcedureId,
          startTime: '2026-10-20T18:00:00.000Z',
          durationMinutes: 60,
        })
        .expect(201);

      // Attempt appointment 5 on the same day: 19:00-20:00 UTC
      const res = await request(app.getHttpServer())
        .post('/v1/scheduling/appointments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: testProcedureId,
          startTime: '2026-10-20T19:00:00.000Z',
          durationMinutes: 60,
        })
        .expect(422);

      expect(res.body.errorCode).toBe('DAILY_APPOINTMENTS_LIMIT_EXCEEDED');
    });

    it('should reject appointment colliding with schedule block with 409 CONFLICT', async () => {
      // Create a block for Friday 2026-10-23
      await request(app.getHttpServer())
        .post('/v1/scheduling/blocks')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          startDate: '2026-10-23T00:00:00.000Z',
          endDate: '2026-10-23T23:59:59.000Z',
          reason: 'Día de congreso odontológico',
        })
        .expect(201);

      // Attempt appointment on that Friday
      const res = await request(app.getHttpServer())
        .post('/v1/scheduling/appointments')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: testProcedureId,
          startTime: '2026-10-23T15:00:00.000Z',
          durationMinutes: 60,
        })
        .expect(409);

      expect(res.body.errorCode).toBe('SCHEDULE_BLOCK_CONFLICT');
    });

    it('should reschedule appointment to available time slot successfully', async () => {
      // Wednesday 2026-10-21 at 15:00 UTC
      const newSlot = '2026-10-21T15:00:00.000Z';

      const res = await request(app.getHttpServer())
        .patch(`/v1/scheduling/appointments/${createdAppointmentId}/reschedule`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          newStartTime: newSlot,
          newDurationMinutes: 60,
        })
        .expect(200);

      expect(res.body.id).toBe(createdAppointmentId);
      expect(res.body.startTime).toBe(newSlot);
    });

    it('should transition appointment status through SCHEDULED, CONFIRMED and ATTENDED', async () => {
      // Transition to CONFIRMED
      const confirmedRes = await request(app.getHttpServer())
        .patch(`/v1/scheduling/appointments/${createdAppointmentId}/status`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ status: AppointmentStatus.CONFIRMED })
        .expect(200);

      expect(confirmedRes.body.status).toBe(AppointmentStatus.CONFIRMED);

      // Transition to ATTENDED
      const attendedRes = await request(app.getHttpServer())
        .patch(`/v1/scheduling/appointments/${createdAppointmentId}/status`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ status: AppointmentStatus.ATTENDED })
        .expect(200);

      expect(attendedRes.body.status).toBe(AppointmentStatus.ATTENDED);
    });

    it('should cancel appointment when valid cancellation reason is provided', async () => {
      // Create a fresh appointment for cancellation test on Thursday 2026-10-22
      const apptToCancel = await request(app.getHttpServer())
        .post('/v1/scheduling/appointments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: testProcedureId,
          startTime: '2026-10-22T15:00:00.000Z',
          durationMinutes: 60,
        })
        .expect(201);

      const cancelRes = await request(app.getHttpServer())
        .patch(`/v1/scheduling/appointments/${apptToCancel.body.id}/cancel`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          cancellationReason: 'Paciente solicitó cancelar por viaje',
        })
        .expect(200);

      expect(cancelRes.body.status).toBe(AppointmentStatus.CANCELLED);
      expect(cancelRes.body.cancellationReason).toBe('Paciente solicitó cancelar por viaje');
    });

    it('should reject invalid status transition on cancelled appointment with 400', async () => {
      // Create and cancel an appointment
      const appt = await request(app.getHttpServer())
        .post('/v1/scheduling/appointments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: testProcedureId,
          startTime: '2026-10-22T17:00:00.000Z',
          durationMinutes: 60,
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/v1/scheduling/appointments/${appt.body.id}/cancel`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ cancellationReason: 'Cancelada por paciente' })
        .expect(200);

      // Attempt to transition to ATTENDED from CANCELLED
      const res = await request(app.getHttpServer())
        .patch(`/v1/scheduling/appointments/${appt.body.id}/status`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ status: AppointmentStatus.ATTENDED })
        .expect(400);

      expect(res.body.errorCode).toBe('INVALID_APPOINTMENT_STATUS_TRANSITION');
    });
  });
});
