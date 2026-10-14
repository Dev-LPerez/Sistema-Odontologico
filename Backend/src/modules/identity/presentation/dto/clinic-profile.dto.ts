import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../domain/role.enum';

export class UserResponseDto {
  @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id!: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  clinicId!: string;

  @ApiProperty({ example: 'auxiliar@consultorio.com' })
  email!: string;

  @ApiProperty({ example: 'Laura Gómez' })
  fullName!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.AUXILIARY })
  role!: UserRole;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-10-13T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-13T10:00:00.000Z' })
  updatedAt!: Date;
}

export class ClinicProfileResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  id!: string;

  @ApiProperty({ example: 'Consultorio Odontológico Dra. Angelee Pacheco' })
  name!: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Calle 100 # 15-20, Consultorio 501',
    nullable: true,
  })
  address!: string | null;

  @ApiPropertyOptional({ type: String, example: '+573001234567', nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'contacto@draangeleepacheco.com',
    nullable: true,
  })
  email!: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'https://r2.draangeleepacheco.com/branding/logo.png',
    nullable: true,
  })
  logoUrl!: string | null;

  @ApiPropertyOptional({
    example: {
      operatingHours: { weekdays: '08:00-18:00' },
      templates: { prescriptionHeader: 'Dra. Angelee Pacheco' },
    },
    nullable: true,
  })
  settings!: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-10-13T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-13T10:00:00.000Z' })
  updatedAt!: Date;
}
