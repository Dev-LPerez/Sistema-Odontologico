import { Patient } from '../../domain/patient.entity';
import { DocumentIdentity } from '../../domain/document-identity.vo';
import { PhoneNumber } from '../../domain/phone-number.vo';
import { EmergencyContact } from '../../domain/emergency-contact.vo';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';
import { PatientRepositoryPort } from '../../domain/patient.repository.port';
import { InMemoryPatientRepository } from './in-memory-patient.repository';
import { PrismaPatientRepository } from './prisma-patient.repository';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { DuplicatePatientDocumentError } from '../../domain/patients.errors';

interface RepositoryFactory {
  name: string;
  createRepo: () => {
    repo: PatientRepositoryPort;
    cleanup?: () => Promise<void>;
  };
}

describe('Patients Repository Contract Tests (RC-018)', () => {
  const fixedNow = new Date('2026-10-14T10:00:00.000Z');
  const realPrisma = new PrismaService();

  beforeAll(async () => {
    await realPrisma.$connect();
  });

  afterAll(async () => {
    await cleanDb();
    await realPrisma.$disconnect();
  });

  const cleanDb = async () => {
    await realPrisma.patientProcedurePrice.deleteMany();
    await realPrisma.procedure.deleteMany();
    await realPrisma.material.deleteMany();
    await realPrisma.patient.deleteMany();
    await realPrisma.refreshSession.deleteMany();
    await realPrisma.user.deleteMany();
    await realPrisma.clinic.deleteMany();
  };

  const ensurePrerequisiteClinics = async () => {
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-1' },
      create: { id: 'clinic-1', name: 'Clínica Uno' },
      update: {},
    });
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-2' },
      create: { id: 'clinic-2', name: 'Clínica Dos' },
      update: {},
    });
  };

  const inMemoryRepo = new InMemoryPatientRepository();
  const prismaRepo = new PrismaPatientRepository(realPrisma);

  const factories: RepositoryFactory[] = [
    {
      name: 'InMemoryPatientRepository',
      createRepo: () => ({
        repo: inMemoryRepo,
        cleanup: async () => inMemoryRepo.clear(),
      }),
    },
    {
      name: 'PrismaPatientRepository',
      createRepo: () => ({
        repo: prismaRepo,
        cleanup: async () => {
          await cleanDb();
          await ensurePrerequisiteClinics();
        },
      }),
    },
  ];

  factories.forEach(({ name, createRepo }) => {
    describe(`Implementation: ${name}`, () => {
      let repo: PatientRepositoryPort;
      let cleanup: (() => Promise<void>) | undefined;

      beforeEach(async () => {
        const fixture = createRepo();
        repo = fixture.repo;
        cleanup = fixture.cleanup;
        if (cleanup) await cleanup();
      });

      afterEach(async () => {
        if (cleanup) await cleanup();
      });

      const createTestPatient = (overrides?: Partial<Parameters<typeof Patient.create>[0]>) => {
        return Patient.create({
          id: 'patient-test-1',
          clinicId: 'clinic-1',
          firstName: 'Juan',
          lastName: 'Pérez',
          document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
          birthDate: new Date('1992-03-10T00:00:00.000Z'),
          phone: PhoneNumber.create('3001234567'),
          email: 'juan@example.com',
          address: 'Calle 10 # 20-30',
          emergencyContact: EmergencyContact.create(
            'Laura Pérez',
            PhoneNumber.create('3105556677'),
          ),
          acquisitionSource: AcquisitionSource.INSTAGRAM,
          dataTreatmentConsent: true,
          dataTreatmentConsentAt: fixedNow,
          isActive: true,
          createdAt: fixedNow,
          updatedAt: fixedNow,
          ...overrides,
        });
      };

      it('debe guardar un paciente y recuperarlo por ID dentro del mismo consultorio', async () => {
        const patient = createTestPatient();
        await repo.save(patient);

        const found = await repo.findById('clinic-1', 'patient-test-1');
        expect(found).not.toBeNull();
        expect(found?.id).toBe('patient-test-1');
        expect(found?.clinicId).toBe('clinic-1');
        expect(found?.firstName).toBe('Juan');
        expect(found?.document.number).toBe('1020304050');
        expect(found?.phone.value).toBe('3001234567');
      });

      it('debe respetar el aislamiento multitenant y no encontrar un paciente con clinicId diferente', async () => {
        const patient = createTestPatient();
        await repo.save(patient);

        const foundInOtherClinic = await repo.findById('clinic-2', 'patient-test-1');
        expect(foundInOtherClinic).toBeNull();
      });

      it('debe buscar por documento (tipo y número) dentro del mismo consultorio', async () => {
        const patient = createTestPatient();
        await repo.save(patient);

        const found = await repo.findByDocument('clinic-1', DocumentType.CC, '1020304050');
        expect(found).not.toBeNull();
        expect(found?.id).toBe('patient-test-1');

        const notFoundDiffClinic = await repo.findByDocument(
          'clinic-2',
          DocumentType.CC,
          '1020304050',
        );
        expect(notFoundDiffClinic).toBeNull();

        const notFoundDiffType = await repo.findByDocument(
          'clinic-1',
          DocumentType.TI,
          '1020304050',
        );
        expect(notFoundDiffType).toBeNull();
      });

      it('debe encontrar duplicados potenciales por documento o teléfono con excludePatientId', async () => {
        const patient1 = createTestPatient({
          id: 'patient-1',
          document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
          phone: PhoneNumber.create('3001234567'),
        });
        const patient2 = createTestPatient({
          id: 'patient-2',
          document: DocumentIdentity.create(DocumentType.TI, '9988776655'),
          phone: PhoneNumber.create('3001234567'),
        });
        await repo.save(patient1);
        await repo.save(patient2);

        const dupPhone = await repo.findPotentialDuplicates('clinic-1', {
          phone: '3001234567',
        });
        expect(dupPhone).toHaveLength(2);

        const dupExcludingP1 = await repo.findPotentialDuplicates('clinic-1', {
          phone: '3001234567',
          excludePatientId: 'patient-1',
        });
        expect(dupExcludingP1).toHaveLength(1);
        expect(dupExcludingP1[0].id).toBe('patient-2');
      });

      it('debe listar pacientes de un consultorio y filtrar por estado isActive', async () => {
        const activePatient = createTestPatient({ id: 'p-active', isActive: true });
        const inactivePatient = createTestPatient({
          id: 'p-inactive',
          document: DocumentIdentity.create(DocumentType.CC, '5555555555'),
          isActive: false,
        });
        await repo.save(activePatient);
        await repo.save(inactivePatient);

        const all = await repo.findAllByClinicId('clinic-1');
        expect(all).toHaveLength(2);

        const activesOnly = await repo.findAllByClinicId('clinic-1', { isActive: true });
        expect(activesOnly).toHaveLength(1);
        expect(activesOnly[0].id).toBe('p-active');

        const inactivesOnly = await repo.findAllByClinicId('clinic-1', { isActive: false });
        expect(inactivesOnly).toHaveLength(1);
        expect(inactivesOnly[0].id).toBe('p-inactive');
      });

      it('debe lanzar DuplicatePatientDocumentError (409) cuando dos registros distintos chocan en el índice único de documento (P2002)', async () => {
        const patient1 = createTestPatient({
          id: 'p-dup-1',
          document: DocumentIdentity.create(DocumentType.CC, '777888999'),
        });
        const patient2 = createTestPatient({
          id: 'p-dup-2',
          document: DocumentIdentity.create(DocumentType.CC, '777888999'),
        });

        await repo.save(patient1);
        await expect(repo.save(patient2)).rejects.toThrow(DuplicatePatientDocumentError);
      });

      it('debe impedir el borrado físico de un consultorio que tiene pacientes registrados (onDelete: Restrict, RF-B-010, RC-055)', async () => {
        if (name === 'PrismaPatientRepository') {
          const patient = createTestPatient({ id: 'p-restrict-1', clinicId: 'clinic-1' });
          await repo.save(patient);

          // En PostgreSQL real, la clave foránea ON DELETE RESTRICT debe bloquear la eliminación
          await expect(realPrisma.clinic.delete({ where: { id: 'clinic-1' } })).rejects.toThrow();
        }
      });
    });
  });
});
