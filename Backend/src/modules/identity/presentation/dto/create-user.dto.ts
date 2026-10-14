import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../domain/role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Correo electrónico único del nuevo usuario',
    example: 'auxiliar@consultorio.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Contraseña de acceso inicial (mínimo 8 caracteres)',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Laura Gómez',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @ApiProperty({
    description: 'Rol asignado al usuario dentro del consultorio',
    enum: UserRole,
    example: UserRole.AUXILIARY,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRole;
}
