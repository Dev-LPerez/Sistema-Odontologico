import {
  ListClinicalAttentionVersionsQuery,
  ListClinicalAttentionVersionsParams,
} from './list-clinical-attention-versions.query';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { ClinicalAttentionVersionRepositoryPort } from '../../domain/clinical-attention-version.repository.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionVersion } from '../../domain/clinical-attention-version.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import { ClinicalAttentionNotFoundError } from '../../domain/clinical.errors';
import { UserRole } from '../../../identity';

describe('ListClinicalAttentionVersionsQuery', () => {
  let query: ListClinicalAttentionVersionsQuery;
  let attentionRepo: jest.Mocked<ClinicalAttentionRepositoryPort>;
  let versionRepo: jest.Mocked<ClinicalAttentionVersionRepositoryPort>;

  const fixedAttendedAt = new Date('2026-10-16T09:00:00.000Z');
  const fixedCreatedAt = new Date('2026-10-16T09:05:00.000Z');

  beforeEach(() => {
    attentionRepo = {
      findById: jest.fn(),
      findAllByPatientId: jest.fn(),
      save: jest.fn(),
    };

    versionRepo = {
      findAllByAttentionId: jest.fn(),
      save: jest.fn(),
    };

    query = new ListClinicalAttentionVersionsQuery(attentionRepo, versionRepo);
  });

  const createAttention = () =>
    ClinicalAttention.create({
      id: 'att-1',
      clinicId: 'clinic-123',
      patientId: 'pat-1',
      clinicalHistoryId: 'hist-1',
      attendedByUserId: 'usr-admin-1',
      status: ClinicalAttentionStatus.CLOSED,
      proceduresPerformed: [{ code: 'RES-01' }],
      evolutionNotes: 'Evolución final',
      prescription: null,
      postOperativeIndications: null,
      privateNotes: 'Nota privada actual',
      attendedAt: fixedAttendedAt,
      createdAt: fixedCreatedAt,
      updatedAt: fixedCreatedAt,
    });

  const createVersion = (versionNumber: number) =>
    ClinicalAttentionVersion.create({
      id: `ver-${versionNumber}`,
      clinicId: 'clinic-123',
      attentionId: 'att-1',
      versionNumber,
      previousData: {
        proceduresPerformed: [{ code: 'RES-01' }],
        evolutionNotes: `Evolución previa v${versionNumber}`,
        prescription: null,
        postOperativeIndications: null,
        privateNotes: `Nota privada histórica v${versionNumber}`,
        attendedAt: fixedAttendedAt.toISOString(),
        updatedAt: fixedCreatedAt.toISOString(),
        materialsUsed: [],
      },
      changeReason: `Motivo de la versión ${versionNumber}`,
      amendedByUserId: 'usr-admin-1',
      createdAt: new Date('2026-10-16T10:00:00.000Z'),
    });

  it('debe enmendar una atención cerrada guardando la versión inmutable previa y ocultando privateNotes en el historial para AUXILIARY', async () => {
    const attention = createAttention();
    attentionRepo.findById.mockResolvedValue(attention);

    const version1 = createVersion(1);
    versionRepo.findAllByAttentionId.mockResolvedValue([version1]);

    // Consulta con rol AUXILIARY
    const auxiliaryParams: ListClinicalAttentionVersionsParams = {
      clinicId: 'clinic-123',
      attentionId: 'att-1',
      viewerRole: UserRole.AUXILIARY,
    };

    const auxiliaryResult = await query.execute(auxiliaryParams);
    expect(auxiliaryResult).toHaveLength(1);
    expect(auxiliaryResult[0].versionNumber).toBe(1);
    expect(auxiliaryResult[0].previousData.evolutionNotes).toBe('Evolución previa v1');
    expect(auxiliaryResult[0].previousData.privateNotes).toBeNull();

    // Consulta con rol ADMIN
    const adminParams: ListClinicalAttentionVersionsParams = {
      clinicId: 'clinic-123',
      attentionId: 'att-1',
      viewerRole: UserRole.ADMIN,
    };

    const adminResult = await query.execute(adminParams);
    expect(adminResult).toHaveLength(1);
    expect(adminResult[0].previousData.privateNotes).toBe('Nota privada histórica v1');
  });

  it('debe lanzar ClinicalAttentionNotFoundError si la atención clínica no existe en el clinicId', async () => {
    attentionRepo.findById.mockResolvedValue(null);

    const params: ListClinicalAttentionVersionsParams = {
      clinicId: 'clinic-123',
      attentionId: 'non-existent',
      viewerRole: UserRole.ADMIN,
    };

    await expect(query.execute(params)).rejects.toThrow(ClinicalAttentionNotFoundError);
    expect(versionRepo.findAllByAttentionId).not.toHaveBeenCalled();
  });

  it('debe devolver un arreglo vacío si la atención clínica no tiene versiones históricas registradas', async () => {
    const attention = createAttention();
    attentionRepo.findById.mockResolvedValue(attention);
    versionRepo.findAllByAttentionId.mockResolvedValue([]);

    const params: ListClinicalAttentionVersionsParams = {
      clinicId: 'clinic-123',
      attentionId: 'att-1',
      viewerRole: UserRole.ADMIN,
    };

    const result = await query.execute(params);
    expect(result).toEqual([]);
  });
});
