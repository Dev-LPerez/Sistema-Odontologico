import { Inject, Injectable } from '@nestjs/common';
import {
  CLINICAL_HISTORY_REPOSITORY_PORT,
  ClinicalHistoryRepositoryPort,
} from '../../domain/clinical-history.repository.port';
import { ClinicalHistoryNotFoundError } from '../../domain/clinical.errors';
import { CLOCK_PORT, ClockPort } from '../../../../shared/application/ports/clock.port';
import { TreatmentPlanItem } from '../../domain/treatment-plan-item.entity';
import { TreatmentItemStatus } from '../../domain/treatment-item-status.enum';

export interface UpdateTreatmentPlanItemStatusCommand {
  clinicId: string;
  patientId: string;
  itemId: string;
  status: TreatmentItemStatus;
}

@Injectable()
export class UpdateTreatmentPlanItemStatusUseCase {
  constructor(
    @Inject(CLINICAL_HISTORY_REPOSITORY_PORT)
    private readonly historyRepository: ClinicalHistoryRepositoryPort,
    @Inject(CLOCK_PORT)
    private readonly clock: ClockPort,
  ) {}

  async execute(command: UpdateTreatmentPlanItemStatusCommand): Promise<TreatmentPlanItem> {
    const history = await this.historyRepository.findByPatientId(
      command.clinicId,
      command.patientId,
    );
    if (!history) {
      throw new ClinicalHistoryNotFoundError(command.patientId);
    }

    const now = this.clock.now();
    history.updateTreatmentPlanItemStatus(command.itemId, command.status, now);

    await this.historyRepository.save(history);

    const item = history.treatmentItems.find((i) => i.id === command.itemId);
    return item!;
  }
}
