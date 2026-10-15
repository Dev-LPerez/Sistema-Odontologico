import { Material } from './material.entity';
import { InsufficientMaterialStockError, InvalidCatalogDataError } from './catalogs.errors';

describe('Material Entity', () => {
  const baseProps = {
    id: 'mat-1',
    clinicId: 'clinic-123',
    brand: '3M',
    reference: 'Filtek Z350',
    type: 'RESIN',
    color: 'A2',
    currentStock: 3,
    minStock: 2,
    isActive: true,
    createdAt: new Date('2026-10-15T10:00:00.000Z'),
    updatedAt: new Date('2026-10-15T10:00:00.000Z'),
  };

  it('debe crear un material correctamente y evaluar isLowStock en false cuando currentStock > minStock', () => {
    const material = Material.create(baseProps);

    expect(material.id).toBe('mat-1');
    expect(material.clinicId).toBe('clinic-123');
    expect(material.brand).toBe('3M');
    expect(material.reference).toBe('Filtek Z350');
    expect(material.type).toBe('RESIN');
    expect(material.color).toBe('A2');
    expect(material.currentStock).toBe(3);
    expect(material.minStock).toBe(2);
    expect(material.isLowStock).toBe(false);
  });

  it('debe descontar existencias del material y activar isLowStock cuando currentStock es menor o igual a minStock', () => {
    const material = Material.create(baseProps);
    const consumeDate = new Date('2026-10-15T11:00:00.000Z');

    material.consumeStock(2, consumeDate);

    expect(material.currentStock).toBe(1);
    expect(material.isLowStock).toBe(true);
    expect(material.updatedAt).toEqual(consumeDate);
  });

  it('debe lanzar InsufficientMaterialStockError (422) cuando la cantidad solicitada supera currentStock', () => {
    const material = Material.create(baseProps);
    const consumeDate = new Date('2026-10-15T11:00:00.000Z');

    expect(() => material.consumeStock(4, consumeDate)).toThrow(InsufficientMaterialStockError);
    expect(material.currentStock).toBe(3);
  });

  it('debe lanzar InvalidCatalogDataError cuando la cantidad a descontar es menor o igual a cero', () => {
    const material = Material.create(baseProps);
    const consumeDate = new Date('2026-10-15T11:00:00.000Z');

    expect(() => material.consumeStock(0, consumeDate)).toThrow(InvalidCatalogDataError);
    expect(() => material.consumeStock(-1, consumeDate)).toThrow(InvalidCatalogDataError);
  });

  it('debe lanzar InvalidCatalogDataError cuando se intenta descontar de un material inactivo', () => {
    const material = Material.create({
      ...baseProps,
      isActive: false,
    });
    const consumeDate = new Date('2026-10-15T11:00:00.000Z');

    expect(() => material.consumeStock(1, consumeDate)).toThrow(InvalidCatalogDataError);
  });

  it('debe lanzar InvalidCatalogDataError si se crea con stock negativo', () => {
    expect(() =>
      Material.create({
        ...baseProps,
        currentStock: -1,
      }),
    ).toThrow(InvalidCatalogDataError);

    expect(() =>
      Material.create({
        ...baseProps,
        minStock: -1,
      }),
    ).toThrow(InvalidCatalogDataError);
  });

  it('debe permitir actualizar información y existencias del material', () => {
    const material = Material.create(baseProps);
    const newDate = new Date('2026-10-15T12:00:00.000Z');

    material.update({
      brand: 'Ivoclar',
      reference: 'Tetric N-Ceram',
      type: 'RESIN',
      color: 'A1',
      currentStock: 5,
      minStock: 3,
      isActive: true,
      updatedAt: newDate,
    });

    expect(material.brand).toBe('Ivoclar');
    expect(material.reference).toBe('Tetric N-Ceram');
    expect(material.color).toBe('A1');
    expect(material.currentStock).toBe(5);
    expect(material.minStock).toBe(3);
    expect(material.isLowStock).toBe(false);
    expect(material.updatedAt).toEqual(newDate);
  });
});
