import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { OdontogramSnapshotRepositoryPort } from '../../domain/odontogram-snapshot.repository.port';
import { OdontogramSnapshot } from '../../domain/odontogram-snapshot.entity';
import { OdontogramMapper } from '../mappers/odontogram.mapper';

@Injectable()
export class PrismaOdontogramSnapshotRepository implements OdontogramSnapshotRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByPatientId(clinicId: string, patientId: string): Promise<OdontogramSnapshot[]> {
    const records = await this.prisma.client.odontogramSnapshot.findMany({
      where: {
        clinicId,
        patientId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return records.map((record) => OdontogramMapper.toSnapshotDomain(record));
  }

  async save(snapshot: OdontogramSnapshot): Promise<void> {
    const data = OdontogramMapper.toSnapshotPrisma(snapshot);

    await this.prisma.client.odontogramSnapshot.create({
      data,
    });
  }
}
