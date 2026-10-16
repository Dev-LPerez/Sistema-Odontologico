import { TreatmentPlanItem } from './treatment-plan-item.entity';
import { TreatmentItemStatus } from './treatment-item-status.enum';
import { InvalidClinicalHistoryDataError, InvalidOdontogramDataError } from './clinical.errors';

describe('TreatmentPlanItem Entity', () => {
  const defaultProps = {
    id: 'item-1',
    clinicId: 'clinic-1',
    clinicalHistoryId: 'hist-1',
    procedureId: 'proc-1',
    procedureCode: 'RES-EST',
    procedureName: 'Resina Estética',
    toothNumber: '16',
    status: TreatmentItemStatus.PENDING,
    estimatedCostCop: 150000,
    notes: 'Requiere aislamiento absoluto',
    createdAt: new Date('2026-10-15T10:00:00.000Z'),
    updatedAt: new Date('2026-10-15T10:00:00.000Z'),
  };

  it('debe crear un ítem del plan de tratamiento con estado PENDING y campos válidos', () => {
    const item = TreatmentPlanItem.create(defaultProps);

    expect(item.id).toBe('item-1');
    expect(item.clinicId).toBe('clinic-1');
    expect(item.clinicalHistoryId).toBe('hist-1');
    expect(item.procedureId).toBe('proc-1');
    expect(item.procedureCode).toBe('RES-EST');
    expect(item.procedureName).toBe('Resina Estética');
    expect(item.toothNumber).toBe('16');
    expect(item.status).toBe(TreatmentItemStatus.PENDING);
    expect(item.estimatedCostCop).toBe(150000);
    expect(item.notes).toBe('Requiere aislamiento absoluto');
    expect(item.createdAt).toEqual(new Date('2026-10-15T10:00:00.000Z'));
    expect(item.updatedAt).toEqual(new Date('2026-10-15T10:00:00.000Z'));
  });

  it('debe actualizar el estado a IN_PROGRESS y COMPLETED correctamente', () => {
    const item = TreatmentPlanItem.create(defaultProps);

    const updateDate1 = new Date('2026-10-15T11:00:00.000Z');
    item.updateStatus(TreatmentItemStatus.IN_PROGRESS, updateDate1);
    expect(item.status).toBe(TreatmentItemStatus.IN_PROGRESS);
    expect(item.updatedAt).toEqual(updateDate1);

    const updateDate2 = new Date('2026-10-15T12:00:00.000Z');
    item.updateStatus(TreatmentItemStatus.COMPLETED, updateDate2);
    expect(item.status).toBe(TreatmentItemStatus.COMPLETED);
    expect(item.updatedAt).toEqual(updateDate2);
  });

  it('debe fallar si estimatedCostCop es negativo', () => {
    expect(() =>
      TreatmentPlanItem.create({
        ...defaultProps,
        estimatedCostCop: -100,
      }),
    ).toThrow(InvalidClinicalHistoryDataError);
  });

  it('debe fallar si algún campo obligatorio está vacío', () => {
    expect(() =>
      TreatmentPlanItem.create({
        ...defaultProps,
        procedureCode: '  ',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);

    expect(() =>
      TreatmentPlanItem.create({
        ...defaultProps,
        procedureName: '',
      }),
    ).toThrow(InvalidClinicalHistoryDataError);
  });

  it('debe lanzar InvalidOdontogramDataError (400) cuando toothNumber en el plan de tratamiento no es un código FDI válido', () => {
    expect(() =>
      TreatmentPlanItem.create({
        ...defaultProps,
        toothNumber: '99',
      }),
    ).toThrow(InvalidOdontogramDataError);

    expect(() =>
      TreatmentPlanItem.create({
        ...defaultProps,
        toothNumber: 'diente-invalido',
      }),
    ).toThrow(InvalidOdontogramDataError);
  });
});
