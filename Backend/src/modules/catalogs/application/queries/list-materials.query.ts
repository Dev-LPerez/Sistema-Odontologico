import { Inject, Injectable } from '@nestjs/common';
import {
  MATERIAL_REPOSITORY_PORT,
  MaterialRepositoryPort,
} from '../../domain/material.repository.port';
import { Material } from '../../domain/material.entity';

export interface ListMaterialsFilter {
  clinicId: string;
  includeInactive?: boolean;
}

@Injectable()
export class ListMaterialsQuery {
  constructor(
    @Inject(MATERIAL_REPOSITORY_PORT)
    private readonly materialRepository: MaterialRepositoryPort,
  ) {}

  async execute(filter: ListMaterialsFilter): Promise<Material[]> {
    return this.materialRepository.findAllByClinicId(
      filter.clinicId,
      filter.includeInactive ?? false,
    );
  }
}
