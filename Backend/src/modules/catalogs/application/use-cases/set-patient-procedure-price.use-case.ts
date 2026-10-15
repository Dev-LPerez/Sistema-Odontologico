import { Inject, Injectable } from '@nestjs/common';
import {
  PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT,
  PatientProcedurePriceRepositoryPort,
} from '../../domain/patient-procedure-price.repository.port';
import {
  PROCEDURE_REPOSITORY_PORT,
  ProcedureRepositoryPort,
} from '../../domain/procedure.repository.port';
import {
  PATIENT_REPOSITORY_TOKEN,
  PatientRepositoryPort,
  PatientNotFoundError,
} from '../../../patients';
import { PatientProcedurePrice } from '../../domain/patient-procedure-price.entity';
import { Money } from '../../domain/money.vo';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';
import { ProcedureNotFoundError } from '../../domain/catalogs.errors';

export interface SetPatientProcedurePriceCommand {
  clinicId: string;
  patientId: string;
  procedureId: string;
  customPriceCop: number;
  reason: string;
}

@Injectable()
export class SetPatientProcedurePriceUseCase {
  constructor(
    @Inject(PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT)
    private readonly patientProcedurePriceRepository: PatientProcedurePriceRepositoryPort,
    @Inject(PROCEDURE_REPOSITORY_PORT)
    private readonly procedureRepository: ProcedureRepositoryPort,
    @Inject(PATIENT_REPOSITORY_TOKEN)
    private readonly patientRepository: PatientRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: SetPatientProcedurePriceCommand): Promise<PatientProcedurePrice> {
    const procedure = await this.procedureRepository.findById(
      command.clinicId,
      command.procedureId,
    );
    if (!procedure) {
      throw new ProcedureNotFoundError(command.procedureId);
    }

    const patient = await this.patientRepository.findById(command.clinicId, command.patientId);
    if (!patient || patient.clinicId !== command.clinicId) {
      throw new PatientNotFoundError(command.patientId);
    }

    const customPrice = Money.from(command.customPriceCop);
    const now = this.clock.now();

    const existing = await this.patientProcedurePriceRepository.findByPatientAndProcedure(
      command.clinicId,
      command.patientId,
      command.procedureId,
    );

    let priceToSave: PatientProcedurePrice;

    if (existing) {
      existing.update({
        customPrice,
        reason: command.reason,
        updatedAt: now,
      });
      priceToSave = existing;
    } else {
      const id = this.idGenerator.generate();
      priceToSave = PatientProcedurePrice.create({
        id,
        clinicId: command.clinicId,
        patientId: command.patientId,
        procedureId: command.procedureId,
        customPrice,
        reason: command.reason,
        createdAt: now,
        updatedAt: now,
      });
    }

    await this.patientProcedurePriceRepository.save(priceToSave);
    return priceToSave;
  }
}
