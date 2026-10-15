import { PatientProcedurePrice } from './patient-procedure-price.entity';
import { Money } from './money.vo';
import { PatientPriceReasonRequiredError, InvalidCatalogDataError } from './catalogs.errors';

describe('PatientProcedurePrice Entity', () => {
  const baseProps = {
    id: 'price-1',
    clinicId: 'clinic-123',
    patientId: 'patient-456',
    procedureId: 'proc-789',
    customPrice: Money.from(140000),
    reason: 'Tarifa familiar especial',
    createdAt: new Date('2026-10-15T10:00:00.000Z'),
    updatedAt: new Date('2026-10-15T10:00:00.000Z'),
  };

  it('debe crear un precio especial por paciente correctamente', () => {
    const item = PatientProcedurePrice.create(baseProps);

    expect(item.id).toBe('price-1');
    expect(item.clinicId).toBe('clinic-123');
    expect(item.patientId).toBe('patient-456');
    expect(item.procedureId).toBe('proc-789');
    expect(item.customPrice.amount).toBe(140000);
    expect(item.reason).toBe('Tarifa familiar especial');
  });

  it('debe lanzar PatientPriceReasonRequiredError cuando el motivo está vacío o solo tiene espacios', () => {
    expect(() =>
      PatientProcedurePrice.create({
        ...baseProps,
        reason: '   ',
      }),
    ).toThrow(PatientPriceReasonRequiredError);

    expect(() =>
      PatientProcedurePrice.create({
        ...baseProps,
        reason: '',
      }),
    ).toThrow(PatientPriceReasonRequiredError);
  });

  it('debe lanzar InvalidCatalogDataError cuando patientId o procedureId están vacíos', () => {
    expect(() =>
      PatientProcedurePrice.create({
        ...baseProps,
        patientId: '',
      }),
    ).toThrow(InvalidCatalogDataError);

    expect(() =>
      PatientProcedurePrice.create({
        ...baseProps,
        procedureId: '',
      }),
    ).toThrow(InvalidCatalogDataError);
  });

  it('debe permitir actualizar el precio y motivo con validación de motivo no vacío', () => {
    const item = PatientProcedurePrice.create(baseProps);
    const newUpdatedAt = new Date('2026-10-15T11:00:00.000Z');

    item.update({
      customPrice: Money.from(130000),
      reason: 'Promoción del mes',
      updatedAt: newUpdatedAt,
    });

    expect(item.customPrice.amount).toBe(130000);
    expect(item.reason).toBe('Promoción del mes');
    expect(item.updatedAt).toEqual(newUpdatedAt);

    expect(() =>
      item.update({
        customPrice: Money.from(120000),
        reason: '   ',
        updatedAt: newUpdatedAt,
      }),
    ).toThrow(PatientPriceReasonRequiredError);
  });

  it('debe lanzar InvalidCatalogDataError si id o clinicId están vacíos', () => {
    expect(() => PatientProcedurePrice.create({ ...baseProps, id: '' })).toThrow(
      InvalidCatalogDataError,
    );
    expect(() => PatientProcedurePrice.create({ ...baseProps, clinicId: '   ' })).toThrow(
      InvalidCatalogDataError,
    );
  });

  it('debe lanzar InvalidCatalogDataError si customPrice es nulo o no es instancia de Money', () => {
    expect(() =>
      PatientProcedurePrice.create({
        ...baseProps,
        customPrice: null as unknown as Money,
      }),
    ).toThrow(InvalidCatalogDataError);

    expect(() =>
      PatientProcedurePrice.create({
        ...baseProps,
        customPrice: { amount: 100000 } as unknown as Money,
      }),
    ).toThrow(InvalidCatalogDataError);
  });

  it('debe permitir actualizar solo customPrice o solo reason individualmente', () => {
    const item = PatientProcedurePrice.create(baseProps);
    const date1 = new Date('2026-10-15T12:00:00.000Z');
    item.update({
      customPrice: Money.from(110000),
      updatedAt: date1,
    });
    expect(item.customPrice.amount).toBe(110000);
    expect(item.reason).toBe(baseProps.reason);

    const date2 = new Date('2026-10-15T13:00:00.000Z');
    item.update({
      reason: 'Nuevo motivo',
      updatedAt: date2,
    });
    expect(item.customPrice.amount).toBe(110000);
    expect(item.reason).toBe('Nuevo motivo');
  });
});
