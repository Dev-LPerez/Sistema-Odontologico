import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_HISTORY_REPOSITORY_PORT,
  ClinicalHistoryRepositoryPort,
} from '../../domain/clinical-history.repository.port';
import {
  PROCEDURE_REPOSITORY_PORT,
  ProcedureRepositoryPort,
  PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT,
  PatientProcedurePriceRepositoryPort,
  ProcedureNotFoundError,
} from '../../../catalogs';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import {
  ID_GENERATOR_PORT,
  IdGeneratorPort,
} from '../../../../shared/application/ports/id-generator.port';
import {
  UNIT_OF_WORK_PORT,
  UnitOfWorkPort,
} from '../../../../shared/application/ports/unit-of-work.port';
import { TreatmentPlanItem } from '../../domain/treatment-plan-item.entity';
import { TreatmentItemStatus } from '../../domain/treatment-item-status.enum';

export interface AddTreatmentPlanItemCommand {
  clinicId: string;
  patientId: string;
  procedureId: string;
  toothNumber?: string | null;
  estimatedCostCop?: number;
  notes?: string | null;
}

@Injectable()
export class AddTreatmentPlanItemUseCase {
  constructor(
    @Inject(CLINICAL_HISTORY_REPOSITORY_PORT)
    private readonly historyRepository: ClinicalHistoryRepositoryPort,
    @Inject(PROCEDURE_REPOSITORY_PORT)
    private readonly procedureRepository: ProcedureRepositoryPort,
    @Inject(PATIENT_PROCEDURE_PRICE_REPOSITORY_PORT)
    private readonly patientPriceRepository: PatientProcedurePriceRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly unitOfWork: UnitOfWorkPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT)
    private readonly idGenerator: IdGeneratorPort,
  ) {}

  async execute(command: AddTreatmentPlanItemCommand): Promise<TreatmentPlanItem> {
    return this.unitOfWork.execute(async () => {
      const history = await this.historyRepository.findByPatientId(
        command.clinicId,
        command.patientId,
      );
      if (!history) {
        throw new ClinicalHistoryNotFoundError(command.patientId);
      }

      const procedure = await this.procedureRepository.findById(
        command.clinicId,
        command.procedureId,
      );
      if (!procedure || procedure.clinicId !== command.clinicId) {
        throw new ProcedureNotFoundError(command.procedureId);
      }

      let estimatedCost = command.estimatedCostCop;
      if (typeof estimatedCost !== 'number') {
        const patientPrice = await this.patientPriceRepository.findByPatientAndProcedure(
          command.clinicId,
          command.patientId,
          command.procedureId,
        );
        if (patientPrice) {
          estimatedCost = patientPrice.customPrice.amount;
        } else {
          estimatedCost = procedure.basePrice.amount;
        }
      }

      const now = this.clock.now();
      const id = this.idGenerator.generate();

      const item = TreatmentPlanItem.create({
        id,
        clinicId: command.clinicId,
        clinicalHistoryId: history.id,
        procedureId: procedure.id,
        procedureCode: procedure.code,
        procedureName: procedure.name,
        toothNumber: command.toothNumber,
        status: TreatmentItemStatus.PENDING,
        estimatedCostCop: estimatedCost,
        notes: command.notes,
        createdAt: now,
        updatedAt: now,
      });

      history.addTreatmentPlanItem(item);
      await this.historyRepository.save(history);

      return item;
    });
  }
}
