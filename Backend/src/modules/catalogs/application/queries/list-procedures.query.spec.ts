import { ListProceduresQuery } from './list-procedures.query';
import { ProcedureRepositoryPort } from '../../domain/procedure.repository.port';
import { Procedure } from '../../domain/procedure.entity';
import { Money } from '../../domain/money.vo';

class InMemoryProcedureRepository implements ProcedureRepositoryPort {
  procedures: Procedure[] = [];

  async findById(clinicId: string, id: string): Promise<Procedure | null> {
    return this.procedures.find((p) => p.clinicId === clinicId && p.id === id) || null;
  }

  async findByCode(clinicId: string, code: string): Promise<Procedure | null> {
    return this.procedures.find((p) => p.clinicId === clinicId && p.code === code) || null;
  }

  async findAllByClinicId(clinicId: string, includeInactive = false): Promise<Procedure[]> {
    return this.procedures.filter(
      (p) => p.clinicId === clinicId && (includeInactive || p.isActive),
    );
  }

  async save(procedure: Procedure): Promise<void> {
    this.procedures.push(procedure);
  }
}

describe('ListProceduresQuery', () => {
  let query: ListProceduresQuery;
  let repo: InMemoryProcedureRepository;

  beforeEach(async () => {
    repo = new InMemoryProcedureRepository();
    query = new ListProceduresQuery(repo);

    await repo.save(
      Procedure.create({
        id: 'p1',
        clinicId: 'clinic-123',
        code: 'RES-1',
        name: 'Resina 1',
        basePrice: Money.from(100000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    await repo.save(
      Procedure.create({
        id: 'p2',
        clinicId: 'clinic-123',
        code: 'RES-2',
        name: 'Resina 2',
        basePrice: Money.from(120000),
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    await repo.save(
      Procedure.create({
        id: 'p3',
        clinicId: 'clinic-456',
        code: 'RES-3',
        name: 'Resina otra clínica',
        basePrice: Money.from(130000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it('debe crear, actualizar y listar procedimientos aislando por clinicId', async () => {
    const activeResults = await query.execute({ clinicId: 'clinic-123' });
    expect(activeResults).toHaveLength(1);
    expect(activeResults[0].id).toBe('p1');

    const allResults = await query.execute({ clinicId: 'clinic-123', includeInactive: true });
    expect(allResults).toHaveLength(2);
    expect(allResults.map((p: Procedure) => p.id)).toEqual(['p1', 'p2']);
  });
});
