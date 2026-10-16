import { PdfmakeClinicalHistoryPdfGeneratorAdapter } from './pdfmake-clinical-history-pdf-generator.adapter';
import { ClinicalHistoryPdfDocumentData } from '../../application/ports/clinical-history-pdf-generator.port';

function extractTextFromUncompressedPdf(buffer: Buffer): string {
  const content = buffer.toString('latin1');
  const tjMatches = content.match(/\[([^[\]]+)\]\s*TJ/g) ?? [];
  return tjMatches
    .map((tj) => {
      const hexStrings = tj.match(/<([0-9a-fA-F]+)>/g) ?? [];
      return hexStrings
        .map((h) => Buffer.from(h.replace(/[<>]/g, ''), 'hex').toString('latin1'))
        .join('');
    })
    .join(' ')
    .replace(/\s+/g, ' ');
}

describe('PdfmakeClinicalHistoryPdfGeneratorAdapter', () => {
  let adapter: PdfmakeClinicalHistoryPdfGeneratorAdapter;

  const mockCompleteData: ClinicalHistoryPdfDocumentData = {
    clinic: {
      name: 'Consultorio Dra. Angelee Pacheco',
      address: 'Calle 100 # 15-20, Bogotá',
      phone: '3001234567',
      email: 'contacto@dra-pacheco.com',
      logoUrl: null,
    },
    patient: {
      id: 'patient-uuid-1234',
      fullName: 'Carlos Rodríguez',
      documentType: 'CC',
      documentNumber: '1098765432',
      birthDateFormatted: '1988-03-22',
      age: 38,
      phone: '+573005554433',
      email: 'carlos.rodriguez@example.com',
      address: 'Carrera 15 # 85-30',
      emergencyContact: {
        name: 'María Rodríguez',
        phone: '+573112223344',
      },
    },
    history: {
      chiefComplaint: 'Revisión y molestia al masticar en zona posterior',
      currentIllness: 'Sensibilidad a cambios térmicos de 2 semanas de evolución',
      medicalAntecedents: {
        hypertension: false,
        diabetes: false,
        allergies: true,
        allergiesDetails: 'Alergia a AINES',
        medications: false,
        medicationsDetails: null,
        bleedingDisorders: false,
        pregnancy: false,
        otherNotes: 'Apendicectomía en 2015',
        familyAntecedents: 'Padre hipertenso',
      },
      clinicalExamination: 'Pieza 16 con restauración filtrada',
      diagnoses: ['Caries recurrente'],
      treatmentItems: [
        {
          procedureCode: 'REST-01',
          procedureName: 'Resina compuesta 2 superficies',
          toothNumber: '16',
          surface: 'OD',
          status: 'PENDING',
          estimatedCostCop: 180000,
        },
      ],
      totalEstimatedCostCop: 180000,
      createdAtFormatted: '2026-10-10',
    },
    odontogram: {
      hasTemporalDentition: false,
      teeth: {
        '16': [
          {
            findingCode: 'CARIES',
            surface: 'Oclusal',
            status: 'EXISTING',
            notes: 'Caries en fosa distal',
          },
        ],
      },
    },
    attentions: [
      {
        id: 'att-uuid-5678',
        attendedAtFormatted: '2026-10-12',
        evolutionNotes: 'Obturación oclusal en diente 16',
        prescription: 'Acetaminofén 500mg cada 6 horas',
        postOperativeIndications: 'Evitar alimentos pigmentantes por 24 horas',
        proceduresPerformed: [
          {
            code: 'REST-01',
            name: 'Resina compuesta en diente 16',
            toothNumber: '16',
            surface: 'Oclusal',
            notes: 'Aislamiento absoluto con grapa 26',
          },
        ],
        materialsUsed: [
          {
            brand: '3M',
            reference: 'Filtek Z350 XT',
            type: 'Resina nanohíbrida',
            color: 'A2',
            toothNumber: '16',
            quantity: 1,
            notes: 'Polimerización por capas',
          },
        ],
      },
    ],
    generatedAtFormatted: '2026-10-16',
  };

  beforeEach(() => {
    adapter = new PdfmakeClinicalHistoryPdfGeneratorAdapter();
  });

  it('debe generar el PDF de la historia clínica completa con membrete, odontograma y atenciones excluyendo siempre privateNotes', async () => {
    const buffer = await adapter.generate(mockCompleteData);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // Valida que comience con la cabecera estándar de PDF
    const header = buffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');

    // Valida contenido del documento descomprimido
    const decodedText = extractTextFromUncompressedPdf(buffer);

    // Membrete
    expect(decodedText).toContain('Consultorio Dra. Angelee Pacheco');
    expect(decodedText).toContain('HISTORIA');

    // Paciente
    expect(decodedText).toContain('Carlos Rodríguez');
    expect(decodedText).toContain('1098765432');

    // Antecedentes e historia clínica
    expect(decodedText).toContain('Revisión y molestia al masticar');
    expect(decodedText).toContain('Alergia a AINES');
    expect(decodedText).toContain('180.000');

    // Odontograma
    expect(decodedText).toContain('16');
    expect(decodedText).toContain('CARIES');

    // Atención
    expect(decodedText).toContain('Obturación oclusal en diente 16');
    expect(decodedText).toContain('Acetaminofén 500mg');
    expect(decodedText).toContain('Filtek Z350 XT');

    // Verificación estricta: ninguna mención de notas privadas o texto confidencial
    expect(decodedText).not.toContain('privateNotes');
    expect(decodedText).not.toContain('confidencial');
  });

  it('debe generar un PDF válido cuando no hay odontograma, atenciones ni ítems de tratamiento', async () => {
    const minimalData: ClinicalHistoryPdfDocumentData = {
      ...mockCompleteData,
      odontogram: null,
      attentions: [],
      history: {
        ...mockCompleteData.history,
        treatmentItems: [],
        totalEstimatedCostCop: 0,
      },
    };

    const buffer = await adapter.generate(minimalData);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');

    const decodedText = extractTextFromUncompressedPdf(buffer);
    expect(decodedText).toContain('Carlos Rodríguez');
    expect(decodedText).toContain('Consultorio Dra. Angelee Pacheco');
  });
});
