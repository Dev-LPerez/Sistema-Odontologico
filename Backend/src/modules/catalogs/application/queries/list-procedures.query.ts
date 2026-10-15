import { Inject, Injectable } from '@nestjs/common';
import {
  PROCEDURE_REPOSITORY_PORT,
  ProcedureRepositoryPort,
} from '../../domain/procedure.repository.port';
import { Procedure } from '../../domain/procedure.entity';

export interface ListProceduresFilter {
  clinicId: string;
  includeInactive?: boolean;
}

@Injectable()
export class ListProceduresQuery {
  constructor(
    @Inject(PROCEDURE_REPOSITORY_PORT)
    private readonly procedureRepository: ProcedureRepositoryPort,
  ) {}

  async execute(filter: ListProceduresFilter): Promise<Procedure[]> {
    return this.procedureRepository.findAllByClinicId(
      filter.clinicId,
      filter.includeInactive ?? false,
    );
  }
}
