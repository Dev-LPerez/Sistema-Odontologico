import { UpdateTreatmentPlanItemStatusUseCase } from './update-treatment-plan-item-status.use-case';
import { ClinicalHistoryRepositoryPort } from '../../domain/clinical-history.repository.port';
import {
  ClinicalHistoryNotFoundError,
  TreatmentPlanItemNotFoundError,
} from '../../domain/clinical.errors';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { ClinicalHistory } from '../../domain/clinical-history.entity';
import { MedicalAntecedents } from '../../domain/medical-antecedents.vo';
import { TreatmentPlanItem } from '../../domain/treatment-plan-item.entity';
import { TreatmentItemStatus } from '../../domain/treatment-item-status.enum';

describe('UpdateTreatmentPlanItemStatusUseCase', () => {
  let useCase: UpdateTreatmentPlanItemStatusUseCase;
  let historyRepo: jest.Mocked<ClinicalHistoryRepositoryPort>;
  let clock: jest.Mocked<ClockPort>;

  const initialDate = new Date('2026-10-15T09:00:00.000Z');
  const updateDate = new Date('2026-10-15T11:00:00.000Z');

  beforeEach(() => {
    historyRepo = {
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      save: jest.fn(),
    };
    clock = {
      now: jest.fn().mockReturnValue(updateDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15T11:00:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    const unitOfWork = {
      execute: jest.fn().mockImplementation((work: () => Promise<unknown>) => work()),
    };

    useCase = new UpdateTreatmentPlanItemStatusUseCase(historyRepo, unitOfWork, clock);
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
      createdAt: initialDate,
      updatedAt: initialDate,
    });

    const item = TreatmentPlanItem.create({
      id: 'item-1',
      clinicId: 'clinic-123',
      clinicalHistoryId: 'hist-1',
      procedureId: 'proc-1',
      procedureCode: 'RES-EST',
      procedureName: 'Resina Estética',
      toothNumber: '16',
      status: TreatmentItemStatus.PENDING,
      estimatedCostCop: 150000,
      notes: null,
      createdAt: initialDate,
      updatedAt: initialDate,
    });
    history.addTreatmentPlanItem(item);

    historyRepo.findByPatientId.mockResolvedValue(history);

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      itemId: 'item-1',
      status: TreatmentItemStatus.COMPLETED,
    });

    expect(result.status).toBe(TreatmentItemStatus.COMPLETED);
    expect(result.updatedAt).toEqual(updateDate);
    expect(history.treatmentItems[0].status).toBe(TreatmentItemStatus.COMPLETED);
    expect(history.totalEstimatedCostCop).toBe(150000);
    expect(historyRepo.save).toHaveBeenCalledWith(history);
  });

  it('debe lanzar ClinicalHistoryNotFoundError si la historia clínica no existe', async () => {
    historyRepo.findByPatientId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-inexistente',
        itemId: 'item-1',
        status: TreatmentItemStatus.COMPLETED,
      }),
    ).rejects.toThrow(ClinicalHistoryNotFoundError);
  });

  it('debe lanzar TreatmentPlanItemNotFoundError si el ítem no existe en la historia clínica', async () => {
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
      createdAt: initialDate,
      updatedAt: initialDate,
    });
    historyRepo.findByPatientId.mockResolvedValue(history);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-123',
        itemId: 'item-inexistente',
        status: TreatmentItemStatus.COMPLETED,
      }),
    ).rejects.toThrow(TreatmentPlanItemNotFoundError);
  });
});
