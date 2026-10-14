import { DomainError, DomainErrorCategory } from '../../../shared/domain/domain-error';

export class InvalidEmailError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_EMAIL';

  constructor(email: string) {
    super(`El formato del correo electrónico '${email}' no es válido`);
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly category: DomainErrorCategory = 'UNAUTHORIZED';
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Credenciales inválidas');
  }
}

export class UserInactiveError extends DomainError {
  readonly category: DomainErrorCategory = 'UNAUTHORIZED';
  readonly code = 'USER_INACTIVE';

  constructor() {
    super('El usuario se encuentra inactivo');
  }
}

export class InvalidRefreshTokenError extends DomainError {
  readonly category: DomainErrorCategory = 'UNAUTHORIZED';
  readonly code = 'INVALID_REFRESH_TOKEN';

  constructor() {
    super('Token de refresco inválido o expirado');
  }
}

export class ForbiddenRoleError extends DomainError {
  readonly category: DomainErrorCategory = 'FORBIDDEN';
  readonly code = 'FORBIDDEN_ROLE';

  constructor(message = 'No tiene permisos para realizar esta acción') {
    super(message);
  }
}

export class UserNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'USER_NOT_FOUND';

  constructor(identifier: string) {
    super(`Usuario '${identifier}' no encontrado`);
  }
}

export class ClinicNotFoundError extends DomainError {
  readonly category: DomainErrorCategory = 'NOT_FOUND';
  readonly code = 'CLINIC_NOT_FOUND';

  constructor(clinicId: string) {
    super(`Consultorio con ID '${clinicId}' no encontrado`);
  }
}

export class DuplicateUserEmailError extends DomainError {
  readonly category: DomainErrorCategory = 'CONFLICT';
  readonly code = 'DUPLICATE_USER_EMAIL';

  constructor(email: string) {
    super(`El correo electrónico '${email}' ya se encuentra registrado`);
  }
}

export class CannotDeactivateSelfError extends DomainError {
  readonly category: DomainErrorCategory = 'INVARIANT_VIOLATION';
  readonly code = 'CANNOT_DEACTIVATE_SELF';

  constructor() {
    super('Un usuario no puede desactivar su propia cuenta');
  }
}

export class InvalidClinicNameError extends DomainError {
  readonly category: DomainErrorCategory = 'VALIDATION';
  readonly code = 'INVALID_CLINIC_NAME';

  constructor() {
    super('El nombre del consultorio no puede estar vacío');
  }
}
