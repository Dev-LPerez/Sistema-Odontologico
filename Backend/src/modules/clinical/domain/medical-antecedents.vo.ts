import { InvalidClinicalHistoryDataError } from './clinical.errors';

export interface MedicalAntecedentsProps {
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

function normalizeOptionalString(value?: string | null): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function validateAllergiesDetails(allergies: boolean, details?: string | null): string | null {
  const normalized = normalizeOptionalString(details);
  if (allergies && !normalized) {
    throw new InvalidClinicalHistoryDataError(
      'Es obligatorio especificar el detalle de las alergias cuando allergies es true',
    );
  }
  return normalized;
}

function validateMedicationsDetails(medications: boolean, details?: string | null): string | null {
  const normalized = normalizeOptionalString(details);
  if (medications && !normalized) {
    throw new InvalidClinicalHistoryDataError(
      'Es obligatorio especificar el detalle de la medicación activa cuando medications es true',
    );
  }
  return normalized;
}

export class MedicalAntecedents {
  private constructor(
    readonly hypertension: boolean,
    readonly diabetes: boolean,
    readonly allergies: boolean,
    readonly allergiesDetails: string | null,
    readonly medications: boolean,
    readonly medicationsDetails: string | null,
    readonly bleedingDisorders: boolean,
    readonly pregnancy: boolean,
    readonly otherNotes: string | null,
    readonly familyAntecedents: string | null,
  ) {}

  static create(props: MedicalAntecedentsProps): MedicalAntecedents {
    const allergies = Boolean(props.allergies);
    const allergiesDetails = validateAllergiesDetails(allergies, props.allergiesDetails);

    const medications = Boolean(props.medications);
    const medicationsDetails = validateMedicationsDetails(medications, props.medicationsDetails);

    return new MedicalAntecedents(
      Boolean(props.hypertension),
      Boolean(props.diabetes),
      allergies,
      allergiesDetails,
      medications,
      medicationsDetails,
      Boolean(props.bleedingDisorders),
      Boolean(props.pregnancy),
      normalizeOptionalString(props.otherNotes),
      normalizeOptionalString(props.familyAntecedents),
    );
  }

  toPersonalAntecedentsJson(): Record<string, unknown> {
    return {
      hypertension: this.hypertension,
      diabetes: this.diabetes,
      allergies: this.allergies,
      allergiesDetails: this.allergiesDetails,
      medications: this.medications,
      medicationsDetails: this.medicationsDetails,
      bleedingDisorders: this.bleedingDisorders,
      pregnancy: this.pregnancy,
      otherNotes: this.otherNotes,
    };
  }
}
