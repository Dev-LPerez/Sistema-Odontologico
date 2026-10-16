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
  Material,
  Procedure,
  Money,
} from '../src/modules/catalogs';
import { CLINICAL_HISTORY_REPOSITORY_PORT } from '../src/modules/clinical/domain/clinical-history.repository.port';
import { CLINICAL_ATTENTION_REPOSITORY_PORT } from '../src/modules/clinical/domain/clinical-attention.repository.port';
import { CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT } from '../src/modules/clinical/domain/clinical-attention-version.repository.port';
import { ClinicalHistory } from '../src/modules/clinical/domain/clinical-history.entity';
import { MedicalAntecedents } from '../src/modules/clinical/domain/medical-antecedents.vo';
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
import { InMemoryClinicalAttentionRepository } from '../src/modules/clinical/infrastructure/repositories/in-memory-clinical-attention.repository';
import { InMemoryClinicalAttentionVersionRepository } from '../src/modules/clinical/infrastructure/repositories/in-memory-clinical-attention-version.repository';
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

describe('Clinical Attentions and Materials Management (e2e) (RF-B-024, RF-B-025, RF-B-026, RF-B-027, RF-B-053, RC-005, RC-017, RC-055)', () => {
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
  let clinicalAttentionRepo: InMemoryClinicalAttentionRepository;
  let clinicalAttentionVersionRepo: InMemoryClinicalAttentionVersionRepository;
  let passwordHasher: PasswordHasherPort;

  const testClinicId = 'a1111111-1111-4111-8111-111111111111';
  const adminId = 'b2222222-2222-4222-8222-222222222222';
  const auxiliaryId = 'c3333333-3333-4333-8333-333333333333';
  const rawPassword = 'Password123!';

  let adminAccessToken: string;
  let auxiliaryAccessToken: string;

  const testPatientId = 'd4444444-4444-4444-8444-444444444444';
  const testPatientWithoutHistoryId = 'e5555555-5555-4555-8555-555555555555';
  const testHistoryId = 'f6666666-6666-4666-8666-666666666666';
  const testMaterial1Id = '11111111-2222-4333-8444-555555555555';
  const testMaterial2Id = '22222222-3333-4444-8555-666666666666';

  let createdAttentionId: string;

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
    clinicalAttentionRepo = new InMemoryClinicalAttentionRepository();
    clinicalAttentionVersionRepo = new InMemoryClinicalAttentionVersionRepository();

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
      .overrideProvider(CLINICAL_ATTENTION_REPOSITORY_PORT)
      .useValue(clinicalAttentionRepo)
      .overrideProvider(CLINICAL_ATTENTION_VERSION_REPOSITORY_PORT)
      .useValue(clinicalAttentionVersionRepo)
      .overrideProvider(UNIT_OF_WORK_PORT)
      .useValue({
        execute: async <T>(work: () => Promise<T>): Promise<T> => work(),
      })
      .compile();

    passwordHasher = moduleFixture.get<PasswordHasherPort>(PASSWORD_HASHER_PORT);

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const now = new Date('2026-10-16T10:00:00.000Z');
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
        email: Email.create('admin.attentions@clinica.com'),
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
        email: Email.create('auxiliary.attentions@clinica.com'),
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

    await patientRepo.save(
      Patient.create({
        id: testPatientWithoutHistoryId,
        clinicId: testClinicId,
        firstName: 'Mateo',
        lastName: 'Gomez',
        document: DocumentIdentity.create(DocumentType.CC, '99887766'),
        birthDate: new Date('2000-01-01'),
        phone: PhoneNumber.create('3112223344'),
        acquisitionSource: AcquisitionSource.DIRECT,
        dataTreatmentConsent: true,
        dataTreatmentConsentAt: now,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    await clinicalHistoryRepo.save(
      ClinicalHistory.create({
        id: testHistoryId,
        clinicId: testClinicId,
        patientId: testPatientId,
        chiefComplaint: 'Revisión y dolor dental',
        currentIllness: 'Molestia en cuadrante superior',
        medicalAntecedents: MedicalAntecedents.create({
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        }),
        clinicalExamination: 'Caries en pieza 16',
        diagnoses: [{ code: 'K02.1', description: 'Caries de la dentina' }],
        createdAt: now,
        updatedAt: now,
      }),
    );

    await materialRepo.save(
      Material.create({
        id: testMaterial1Id,
        clinicId: testClinicId,
        brand: '3M',
        reference: 'Filtek Z350',
        type: 'Resina compuesta',
        color: 'A2',
        currentStock: 4,
        minStock: 2,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    await materialRepo.save(
      Material.create({
        id: testMaterial2Id,
        clinicId: testClinicId,
        brand: 'Ivoclar',
        reference: 'Tetric N-Ceram',
        type: 'Resina compuesta',
        color: 'A1',
        currentStock: 1,
        minStock: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    await procedureRepo.save(
      Procedure.create({
        id: 'proc-res-01',
        clinicId: testClinicId,
        code: 'RES-01',
        name: 'Resina compuesta 1 superficie',
        basePrice: Money.from(80000),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    await procedureRepo.save(
      Procedure.create({
        id: 'proc-rest-01',
        clinicId: testClinicId,
        code: 'REST-01',
        name: 'Restauración integral',
        basePrice: Money.from(120000),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const adminLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin.attentions@clinica.com', password: rawPassword });
    adminAccessToken = adminLoginRes.body.accessToken;

    const auxLoginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'auxiliary.attentions@clinica.com', password: rawPassword });
    auxiliaryAccessToken = auxLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('debe permitir a ADMIN registrar y actualizar una atención con notas privadas y a AUXILIARY consultarla recibiendo privateNotes en null (201/200)', async () => {
    // 1. ADMIN crea la atención clínica con privateNotes
    const createRes = await request(app.getHttpServer())
      .post('/v1/clinical-attentions')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatientId,
        evolutionNotes: 'Se realiza apertura cavitaria y obturación con resina en pieza 16',
        prescription: 'Ibuprofeno 400mg cada 8 horas por 3 días',
        postOperativeIndications: 'Evitar alimentos duros por 24 horas',
        privateNotes: 'Paciente ansioso, cobrar saldo pendiente',
        proceduresPerformed: [{ code: 'RES-01', toothNumber: '16', surface: 'OCCLUSAL' }],
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();
    expect(createRes.body.privateNotes).toBe('Paciente ansioso, cobrar saldo pendiente');
    expect(createRes.body.evolutionNotes).toBe(
      'Se realiza apertura cavitaria y obturación con resina en pieza 16',
    );
    createdAttentionId = createRes.body.id;

    // 2. ADMIN actualiza la atención clínica
    const updateRes = await request(app.getHttpServer())
      .patch(`/v1/clinical-attentions/${createdAttentionId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        evolutionNotes: 'Se realiza apertura cavitaria, obturación con resina y pulido final',
      })
      .expect(200);

    expect(updateRes.body.evolutionNotes).toBe(
      'Se realiza apertura cavitaria, obturación con resina y pulido final',
    );
    expect(updateRes.body.privateNotes).toBe('Paciente ansioso, cobrar saldo pendiente');

    // 3. ADMIN consulta por paciente y por ID -> ve privateNotes íntegro
    const adminListRes = await request(app.getHttpServer())
      .get(`/v1/clinical-attentions/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(adminListRes.body).toHaveLength(1);
    expect(adminListRes.body[0].privateNotes).toBe('Paciente ansioso, cobrar saldo pendiente');

    const adminGetRes = await request(app.getHttpServer())
      .get(`/v1/clinical-attentions/${createdAttentionId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(adminGetRes.body.privateNotes).toBe('Paciente ansioso, cobrar saldo pendiente');

    // 4. AUXILIARY consulta por paciente y por ID -> privateNotes es estrictamente null
    const auxListRes = await request(app.getHttpServer())
      .get(`/v1/clinical-attentions/patient/${testPatientId}`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .expect(200);

    expect(auxListRes.body).toHaveLength(1);
    expect(auxListRes.body[0].privateNotes).toBeNull();
    expect(auxListRes.body[0].evolutionNotes).toBe(
      'Se realiza apertura cavitaria, obturación con resina y pulido final',
    );

    const auxGetRes = await request(app.getHttpServer())
      .get(`/v1/clinical-attentions/${createdAttentionId}`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .expect(200);

    expect(auxGetRes.body.privateNotes).toBeNull();
    expect(auxGetRes.body.evolutionNotes).toBe(
      'Se realiza apertura cavitaria, obturación con resina y pulido final',
    );
  });

  it('debe rechazar con 400 INVALID_CLINICAL_ATTENTION_DATA cuando evolutionNotes está vacío o 404 si el paciente no tiene historia clínica', async () => {
    // 1. evolutionNotes vacío -> 400
    const emptyNotesRes = await request(app.getHttpServer())
      .post('/v1/clinical-attentions')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatientId,
        evolutionNotes: '   ',
      })
      .expect(400);

    expect(emptyNotesRes.body.statusCode).toBe(400);

    // 2. Paciente sin historia clínica -> 404 CLINICAL_HISTORY_NOT_FOUND
    const noHistoryRes = await request(app.getHttpServer())
      .post('/v1/clinical-attentions')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatientWithoutHistoryId,
        evolutionNotes: 'Intento de atención sin historia previa',
      })
      .expect(404);

    expect(noHistoryRes.body.statusCode).toBe(404);
    expect(noHistoryRes.body.errorCode).toBe('CLINICAL_HISTORY_NOT_FOUND');
  });

  it('debe rechazar con 404 PROCEDURE_NOT_FOUND cuando el procedimiento no existe en el catálogo o con 400 si el diente FDI o superficie son inválidos', async () => {
    // 1. Procedimiento no existe en el catálogo -> 404 PROCEDURE_NOT_FOUND
    const procNotFoundRes = await request(app.getHttpServer())
      .post('/v1/clinical-attentions')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatientId,
        evolutionNotes: 'Atención con código inexistente',
        proceduresPerformed: [{ code: 'NO-EXISTE-999' }],
      })
      .expect(404);

    expect(procNotFoundRes.body.errorCode).toBe('PROCEDURE_NOT_FOUND');

    // 2. Diente FDI inválido -> 400 INVALID_ODONTOGRAM_DATA
    const invalidToothRes = await request(app.getHttpServer())
      .post('/v1/clinical-attentions')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatientId,
        evolutionNotes: 'Atención con diente inválido',
        proceduresPerformed: [{ code: 'RES-01', toothNumber: '99' }],
      })
      .expect(400);

    expect(invalidToothRes.body.errorCode).toBe('INVALID_ODONTOGRAM_DATA');

    // 3. Superficie inválida -> 400 INVALID_ODONTOGRAM_DATA
    const invalidSurfaceRes = await request(app.getHttpServer())
      .post('/v1/clinical-attentions')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatientId,
        evolutionNotes: 'Atención con superficie inválida',
        proceduresPerformed: [
          { code: 'RES-01', toothNumber: '16', surface: 'SUPERFICIE_INVENTADA' },
        ],
      })
      .expect(400);

    expect(invalidSurfaceRes.body.errorCode).toBe('INVALID_ODONTOGRAM_DATA');
  });

  it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta crear, editar o registrar materiales en una atención clínica', async () => {
    // 1. AUXILIARY intenta crear atención -> 403
    await request(app.getHttpServer())
      .post('/v1/clinical-attentions')
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({
        patientId: testPatientId,
        evolutionNotes: 'Intento de creación por auxiliar',
      })
      .expect(403);

    // 2. AUXILIARY intenta editar atención -> 403
    await request(app.getHttpServer())
      .patch(`/v1/clinical-attentions/${createdAttentionId}`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({
        evolutionNotes: 'Intento de edición por auxiliar',
      })
      .expect(403);

    // 3. AUXILIARY intenta registrar material -> 403
    await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${createdAttentionId}/materials`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({
        materialId: testMaterial1Id,
        quantity: 1,
      })
      .expect(403);
  });

  it('debe permitir a ADMIN registrar un material usado por diente en la atención y descontar su stock en el catálogo (201/200)', async () => {
    const addMaterialRes = await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${createdAttentionId}/materials`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        materialId: testMaterial1Id,
        quantity: 2,
        toothNumber: '16',
        notes: 'Restauración oclusal',
      })
      .expect(201);

    expect(addMaterialRes.body.materialsUsed).toHaveLength(1);
    const added = addMaterialRes.body.materialsUsed[0];
    expect(added.materialId).toBe(testMaterial1Id);
    expect(added.brand).toBe('3M');
    expect(added.reference).toBe('Filtek Z350');
    expect(added.type).toBe('Resina compuesta');
    expect(added.color).toBe('A2');
    expect(added.toothNumber).toBe('16');
    expect(added.quantity).toBe(2);
    expect(added.notes).toBe('Restauración oclusal');

    // Verificar descuento en el catálogo (de 4 pasa a 2, minStock=2 => isLowStock=true)
    const materialInDb = await materialRepo.findById(testClinicId, testMaterial1Id);
    expect(materialInDb).toBeDefined();
    expect(materialInDb!.currentStock).toBe(2);
    expect(materialInDb!.isLowStock).toBe(true);
  });

  it('debe rechazar con 422 INSUFFICIENT_MATERIAL_STOCK y revertir el registro cuando la cantidad supera el stock disponible', async () => {
    // Material 2 tiene currentStock: 1, intentamos consumir 3
    const insufficientRes = await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${createdAttentionId}/materials`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        materialId: testMaterial2Id,
        quantity: 3,
        toothNumber: '16',
      })
      .expect(422);

    expect(insufficientRes.body.statusCode).toBe(422);
    expect(insufficientRes.body.errorCode).toBe('INSUFFICIENT_MATERIAL_STOCK');

    // Verificar que el stock no fue alterado (sigue en 1)
    const material2InDb = await materialRepo.findById(testClinicId, testMaterial2Id);
    expect(material2InDb!.currentStock).toBe(1);

    // Verificar que la atención no agregó el segundo material
    const attentionInDb = await clinicalAttentionRepo.findById(testClinicId, createdAttentionId);
    expect(attentionInDb!.materialsUsed).toHaveLength(1);
    expect(attentionInDb!.materialsUsed[0].materialId).toBe(testMaterial1Id);
  });

  it('debe permitir a ADMIN cerrar una atención completa y rechazar con 422 CLINICAL_ATTENTION_CLOSED cualquier edición ordinaria posterior (200/422)', async () => {
    // ADMIN cierra la atención completa
    const closeRes = await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${createdAttentionId}/close`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(closeRes.body.id).toBe(createdAttentionId);
    expect(closeRes.body.status).toBe('CLOSED');

    // Intento de edición ordinaria sobre atención cerrada debe ser rechazado con 422 CLINICAL_ATTENTION_CLOSED
    const patchRes = await request(app.getHttpServer())
      .patch(`/v1/clinical-attentions/${createdAttentionId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        evolutionNotes: 'Intento de edición ordinaria posterior al cierre',
      })
      .expect(422);

    expect(patchRes.body.statusCode).toBe(422);
    expect(patchRes.body.errorCode).toBe('CLINICAL_ATTENTION_CLOSED');

    // Intento de agregar materiales sobre atención cerrada debe ser rechazado con 422 CLINICAL_ATTENTION_CLOSED
    const addMatRes = await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${createdAttentionId}/materials`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        materialId: testMaterial1Id,
        quantity: 1,
      })
      .expect(422);

    expect(addMatRes.body.statusCode).toBe(422);
    expect(addMatRes.body.errorCode).toBe('CLINICAL_ATTENTION_CLOSED');
  });

  let incompleteAttentionId: string;

  it('debe rechazar con 422 INCOMPLETE_CLINICAL_ATTENTION cuando se intenta cerrar una atención sin procedimientos realizados', async () => {
    // ADMIN crea una atención sin procedimientos
    const createIncompleteRes = await request(app.getHttpServer())
      .post('/v1/clinical-attentions')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        patientId: testPatientId,
        evolutionNotes: 'Atención preliminar sin procedimientos ejecutados',
        proceduresPerformed: [],
      })
      .expect(201);

    incompleteAttentionId = createIncompleteRes.body.id;

    // Intento de cerrar la atención sin procedimientos debe fallar con 422 INCOMPLETE_CLINICAL_ATTENTION
    const closeRes = await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${incompleteAttentionId}/close`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(422);

    expect(closeRes.body.statusCode).toBe(422);
    expect(closeRes.body.errorCode).toBe('INCOMPLETE_CLINICAL_ATTENTION');
  });

  it('debe permitir a ADMIN enmendar una atención cerrada conservando la versión previa y ocultando privateNotes históricas para AUXILIARY (200)', async () => {
    // ADMIN enmienda la atención cerrada creada y cerrada en pruebas anteriores
    const amendRes = await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${createdAttentionId}/amend`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        changeReason: 'Aclaración de dosis y diagnóstico post-cierre',
        evolutionNotes: 'Evolución enmendada con control de cicatrización satisfactorio',
        prescription: 'Amoxicilina 875mg cada 12 horas por 7 días',
        privateNotes: 'Nota privada enmendada y confidencial',
      })
      .expect(200);

    expect(amendRes.body.id).toBe(createdAttentionId);
    expect(amendRes.body.status).toBe('CLOSED');
    expect(amendRes.body.evolutionNotes).toBe(
      'Evolución enmendada con control de cicatrización satisfactorio',
    );
    expect(amendRes.body.prescription).toBe('Amoxicilina 875mg cada 12 horas por 7 días');
    expect(amendRes.body.privateNotes).toBe('Nota privada enmendada y confidencial');

    // ADMIN consulta las versiones históricas -> ve la nota privada intacta en previousData
    const adminVersionsRes = await request(app.getHttpServer())
      .get(`/v1/clinical-attentions/${createdAttentionId}/versions`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(adminVersionsRes.body).toHaveLength(1);
    const verAdmin = adminVersionsRes.body[0];
    expect(verAdmin.versionNumber).toBe(1);
    expect(verAdmin.changeReason).toBe('Aclaración de dosis y diagnóstico post-cierre');
    expect(verAdmin.previousData.evolutionNotes).toBe(
      'Se realiza apertura cavitaria, obturación con resina y pulido final',
    );
    expect(verAdmin.previousData.privateNotes).toBe('Paciente ansioso, cobrar saldo pendiente');

    // AUXILIARY consulta las versiones históricas -> recibe previousData.privateNotes en null
    const auxVersionsRes = await request(app.getHttpServer())
      .get(`/v1/clinical-attentions/${createdAttentionId}/versions`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .expect(200);

    expect(auxVersionsRes.body).toHaveLength(1);
    const verAux = auxVersionsRes.body[0];
    expect(verAux.versionNumber).toBe(1);
    expect(verAux.changeReason).toBe('Aclaración de dosis y diagnóstico post-cierre');
    expect(verAux.previousData.evolutionNotes).toBe(
      'Se realiza apertura cavitaria, obturación con resina y pulido final',
    );
    expect(verAux.previousData.privateNotes).toBeNull();
  });

  it('debe rechazar con 400 cuando changeReason está vacío o con 422 CLINICAL_ATTENTION_NOT_CLOSED cuando la atención sigue abierta', async () => {
    // 1. changeReason vacío en atención cerrada -> 400 Bad Request
    const emptyReasonRes = await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${createdAttentionId}/amend`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        changeReason: '',
        evolutionNotes: 'Intento con motivo vacío',
      })
      .expect(400);

    expect(emptyReasonRes.body.statusCode).toBe(400);

    // 2. enmienda sobre atención abierta (incompleteAttentionId sigue OPEN) -> 422 CLINICAL_ATTENTION_NOT_CLOSED
    const openAttentionAmendRes = await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${incompleteAttentionId}/amend`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        changeReason: 'Motivo justificado válido',
        evolutionNotes: 'Intento de enmienda sobre atención que sigue OPEN',
      })
      .expect(422);

    expect(openAttentionAmendRes.body.statusCode).toBe(422);
    expect(openAttentionAmendRes.body.errorCode).toBe('CLINICAL_ATTENTION_NOT_CLOSED');
  });

  it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta cerrar o enmendar una atención clínica', async () => {
    // AUXILIARY intenta cerrar atención -> 403 FORBIDDEN_ROLE
    const closeForbiddenRes = await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${createdAttentionId}/close`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .expect(403);

    expect(closeForbiddenRes.body.statusCode).toBe(403);
    expect(closeForbiddenRes.body.errorCode).toBe('FORBIDDEN_ROLE');

    // AUXILIARY intenta enmendar atención -> 403 FORBIDDEN_ROLE
    const amendForbiddenRes = await request(app.getHttpServer())
      .post(`/v1/clinical-attentions/${createdAttentionId}/amend`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .send({
        changeReason: 'Intento no autorizado de enmienda',
      })
      .expect(403);

    expect(amendForbiddenRes.body.statusCode).toBe(403);
    expect(amendForbiddenRes.body.errorCode).toBe('FORBIDDEN_ROLE');
  });

  it('debe permitir a ADMIN y AUXILIARY consultar el historial cronológico de materiales por diente (200)', async () => {
    // 1. ADMIN consulta los materiales del diente 16
    const resAdmin = await request(app.getHttpServer())
      .get(`/v1/clinical-attentions/patient/${testPatientId}/tooth/16/materials`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(Array.isArray(resAdmin.body)).toBe(true);
    expect(resAdmin.body.length).toBeGreaterThanOrEqual(1);
    const item = resAdmin.body[0];
    expect(item.toothNumber).toBe('16');
    expect(item.materialId).toBe(testMaterial1Id);
    expect(item.brand).toBe('3M');
    expect(item.reference).toBe('Filtek Z350');
    expect(item.quantity).toBe(2);

    // 2. AUXILIARY consulta los materiales del diente 16 (permitido por rol)
    const resAux = await request(app.getHttpServer())
      .get(`/v1/clinical-attentions/patient/${testPatientId}/tooth/16/materials`)
      .set('Authorization', `Bearer ${auxiliaryAccessToken}`)
      .expect(200);

    expect(resAux.body).toHaveLength(resAdmin.body.length);

    // 3. Validación de número de diente inválido -> 400
    const resInvalidTooth = await request(app.getHttpServer())
      .get(`/v1/clinical-attentions/patient/${testPatientId}/tooth/99/materials`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(400);

    expect(resInvalidTooth.body.errorCode).toBe('INVALID_ODONTOGRAM_DATA');
  });
});
