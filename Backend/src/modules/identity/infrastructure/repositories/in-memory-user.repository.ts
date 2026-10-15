import { Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/user.repository.port';
import { User } from '../../domain/user.entity';
import { Email } from '../../domain/email.vo';

import { DuplicateUserEmailError } from '../../domain/identity.errors';

@Injectable()
export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly items = new Map<string, User>();

  async findById(clinicId: string, id: string): Promise<User | null> {
    const user = this.items.get(id);
    if (!user || user.clinicId !== clinicId) {
      return null;
    }
    return user;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.items.values()) {
      if (user.email.equals(email)) {
        return user;
      }
    }
    return null;
  }

  async findAllByClinicId(clinicId: string): Promise<User[]> {
    const result: User[] = [];
    for (const user of this.items.values()) {
      if (user.clinicId === clinicId) {
        result.push(user);
      }
    }
    return result;
  }

  async save(user: User): Promise<void> {
    for (const existing of this.items.values()) {
      if (existing.id !== user.id && existing.email.equals(user.email)) {
        throw new DuplicateUserEmailError(user.email.value);
      }
    }
    this.items.set(user.id, user);
  }

  clear(): void {
    this.items.clear();
  }
}
