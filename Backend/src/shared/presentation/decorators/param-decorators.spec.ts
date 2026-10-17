import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentClinic } from './current-clinic.decorator';
import { CurrentUser } from './current-user.decorator';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function getParamDecoratorFactory(decorator: Function) {
  class Test {
    public test(@decorator() value: unknown) {
      return value;
    }
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  const key = Object.keys(args)[0];
  return args[key].factory;
}

describe('Param Decorators', () => {
  it('CurrentUser debe extraer el usuario autenticado de la petición', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            sub: 'usr-1',
            clinicId: 'clinic-1',
            email: 'doctor@example.com',
            role: 'ADMIN',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(null, mockCtx);
    expect(result).toEqual({
      sub: 'usr-1',
      clinicId: 'clinic-1',
      email: 'doctor@example.com',
      role: 'ADMIN',
    });
  });

  it('CurrentClinic debe extraer el clinicId del usuario autenticado en la petición', () => {
    const factory = getParamDecoratorFactory(CurrentClinic);
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            clinicId: 'clinic-1',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(null, mockCtx);
    expect(result).toBe('clinic-1');
  });

  it('CurrentClinic debe retornar undefined si request.user no está definido', () => {
    const factory = getParamDecoratorFactory(CurrentClinic);
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    const result = factory(null, mockCtx);
    expect(result).toBeUndefined();
  });
});
