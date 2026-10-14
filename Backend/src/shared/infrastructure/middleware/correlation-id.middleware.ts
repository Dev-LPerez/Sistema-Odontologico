import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const headerValue = req.headers['x-correlation-id'] || req.headers['x-request-id'];
    const correlationId =
      typeof headerValue === 'string' && headerValue.trim().length > 0
        ? headerValue
        : crypto.randomUUID();

    req.headers['x-correlation-id'] = correlationId;
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    next();
  }
}
