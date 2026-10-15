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
import {
  PROCEDURE_REPOSITORY_PORT,
  PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT,
  MATERIAL_REPOSITORY_PORT,
} from '../src/modules/catalogs';
import { UNIT_OF_WORK_PORT } from '../src/shared/application/ports/unit-of-work.port';
import { InMemoryClinicRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-clinic.repository';
import { InMemoryUserRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-user.repository';
import { InMemoryRefreshSessionRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-refresh-session.repository';
import { InMemoryPatientRepository } from '../src/modules/patients/infrastructure/repositories/in-memory-patient.repository';
import { InMemoryPatientQueriesAdapter } from '../src/modules/patients/infrastructure/queries/in-memory-patient.queries';
import { InMemoryProcedureRepository } from '../src/modules/catalogs/infrastructure/repositories/in-memory-procedure.repository';
import { InMemoryPatientProcedurePriceRepository } from '../src/modules/catalogs/infrastructure/repositories/in-memory-patient-procedure-price.repository';
import { InMemoryMaterialRepository } from '../src/modules/catalogs/infrastructure/repositories/in-memory-material.repository';
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

describe('Catalogs Management (e2e) (RF-B-050, RF-B-051, RF-B-052, RF-B-053, RC-005)', () => {
  let app: INestApplication;
  let clinicRepo: InMemoryClinicRepository;
  let userRepo: InMemoryUserRepository;
  let refreshSessionRepo: InMemoryRefreshSessionRepository;
  let patientRepo: InMemoryPatientRepository;
  let patientQueriesAdapter: InMemoryPatientQueriesAdapter;
  let procedureRepo: InMemoryProcedureRepository;
  let patientPriceRepo: InMemoryPatientProcedurePriceRepository;
  let materialRepo: InMemoryMaterialRepository;
  let passwordHasher: PasswordHasherPort;

  const testClinicId = 'clinic-uuid-cat-001';
  const adminId = 'user-uuid-admin-cat-001';
  const auxiliaryId = 'user-uuid-aux-cat-002';
  const rawPassword = 'Password123!';

  let adminAccessToken: string;
  let auxiliaryAccessToken: string;
  let createdProcedureId: string;
  let createdMaterialId: string;
  const testPatientId = 'patient-uuid-cat-001';

  beforeAll(async () => {
    clinicRepo = new InMemoryClinicRepository();
    userRepo = new InMemoryUserRepository();
    refreshSessionRepo = new InMemoryRefreshSessionRepository();
    patientRepo = new InMemoryPatientRepository();
    patientQueriesAdapter = new InMemoryPatientQueriesAdapter(patientRepo);
    procedureRepo = new InMemoryProcedureRepository();
    patientPriceRepo = new InMemoryPatientProcedurePriceRepository();
    materialRepo = new InMemoryMaterialRepository();

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
      .overrideProvider(PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT)
      .useValue(patientPriceRepo)
      .overrideProvider(MATERIAL_REPOSITORY_PORT)
      .useValue(materialRepo)
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
        email: Email.create('admin.catalogs@clinica.com'),
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
        email: Email.create('auxiliar.catalogs@clinica.com'),
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
        acquisitionSource: AcquisitionSource.DIRECT,
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: now,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const adminLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin.catalogs@clinica.com', password: rawPassword })
      .expect(200);
    adminAccessToken = adminLoginRes.body.accessToken;

    const auxLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'auxiliar.catalogs@clinica.com', password: rawPassword })
      .expect(200);
    auxiliaryAccessToken = auxLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Scenario 1: Administradora crea y actualiza un procedimiento y auxiliar puede listarlo (RF-B-050)', () => {
    it('debe permitir a ADMIN crear y actualizar un procedimiento y a AUXILIARY listarlo (201/200)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/catalogs/procedures')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          code: 'RES-EST',
          name: 'Resina estética',
          description: 'Restauración estética anterior',
          basePriceCop: 180000,
        })
        .expect(201);

      expect(createRes.body.id).toBeDefined();
      expect(createRes.body.clinicId).toBe(testClinicId);
      expect(createRes.body.code).toBe('RES-EST');
      expect(createRes.body.name).toBe('Resina estética');
      expect(createRes.body.basePriceCop).toBe(180000);
      expect(createRes.body.isActive).toBe(true);

      createdProcedureId = createRes.body.id;

      const updateRes = await request(app.getHttpServer())
        .patch(`/v1/catalogs/procedures/${createdProcedureId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Resina estética premium',
          basePriceCop: 200000,
        })
        .expect(200);

      expect(updateRes.body.id).toBe(createdProcedureId);
      expect(updateRes.body.name).toBe('Resina estética premium');
      expect(updateRes.body.basePriceCop).toBe(200000);

      const listRes = await request(app.getHttpServer())
        .get('/v1/catalogs/procedures')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].code).toBe('RES-EST');
      expect(listRes.body[0].name).toBe('Resina estética premium');
    });
  });

  describe('Scenario 2: Rechazo de procedimiento con código duplicado en el mismo consultorio (RF-B-050)', () => {
    it('debe rechazar con 409 DUPLICATE_PROCEDURE_CODE cuando el código de procedimiento ya existe en el consultorio', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/catalogs/procedures')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          code: 'res-est', // Normalizado debe colisionar con RES-EST
          name: 'Otra resina',
          basePriceCop: 150000,
        })
        .expect(409);

      expect(res.body.errorCode).toBe('DUPLICATE_PROCEDURE_CODE');
      expect(res.body.message).toContain('RES-EST');
    });
  });

  describe('Scenario 3: Bloqueo a rol AUXILIARY al intentar crear o modificar procedimientos o materiales (RC-005)', () => {
    it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta crear o modificar procedimientos, precios o materiales', async () => {
      // 1. POST /procedures
      const p1 = await request(app.getHttpServer())
        .post('/v1/catalogs/procedures')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          code: 'PROC-AUX',
          name: 'Proc Aux',
          basePriceCop: 50000,
        })
        .expect(403);
      expect(p1.body.errorCode).toBe('FORBIDDEN_ROLE');

      // 2. PATCH /procedures/:id
      const p2 = await request(app.getHttpServer())
        .patch(`/v1/catalogs/procedures/${createdProcedureId}`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ name: 'Hack' })
        .expect(403);
      expect(p2.body.errorCode).toBe('FORBIDDEN_ROLE');

      // 3. PUT /patient-prices
      const p3 = await request(app.getHttpServer())
        .put('/v1/catalogs/patient-prices')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: createdProcedureId,
          customPriceCop: 10000,
          reason: 'Gratis',
        })
        .expect(403);
      expect(p3.body.errorCode).toBe('FORBIDDEN_ROLE');

      // 4. POST /materials
      const p4 = await request(app.getHttpServer())
        .post('/v1/catalogs/materials')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          brand: 'AuxBrand',
          reference: 'AuxRef',
          type: 'RESIN',
          color: 'A1',
          currentStock: 10,
          minStock: 2,
        })
        .expect(403);
      expect(p4.body.errorCode).toBe('FORBIDDEN_ROLE');

      // 5. PATCH /materials/:id
      const p5 = await request(app.getHttpServer())
        .patch('/v1/catalogs/materials/mat-mock-aux')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ currentStock: 50 })
        .expect(403);
      expect(p5.body.errorCode).toBe('FORBIDDEN_ROLE');

      // 6. POST /materials/:id/consume
      const p6 = await request(app.getHttpServer())
        .post('/v1/catalogs/materials/mat-mock-aux/consume')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ quantity: 1 })
        .expect(403);
      expect(p6.body.errorCode).toBe('FORBIDDEN_ROLE');
    });
  });

  describe('Scenario 4: Configuración y consulta exitosa de precio especial por paciente con motivo (RF-B-051)', () => {
    it('debe permitir a ADMIN configurar un precio especial por paciente con motivo y a AUXILIARY consultarlo (200)', async () => {
      const setPriceRes = await request(app.getHttpServer())
        .put('/v1/catalogs/patient-prices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: createdProcedureId,
          customPriceCop: 140000,
          reason: 'Tarifa familiar',
        })
        .expect(200);

      expect(setPriceRes.body.patientId).toBe(testPatientId);
      expect(setPriceRes.body.procedureId).toBe(createdProcedureId);
      expect(setPriceRes.body.customPriceCop).toBe(140000);
      expect(setPriceRes.body.reason).toBe('Tarifa familiar');

      const listPriceRes = await request(app.getHttpServer())
        .get(`/v1/catalogs/patient-prices?patientId=${testPatientId}`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .expect(200);

      expect(listPriceRes.body).toHaveLength(1);
      expect(listPriceRes.body[0].customPriceCop).toBe(140000);
      expect(listPriceRes.body[0].reason).toBe('Tarifa familiar');
    });
  });

  describe('Scenario 5: Rechazo de ajuste de precio por paciente cuando el motivo está vacío (RF-B-051)', () => {
    it('debe rechazar con 400 cuando se intenta configurar un precio por paciente con motivo vacío o monto negativo', async () => {
      const resEmpty = await request(app.getHttpServer())
        .put('/v1/catalogs/patient-prices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: createdProcedureId,
          customPriceCop: 140000,
          reason: '   ',
        })
        .expect(400);

      expect(resEmpty.body.message).toBeDefined();

      const resNegative = await request(app.getHttpServer())
        .put('/v1/catalogs/patient-prices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: createdProcedureId,
          customPriceCop: -100,
          reason: 'Precio inválido negativo',
        })
        .expect(400);

      expect(resNegative.body.message).toBeDefined();
    });
  });

  describe('Scenario 6: Registro de material propio y activación de alerta de bajo stock tras descuento (RF-B-052, RF-B-053)', () => {
    it('debe registrar un material propio, descontar existencias y activar isLowStock cuando llega al umbral mínimo (201/200)', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/catalogs/materials')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          brand: '3M',
          reference: 'Filtek Z350',
          type: 'RESIN',
          color: 'A2',
          currentStock: 3,
          minStock: 2,
        })
        .expect(201);

      expect(createRes.body.id).toBeDefined();
      expect(createRes.body.brand).toBe('3M');
      expect(createRes.body.currentStock).toBe(3);
      expect(createRes.body.minStock).toBe(2);
      expect(createRes.body.isLowStock).toBe(false);

      createdMaterialId = createRes.body.id;

      // El consumo debe ser realizado por ADMIN (RNF-B-004, RC-005)
      const consumeRes = await request(app.getHttpServer())
        .post(`/v1/catalogs/materials/${createdMaterialId}/consume`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ quantity: 2 })
        .expect(200);

      expect(consumeRes.body.currentStock).toBe(1);
      expect(consumeRes.body.isLowStock).toBe(true);

      const listRes = await request(app.getHttpServer())
        .get('/v1/catalogs/materials')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].id).toBe(createdMaterialId);
      expect(listRes.body[0].isLowStock).toBe(true);
    });
  });

  describe('Scenario 7: Rechazo de descuento de material cuando las existencias son insuficientes (RF-B-053)', () => {
    it('debe rechazar con 422 INSUFFICIENT_MATERIAL_STOCK cuando se intenta descontar más stock del disponible', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/catalogs/materials/${createdMaterialId}/consume`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ quantity: 2 })
        .expect(422);

      expect(res.body.errorCode).toBe('INSUFFICIENT_MATERIAL_STOCK');
      expect(res.body.message).toContain('insuficiente');
    });
  });
});
