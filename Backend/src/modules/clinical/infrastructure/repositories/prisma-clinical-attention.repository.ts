import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ClinicalAttentionRepositoryPort } from '../../domain/clinical-attention.repository.port';
import { ClinicalAttention } from '../../domain/clinical-attention.entity';
import { ClinicalAttentionMapper } from '../mappers/clinical-attention.mapper';

@Injectable()
export class PrismaClinicalAttentionRepository implements ClinicalAttentionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(clinicId: string, id: string): Promise<ClinicalAttention | null> {
    const record = await this.prisma.client.clinicalAttention.findFirst({
      where: {
        id,
        clinicId,
      },
      include: {
        materialsUsed: true,
      },
    });

    return record ? ClinicalAttentionMapper.toDomain(record) : null;
  }

  async findAllByPatientId(clinicId: string, patientId: string): Promise<ClinicalAttention[]> {
    const records = await this.prisma.client.clinicalAttention.findMany({
      where: {
        clinicId,
        patientId,
      },
      include: {
        materialsUsed: true,
      },
      orderBy: {
        attendedAt: 'desc',
      },
    });

    return records.map((record) => ClinicalAttentionMapper.toDomain(record));
  }

  async save(attention: ClinicalAttention): Promise<void> {
    const { header, materials } = ClinicalAttentionMapper.toPrisma(attention);

    await this.prisma.client.clinicalAttention.upsert({
      where: { id: header.id },
      create: header,
      update: {
        status: header.status,
        proceduresPerformed: header.proceduresPerformed,
        evolutionNotes: header.evolutionNotes,
        prescription: header.prescription,
        postOperativeIndications: header.postOperativeIndications,
        privateNotes: header.privateNotes,
        attendedAt: header.attendedAt,
        updatedAt: header.updatedAt,
      },
    });

    for (const m of materials) {
      await this.prisma.client.attentionMaterialUsed.upsert({
        where: { id: m.id },
        create: m,
        update: {
          brand: m.brand,
          reference: m.reference,
          type: m.type,
          color: m.color,
          toothNumber: m.toothNumber,
          quantity: m.quantity,
          notes: m.notes,
        },
      });
    }
  }
}
