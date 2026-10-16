import { PdfmakeClinicalHistoryPdfGeneratorAdapter } from './pdfmake-clinical-history-pdf-generator.adapter';
import { ClinicalHistoryPdfDocumentData } from '../../application/ports/clinical-history-pdf-generator.port';

export function extractTextFromUncompressedPdf(buffer: Buffer): string {
  const content = buffer.toString('latin1');
  const tjMatches = content.match(/\[([^[\]]+)\]\s*TJ/g) ?? [];
  return tjMatches
    .map((tj) => {
      const hexStrings = tj.match(/<([0-9a-fA-F]+)>/g) ?? [];
      return hexStrings
        .map((h) =>
          Buffer.from(h.replace(/[<>]/g, ''), 'hex')
            .toString('latin1')
            .replace(/\u0096/g, '–'),
        )
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
      logoUrl: 'https://cdn.example.com/clinica-logo.png',
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
      diagnoses: ['K02.1 – Caries de la dentina'],
      treatmentItems: [
        {
          procedureCode: 'REST-01',
          procedureName: 'Resina compuesta 2 superficies',
          toothNumber: '16',
          status: 'Pendiente',
          estimatedCostCop: 180000,
        },
      ],
      totalEstimatedCostCop: 180000,
      createdAtFormatted: '2026-10-10 09:30',
    },
    odontogram: {
      hasTemporalDentition: false,
      teeth: {
        '16': [
          {
            findingCode: 'Caries',
            surface: 'Oclusal',
            status: 'Existente',
            notes: 'Caries en fosa distal',
          },
        ],
      },
    },
    attentions: [
      {
        id: 'att-uuid-5678',
        attendedAtFormatted: '2026-10-12 14:15',
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
    generatedAtFormatted: '2026-10-16 16:00',
  };

  beforeEach(() => {
    adapter = new PdfmakeClinicalHistoryPdfGeneratorAdapter();
  });

  it('debe generar el PDF con etiquetas en español es-CO, SVG de odontograma y referencia de logo', async () => {
    // Intentamos infiltrar privateNotes en el objeto de atención pasado al adaptador
    (mockCompleteData.attentions[0] as unknown as Record<string, unknown>).privateNotes =
      'SECRETO_INFILTRADO_EN_ADAPTADOR';

    const buffer = await adapter.generate(mockCompleteData, { compress: false });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // Valida cabecera PDF
    const header = buffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');

    // Extrae el texto del documento no comprimido
    const decodedText = extractTextFromUncompressedPdf(buffer);

    // Membrete con logo institucional
    expect(decodedText).toContain('Consultorio Dra. Angelee Pacheco');
    expect(decodedText).toContain('Ref. Institucional:');
    expect(decodedText).toContain('HISTORIA');

    // Paciente
    expect(decodedText).toContain('Carlos Rodríguez');
    expect(decodedText).toContain('1098765432');

    // Antecedentes e historia clínica con diagnósticos formateados (Bug 2)
    expect(decodedText).toContain('Revisión y molestia al masticar');
    expect(decodedText).toContain('Alergia a AINES');
    expect(decodedText).toContain('K02.1 – Caries de la dentina');
    expect(decodedText).toContain('180.000');

    // Plan de tratamiento en español
    expect(decodedText).toContain('Pendiente');

    // Odontograma con etiquetas en español (es-CO)
    expect(decodedText).toContain('16');
    expect(decodedText).toContain('Caries');
    expect(decodedText).toContain('Oclusal');
    expect(decodedText).toContain('Existente');

    // Atención
    expect(decodedText).toContain('Obturación oclusal en diente 16');
    expect(decodedText).toContain('Acetaminofén 500mg');
    expect(decodedText).toContain('Filtek Z350 XT');

    // PRUEBA DE INFILTRACIÓN ESTRICTA (RC-023): jamás debe renderizarse en el PDF
    expect(decodedText).not.toContain('SECRETO_INFILTRADO_EN_ADAPTADOR');
    expect(decodedText).not.toContain('privateNotes');
  });

  it('debe construir el diagrama SVG de las arcadas dentales coloreando piezas con hallazgos (RF-B-044)', () => {
    const svg = adapter.buildOdontogramSvg(mockCompleteData.odontogram);

    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 520 64"');
    // Pieza 16 con hallazgo de caries debe tener color distintivo de caries (#FED7D7)
    expect(svg).toContain('>16<');
    expect(svg).toContain('fill="#FED7D7"');
    // Pieza sana (ej. 11) debe tener color neutral
    expect(svg).toContain('>11<');
    expect(svg).toContain('fill="#F7FAFC"');
  });

  it('debe generar el PDF correctamente cuando no hay hallazgos en el odontograma ni atenciones', async () => {
    const emptyData: ClinicalHistoryPdfDocumentData = {
      ...mockCompleteData,
      odontogram: null,
      attentions: [],
    };

    const buffer = await adapter.generate(emptyData, { compress: false });
    const decodedText = extractTextFromUncompressedPdf(buffer);

    expect(decodedText).toContain('Sin hallazgos odontológicos');
    expect(decodedText).toContain('Sin atenciones clínicas registradas');
  });

  it('debe generar el PDF para un paciente con 200 atenciones en menos de 2000 ms y con incremento de heap menor a 100 MB (RC-030)', async () => {
    const baseAttention = mockCompleteData.attentions[0];
    const attentions200 = Array.from({ length: 200 }, (_, index) => ({
      ...baseAttention,
      id: `att-uuid-${index + 1}`,
      attendedAtFormatted: `2026-10-${String((index % 28) + 1).padStart(2, '0')} 10:00`,
      evolutionNotes: `Atención de control número ${index + 1} del paciente`,
    }));

    const benchmarkData: ClinicalHistoryPdfDocumentData = {
      ...mockCompleteData,
      attentions: attentions200,
    };

    // Calentamiento inicial de motor V8 y pdfmake antes de medir benchmark
    await adapter.generate({ ...benchmarkData, attentions: [] });

    if (global.gc) {
      global.gc();
    }
    const initialHeap = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    const buffer = await adapter.generate(benchmarkData);

    const elapsed = Date.now() - startTime;
    const finalHeap = process.memoryUsage().heapUsed;
    const heapIncreaseMb = (finalHeap - initialHeap) / (1024 * 1024);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(2000);
    expect(heapIncreaseMb).toBeLessThan(100);
  });
});
