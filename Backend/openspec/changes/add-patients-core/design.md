# Design

## Context
El módulo `modules/patients` es el **módulo de referencia oficial** del proyecto (`AGENTS.md`, Sección 9 y documento de Stack, Sección 3.2, Regla 12). Su objetivo doble es implementar la gestión nuclear de pacientes (`RF-B-010`, `RF-B-011`, `RF-B-013`, `RF-B-014`, `RNF-B-010`, `RNF-B-011`) y servir como guía arquitectónica paso a paso de cómo se conectan las 4 capas de Clean Architecture y el ciclo TDD en este monorepo. Ver `proposal.md` para la motivación funcional.

*(Nota: la búsqueda difusa con trigramas `pg_trgm` en $<300\text{ ms}$ se implementa inmediatamente después en el change **B-06 `add-patients-trigram-search`** para mantener este PR bajo el límite de ~400 líneas de RC-014).*

## Goals / Non-Goals

**Goals:**
- Explicar didácticamente el rol de cada una de las 4 capas (`domain`, `application`, `infrastructure`, `presentation`) usando `patients` como ejemplo vivo.
- Garantizar que ningún paciente se cree sin autorización explícita de tratamiento de datos personales (`Ley 1581 de 2012`, `RNF-B-010`, `RNF-B-011`).
- Garantizar la no eliminación física de pacientes (`RF-B-010`, `RC-055`) mediante estado lógico `isActive`.
- Implementar la detección de duplicados (`RF-B-013`) diferenciando entre colisión estricta de documento (bloqueante `409 CONFLICT`) y alerta preventiva por documento o teléfono (`GET /v1/patients/check-duplicates`) para casos donde varios miembros de una familia comparten teléfono.
- Mantener la suite de contrato (`RC-018`) y pruebas E2E de permisos por rol (`RC-005`).

**Non-Goals:**
- Índices GIN/GiST y búsqueda tolerante a errores tipográficos con `pg_trgm` (corresponde a **B-06**).
- Antecedentes médicos e historia clínica (corresponde a **B-08** en `modules/clinical`).

## Guía de Referencia: Las 4 Capas en `modules/patients`

```text
+-------------------------------------------------------------------------+
| PRESENTATION (presentation/)                                            |
| PatientsController -> Valida DTOs HTTP, verifica Guards/Roles y delega  |
+------------------------------------+------------------------------------+
                                     | invoca
                                     v
+-------------------------------------------------------------------------+
| APPLICATION (application/)                                              |
| Casos de Uso (CreatePatientUseCase...) -> Orquestan flujo con ClockPort |
| e IdGeneratorPort. Un único método público execute() (RC-015).          |
+------------------------------------+------------------------------------+
                                     | depende de abstracciones
                                     v
+-------------------------------------------------------------------------+
| DOMAIN (domain/)                                                        |
| Entidad Patient + VOs (DocumentIdentity, PhoneNumber, EmergencyContact) |
| + Errores heredados de DomainError + Puerto PatientRepositoryPort       |
| (Cero imports de NestJS, Prisma o librerías externas - RC-012)          |
+------------------------------------+------------------------------------+
                                     ^
                                     | implementa puertos y mapea
+------------------------------------+------------------------------------+
| INFRASTRUCTURE (infrastructure/)                                        |
| PrismaPatientRepository + InMemoryPatientRepository + PatientMapper     |
+-------------------------------------------------------------------------+
```

## Decisions

1. **Separación entre Colisión Estricta de Documento y Detector de Duplicados (`RF-B-013`):**
   - *Por qué:* En un consultorio odontológico es frecuente que una madre y su hijo menor compartan el mismo número de celular (`phone`), pero nunca deben existir dos fichas en el mismo consultorio con el mismo `(documentType, documentNumber)`.
   - *Decisión:*
     - El documento `(clinicId, documentType, documentNumber)` tiene restricción `@@unique` en base de datos y validación en `CreatePatientUseCase`/`UpdatePatientUseCase` que lanza `DuplicatePatientDocumentError` (`CONFLICT` 409).
     - Se provee además `DetectDuplicatePatientsQuery` expuesto en `GET /v1/patients/check-duplicates?documentNumber=...&phone=...&excludePatientId=...`, que devuelve cualquier paciente del consultorio que coincida en documento o teléfono normalizado para que el iPad muestre el aviso preventivo (`RF-F-044`).
   - *Alternativa descartada:* Hacer `phone` único en la tabla `patients`, lo que impediría registrar hijos menores o adultos mayores con el teléfono de un acudiente.

2. **Cumplimiento Normativo Ley 1581 de 2012 en el Dominio (`RNF-B-010`, `RNF-B-011`):**
   - *Decisión:* El método de fábrica `Patient.create(...)` exige `dataTreatmentConsent === true` y asigna `dataTreatmentConsentAt: Date` (provisto por `ClockPort.now()`). Si `dataTreatmentConsent` es `false`, el dominio lanza `DataTreatmentConsentRequiredError` (`INVARIANT_VIOLATION` -> HTTP `422`).

3. **Segregación del Puerto `PatientRepositoryPort` (ISP - Máximo 5 métodos):**
   - *Decisión:* `PatientRepositoryPort` en `domain/` define exactamente 5 métodos cohesivos:
     1. `findById(clinicId: string, id: string): Promise<Patient | null>`
     2. `findByDocument(clinicId: string, documentType: DocumentType, documentNumber: string): Promise<Patient | null>`
     3. `findPotentialDuplicates(clinicId: string, params: { documentNumber?: string; phone?: string; excludePatientId?: string }): Promise<Patient[]>`
     4. `findAllByClinicId(clinicId: string, filter?: { isActive?: boolean }): Promise<Patient[]>`
     5. `save(patient: Patient): Promise<void>`

4. **Permisos por Rol (`RC-005`) y Tipado OpenAPI Nulo:**
   - *Decisión de Roles:* `ADMIN` y `AUXILIARY` pueden crear, listar, consultar, verificar duplicados y editar pacientes (`GET /v1/patients`, `GET /v1/patients/check-duplicates`, `GET /v1/patients/:id`, `POST /v1/patients`, `PATCH /v1/patients/:id`). Solo `ADMIN` puede cambiar el estado lógico `isActive` (`PATCH /v1/patients/:id/status`), garantizando que la auxiliar no pueda desactivar expedientes.
   - *Convención OpenAPI para campos anulables:* En los DTOs de respuesta, toda propiedad `string | null` o `Date | null` debe declararse con `@ApiPropertyOptional({ type: String, nullable: true })` para que `@nestjs/swagger` emita `"type": "string", "nullable": true` en `openapi.json` en lugar de `"type": "object"`.

## Risks / Trade-offs
- **[Risk] Espacios o guiones en números de documento o teléfono impiden detectar duplicados** → *Mitigación:* Los objetos de valor `DocumentIdentity` y `PhoneNumber` normalizan la entrada (eliminando espacios, guiones y paréntesis) en el constructor del dominio antes de persistir o comparar.
- **[Risk] Exposición accidental de datos de pacientes en logs al fallar una validación** → *Mitigación:* `logger.config.ts` y `sentry.sanitizer.ts` ya redactan `documentNumber` y `phone`; además se añadirá `firstName`, `lastName` y `emergencyContactName` o se mantendrán fuera de los mensajes de error no controlados (RNF-B-009, RC-023).