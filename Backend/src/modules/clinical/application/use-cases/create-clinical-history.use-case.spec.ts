import { CreateClinicalHistoryUseCase } from './create-clinical-history.use-case';
import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import { PatientRepositoryPort, PatientNotFoundError, Patient } from '../../../patients';
import { DuplicateClinicalHistoryError } from '../../domain/clinical.errors';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { MedicalAntecedents } from '../../domain/medical-antecedents.vo';

describe('CreateClinicalHistoryUseCase', () => {
  let useCase: CreateClinicalHistoryUseCase;
  let historyRepo: jest.Mocked<ClinicalHistoryRepositoryPort>;
  let patientRepo: jest.Mocked<PatientRepositoryPort>;
  let clock: jest.Mocked<ClockPort>;
  let idGen: jest.Mocked<IdGeneratorPort>;

  const fixedDate = new Date('2026-10-15T10:00:00.000Z');

  beforeEach(() => {
    historyRepo = {
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      save: jest.fn(),
    };
    patientRepo = {
      findById: jest.fn(),
      findByDocument: jest.fn(),
      findPotentialDuplicates: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };
    clock = {
      now: jest.fn().mockReturnValue(fixedDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15T10:00:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    idGen = {
      generate: jest.fn().mockReturnValue('gen-hist-id-123'),
    };

    useCase = new CreateClinicalHistoryUseCase(historyRepo, patientRepo, clock, idGen);
  });

  it('debe crear, actualizar y consultar la historia clínica con antecedentes y diagnósticos aislando por clinicId', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'patient-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);
    historyRepo.findByPatientId.mockResolvedValue(null);

    const command = {
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor dental agudo',
      currentIllness: 'Molestia desde hace 2 días',
      personalAntecedents: {
        hypertension: false,
        diabetes: false,
        allergies: true,
        allergiesDetails: 'Penicilina',
        medications: false,
        medicationsDetails: null,
        bleedingDisorders: false,
        pregnancy: false,
        otherNotes: null,
      },
      familyAntecedents: 'Padre hipertenso',
      clinicalExamination: 'Caries en diente 16',
      diagnoses: [{ code: 'K02.1', description: 'Caries de la dentina' }],
    };

    const result = await useCase.execute(command);

    expect(result).toBeDefined();
    expect(result.id).toBe('gen-hist-id-123');
    expect(result.clinicId).toBe('clinic-123');
    expect(result.patientId).toBe('patient-123');
    expect(result.chiefComplaint).toBe('Dolor dental agudo');
    expect(result.medicalAntecedents.allergies).toBe(true);
    expect(result.medicalAntecedents.allergiesDetails).toBe('Penicilina');
    expect(result.medicalAntecedents.familyAntecedents).toBe('Padre hipertenso');
    expect(historyRepo.save).toHaveBeenCalledTimes(1);
    expect(historyRepo.save).toHaveBeenCalledWith(expect.any(ClinicalHistory));
  });

  it('debe lanzar DuplicateClinicalHistoryError (409) cuando el paciente ya tiene historia clínica en el consultorio (P2002)', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'patient-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);
    const existingHistory = ClinicalHistory.create({
      id: 'existing-id',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Previo',
      currentIllness: 'Previo',
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
    historyRepo.findByPatientId.mockResolvedValue(existingHistory);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-123',
        chiefComplaint: 'Nueva consulta',
        currentIllness: 'Nueva enfermedad',
        personalAntecedents: {
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        },
      }),
    ).rejects.toThrow(DuplicateClinicalHistoryError);
  });

  it('debe lanzar PatientNotFoundError cuando el paciente no existe en el consultorio', async () => {
    patientRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-inexistente',
        chiefComplaint: 'Dolor',
        currentIllness: 'Molestia',
        personalAntecedents: {
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        },
      }),
    ).rejects.toThrow(PatientNotFoundError);
  });

  it('debe lanzar PatientNotFoundError cuando el paciente pertenece a otra clínica', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'patient-123',
      clinicId: 'otra-clinica',
    } as unknown as Patient);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-123',
        chiefComplaint: 'Dolor',
        currentIllness: 'Molestia',
        personalAntecedents: {
          hypertension: false,
          diabetes: false,
          allergies: false,
          medications: false,
          bleedingDisorders: false,
          pregnancy: false,
        },
      }),
    ).rejects.toThrow(PatientNotFoundError);
  });

  it('debe crear historia clínica con medicación activa, notas adicionales y sin examen clínico', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'patient-456',
      clinicId: 'clinic-123',
    } as unknown as Patient);
    historyRepo.findByPatientId.mockResolvedValue(null);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-456',
      chiefComplaint: 'Revisión periódica',
      currentIllness: 'Control',
      personalAntecedents: {
        hypertension: true,
        diabetes: true,
        allergies: false,
        medications: true,
        medicationsDetails: 'Metformina 850mg',
        bleedingDisorders: false,
        pregnancy: false,
        otherNotes: 'Paciente ansioso',
      },
    });

    expect(result.medicalAntecedents.medications).toBe(true);
    expect(result.medicalAntecedents.medicationsDetails).toBe('Metformina 850mg');
    expect(result.medicalAntecedents.otherNotes).toBe('Paciente ansioso');
    expect(result.clinicalExamination).toBeNull();
  });
});
