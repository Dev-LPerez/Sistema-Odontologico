import { Injectable } from '@nestjs/common';
import * as pdfMakeModule from 'pdfmake';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';

type PdfMakeInstance = typeof pdfMakeModule & {
  default?: typeof pdfMakeModule;
};

const pdfMake = (pdfMakeModule as PdfMakeInstance).default ?? pdfMakeModule;
import {
  ClinicalHistoryPdfGeneratorPort,
  ClinicalHistoryPdfDocumentData,
  ClinicalHistoryPdfPatientData,
  ClinicalHistoryPdfHistoryData,
  ClinicalHistoryPdfMedicalAntecedentsData,
  ClinicalHistoryPdfOdontogramData,
  ClinicalHistoryPdfAttentionData,
  ClinicalHistoryPdfClinicData,
} from '../../application/ports/clinical-history-pdf-generator.port';

const STANDARD_FONTS = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

@Injectable()
export class PdfmakeClinicalHistoryPdfGeneratorAdapter implements ClinicalHistoryPdfGeneratorPort {
  constructor() {
    pdfMake.setFonts(STANDARD_FONTS);
    pdfMake.setUrlAccessPolicy(() => false);
    pdfMake.setLocalAccessPolicy(() => true);
  }

  async generate(data: ClinicalHistoryPdfDocumentData): Promise<Buffer> {
    const docDefinition: TDocumentDefinitions = {
      compress: false,
      pageSize: 'A4',
      pageMargins: [36, 36, 36, 36],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 9,
        color: '#2D3748',
      },
      content: [
        this.buildHeader(data.clinic, data.generatedAtFormatted),
        { text: ' ', margin: [0, 2, 0, 2] },
        this.buildPatientSection(data.patient),
        { text: ' ', margin: [0, 2, 0, 2] },
        this.buildHistorySection(data.history),
        { text: ' ', margin: [0, 2, 0, 2] },
        this.buildOdontogramSection(data.odontogram),
        { text: ' ', margin: [0, 2, 0, 2] },
        this.buildTreatmentPlanSection(data.history),
        { text: ' ', margin: [0, 2, 0, 2] },
        this.buildAttentionsSection(data.attentions),
      ],
      styles: {
        title: {
          fontSize: 13,
          bold: true,
          color: '#1A365D',
        },
        sectionHeader: {
          fontSize: 10,
          bold: true,
          color: '#2B6CB0',
          margin: [0, 4, 0, 2],
        },
        label: {
          bold: true,
          color: '#4A5568',
        },
      },
    };

    const doc = pdfMake.createPdf(docDefinition);
    return await doc.getBuffer();
  }

  private buildHeader(clinic: ClinicalHistoryPdfClinicData, generatedAt: string): Content {
    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                { text: clinic.name, style: 'title', alignment: 'center' },
                {
                  text: `${clinic.address ?? ''} | Tel: ${clinic.phone ?? ''} | ${clinic.email ?? ''}`,
                  alignment: 'center',
                  fontSize: 8,
                  color: '#718096',
                },
                {
                  text: 'HISTORIA CLÍNICA ODONTOLÓGICA',
                  alignment: 'center',
                  bold: true,
                  fontSize: 11,
                  margin: [0, 3, 0, 1],
                  color: '#2C5282',
                },
                {
                  text: `Fecha de emisión: ${generatedAt}`,
                  alignment: 'right',
                  fontSize: 7.5,
                  color: '#A0AEC0',
                },
              ],
              fillColor: '#EDF2F7',
            },
          ],
        ],
      },
      layout: 'noBorders',
    };
  }

  private buildPatientSection(patient: ClinicalHistoryPdfPatientData): Content {
    const contactInfo = patient.emergencyContact
      ? `${patient.emergencyContact.name} (${patient.emergencyContact.phone})`
      : 'No registrado';

    return {
      stack: [
        { text: '1. INFORMACIÓN DEL PACIENTE', style: 'sectionHeader' },
        {
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: [
              [
                { text: 'Nombre:', style: 'label' },
                { text: patient.fullName },
                { text: 'Documento:', style: 'label' },
                { text: `${patient.documentType} ${patient.documentNumber}` },
              ],
              [
                { text: 'Edad:', style: 'label' },
                { text: `${patient.age} años (${patient.birthDateFormatted})` },
                { text: 'Teléfono:', style: 'label' },
                { text: patient.phone },
              ],
              [
                { text: 'Correo:', style: 'label' },
                { text: patient.email ?? 'No registrado' },
                { text: 'Dirección:', style: 'label' },
                { text: patient.address ?? 'No registrada' },
              ],
              [
                { text: 'Contacto de Emergencia:', style: 'label' },
                { text: contactInfo, colSpan: 3 },
                {},
                {},
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
    };
  }

  private formatMedicalAntecedents(ant: ClinicalHistoryPdfMedicalAntecedentsData): string {
    const list: string[] = [];

    if (ant.hypertension) list.push('Hipertensión Arterial');
    if (ant.diabetes) list.push('Diabetes');
    if (ant.bleedingDisorders) list.push('Trastornos hemorrágicos');
    if (ant.pregnancy) list.push('Embarazo');

    this.appendDetailAntecedent(list, 'Alergias', ant.allergies, ant.allergiesDetails);
    this.appendDetailAntecedent(list, 'Medicamentos', ant.medications, ant.medicationsDetails);
    this.appendStringAntecedent(list, 'Otros', ant.otherNotes);
    this.appendStringAntecedent(list, 'Familiares', ant.familyAntecedents);

    return list.length > 0 ? list.join(' | ') : 'Sin antecedentes médicos de importancia';
  }

  private appendDetailAntecedent(
    list: string[],
    label: string,
    active: boolean,
    details?: string | null,
  ): void {
    if (active) {
      const text = details ? `${label}: ${details}` : `${label}: Sí`;
      list.push(text);
    }
  }

  private appendStringAntecedent(list: string[], label: string, value?: string | null): void {
    if (value) {
      list.push(`${label}: ${value}`);
    }
  }

  private buildHistorySection(history: ClinicalHistoryPdfHistoryData): Content {
    const antecedentsText = this.formatMedicalAntecedents(history.medicalAntecedents);
    const diagText =
      history.diagnoses.length > 0 ? history.diagnoses.join(', ') : 'Sin diagnósticos registrados';

    return {
      stack: [
        { text: '2. ANAMNESIS Y ANTECEDENTES', style: 'sectionHeader' },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              [{ text: 'Motivo de Consulta:', style: 'label' }, { text: history.chiefComplaint }],
              [{ text: 'Enfermedad Actual:', style: 'label' }, { text: history.currentIllness }],
              [{ text: 'Antecedentes Médicos:', style: 'label' }, { text: antecedentsText }],
              [
                { text: 'Examen Clínico:', style: 'label' },
                { text: history.clinicalExamination ?? 'No registrado' },
              ],
              [{ text: 'Diagnósticos:', style: 'label' }, { text: diagText }],
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
    };
  }

  private buildOdontogramSection(odontogram?: ClinicalHistoryPdfOdontogramData | null): Content {
    if (!odontogram || Object.keys(odontogram.teeth).length === 0) {
      return {
        stack: [
          { text: '3. ODONTOGRAMA', style: 'sectionHeader' },
          {
            text: 'Sin hallazgos odontológicos registrados a la fecha.',
            italics: true,
            color: '#718096',
          },
        ],
      };
    }

    const tableRows: TableCell[][] = [
      [
        { text: 'Diente', style: 'label' },
        { text: 'Superficie', style: 'label' },
        { text: 'Hallazgo', style: 'label' },
        { text: 'Estado', style: 'label' },
        { text: 'Notas', style: 'label' },
      ],
    ];

    for (const [tooth, findings] of Object.entries(odontogram.teeth)) {
      for (const f of findings) {
        tableRows.push([
          { text: tooth },
          { text: f.surface ?? 'General' },
          { text: f.findingCode },
          { text: f.status },
          { text: f.notes ?? '-' },
        ]);
      }
    }

    return {
      stack: [
        { text: '3. ODONTOGRAMA', style: 'sectionHeader' },
        {
          table: {
            widths: ['15%', '20%', '25%', '20%', '20%'],
            body: tableRows,
          },
          layout: 'lightHorizontalLines',
        },
      ],
    };
  }

  private buildTreatmentPlanSection(history: ClinicalHistoryPdfHistoryData): Content {
    if (history.treatmentItems.length === 0) {
      return {
        stack: [
          { text: '4. PLAN DE TRATAMIENTO', style: 'sectionHeader' },
          { text: 'Sin procedimientos planificados.', italics: true, color: '#718096' },
        ],
      };
    }

    const rows: TableCell[][] = [
      [
        { text: 'Código', style: 'label' },
        { text: 'Procedimiento', style: 'label' },
        { text: 'Diente', style: 'label' },
        { text: 'Estado', style: 'label' },
        { text: 'Costo Est. (COP)', style: 'label' },
      ],
    ];

    for (const item of history.treatmentItems) {
      rows.push([
        { text: item.procedureCode },
        { text: item.procedureName ?? '-' },
        { text: item.toothNumber ?? '-' },
        { text: item.status },
        { text: `$${item.estimatedCostCop.toLocaleString('es-CO')}` },
      ]);
    }

    rows.push([
      { text: 'TOTAL ESTIMADO', colSpan: 4, bold: true, alignment: 'right' },
      {},
      {},
      {},
      { text: `$${history.totalEstimatedCostCop.toLocaleString('es-CO')}`, bold: true },
    ]);

    return {
      stack: [
        { text: '4. PLAN DE TRATAMIENTO', style: 'sectionHeader' },
        {
          table: {
            widths: ['15%', '40%', '15%', '15%', '15%'],
            body: rows,
          },
          layout: 'lightHorizontalLines',
        },
      ],
    };
  }

  private buildAttentionsSection(attentions: ClinicalHistoryPdfAttentionData[]): Content {
    if (attentions.length === 0) {
      return {
        stack: [
          { text: '5. ATENCIONES Y EVOLUCIONES CLÍNICAS', style: 'sectionHeader' },
          { text: 'Sin atenciones clínicas registradas.', italics: true, color: '#718096' },
        ],
      };
    }

    const attentionBlocks: Content[] = [];

    for (const att of attentions) {
      const procs = att.proceduresPerformed
        .map(
          (p) => `${p.code}: ${p.name ?? ''} ${p.toothNumber ? `(Diente ${p.toothNumber})` : ''}`,
        )
        .join('; ');

      const materials =
        att.materialsUsed.length > 0
          ? att.materialsUsed
              .map(
                (m) =>
                  `${m.brand ?? ''} ${m.reference ?? ''} (${m.type ?? ''} ${m.color ?? ''}) x${m.quantity}`,
              )
              .join(', ')
          : null;

      const body: TableCell[][] = [
        [{ text: 'Fecha:', style: 'label' }, { text: att.attendedAtFormatted }],
        [
          { text: 'Procedimientos:', style: 'label' },
          { text: procs.length > 0 ? procs : 'No especificado' },
        ],
        [{ text: 'Evolución:', style: 'label' }, { text: att.evolutionNotes }],
      ];

      if (att.prescription) {
        body.push([{ text: 'Prescripción:', style: 'label' }, { text: att.prescription }]);
      }

      if (att.postOperativeIndications) {
        body.push([
          { text: 'Indicaciones:', style: 'label' },
          { text: att.postOperativeIndications },
        ]);
      }

      if (materials) {
        body.push([{ text: 'Materiales Usados:', style: 'label' }, { text: materials }]);
      }

      attentionBlocks.push({
        table: {
          widths: ['25%', '75%'],
          body,
        },
        layout: 'lightHorizontalLines',
        margin: [0, 2, 0, 4],
      });
    }

    return {
      stack: [
        { text: '5. ATENCIONES Y EVOLUCIONES CLÍNICAS', style: 'sectionHeader' },
        ...attentionBlocks,
      ],
    };
  }
}
