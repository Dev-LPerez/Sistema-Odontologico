import { Injectable } from '@nestjs/common';
import { UnitOfWorkPort } from '../../application/ports/unit-of-work.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaUnitOfWorkAdapter implements UnitOfWorkPort {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return this.prisma.runInTransaction(tx, work);
    });
  }
}
