# Proposal

## Why
La Dra. Angelee Pacheco y su auxiliar necesitan encontrar a cualquier paciente desde la barra de búsqueda global del iPad escribiendo su nombre, apellido, número de documento o teléfono, incluso cuando cometen errores tipográficos o omiten tildes al escribir con una mano durante la consulta. Además, para respetar el Principio de Segregación de Interfaces (ISP, máximo 5 métodos por puerto), las consultas de búsqueda difusa deben segregarse en un puerto de lectura independiente (`PatientQueriesPort`).

- **Requisitos cubiertos:** RF-B-012, RNF-B-004, RNF-B-005, RNF-B-031, RNF-B-032, RC-002, RC-005, RC-012, RC-015, RC-018, RC-031, RC-074.
- **Change equivalente en Frontend:** `add-patients-and-catalogs-ui`.

## What Changes
- Crear una migración Prisma (`20261014010000_add_patients_trigram_indexes`) que añade índices GIN `gin_trgm_ops` sobre `first_name`, `last_name`, `document_number` y `phone` en la tabla `patients`.
- Definir el puerto de solo lectura segregado `PatientQueriesPort` (`PATIENT_QUERIES_TOKEN`) en `Backend/src/modules/patients/application/ports/patient.queries.port.ts` (ISP).
- Implementar la consulta `SearchPatientsQuery` (con validación de término mínimo y normalización) en `Backend/src/modules/patients/application/queries/search-patients.query.ts`.
- Implementar los adaptadores `InMemoryPatientQueriesAdapter` (con similitud de trigramas determinista en memoria) y `PrismaPatientQueriesAdapter` (con `$queryRaw` parametrizado usando `pg_trgm` y `similarity`), junto con su suite de pruebas de contrato y benchmark de $<300\text{ ms}$ con 10.000 pacientes (`RC-018`, `RC-031`).
- Exponer `GET /v1/patients/search` en `PatientsController` para roles `ADMIN` y `AUXILIARY` (`RC-005`) y regenerar `Backend/openapi.json`.

## Capabilities

### New Capabilities
*(Ninguna)*

### Modified Capabilities
- `patients-management`: Se agrega el requisito de búsqueda difusa de pacientes tolerante a errores tipográficos por nombre, documento o teléfono en $<300\text{ ms}$ (`GET /v1/patients/search`).

## Impact
- **Código afectado:** `Backend/prisma/migrations/`, `Backend/src/modules/patients/`, `Backend/test/patients.e2e-spec.ts`, `Backend/openapi.json`.