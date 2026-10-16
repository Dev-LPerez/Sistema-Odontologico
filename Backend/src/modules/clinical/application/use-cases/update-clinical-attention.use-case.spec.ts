import {
  UpdateClinicalAttentionUseCase,
  UpdateClinicalAttentionCommand,
} from './update-clinical-attention.use-case';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { ProcedureRepositoryPort } from '../../../catalogs';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import {
  ClinicalAttentionNotFoundError,
  ClinicalAttentionClosedError,
  InvalidClinicalAttentionDataError,
} from '../../domain/clinical.errors';

describe('UpdateClinicalAttentionUseCase', () => {
  let useCase: UpdateClinicalAttentionUseCase;
  let attentionRepo: jest.Mocked<ClinicalAttentionRepositoryPort>;
  let procedureRepo: jest.Mocked<ProcedureRepositoryPort>;
  let clock: jest.Mocked<ClockPort>;

  const fixedDate = new Date('2026-10-16T10:00:00.000Z');
  const updateDate = new Date('2026-10-16T11:00:00.000Z');

  beforeEach(() => {
    attentionRepo = {
      findById: jest.fn(),
      findAllByPatientId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

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
      now: jest.fn().mockReturnValue(updateDate),
      todayInBogota: jest.fn().mockReturnValue('2026-10-16'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-16T11:00:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    useCase = new UpdateClinicalAttentionUseCase(attentionRepo, procedureRepo, clock);
  });

  const baseAttention = ClinicalAttention.create({
    id: 'att-1',
    clinicId: 'clinic-123',
    patientId: 'pat-123',
    clinicalHistoryId: 'hist-123',
    attendedByUserId: 'usr-123',
    status: ClinicalAttentionStatus.OPEN,
    proceduresPerformed: [],
    evolutionNotes: 'Nota previa',
    prescription: null,
    postOperativeIndications: null,
    privateNotes: 'Privada previa',
    attendedAt: fixedDate,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    materialsUsed: [],
  });

  it('debe actualizar los datos de la atención y guardar con nueva fecha updatedAt', async () => {
    attentionRepo.findById.mockResolvedValue(baseAttention);

    const command: UpdateClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'att-1',
      evolutionNotes: 'Evolución modificada',
      prescription: 'Paracetamol 500mg',
      postOperativeIndications: 'Reposo relativo',
      privateNotes: 'Nueva nota confidencial',
      proceduresPerformed: [{ code: 'RES-02' }],
    };

    const updated = await useCase.execute(command);

    expect(updated.evolutionNotes).toBe('Evolución modificada');
    expect(updated.prescription).toBe('Paracetamol 500mg');
    expect(updated.postOperativeIndications).toBe('Reposo relativo');
    expect(updated.privateNotes).toBe('Nueva nota confidencial');
    expect(updated.proceduresPerformed).toHaveLength(1);
    expect(updated.updatedAt).toEqual(updateDate);
    expect(attentionRepo.save).toHaveBeenCalledWith(updated);
  });

  it('debe lanzar ClinicalAttentionNotFoundError si la atención no existe en el consultorio', async () => {
    attentionRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        id: 'att-non-existent',
        evolutionNotes: 'Nota',
      }),
    ).rejects.toThrow(ClinicalAttentionNotFoundError);

    expect(attentionRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ClinicalAttentionClosedError si la atención está en estado CLOSED', async () => {
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

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        id: 'att-1',
        evolutionNotes: 'Intento en cerrada',
      }),
    ).rejects.toThrow(ClinicalAttentionClosedError);

    expect(attentionRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar InvalidClinicalAttentionDataError si evolutionNotes es enviada vacía', async () => {
    attentionRepo.findById.mockResolvedValue(baseAttention);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        id: 'att-1',
        evolutionNotes: '   ',
      }),
    ).rejects.toThrow(InvalidClinicalAttentionDataError);
  });
});
