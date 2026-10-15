# Spec Delta

## ADDED Requirements

### Requirement: Búsqueda rápida de pacientes tolerante a errores tipográficos y tildes (pg_trgm + unaccent)
El sistema SHALL permitir a usuarios autenticados (`ADMIN` o `AUXILIARY`) buscar pacientes de su `clinicId` en `GET /v1/patients/search?q=...` por nombre, apellido, documento o teléfono, tolerando errores tipográficos y omisión de tildes mediante `pg_trgm` y `unaccent` en PostgreSQL, ordenando por relevancia y respondiendo en menos de 300 ms con 10.000 pacientes usando índices GIN (RF-B-012, RNF-B-004, RNF-B-031, RNF-B-032, RC-005, RC-018, RC-031).

#### Scenario: Búsqueda exitosa por nombre con errores tipográficos y sin tildes para ADMIN o AUXILIARY
- **GIVEN** pacientes activos `"Carlos Gómez"` e `"Inés Martínez"` registrados en el consultorio `"clinic-123"`
- **WHEN** un usuario autenticado con rol `ADMIN` o `AUXILIARY` consulta `GET /v1/patients/search?q=Carls Gomz` o `GET /v1/patients/search?q=Ines`
- **THEN** la API responde con estado HTTP `200` y devuelve a `"Carlos Gómez"` o `"Inés Martínez"` respectivamente ordenados por relevancia sin exponer pacientes de otros consultorios

#### Scenario: Búsqueda exitosa por fragmento de documento o teléfono con caracteres de formato
- **GIVEN** un paciente activo en `"clinic-123"` con `documentNumber: "1020304050"` y `phone: "3001234567"`
- **WHEN** un usuario autenticado consulta `GET /v1/patients/search?q=300-123` o `GET /v1/patients/search?q=102030`
- **THEN** la API responde con estado HTTP `200` e incluye al paciente coincidente en la lista de resultados

#### Scenario: Exclusión por defecto de pacientes inactivos e inclusión opcional en búsqueda
- **GIVEN** un paciente desactivado (`isActive: false`) llamado `"Laura Martínez"` en `"clinic-123"`
- **WHEN** se consulta `GET /v1/patients/search?q=Laura` sin parámetros adicionales, y luego `GET /v1/patients/search?q=Laura&includeInactive=true`
- **THEN** la primera consulta no devuelve al paciente inactivo, mientras que la segunda sí lo incluye con `isActive: false`

#### Scenario: Respuesta en menos de 300 ms sobre 10.000 pacientes reales en PostgreSQL usando índice GIN
- **GIVEN** un consultorio con `10.000` pacientes sintéticos persistidos en PostgreSQL
- **WHEN** se ejecuta la búsqueda por trigramas con un término con error tipográfico o sin tilde
- **THEN** PostgreSQL utiliza el índice GIN (`Bitmap Index Scan` en `EXPLAIN ANALYZE`) y retorna las coincidencias en menos de `300 ms` (RNF-B-031, RC-018, RC-031)