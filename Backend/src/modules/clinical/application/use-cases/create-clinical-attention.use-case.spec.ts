import {
  CreateClinicalAttentionUseCase,
  CreateClinicalAttentionCommand,
} from './create-clinical-attention.use-case';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import { PatientRepositoryPort, PatientNotFoundError, Patient } from '../../../patients';
import { ProcedureRepositoryPort, ProcedureNotFoundError, Procedure } from '../../../catalogs';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { MedicalAntecedents } from '../../domain/medical-antecedents.vo';
import {
  InvalidClinicalAttentionDataError,
  InvalidOdontogramDataError,
  ClinicalHistoryNotFoundError,
} from '../../domain/clinical.errors';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';

describe('CreateClinicalAttentionUseCase', () => {
  let useCase: CreateClinicalAttentionUseCase;
  let attentionRepo: jest.Mocked<ClinicalAttentionRepositoryPort>;
  let historyRepo: jest.Mocked<ClinicalHistoryRepositoryPort>;
  let patientRepo: jest.Mocked<PatientRepositoryPort>;
  let procedureRepo: jest.Mocked<ProcedureRepositoryPort>;
  let clock: jest.Mocked<ClockPort>;
  let idGenerator: jest.Mocked<IdGeneratorPort>;

  const fixedDate = new Date('2026-10-16T10:00:00.000Z');

  beforeEach(() => {
    attentionRepo = {
      findById: jest.fn(),
      findAllByPatientId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

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
    } as unknown as jest.Mocked<PatientRepositoryPort>;

    procedureRepo = {
      findById: jest.fn(),
      findByCode: jest.fn().mockImplementation(async (clinicId: string, code: string) => ({
        id: 'proc-1',
        clinicId,
        code,
        name: 'Resina fotocurado',
        basePrice: 50000,
        isActive: true,
        category: null,
      })),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ProcedureRepositoryPort>;

    clock = {
      now: jest.fn().mockReturnValue(fixedDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-16'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-16T10:00:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    idGenerator = {
      generate: jest.fn().mockReturnValue('att-1'),
    };

    useCase = new CreateClinicalAttentionUseCase(
      attentionRepo,
      historyRepo,
      patientRepo,
      procedureRepo,
      clock,
      idGenerator,
    );
  });

  const validCommand: CreateClinicalAttentionCommand = {
    clinicId: 'clinic-123',
    patientId: 'pat-123',
    attendedByUserId: 'usr-123',
    proceduresPerformed: [
      {
        code: 'RES-01',
        name: 'Resina',
        toothNumber: '16',
      },
    ],
    evolutionNotes: 'Evolución de atención satisfactoria',
    prescription: 'Amoxicilina 500mg',
    postOperativeIndications: 'Indicaciones postoperatorias',
    privateNotes: 'Nota privada para la doctora',
  };

  it('debe crear, actualizar y listar atenciones clínicas aislando por clinicId y ocultando privateNotes para el rol AUXILIARY', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'pat-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);

    historyRepo.findByPatientId.mockResolvedValue(
      ClinicalHistory.create({
        id: 'hist-123',
        clinicId: 'clinic-123',
        patientId: 'pat-123',
        chiefComplaint: 'Dolor dental',
        currentIllness: 'Dolor leve',
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
      }),
    );

    const attention = await useCase.execute(validCommand);

    expect(attention).toBeInstanceOf(ClinicalAttention);
    expect(attention.id).toBe('att-1');
    expect(attention.clinicId).toBe('clinic-123');
    expect(attention.patientId).toBe('pat-123');
    expect(attention.clinicalHistoryId).toBe('hist-123');
    expect(attention.attendedByUserId).toBe('usr-123');
    expect(attention.status).toBe(ClinicalAttentionStatus.OPEN);
    expect(attention.evolutionNotes).toBe('Evolución de atención satisfactoria');
    expect(attention.privateNotes).toBe('Nota privada para la doctora');
    expect(attention.createdAt).toEqual(fixedDate);
    expect(attention.updatedAt).toEqual(fixedDate);
    expect(attentionRepo.save).toHaveBeenCalledWith(attention);
  });

  it('debe lanzar InvalidClinicalAttentionDataError cuando evolutionNotes está vacío o ClinicalHistoryNotFoundError si no hay historia clínica', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'pat-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);

    historyRepo.findByPatientId.mockResolvedValue(null);

    await expect(useCase.execute(validCommand)).rejects.toThrow(ClinicalHistoryNotFoundError);

    historyRepo.findByPatientId.mockResolvedValue(
      ClinicalHistory.create({
        id: 'hist-123',
        clinicId: 'clinic-123',
        patientId: 'pat-123',
        chiefComplaint: 'Dolor',
        currentIllness: 'Dolor',
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
      }),
    );

    await expect(
      useCase.execute({
        ...validCommand,
        evolutionNotes: '   ',
      }),
    ).rejects.toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe lanzar PatientNotFoundError si el paciente no existe en el consultorio', async () => {
    patientRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(validCommand)).rejects.toThrow(PatientNotFoundError);
    expect(historyRepo.findByPatientId).not.toHaveBeenCalled();
    expect(attentionRepo.save).not.toHaveBeenCalled();
  });

  it('debe rechazar procedimientos con código inexistente en el catálogo (404) o con diente FDI o superficie inválidos (400)', async () => {
    patientRepo.findById.mockResolvedValue({
      id: 'pat-123',
      clinicId: 'clinic-123',
    } as unknown as Patient);

    historyRepo.findByPatientId.mockResolvedValue(
      ClinicalHistory.create({
        id: 'hist-123',
        clinicId: 'clinic-123',
        patientId: 'pat-123',
        chiefComplaint: 'Dolor dental',
        currentIllness: 'Dolor leve',
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
      }),
    );

    // Procedure not found in catalog -> 404 ProcedureNotFoundError
    procedureRepo.findByCode.mockResolvedValue(null);
    await expect(
      useCase.execute({
        ...validCommand,
        proceduresPerformed: [{ code: 'INEXISTENT-01' }],
      }),
    ).rejects.toThrow(ProcedureNotFoundError);

    // Procedure found, but invalid FDI toothNumber -> 400 InvalidOdontogramDataError
    procedureRepo.findByCode.mockResolvedValue({
      id: 'proc-1',
      clinicId: 'clinic-123',
      code: 'RES-01',
      name: 'Resina',
    } as unknown as Procedure);

    await expect(
      useCase.execute({
        ...validCommand,
        proceduresPerformed: [{ code: 'RES-01', toothNumber: '99' }],
      }),
    ).rejects.toThrow(InvalidOdontogramDataError);

    // Procedure found, but invalid surface -> 400 InvalidOdontogramDataError
    await expect(
      useCase.execute({
        ...validCommand,
        proceduresPerformed: [
          { code: 'RES-01', toothNumber: '16', surface: 'INVENTADA' as unknown as string },
        ],
      }),
    ).rejects.toThrow(InvalidOdontogramDataError);
  });
});
