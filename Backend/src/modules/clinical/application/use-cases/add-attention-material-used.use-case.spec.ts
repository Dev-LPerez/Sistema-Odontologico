import {
  AddAttentionMaterialUsedUseCase,
  AddAttentionMaterialUsedCommand,
} from './add-attention-material-used.use-case';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { UnitOfWorkPort } from '../../../../shared/application/ports/unit-of-work.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import {
  ConsumeMaterialStockUseCase,
  InsufficientMaterialStockError,
  Material,
} from '../../../catalogs';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import {
  ClinicalAttentionNotFoundError,
  ClinicalAttentionClosedError,
} from '../../domain/clinical.errors';

describe('AddAttentionMaterialUsedUseCase', () => {
  let useCase: AddAttentionMaterialUsedUseCase;
  let attentionRepo: jest.Mocked<ClinicalAttentionRepositoryPort>;
  let unitOfWork: jest.Mocked<UnitOfWorkPort>;
  let consumeMaterialStockUseCase: jest.Mocked<ConsumeMaterialStockUseCase>;
  let clock: jest.Mocked<ClockPort>;
  let idGenerator: jest.Mocked<IdGeneratorPort>;

  const fixedDate = new Date('2026-10-16T10:00:00.000Z');
  const addDate = new Date('2026-10-16T10:30:00.000Z');

  beforeEach(() => {
    attentionRepo = {
      findById: jest.fn(),
      findAllByPatientId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    unitOfWork = {
      execute: jest.fn().mockImplementation((work) => work()),
    };

    consumeMaterialStockUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ConsumeMaterialStockUseCase>;

    clock = {
      now: jest.fn().mockReturnValue(addDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-16'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-16T10:30:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    idGenerator = {
      generate: jest.fn().mockReturnValue('mat-used-1'),
    };

    useCase = new AddAttentionMaterialUsedUseCase(
      attentionRepo,
      unitOfWork,
      consumeMaterialStockUseCase,
      clock,
      idGenerator,
    );
  });

  const baseAttention = () =>
    ClinicalAttention.create({
      id: 'att-1',
      clinicId: 'clinic-123',
      patientId: 'pat-123',
      clinicalHistoryId: 'hist-123',
      attendedByUserId: 'usr-123',
      status: ClinicalAttentionStatus.OPEN,
      proceduresPerformed: [],
      evolutionNotes: 'Nota previa',
      attendedAt: fixedDate,
      createdAt: fixedDate,
      updatedAt: fixedDate,
      materialsUsed: [],
    });

  const validCommand: AddAttentionMaterialUsedCommand = {
    clinicId: 'clinic-123',
    attentionId: 'att-1',
    materialId: 'mat-1',
    quantity: 2,
    toothNumber: '16',
    notes: 'Restauración oclusal',
  };

  it('debe registrar el material propio usado por diente en la atención y descontar existencias atómicamente dentro de UnitOfWork', async () => {
    const attention = baseAttention();
    attentionRepo.findById.mockResolvedValue(attention);

    const mockMaterial = Material.create({
      id: 'mat-1',
      clinicId: 'clinic-123',
      brand: '3M',
      reference: 'Filtek Z350',
      type: 'Resina',
      color: 'A2',
      currentStock: 2,
      minStock: 2,
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });

    consumeMaterialStockUseCase.execute.mockResolvedValue(mockMaterial);

    const result = await useCase.execute(validCommand);

    expect(unitOfWork.execute).toHaveBeenCalled();
    expect(consumeMaterialStockUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      materialId: 'mat-1',
      quantity: 2,
    });
    expect(result.materialsUsed).toHaveLength(1);
    expect(result.materialsUsed[0].id).toBe('mat-used-1');
    expect(result.materialsUsed[0].brand).toBe('3M');
    expect(result.materialsUsed[0].reference).toBe('Filtek Z350');
    expect(result.materialsUsed[0].color).toBe('A2');
    expect(result.materialsUsed[0].toothNumber).toBe('16');
    expect(result.materialsUsed[0].quantity).toBe(2);
    expect(result.updatedAt).toEqual(addDate);
    expect(attentionRepo.save).toHaveBeenCalledWith(attention);
  });

  it('debe propagar InsufficientMaterialStockError (422) y no guardar el material en la atención cuando el stock no alcanza', async () => {
    const attention = baseAttention();
    attentionRepo.findById.mockResolvedValue(attention);

    consumeMaterialStockUseCase.execute.mockRejectedValue(new InsufficientMaterialStockError(1, 3));

    await expect(
      useCase.execute({
        ...validCommand,
        quantity: 3,
      }),
    ).rejects.toThrow(InsufficientMaterialStockError);

    expect(attention.materialsUsed).toHaveLength(0);
    expect(attentionRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ClinicalAttentionNotFoundError si la atención no existe en el consultorio', async () => {
    attentionRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(validCommand)).rejects.toThrow(ClinicalAttentionNotFoundError);

    expect(consumeMaterialStockUseCase.execute).not.toHaveBeenCalled();
    expect(attentionRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ClinicalAttentionClosedError si la atención ya fue cerrada', async () => {
    const closedAttention = ClinicalAttention.create({
      id: 'att-1',
      clinicId: 'clinic-123',
      patientId: 'pat-123',
      clinicalHistoryId: 'hist-123',
      attendedByUserId: 'usr-123',
      status: ClinicalAttentionStatus.CLOSED,
      proceduresPerformed: [],
      evolutionNotes: 'Cerrada',
      attendedAt: fixedDate,
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });

    attentionRepo.findById.mockResolvedValue(closedAttention);

    await expect(useCase.execute(validCommand)).rejects.toThrow(ClinicalAttentionClosedError);

    expect(consumeMaterialStockUseCase.execute).not.toHaveBeenCalled();
    expect(attentionRepo.save).not.toHaveBeenCalled();
  });
});
