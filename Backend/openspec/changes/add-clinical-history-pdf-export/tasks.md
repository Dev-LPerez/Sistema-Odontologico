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

- [x] 2.1 Escribir las pruebas unitarias en rojo en `Backend/src/modules/clinical/application/queries/export-clinical-history-pdf.query.spec.ts` usando los nombres exactos de la Matriz de Trazabilidad, verificando la recopilación de `Clinic`, `Patient`, `ClinicalHistory`, `Odontogram` (con y sin odontograma registrado) y `ClinicalAttention[]`, la omisión total de `privateNotes`, el formateo de fechas en `America/Bogota` con `ClockPort` y los errores `ClinicNotFoundError`, `PatientNotFoundError` y `ClinicalHistoryNotFoundError`.
- [x] 2.2 Implementar `Backend/src/modules/clinical/application/queries/export-clinical-history-pdf.query.ts` importando de `../../../identity` y `../../../patients` únicamente a través de sus `index.ts` públicos (`RC-017`) y sin usar `new Date()` (`RC-016`).
- [x] 2.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/clinical/application && git commit -m "feat(clinical): implement ExportClinicalHistoryPdfQuery excluding privateNotes"`

## 3. Capa infrastructure: `PdfmakeClinicalHistoryPdfGeneratorAdapter` con TDD (RC-002, RC-018, RC-023)

- [x] 3.1 Escribir las pruebas en rojo en `Backend/src/modules/clinical/infrastructure/adapters/pdfmake-clinical-history-pdf-generator.adapter.spec.ts` usando el bloque `it(...)` exacto de la Matriz de Trazabilidad y verificando que el `Buffer` generado comience con `%PDF-`, no esté vacío, soporte historias con y sin odontograma/atenciones/ítems de plan y contenga las secciones clínicas sin `privateNotes`.
- [x] 3.2 Implementar `Backend/src/modules/clinical/infrastructure/adapters/pdfmake-clinical-history-pdf-generator.adapter.ts` utilizando `PdfPrinter` de `pdfmake` con las fuentes estándar nativas `Helvetica` (sin comprimir streams o verificando estructura PDF válida) para renderizar el membrete del consultorio, datos del paciente, antecedentes, odontograma, plan de tratamiento y atenciones clínicas.
- [x] 3.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check` y `pnpm --filter backend test` en verde, y hacer commit: `git add Backend/src/modules/clinical/infrastructure && git commit -m "feat(clinical): implement PdfmakeClinicalHistoryPdfGeneratorAdapter with Helvetica standard fonts"`

## 4. Capa presentation, ensamblaje del módulo y pruebas E2E de permisos por rol (RC-005, RC-070)

- [x] 4.1 Agregar el endpoint `GET /v1/clinical-histories/patient/:patientId/pdf` en `Backend/src/modules/clinical/presentation/clinical-history.controller.ts` (exclusivo para `@Roles(UserRole.ADMIN)`, devolviendo `StreamableFile` con `Content-Type: application/pdf` y `Content-Disposition: attachment; filename="historia-clinica-<patientId>.pdf"`), ampliar `clinical-history.controller.spec.ts`, y registrar `CLINICAL_HISTORY_PDF_GENERATOR_PORT` y `ExportClinicalHistoryPdfQuery` en `clinical.module.ts` e `index.ts`.
- [x] 4.2 Ampliar `Backend/test/clinical-history.e2e-spec.ts` (inyectando `InMemoryOdontogramRepository`, `InMemoryClinicalAttentionRepository` si aplica) e implementar exactamente los 3 bloques `it(...)` nuevos de la columna E2E de la Matriz de Trazabilidad.
- [x] 4.3 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test` y `pnpm --filter backend test:e2e` en verde, y hacer commit: `git add Backend/src Backend/test && git commit -m "feat(clinical): expose GET /v1/clinical-histories/patient/:patientId/pdf endpoint with E2E tests"`

## 5. Contrato OpenAPI y evidencia literal (`evidence.md`)

- [x] 5.1 Regenerar `Backend/openapi.json` (`pnpm --filter backend openapi:generate`) y verificar que el endpoint `/v1/clinical-histories/patient/{patientId}/pdf` esté documentado con respuesta `application/pdf`.
- [x] 5.2 Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test:cov` y `pnpm --filter backend test:e2e`, y crear `Backend/openspec/changes/add-clinical-history-pdf-export/evidence.md` con la Matriz de Trazabilidad 1:1 completada y la salida **literal e íntegra** de consola de los 5 comandos (incluyendo la tabla ASCII completa de cobertura).
- [x] 5.3 Confirmar todos los archivos con un commit: `git add -A && git commit -m "chore(clinical): regenerate openapi.json and record B-12 pdf export evidence"` dejando `git status` limpio.

---

## 6. Remediación de Auditoría Externa (Bloqueantes antes de ejecutar `/opsx-sync` y `/opsx-archive`)

- [x] 6.1 **Corregir `onDelete: Cascade` remanente en `identity` dentro de `schema.prisma` (Criterio Transversal 3 y `RC-055`):**
  - En `Backend/prisma/schema.prisma`, cambiar `onDelete: Cascade` por `onDelete: Restrict` en las relaciones `User.clinic`, `RefreshSession.clinic` y `RefreshSession.user`.
  - Crear la migración `Backend/prisma/migrations/20261016013000_fix_identity_on_delete_restrict/migration.sql` reemplazando las 3 constraints (`users_clinic_id_fkey`, `refresh_sessions_clinic_id_fkey`, `refresh_sessions_user_id_fkey`) con `ON DELETE RESTRICT ON UPDATE CASCADE`, aplicarla con `npx prisma migrate deploy` y ejecutar `pnpm --filter backend prisma:generate`.
  - Hacer commit: `git add Backend/prisma && git commit -m "fix(identity): enforce onDelete Restrict on User and RefreshSession foreign keys"`

- [x] 6.2 **Saldar deudas del Plan Maestro en `modules/clinical`: Evento `AttentionClosedEvent` (`B-11`) e Historial de Materiales por Diente (`B-10`, `RF-B-026`):**
  - **Evento `AttentionClosedEvent` (`RF-B-028`, `RF-B-029`, Stack 3.4):**
    - Crear `Backend/src/modules/clinical/domain/attention-closed.event.ts` implementando `DomainEvent` (`eventName = 'clinical.attention.closed'`, `aggregateId`, `occurredOn`, `clinicId`, `patientId`, `clinicalHistoryId`, `attendedByUserId`, `proceduresPerformed`).
    - Hacer que `ClinicalAttention` extienda `AggregateRoot<string>` y que `ClinicalAttention.close(updatedAt)` invoque `this.addDomainEvent(new AttentionClosedEvent(...))`.
    - En `CloseClinicalAttentionUseCase`, inyectar `@Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort`, publicar los eventos tras guardar (`await this.eventBus.publishAll(attention.domainEvents); attention.clearDomainEvents();`) y verificar la emisión y publicación en `clinical-attention.entity.spec.ts` y `close-clinical-attention.use-case.spec.ts`.
  - **Consulta `GetToothMaterialHistoryQuery` (`RF-B-026`):**
    - Crear `Backend/src/modules/clinical/application/queries/get-tooth-material-history.query.ts` (+ `.spec.ts`) que valide el diente con `ToothNumber.of(toothNumber)`, consulte las atenciones del paciente en `ClinicalAttentionRepositoryPort` y devuelva la lista cronológica de materiales usados en ese diente (`attentionId`, `attendedAt`, `materialId`, `brand`, `reference`, `type`, `color`, `toothNumber`, `quantity`, `notes`).
    - Exponer `GET /v1/clinical-attentions/patient/:patientId/tooth/:toothNumber/materials` en `ClinicalAttentionsController` (`@Roles(UserRole.ADMIN, UserRole.AUXILIARY)`), registrarlo en `clinical.module.ts`, exportarlo junto con `AttentionClosedEvent` en `Backend/src/modules/clinical/index.ts` y agregar su prueba en `clinical-attentions.controller.spec.ts` y `Backend/test/clinical-attentions.e2e-spec.ts`.
  - Hacer commit: `git add Backend/src/modules/clinical Backend/test/clinical-attentions.e2e-spec.ts && git commit -m "feat(clinical): emit AttentionClosedEvent on close and add GetToothMaterialHistoryQuery"`

- [x] 6.3 **Corregir Bug 1 (Fecha de nacimiento / Edad en `America/Bogota`), Bug 2 (Diagnósticos como JSON crudo), Localización `es-CO` y extraer Mapper Puro (`RC-054`, `RF-B-030`):**
  - En `ClockPort` (`clock.port.ts`) y `SystemClockAdapter` (`system-clock.adapter.ts` + `.spec.ts`), agregar `formatDateTimeInBogota(date: Date): string` que retorne `YYYY-MM-DD HH:mm` en zona `America/Bogota` (para distinguir múltiples atenciones en el mismo día).
  - Crear el mapeador puro `Backend/src/modules/clinical/application/mappers/clinical-history-pdf-document.mapper.ts` (+ `clinical-history-pdf-document.mapper.spec.ts`) para descargar de complejidad a `ExportClinicalHistoryPdfQuery`:
    - **Bug 1 corregido:** Formatear `birthDate` como fecha calendario UTC (`patient.birthDate.toISOString().slice(0, 10)`) para que `new Date('1990-05-15T00:00:00.000Z')` sea siempre `'1990-05-15'` y nunca retroceda un día por el offset `-05:00`. Calcular `age` de forma pura comparando `todayInBogota` (`YYYY-MM-DD`) contra `birthDateFormatted` (`YYYY-MM-DD`), probando explícitamente los 3 casos de borde (cumpleaños aún no ocurrido en el año actual -> `age--`, día exacto del cumpleaños y cumpleaños ya ocurrido).
    - **Bug 2 corregido:** Formatear cada diagnóstico como `"K02.1 – Caries de la dentina"` cuando sea un objeto `{ code, description }` (o solo `description` / `code` si falta uno), eliminando `JSON.stringify(d)`.
    - **Localización `es-CO` y ordenamiento:** Traducir a español de Colombia las etiquetas de hallazgos (`CARIES` -> `'Caries'`, `RESIN_RESTORATION` -> `'Restauración en resina'`, `AMALGAM_RESTORATION` -> `'Restauración en amalgama'`, `ABSENT` -> `'Ausente'`, `EXTRACTION_INDICATED` -> `'Extracción indicada'`, `CALCULUS` -> `'Cálculo'`, `PERIODONTAL_POCKET` -> `'Bolsa periodontal'`, `CROWN` -> `'Corona'`, `ENDODONTICS` -> `'Endodoncia'`, `SEALANT` -> `'Sellante'`, `FRACTURE` -> `'Fractura'`), superficies (`OCCLUSAL` -> `'Oclusal'`, `VESTIBULAR` -> `'Vestibular'`, `LINGUAL` -> `'Lingual/Palatina'`, `MESIAL` -> `'Mesial'`, `DISTAL` -> `'Distal'`, `WHOLE_TOOTH` -> `'Diente completo'`), estados de hallazgo (`EXISTING` -> `'Existente'`, `PLANNED` -> `'Planificado'`, `PERFORMED` -> `'Realizado'`) y estados de plan de tratamiento (`PENDING` -> `'Pendiente'`, `IN_PROGRESS` -> `'En curso'`, `COMPLETED` -> `'Realizado'`).
    - Ordenar los dientes del odontograma numéricamente por código FDI ascendente y ordenar las atenciones en orden **cronológico ascendente** (`a.attendedAt.getTime() - b.attendedAt.getTime()`) usando `formatDateTimeInBogota`. Eliminar el campo muerto `surface` de `ClinicalHistoryPdfTreatmentItemData`.
  - Actualizar `ExportClinicalHistoryPdfQuery` y `export-clinical-history-pdf.query.spec.ts` (usando un `formatInBogota` realista con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })` en el test para demostrar que `'1990-05-15'` no sufre desfase).
  - Hacer commit: `git add Backend/src/shared Backend/src/modules/clinical/application && git commit -m "fix(clinical): fix birthDate UTC formatting, Bogota age calculation, diagnosis formatting and es-CO labels"`

- [x] 6.4 **Endurecer seguridad en `PdfmakeClinicalHistoryPdfGeneratorAdapter`, agregar renderizado SVG del odontograma y prueba de infiltración de `privateNotes` (`RF-B-044`, `RC-023`):**
  - En `Backend/src/modules/clinical/infrastructure/adapters/pdfmake-clinical-history-pdf-generator.adapter.ts`:
    - Cambiar `pdfMake.setLocalAccessPolicy(() => true)` a `pdfMake.setLocalAccessPolicy(() => false)`.
    - Permitir configurar `compress` (por defecto `process.env.NODE_ENV === 'production'`, manteniendo `false` en `test` o vía parámetro opcional para inspección de streams).
    - Agregar en la sección `3. ODONTOGRAMA` un diagrama vectorial SVG (`{ svg: this.buildOdontogramSvg(odontogram) }`) que dibuje las arcadas dentales y coloree las piezas con hallazgos además de la tabla en español (`RF-B-044`).
    - Si `clinic.logoUrl` está presente, incluir la referencia institucional en el encabezado del membrete.
  - Exportar un helper de prueba reutilizable `extractTextFromUncompressedPdf(buffer: Buffer): string` y en `pdfmake-clinical-history-pdf-generator.adapter.spec.ts`:
    - Verificar que aparecen las etiquetas en español (`'Caries'`, `'Oclusal'`, `'Existente'`, `'Pendiente'`, `'K02.1 – Caries de la dentina'`).
    - Pasar un objeto de atención que intente infiltrar `(att as Record<string, unknown>).privateNotes = 'SECRETO_INFILTRADO_EN_ADAPTADOR'` y comprobar con `extractTextFromUncompressedPdf(buffer)` que `'SECRETO_INFILTRADO_EN_ADAPTADOR'` jamás se renderiza en el PDF.
  - Hacer commit: `git add Backend/src/modules/clinical/infrastructure && git commit -m "fix(clinical): lock pdfmake local access policy, render SVG odontogram and test adapter against privateNotes leak"`

- [ ] 6.5 **Corregir Bug 3 y Bug 4 en `clinical-history.e2e-spec.ts` y completar cabeceras y decoradores OpenAPI en `ClinicalHistoryController` (`RC-005`, `RC-070`):**
  - En `Backend/src/modules/clinical/presentation/clinical-history.controller.ts` (+ `.spec.ts`):
    - Agregar `res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')` y `res.setHeader('Pragma', 'no-cache')`.
    - Decorar `exportPdf` con `@ApiProduces('application/pdf')`, `@ApiForbiddenResponse({ description: 'Rol sin permisos para exportar historia clínica (requiere ADMIN)' })` y `@ApiNotFoundResponse({ description: 'Paciente o historia clínica no encontrada' })`.
    - Añadir comentario explícito `// TODO(B-20): Registrar evento de auditoría CLINICAL_HISTORY_PDF_EXPORTED en AuditLog (RF-B-140)`.
  - En `Backend/test/clinical-history.e2e-spec.ts`:
    - Corregir los argumentos invertidos: `const history = await clinicalHistoryRepo.findByPatientId(testClinicId, testPatientId); expect(history).not.toBeNull();`.
    - Crear la atención clínica en estado `OPEN` con un procedimiento válido (`proceduresPerformed: [{ code: 'RES-EST', name: 'Resina Estética', toothNumber: '16', surface: 'Oclusal' }]`), cerrarla formalmente con `attention.close(now)` y guardarla.
    - Extraer el texto del PDF devuelto por Supertest usando `extractTextFromUncompressedPdf(res.body as Buffer)` y verificar:
      1. Cabecera `expect(res.headers['cache-control']).toContain('no-store')`.
      2. **Controles positivos:** `expect(decodedText).toContain('Evolución favorable del paciente tras la restauración en resina.')`, `expect(decodedText).toContain('K02.1 – Caries de la dentina')` y `expect(decodedText).toContain('Caries oclusal profunda')`.
      3. **Control negativo real sobre el texto decodificado:** `expect(decodedText).not.toContain('Nota super confidencial')`.
  - Hacer commit: `git add Backend/src/modules/clinical/presentation Backend/test/clinical-history.e2e-spec.ts && git commit -m "fix(clinical): add Cache-Control no-store, OpenAPI decorators and decode PDF text in E2E test"`

- [ ] 6.6 **Verificar cobertura >= 90 % en todas las subcarpetas (incluyendo `% Branch`), regenerar `Backend/openapi.json` y actualizar `evidence.md`:**
  - Ejecutar `pnpm --filter backend openapi:generate` y verificar que `/v1/clinical-histories/patient/{patientId}/pdf` (con `403`, `404` y `application/pdf`) y `/v1/clinical-attentions/patient/{patientId}/tooth/{toothNumber}/materials` estén documentados en `Backend/openapi.json`.
  - Ejecutar `pnpm --filter backend lint`, `pnpm --filter backend typecheck`, `pnpm --filter backend deps:check`, `pnpm --filter backend test:cov` y `pnpm --filter backend test:e2e`, comprobando que `src/modules/clinical/application/queries`, `src/modules/clinical/application/mappers`, `src/modules/clinical/application/use-cases` y `src/modules/clinical/domain` tengan todos `% Branch >= 90%`.
  - Actualizar `Backend/openspec/changes/add-clinical-history-pdf-export/evidence.md` con la salida **literal e íntegra** de los 5 comandos y métricas exactas que coincidan 100 % con la tabla ASCII de Jest.
  - Hacer commit: `git add -A && git commit -m "chore(clinical): remediate B-12 audit findings, regenerate openapi.json and update literal evidence"` dejando `git status` limpio.

## Workflow follow-up

- Pasa `evidence.md` actualizado al Arquitecto para verificar el cierre de los hallazgos de la Sección 6 antes de ejecutar `/opsx-sync` y `/opsx-archive`.