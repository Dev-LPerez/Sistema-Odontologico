import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import { User } from '../../domain/user.entity';
import { Email } from '../../domain/email.vo';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(clinicId: string, id: string): Promise<User | null> {
    const raw = await this.prisma.client.user.findFirst({
      where: { id, clinicId },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const raw = await this.prisma.client.user.findUnique({
      where: { email: email.value },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findAllByClinicId(clinicId: string): Promise<User[]> {
    const rawList = await this.prisma.client.user.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'asc' },
    });
    return rawList.map((raw) => UserMapper.toDomain(raw));
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.client.user.upsert({
      where: { id: user.id },
      create: data,
      update: data,
    });
  }
}
