import { ListPatientProcedurePricesQuery } from './list-patient-procedure-prices.query';
import { PatientProcedurePriceRepositoryPort } from '../../domain/patient-procedure-price.repository.port';
import { PatientProcedurePrice } from '../../domain/patient-procedure-price.entity';
import { Money } from '../../domain/money.vo';

class InMemoryPatientProcedurePriceRepository implements PatientProcedurePriceRepositoryPort {
  prices: PatientProcedurePrice[] = [];

  async findByPatientAndProcedure(
    clinicId: string,
    patientId: string,
    procedureId: string,
  ): Promise<PatientProcedurePrice | null> {
    return (
      this.prices.find(
        (p) =>
          p.clinicId === clinicId && p.patientId === patientId && p.procedureId === procedureId,
      ) || null
    );
  }

  async findAllByPatient(clinicId: string, patientId: string): Promise<PatientProcedurePrice[]> {
    return this.prices.filter((p) => p.clinicId === clinicId && p.patientId === patientId);
  }

  async save(price: PatientProcedurePrice): Promise<void> {
    this.prices.push(price);
  }
}

describe('ListPatientProcedurePricesQuery', () => {
  let query: ListPatientProcedurePricesQuery;
  let repo: InMemoryPatientProcedurePriceRepository;

  beforeEach(async () => {
    repo = new InMemoryPatientProcedurePriceRepository();
    query = new ListPatientProcedurePricesQuery(repo);

    await repo.save(
      PatientProcedurePrice.create({
        id: 'pp-1',
        clinicId: 'clinic-123',
        patientId: 'patient-1',
        procedureId: 'proc-1',
        customPrice: Money.from(140000),
        reason: 'Tarifa familiar',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    await repo.save(
      PatientProcedurePrice.create({
        id: 'pp-2',
        clinicId: 'clinic-123',
        patientId: 'patient-2',
        procedureId: 'proc-1',
        customPrice: Money.from(150000),
        reason: 'Amigo',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it('debe guardar y consultar el precio personalizado por paciente y procedimiento con su motivo', async () => {
    const results = await query.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('pp-1');
    expect(results[0].customPrice.amount).toBe(140000);
    expect(results[0].reason).toBe('Tarifa familiar');
  });
});
