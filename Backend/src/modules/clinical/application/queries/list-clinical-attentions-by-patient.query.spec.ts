import {
  ListClinicalAttentionsByPatientQuery,
  ListClinicalAttentionsByPatientParams,
} from './list-clinical-attentions-by-patient.query';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import { UserRole } from '../../../identity';

describe('ListClinicalAttentionsByPatientQuery', () => {
  let query: ListClinicalAttentionsByPatientQuery;
  let attentionRepo: jest.Mocked<ClinicalAttentionRepositoryPort>;

  const fixedDate = new Date('2026-10-16T10:00:00.000Z');

  beforeEach(() => {
    attentionRepo = {
      findById: jest.fn(),
      findAllByPatientId: jest.fn(),
      save: jest.fn(),
    };

    query = new ListClinicalAttentionsByPatientQuery(attentionRepo);
  });

  const attention1 = ClinicalAttention.create({
    id: 'att-1',
    clinicId: 'clinic-123',
    patientId: 'pat-123',
    clinicalHistoryId: 'hist-123',
    attendedByUserId: 'usr-123',
    status: ClinicalAttentionStatus.OPEN,
    proceduresPerformed: [],
    evolutionNotes: 'Evolución 1',
    privateNotes: 'Nota privada confidencial 1',
    attendedAt: fixedDate,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  });

  const attention2 = ClinicalAttention.create({
    id: 'att-2',
    clinicId: 'clinic-123',
    patientId: 'pat-123',
    clinicalHistoryId: 'hist-123',
    attendedByUserId: 'usr-123',
    status: ClinicalAttentionStatus.OPEN,
    proceduresPerformed: [],
    evolutionNotes: 'Evolución 2',
    privateNotes: 'Nota privada confidencial 2',
    attendedAt: fixedDate,
    createdAt: fixedDate,
    updatedAt: fixedDate,
  });

  it('debe crear, actualizar y listar atenciones clínicas aislando por clinicId y ocultando privateNotes para el rol AUXILIARY', async () => {
    attentionRepo.findAllByPatientId.mockResolvedValue([attention1, attention2]);

    const adminParams: ListClinicalAttentionsByPatientParams = {
      clinicId: 'clinic-123',
      patientId: 'pat-123',
      viewerRole: UserRole.ADMIN,
    };

    const adminResults = await query.execute(adminParams);
    expect(adminResults).toHaveLength(2);
    expect(adminResults[0].privateNotes).toBe('Nota privada confidencial 1');
    expect(adminResults[1].privateNotes).toBe('Nota privada confidencial 2');

    const auxParams: ListClinicalAttentionsByPatientParams = {
      clinicId: 'clinic-123',
      patientId: 'pat-123',
      viewerRole: UserRole.AUXILIARY,
    };

    const auxResults = await query.execute(auxParams);
    expect(auxResults).toHaveLength(2);
    expect(auxResults[0].privateNotes).toBeNull();
    expect(auxResults[1].privateNotes).toBeNull();
    expect(auxResults[0].evolutionNotes).toBe('Evolución 1');
    expect(auxResults[1].evolutionNotes).toBe('Evolución 2');
    expect(attentionRepo.findAllByPatientId).toHaveBeenCalledWith('clinic-123', 'pat-123');
  });
});
