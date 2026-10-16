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
  Procedure,
  Money,
} from '../src/modules/catalogs';
import { CLINICAL_HISTORY_REPOSITORY_PORT } from '../src/modules/clinical/domain/clinical-history.repository.port';
import { TreatmentItemStatus } from '../src/modules/clinical/domain/treatment-item-status.enum';
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
import { InMemoryClinicalAttentionRepository } from '../src/modules/clinical/infrastructure/repositories/in-memory-clinical-attention.repository';
import { ODONTOGRAM_REPOSITORY_PORT } from '../src/modules/clinical/domain/odontogram.repository.port';
import { CLINICAL_ATTENTION_REPOSITORY_PORT } from '../src/modules/clinical/domain/clinical-attention.repository.port';
import { Odontogram } from '../src/modules/clinical/domain/odontogram.entity';
import { ToothFinding } from '../src/modules/clinical/domain/tooth-finding.vo';
import { ToothNumber } from '../src/modules/clinical/domain/tooth-number.vo';
import { ToothSurface } from '../src/modules/clinical/domain/tooth-surface.enum';
import { FindingCatalogCode } from '../src/modules/clinical/domain/finding-catalog.enum';
import { FindingStatus } from '../src/modules/clinical/domain/finding-status.enum';
import { ClinicalAttention } from '../src/modules/clinical/domain/clinical-attention.entity';
import { ClinicalAttentionStatus } from '../src/modules/clinical/domain/clinical-attention-status.enum';
import { extractTextFromUncompressedPdf } from '../src/modules/clinical/infrastructure/adapters/pdfmake-clinical-history-pdf-generator.adapter.spec';
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

describe('Clinical History Management (e2e) (RF-B-020, RF-B-021, RF-B-022, RF-B-023, RC-005)', () => {
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
  let attentionRepo: InMemoryClinicalAttentionRepository;
  let passwordHasher: PasswordHasherPort;

  const testClinicId = 'a1111111-1111-4111-8111-111111111111';
  const adminId = 'b2222222-2222-4222-8222-222222222222';
  const auxiliaryId = 'c3333333-3333-4333-8333-333333333333';
  const rawPassword = 'Password123!';

  let adminAccessToken: string;
  let auxiliaryAccessToken: string;

  const testPatientId = 'd4444444-4444-4444-8444-444444444444';
  const testPatient2Id = 'e5555555-5555-4555-8555-555555555555';
  const testProcedureId = 'f6666666-6666-4666-8666-666666666666';

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
    attentionRepo = new InMemoryClinicalAttentionRepository();

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
      .overrideProvider(CLINICAL_ATTENTION_REPOSITORY_PORT)
      .useValue(attentionRepo)
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
        email: Email.create('admin.clinical@clinica.com'),
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
        email: Email.create('auxiliar.clinical@clinica.com'),
        passwordHash: hashedPwd,
        fullName: 'Carlos Auxiliar',
        role: UserRole.AUXILIARY,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    // Paciente 1
    await patientRepo.save(
      Patient.create({
        id: testPatientId,
        clinicId: testClinicId,
        firstName: 'Laura',
        lastName: 'Martínez',
        document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
        birthDate: new Date('1995-04-12'),
        phone: PhoneNumber.create('3001234567'),
        acquisitionSource: AcquisitionSource.DIRECT,
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: now,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    // Paciente 2
    await patientRepo.save(
      Patient.create({
        id: testPatient2Id,
        clinicId: testClinicId,
        firstName: 'Andrés',
        lastName: 'Castro',
        document: DocumentIdentity.create(DocumentType.CC, '2030405060'),
        birthDate: new Date('1988-08-20'),
        phone: PhoneNumber.create('3109876543'),
        acquisitionSource: AcquisitionSource.INSTAGRAM,
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: now,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    // Procedimiento en catálogo
    await procedureRepo.save(
      Procedure.create({
        id: testProcedureId,
        clinicId: testClinicId,
        code: 'RES-EST',
        name: 'Resina Estética de Alta Estética',
        description: 'Restauración dental en resina',
        basePrice: Money.from(120000),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    // Obtener tokens de autenticación
    const adminLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin.clinical@clinica.com', password: rawPassword });
    adminAccessToken = adminLoginRes.body.accessToken;

    const auxLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'auxiliar.clinical@clinica.com', password: rawPassword });
    auxiliaryAccessToken = auxLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('debe permitir a ADMIN abrir y actualizar la historia clínica con antecedentes y a AUXILIARY consultarla (201/200)', async () => {
    // 1. ADMIN abre la historia clínica (201)
    const createRes = await request(app.getHttpServer())
      .post('/v1/clinical-histories')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatientId,
        chiefComplaint: 'Dolor agudo en molar superior',
        currentIllness: 'Dolor pulsátil de 3 días de evolución',
        personalAntecedents: {
          hypertension: false,
          diabetes: false,
          allergies: true,
          allergiesDetails: 'Penicilina',
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        },
        familyAntecedents: 'Madre hipertensa',
        clinicalExamination: 'Caries cavitada en 16',
        diagnoses: [{ code: 'K02.1', description: 'Caries de la dentina' }],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.patientId).toBe(testPatientId);
    expect(createRes.body.chiefComplaint).toBe('Dolor agudo en molar superior');
    expect(createRes.body.personalAntecedents.allergies).toBe(true);
    expect(createRes.body.personalAntecedents.allergiesDetails).toBe('Penicilina');
    expect(createRes.body.familyAntecedents).toBe('Madre hipertensa');

    // 2. ADMIN actualiza la historia clínica (200)
    const updateRes = await request(app.getHttpServer())
      .patch(`/v1/clinical-histories/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        chiefComplaint: 'Control y revisión post-operatoria',
        currentIllness: 'Sin molestia tras intervención',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.chiefComplaint).toBe('Control y revisión post-operatoria');
    expect(updateRes.body.currentIllness).toBe('Sin molestia tras intervención');

    // 3. AUXILIARY consulta la historia clínica completa (200)
    const getRes = await request(app.getHttpServer())
      .get(`/v1/clinical-histories/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.patientId).toBe(testPatientId);
    expect(getRes.body.chiefComplaint).toBe('Control y revisión post-operatoria');
    expect(getRes.body.personalAntecedents.allergies).toBe(true);
    expect(getRes.body.personalAntecedents.allergiesDetails).toBe('Penicilina');
  });

  it('debe rechazar con 409 DUPLICATE_CLINICAL_HISTORY cuando se intenta abrir una segunda historia clínica para el mismo paciente', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/clinical-histories')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatientId,
        chiefComplaint: 'Intento de duplicación',
        currentIllness: 'Dolor',
        personalAntecedents: {
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        },
      });

    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe('DUPLICATE_CLINICAL_HISTORY');
  });

  it('debe rechazar con 400 INVALID_CLINICAL_HISTORY_DATA cuando se marca alergia sin detalle o motivo de consulta vacío', async () => {
    // Caso 1: Alergia marcada sin detalle
    const resAllergyNoDetail = await request(app.getHttpServer())
      .post('/v1/clinical-histories')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatient2Id,
        chiefComplaint: 'Dolor',
        currentIllness: 'Evolución',
        personalAntecedents: {
          hypertension: false,
          diabetes: false,
          allergies: true,
          allergiesDetails: '   ',
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        },
      });

    expect(resAllergyNoDetail.status).toBe(400);
    expect(resAllergyNoDetail.body.errorCode).toBe('INVALID_CLINICAL_HISTORY_DATA');

    // Caso 2: Motivo de consulta vacío
    const resEmptyComplaint = await request(app.getHttpServer())
      .post('/v1/clinical-histories')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatient2Id,
        chiefComplaint: '',
        currentIllness: 'Evolución',
        personalAntecedents: {
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        },
      });

    expect(resEmptyComplaint.status).toBe(400);
  });

  it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta crear o modificar la historia clínica o el plan de tratamiento', async () => {
    // 1. AUXILIARY POST /v1/clinical-histories
    const resCreate = await request(app.getHttpServer())
      .post('/v1/clinical-histories')
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({
        patientId: testPatient2Id,
        chiefComplaint: 'Intento auxiliar',
        currentIllness: 'Molestia',
        personalAntecedents: {
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        },
      });
    expect(resCreate.status).toBe(403);
    expect(resCreate.body.errorCode).toBe('FORBIDDEN_ROLE');

    // 2. AUXILIARY PATCH /v1/clinical-histories/patient/:patientId
    const resUpdate = await request(app.getHttpServer())
      .patch(`/v1/clinical-histories/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({ chiefComplaint: 'Modificación auxiliar' });
    expect(resUpdate.status).toBe(403);
    expect(resUpdate.body.errorCode).toBe('FORBIDDEN_ROLE');

    // 3. AUXILIARY POST /v1/clinical-histories/patient/:patientId/treatment-plan-items
    const resAddPlan = await request(app.getHttpServer())
      .post(`/v1/clinical-histories/patient/${testPatientId}/treatment-plan-items`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({ procedureId: testProcedureId });
    expect(resAddPlan.status).toBe(403);
    expect(resAddPlan.body.errorCode).toBe('FORBIDDEN_ROLE');

    // 4. AUXILIARY PATCH status
    const resUpdateStatus = await request(app.getHttpServer())
      .patch(
        `/v1/clinical-histories/patient/${testPatientId}/treatment-plan-items/00000000-0000-4000-8000-000000000001/status`,
      )
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({ status: TreatmentItemStatus.COMPLETED });
    expect(resUpdateStatus.status).toBe(403);
    expect(resUpdateStatus.body.errorCode).toBe('FORBIDDEN_ROLE');
  });

  it('debe permitir a ADMIN agregar un ítem al plan de tratamiento resolviendo el precio del catálogo y actualizar su estado a COMPLETED (201/200)', async () => {
    // 1. Agregar ítem al plan (201)
    const addRes = await request(app.getHttpServer())
      .post(`/v1/clinical-histories/patient/${testPatientId}/treatment-plan-items`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        procedureId: testProcedureId,
        toothNumber: '16',
        notes: 'Aislamiento absoluto requerido',
      });

    expect(addRes.status).toBe(201);
    expect(addRes.body.procedureCode).toBe('RES-EST');
    expect(addRes.body.toothNumber).toBe('16');
    expect(addRes.body.status).toBe(TreatmentItemStatus.PENDING);
    expect(addRes.body.estimatedCostCop).toBe(120000);

    const itemId = addRes.body.id;

    // 2. Actualizar estado a COMPLETED (200)
    const statusRes = await request(app.getHttpServer())
      .patch(
        `/v1/clinical-histories/patient/${testPatientId}/treatment-plan-items/${itemId}/status`,
      )
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        status: TreatmentItemStatus.COMPLETED,
      });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.id).toBe(itemId);
    expect(statusRes.body.status).toBe(TreatmentItemStatus.COMPLETED);

    // 3. Consultar y verificar totalEstimatedCostCop acumulado
    const getRes = await request(app.getHttpServer())
      .get(`/v1/clinical-histories/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.treatmentItems).toHaveLength(1);
    expect(getRes.body.treatmentItems[0].status).toBe(TreatmentItemStatus.COMPLETED);
    expect(getRes.body.totalEstimatedCostCop).toBe(120000);
  });

  it('debe permitir a ADMIN exportar la historia clínica completa en PDF recibiendo application/pdf válido sin incluir privateNotes (200)', async () => {
    const now = new Date('2026-10-15T11:00:00.000Z');

    // Registrar un hallazgo de odontograma para enriquecer el PDF
    const toothFinding = ToothFinding.create({
      toothNumber: ToothNumber.of('16'),
      surface: ToothSurface.OCCLUSAL,
      findingCode: FindingCatalogCode.CARIES,
      status: FindingStatus.EXISTING,
      notes: 'Caries oclusal profunda',
      createdAt: now,
    });
    const odontogram = Odontogram.create({
      id: '00000000-0000-4000-8000-000000000099',
      patientId: testPatientId,
      clinicId: testClinicId,
      hasTemporalDentition: false,
      findings: [toothFinding],
      createdAt: now,
      updatedAt: now,
    });
    await odontogramRepo.save(odontogram);

    // Obtener la historia clínica creada para testPatientId (argumentos en orden correcto: clinicId, patientId)
    const history = await clinicalHistoryRepo.findByPatientId(testClinicId, testPatientId);
    expect(history).not.toBeNull();
    const historyId = history!.id;

    // Registrar una atención clínica en estado OPEN con procedimiento válido y cerrarla formalmente (B-11, RC-023)
    const attention = ClinicalAttention.create({
      id: '00000000-0000-4000-8000-000000000088',
      patientId: testPatientId,
      clinicId: testClinicId,
      clinicalHistoryId: historyId,
      attendedByUserId: adminId,
      evolutionNotes: 'Evolución favorable del paciente tras la restauración en resina.',
      privateNotes: 'Nota super confidencial que NO debe salir en el PDF',
      status: ClinicalAttentionStatus.OPEN,
      attendedAt: now,
      proceduresPerformed: [
        {
          code: 'RES-EST',
          name: 'Resina Estética',
          toothNumber: '16',
          surface: 'Oclusal',
        },
      ],
      materialsUsed: [],
      createdAt: now,
      updatedAt: now,
    });
    attention.close(now);
    await attentionRepo.save(attention);

    // Descargar el PDF como ADMIN
    const res = await request(app.getHttpServer())
      .get(`/v1/clinical-histories/patient/${testPatientId}/pdf`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .buffer(true)
      .parse((response, callback) => {
        const data: Buffer[] = [];
        response.on('data', (chunk: Buffer) => data.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toBe(
      `attachment; filename="historia-clinica-${testPatientId}.pdf"`,
    );
    // 1. Cabecera Cache-Control no-store (RC-070)
    expect(res.headers['cache-control']).toContain('no-store');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect((res.body as Buffer).length).toBeGreaterThan(500);

    const pdfBuffer = res.body as Buffer;
    const header = pdfBuffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');

    // 2. Controles positivos decodificados usando extractTextFromUncompressedPdf
    const decodedText = extractTextFromUncompressedPdf(pdfBuffer);
    expect(decodedText).toContain(
      'Evolución favorable del paciente tras la restauración en resina.',
    );
    expect(decodedText).toContain('K02.1 – Caries de la dentina');
    expect(decodedText).toContain('Caries oclusal profunda');

    // 3. Control negativo real sobre el texto decodificado (RC-023)
    expect(decodedText).not.toContain('Nota super confidencial');
  });

  it('debe rechazar con 404 CLINICAL_HISTORY_NOT_FOUND cuando se intenta exportar el PDF de un paciente sin historia clínica', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/clinical-histories/patient/${testPatient2Id}/pdf`)
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('CLINICAL_HISTORY_NOT_FOUND');
  });

  it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta exportar la historia clínica en PDF', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/clinical-histories/patient/${testPatientId}/pdf`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
  });
});
