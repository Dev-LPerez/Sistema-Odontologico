import { UpdateMaterialUseCase } from './update-material.use-case';
import { Material } from '../../domain/material.entity';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { MaterialNotFoundError } from '../../domain/catalogs.errors';
import { MaterialRepositoryPort } from '../../domain/material.repository.port';

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

  async consumeStockAtomically(): Promise<Material> {
    throw new Error('Not implemented');
  }
}

describe('UpdateMaterialUseCase', () => {
  let useCase: UpdateMaterialUseCase;
  let repo: InMemoryMaterialRepositoryMock;
  let clock: ClockPort;

  beforeEach(async () => {
    repo = new InMemoryMaterialRepositoryMock();
    clock = {
      now: jest.fn().mockReturnValue(new Date('2026-10-15T12:00:00.000Z')),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15 07:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    useCase = new UpdateMaterialUseCase(repo, clock);

    await repo.save(
      Material.create({
        id: 'mat-1',
        clinicId: 'clinic-123',
        brand: '3M',
        reference: 'Filtek',
        type: 'RESIN',
        color: 'A2',
        currentStock: 5,
        minStock: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it('debe actualizar los datos del material correctamente', async () => {
    const updated = await useCase.execute({
      clinicId: 'clinic-123',
      id: 'mat-1',
      brand: 'Ivoclar',
      reference: 'Tetric',
      color: 'A1',
      currentStock: 2,
      minStock: 2,
      isActive: false,
    });

    expect(updated.brand).toBe('Ivoclar');
    expect(updated.reference).toBe('Tetric');
    expect(updated.color).toBe('A1');
    expect(updated.currentStock).toBe(2);
    expect(updated.isLowStock).toBe(true);
    expect(updated.isActive).toBe(false);
  });

  it('debe lanzar MaterialNotFoundError si el material no existe en el consultorio', async () => {
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        id: 'mat-inexistente',
        brand: 'Ivoclar',
      }),
    ).rejects.toThrow(MaterialNotFoundError);
  });
});
