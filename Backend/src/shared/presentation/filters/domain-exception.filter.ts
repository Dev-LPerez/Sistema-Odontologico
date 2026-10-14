import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError, DomainErrorCategory } from '../../domain/domain-error';

const CATEGORY_HTTP_STATUS_MAP: Record<DomainErrorCategory, HttpStatus> = {
  VALIDATION: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  INVARIANT_VIOLATION: HttpStatus.UNPROCESSABLE_ENTITY,
};

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = CATEGORY_HTTP_STATUS_MAP[exception.category] || HttpStatus.INTERNAL_SERVER_ERROR;
    const correlationId =
      request.correlationId ||
      (request.headers['x-correlation-id'] as string) ||
      (request.headers['x-request-id'] as string) ||
      'unknown';

    this.logger.warn(`[${correlationId}] DomainError [${exception.code}]: ${exception.message}`);

    response.status(status).json({
      statusCode: status,
      errorCode: exception.code,
      message: exception.message,
      correlationId,
      timestamp: new Date().toISOString(),
    });
  }
}
