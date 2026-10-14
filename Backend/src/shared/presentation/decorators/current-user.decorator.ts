import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUserPayload {
  sub: string;
  clinicId: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
