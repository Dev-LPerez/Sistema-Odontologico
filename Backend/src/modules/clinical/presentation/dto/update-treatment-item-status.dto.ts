import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TreatmentItemStatus } from '../../domain/treatment-item-status.enum';

export class UpdateTreatmentItemStatusDto {
  @ApiProperty({
    enum: TreatmentItemStatus,
    description: 'Nuevo estado del ítem en el plan de tratamiento',
    example: TreatmentItemStatus.COMPLETED,
  })
  @IsEnum(TreatmentItemStatus)
  status!: TreatmentItemStatus;
}
