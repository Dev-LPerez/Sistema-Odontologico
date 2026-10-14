import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { Email } from './email.vo';
import { UserRole } from './role.enum';
import { UserInactiveError } from './identity.errors';

export interface UserProps {
  id: string;
  clinicId: string;
  email: Email;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<string> {
  private constructor(
    id: string,
    readonly clinicId: string,
    private _email: Email,
    private _passwordHash: string,
    private _fullName: string,
    private _role: UserRole,
    private _isActive: boolean,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(id);
  }

  static create(props: UserProps): User {
    return new User(
      props.id,
      props.clinicId,
      props.email,
      props.passwordHash,
      props.fullName,
      props.role,
      props.isActive,
      props.createdAt,
      props.updatedAt,
    );
  }

  get email(): Email {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get fullName(): string {
    return this._fullName;
  }

  get role(): UserRole {
    return this._role;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  ensureIsActive(): void {
    if (!this._isActive) {
      throw new UserInactiveError();
    }
  }

  deactivate(updatedAt: Date): void {
    this._isActive = false;
    this._updatedAt = updatedAt;
  }

  activate(updatedAt: Date): void {
    this._isActive = true;
    this._updatedAt = updatedAt;
  }

  changePassword(newPasswordHash: string, updatedAt: Date): void {
    this._passwordHash = newPasswordHash;
    this._updatedAt = updatedAt;
  }
}
