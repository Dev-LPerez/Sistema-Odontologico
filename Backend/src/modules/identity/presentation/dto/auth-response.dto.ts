import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id!: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  clinicId!: string;

  @ApiProperty({ example: 'doctora@clinica.com' })
  email!: string;

  @ApiProperty({ example: 'Dra. María Pérez' })
  fullName!: string;

  @ApiProperty({ example: 'ADMIN', enum: ['ADMIN', 'AUXILIARY'] })
  role!: string;
}

export class LoginResponseDto {
  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;

  @ApiProperty({
    description: 'Token de acceso JWT de corta duración (15 min)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;
}

export class RefreshResponseDto {
  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;

  @ApiProperty({
    description: 'Nuevo token de acceso JWT tras la rotación de sesión',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;
}
