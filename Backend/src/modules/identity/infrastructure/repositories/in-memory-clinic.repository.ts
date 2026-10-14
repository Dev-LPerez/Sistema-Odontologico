import { Injectable } from '@nestjs/common';
import { ClinicRepositoryPort } from '../../domain/clinic.repository.port';
import { Clinic } from '../../domain/clinic.entity';

@Injectable()
export class InMemoryClinicRepository implements ClinicRepositoryPort {
  private readonly items = new Map<string, Clinic>();

  async findById(id: string): Promise<Clinic | null> {
    const item = this.items.get(id);
    return item ?? null;
  }

  async save(clinic: Clinic): Promise<void> {
    this.items.set(clinic.id, clinic);
  }

  clear(): void {
    this.items.clear();
  }
}
