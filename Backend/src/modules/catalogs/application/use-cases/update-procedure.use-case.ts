import { Inject, Injectable } from '@nestjs/common';
import {
  PROCEDURE_REPOSITORY_PORT,
  ProcedureRepositoryPort,
} from '../../domain/procedure.repository.port';
import { Procedure } from '../../domain/procedure.entity';
import { Money } from '../../domain/money.vo';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import { ProcedureNotFoundError } from '../../domain/catalogs.errors';

export interface UpdateProcedureCommand {
  clinicId: string;
  id: string;
  name?: string;
  description?: string | null;
  basePriceCop?: number;
  isActive?: boolean;
}

@Injectable()
export class UpdateProcedureUseCase {
  constructor(
    @Inject(PROCEDURE_REPOSITORY_PORT)
    private readonly procedureRepository: ProcedureRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: UpdateProcedureCommand): Promise<Procedure> {
    const procedure = await this.procedureRepository.findById(command.clinicId, command.id);
    if (!procedure) {
      throw new ProcedureNotFoundError(command.id);
    }

    const basePrice =
      command.basePriceCop !== undefined ? Money.from(command.basePriceCop) : undefined;

    procedure.update({
      name: command.name,
      description: command.description,
      basePrice,
      isActive: command.isActive,
      updatedAt: this.clock.now(),
    });

    await this.procedureRepository.save(procedure);
    return procedure;
  }
}
