import { User as PrismaUser, UserRole as PrismaUserRole, Prisma } from '@prisma/client';
import { User } from '../../domain/user.entity';
import { Email } from '../../domain/email.vo';
import { UserRole } from '../../domain/role.enum';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create({
      id: raw.id,
      clinicId: raw.clinicId,
      email: Email.create(raw.email),
      passwordHash: raw.passwordHash,
      fullName: raw.fullName,
      role: raw.role as unknown as UserRole,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(domain: User): Prisma.UserUncheckedCreateInput {
    return {
      id: domain.id,
      clinicId: domain.clinicId,
      email: domain.email.value,
      passwordHash: domain.passwordHash,
      fullName: domain.fullName,
      role: domain.role as unknown as PrismaUserRole,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
