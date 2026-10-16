import { ClinicalAttention } from './clinical-attention.entity';
import { ClinicalAttentionStatus } from './clinical-attention-status.enum';
import { InvalidClinicalAttentionDataError, ClinicalAttentionClosedError } from './clinical.errors';
import { AttentionMaterialUsed } from './attention-material-used.entity';

describe('ClinicalAttention Aggregate', () => {
  const fixedAttendedAt = new Date('2026-10-16T09:00:00.000Z');
  const fixedCreatedAt = new Date('2026-10-16T09:05:00.000Z');
  const fixedUpdatedAt = new Date('2026-10-16T09:05:00.000Z');

  const validProps = {
    id: 'att-1',
    clinicId: 'clinic-123',
    patientId: 'pat-123',
    clinicalHistoryId: 'hist-123',
    attendedByUserId: 'usr-123',
    status: ClinicalAttentionStatus.OPEN,
    proceduresPerformed: [
      {
        code: 'RES-01',
        name: 'Resina de fotocurado',
        toothNumber: '16',
        surface: 'OCCLUSAL',
      },
    ],
    evolutionNotes: 'Se realiza apertura cavitaria y obturación con resina en pieza 16',
    prescription: 'Ibuprofeno 400mg cada 8 horas por 3 días',
    postOperativeIndications: 'Evitar alimentos duros y calientes durante las primeras 2 horas',
    privateNotes: 'Paciente con ansiedad dental moderada',
    attendedAt: fixedAttendedAt,
    createdAt: fixedCreatedAt,
    updatedAt: fixedUpdatedAt,
    materialsUsed: [],
  };

  it('debe crear una atención clínica con datos válidos completos', () => {
    const attention = ClinicalAttention.create(validProps);

    expect(attention.id).toBe('att-1');
    expect(attention.clinicId).toBe('clinic-123');
    expect(attention.patientId).toBe('pat-123');
    expect(attention.clinicalHistoryId).toBe('hist-123');
    expect(attention.attendedByUserId).toBe('usr-123');
    expect(attention.status).toBe(ClinicalAttentionStatus.OPEN);
    expect(attention.proceduresPerformed).toHaveLength(1);
    expect(attention.proceduresPerformed[0].code).toBe('RES-01');
    expect(attention.evolutionNotes).toBe(
      'Se realiza apertura cavitaria y obturación con resina en pieza 16',
    );
    expect(attention.prescription).toBe('Ibuprofeno 400mg cada 8 horas por 3 días');
    expect(attention.postOperativeIndications).toBe(
      'Evitar alimentos duros y calientes durante las primeras 2 horas',
    );
    expect(attention.privateNotes).toBe('Paciente con ansiedad dental moderada');
    expect(attention.attendedAt).toEqual(fixedAttendedAt);
    expect(attention.createdAt).toEqual(fixedCreatedAt);
    expect(attention.updatedAt).toEqual(fixedUpdatedAt);
    expect(attention.materialsUsed).toEqual([]);
  });

  it('debe permitir crear una atención con campos opcionales en null o undefined', () => {
    const attention = ClinicalAttention.create({
      ...validProps,
      prescription: null,
      postOperativeIndications: null,
      privateNotes: null,
      proceduresPerformed: [],
      materialsUsed: undefined,
    });

    expect(attention.prescription).toBeNull();
    expect(attention.postOperativeIndications).toBeNull();
    expect(attention.privateNotes).toBeNull();
    expect(attention.proceduresPerformed).toEqual([]);
    expect(attention.materialsUsed).toEqual([]);
  });

  it('debe lanzar InvalidClinicalAttentionDataError cuando evolutionNotes está vacío o ClinicalHistoryNotFoundError si no hay historia clínica', () => {
    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        evolutionNotes: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        evolutionNotes: '     ',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe rechazar identificadores obligatorios vacíos', () => {
    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        id: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        clinicId: '  ',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        patientId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        clinicalHistoryId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        attendedByUserId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe rechazar fechas inválidas en attendedAt, createdAt y updatedAt', () => {
    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        attendedAt: new Date('invalid'),
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        createdAt: new Date('invalid'),
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      ClinicalAttention.create({
        ...validProps,
        updatedAt: new Date('invalid'),
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe actualizar los datos de una atención clínica abierta y renovar updatedAt', () => {
    const attention = ClinicalAttention.create(validProps);
    const newUpdatedAt = new Date('2026-10-16T11:00:00.000Z');

    attention.update({
      evolutionNotes: 'Evolución actualizada con pulido final',
      prescription: null,
      postOperativeIndications: 'Indicaciones actualizadas',
      privateNotes: 'Nueva nota privada',
      proceduresPerformed: [
        {
          code: 'PUL-01',
          name: 'Pulido de resina',
          toothNumber: '16',
        },
      ],
      updatedAt: newUpdatedAt,
    });

    expect(attention.evolutionNotes).toBe('Evolución actualizada con pulido final');
    expect(attention.prescription).toBeNull();
    expect(attention.postOperativeIndications).toBe('Indicaciones actualizadas');
    expect(attention.privateNotes).toBe('Nueva nota privada');
    expect(attention.proceduresPerformed).toHaveLength(1);
    expect(attention.proceduresPerformed[0].code).toBe('PUL-01');
    expect(attention.updatedAt).toEqual(newUpdatedAt);
  });

  it('debe rechazar actualización con evolutionNotes vacío si se envía', () => {
    const attention = ClinicalAttention.create(validProps);
    const newUpdatedAt = new Date('2026-10-16T11:00:00.000Z');

    expect(() =>
      attention.update({
        evolutionNotes: '   ',
        updatedAt: newUpdatedAt,
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe agregar un material usado a la atención y actualizar updatedAt', () => {
    const attention = ClinicalAttention.create(validProps);
    const material = AttentionMaterialUsed.create({
      id: 'mat-used-1',
      clinicId: 'clinic-123',
      attentionId: 'att-1',
      materialId: 'mat-1',
      brand: '3M',
      reference: 'Filtek Z350 XT',
      type: 'Resina',
      color: 'A2',
      toothNumber: '16',
      quantity: 1,
      notes: 'Capa oclusal',
      createdAt: fixedCreatedAt,
    });

    const addTime = new Date('2026-10-16T10:30:00.000Z');
    attention.addMaterialUsed(material, addTime);

    expect(attention.materialsUsed).toHaveLength(1);
    expect(attention.materialsUsed[0].id).toBe('mat-used-1');
    expect(attention.updatedAt).toEqual(addTime);
  });

  it('debe rechazar modificaciones y adición de materiales cuando la atención está cerrada (CLOSED)', () => {
    const attention = ClinicalAttention.create({
      ...validProps,
      status: ClinicalAttentionStatus.CLOSED,
    });

    const actionTime = new Date('2026-10-16T12:00:00.000Z');

    expect(() =>
      attention.update({
        evolutionNotes: 'Intento de edición cerrada',
        updatedAt: actionTime,
      }),
    ).toThrow(ClinicalAttentionClosedError);

    const material = AttentionMaterialUsed.create({
      id: 'mat-used-1',
      clinicId: 'clinic-123',
      attentionId: 'att-1',
      materialId: 'mat-1',
      brand: '3M',
      reference: 'Filtek',
      type: 'Resina',
      color: 'A2',
      quantity: 1,
      createdAt: fixedCreatedAt,
    });

    expect(() => attention.addMaterialUsed(material, actionTime)).toThrow(
      ClinicalAttentionClosedError,
    );
  });

  it('debe permitir cerrar la atención cambiando el estado a CLOSED', () => {
    const attention = ClinicalAttention.create(validProps);
    const closeTime = new Date('2026-10-16T13:00:00.000Z');

    attention.close(closeTime);

    expect(attention.status).toBe(ClinicalAttentionStatus.CLOSED);
    expect(attention.updatedAt).toEqual(closeTime);
  });
});
