import { MaterialRepositoryPort } from '../../domain/material.repository.port';
import { Material } from '../../domain/material.entity';
import { DuplicateMaterialCatalogError } from '../../domain/catalogs.errors';

export class InMemoryMaterialRepository implements MaterialRepositoryPort {
  private materials: Material[] = [];

  async findById(clinicId: string, id: string): Promise<Material | null> {
    const found = this.materials.find((m) => m.clinicId === clinicId && m.id === id);
    return found ? this.clone(found) : null;
  }

  async findByNaturalKey(
    clinicId: string,
    brand: string,
    reference: string,
    color: string,
  ): Promise<Material | null> {
    const b = brand.trim().toLowerCase();
    const r = reference.trim().toLowerCase();
    const c = color.trim().toLowerCase();

    const found = this.materials.find(
      (m) =>
        m.clinicId === clinicId &&
        m.brand.trim().toLowerCase() === b &&
        m.reference.trim().toLowerCase() === r &&
        m.color.trim().toLowerCase() === c,
    );
    return found ? this.clone(found) : null;
  }

  async findAllByClinicId(clinicId: string, includeInactive = false): Promise<Material[]> {
    return this.materials
      .filter((m) => {
        if (m.clinicId !== clinicId) return false;
        if (!includeInactive && !m.isActive) return false;
        return true;
      })
      .sort((a, b) => a.brand.localeCompare(b.brand))
      .map((m) => this.clone(m));
  }

  async save(material: Material): Promise<void> {
    const b = material.brand.trim().toLowerCase();
    const r = material.reference.trim().toLowerCase();
    const c = material.color.trim().toLowerCase();

    const duplicate = this.materials.find(
      (m) =>
        m.clinicId === material.clinicId &&
        m.id !== material.id &&
        m.brand.trim().toLowerCase() === b &&
        m.reference.trim().toLowerCase() === r &&
        m.color.trim().toLowerCase() === c,
    );

    if (duplicate) {
      throw new DuplicateMaterialCatalogError(material.brand, material.reference, material.color);
    }

    const index = this.materials.findIndex((m) => m.id === material.id);
    if (index >= 0) {
      this.materials[index] = this.clone(material);
    } else {
      this.materials.push(this.clone(material));
    }
  }

  clear(): void {
    this.materials = [];
  }

  private clone(material: Material): Material {
    return Material.create({
      id: material.id,
      clinicId: material.clinicId,
      brand: material.brand,
      reference: material.reference,
      type: material.type,
      color: material.color,
      currentStock: material.currentStock,
      minStock: material.minStock,
      isActive: material.isActive,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
    });
  }
}
