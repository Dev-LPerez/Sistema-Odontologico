import { CreateMaterialUseCase } from './create-material.use-case';
import { Material } from '../../domain/material.entity';
import { MaterialRepositoryPort } from '../../domain/material.repository.port';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { DuplicateMaterialCatalogError } from '../../domain/catalogs.errors';

class InMemoryMaterialRepositoryMock implements MaterialRepositoryPort {
  materials: Material[] = [];

  async findById(clinicId: string, id: string): Promise<Material | null> {
    return this.materials.find((m) => m.clinicId === clinicId && m.id === id) || null;
  }

  async findByNaturalKey(
    clinicId: string,
    brand: string,
    reference: string,
    color: string,
  ): Promise<Material | null> {
    const b = brand.trim().toLowerCase();
    const r = reference.trim().toLowerCase();
    const c = color.trim().toLowerCase();
    return (
      this.materials.find(
        (m) =>
          m.clinicId === clinicId &&
          m.brand.trim().toLowerCase() === b &&
          m.reference.trim().toLowerCase() === r &&
          m.color.trim().toLowerCase() === c,
      ) || null
    );
  }

  async findAllByClinicId(clinicId: string, includeInactive = false): Promise<Material[]> {
    return this.materials.filter((m) => m.clinicId === clinicId && (includeInactive || m.isActive));
  }

  async save(material: Material): Promise<void> {
    const existing = await this.findByNaturalKey(
      material.clinicId,
      material.brand,
      material.reference,
      material.color,
    );
    if (existing && existing.id !== material.id) {
      throw new DuplicateMaterialCatalogError(material.brand, material.reference, material.color);
    }
    const idx = this.materials.findIndex(
      (m) => m.clinicId === material.clinicId && m.id === material.id,
    );
    if (idx >= 0) {
      this.materials[idx] = material;
    } else {
      this.materials.push(material);
    }
  }

  async consumeStockAtomically(): Promise<Material> {
    throw new Error('Not implemented');
  }
}

describe('CreateMaterialUseCase', () => {
  let useCase: CreateMaterialUseCase;
  let repo: InMemoryMaterialRepositoryMock;
  let clock: ClockPort;
  let idGen: IdGeneratorPort;

  beforeEach(() => {
    repo = new InMemoryMaterialRepositoryMock();
    clock = {
      now: jest.fn().mockReturnValue(new Date('2026-10-15T10:00:00.000Z')),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15 05:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    let counter = 1;
    idGen = { generate: () => `mat-id-${counter++}` };
    useCase = new CreateMaterialUseCase(repo, clock, idGen);
  });

  it('debe registrar un material propio correctamente con cálculo de isLowStock', async () => {
    const result = await useCase.execute({
      clinicId: 'clinic-123',
      brand: '3M',
      reference: 'Filtek Z350',
      type: 'RESIN',
      color: 'A2',
      currentStock: 3,
      minStock: 2,
    });

    expect(result.id).toBe('mat-id-1');
    expect(result.clinicId).toBe('clinic-123');
    expect(result.brand).toBe('3M');
    expect(result.reference).toBe('Filtek Z350');
    expect(result.type).toBe('RESIN');
    expect(result.color).toBe('A2');
    expect(result.currentStock).toBe(3);
    expect(result.minStock).toBe(2);
    expect(result.isLowStock).toBe(false);
  });

  it('debe lanzar DuplicateMaterialCatalogError si ya existe la combinación de marca, referencia y color', async () => {
    await useCase.execute({
      clinicId: 'clinic-123',
      brand: '3M',
      reference: 'Filtek Z350',
      type: 'RESIN',
      color: 'A2',
      currentStock: 3,
      minStock: 2,
    });

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        brand: '3M',
        reference: 'Filtek Z350',
        type: 'RESIN',
        color: 'A2',
        currentStock: 5,
        minStock: 1,
      }),
    ).rejects.toThrow(DuplicateMaterialCatalogError);
  });
});
