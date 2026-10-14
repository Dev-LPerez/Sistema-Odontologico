import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { Request, Response } from 'express';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFn: jest.Mock;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: jest.fn(),
    };
    nextFn = jest.fn();
  });

  it('debe reutilizar x-correlation-id si viene en la cabecera de la petición', () => {
    const existingId = 'corr-existente-123';
    mockRequest.headers = { 'x-correlation-id': existingId };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFn);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', existingId);
    expect((mockRequest as Request).correlationId).toBe(existingId);
    expect(nextFn).toHaveBeenCalled();
  });

  it('debe generar un nuevo UUID si no viene la cabecera x-correlation-id', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, nextFn);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
    );
    expect((mockRequest as Request).correlationId).toBeDefined();
    expect(nextFn).toHaveBeenCalled();
  });
});
