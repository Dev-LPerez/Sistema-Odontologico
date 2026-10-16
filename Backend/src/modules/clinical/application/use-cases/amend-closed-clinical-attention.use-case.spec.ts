import {
  AmendClosedClinicalAttentionUseCase,
  AmendClosedClinicalAttentionCommand,
} from './amend-closed-clinical-attention.use-case';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { ClinicalAttentionVersionRepositoryPort } from '../../domain/clinical-attention-version.repository.port';
import { UnitOfWorkPort } from '../../../../shared/application/ports/unit-of-work.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionVersion } from '../../domain/clinical-attention-version.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import {
  ClinicalAttentionNotFoundError,
  ClinicalAttentionNotClosedError,
  InvalidClinicalAttentionDataError,
} from '../../domain/clinical.errors';
import { UserRole } from '../../../identity';

describe('AmendClosedClinicalAttentionUseCase', () => {
  let useCase: AmendClosedClinicalAttentionUseCase;
  let attentionRepo: jest.Mocked<ClinicalAttentionRepositoryPort>;
  let versionRepo: jest.Mocked<ClinicalAttentionVersionRepositoryPort>;
  let unitOfWork: jest.Mocked<UnitOfWorkPort>;
  let clock: jest.Mocked<ClockPort>;
  let idGenerator: jest.Mocked<IdGeneratorPort>;

  const fixedAttendedAt = new Date('2026-10-16T09:00:00.000Z');
  const fixedCreatedAt = new Date('2026-10-16T09:05:00.000Z');
  const closeTime = new Date('2026-10-16T10:00:00.000Z');
  const amendTime = new Date('2026-10-16T11:00:00.000Z');

  beforeEach(() => {
    attentionRepo = {
      findById: jest.fn(),
      findAllByPatientId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    versionRepo = {
      findAllByAttentionId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    };

    unitOfWork = {
      execute: jest.fn().mockImplementation((work) => work()),
    };

    clock = {
      now: jest.fn().mockReturnValue(amendTime),
      todayInBogota: jest.fn().mockReturnValue('2026-10-16'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-16T11:00:00-05:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };

    idGenerator = {
      generate: jest.fn().mockReturnValue('ver-uuid-1'),
    };

    useCase = new AmendClosedClinicalAttentionUseCase(
      attentionRepo,
      versionRepo,
      unitOfWork,
      clock,
      idGenerator,
    );
  });

  const createClosedAttention = () => {
    const attention = ClinicalAttention.create({
      id: 'att-1',
      clinicId: 'clinic-123',
      patientId: 'pat-1',
      clinicalHistoryId: 'hist-1',
      attendedByUserId: 'usr-admin-1',
      status: ClinicalAttentionStatus.OPEN,
      proceduresPerformed: [
        {
          code: 'RES-01',
          name: 'Resina',
          toothNumber: '16',
        },
      ],
      evolutionNotes: 'Evolución original previa al cambio',
      prescription: 'Amoxicilina 500mg',
      postOperativeIndications: 'Reposo',
      privateNotes: 'Nota privada confidencial',
      attendedAt: fixedAttendedAt,
      createdAt: fixedCreatedAt,
      updatedAt: fixedCreatedAt,
      materialsUsed: [],
    });
    attention.close(closeTime);
    return attention;
  };

  it('debe enmendar una atención cerrada guardando la versión inmutable previa y ocultando privateNotes en el historial para AUXILIARY', async () => {
    const attention = createClosedAttention();
    attentionRepo.findById.mockResolvedValue(attention);
    versionRepo.findAllByAttentionId.mockResolvedValue([]);

    const command: AmendClosedClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'att-1',
      amendedByUserId: 'usr-admin-1',
      changeReason: 'Aclaración de dosis y notas de evolución corregidas',
      evolutionNotes: 'Evolución corregida con nuevos detalles',
      prescription: 'Amoxicilina 875mg cada 12 horas',
      postOperativeIndications: 'Reposo absoluto por 24 horas',
      privateNotes: 'Nota privada actualizada',
    };

    const result = await useCase.execute(command);

    // Atención enmendada
    expect(result.status).toBe(ClinicalAttentionStatus.CLOSED);
    expect(result.evolutionNotes).toBe('Evolución corregida con nuevos detalles');
    expect(result.prescription).toBe('Amoxicilina 875mg cada 12 horas');
    expect(result.privateNotes).toBe('Nota privada actualizada');
    expect(result.updatedAt).toEqual(amendTime);

    // Persistencia atómica en UnitOfWork
    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
    expect(versionRepo.save).toHaveBeenCalledTimes(1);
    expect(attentionRepo.save).toHaveBeenCalledWith(result);

    // Versión guardada
    const savedVersion: ClinicalAttentionVersion = versionRepo.save.mock.calls[0][0];
    expect(savedVersion.id).toBe('ver-uuid-1');
    expect(savedVersion.versionNumber).toBe(1);
    expect(savedVersion.changeReason).toBe('Aclaración de dosis y notas de evolución corregidas');
    expect(savedVersion.amendedByUserId).toBe('usr-admin-1');
    expect(savedVersion.previousData.evolutionNotes).toBe('Evolución original previa al cambio');
    expect(savedVersion.previousData.privateNotes).toBe('Nota privada confidencial');

    // Ocultamiento de privateNotes para AUXILIARY
    const maskedForAuxiliary = savedVersion.maskPrivateNotesForViewer(UserRole.AUXILIARY);
    expect(maskedForAuxiliary.previousData.privateNotes).toBeNull();
  });

  it('debe lanzar InvalidClinicalAttentionDataError si changeReason está vacío o ClinicalAttentionNotClosedError si la atención sigue OPEN', async () => {
    // Caso atención OPEN
    const openAttention = ClinicalAttention.create({
      id: 'att-open',
      clinicId: 'clinic-123',
      patientId: 'pat-1',
      clinicalHistoryId: 'hist-1',
      attendedByUserId: 'usr-admin-1',
      status: ClinicalAttentionStatus.OPEN,
      proceduresPerformed: [{ code: 'RES-01' }],
      evolutionNotes: 'Notas',
      attendedAt: fixedAttendedAt,
      createdAt: fixedCreatedAt,
      updatedAt: fixedCreatedAt,
    });
    attentionRepo.findById.mockResolvedValue(openAttention);

    const amendOpenCommand: AmendClosedClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'att-open',
      amendedByUserId: 'usr-admin-1',
      changeReason: 'Motivo válido',
      evolutionNotes: 'Nueva nota',
    };

    await expect(useCase.execute(amendOpenCommand)).rejects.toThrow(
      ClinicalAttentionNotClosedError,
    );

    // Caso changeReason vacío sobre cerrada
    const closedAttention = createClosedAttention();
    attentionRepo.findById.mockResolvedValue(closedAttention);

    const amendEmptyReasonCommand: AmendClosedClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'att-1',
      amendedByUserId: 'usr-admin-1',
      changeReason: '    ',
      evolutionNotes: 'Nueva nota',
    };

    await expect(useCase.execute(amendEmptyReasonCommand)).rejects.toThrow(
      InvalidClinicalAttentionDataError,
    );
    expect(versionRepo.save).not.toHaveBeenCalled();
  });

  it('debe calcular el siguiente versionNumber secuencialmente sumando 1 al total de versiones previas', async () => {
    const attention = createClosedAttention();
    attentionRepo.findById.mockResolvedValue(attention);

    const existingVersion1 = ClinicalAttentionVersion.create({
      id: 'ver-old-1',
      clinicId: 'clinic-123',
      attentionId: 'att-1',
      versionNumber: 1,
      previousData: attention.toSnapshotData(),
      changeReason: 'Primera enmienda',
      amendedByUserId: 'usr-admin-1',
      createdAt: new Date('2026-10-16T10:15:00.000Z'),
    });

    const existingVersion2 = ClinicalAttentionVersion.create({
      id: 'ver-old-2',
      clinicId: 'clinic-123',
      attentionId: 'att-1',
      versionNumber: 2,
      previousData: attention.toSnapshotData(),
      changeReason: 'Segunda enmienda',
      amendedByUserId: 'usr-admin-1',
      createdAt: new Date('2026-10-16T10:30:00.000Z'),
    });

    versionRepo.findAllByAttentionId.mockResolvedValue([existingVersion1, existingVersion2]);

    const command: AmendClosedClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'att-1',
      amendedByUserId: 'usr-admin-1',
      changeReason: 'Tercera enmienda',
      evolutionNotes: 'Evolución final',
    };

    await useCase.execute(command);

    const savedVersion: ClinicalAttentionVersion = versionRepo.save.mock.calls[0][0];
    expect(savedVersion.versionNumber).toBe(3);
  });

  it('debe lanzar ClinicalAttentionNotFoundError si la atención clínica no existe en el clinicId', async () => {
    attentionRepo.findById.mockResolvedValue(null);

    const command: AmendClosedClinicalAttentionCommand = {
      clinicId: 'clinic-123',
      id: 'non-existent',
      amendedByUserId: 'usr-admin-1',
      changeReason: 'Motivo',
    };

    await expect(useCase.execute(command)).rejects.toThrow(ClinicalAttentionNotFoundError);
    expect(unitOfWork.execute).toHaveBeenCalled();
    expect(versionRepo.save).not.toHaveBeenCalled();
  });
});
