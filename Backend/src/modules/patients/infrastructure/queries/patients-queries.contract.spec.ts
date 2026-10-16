import { Prisma } from '@prisma/client';
import { Patient } from '../../domain/patient.entity';
import { DocumentIdentity } from '../../domain/document-identity.vo';
import { PhoneNumber } from '../../domain/phone-number.vo';
import { EmergencyContact } from '../../domain/emergency-contact.vo';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';
import { PatientQueriesPort } from '../../application/ports/patient.queries.port';
import { InMemoryPatientQueriesAdapter } from './in-memory-patient.queries';
import { PrismaPatientQueriesAdapter } from './prisma-patient.queries';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { PatientMapper } from '../mappers/patient.mapper';

interface QueriesAdapterFactory {
  name: string;
  createAdapter: () => {
    adapter: PatientQueriesPort;
    savePatient: (patient: Patient) => Promise<void>;
    bulkInsert?: (patients: Patient[]) => Promise<void>;
    clear: () => Promise<void>;
  };
}

describe('Patients Queries Contract Tests (RC-018, RC-031)', () => {
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
    await realPrisma.treatmentPlanItem.deleteMany();
    await realPrisma.clinicalHistory.deleteMany();
    await realPrisma.patientProcedurePrice.deleteMany();
    await realPrisma.procedure.deleteMany();
    await realPrisma.material.deleteMany();
    await realPrisma.odontogramSnapshot.deleteMany();
    await realPrisma.odontogram.deleteMany();
    await realPrisma.patient.deleteMany();
    await realPrisma.refreshSession.deleteMany();
    await realPrisma.user.deleteMany();
    await realPrisma.clinic.deleteMany();
  };

  const ensureClinics = async () => {
    await realPrisma.clinic.upsert({
      where: { id: 'clinic-123' },
      create: { id: 'clinic-123', name: 'Clínica 123' },
      update: {},
    });
    await realPrisma.clinic.upsert({
      where: { id: 'other-clinic-999' },
      create: { id: 'other-clinic-999', name: 'Otra Clínica' },
      update: {},
    });
  };

  const inMemoryAdapter = new InMemoryPatientQueriesAdapter();
  const prismaAdapter = new PrismaPatientQueriesAdapter(realPrisma);

  const factories: QueriesAdapterFactory[] = [
    {
      name: 'InMemoryPatientQueriesAdapter',
      createAdapter: () => ({
        adapter: inMemoryAdapter,
        savePatient: async (patient: Patient) => {
          inMemoryAdapter.save(patient);
        },
        bulkInsert: async (patients: Patient[]) => {
          for (const p of patients) {
            inMemoryAdapter.save(p);
          }
        },
        clear: async () => {
          inMemoryAdapter.clear();
        },
      }),
    },
    {
      name: 'PrismaPatientQueriesAdapter',
      createAdapter: () => ({
        adapter: prismaAdapter,
        savePatient: async (patient: Patient) => {
          const data = PatientMapper.toPersistence(patient);
          await realPrisma.patient.upsert({
            where: { id: patient.id },
            create: data,
            update: data,
          });
        },
        bulkInsert: async (patients: Patient[]) => {
          const raw = patients.map((p) => PatientMapper.toPersistence(p));
          for (let i = 0; i < raw.length; i += 2000) {
            await realPrisma.patient.createMany({
              data: raw.slice(i, i + 2000),
            });
          }
        },
        clear: async () => {
          await cleanDb();
          await ensureClinics();
        },
      }),
    },
  ];

  const buildPatient = (overrides?: Partial<Parameters<typeof Patient.create>[0]>): Patient => {
    return Patient.create({
      id: 'patient-default-id',
      clinicId: 'clinic-123',
      firstName: 'Carlos',
      lastName: 'Gómez',
      document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
      birthDate: new Date('1990-05-15T00:00:00.000Z'),
      phone: PhoneNumber.create('3001234567'),
      email: 'carlos@example.com',
      address: 'Calle 10 # 20-30',
      emergencyContact: EmergencyContact.create('María Gómez', PhoneNumber.create('3109876543')),
      acquisitionSource: AcquisitionSource.DIRECT,
      dataTreatmentConsent: true,
      dataTreatmentConsentAt: fixedNow,
      isActive: true,
      createdAt: fixedNow,
      updatedAt: fixedNow,
      ...overrides,
    });
  };

  factories.forEach(({ name, createAdapter }) => {
    describe(`Implementation: ${name}`, () => {
      let adapter: PatientQueriesPort;
      let savePatient: (patient: Patient) => Promise<void>;
      let bulkInsert: ((patients: Patient[]) => Promise<void>) | undefined;
      let clear: () => Promise<void>;

      beforeEach(async () => {
        const fixture = createAdapter();
        adapter = fixture.adapter;
        savePatient = fixture.savePatient;
        bulkInsert = fixture.bulkInsert;
        clear = fixture.clear;
        await clear();
      });

      afterEach(async () => {
        await clear();
      });

      it('debe encontrar pacientes por nombre tolerando errores tipográficos y omisión de tildes ordenando por relevancia dentro del mismo clinicId', async () => {
        const patientClinic1 = buildPatient({
          id: 'patient-1',
          clinicId: 'clinic-123',
          firstName: 'Carlos',
          lastName: 'Gómez',
        });
        const patientOtherClinic = buildPatient({
          id: 'patient-2',
          clinicId: 'other-clinic-999',
          firstName: 'Carlos',
          lastName: 'Gómez',
        });
        const patientRandom = buildPatient({
          id: 'patient-3',
          clinicId: 'clinic-123',
          firstName: 'Andrés',
          lastName: 'Castro',
          document: DocumentIdentity.create(DocumentType.CC, '9988776655'),
          phone: PhoneNumber.create('3159998877'),
        });
        const patientTildes = buildPatient({
          id: 'patient-tildes',
          clinicId: 'clinic-123',
          firstName: 'Inés',
          lastName: 'Martínez',
          document: DocumentIdentity.create(DocumentType.CC, '4455667788'),
          phone: PhoneNumber.create('3112223344'),
        });

        await savePatient(patientClinic1);
        await savePatient(patientOtherClinic);
        await savePatient(patientRandom);
        await savePatient(patientTildes);

        const results = await adapter.searchByTrigram({
          clinicId: 'clinic-123',
          query: 'Carls Gomz',
          limit: 20,
        });

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].id).toBe('patient-1');
        expect(results[0].clinicId).toBe('clinic-123');
        expect(results[0].firstName).toBe('Carlos');
        expect(results[0].lastName).toBe('Gómez');
        expect(results.some((r) => r.id === 'patient-2')).toBe(false);

        // Búsqueda omitiendo tildes ("Ines" -> "Inés Martínez")
        const resultsTildes = await adapter.searchByTrigram({
          clinicId: 'clinic-123',
          query: 'Ines',
          limit: 20,
        });
        expect(resultsTildes.some((r) => r.id === 'patient-tildes')).toBe(true);
      });

      it('debe encontrar pacientes por fragmento de documento o teléfono normalizando guiones y espacios', async () => {
        const patient = buildPatient({
          id: 'patient-doc-phone',
          clinicId: 'clinic-123',
          document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
          phone: PhoneNumber.create('3001234567'),
        });
        await savePatient(patient);

        const resultsByDoc = await adapter.searchByTrigram({
          clinicId: 'clinic-123',
          query: '102030',
          normalizedDigits: '102030',
          limit: 20,
        });

        expect(resultsByDoc.length).toBe(1);
        expect(resultsByDoc[0].id).toBe('patient-doc-phone');

        const resultsByPhone = await adapter.searchByTrigram({
          clinicId: 'clinic-123',
          query: '300-123',
          normalizedDigits: '300123',
          limit: 20,
        });

        expect(resultsByPhone.length).toBe(1);
        expect(resultsByPhone[0].id).toBe('patient-doc-phone');
      });

      it('debe excluir pacientes inactivos por defecto e incluirlos cuando includeInactive es true', async () => {
        const inactivePatient = buildPatient({
          id: 'patient-inactive',
          clinicId: 'clinic-123',
          firstName: 'Laura',
          lastName: 'Martínez',
          isActive: false,
        });
        await savePatient(inactivePatient);

        const defaultResults = await adapter.searchByTrigram({
          clinicId: 'clinic-123',
          query: 'Laura',
          includeInactive: false,
          limit: 20,
        });

        expect(defaultResults.find((p) => p.id === 'patient-inactive')).toBeUndefined();

        const withInactiveResults = await adapter.searchByTrigram({
          clinicId: 'clinic-123',
          query: 'Laura',
          includeInactive: true,
          limit: 20,
        });

        const found = withInactiveResults.find((p) => p.id === 'patient-inactive');
        expect(found).toBeDefined();
        expect(found?.isActive).toBe(false);
      });

      it('debe responder en menos de 300 ms sobre 10.000 pacientes reales y usar Bitmap Index Scan sobre el índice GIN en EXPLAIN ANALYZE (RNF-B-031, RC-031)', async () => {
        const syntheticBatch: Patient[] = [];
        for (let i = 0; i < 10000; i++) {
          const synth = Patient.create({
            id: `synth-${i}`,
            clinicId: 'clinic-123',
            firstName: i === 5000 ? 'Carlos' : `Paciente${i}`,
            lastName: i === 5000 ? 'Gómez' : `Apellido${i}`,
            document: DocumentIdentity.create(
              DocumentType.CC,
              `900000${i.toString().padStart(5, '0')}`,
            ),
            birthDate: new Date('1995-01-01T00:00:00.000Z'),
            phone: PhoneNumber.create(`300${i.toString().padStart(7, '0')}`),
            email: `synth${i}@example.com`,
            address: `Calle ${i} # 1-2`,
            emergencyContact: null,
            acquisitionSource: AcquisitionSource.DIRECT,
            dataTreatmentConsent: true,
            dataTreatmentConsentAt: fixedNow,
            isActive: true,
            createdAt: fixedNow,
            updatedAt: fixedNow,
          });
          syntheticBatch.push(synth);
        }

        if (bulkInsert) {
          await bulkInsert(syntheticBatch);
        } else {
          for (const p of syntheticBatch) {
            await savePatient(p);
          }
        }

        const start = Date.now();
        const results = await adapter.searchByTrigram({
          clinicId: 'clinic-123',
          query: 'Carls Gomz',
          limit: 20,
        });
        const elapsedMs = Date.now() - start;

        expect(elapsedMs).toBeLessThan(300);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].id).toBe('synth-5000');
        expect(results[0].firstName).toBe('Carlos');
        expect(results[0].lastName).toBe('Gómez');

        if (name === 'PrismaPatientQueriesAdapter') {
          await realPrisma.$executeRawUnsafe('ANALYZE patients;');
          const plan = await realPrisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>(
            Prisma.sql`EXPLAIN ANALYZE SELECT p.id FROM patients p WHERE immutable_unaccent(p.first_name || ' ' || p.last_name) %> 'Carls';`,
          );
          const planText = plan.map((row) => row['QUERY PLAN']).join('\n');
          expect(planText).toContain('patients_full_name_unaccent_trgm_idx');
        }
      }, 30000);
    });
  });
});
