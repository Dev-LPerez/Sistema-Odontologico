import { PrismaUnitOfWorkAdapter } from './prisma-unit-of-work.adapter';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('PrismaUnitOfWorkAdapter', () => {
  let uow: PrismaUnitOfWorkAdapter;
  let mockPrismaService: {
    $transaction: jest.Mock;
    runInTransaction: jest.Mock;
  };

  beforeEach(() => {
    mockPrismaService = {
      $transaction: jest.fn(async (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) => {
        const dummyTx = {} as Prisma.TransactionClient;
        return cb(dummyTx);
      }),
      runInTransaction: jest.fn(
        async (_tx: Prisma.TransactionClient, fn: () => Promise<unknown>) => {
          return fn();
        },
      ),
    };

    uow = new PrismaUnitOfWorkAdapter(mockPrismaService as unknown as PrismaService);
  });

  it('debe ejecutar la función dentro de una transacción de Prisma y retornar su valor', async () => {
    const work = jest.fn().mockResolvedValue('resultado-exitoso');

    const result = await uow.execute(work);

    expect(result).toBe('resultado-exitoso');
    expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrismaService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledTimes(1);
  });

  it('debe propagar la excepción si el trabajo dentro de la transacción falla', async () => {
    const error = new Error('Falla en la base de datos');
    const work = jest.fn().mockRejectedValue(error);

    await expect(uow.execute(work)).rejects.toThrow('Falla en la base de datos');
    expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
  });
});
