import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '../../domain/document-type.enum';
import { AcquisitionSource } from '../../domain/acquisition-source.enum';

export class CreatePatientDto {
  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Gómez' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.CC })
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @ApiProperty({ example: '1020304050' })
  @IsString()
  @IsNotEmpty()
  documentNumber!: string;

  @ApiProperty({ example: '1990-05-15' })
  @IsString()
  @IsNotEmpty()
  birthDate!: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'carlos@example.com' })
  @IsOptional()
  @IsString()
  email?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Calle 100 # 15-20' })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'María Gómez' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '3109876543' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string | null;

  @ApiPropertyOptional({
    enum: AcquisitionSource,
    default: AcquisitionSource.DIRECT,
    example: AcquisitionSource.INSTAGRAM,
  })
  @IsOptional()
  @IsEnum(AcquisitionSource)
  acquisitionSource?: AcquisitionSource;

  @ApiProperty({
    example: true,
    description: 'Consentimiento explícito de tratamiento de datos según Ley 1581 de 2012',
  })
  @IsBoolean()
  dataTreatmentConsent!: boolean;
}
