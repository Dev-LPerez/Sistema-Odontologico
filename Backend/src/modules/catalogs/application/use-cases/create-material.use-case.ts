import { Inject, Injectable } from '@nestjs/common';
import {
  MATERIAL_REPOSITORY_PORT,
  MaterialRepositoryPort,
} from '../../domain/material.repository.port';
import { Material } from '../../domain/material.entity';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';

export interface CreateMaterialCommand {
  clinicId: string;
  brand: string;
  reference: string;
  type: string;
  color: string;
  currentStock: number;
  minStock: number;
}

@Injectable()
export class CreateMaterialUseCase {
  constructor(
    @Inject(MATERIAL_REPOSITORY_PORT)
    private readonly materialRepository: MaterialRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: CreateMaterialCommand): Promise<Material> {
    const id = this.idGenerator.generate();
    const now = this.clock.now();

    const material = Material.create({
      id,
      clinicId: command.clinicId,
      brand: command.brand,
      reference: command.reference,
      type: command.type,
      color: command.color,
      currentStock: command.currentStock,
      minStock: command.minStock,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await this.materialRepository.save(material);
    return material;
  }
}
