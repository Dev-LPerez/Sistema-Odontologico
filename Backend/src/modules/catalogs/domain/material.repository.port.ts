import { Material } from './material.entity';

export const MATERIAL_REPOSITORY_PORT = Symbol('MaterialRepositoryPort');

export interface MaterialRepositoryPort {
  findById(clinicId: string, id: string): Promise<Material | null>;
  findByNaturalKey(
    clinicId: string,
    brand: string,
    reference: string,
    color: string,
  ): Promise<Material | null>;
  findAllByClinicId(clinicId: string, includeInactive?: boolean): Promise<Material[]>;
  save(material: Material): Promise<void>;
  consumeStockAtomically(
    clinicId: string,
    id: string,
    quantity: number,
    updatedAt: Date,
  ): Promise<Material>;
}
