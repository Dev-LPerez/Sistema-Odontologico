import {
  GetToothMaterialHistoryQuery,
  GetToothMaterialHistoryParams,
  ToothMaterialHistoryItem,
} from './get-tooth-material-history.query';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionStatus } from '../../domain/clinical-attention-status.enum';
import { AttentionMaterialUsed } from '../../domain/attention-material-used.entity';
import { InvalidOdontogramDataError } from '../../domain/clinical.errors';

describe('GetToothMaterialHistoryQuery', () => {
  let query: GetToothMaterialHistoryQuery;
  let attentionRepo: jest.Mocked<ClinicalAttentionRepositoryPort>;

  const clinicId = 'clinic-100';
  const patientId = 'patient-200';
  const targetTooth = '16';

  const date1 = new Date('2026-10-10T10:00:00.000Z');
  const date2 = new Date('2026-10-15T14:00:00.000Z');

  beforeEach(() => {
    attentionRepo = {
      findById: jest.fn(),
      findAllByPatientId: jest.fn(),
      save: jest.fn(),
    };

    query = new GetToothMaterialHistoryQuery(attentionRepo);
  });

  it('debe lanzar InvalidOdontogramDataError cuando el número de diente no es válido según FDI', async () => {
    const params: GetToothMaterialHistoryParams = {
      clinicId,
      patientId,
      toothNumber: '99',
    };

    await expect(query.execute(params)).rejects.toThrow(InvalidOdontogramDataError);
    expect(attentionRepo.findAllByPatientId).not.toHaveBeenCalled();
  });

  it('debe retornar un arreglo vacío si el paciente no tiene atenciones registradas', async () => {
    attentionRepo.findAllByPatientId.mockResolvedValue([]);

    const result = await query.execute({ clinicId, patientId, toothNumber: targetTooth });

    expect(result).toEqual([]);
    expect(attentionRepo.findAllByPatientId).toHaveBeenCalledWith(clinicId, patientId);
  });

  it('debe retornar cronológicamente los materiales usados exclusivamente en el diente especificado', async () => {
    const mat1 = AttentionMaterialUsed.create({
      id: 'mat-1',
      clinicId,
      attentionId: 'att-1',
      materialId: 'm-resina',
      brand: '3M',
      reference: 'Filtek Z350',
      type: 'Resina',
      color: 'A2',
      toothNumber: '16',
      quantity: 1,
      notes: 'Restauración oclusal inicial',
      createdAt: date1,
    });

    const mat2OtherTooth = AttentionMaterialUsed.create({
      id: 'mat-2',
      clinicId,
      attentionId: 'att-1',
      materialId: 'm-resina',
      brand: '3M',
      reference: 'Filtek Z350',
      type: 'Resina',
      color: 'A1',
      toothNumber: '11',
      quantity: 1,
      notes: 'Carilla vestibular',
      createdAt: date1,
    });

    const att1 = ClinicalAttention.create({
      id: 'att-1',
      clinicId,
      patientId,
      clinicalHistoryId: 'hist-1',
      attendedByUserId: 'doc-1',
      status: ClinicalAttentionStatus.CLOSED,
      proceduresPerformed: [{ code: 'RES-01', name: 'Resina', toothNumber: '16' }],
      evolutionNotes: 'Primera sesión',
      attendedAt: date1,
      materialsUsed: [mat1, mat2OtherTooth],
      createdAt: date1,
      updatedAt: date1,
    });

    const mat3 = AttentionMaterialUsed.create({
      id: 'mat-3',
      clinicId,
      attentionId: 'att-2',
      materialId: 'm-sellante',
      brand: 'Ivoclar',
      reference: 'Helioseal',
      type: 'Sellante',
      color: 'Blanco',
      toothNumber: '16',
      quantity: 1,
      notes: 'Sellante de fosas y fisuras',
      createdAt: date2,
    });

    const att2 = ClinicalAttention.create({
      id: 'att-2',
      clinicId,
      patientId,
      clinicalHistoryId: 'hist-1',
      attendedByUserId: 'doc-1',
      status: ClinicalAttentionStatus.CLOSED,
      proceduresPerformed: [{ code: 'SEL-01', name: 'Sellante', toothNumber: '16' }],
      evolutionNotes: 'Segunda sesión',
      attendedAt: date2,
      materialsUsed: [mat3],
      createdAt: date2,
      updatedAt: date2,
    });

    attentionRepo.findAllByPatientId.mockResolvedValue([att2, att1]); // en desorden

    const result = await query.execute({ clinicId, patientId, toothNumber: '16' });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<ToothMaterialHistoryItem>({
      attentionId: 'att-1',
      attendedAt: date1.toISOString(),
      materialId: 'm-resina',
      brand: '3M',
      reference: 'Filtek Z350',
      type: 'Resina',
      color: 'A2',
      toothNumber: '16',
      quantity: 1,
      notes: 'Restauración oclusal inicial',
    });
    expect(result[1]).toEqual<ToothMaterialHistoryItem>({
      attentionId: 'att-2',
      attendedAt: date2.toISOString(),
      materialId: 'm-sellante',
      brand: 'Ivoclar',
      reference: 'Helioseal',
      type: 'Sellante',
      color: 'Blanco',
      toothNumber: '16',
      quantity: 1,
      notes: 'Sellante de fosas y fisuras',
    });
  });
});
