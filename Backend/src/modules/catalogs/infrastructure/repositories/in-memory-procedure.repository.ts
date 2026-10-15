import { ProcedureRepositoryPort } from '../../domain/procedure.repository.port';
import { Procedure } from '../../domain/procedure.entity';
import { DuplicateProcedureCodeError } from '../../domain/catalogs.errors';

export class InMemoryProcedureRepository implements ProcedureRepositoryPort {
  private procedures: Procedure[] = [];

  async findById(clinicId: string, id: string): Promise<Procedure | null> {
    const found = this.procedures.find((p) => p.clinicId === clinicId && p.id === id);
    return found ? this.clone(found) : null;
  }

  async findByCode(clinicId: string, code: string): Promise<Procedure | null> {
    const normalizedCode = Procedure.normalizeCode(code);
    const found = this.procedures.find((p) => p.clinicId === clinicId && p.code === normalizedCode);
    return found ? this.clone(found) : null;
  }

  async findAllByClinicId(clinicId: string, includeInactive = false): Promise<Procedure[]> {
    return this.procedures
      .filter((p) => {
        if (p.clinicId !== clinicId) return false;
        if (!includeInactive && !p.isActive) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => this.clone(p));
  }

  async save(procedure: Procedure): Promise<void> {
    const duplicate = this.procedures.find(
      (p) =>
        p.clinicId === procedure.clinicId && p.code === procedure.code && p.id !== procedure.id,
    );

    if (duplicate) {
      throw new DuplicateProcedureCodeError(procedure.code);
    }

    const index = this.procedures.findIndex((p) => p.id === procedure.id);
    if (index >= 0) {
      this.procedures[index] = this.clone(procedure);
    } else {
      this.procedures.push(this.clone(procedure));
    }
  }

  clear(): void {
    this.procedures = [];
  }

  private clone(procedure: Procedure): Procedure {
    return Procedure.create({
      id: procedure.id,
      clinicId: procedure.clinicId,
      code: procedure.code,
      name: procedure.name,
      description: procedure.description,
      basePrice: procedure.basePrice,
      isActive: procedure.isActive,
      createdAt: procedure.createdAt,
      updatedAt: procedure.updatedAt,
    });
  }
}
