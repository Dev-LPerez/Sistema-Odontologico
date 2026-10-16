import {
  CloseClinicalAttentionUseCase,
  CloseClinicalAttentionCommand,
} from './close-clinical-attention.use-case';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { UnitOfWorkPort } from '../../../../shared/application/ports/unit-of-work.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { EventBusPort } from '../../../../shared/application/ports/event-bus.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import {
  ClinicalAttentionNotFoundError,
  ClinicalAttentionClosedError,
  IncompleteClinicalAttentionError,
} from '../../domain/clinical.errors';

describe('CloseClinicalAttentionUseCase', () => {
  let useCase: CloseClinicalAttentionUseCase;
  let attentionRepo: jest.Mocked<ClinicalAttentionRepositoryPort>;
  let unitOfWork: jest.Mocked<UnitOfWorkPort>;
  let clock: jest.Mocked<ClockPort>;
  let eventBus: jest.Mocked<EventBusPort>;

  const fixedAttendedAt = new Date('2026-10-16T09:00:00.000Z');
  const fixedCreatedAt = new Date('2026-10-16T09:05:00.000Z');
  const closeTime = new Date('2026-10-16T10:00:00.000Z');

  beforeEach(() => {
    attentionRepo = {
      findById: jest.fn(),
      findAllByPatientId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    unitOfWork = {
      execute: jest.fn().mockImplementation((work) => work()),
    };

    clock = {
      now: jest.fn().mockReturnValue(closeTime),
      todayInBogota: jest.fn().mockReturnValue('2026-10-16'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-16T10:00:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new CloseClinicalAttentionUseCase(attentionRepo, unitOfWork, clock, eventBus);
  });

  const createAttentionWithProcedures = () =>
    ClinicalAttention.create({
      id: 'att-1',
      clinicId: 'clinic-123',
      patientId: 'pat-1',
      clinicalHistoryId: 'hist-1',
      attendedByUserId: 'usr-admin-1',
      status: ClinicalAttentionStatus.OPEN,
      proceduresPerformed: [
        {
          code: 'RES-01',
          name: 'Resina fotocurado',
          toothNumber: '16',
        },
      ],
      evolutionNotes: 'Procedimiento realizado con éxito',
      prescription: null,
      postOperativeIndications: null,
      privateNotes: 'Nota privada',
      attendedAt: fixedAttendedAt,
      createdAt: fixedCreatedAt,
      updatedAt: fixedCreatedAt,
      materialsUsed: [],
    });

  it('debe cerrar una atención clínica completa pasando a CLOSED e impedir ediciones ordinarias posteriores', async () => {
    const attention = createAttentionWithProcedures();
    attentionRepo.findById.mockResolvedValue(attention);

    const command: CloseClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'att-1',
    };

    const result = await useCase.execute(command);

    expect(result.status).toBe(ClinicalAttentionStatus.CLOSED);
    expect(result.updatedAt).toEqual(closeTime);
    expect(attentionRepo.save).toHaveBeenCalledWith(attention);
    expect(eventBus.publishAll).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          eventName: 'clinical.attention.closed',
          aggregateId: 'att-1',
          clinicId: 'clinic-123',
          patientId: 'pat-1',
        }),
      ]),
    );
    expect(result.domainEvents).toHaveLength(0);

    // Impedir edición ordinaria posterior
    expect(() =>
      result.update({
        evolutionNotes: 'Intento de edición',
        updatedAt: new Date('2026-10-16T11:00:00.000Z'),
      }),
    ).toThrow(ClinicalAttentionClosedError);
  });

  it('debe lanzar IncompleteClinicalAttentionError (422) cuando se intenta cerrar una atención sin procedimientos realizados', async () => {
    const incompleteAttention = ClinicalAttention.create({
      id: 'att-1',
      clinicId: 'clinic-123',
      patientId: 'pat-1',
      clinicalHistoryId: 'hist-1',
      attendedByUserId: 'usr-admin-1',
      status: ClinicalAttentionStatus.OPEN,
      proceduresPerformed: [],
      evolutionNotes: 'Evolución sin procedimientos',
      prescription: null,
      postOperativeIndications: null,
      privateNotes: null,
      attendedAt: fixedAttendedAt,
      createdAt: fixedCreatedAt,
      updatedAt: fixedCreatedAt,
      materialsUsed: [],
    });

    attentionRepo.findById.mockResolvedValue(incompleteAttention);

    const command: CloseClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'att-1',
    };

    await expect(useCase.execute(command)).rejects.toThrow(IncompleteClinicalAttentionError);
    expect(attentionRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ClinicalAttentionNotFoundError si la atención clínica no existe en el clinicId', async () => {
    attentionRepo.findById.mockResolvedValue(null);

    const command: CloseClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'non-existent',
    };

    await expect(useCase.execute(command)).rejects.toThrow(ClinicalAttentionNotFoundError);
    expect(attentionRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar ClinicalAttentionClosedError si la atención clínica ya está cerrada', async () => {
    const closedAttention = createAttentionWithProcedures();
    closedAttention.close(new Date('2026-10-16T09:30:00.000Z'));
    attentionRepo.findById.mockResolvedValue(closedAttention);

    const command: CloseClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'att-1',
    };

    await expect(useCase.execute(command)).rejects.toThrow(ClinicalAttentionClosedError);
    expect(attentionRepo.save).not.toHaveBeenCalled();
  });

  it('debe ejecutar el guardado y la publicación de AttentionClosedEvent dentro de UnitOfWorkPort propagando errores si un manejador falla', async () => {
    const attention = createAttentionWithProcedures();
    attentionRepo.findById.mockResolvedValue(attention);

    eventBus.publishAll.mockRejectedValueOnce(
      new Error('Fallo simulado en manejador de evento AttentionClosedEvent'),
    );

    const command: CloseClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'att-1',
    };

    await expect(useCase.execute(command)).rejects.toThrow(
      'Fallo simulado en manejador de evento AttentionClosedEvent',
    );
    expect(unitOfWork.execute).toHaveBeenCalled();
  });
});
