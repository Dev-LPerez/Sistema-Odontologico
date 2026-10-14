import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    guard = new JwtAuthGuard(reflector, jwtService);
  });

  const createMockContext = (headers: Record<string, string> = {}): ExecutionContext => {
    const request = {
      headers,
      user: undefined,
    };

    return {
      getHandler: jest.fn().mockReturnValue(() => {}),
      getClass: jest.fn().mockReturnValue(class Dummy {}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('debe permitir acceso si el endpoint está marcado con @Public()', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    const context = createMockContext();

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('debe lanzar UnauthorizedException si no se envía header Authorization', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('debe lanzar UnauthorizedException si el formato de Authorization no es Bearer', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    const context = createMockContext({ authorization: 'Basic 123456' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('debe lanzar UnauthorizedException si el token es inválido o expiró', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    jwtService.verifyAsync.mockRejectedValueOnce(new Error('jwt expired'));
    const context = createMockContext({ authorization: 'Bearer invalid.token.xyz' });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('debe adjuntar payload a request.user y retornar true si el token es válido', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(false);
    const payload = {
      sub: 'user-1',
      clinicId: 'clinic-1',
      role: 'ADMIN',
      email: 'admin@clinica.com',
    };
    jwtService.verifyAsync.mockResolvedValueOnce(payload);

    const context = createMockContext({ authorization: 'Bearer valid.jwt.token' });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const req = context.switchToHttp().getRequest();
    expect(req.user).toEqual(payload);
  });
});
