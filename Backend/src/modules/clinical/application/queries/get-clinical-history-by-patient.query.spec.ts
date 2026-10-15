import { GetClinicalHistoryByPatientQuery } from './get-clinical-history-by-patient.query';
import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { MedicalAntecedents } from '../../domain/medical-antecedents.vo';

describe('GetClinicalHistoryByPatientQuery', () => {
  let query: GetClinicalHistoryByPatientQuery;
  let historyRepo: jest.Mocked<ClinicalHistoryRepositoryPort>;

  const fixedDate = new Date('2026-10-15T09:00:00.000Z');

  beforeEach(() => {
    historyRepo = {
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      save: jest.fn(),
    };

    query = new GetClinicalHistoryByPatientQuery(historyRepo);
  });

  it('debe obtener la historia clínica por patientId y clinicId', async () => {
    const history = ClinicalHistory.create({
      id: 'hist-1',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor en molar',
      currentIllness: 'Caries aguda',
      medicalAntecedents: MedicalAntecedents.create({
        hypertension: false,
        diabetes: false,
        allergies: false,
        medications: false,
        bleedingDisorders: false,
        pregnancy: false,
      }),
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });

    historyRepo.findByPatientId.mockResolvedValue(history);

    const result = await query.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
    });

    expect(result).toBe(history);
    expect(historyRepo.findByPatientId).toHaveBeenCalledWith('clinic-123', 'patient-123');
  });

  it('debe lanzar ClinicalHistoryNotFoundError si la historia clínica no existe', async () => {
    historyRepo.findByPatientId.mockResolvedValue(null);

    await expect(
      query.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-inexistente',
      }),
    ).rejects.toThrow(ClinicalHistoryNotFoundError);
  });
});
