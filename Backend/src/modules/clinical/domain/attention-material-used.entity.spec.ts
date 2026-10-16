import { AttentionMaterialUsed } from './attention-material-used.entity';
import { InvalidClinicalAttentionDataError, InvalidOdontogramDataError } from './clinical.errors';

describe('AttentionMaterialUsed Entity', () => {
  const fixedDate = new Date('2026-10-16T10:00:00.000Z');

  const validProps = {
    id: 'mat-used-1',
    clinicId: 'clinic-123',
    attentionId: 'att-123',
    materialId: 'mat-1',
    brand: '3M',
    reference: 'Filtek Z350 XT',
    type: 'Resina compuesta',
    color: 'A2',
    toothNumber: '16',
    quantity: 2,
    notes: 'Restauración oclusal profunda',
    createdAt: fixedDate,
  };

  it('debe crear un material usado con datos válidos incluyendo diente FDI', () => {
    const item = AttentionMaterialUsed.create(validProps);

    expect(item.id).toBe('mat-used-1');
    expect(item.clinicId).toBe('clinic-123');
    expect(item.attentionId).toBe('att-123');
    expect(item.materialId).toBe('mat-1');
    expect(item.brand).toBe('3M');
    expect(item.reference).toBe('Filtek Z350 XT');
    expect(item.type).toBe('Resina compuesta');
    expect(item.color).toBe('A2');
    expect(item.toothNumber).toBe('16');
    expect(item.quantity).toBe(2);
    expect(item.notes).toBe('Restauración oclusal profunda');
    expect(item.createdAt).toEqual(fixedDate);
  });

  it('debe permitir crear un material usado sin diente asociado (null o undefined)', () => {
    const item = AttentionMaterialUsed.create({
      ...validProps,
      toothNumber: null,
      notes: null,
    });

    expect(item.toothNumber).toBeNull();
    expect(item.notes).toBeNull();
  });

  it('debe rechazar cuando quantity no es un entero mayor que cero', () => {
    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        quantity: 0,
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        quantity: -1,
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        quantity: 1.5,
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe rechazar cuando toothNumber es un número FDI inválido', () => {
    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        toothNumber: '99',
      }),
    ).toThrow(InvalidOdontogramDataError);

    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        toothNumber: '19',
      }),
    ).toThrow(InvalidOdontogramDataError);
  });

  it('debe rechazar campos obligatorios vacíos o con espacios en blanco', () => {
    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        id: '  ',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        clinicId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        attentionId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        materialId: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        brand: ' ',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        reference: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        type: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);

    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        color: '',
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });

  it('debe rechazar cuando createdAt no es una fecha válida', () => {
    expect(() =>
      AttentionMaterialUsed.create({
        ...validProps,
        createdAt: new Date('invalid'),
      }),
    ).toThrow(InvalidClinicalAttentionDataError);
  });
});
