import { Inject, Injectable } from '@nestjs/common';
import {
  MATERIAL_REPOSITORY_PORT,
  MaterialRepositoryPort,
} from '../../domain/material.repository.port';
import { Material } from '../../domain/material.entity';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';

export interface ConsumeMaterialStockCommand {
  clinicId: string;
  materialId: string;
  quantity: number;
}

@Injectable()
export class ConsumeMaterialStockUseCase {
  constructor(
    @Inject(MATERIAL_REPOSITORY_PORT)
    private readonly materialRepository: MaterialRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: ConsumeMaterialStockCommand): Promise<Material> {
    return this.materialRepository.consumeStockAtomically(
      command.clinicId,
      command.materialId,
      command.quantity,
      this.clock.now(),
    );
  }
}
