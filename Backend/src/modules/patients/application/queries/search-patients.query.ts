import { Injectable, Inject } from '@nestjs/common';
import {
  PatientQueriesPort,
  PATIENT_QUERIES_TOKEN,
  PatientSearchItemDto,
} from '../ports/patient.queries.port';

export interface SearchPatientsQueryParams {
  clinicId: string;
  q: string;
  limit?: number;
  includeInactive?: boolean;
}

@Injectable()
export class SearchPatientsQuery {
  constructor(
    @Inject(PATIENT_QUERIES_TOKEN)
    private readonly patientQueries: PatientQueriesPort,
  ) {}

  async execute(params: SearchPatientsQueryParams): Promise<PatientSearchItemDto[]> {
    const trimmed = (params.q ?? '').trim();

    if (trimmed.length < 2) {
      return [];
    }

    const digitsOnly = trimmed.replace(/\D/g, '');
    const normalizedDigits = digitsOnly.length >= 2 ? digitsOnly : undefined;

    let limit = 20;
    if (params.limit !== undefined && params.limit > 0) {
      limit = Math.min(params.limit, 50);
    }

    const includeInactive = params.includeInactive ?? false;

    return this.patientQueries.searchByTrigram({
      clinicId: params.clinicId,
      query: trimmed,
      normalizedDigits,
      includeInactive,
      limit,
    });
  }
}
