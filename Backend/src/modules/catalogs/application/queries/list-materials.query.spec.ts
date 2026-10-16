import { ListMaterialsQuery } from './list-materials.query';
import { Material } from '../../domain/material.entity';
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
    this.materials.push(material);
  }

  async consumeStockAtomically(): Promise<Material> {
    throw new Error('Not implemented');
  }
}

describe('ListMaterialsQuery', () => {
  let query: ListMaterialsQuery;
  let repo: InMemoryMaterialRepositoryMock;

  beforeEach(async () => {
    repo = new InMemoryMaterialRepositoryMock();
    query = new ListMaterialsQuery(repo);

    await repo.save(
      Material.create({
        id: 'm1',
        clinicId: 'clinic-123',
        brand: '3M',
        reference: 'Z350',
        type: 'RESIN',
        color: 'A1',
        currentStock: 2,
        minStock: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    await repo.save(
      Material.create({
        id: 'm2',
        clinicId: 'clinic-123',
        brand: '3M',
        reference: 'Z350',
        type: 'RESIN',
        color: 'A2',
        currentStock: 0,
        minStock: 1,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    await repo.save(
      Material.create({
        id: 'm3',
        clinicId: 'clinic-999',
        brand: 'Ivoclar',
        reference: 'Tetric',
        type: 'RESIN',
        color: 'BW',
        currentStock: 5,
        minStock: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it('debe listar materiales activos de un consultorio y permitir incluir inactivos', async () => {
    const active = await query.execute({ clinicId: 'clinic-123' });
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe('m1');

    const all = await query.execute({ clinicId: 'clinic-123', includeInactive: true });
    expect(all).toHaveLength(2);
    expect(all.map((m: Material) => m.id)).toEqual(['m1', 'm2']);
  });
});
