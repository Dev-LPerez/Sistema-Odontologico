import { Inject, Injectable } from '@nestjs/common';
import {
  MATERIAL_REPOSITORY_PORT,
  MaterialRepositoryPort,
} from '../../domain/material.repository.port';
import { Material } from '../../domain/material.entity';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import { MaterialNotFoundError } from '../../domain/catalogs.errors';

export interface UpdateMaterialCommand {
  clinicId: string;
  id: string;
  brand?: string;
  reference?: string;
  type?: string;
  color?: string;
  currentStock?: number;
  minStock?: number;
  isActive?: boolean;
}

@Injectable()
export class UpdateMaterialUseCase {
  constructor(
    @Inject(MATERIAL_REPOSITORY_PORT)
    private readonly materialRepository: MaterialRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: UpdateMaterialCommand): Promise<Material> {
    const material = await this.materialRepository.findById(command.clinicId, command.id);
    if (!material) {
      throw new MaterialNotFoundError(command.id);
    }

    material.update({
      brand: command.brand,
      reference: command.reference,
      type: command.type,
      color: command.color,
      currentStock: command.currentStock,
      minStock: command.minStock,
      isActive: command.isActive,
      updatedAt: this.clock.now(),
    });

    await this.materialRepository.save(material);
    return material;
  }
}
