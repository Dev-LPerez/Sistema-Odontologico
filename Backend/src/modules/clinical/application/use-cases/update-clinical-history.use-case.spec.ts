import { UpdateClinicalHistoryUseCase } from './update-clinical-history.use-case';
import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import { ClinicalHistoryVersionRepositoryPort } from '../../domain/clinical-history-version.repository.port';
import { UnitOfWorkPort } from '../../../../shared/application/ports/unit-of-work.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { MedicalAntecedents } from '../../domain/medical-antecedents.vo';

describe('UpdateClinicalHistoryUseCase', () => {
  let useCase: UpdateClinicalHistoryUseCase;
  let historyRepo: jest.Mocked<ClinicalHistoryRepositoryPort>;
  let versionRepo: jest.Mocked<ClinicalHistoryVersionRepositoryPort>;
  let unitOfWork: jest.Mocked<UnitOfWorkPort>;
  let idGen: jest.Mocked<IdGeneratorPort>;
  let clock: jest.Mocked<ClockPort>;

  const initialDate = new Date('2026-10-15T09:00:00.000Z');
  const updateDate = new Date('2026-10-15T11:00:00.000Z');

  beforeEach(() => {
    historyRepo = {
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      save: jest.fn(),
    };
    versionRepo = {
      findAllByHistoryId: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
    };
    unitOfWork = {
      execute: jest.fn().mockImplementation((work: () => Promise<unknown>) => work()),
    };
    idGen = {
      generate: jest.fn().mockReturnValue('gen-hist-ver-1'),
    };
    clock = {
      now: jest.fn().mockReturnValue(updateDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15T11:00:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    useCase = new UpdateClinicalHistoryUseCase(historyRepo, versionRepo, unitOfWork, clock, idGen);
  });

  it('debe guardar atómicamente una versión inmutable en ClinicalHistoryVersion al actualizar la historia clínica y permitir listar sus versiones', async () => {
    const existingHistory = ClinicalHistory.create({
      id: 'hist-123',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor inicial',
      currentIllness: 'Enfermedad inicial',
      medicalAntecedents: MedicalAntecedents.create({
        hypertension: false,
        diabetes: false,
        allergies: false,
        medications: false,
        bleedingDisorders: false,
        pregnancy: false,
      }),
      createdAt: initialDate,
      updatedAt: initialDate,
    });

    historyRepo.findByPatientId.mockResolvedValue(existingHistory);
    versionRepo.findAllByHistoryId.mockResolvedValue([]);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Control postoperatorio',
      changeReason: 'Revisión periódica programada',
      updatedByUserId: 'usr-admin-1',
    });

    expect(result.chiefComplaint).toBe('Control postoperatorio');
    expect(unitOfWork.execute).toHaveBeenCalled();
    expect(versionRepo.save).toHaveBeenCalledTimes(1);

    const savedVersion = versionRepo.save.mock.calls[0][0];
    expect(savedVersion.versionNumber).toBe(1);
    expect(savedVersion.previousData.chiefComplaint).toBe('Dolor inicial');
    expect(savedVersion.changeReason).toBe('Revisión periódica programada');
    expect(savedVersion.updatedByUserId).toBe('usr-admin-1');
  });

  it('debe crear, actualizar y consultar la historia clínica con antecedentes y diagnósticos aislando por clinicId', async () => {
    const existingHistory = ClinicalHistory.create({
      id: 'hist-123',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor inicial',
      currentIllness: 'Enfermedad inicial',
      medicalAntecedents: MedicalAntecedents.create({
        hypertension: false,
        diabetes: false,
        allergies: false,
        medications: false,
        bleedingDisorders: false,
        pregnancy: false,
      }),
      createdAt: initialDate,
      updatedAt: initialDate,
    });

    historyRepo.findByPatientId.mockResolvedValue(existingHistory);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor agudo actualizado',
      currentIllness: 'Evolución de dolor severo',
      personalAntecedents: {
        hypertension: true,
        diabetes: false,
        allergies: true,
        allergiesDetails: 'Penicilina',
        medications: true,
        medicationsDetails: 'Losartán 50mg',
        bleedingDisorders: false,
        pregnancy: false,
      },
      familyAntecedents: 'Madre diabética',
      clinicalExamination: 'Pieza 16 con pulpitis',
      diagnoses: [{ code: 'K04.0', description: 'Pulpitis irreversible' }],
    });

    expect(result.chiefComplaint).toBe('Dolor agudo actualizado');
    expect(result.currentIllness).toBe('Evolución de dolor severo');
    expect(result.medicalAntecedents.hypertension).toBe(true);
    expect(result.medicalAntecedents.allergies).toBe(true);
    expect(result.medicalAntecedents.allergiesDetails).toBe('Penicilina');
    expect(result.medicalAntecedents.medicationsDetails).toBe('Losartán 50mg');
    expect(result.medicalAntecedents.familyAntecedents).toBe('Madre diabética');
    expect(result.clinicalExamination).toBe('Pieza 16 con pulpitis');
    expect(result.diagnoses).toEqual([{ code: 'K04.0', description: 'Pulpitis irreversible' }]);
    expect(result.updatedAt).toEqual(updateDate);
    expect(historyRepo.save).toHaveBeenCalledWith(existingHistory);
  });

  it('debe lanzar ClinicalHistoryNotFoundError cuando la historia clínica no existe', async () => {
    historyRepo.findByPatientId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-inexistente',
        chiefComplaint: 'Actualización',
      }),
    ).rejects.toThrow(ClinicalHistoryNotFoundError);
  });

  it('debe actualizar solo motivo y solo antecedentes familiares manteniendo los demás', async () => {
    const existingHistory = ClinicalHistory.create({
      id: 'hist-123',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor inicial',
      currentIllness: 'Enfermedad inicial',
      medicalAntecedents: MedicalAntecedents.create({
        hypertension: false,
        diabetes: false,
        allergies: false,
        medications: false,
        bleedingDisorders: false,
        pregnancy: false,
      }),
      createdAt: initialDate,
      updatedAt: initialDate,
    });
    historyRepo.findByPatientId.mockResolvedValue(existingHistory);

    // 1. Actualización sin modificar antecedentes
    const res1 = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Nuevo motivo únicamente',
    });
    expect(res1.chiefComplaint).toBe('Nuevo motivo únicamente');
    expect(res1.medicalAntecedents.hypertension).toBe(false);

    // 2. Actualización solo con familyAntecedents
    const res2 = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      familyAntecedents: 'Sin antecedentes patológicos familiares',
    });
    expect(res2.medicalAntecedents.familyAntecedents).toBe(
      'Sin antecedentes patológicos familiares',
    );
  });
});
