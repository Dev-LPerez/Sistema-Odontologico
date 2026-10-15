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
    it('ADMIN should create procedure with 201 Created and update it with 200 OK', async () => {
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
    });
  });

  describe('Scenario 2: Rechazo de procedimiento con código duplicado en el mismo consultorio (RF-B-050)', () => {
    it('ADMIN should receive 409 Conflict when creating procedure with duplicate code', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/catalogs/procedures')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          code: 'res-est', // Normalized should collide with RES-EST
          name: 'Otra resina',
          basePriceCop: 150000,
        })
        .expect(409);

      expect(res.body.errorCode).toBe('DUPLICATE_PROCEDURE_CODE');
      expect(res.body.message).toContain('RES-EST');
    });
  });

  describe('Scenario 3: Configuración y consulta de precio especial por paciente con motivo (RF-B-051)', () => {
    it('ADMIN should set custom price with 200 OK and list it for the patient', async () => {
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
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(listPriceRes.body).toHaveLength(1);
      expect(listPriceRes.body[0].customPriceCop).toBe(140000);
      expect(listPriceRes.body[0].reason).toBe('Tarifa familiar');
    });

    it('ADMIN should receive 400 Bad Request when reason is empty or whitespace', async () => {
      const res = await request(app.getHttpServer())
        .put('/v1/catalogs/patient-prices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: createdProcedureId,
          customPriceCop: 140000,
          reason: '   ',
        })
        .expect(400);

      expect(res.body.message).toBeDefined();
    });
  });

  describe('Scenario 4: AUXILIARY puede consultar procedimientos y precios especiales (RC-005)', () => {
    it('AUXILIARY should list procedures and patient custom prices with 200 OK', async () => {
      const procRes = await request(app.getHttpServer())
        .get('/v1/catalogs/procedures')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .expect(200);

      expect(procRes.body).toHaveLength(1);
      expect(procRes.body[0].code).toBe('RES-EST');

      const priceRes = await request(app.getHttpServer())
        .get(`/v1/catalogs/patient-prices?patientId=${testPatientId}`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .expect(200);

      expect(priceRes.body).toHaveLength(1);
      expect(priceRes.body[0].customPriceCop).toBe(140000);
    });
  });

  describe('Scenario 5: Registro de material propio y alerta de bajo stock (RF-B-052)', () => {
    it('ADMIN should create material with 201 Created and isLowStock false', async () => {
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

      const listRes = await request(app.getHttpServer())
        .get('/v1/catalogs/materials')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].id).toBe(createdMaterialId);
      expect(listRes.body[0].isLowStock).toBe(false);
    });
  });

  describe('Scenario 6: Descuento de existencias y activación de alerta de bajo inventario (RF-B-053)', () => {
    it('AUXILIARY should consume 2 units, reducing stock to 1 and setting isLowStock to true', async () => {
      const consumeRes = await request(app.getHttpServer())
        .post(`/v1/catalogs/materials/${createdMaterialId}/consume`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ quantity: 2 })
        .expect(200);

      expect(consumeRes.body.currentStock).toBe(1);
      expect(consumeRes.body.isLowStock).toBe(true);
    });

    it('should receive 422 Unprocessable Entity when consuming more than available stock', async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/catalogs/materials/${createdMaterialId}/consume`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ quantity: 2 })
        .expect(422);

      expect(res.body.errorCode).toBe('INSUFFICIENT_MATERIAL_STOCK');
      expect(res.body.message).toContain('insuficiente');
    });
  });

  describe('Scenario 7: Bloqueo a rol AUXILIARY en rutas administrativas (RC-005)', () => {
    it('AUXILIARY should be rejected with 403 Forbidden on POST /catalogs/procedures', async () => {
      await request(app.getHttpServer())
        .post('/v1/catalogs/procedures')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          code: 'PROC-AUX',
          name: 'Proc Aux',
          basePriceCop: 50000,
        })
        .expect(403);
    });

    it('AUXILIARY should be rejected with 403 Forbidden on PATCH /catalogs/procedures/:id', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/catalogs/procedures/${createdProcedureId}`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ name: 'Hack' })
        .expect(403);
    });

    it('AUXILIARY should be rejected with 403 Forbidden on PUT /catalogs/patient-prices', async () => {
      await request(app.getHttpServer())
        .put('/v1/catalogs/patient-prices')
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({
          patientId: testPatientId,
          procedureId: createdProcedureId,
          customPriceCop: 10000,
          reason: 'Gratis',
        })
        .expect(403);
    });

    it('AUXILIARY should be rejected with 403 Forbidden on POST /catalogs/materials', async () => {
      await request(app.getHttpServer())
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
    });

    it('AUXILIARY should be rejected with 403 Forbidden on PATCH /catalogs/materials/:id', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/catalogs/materials/${createdMaterialId}`)
        .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
        .send({ currentStock: 50 })
        .expect(403);
    });
  });
});
