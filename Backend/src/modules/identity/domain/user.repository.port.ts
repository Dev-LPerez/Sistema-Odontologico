import { User } from './user.entity';
import { Email } from './email.vo';

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

export interface UserRepositoryPort {
  findById(clinicId: string, id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findAllByClinicId(clinicId: string): Promise<User[]>;
  save(user: User): Promise<void>;
}
