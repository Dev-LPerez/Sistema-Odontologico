import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateClinicDto {
  @ApiPropertyOptional({
    description: 'Nombre comercial o razón social del consultorio',
    example: 'Consultorio Odontológico Dra. Angelee Pacheco',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Dirección física del consultorio',
    example: 'Calle 100 # 15-20, Consultorio 501',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Teléfono o celular de contacto',
    example: '+573001234567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico de contacto institucional',
    example: 'contacto@draangeleepacheco.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'URL o ruta del logo institucional',
    example: 'https://r2.draangeleepacheco.com/branding/logo.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Configuración personalizada del consultorio (horarios, plantillas, etc.)',
    example: {
      operatingHours: { weekdays: '08:00-18:00', saturday: '08:00-13:00' },
      templates: { prescriptionHeader: 'Dra. Angelee Pacheco - Odontología Integral' },
    },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
