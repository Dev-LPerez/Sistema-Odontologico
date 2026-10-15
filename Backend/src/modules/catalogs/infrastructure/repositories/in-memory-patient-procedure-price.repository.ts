import { PatientProcedurePriceRepositoryPort } from '../../domain/patient-procedure-price.repository.port';
import { PatientProcedurePrice } from '../../domain/patient-procedure-price.entity';

export class InMemoryPatientProcedurePriceRepository implements PatientProcedurePriceRepositoryPort {
  private prices: PatientProcedurePrice[] = [];

  async findByPatientAndProcedure(
    clinicId: string,
    patientId: string,
    procedureId: string,
  ): Promise<PatientProcedurePrice | null> {
    const found = this.prices.find(
      (p) => p.clinicId === clinicId && p.patientId === patientId && p.procedureId === procedureId,
    );
    return found ? this.clone(found) : null;
  }

  async findAllByPatient(clinicId: string, patientId: string): Promise<PatientProcedurePrice[]> {
    return this.prices
      .filter((p) => p.clinicId === clinicId && p.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((p) => this.clone(p));
  }

  async save(price: PatientProcedurePrice): Promise<void> {
    const index = this.prices.findIndex(
      (p) =>
        p.id === price.id ||
        (p.clinicId === price.clinicId &&
          p.patientId === price.patientId &&
          p.procedureId === price.procedureId),
    );

    if (index >= 0) {
      this.prices[index] = this.clone(price);
    } else {
      this.prices.push(this.clone(price));
    }
  }

  clear(): void {
    this.prices = [];
  }

  private clone(price: PatientProcedurePrice): PatientProcedurePrice {
    return PatientProcedurePrice.create({
      id: price.id,
      clinicId: price.clinicId,
      patientId: price.patientId,
      procedureId: price.procedureId,
      customPrice: price.customPrice,
      reason: price.reason,
      createdAt: price.createdAt,
      updatedAt: price.updatedAt,
    });
  }
}
