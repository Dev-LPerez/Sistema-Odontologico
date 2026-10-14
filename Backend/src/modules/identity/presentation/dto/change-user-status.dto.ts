import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ChangeUserStatusDto {
  @ApiProperty({
    description: 'Nuevo estado activo o inactivo del usuario',
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  isActive!: boolean;
}
