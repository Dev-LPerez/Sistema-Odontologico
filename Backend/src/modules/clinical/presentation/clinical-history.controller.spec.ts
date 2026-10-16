import { ClinicalHistoryController } from './clinical-history.controller';
import { CreateClinicalHistoryUseCase } from '../application/use-cases/create-clinical-history.use-case';
import { UpdateClinicalHistoryUseCase } from '../application/use-cases/update-clinical-history.use-case';
import { AddTreatmentPlanItemUseCase } from '../application/use-cases/add-treatment-plan-item.use-case';
import { UpdateTreatmentPlanItemStatusUseCase } from '../application/use-cases/update-treatment-plan-item-status.use-case';
import { GetClinicalHistoryByPatientQuery } from '../application/queries/get-clinical-history-by-patient.query';
import { ExportClinicalHistoryPdfQuery } from '../application/queries/export-clinical-history-pdf.query';
import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ClinicalHistory } from '../domain/clinical-history.entity';
import { MedicalAntecedents } from '../domain/medical-antecedents.vo';
import { TreatmentPlanItem } from '../domain/treatment-plan-item.entity';
import { TreatmentItemStatus } from '../domain/treatment-item-status.enum';
import { UserRole } from '../../identity';
import { AuthenticatedUserPayload } from '../../../shared/presentation/decorators';

describe('ClinicalHistoryController Unit Tests', () => {
  let controller: ClinicalHistoryController;
  let createUseCase: jest.Mocked<CreateClinicalHistoryUseCase>;
  let updateUseCase: jest.Mocked<UpdateClinicalHistoryUseCase>;
  let addPlanItemUseCase: jest.Mocked<AddTreatmentPlanItemUseCase>;
  let updatePlanStatusUseCase: jest.Mocked<UpdateTreatmentPlanItemStatusUseCase>;
  let getHistoryQuery: jest.Mocked<GetClinicalHistoryByPatientQuery>;
  let exportPdfQuery: jest.Mocked<ExportClinicalHistoryPdfQuery>;

  const mockUser: AuthenticatedUserPayload = {
    sub: 'user-admin-1',
    clinicId: 'clinic-123',
    email: 'dra.angelee@example.com',
    role: UserRole.ADMIN,
  };

  const fixedDate = new Date('2026-10-15T10:00:00.000Z');

  const sampleHistory = ClinicalHistory.create({
    id: 'hist-123',
    clinicId: 'clinic-123',
    patientId: 'patient-123',
    chiefComplaint: 'Dolor dental',
    currentIllness: 'Dolor continuo',
    medicalAntecedents: MedicalAntecedents.create({
      hypertension: false,
      diabetes: false,
      allergies: true,
      allergiesDetails: 'Penicilina',
      medications: false,
      bleedingDisorders: false,
      pregnancy: false,
    }),
    clinicalExamination: 'Caries en 16',
    diagnoses: [{ code: 'K02.1', description: 'Caries de la dentina' }],
    createdAt: fixedDate,
    updatedAt: fixedDate,
  });

  const sampleItem = TreatmentPlanItem.create({
    id: 'item-123',
    clinicId: 'clinic-123',
    clinicalHistoryId: 'hist-123',
    procedureId: 'proc-123',
    procedureCode: 'RES-EST',
    procedureName: 'Resina Estética',
    toothNumber: '16',
    status: TreatmentItemStatus.PENDING,
    estimatedCostCop: 150000,
    notes: 'Aislamiento',
    createdAt: fixedDate,
    updatedAt: fixedDate,
  });

  beforeEach(async () => {
    createUseCase = { execute: jest.fn() } as unknown as jest.Mocked<CreateClinicalHistoryUseCase>;
    updateUseCase = { execute: jest.fn() } as unknown as jest.Mocked<UpdateClinicalHistoryUseCase>;
    addPlanItemUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddTreatmentPlanItemUseCase>;
    updatePlanStatusUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateTreatmentPlanItemStatusUseCase>;
    getHistoryQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetClinicalHistoryByPatientQuery>;
    exportPdfQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ExportClinicalHistoryPdfQuery>;

    controller = new ClinicalHistoryController(
      createUseCase,
      updateUseCase,
      addPlanItemUseCase,
      updatePlanStatusUseCase,
      getHistoryQuery,
      exportPdfQuery,
    );
  });

  it('debe abrir la historia clínica única mediante create()', async () => {
    createUseCase.execute.mockResolvedValue(sampleHistory);

    const dto = {
      patientId: 'patient-123',
      chiefComplaint: 'Dolor dental',
      currentIllness: 'Dolor continuo',
      personalAntecedents: {
        hypertension: false,
        diabetes: false,
        allergies: true,
        allergiesDetails: 'Penicilina',
        medications: false,
        bleedingDisorders: false,
        pregnancy: false,
      },
      familyAntecedents: 'Madre hipertensa',
      clinicalExamination: 'Caries en 16',
      diagnoses: [{ code: 'K02.1', description: 'Caries de la dentina' }],
    };

    const result = await controller.create(mockUser, dto);

    expect(result.id).toBe('hist-123');
    expect(result.chiefComplaint).toBe('Dolor dental');
    expect(createUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor dental',
      currentIllness: 'Dolor continuo',
      personalAntecedents: dto.personalAntecedents,
      familyAntecedents: 'Madre hipertensa',
      clinicalExamination: 'Caries en 16',
      diagnoses: dto.diagnoses,
    });
  });

  it('debe actualizar la historia clínica mediante update()', async () => {
    updateUseCase.execute.mockResolvedValue(sampleHistory);

    const dto = {
      chiefComplaint: 'Dolor moderado',
    };

    const result = await controller.update(mockUser, 'patient-123', dto);

    expect(result.id).toBe('hist-123');
    expect(updateUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      chiefComplaint: 'Dolor moderado',
      currentIllness: undefined,
      personalAntecedents: undefined,
      familyAntecedents: undefined,
      clinicalExamination: undefined,
      diagnoses: undefined,
    });
  });

  it('debe consultar la historia clínica por paciente mediante getByPatient()', async () => {
    getHistoryQuery.execute.mockResolvedValue(sampleHistory);

    const result = await controller.getByPatient(mockUser, 'patient-123');

    expect(result.id).toBe('hist-123');
    expect(getHistoryQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
    });
  });

  it('debe agregar un ítem al plan de tratamiento mediante addTreatmentPlanItem()', async () => {
    addPlanItemUseCase.execute.mockResolvedValue(sampleItem);

    const dto = {
      procedureId: 'proc-123',
      toothNumber: '16',
      estimatedCostCop: 150000,
      notes: 'Aislamiento',
    };

    const result = await controller.addTreatmentPlanItem(mockUser, 'patient-123', dto);

    expect(result.id).toBe('item-123');
    expect(result.procedureCode).toBe('RES-EST');
    expect(addPlanItemUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      procedureId: 'proc-123',
      toothNumber: '16',
      estimatedCostCop: 150000,
      notes: 'Aislamiento',
    });
  });

  it('debe actualizar el estado de un ítem del plan mediante updateTreatmentItemStatus()', async () => {
    const completedItem = TreatmentPlanItem.create({
      id: 'item-123',
      clinicId: 'clinic-123',
      clinicalHistoryId: 'hist-123',
      procedureId: 'proc-123',
      procedureCode: 'RES-EST',
      procedureName: 'Resina Estética',
      toothNumber: '16',
      status: TreatmentItemStatus.COMPLETED,
      estimatedCostCop: 150000,
      notes: 'Aislamiento',
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });

    updatePlanStatusUseCase.execute.mockResolvedValue(completedItem);

    const result = await controller.updateTreatmentItemStatus(mockUser, 'patient-123', 'item-123', {
      status: TreatmentItemStatus.COMPLETED,
    });

    expect(result.status).toBe(TreatmentItemStatus.COMPLETED);
    expect(updatePlanStatusUseCase.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
      itemId: 'item-123',
      status: TreatmentItemStatus.COMPLETED,
    });
  });

  it('debe exportar la historia clínica en PDF mediante exportPdf()', async () => {
    const mockPdfResult = {
      buffer: Buffer.from('%PDF-1.4 test'),
      filename: 'historia-clinica-patient-123.pdf',
      contentType: 'application/pdf' as const,
    };
    exportPdfQuery.execute.mockResolvedValue(mockPdfResult);

    const mockRes = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const result = await controller.exportPdf(mockUser, 'patient-123', mockRes);

    expect(result).toBeInstanceOf(StreamableFile);
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="historia-clinica-patient-123.pdf"',
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private',
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(exportPdfQuery.execute).toHaveBeenCalledWith({
      clinicId: 'clinic-123',
      patientId: 'patient-123',
    });
  });
});
