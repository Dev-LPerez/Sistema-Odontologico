export interface ClinicalHistoryPdfClinicData {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
}

export interface ClinicalHistoryPdfPatientData {
  id: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  birthDateFormatted: string;
  age: number;
  phone: string;
  email?: string | null;
  address?: string | null;
  emergencyContact?: {
    name: string;
    phone: string;
  } | null;
}

export interface ClinicalHistoryPdfMedicalAntecedentsData {
  hypertension: boolean;
  diabetes: boolean;
  allergies: boolean;
  allergiesDetails?: string | null;
  medications: boolean;
  medicationsDetails?: string | null;
  bleedingDisorders: boolean;
  pregnancy: boolean;
  otherNotes?: string | null;
  familyAntecedents?: string | null;
}

export interface ClinicalHistoryPdfTreatmentItemData {
  procedureCode: string;
  procedureName?: string | null;
  toothNumber?: string | null;
  status: string;
  estimatedCostCop: number;
}

export interface ClinicalHistoryPdfHistoryData {
  chiefComplaint: string;
  currentIllness: string;
  medicalAntecedents: ClinicalHistoryPdfMedicalAntecedentsData;
  clinicalExamination?: string | null;
  diagnoses: string[];
  treatmentItems: ClinicalHistoryPdfTreatmentItemData[];
  totalEstimatedCostCop: number;
  createdAtFormatted: string;
}

export interface ClinicalHistoryPdfToothFindingData {
  findingCode: string;
  surface?: string | null;
  status: string;
  notes?: string | null;
}

export interface ClinicalHistoryPdfOdontogramData {
  hasTemporalDentition: boolean;
  teeth: Record<string, ClinicalHistoryPdfToothFindingData[]>;
}

export interface ClinicalHistoryPdfProcedureData {
  code: string;
  name?: string | null;
  toothNumber?: string | null;
  surface?: string | null;
  notes?: string | null;
}

export interface ClinicalHistoryPdfMaterialUsedData {
  brand?: string | null;
  reference?: string | null;
  type?: string | null;
  color?: string | null;
  toothNumber?: string | null;
  quantity: number;
  notes?: string | null;
}

export interface ClinicalHistoryPdfAttentionData {
  id: string;
  attendedAtFormatted: string;
  evolutionNotes: string;
  prescription?: string | null;
  postOperativeIndications?: string | null;
  proceduresPerformed: ClinicalHistoryPdfProcedureData[];
  materialsUsed: ClinicalHistoryPdfMaterialUsedData[];
  // IMPORTANTE: privateNotes está estrictamente omitido de este modelo de datos (RF-B-027, RC-023).
}

export interface ClinicalHistoryPdfDocumentData {
  clinic: ClinicalHistoryPdfClinicData;
  patient: ClinicalHistoryPdfPatientData;
  history: ClinicalHistoryPdfHistoryData;
  odontogram?: ClinicalHistoryPdfOdontogramData | null;
  attentions: ClinicalHistoryPdfAttentionData[];
  generatedAtFormatted: string;
}

export const CLINICAL_HISTORY_PDF_GENERATOR_PORT = Symbol('CLINICAL_HISTORY_PDF_GENERATOR_PORT');

export interface ClinicalHistoryPdfGeneratorPort {
  generate(data: ClinicalHistoryPdfDocumentData): Promise<Buffer>;
}
