# Spec Delta

## ADDED Requirements

### Requirement: Búsqueda rápida de pacientes tolerante a errores tipográficos (pg_trgm)
El sistema SHALL permitir a usuarios autenticados (`ADMIN` o `AUXILIARY`) buscar pacientes de su `clinicId` en `GET /v1/patients/search?q=...` por nombre, apellido, número de documento o teléfono, tolerando errores tipográficos mediante trigramas (`pg_trgm`), ordenando por relevancia y respondiendo en menos de 300 ms con hasta 10.000 pacientes registrados (RF-B-012, RNF-B-004, RNF-B-031, RNF-B-032, RC-005, RC-031).

#### Scenario: Búsqueda exitosa por nombre con errores tipográficos para ADMIN o AUXILIARY
- **GIVEN** un paciente activo `"Carlos Gómez"` con documento `"1020304050"` y teléfono `"3001234567"` en el consultorio `"clinic-123"`
- **WHEN** un usuario autenticado con rol `ADMIN` o `AUXILIARY` consulta `GET /v1/patients/search?q=Carls Gomz`
- **THEN** la API responde con estado HTTP `200` y devuelve a `"Carlos Gómez"` en los resultados ordenados por relevancia sin exponer pacientes de otros consultorios

#### Scenario: Búsqueda exitosa por fragmento de documento o teléfono con caracteres de formato
- **GIVEN** un paciente activo en `"clinic-123"` con `documentNumber: "1020304050"` y `phone: "3001234567"`
- **WHEN** un usuario autenticado consulta `GET /v1/patients/search?q=300-123` o `GET /v1/patients/search?q=102030`
- **THEN** la API responde con estado HTTP `200` e incluye al paciente coincidente en la lista de resultados

#### Scenario: Exclusión por defecto de pacientes inactivos e inclusión opcional en búsqueda
- **GIVEN** un paciente desactivado (`isActive: false`) llamado `"Laura Martínez"` en `"clinic-123"`
- **WHEN** se consulta `GET /v1/patients/search?q=Laura` sin parámetros adicionales, y luego `GET /v1/patients/search?q=Laura&includeInactive=true`
- **THEN** la primera consulta no devuelve al paciente inactivo, mientras que la segunda sí lo incluye con `isActive: false`

#### Scenario: Respuesta en menos de 300 ms sobre un catálogo de 10.000 pacientes
- **GIVEN** un consultorio con `10.000` pacientes sintéticos registrados
- **WHEN** se ejecuta la búsqueda por trigramas con un término con error tipográfico
- **THEN** la consulta retorna las mejores coincidencias del consultorio en menos de `300 ms` (RNF-B-031, RC-031)