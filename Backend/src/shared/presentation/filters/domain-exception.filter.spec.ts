import { DomainExceptionFilter } from './domain-exception.filter';
import { DomainError, DomainErrorCategory } from '../../domain/domain-error';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

class CustomDomainError extends DomainError {
  constructor(
    readonly category: DomainErrorCategory,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: Partial<Request>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new DomainExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      correlationId: 'corr-xyz-789',
      headers: { 'x-correlation-id': 'corr-xyz-789' },
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse as unknown as Response,
        getRequest: () => mockRequest as Request,
      }),
    } as unknown as ArgumentsHost;
  });

  const categories: Array<{ category: DomainErrorCategory; expectedStatus: number }> = [
    { category: 'VALIDATION', expectedStatus: HttpStatus.BAD_REQUEST },
    { category: 'UNAUTHORIZED', expectedStatus: HttpStatus.UNAUTHORIZED },
    { category: 'FORBIDDEN', expectedStatus: HttpStatus.FORBIDDEN },
    { category: 'NOT_FOUND', expectedStatus: HttpStatus.NOT_FOUND },
    { category: 'CONFLICT', expectedStatus: HttpStatus.CONFLICT },
    { category: 'INVARIANT_VIOLATION', expectedStatus: HttpStatus.UNPROCESSABLE_ENTITY },
  ];

  for (const { category, expectedStatus } of categories) {
    it(`debe mapear categoría ${category} a estado HTTP ${expectedStatus}`, () => {
      const error = new CustomDomainError(category, `ERR_${category}`, `Mensaje para ${category}`);

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: expectedStatus,
          errorCode: `ERR_${category}`,
          message: `Mensaje para ${category}`,
          correlationId: 'corr-xyz-789',
          timestamp: expect.any(String),
        }),
      );
    });
  }

  it('debe obtener correlationId desde las cabeceras si request.correlationId no está definido', () => {
    mockRequest = {
      headers: { 'x-correlation-id': 'corr-from-header' },
    };

    const error = new CustomDomainError('NOT_FOUND', 'RESOURCE_NOT_FOUND', 'No encontrado');

    filter.catch(error, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'corr-from-header',
      }),
    );
  });
});
