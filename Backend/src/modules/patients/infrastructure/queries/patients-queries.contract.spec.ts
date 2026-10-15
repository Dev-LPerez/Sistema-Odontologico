import { Patient as PrismaPatient } from '@prisma/client';
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
import {
  normalizeText,
  extractTrigrams,
  extractTrigramsFromNormalized,
  calculateTrigramSimilarity,
} from './trigram-similarity.util';
import { PatientMapper } from '../mappers/patient.mapper';

interface QueriesAdapterFactory {
  name: string;
  createAdapter: () => {
    adapter: PatientQueriesPort;
    savePatient: (patient: Patient) => void;
    clear: () => void;
  };
}

interface ParsedQueryOptions {
  clinicId: string;
  queryStr: string;
  digits: string;
  limit: number;
  onlyActive: boolean;
}

interface SqlLikeInput {
  strings?: string[];
  values?: unknown[];
}

function parseSqlInput(input: unknown, rest: unknown[]): { strings: string[]; values: unknown[] } {
  if (
    input &&
    typeof input === 'object' &&
    'strings' in input &&
    Array.isArray((input as SqlLikeInput).strings)
  ) {
    const typed = input as SqlLikeInput;
    return { strings: typed.strings ?? [], values: typed.values ?? [] };
  }
  if (Array.isArray(input)) {
    return { strings: input as string[], values: rest };
  }
  return { strings: [], values: [] };
}

function extractQueryOptions(strings: string[], values: unknown[]): ParsedQueryOptions {
  const fullSql = strings.join(' ? ');
  const onlyActive = fullSql.includes('p.is_active = true');
  const queryStr = String(values[0] ?? '');

  let clinicId = '';
  for (let i = 0; i < strings.length; i++) {
    if (strings[i].includes('clinic_id =')) {
      clinicId = String(values[i]);
      break;
    }
  }

  let digits = '';
  for (let i = 0; i < strings.length; i++) {
    if (strings[i].includes('document_number ILIKE')) {
      const val = String(values[i]);
      digits = val.replace(/%/g, '');
      break;
    }
  }

  let limit = 20;
  for (let i = values.length - 1; i >= 0; i--) {
    if (typeof values[i] === 'number') {
      limit = values[i] as number;
      break;
    }
  }

  return { clinicId, queryStr, digits, limit, onlyActive };
}

function calculateRecordScore(
  record: PrismaPatient,
  normQuery: string,
  queryTrigrams: Set<string>,
  digits: string,
): number {
  const normFirstName = normalizeText(record.firstName);
  const normLastName = normalizeText(record.lastName);
  const normFullName = `${normFirstName} ${normLastName}`;

  let digitMatchBonus = 0;
  if (digits) {
    const rawPhoneDigits = record.phone.replace(/\D/g, '');
    if (record.documentNumber.includes(digits) || rawPhoneDigits.includes(digits)) {
      digitMatchBonus = 0.8;
    }
  }

  let subMatchBonus = 0;
  if (normFullName.includes(normQuery) || normQuery.includes(normFullName)) {
    subMatchBonus = 0.6;
  } else if (normFirstName.includes(normQuery) || normLastName.includes(normQuery)) {
    subMatchBonus = 0.5;
  }

  const fullTrigrams = extractTrigramsFromNormalized(normFullName);
  const simFullName = calculateTrigramSimilarity(fullTrigrams, queryTrigrams);

  let simFirstName = 0;
  let simLastName = 0;
  if (simFullName > 0 && simFullName < 0.5) {
    simFirstName = calculateTrigramSimilarity(
      extractTrigramsFromNormalized(normFirstName),
      queryTrigrams,
    );
    simLastName = calculateTrigramSimilarity(
      extractTrigramsFromNormalized(normLastName),
      queryTrigrams,
    );
  }

  return Math.max(simFullName, simFirstName, simLastName, subMatchBonus, digitMatchBonus);
}

describe('Patients Queries Contract Tests (RC-018, RC-031)', () => {
  const fixedNow = new Date('2026-10-14T10:00:00.000Z');

  const createMockPrismaForQueries = () => {
    const store = new Map<string, PrismaPatient>();

    const mockPrisma = {
      client: {
        $queryRaw: jest.fn(async (input: unknown, ...rest: unknown[]) => {
          const { strings, values } = parseSqlInput(input, rest);
          const { clinicId, queryStr, digits, limit, onlyActive } = extractQueryOptions(
            strings,
            values,
          );

          const normQuery = normalizeText(queryStr);
          const queryTrigrams = extractTrigrams(queryStr);

          const candidates = Array.from(store.values()).filter((p) => p.clinicId === clinicId);
          const scored: Array<{ record: PrismaPatient; score: number }> = [];

          for (const record of candidates) {
            if (onlyActive && !record.isActive) {
              continue;
            }

            const score = calculateRecordScore(record, normQuery, queryTrigrams, digits);
            if (score >= 0.25) {
              scored.push({ record, score });
            }
          }

          scored.sort((a, b) => {
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            return b.record.createdAt.getTime() - a.record.createdAt.getTime();
          });

          return scored.slice(0, limit).map(({ record, score }) => ({
            id: record.id,
            clinicId: record.clinicId,
            firstName: record.firstName,
            lastName: record.lastName,
            documentType: record.documentType,
            documentNumber: record.documentNumber,
            birthDate: record.birthDate,
            phone: record.phone,
            email: record.email,
            address: record.address,
            emergencyContactName: record.emergencyContactName,
            emergencyContactPhone: record.emergencyContactPhone,
            acquisitionSource: record.acquisitionSource,
            dataTreatmentConsent: record.dataTreatmentConsent,
            dataTreatmentConsentAt: record.dataTreatmentConsentAt,
            isActive: record.isActive,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            similarityScore: score,
          }));
        }),
      },
    };

    return {
      service: mockPrisma as unknown as PrismaService,
      save: (patient: Patient) => {
        const raw = PatientMapper.toPersistence(patient);
        store.set(patient.id, raw as unknown as PrismaPatient);
      },
      clear: () => store.clear(),
    };
  };

  const inMemoryQueries = new InMemoryPatientQueriesAdapter();
  const mockPrismaContext = createMockPrismaForQueries();
  const prismaQueries = new PrismaPatientQueriesAdapter(mockPrismaContext.service);

  const factories: QueriesAdapterFactory[] = [
    {
      name: 'InMemoryPatientQueriesAdapter',
      createAdapter: () => ({
        adapter: inMemoryQueries,
        savePatient: (patient: Patient) => inMemoryQueries.save(patient),
        clear: () => inMemoryQueries.clear(),
      }),
    },
    {
      name: 'PrismaPatientQueriesAdapter',
      createAdapter: () => ({
        adapter: prismaQueries,
        savePatient: (patient: Patient) => mockPrismaContext.save(patient),
        clear: () => mockPrismaContext.clear(),
      }),
    },
  ];

  const buildPatient = (overrides?: Partial<Parameters<typeof Patient.create>[0]>) => {
    return Patient.create({
      id: 'patient-test-1',
      clinicId: 'clinic-123',
      firstName: 'Carlos',
      lastName: 'Gómez',
      document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
      birthDate: new Date('1990-05-15T00:00:00.000Z'),
      phone: PhoneNumber.create('3001234567'),
      email: 'carlos@example.com',
      address: 'Calle 100 # 15-20',
      emergencyContact: EmergencyContact.create('María Gómez', PhoneNumber.create('3109876543')),
      acquisitionSource: AcquisitionSource.INSTAGRAM,
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
      let savePatient: (patient: Patient) => void;
      let clear: () => void;

      beforeEach(() => {
        const fixture = createAdapter();
        adapter = fixture.adapter;
        savePatient = fixture.savePatient;
        clear = fixture.clear;
        clear();
      });

      afterEach(() => {
        clear();
      });

      it('debe encontrar pacientes por nombre tolerando errores tipográficos y ordenando por relevancia dentro del mismo clinicId', async () => {
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

        savePatient(patientClinic1);
        savePatient(patientOtherClinic);
        savePatient(patientRandom);

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
      });

      it('debe encontrar pacientes por fragmento de documento o teléfono normalizando guiones y espacios', async () => {
        const patient = buildPatient({
          id: 'patient-doc-phone',
          clinicId: 'clinic-123',
          document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
          phone: PhoneNumber.create('3001234567'),
        });
        savePatient(patient);

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
        savePatient(inactivePatient);

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

      it('debe responder en menos de 300 ms al buscar sobre 10.000 pacientes sintéticos (RNF-B-031, RC-031)', async () => {
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
          savePatient(synth);
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
      });
    });
  });
});
