import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { IdGeneratorPort } from '../../application/ports/id-generator.port';

@Injectable()
export class UuidGeneratorAdapter implements IdGeneratorPort {
  generate(): string {
    return crypto.randomUUID();
  }
}
