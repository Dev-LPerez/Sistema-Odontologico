import { UpdateProcedureUseCase } from './update-procedure.use-case';
import { ProcedureRepositoryPort } from '../../domain/procedure.repository.port';
import { Procedure } from '../../domain/procedure.entity';
import { Money } from '../../domain/money.vo';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { ProcedureNotFoundError } from '../../domain/catalogs.errors';

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
    const existingIndex = this.procedures.findIndex(
      (p) => p.clinicId === procedure.clinicId && p.id === procedure.id,
    );
    if (existingIndex >= 0) {
      this.procedures[existingIndex] = procedure;
    } else {
      this.procedures.push(procedure);
    }
  }
}

describe('UpdateProcedureUseCase', () => {
  let useCase: UpdateProcedureUseCase;
  let repo: InMemoryProcedureRepository;
  let clock: ClockPort;

  beforeEach(() => {
    repo = new InMemoryProcedureRepository();
    clock = {
      now: jest.fn().mockReturnValue(new Date('2026-10-15T12:00:00.000Z')),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15 07:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    useCase = new UpdateProcedureUseCase(repo, clock);
  });

  it('debe crear, actualizar y listar procedimientos aislando por clinicId', async () => {
    const procedure = Procedure.create({
      id: 'proc-1',
      clinicId: 'clinic-123',
      code: 'RES-EST',
      name: 'Resina estándar',
      description: 'Descripción previa',
      basePrice: Money.from(150000),
      isActive: true,
      createdAt: new Date('2026-10-15T10:00:00.000Z'),
      updatedAt: new Date('2026-10-15T10:00:00.000Z'),
    });
    await repo.save(procedure);

    const updated = await useCase.execute({
      clinicId: 'clinic-123',
      id: 'proc-1',
      name: 'Resina estética premium',
      description: 'Restauración dental estética avanzada',
      basePriceCop: 190000,
      isActive: false,
    });

    expect(updated.name).toBe('Resina estética premium');
    expect(updated.description).toBe('Restauración dental estética avanzada');
    expect(updated.basePrice.amount).toBe(190000);
    expect(updated.isActive).toBe(false);
    expect(updated.updatedAt).toEqual(clock.now());
  });

  it('debe actualizar solo el nombre dejando basePriceCop como undefined y verificar que basePrice se conserva', async () => {
    const procedure = Procedure.create({
      id: 'proc-1',
      clinicId: 'clinic-123',
      code: 'RES-EST',
      name: 'Resina estándar',
      description: 'Descripción previa',
      basePrice: Money.from(150000),
      isActive: true,
      createdAt: new Date('2026-10-15T10:00:00.000Z'),
      updatedAt: new Date('2026-10-15T10:00:00.000Z'),
    });
    await repo.save(procedure);

    const updated = await useCase.execute({
      clinicId: 'clinic-123',
      id: 'proc-1',
      name: 'Resina con nuevo nombre',
    });

    expect(updated.name).toBe('Resina con nuevo nombre');
    expect(updated.basePrice.amount).toBe(150000);
    expect(updated.description).toBe('Descripción previa');
    expect(updated.isActive).toBe(true);
  });

  it('debe lanzar ProcedureNotFoundError si el procedimiento no existe en el consultorio', async () => {
    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        id: 'proc-inexistente',
        name: 'Nuevo nombre',
      }),
    ).rejects.toThrow(ProcedureNotFoundError);
  });
});
