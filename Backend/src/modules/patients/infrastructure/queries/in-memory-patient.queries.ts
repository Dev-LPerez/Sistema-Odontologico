import {
  PatientQueriesPort,
  SearchPatientsByTrigramParams,
  PatientSearchItemDto,
} from '../../application/ports/patient.queries.port';
import { InMemoryPatientRepository } from '../repositories/in-memory-patient.repository';
import { Patient } from '../../domain/patient.entity';
import {
  normalizeText,
  extractTrigrams,
  extractTrigramsFromNormalized,
  calculateTrigramSimilarity,
} from './trigram-similarity.util';

function calculatePatientRelevance(
  patient: Patient,
  normQuery: string,
  queryTrigrams: Set<string>,
  digits?: string,
): number {
  const normFirstName = normalizeText(patient.firstName);
  const normLastName = normalizeText(patient.lastName);
  const normFullName = `${normFirstName} ${normLastName}`;

  let digitMatchBonus = 0;
  if (digits) {
    const rawPhoneDigits = patient.phone.value.replace(/\D/g, '');
    if (patient.document.number.includes(digits) || rawPhoneDigits.includes(digits)) {
      digitMatchBonus = 0.8;
    }
  }

  let subMatchBonus = 0;
  if (normFullName.includes(normQuery) || normQuery.includes(normFullName)) {
    subMatchBonus = 0.6;
  } else if (normFirstName.includes(normQuery) || normLastName.includes(normQuery)) {
    subMatchBonus = 0.5;
  }

  const fullTrigrams = extractTrigramsFromNormalized(normFullName);
  const simFullName = calculateTrigramSimilarity(fullTrigrams, queryTrigrams);

  let simFirstName = 0;
  let simLastName = 0;
  if (simFullName > 0 && simFullName < 0.5) {
    simFirstName = calculateTrigramSimilarity(
      extractTrigramsFromNormalized(normFirstName),
      queryTrigrams,
    );
    simLastName = calculateTrigramSimilarity(
      extractTrigramsFromNormalized(normLastName),
      queryTrigrams,
    );
  }

  return Math.max(simFullName, simFirstName, simLastName, subMatchBonus, digitMatchBonus);
}

export class InMemoryPatientQueriesAdapter implements PatientQueriesPort {
  private readonly internalStore = new Map<string, Patient>();

  constructor(private readonly patientRepo?: InMemoryPatientRepository) {}

  save(patient: Patient): void {
    if (this.patientRepo) {
      void this.patientRepo.save(patient);
    }
    this.internalStore.set(patient.id, patient);
  }

  clear(): void {
    if (this.patientRepo) {
      this.patientRepo.clear();
    }
    this.internalStore.clear();
  }

  async searchByTrigram(params: SearchPatientsByTrigramParams): Promise<PatientSearchItemDto[]> {
    const candidates: Patient[] = this.patientRepo
      ? await this.patientRepo.findAllByClinicId(params.clinicId)
      : Array.from(this.internalStore.values()).filter((p) => p.clinicId === params.clinicId);

    const normQuery = normalizeText(params.query);
    const queryTrigrams = extractTrigrams(params.query);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 50);

    const scoredPatients: Array<{ patient: Patient; score: number }> = [];

    for (const patient of candidates) {
      if (!params.includeInactive && !patient.isActive) {
        continue;
      }

      const score = calculatePatientRelevance(
        patient,
        normQuery,
        queryTrigrams,
        params.normalizedDigits,
      );

      if (score >= 0.25) {
        scoredPatients.push({ patient, score });
      }
    }

    scoredPatients.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.patient.createdAt.getTime() - a.patient.createdAt.getTime();
    });

    return scoredPatients.slice(0, limit).map(({ patient, score }) => ({
      id: patient.id,
      clinicId: patient.clinicId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      documentType: patient.document.type,
      documentNumber: patient.document.number,
      birthDate: patient.birthDate,
      phone: patient.phone.value,
      email: patient.email,
      address: patient.address,
      emergencyContactName: patient.emergencyContact?.name ?? null,
      emergencyContactPhone: patient.emergencyContact?.phone.value ?? null,
      acquisitionSource: patient.acquisitionSource,
      dataTreatmentConsent: patient.dataTreatmentConsent,
      dataTreatmentConsentAt: patient.dataTreatmentConsentAt,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      similarityScore: score,
    }));
  }
}
