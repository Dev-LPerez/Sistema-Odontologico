import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ForbiddenRoleError } from '../../../modules/identity/domain/identity.errors';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: { role?: string }): ExecutionContext => {
    const request = {
      user,
    };

    return {
      getHandler: jest.fn().mockReturnValue(() => {}),
      getClass: jest.fn().mockReturnValue(class Dummy {}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('debe permitir acceso si no se especificaron roles en el endpoint', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);
    const context = createMockContext({ role: 'AUXILIARY' });

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
  });

  it('debe permitir acceso si la lista de roles requeridos está vacía', () => {
    reflector.getAllAndOverride.mockReturnValueOnce([]);
    const context = createMockContext({ role: 'AUXILIARY' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenRoleError si no existe usuario en la petición', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['ADMIN']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenRoleError);
  });

  it('debe lanzar ForbiddenRoleError si el rol del usuario no coincide con el requerido', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['ADMIN']);
    const context = createMockContext({ role: 'AUXILIARY' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenRoleError);
  });

  it('debe permitir acceso si el rol del usuario coincide con alguno de los requeridos', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['ADMIN', 'AUXILIARY']);
    const context = createMockContext({ role: 'AUXILIARY' });

    expect(guard.canActivate(context)).toBe(true);
  });
});
