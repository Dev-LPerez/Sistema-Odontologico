import { ConsumeMaterialStockUseCase } from './consume-material-stock.use-case';
import { MaterialRepositoryPort } from '../../domain/material.repository.port';
import { Material } from '../../domain/material.entity';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  InsufficientMaterialStockError,
  MaterialNotFoundError,
} from '../../domain/catalogs.errors';

class InMemoryMaterialRepository implements MaterialRepositoryPort {
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
    return (
      this.materials.find(
        (m) =>
          m.clinicId === clinicId &&
          m.brand === brand &&
          m.reference === reference &&
          m.color === color,
      ) || null
    );
  }

  async findAllByClinicId(clinicId: string, includeInactive = false): Promise<Material[]> {
    return this.materials.filter((m) => m.clinicId === clinicId && (includeInactive || m.isActive));
  }

  async save(material: Material): Promise<void> {
    const idx = this.materials.findIndex(
      (m) => m.clinicId === material.clinicId && m.id === material.id,
    );
    if (idx >= 0) {
      this.materials[idx] = material;
    } else {
      this.materials.push(material);
    }
  }
}

describe('ConsumeMaterialStockUseCase', () => {
  let useCase: ConsumeMaterialStockUseCase;
  let repo: InMemoryMaterialRepository;
  let clock: ClockPort;

  beforeEach(async () => {
    repo = new InMemoryMaterialRepository();
    clock = {
      now: jest.fn().mockReturnValue(new Date('2026-10-15T11:00:00.000Z')),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15 06:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    useCase = new ConsumeMaterialStockUseCase(repo, clock);

    await repo.save(
      Material.create({
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
      }),
    );
  });

  it('debe descontar existencias del material y activar isLowStock cuando currentStock es menor o igual a minStock', async () => {
    const result = await useCase.execute({
      clinicId: 'clinic-123',
      materialId: 'mat-1',
      quantity: 2,
    });

    expect(result.currentStock).toBe(1);
    expect(result.isLowStock).toBe(true);
    expect(result.updatedAt).toEqual(clock.now());
  });

  it('debe lanzar InsufficientMaterialStockError (422) cuando la cantidad solicitada supera currentStock', async () => {
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        materialId: 'mat-1',
        quantity: 5,
      }),
    ).rejects.toThrow(InsufficientMaterialStockError);

    const unchanged = await repo.findById('clinic-123', 'mat-1');
    expect(unchanged?.currentStock).toBe(3);
  });

  it('debe lanzar MaterialNotFoundError cuando el material no existe en el consultorio', async () => {
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        materialId: 'mat-inexistente',
        quantity: 1,
      }),
    ).rejects.toThrow(MaterialNotFoundError);
  });
});
