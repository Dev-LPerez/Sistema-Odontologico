import { ListClinicalHistoryVersionsQuery } from './list-clinical-history-versions.query';
import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import { ClinicalHistoryVersionRepositoryPort } from '../../domain/clinical-history-version.repository.port';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { ClinicalHistoryVersion } from '../../domain/clinical-history-version.entity';
import { MedicalAntecedents } from '../../domain/medical-antecedents.vo';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';

describe('ListClinicalHistoryVersionsQuery', () => {
  let query: ListClinicalHistoryVersionsQuery;
  let historyRepo: jest.Mocked<ClinicalHistoryRepositoryPort>;
  let versionRepo: jest.Mocked<ClinicalHistoryVersionRepositoryPort>;

  const fixedNow = new Date('2026-10-16T10:00:00.000Z');

  beforeEach(() => {
    historyRepo = {
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      save: jest.fn(),
    };

    versionRepo = {
      findAllByHistoryId: jest.fn(),
      save: jest.fn(),
    };

    query = new ListClinicalHistoryVersionsQuery(historyRepo, versionRepo);
  });

  const createHistory = () =>
    ClinicalHistory.create({
      id: 'hist-1',
      clinicId: 'clinic-123',
      patientId: 'pat-1',
      chiefComplaint: 'Dolor actual',
      currentIllness: 'Evolución satisfactoria',
      medicalAntecedents: MedicalAntecedents.create({
        hypertension: false,
        diabetes: false,
        allergies: false,
        medications: false,
        bleedingDisorders: false,
        pregnancy: false,
      }),
      diagnoses: [],
      treatmentItems: [],
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

  const createVersion = (versionNumber: number) =>
    ClinicalHistoryVersion.create({
      id: `ver-${versionNumber}`,
      clinicId: 'clinic-123',
      clinicalHistoryId: 'hist-1',
      versionNumber,
      previousData: {
        chiefComplaint: `Dolor versión ${versionNumber}`,
        currentIllness: `Enfermedad versión ${versionNumber}`,
        personalAntecedents: {},
        familyAntecedents: null,
        clinicalExamination: null,
        diagnoses: [],
        treatmentItems: [],
        updatedAt: fixedNow.toISOString(),
      },
      changeReason: `Motivo versión ${versionNumber}`,
      updatedByUserId: 'usr-admin-1',
      createdAt: fixedNow,
    });

  it('debe listar versiones ordenadas por versionNumber ascendentemente', async () => {
    historyRepo.findByPatientId.mockResolvedValue(createHistory());
    versionRepo.findAllByHistoryId.mockResolvedValue([createVersion(2), createVersion(1)]);

    const result = await query.execute({
      clinicId: 'clinic-123',
      patientId: 'pat-1',
    });

    expect(result).toHaveLength(2);
    expect(result[0].versionNumber).toBe(1);
    expect(result[1].versionNumber).toBe(2);
  });

  it('debe lanzar ClinicalHistoryNotFoundError si la historia no existe o pertenece a otra clínica', async () => {
    historyRepo.findByPatientId.mockResolvedValue(null);

    await expect(
      query.execute({
        clinicId: 'clinic-123',
        patientId: 'pat-nonexistent',
      }),
    ).rejects.toThrow(ClinicalHistoryNotFoundError);
  });
});
