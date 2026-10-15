import { Procedure } from './procedure.entity';

export const PROCEDURE_REPOSITORY_PORT = Symbol('ProcedureRepositoryPort');

export interface ProcedureRepositoryPort {
  findById(clinicId: string, id: string): Promise<Procedure | null>;
  findByCode(clinicId: string, code: string): Promise<Procedure | null>;
  findAllByClinicId(clinicId: string, includeInactive?: boolean): Promise<Procedure[]>;
  save(procedure: Procedure): Promise<void>;
}
