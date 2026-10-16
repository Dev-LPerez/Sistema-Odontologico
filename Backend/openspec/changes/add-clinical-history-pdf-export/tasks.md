# Tasks

## Matriz de Trazabilidad Obligatoria (Spec Scenario -> Test Concreto)
Cada escenario de `specs/clinical-history-management/spec.md` DEBE estar cubierto por las siguientes pruebas con estos nombres exactos en `it(...)`:

| Escenario en `spec.md` | Archivo de Prueba Unitaria / Adaptador | Archivo E2E (`Backend/test/clinical-history.e2e-spec.ts`) |
| :--- | :--- | :--- |
| **Scenario:** Exportación exitosa de historia clínica completa en PDF por rol ADMIN excluyendo notas privadas | `export-clinical-history-pdf.query.spec.ts` y `pdfmake-clinical-history-pdf-generator.adapter.spec.ts` -> `it('debe generar el PDF de la historia clínica completa con membrete, odontograma y atenciones excluyendo siempre privateNotes')` | `it('debe permitir a ADMIN exportar la historia clínica completa en PDF recibiendo application/pdf válido sin incluir privateNotes (200)')` |
| **Scenario:** Rechazo de exportación a PDF cuando el paciente no tiene historia clínica abierta | `export-clinical-history-pdf.query.spec.ts` -> `it('debe lanzar ClinicalHistoryNotFoundError (404) cuando se intenta exportar el PDF de un paciente sin historia clínica')` | `it('debe rechazar con 404 CLINICAL_HISTORY_NOT_FOUND cuando se intenta exportar el PDF de un paciente sin historia clínica')` |
| **Scenario:** Bloqueo a rol AUXILIARY al intentar exportar la historia clínica en PDF | `roles.guard.spec.ts` (cubierto) | `it('debe rechazar con 403 FORBIDDEN_ROLE cuando AUXILIARY intenta exportar la historia clínica en PDF')` |

---

## 0. Archivar B-11 antes de iniciar B-12
- [x] 0.1 Ejecutar `/opsx-sync` y `/opsx-archive` para archivar `add-attention-closing-and-versioning` (`B-11`), verificando que su especificación quede sincronizada en `Backend/openspec/specs/clinical-attentions-management/spec.md` y hacer commit.

## 1. Instalación de `pdfmake` y puerto `ClinicalHistoryPdfGeneratorPort` (RC-012, RC-015)
- [x] 1.1 Instalar `pdfmake` y `@types/pdfmake` en `Backend` (`pnpm --filter backend add pdfmake && pnpm --filter backend add -D @types/pdfmake`).
- [x] 1.2 Crear el puerto `Backend/src/modules/clinical/application/ports/clinical-history-pdf-generator.port.ts` definiendo `CLINICAL_HISTORY_PDF_GENERATOR_PORT`, las interfaces de datos del documento (`ClinicalHistoryPdfDocumentData`, sin incluir `privateNotes`) y el método `generate(data: ClinicalHistoryPdfDocumentData): Promise<Buffer>`.
- [x] 1.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck` y `pnpm --filter backend deps:check` en verde, y hacer commit: `git add package.json pnpm-lock.yaml Backend/package.json Backend/src/modules/clinical/application/ports && git commit -m "feat(clinical): add pdfmake dependency and ClinicalHistoryPdfGeneratorPort"`

## 2. Capa application: `ExportClinicalHistoryPdfQuery` con TDD (RC-002, RC-015, RC-016, RC-017, RC-054)
- [ ] 2.1 Escribir las pruebas unitarias en rojo en `Backend/src/modules/clinical/application/queries/export-clinical-history-pdf.query.spec.ts` usando los nombres exactos de la Matriz de Trazabilidad, verificando la recopilación de `Clinic`, `Patient`, `ClinicalHistory`, `Odontogram` (con y sin odontograma registrado) y `ClinicalAttention[]`, la omisión total de `privateNotes`, el formateo de fechas en `America/Bogota` con `ClockPort` y los errores `ClinicNotFoundError`, `PatientNotFoundError` y `ClinicalHistoryNotFoundError`.
- [ ] 2.2 Implementar `Backend/src/modules/clinical/application/queries/export-clinical-history-pdf.query.ts` importando de `../../../identity` y `../../../patients` únicamente a través de sus `index.ts` públicos (`RC-017`) y sin usar `new Date()` (`RC-016`).
- [ ] 2.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/clinical/application && git commit -m "feat(clinical): implement ExportClinicalHistoryPdfQuery excluding privateNotes"`

## 3. Capa infrastructure: `PdfmakeClinicalHistoryPdfGeneratorAdapter` con TDD (RC-002, RC-018, RC-023)
- [ ] 3.1 Escribir las pruebas en rojo en `Backend/src/modules/clinical/infrastructure/adapters/pdfmake-clinical-history-pdf-generator.adapter.spec.ts` usando el bloque `it(...)` exacto de la Matriz de Trazabilidad y verificando que el `Buffer` generado comience con `%PDF-`, no esté vacío, soporte historias con y sin odontograma/atenciones/ítems de plan y contenga las secciones clínicas sin `privateNotes`.
- [ ] 3.2 Implementar `Backend/src/modules/clinical/infrastructure/adapters/pdfmake-clinical-history-pdf-generator.adapter.ts` utilizando `PdfPrinter` de `pdfmake` con las fuentes estándar nativas `Helvetica` (sin comprimir streams o verificando estructura PDF válida) para renderizar el membrete del consultorio, datos del paciente, antecedentes, odontograma, plan de tratamiento y atenciones clínicas.
- [ ] 3.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/clinical/infrastructure && git commit -m "feat(clinical): implement PdfmakeClinicalHistoryPdfGeneratorAdapter with Helvetica standard fonts"`

## 4. Capa presentation, ensamblaje del módulo y pruebas E2E de permisos por rol (RC-005, RC-070)
- [ ] 4.1 Agregar el endpoint `GET /v1/clinical-histories/patient/:patientId/pdf` en `Backend/src/modules/clinical/presentation/clinical-history.controller.ts` (exclusivo para `@Roles(UserRole.ADMIN)`, devolviendo `StreamableFile` con `Content-Type: application/pdf` y `Content-Disposition: attachment; filename="historia-clinica-<patientId>.pdf"`), ampliar `clinical-history.controller.spec.ts`, y registrar `CLINICAL_HISTORY_PDF_GENERATOR_PORT` y `ExportClinicalHistoryPdfQuery` en `clinical.module.ts` e `index.ts`.
- [ ] 4.2 Ampliar `Backend/test/clinical-history.e2e-spec.ts` (inyectando `InMemoryOdontogramRepository`, `InMemoryClinicalAttentionRepository` si aplica) e implementar exactamente los 3 bloques `it(...)` nuevos de la columna E2E de la Matriz de Trazabilidad.
- [ ] 4.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test` y `pnpm --filter backend test:e2e` en verde, y hacer commit: `git add Backend/src Backend/test && git commit -m "feat(clinical): expose GET /v1/clinical-histories/patient/:patientId/pdf endpoint with E2E tests"`

## 5. Contrato OpenAPI y evidencia literal (`evidence.md`)
- [ ] 5.1 Regenerar `Backend/openapi.json` (`pnpm --filter backend openapi:generate`) y verificar que el endpoint `/v1/clinical-histories/patient/{patientId}/pdf` esté documentado con respuesta `application/pdf`.
- [ ] 5.2 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test:cov` y `pnpm --filter backend test:e2e`, y crear `Backend/openspec/changes/add-clinical-history-pdf-export/evidence.md` con la Matriz de Trazabilidad 1:1 completada y la salida **literal e íntegra** de consola de los 5 comandos (incluyendo la tabla ASCII completa de cobertura).
- [ ] 5.3 Confirmar todos los archivos con un commit: `git add -A && git commit -m "chore(clinical): regenerate openapi.json and record B-12 pdf export evidence"` dejando `git status` limpio.

## Workflow follow-up
- Pasa `evidence.md` al Arquitecto para auditoría antes de ejecutar `/opsx-sync` y `/opsx-archive`.