import { SetPatientProcedurePriceUseCase } from './set-patient-procedure-price.use-case';
import { PatientProcedurePriceRepositoryPort } from '../../domain/patient-procedure-price.repository.port';
import { ProcedureRepositoryPort } from '../../domain/procedure.repository.port';
import {
  PatientRepositoryPort,
  PatientNotFoundError,
  Patient,
  DocumentIdentity,
  PhoneNumber,
  DocumentType,
  AcquisitionSource,
} from '../../../patients';
import { PatientProcedurePrice } from '../../domain/patient-procedure-price.entity';
import { Procedure } from '../../domain/procedure.entity';
import { Money } from '../../domain/money.vo';
import { ClockPort } from '../../../../shared/application/ports/clock.port';
import { IdGeneratorPort } from '../../../../shared/application/ports/id-generator.port';
import {
  ProcedureNotFoundError,
  PatientPriceReasonRequiredError,
} from '../../domain/catalogs.errors';

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
    const idx = this.prices.findIndex(
      (p) =>
        p.clinicId === price.clinicId &&
        p.patientId === price.patientId &&
        p.procedureId === price.procedureId,
    );
    if (idx >= 0) {
      this.prices[idx] = price;
    } else {
      this.prices.push(price);
    }
  }
}

class InMemoryProcedureRepository implements ProcedureRepositoryPort {
  procedures: Procedure[] = [];

  async findById(clinicId: string, id: string): Promise<Procedure | null> {
    return this.procedures.find((p) => p.clinicId === clinicId && p.id === id) || null;
  }

  async findByCode(clinicId: string, code: string): Promise<Procedure | null> {
    return this.procedures.find((p) => p.clinicId === clinicId && p.code === code) || null;
  }

  async findAllByClinicId(clinicId: string): Promise<Procedure[]> {
    return this.procedures.filter((p) => p.clinicId === clinicId);
  }

  async save(procedure: Procedure): Promise<void> {
    this.procedures.push(procedure);
  }
}

function createFakePatient(id: string, clinicId: string): Patient {
  return Patient.create({
    id,
    clinicId,
    firstName: 'Paciente',
    lastName: 'Prueba',
    document: DocumentIdentity.create(DocumentType.CC, '1020304050'),
    birthDate: new Date('1990-01-01'),
    phone: PhoneNumber.create('3001234567'),
    acquisitionSource: AcquisitionSource.DIRECT,
    dataTreatmentConsent: true,
    dataTreatmentConsentAt: new Date('2026-10-14T10:00:00.000Z'),
    isActive: true,
    createdAt: new Date('2026-10-14T10:00:00.000Z'),
    updatedAt: new Date('2026-10-14T10:00:00.000Z'),
  });
}

describe('SetPatientProcedurePriceUseCase', () => {
  let useCase: SetPatientProcedurePriceUseCase;
  let priceRepo: InMemoryPatientProcedurePriceRepository;
  let procRepo: InMemoryProcedureRepository;
  let patientRepo: jest.Mocked<PatientRepositoryPort>;
  let clock: ClockPort;
  let idGen: IdGeneratorPort;

  beforeEach(async () => {
    priceRepo = new InMemoryPatientProcedurePriceRepository();
    procRepo = new InMemoryProcedureRepository();
    patientRepo = {
      findById: jest.fn(),
      findByDocument: jest.fn(),
      findPotentialDuplicates: jest.fn(),
      findAllByClinicId: jest.fn(),
      save: jest.fn(),
    };
    clock = {
      now: jest.fn().mockReturnValue(new Date('2026-10-15T10:00:00.000Z')),
      todayInBogota: jest.fn().mockReturnValue('2026-10-15'),
      formatInBogota: jest.fn().mockReturnValue('2026-10-15 05:00:00'),
      isSameDayInBogota: jest.fn().mockReturnValue(true),
    };
    idGen = { generate: () => 'price-id-123' };

    useCase = new SetPatientProcedurePriceUseCase(priceRepo, procRepo, patientRepo, clock, idGen);

    await procRepo.save(
      Procedure.create({
        id: 'proc-1',
        clinicId: 'clinic-123',
        code: 'RES-EST',
        name: 'Resina estética',
        basePrice: Money.from(180000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it('debe guardar y consultar el precio personalizado por paciente y procedimiento con su motivo', async () => {
    patientRepo.findById.mockResolvedValueOnce(createFakePatient('patient-1', 'clinic-123'));

    const result = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      customPriceCop: 140000,
      reason: 'Tarifa familiar',
    });

    expect(result.id).toBe('price-id-123');
    expect(result.clinicId).toBe('clinic-123');
    expect(result.patientId).toBe('patient-1');
    expect(result.procedureId).toBe('proc-1');
    expect(result.customPrice.amount).toBe(140000);
    expect(result.reason).toBe('Tarifa familiar');
  });

  it('debe actualizar el precio especial si ya existía para ese paciente y procedimiento', async () => {
    patientRepo.findById.mockResolvedValue(createFakePatient('patient-1', 'clinic-123'));

    await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      customPriceCop: 140000,
      reason: 'Tarifa familiar',
    });

    const updated = await useCase.execute({
      clinicId: 'clinic-123',
      patientId: 'patient-1',
      procedureId: 'proc-1',
      customPriceCop: 120000,
      reason: 'Descuento ampliado por convenio',
    });

    expect(updated.id).toBe('price-id-123');
    expect(updated.customPrice.amount).toBe(120000);
    expect(updated.reason).toBe('Descuento ampliado por convenio');
  });

  it('debe lanzar ProcedureNotFoundError si el procedimiento no existe en el consultorio', async () => {
    patientRepo.findById.mockResolvedValueOnce(createFakePatient('patient-1', 'clinic-123'));

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-1',
        procedureId: 'proc-inexistente',
        customPriceCop: 100000,
        reason: 'Motivo válido',
      }),
    ).rejects.toThrow(ProcedureNotFoundError);
  });

  it('debe lanzar PatientNotFoundError si el paciente no existe o es de otro consultorio', async () => {
    patientRepo.findById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-otro',
        procedureId: 'proc-1',
        customPriceCop: 100000,
        reason: 'Motivo',
      }),
    ).rejects.toThrow(PatientNotFoundError);

    patientRepo.findById.mockResolvedValueOnce(
      createFakePatient('patient-otra-clinica', 'clinic-999'),
    );

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-otra-clinica',
        procedureId: 'proc-1',
        customPriceCop: 100000,
        reason: 'Motivo',
      }),
    ).rejects.toThrow(PatientNotFoundError);
  });

  it('debe lanzar PatientPriceReasonRequiredError cuando el motivo está vacío', async () => {
    patientRepo.findById.mockResolvedValueOnce(createFakePatient('patient-1', 'clinic-123'));

    await expect(
      useCase.execute({
        clinicId: 'clinic-123',
        patientId: 'patient-1',
        procedureId: 'proc-1',
        customPriceCop: 140000,
        reason: '   ',
      }),
    ).rejects.toThrow(PatientPriceReasonRequiredError);
  });
});
