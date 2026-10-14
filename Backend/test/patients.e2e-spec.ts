import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/presentation/filters/domain-exception.filter';
import { CLINIC_REPOSITORY_PORT } from '../src/modules/identity/domain/clinic.repository.port';
import { USER_REPOSITORY_PORT } from '../src/modules/identity/domain/user.repository.port';
import { REFRESH_SESSION_REPOSITORY_PORT } from '../src/modules/identity/domain/refresh-session.repository.port';
import { PATIENT_REPOSITORY_TOKEN } from '../src/modules/patients/domain/patient.repository.port';
import { UNIT_OF_WORK_PORT } from '../src/shared/application/ports/unit-of-work.port';
import { InMemoryClinicRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-clinic.repository';
import { InMemoryUserRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-user.repository';
import { InMemoryRefreshSessionRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-refresh-session.repository';
import { InMemoryPatientRepository } from '../src/modules/patients/infrastructure/repositories/in-memory-patient.repository';
import {
  PasswordHasherPort,
  PASSWORD_HASHER_PORT,
} from '../src/modules/identity/application/ports/password-hasher.port';
import { Clinic } from '../src/modules/identity/domain/clinic.entity';
import { User } from '../src/modules/identity/domain/user.entity';
import { Email } from '../src/modules/identity/domain/email.vo';
import { UserRole } from '../src/modules/identity/domain/role.enum';
import { DocumentType } from '../src/modules/patients/domain/document-type.enum';
import { AcquisitionSource } from '../src/modules/patients/domain/acquisition-source.enum';

describe('Patients Management (e2e) (RF-B-010, RF-B-011, RF-B-013, RF-B-014, RC-005)', () => {
  let app: INestApplication;
  let clinicRepo: InMemoryClinicRepository;
  let userRepo: InMemoryUserRepository;
  let refreshSessionRepo: InMemoryRefreshSessionRepository;
  let patientRepo: InMemoryPatientRepository;
  let passwordHasher: PasswordHasherPort;

  const testClinicId = 'clinic-uuid-mgmt-001';
  const otherClinicId = 'clinic-uuid-other-002';
  const adminId = 'user-uuid-admin-mgmt-001';
  const auxiliaryId = 'user-uuid-aux-mgmt-002';
  const rawPassword = 'Password123!';

  let adminAccessToken: string;
  let auxiliaryAccessToken: string;
  let createdPatientId: string;

  beforeAll(async () => {
    clinicRepo = new InMemoryClinicRepository();
    userRepo = new InMemoryUserRepository();
    refreshSessionRepo = new InMemoryRefreshSessionRepository();
    patientRepo = new InMemoryPatientRepository();

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
      .overrideProvider(UNIT_OF_WORK_PORT)
      .useValue({
        execute: async <T>(work: () => Promise<T>): Promise<T> => work(),
      })
      .compile();

    passwordHasher = moduleFixture.get<PasswordHasherPort>(PASSWORD_HASHER_PORT);

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('v1', { exclude: ['health', 'ready'] });
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const now = new Date('2026-10-14T10:00:00.000Z');
    await clinicRepo.save(
      Clinic.create({
        id: testClinicId,
        name: 'Consultorio Dra. Angelee Pacheco',
        createdAt: now,
        updatedAt: now,
      }),
    );
    await clinicRepo.save(
      Clinic.create({
        id: otherClinicId,
        name: 'Otra Clínica Odontológica',
        createdAt: now,
        updatedAt: now,
      }),
    );

    const hashedPwd = await passwordHasher.hash(rawPassword);
    await userRepo.save(
      User.create({
        id: adminId,
        clinicId: testClinicId,
        email: Email.create('admin.patients@clinica.com'),
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
        email: Email.create('auxiliar.patients@clinica.com'),
        passwordHash: hashedPwd,
        fullName: 'Carlos Auxiliar',
        role: UserRole.AUXILIARY,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const adminLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin.patients@clinica.com', password: rawPassword })
      .expect(200);
    adminAccessToken = adminLoginRes.body.accessToken;

    const auxLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'auxiliar.patients@clinica.com', password: rawPassword })
      .expect(200);
    auxiliaryAccessToken = auxLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // Scenario: Rechazo de creación de paciente cuando no se otorga el consentimiento Ley 1581
  it('debe rechazar con 422 DATA_TREATMENT_CONSENT_REQUIRED cuando dataTreatmentConsent es false', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/patients')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        firstName: 'Sin',
        lastName: 'Consentimiento',
        documentType: DocumentType.CC,
        documentNumber: '999888777',
        birthDate: '1995-01-01',
        phone: '3001112233',
        dataTreatmentConsent: false,
      })
      .expect(422);

    expect(res.body.errorCode).toBe('DATA_TREATMENT_CONSENT_REQUIRED');
  });

  // Scenario: Registro exitoso de paciente con consentimiento Ley 1581 por doctora o auxiliar
  it('debe permitir a ADMIN y AUXILIARY registrar un paciente con consentimiento Ley 1581 (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/patients')
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({
        firstName: 'Laura',
        lastName: 'Martínez',
        documentType: DocumentType.CC,
        documentNumber: '1020304050',
        birthDate: '1992-06-20',
        phone: '3001234567',
        email: 'laura@example.com',
        address: 'Calle 10 # 20-30',
        emergencyContactName: 'Pedro Martínez',
        emergencyContactPhone: '3109876543',
        acquisitionSource: AcquisitionSource.INSTAGRAM,
        dataTreatmentConsent: true,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.clinicId).toBe(testClinicId);
    expect(res.body.firstName).toBe('Laura');
    expect(res.body.documentNumber).toBe('1020304050');
    expect(res.body.phone).toBe('3001234567');
    expect(res.body.acquisitionSource).toBe(AcquisitionSource.INSTAGRAM);
    expect(res.body.dataTreatmentConsent).toBe(true);
    expect(res.body.dataTreatmentConsentAt).toBeDefined();
    expect(res.body.isActive).toBe(true);

    createdPatientId = res.body.id;
  });

  // Scenario: Rechazo por documento de identidad duplicado en el mismo consultorio
  it('debe rechazar con 409 DUPLICATE_PATIENT_DOCUMENT cuando el documento ya existe en el consultorio', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/patients')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        firstName: 'Otro',
        lastName: 'Paciente',
        documentType: DocumentType.CC,
        documentNumber: '1020304050',
        birthDate: '1985-02-10',
        phone: '3157778899',
        dataTreatmentConsent: true,
      })
      .expect(409);

    expect(res.body.errorCode).toBe('DUPLICATE_PATIENT_DOCUMENT');
  });

  // Scenario: Detección de posible duplicado por número de documento o teléfono
  it('debe detectar posibles duplicados por documento o teléfono en GET /v1/patients/check-duplicates (200)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/patients/check-duplicates?phone=300-123-4567')
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].id).toBe(createdPatientId);
    expect(res.body[0].matchReason).toBe('PHONE');
  });

  // Scenario: Actualización exitosa de datos de contacto y emergencia de un paciente
  it('debe permitir a ADMIN y AUXILIARY listar, consultar y actualizar datos de un paciente (200)', async () => {
    // Listar pacientes
    const listRes = await request(app.getHttpServer())
      .get('/v1/patients')
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .expect(200);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);

    // Consultar por ID
    const getRes = await request(app.getHttpServer())
      .get(`/v1/patients/${createdPatientId}`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .expect(200);
    expect(getRes.body.id).toBe(createdPatientId);

    // Actualizar datos
    const patchRes = await request(app.getHttpServer())
      .patch(`/v1/patients/${createdPatientId}`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({
        firstName: 'Laura Sofía',
        phone: '3009998877',
        address: 'Avenida 19 # 100-50',
        emergencyContactName: 'Carlos Martínez',
        emergencyContactPhone: '3112223344',
      })
      .expect(200);

    expect(patchRes.body.firstName).toBe('Laura Sofía');
    expect(patchRes.body.phone).toBe('3009998877');
    expect(patchRes.body.address).toBe('Avenida 19 # 100-50');
    expect(patchRes.body.emergencyContactName).toBe('Carlos Martínez');
  });

  // Scenario: Bloqueo a rol AUXILIARY al intentar desactivar un paciente
  it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta cambiar el estado en PATCH /v1/patients/:id/status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/patients/${createdPatientId}/status`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({ isActive: false })
      .expect(403);

    expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
  });

  // Scenario: Administradora desactiva lógicamente a un paciente
  it('debe permitir a ADMIN desactivar lógicamente a un paciente en PATCH /v1/patients/:id/status (200)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/patients/${createdPatientId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ isActive: false })
      .expect(200);

    expect(res.body.id).toBe(createdPatientId);
    expect(res.body.isActive).toBe(false);

    // Verificar que sigue existiendo en el consultorio
    const verifyRes = await request(app.getHttpServer())
      .get(`/v1/patients/${createdPatientId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);
    expect(verifyRes.body.isActive).toBe(false);
  });
});
