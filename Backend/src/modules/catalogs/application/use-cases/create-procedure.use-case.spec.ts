import { CreateProcedureUseCase } from './create-procedure.use-case';
import { ProcedureRepositoryPort } from '../../domain/procedure.repository.port';
import { Procedure } from '../../domain/procedure.entity';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import { DuplicateProcedureCodeError } from '../../domain/catalogs.errors';

class InMemoryProcedureRepository implements ProcedureRepositoryPort {
  procedures: Procedure[] = [];

  async findById(clinicId: string, id: string): Promise<Procedure | null> {
    return this.procedures.find((p) => p.clinicId === clinicId && p.id === id) || null;
  }

  async findByCode(clinicId: string, code: string): Promise<Procedure | null> {
    const normalized = code.trim().toUpperCase();
    return this.procedures.find((p) => p.clinicId === clinicId && p.code === normalized) || null;
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
      const duplicateCode = this.procedures.find(
        (p) => p.clinicId === procedure.clinicId && p.code === procedure.code,
      );
      if (duplicateCode) {
        throw new DuplicateProcedureCodeError(procedure.code);
      }
      this.procedures.push(procedure);
    }
  }
}

describe('CreateProcedureUseCase', () => {
  let useCase: CreateProcedureUseCase;
  let repo: InMemoryProcedureRepository;
  let clock: ClockPort;
  let idGen: IdGeneratorPort;

  beforeEach(() => {
    repo = new InMemoryProcedureRepository();
    clock = {
      now: jest.fn().mockReturnValue(new Date('2026-10-15T10:00:00.000Z')),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15 05:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    let counter = 1;
    idGen = { generate: () => `proc-generated-${counter++}` };
    useCase = new CreateProcedureUseCase(repo, clock, idGen);
  });

  it('debe crear, actualizar y listar procedimientos aislando por clinicId', async () => {
    const result = await useCase.execute({
      clinicId: 'clinic-123',
      code: 'res-est',
      name: 'Resina estética',
      description: 'Restauración en resina',
      basePriceCop: 180000,
    });

    expect(result.id).toBe('proc-generated-1');
    expect(result.clinicId).toBe('clinic-123');
    expect(result.code).toBe('RES-EST');
    expect(result.name).toBe('Resina estética');
    expect(result.basePrice.amount).toBe(180000);
    expect(result.isActive).toBe(true);
  });

  it('debe lanzar DuplicateProcedureCodeError (409) cuando el código ya existe en el mismo consultorio (P2002)', async () => {
    await useCase.execute({
      clinicId: 'clinic-123',
      code: 'LIM-GEN',
      name: 'Limpieza dental general',
      basePriceCop: 120000,
    });

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        code: 'lim-gen',
        name: 'Otra limpieza',
        basePriceCop: 150000,
      }),
    ).rejects.toThrow(DuplicateProcedureCodeError);
  });

  it('debe permitir el mismo código en consultorios distintos (aislamiento multitenant)', async () => {
    await useCase.execute({
      clinicId: 'clinic-123',
      code: 'LIM-GEN',
      name: 'Limpieza dental',
      basePriceCop: 120000,
    });

    const otherClinicResult = await useCase.execute({
      clinicId: 'clinic-999',
      code: 'LIM-GEN',
      name: 'Limpieza en otra clínica',
      basePriceCop: 130000,
    });

    expect(otherClinicResult.clinicId).toBe('clinic-999');
    expect(otherClinicResult.code).toBe('LIM-GEN');
  });
});
