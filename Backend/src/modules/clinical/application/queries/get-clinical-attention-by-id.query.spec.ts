import {
  GetClinicalAttentionByIdQuery,
  GetClinicalAttentionByIdParams,
} from './get-clinical-attention-by-id.query';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import { ClinicalAttentionNotFoundError } from '../../domain/clinical.errors';
import { UserRole } from '../../../identity';

describe('GetClinicalAttentionByIdQuery', () => {
  let query: GetClinicalAttentionByIdQuery;
  let attentionRepo: jest.Mocked<ClinicalAttentionRepositoryPort>;

  const fixedDate = new Date('2026-10-16T10:00:00.000Z');

  beforeEach(() => {
    attentionRepo = {
      findById: jest.fn(),
      findAllByPatientId: jest.fn(),
      save: jest.fn(),
    };

    query = new GetClinicalAttentionByIdQuery(attentionRepo);
  });

  const baseAttention = ClinicalAttention.create({
    id: 'att-1',
    clinicId: 'clinic-123',
    patientId: 'pat-123',
    clinicalHistoryId: 'hist-123',
    attendedByUserId: 'usr-123',
    status: ClinicalAttentionStatus.OPEN,
    proceduresPerformed: [],
    evolutionNotes: 'Evolución detallada',
    prescription: 'Fórmula médica',
    postOperativeIndications: 'Indicaciones',
    privateNotes: 'Nota privada exclusiva de la doctora',
    attendedAt: fixedDate,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  });

  it('debe devolver la atención completa incluyendo privateNotes para el rol ADMIN', async () => {
    attentionRepo.findById.mockResolvedValue(baseAttention);

    const params: GetClinicalAttentionByIdParams = {
      clinicId: 'clinic-123',
      id: 'att-1',
      viewerRole: UserRole.ADMIN,
    };

    const result = await query.execute(params);

    expect(result.id).toBe('att-1');
    expect(result.privateNotes).toBe('Nota privada exclusiva de la doctora');
    expect(result.evolutionNotes).toBe('Evolución detallada');
  });

  it('debe devolver la atención con privateNotes en null para el rol AUXILIARY', async () => {
    attentionRepo.findById.mockResolvedValue(baseAttention);

    const params: GetClinicalAttentionByIdParams = {
      clinicId: 'clinic-123',
      id: 'att-1',
      viewerRole: UserRole.AUXILIARY,
    };

    const result = await query.execute(params);

    expect(result.id).toBe('att-1');
    expect(result.privateNotes).toBeNull();
    expect(result.evolutionNotes).toBe('Evolución detallada');
  });

  it('debe lanzar ClinicalAttentionNotFoundError si la atención no existe en el consultorio', async () => {
    attentionRepo.findById.mockResolvedValue(null);

    await expect(
      query.execute({
        clinicId: 'clinic-123',
        id: 'att-non-existent',
        viewerRole: UserRole.ADMIN,
      }),
    ).rejects.toThrow(ClinicalAttentionNotFoundError);
  });
});
