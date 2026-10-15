import { Inject, Injectable } from '@nestjs/common';
import {
  PROCEDURE_REPOSITORY_PORT,
  ProcedureRepositoryPort,
} from '../../domain/procedure.repository.port';
import { Procedure } from '../../domain/procedure.entity';
import { Money } from '../../domain/money.vo';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';

export interface CreateProcedureCommand {
  clinicId: string;
  code: string;
  name: string;
  description?: string | null;
  basePriceCop: number;
}

@Injectable()
export class CreateProcedureUseCase {
  constructor(
    @Inject(PROCEDURE_REPOSITORY_PORT)
    private readonly procedureRepository: ProcedureRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: CreateProcedureCommand): Promise<Procedure> {
    const id = this.idGenerator.generate();
    const now = this.clock.now();
    const basePrice = Money.from(command.basePriceCop);

    const procedure = Procedure.create({
      id,
      clinicId: command.clinicId,
      code: command.code,
      name: command.name,
      description: command.description,
      basePrice,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await this.procedureRepository.save(procedure);
    return procedure;
  }
}
