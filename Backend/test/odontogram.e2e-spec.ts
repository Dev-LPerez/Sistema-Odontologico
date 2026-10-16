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
import { CLINICAL_HISTORY_REPOSITORY_PORT } from '../src/modules/clinical/domain/clinical-history.repository.port';
import { ODONTOGRAM_REPOSITORY_PORT } from '../src/modules/clinical/domain/odontogram.repository.port';
import { ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT } from '../src/modules/clinical/domain/odontogram-snapshot.repository.port';
import { UNIT_OF_WORK_PORT } from '../src/shared/application/ports/unit-of-work.port';
import { InMemoryClinicRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-clinic.repository';
import { InMemoryUserRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-user.repository';
import { InMemoryRefreshSessionRepository } from '../src/modules/identity/infrastructure/repositories/in-memory-refresh-session.repository';
import { InMemoryPatientRepository } from '../src/modules/patients/infrastructure/repositories/in-memory-patient.repository';
import { InMemoryPatientQueriesAdapter } from '../src/modules/patients/infrastructure/queries/in-memory-patient.queries';
import { InMemoryProcedureRepository } from '../src/modules/catalogs/infrastructure/repositories/in-memory-procedure.repository';
import { InMemoryPatientProcedurePriceRepository } from '../src/modules/catalogs/infrastructure/repositories/in-memory-patient-procedure-price.repository';
import { InMemoryMaterialRepository } from '../src/modules/catalogs/infrastructure/repositories/in-memory-material.repository';
import { InMemoryClinicalHistoryRepository } from '../src/modules/clinical/infrastructure/repositories/in-memory-clinical-history.repository';
import { InMemoryOdontogramRepository } from '../src/modules/clinical/infrastructure/repositories/in-memory-odontogram.repository';
import { InMemoryOdontogramSnapshotRepository } from '../src/modules/clinical/infrastructure/repositories/in-memory-odontogram-snapshot.repository';
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
import { ToothSurface } from '../src/modules/clinical/domain/tooth-surface.enum';
import { FindingCatalogCode } from '../src/modules/clinical/domain/finding-catalog.enum';
import { FindingStatus } from '../src/modules/clinical/domain/finding-status.enum';

describe('Odontogram Management (e2e) (RF-B-040, RF-B-041, RF-B-042, RF-B-043, RF-B-044, RC-005)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let clinicRepo: InMemoryClinicRepository;
  let userRepo: InMemoryUserRepository;
  let refreshSessionRepo: InMemoryRefreshSessionRepository;
  let patientRepo: InMemoryPatientRepository;
  let patientQueriesAdapter: InMemoryPatientQueriesAdapter;
  let procedureRepo: InMemoryProcedureRepository;
  let patientPriceRepo: InMemoryPatientProcedurePriceRepository;
  let materialRepo: InMemoryMaterialRepository;
  let clinicalHistoryRepo: InMemoryClinicalHistoryRepository;
  let odontogramRepo: InMemoryOdontogramRepository;
  let odontogramSnapshotRepo: InMemoryOdontogramSnapshotRepository;
  let passwordHasher: PasswordHasherPort;

  const testClinicId = 'a1111111-1111-4111-8111-111111111111';
  const adminId = 'b2222222-2222-4222-8222-222222222222';
  const auxiliaryId = 'c3333333-3333-4333-8333-333333333333';
  const rawPassword = 'Password123!';

  let adminAccessToken: string;
  let auxiliaryAccessToken: string;

  const testPatientId = 'd4444444-4444-4444-8444-444444444444';

  beforeAll(async () => {
    clinicRepo = new InMemoryClinicRepository();
    userRepo = new InMemoryUserRepository();
    refreshSessionRepo = new InMemoryRefreshSessionRepository();
    patientRepo = new InMemoryPatientRepository();
    patientQueriesAdapter = new InMemoryPatientQueriesAdapter(patientRepo);
    procedureRepo = new InMemoryProcedureRepository();
    patientPriceRepo = new InMemoryPatientProcedurePriceRepository();
    materialRepo = new InMemoryMaterialRepository();
    clinicalHistoryRepo = new InMemoryClinicalHistoryRepository();
    odontogramRepo = new InMemoryOdontogramRepository();
    odontogramSnapshotRepo = new InMemoryOdontogramSnapshotRepository();

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
      .overrideProvider(CLINICAL_HISTORY_REPOSITORY_PORT)
      .useValue(clinicalHistoryRepo)
      .overrideProvider(ODONTOGRAM_REPOSITORY_PORT)
      .useValue(odontogramRepo)
      .overrideProvider(ODONTOGRAM_SNAPSHOT_REPOSITORY_PORT)
      .useValue(odontogramSnapshotRepo)
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
        name: 'Consultorio Odontológico San Lucas',
        createdAt: now,
        updatedAt: now,
      }),
    );

    const hashedPwd = await passwordHasher.hash(rawPassword);
    await userRepo.save(
      User.create({
        id: adminId,
        clinicId: testClinicId,
        email: Email.create('admin.odontogram@clinica.com'),
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
        email: Email.create('auxiliary.odontogram@clinica.com'),
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
        firstName: 'Laura',
        lastName: 'Restrepo',
        document: DocumentIdentity.create(DocumentType.CC, '55443322'),
        birthDate: new Date('1998-04-12'),
        phone: PhoneNumber.create('3005544332'),
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
      .send({ email: 'admin.odontogram@clinica.com', password: rawPassword });
    adminAccessToken = adminLoginRes.body.accessToken;

    const auxLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'auxiliary.odontogram@clinica.com', password: rawPassword });
    auxiliaryAccessToken = auxLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('debe permitir a ADMIN actualizar hallazgos en dientes permanentes y temporales y a AUXILIARY consultar el odontograma (200)', async () => {
    const payload = {
      hasTemporalDentition: true,
      findings: [
        {
          toothNumber: 16,
          surface: ToothSurface.OCCLUSAL,
          findingCode: FindingCatalogCode.CARIES,
          status: FindingStatus.EXISTING,
          notes: 'Fosa oclusal profunda',
        },
        {
          toothNumber: 55,
          surface: ToothSurface.VESTIBULAR,
          findingCode: FindingCatalogCode.RESIN_RESTORATION,
          status: FindingStatus.PERFORMED,
          notes: 'Resina temporal clase V',
        },
      ],
    };

    // 1. ADMIN actualiza el odontograma
    const putRes = await request(app.getHttpServer())
      .put(`/v1/odontograms/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(payload);

    expect(putRes.status).toBe(200);
    expect(putRes.body.hasTemporalDentition).toBe(true);
    expect(putRes.body.findings).toHaveLength(2);
    expect(putRes.body.teethState['16']).toBeDefined();
    expect(putRes.body.teethState['55']).toBeDefined();

    // 2. AUXILIARY consulta el odontograma
    const getRes = await request(app.getHttpServer())
      .get(`/v1/odontograms/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.hasTemporalDentition).toBe(true);
    expect(getRes.body.findings).toHaveLength(2);
    expect(getRes.body.findings[0].toothNumber).toBe(16);
    expect(getRes.body.findings[0].findingCode).toBe('CARIES');
    expect(getRes.body.findings[1].toothNumber).toBe(55);
    expect(getRes.body.findings[1].findingCode).toBe('RESIN_RESTORATION');
  });

  it('debe rechazar con 400 INVALID_ODONTOGRAM_DATA cuando se envía un diente FDI inválido o diente temporal sin activar hasTemporalDentition', async () => {
    // Caso 1: Diente FDI inexistente (19)
    const invalidToothPayload = {
      hasTemporalDentition: false,
      findings: [
        {
          toothNumber: 19,
          surface: ToothSurface.OCCLUSAL,
          findingCode: FindingCatalogCode.CARIES,
          status: FindingStatus.EXISTING,
        },
      ],
    };

    const res1 = await request(app.getHttpServer())
      .put(`/v1/odontograms/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(invalidToothPayload);

    expect(res1.status).toBe(400);
    expect(res1.body.errorCode).toBe('INVALID_ODONTOGRAM_DATA');

    // Caso 2: Diente temporal (55) con hasTemporalDentition en false
    const temporalToothWithoutFlagPayload = {
      hasTemporalDentition: false,
      findings: [
        {
          toothNumber: 55,
          surface: ToothSurface.VESTIBULAR,
          findingCode: FindingCatalogCode.RESIN_RESTORATION,
          status: FindingStatus.PERFORMED,
        },
      ],
    };

    const res2 = await request(app.getHttpServer())
      .put(`/v1/odontograms/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(temporalToothWithoutFlagPayload);

    expect(res2.status).toBe(400);
    expect(res2.body.errorCode).toBe('INVALID_ODONTOGRAM_DATA');
  });

  it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta modificar el odontograma o crear una instantánea', async () => {
    // 1. AUXILIARY intenta modificar el odontograma
    const putRes = await request(app.getHttpServer())
      .put(`/v1/odontograms/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({
        hasTemporalDentition: false,
        findings: [],
      });

    expect(putRes.status).toBe(403);
    expect(putRes.body.errorCode).toBe('FORBIDDEN_ROLE');

    // 2. AUXILIARY intenta crear una instantánea
    const postRes = await request(app.getHttpServer())
      .post(`/v1/odontograms/patient/${testPatientId}/snapshots`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({
        notes: 'Intento de snapshot no autorizado',
      });

    expect(postRes.status).toBe(403);
    expect(postRes.body.errorCode).toBe('FORBIDDEN_ROLE');
  });

  it('debe permitir a ADMIN capturar una instantánea del odontograma y conservarla inmutable tras cambios posteriores (201/200)', async () => {
    // 1. ADMIN asegura un estado inicial con caries en 16
    await request(app.getHttpServer())
      .put(`/v1/odontograms/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        hasTemporalDentition: false,
        findings: [
          {
            toothNumber: 16,
            surface: ToothSurface.OCCLUSAL,
            findingCode: FindingCatalogCode.CARIES,
            status: FindingStatus.EXISTING,
          },
        ],
      });

    // 2. ADMIN captura la instantánea inicial (201)
    const snapshotRes = await request(app.getHttpServer())
      .post(`/v1/odontograms/patient/${testPatientId}/snapshots`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        notes: 'Estado inicial pre-tratamiento',
      });

    expect(snapshotRes.status).toBe(201);
    expect(snapshotRes.body.id).toBeDefined();
    expect(snapshotRes.body.notes).toBe('Estado inicial pre-tratamiento');

    // 3. ADMIN actualiza el diente 16 a RESIN_RESTORATION (PERFORMED)
    const updateRes = await request(app.getHttpServer())
      .put(`/v1/odontograms/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        hasTemporalDentition: false,
        findings: [
          {
            toothNumber: 16,
            surface: ToothSurface.OCCLUSAL,
            findingCode: FindingCatalogCode.RESIN_RESTORATION,
            status: FindingStatus.PERFORMED,
          },
        ],
      });
    expect(updateRes.status).toBe(200);

    // 4. AUXILIARY lista las instantáneas (200) y comprueba que la instantánea conserva CARIES (EXISTING)
    const listRes = await request(app.getHttpServer())
      .get(`/v1/odontograms/patient/${testPatientId}/snapshots`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);

    const targetSnapshot = listRes.body.find((s: { id: string }) => s.id === snapshotRes.body.id);
    expect(targetSnapshot).toBeDefined();
    expect(targetSnapshot.snapshotData.teeth['16'][0].findingCode).toBe('CARIES');
    expect(targetSnapshot.snapshotData.teeth['16'][0].status).toBe('EXISTING');
  });
});
