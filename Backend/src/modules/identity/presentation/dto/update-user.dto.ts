import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../domain/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Nombre completo actualizado',
    example: 'Laura Gómez Martínez',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Nuevo correo electrónico',
    example: 'laura.nueva@consultorio.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Rol actualizado en el consultorio',
    enum: UserRole,
    example: UserRole.AUXILIARY,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Nueva contraseña (opcional)',
    example: 'NewSecurePass2026!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
