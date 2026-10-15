import { AddTreatmentPlanItemUseCase } from './add-treatment-plan-item.use-case';
import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import {
  ProcedureRepositoryPort,
  PatientProcedurePriceRepositoryPort,
  ProcedureNotFoundError,
  Money,
  Procedure,
  PatientProcedurePrice,
} from '../../../catalogs';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { MedicalAntecedents } from '../../domain/medical-antecedents.vo';
import { TreatmentItemStatus } from '../../domain/treatment-item-status.enum';

describe('AddTreatmentPlanItemUseCase', () => {
  let useCase: AddTreatmentPlanItemUseCase;
  let historyRepo: jest.Mocked<ClinicalHistoryRepositoryPort>;
  let procedureRepo: jest.Mocked<ProcedureRepositoryPort>;
  let patientPriceRepo: jest.Mocked<PatientProcedurePriceRepositoryPort>;
  let clock: jest.Mocked<ClockPort>;
  let idGen: jest.Mocked<IdGeneratorPort>;

  const fixedDate = new Date('2026-10-15T10:30:00.000Z');

  beforeEach(() => {
    historyRepo = {
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      save: jest.fn(),
    };
    procedureRepo = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };
    patientPriceRepo = {
      findByPatientAndProcedure: jest.fn(),
      findAllByPatient: jest.fn(),
      save: jest.fn(),
    };
    clock = {
      now: jest.fn().mockReturnValue(fixedDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15T10:30:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    idGen = {
      generate: jest.fn().mockReturnValue('gen-item-123'),
    };

    useCase = new AddTreatmentPlanItemUseCase(
      historyRepo,
      procedureRepo,
      patientPriceRepo,
      clock,
      idGen,
    );
  });

  it('debe agregar ítems al plan de tratamiento resolviendo el costo y actualizar su estado a COMPLETED calculando totalEstimatedCostCop', async () => {
    const history = ClinicalHistory.create({
      id: 'hist-1',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor',
      currentIllness: 'Caries',
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

    const procedureMock = {
      id: 'proc-1',
      clinicId: 'clinic-123',
      code: 'RES-EST',
      name: 'Resina Estética',
      basePrice: Money.from(150000),
    } as unknown as Procedure;
    procedureRepo.findById.mockResolvedValue(procedureMock);

    // Caso 1: Precio base resuelto desde el catálogo
    patientPriceRepo.findByPatientAndProcedure.mockResolvedValue(null);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      procedureId: 'proc-1',
      toothNumber: '16',
      notes: 'Cara oclusal',
    });

    expect(result.id).toBe('gen-item-123');
    expect(result.procedureCode).toBe('RES-EST');
    expect(result.procedureName).toBe('Resina Estética');
    expect(result.toothNumber).toBe('16');
    expect(result.status).toBe(TreatmentItemStatus.PENDING);
    expect(result.estimatedCostCop).toBe(150000);
    expect(history.treatmentItems).toHaveLength(1);
    expect(history.totalEstimatedCostCop).toBe(150000);
    expect(historyRepo.save).toHaveBeenCalledWith(history);
  });

  it('debe resolver la tarifa especial del paciente cuando existe en patientProcedurePrices', async () => {
    const history = ClinicalHistory.create({
      id: 'hist-1',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor',
      currentIllness: 'Caries',
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

    procedureRepo.findById.mockResolvedValue({
      id: 'proc-1',
      clinicId: 'clinic-123',
      code: 'RES-EST',
      name: 'Resina Estética',
      basePrice: Money.from(150000),
    } as unknown as Procedure);

    patientPriceRepo.findByPatientAndProcedure.mockResolvedValue({
      customPrice: Money.from(120000),
      reason: 'Descuento familiar',
    } as unknown as PatientProcedurePrice);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      procedureId: 'proc-1',
    });

    expect(result.estimatedCostCop).toBe(120000);
  });

  it('debe respetar el costo manual si fue proporcionado explícitamente en el comando', async () => {
    const history = ClinicalHistory.create({
      id: 'hist-1',
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor',
      currentIllness: 'Caries',
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

    procedureRepo.findById.mockResolvedValue({
      id: 'proc-1',
      clinicId: 'clinic-123',
      code: 'RES-EST',
      name: 'Resina Estética',
      basePrice: Money.from(150000),
    } as unknown as Procedure);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      procedureId: 'proc-1',
      estimatedCostCop: 99000,
    });

    expect(result.estimatedCostCop).toBe(99000);
  });

  it('debe lanzar ProcedureNotFoundError si el procedimiento no existe en el catálogo', async () => {
    historyRepo.findByPatientId.mockResolvedValue({} as unknown as ClinicalHistory);
    procedureRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-123',
        procedureId: 'proc-inexistente',
      }),
    ).rejects.toThrow(ProcedureNotFoundError);
  });

  it('debe lanzar ClinicalHistoryNotFoundError si la historia clínica no existe', async () => {
    historyRepo.findByPatientId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-inexistente',
        procedureId: 'proc-1',
      }),
    ).rejects.toThrow(ClinicalHistoryNotFoundError);
  });
});
