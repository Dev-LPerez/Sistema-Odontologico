import { Procedure } from './procedure.entity';
import { Money } from './money.vo';
import { InvalidCatalogDataError } from './catalogs.errors';

describe('Procedure Entity', () => {
  const baseProps = {
    id: 'proc-1',
    clinicId: 'clinic-123',
    code: 'res-est',
    name: 'Resina estética',
    description: 'Restauración dental en resina de alta estética',
    basePrice: Money.from(180000),
    isActive: true,
    createdAt: new Date('2026-10-15T10:00:00.000Z'),
    updatedAt: new Date('2026-10-15T10:00:00.000Z'),
  };

  it('debe crear un procedimiento normalizando el código a mayúsculas y eliminando espacios', () => {
    const procedure = Procedure.create(baseProps);

    expect(procedure.id).toBe('proc-1');
    expect(procedure.clinicId).toBe('clinic-123');
    expect(procedure.code).toBe('RES-EST');
    expect(procedure.name).toBe('Resina estética');
    expect(procedure.description).toBe('Restauración dental en resina de alta estética');
    expect(procedure.basePrice.amount).toBe(180000);
    expect(procedure.isActive).toBe(true);
  });

  it('debe lanzar InvalidCatalogDataError cuando el código está vacío', () => {
    expect(() =>
      Procedure.create({
        ...baseProps,
        code: '   ',
      }),
    ).toThrow(InvalidCatalogDataError);
  });

  it('debe lanzar InvalidCatalogDataError cuando el nombre está vacío', () => {
    expect(() =>
      Procedure.create({
        ...baseProps,
        name: '',
      }),
    ).toThrow(InvalidCatalogDataError);
  });

  it('debe actualizar los datos del procedimiento y actualizar la fecha de modificación', () => {
    const procedure = Procedure.create(baseProps);
    const newUpdatedAt = new Date('2026-10-15T11:00:00.000Z');

    procedure.update({
      name: 'Resina estética premium',
      description: 'Nueva descripción',
      basePrice: Money.from(220000),
      isActive: false,
      updatedAt: newUpdatedAt,
    });

    expect(procedure.name).toBe('Resina estética premium');
    expect(procedure.description).toBe('Nueva descripción');
    expect(procedure.basePrice.amount).toBe(220000);
    expect(procedure.isActive).toBe(false);
    expect(procedure.updatedAt).toEqual(newUpdatedAt);
  });

  it('debe lanzar InvalidCatalogDataError si id o clinicId están vacíos o no son texto', () => {
    expect(() => Procedure.create({ ...baseProps, id: '' })).toThrow(InvalidCatalogDataError);
    expect(() => Procedure.create({ ...baseProps, clinicId: '   ' })).toThrow(
      InvalidCatalogDataError,
    );
  });

  it('debe lanzar InvalidCatalogDataError si basePrice es nulo o no es instancia de Money', () => {
    expect(() =>
      Procedure.create({
        ...baseProps,
        basePrice: null as unknown as Money,
      }),
    ).toThrow(InvalidCatalogDataError);

    expect(() =>
      Procedure.create({
        ...baseProps,
        basePrice: { amount: 150000 } as unknown as Money,
      }),
    ).toThrow(InvalidCatalogDataError);
  });

  it('debe permitir crear con description nula o indefinida e isActive por defecto en true', () => {
    const p1 = Procedure.create({
      ...baseProps,
      description: undefined,
      isActive: undefined,
    });
    expect(p1.description).toBeNull();
    expect(p1.isActive).toBe(true);

    const p2 = Procedure.create({
      ...baseProps,
      description: null,
    });
    expect(p2.description).toBeNull();
  });

  it('debe permitir actualizar description a null', () => {
    const procedure = Procedure.create(baseProps);
    procedure.update({
      description: null,
      updatedAt: new Date('2026-10-15T12:00:00.000Z'),
    });
    expect(procedure.description).toBeNull();
  });
});
