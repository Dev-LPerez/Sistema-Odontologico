# Glosario Clínico y de Dominio (Lenguaje Ubicuo)

Este glosario define la correspondencia oficial entre el lenguaje del negocio odontológico (en español de Colombia) y los identificadores técnicos en el código (clases, entidades, métodos, tablas y rutas en inglés) para el sistema de gestión del consultorio de la Dra. Angelee Pacheco.

---

## 1. Módulos y Conceptos Generales

| Término en Español | Término en Código (Inglés) | Capa / Módulo | Descripción |
|---|---|---|---|
| Consultorio / Clínica | `Clinic` | `identity` | Organización o consultorio odontológico independiente. Todas las entidades de persistencia poseen `clinicId` (RNF-B-032). |
| Usuario | `User` | `identity` | Profesional o auxiliar con acceso al sistema mediante credenciales. |
| Odontóloga / Administradora | `ADMIN` (Role) | `identity` | Rol con privilegios totales de administración, clínicos, financieros y de configuración. |
| Auxiliar de Odontología | `AUXILIARY` (Role) | `identity` | Rol con permisos operativos (agenda, registro de citas, apoyo administrativo), con restricciones clínicas y financieras. |
| Auditoría | `AuditLog` | `audit` | Registro inmutable de eventos sensibles y mutaciones en el sistema (RNF-B-020). |

---

## 2. Pacientes e Historia Clínica (`patients`, `clinical`)

| Término en Español | Término en Código (Inglés) | Descripción |
|---|---|---|
| Paciente | `Patient` | Persona que recibe servicios odontológicos. No se elimina físicamente del sistema (RC-055). |
| Documento de Identidad | `documentNumber`, `documentType` | Cédula de ciudadanía (`CC`), tarjeta de identidad (`TI`), registro civil (`RC`), pasaporte (`PAS`), etc. |
| Historia Clínica | `MedicalRecord` | Expediente clínico único y confidencial del paciente. |
| Anamnesis / Antecedentes | `Anamnesis`, `antecedents` | Registro de condiciones médicas previas, enfermedades sistémicas, medicamentos y alergias. |
| Atención Odontológica | `Attention` | Consulta, sesión o procedimiento realizado al paciente en una fecha determinada. |
| Evolución / Nota clínica | `EvolutionNote`, `notes` | Descripción del estado y progreso del paciente tras una intervención. |
| Nota Privada | `privateNotes` | Anotaciones de uso confidencial y exclusivo de la odontóloga tratante. |
| Diagnóstico | `Diagnosis` | Conclusión clínica o patológica (compatible con codificación CIE-10 / dental). |
| Plan de Tratamiento | `TreatmentPlan` | Conjunto secuenciado de procedimientos planificados para la rehabilitación del paciente. |
| Odontograma | `Odontogram` | Esquema gráfico estandarizado que representa las piezas dentales y sus superficies. |
| Pieza Dental | `Tooth` (ej. `toothNumber`: 11 a 48 según numeración FDI internacional) | Representación anatómica individual de cada diente. |
| Superficie Dental | `ToothSurface` | `vestibular` (V), `lingual` / `palatal` (L/P), `mesial` (M), `distal` (D), `occlusal` / `incisal` (O/I). |
| Hallazgo Odontológico | `Finding` | Estado patológico o restaurativo observado (ej. `caries`, `filling`, `missing`, `crown`, `fracture`). |

---

## 3. Catálogos, Insumos e Inventario (`catalogs`)

| Término en Español | Término en Código (Inglés) | Descripción |
|---|---|---|
| Procedimiento Odontológico | `Procedure` | Servicio clínico tipificado con precio base de referencia (ej. profilaxis, resina, endodoncia). |
| Insumo / Material | `Material` | Producto o sustancia consumible empleada en las atenciones clínicas (ej. anestesia, resina, guantes). |
| Existencias / Stock | `InventoryStock` | Cantidad disponible de un insumo en el consultorio. |
| Unidad de Medida | `UnitOfMeasure` | Unidad física de consumo (ej. `ml`, `mg`, `unit`, `box`, `tube`). |

---

## 4. Agenda y Citas (`scheduling`)

| Término en Español | Término en Código (Inglés) | Descripción |
|---|---|---|
| Cita Odontológica | `Appointment` | Reserva de franja horaria para la atención de un paciente. |
| Franja Horaria | `TimeSlot` | Intervalo de tiempo definido por fecha/hora de inicio y finalización. |
| Estado de Cita | `AppointmentStatus` | `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`. |
| Motivo de Consulta | `Reason` | Razón manifestada por el paciente o procedimiento agendado para la cita. |

---

## 5. Cotizaciones, Cobros y Facturación (`billing`)

| Término en Español | Término en Código (Inglés) | Descripción |
|---|---|---|
| Cotización / Presupuesto | `Quote` | Propuesta económica de tratamiento entregada al paciente con vigencia y desglose de costos. |
| Ítem de Cotización | `QuoteItem` | Renglón específico dentro de un presupuesto con procedimiento, cantidad y valor unitario. |
| Cobro / Factura | `Charge` | Obligación financiera registrada a cargo de un paciente por procedimientos realizados. |
| Pago / Abono | `Payment` | Transacción dineraria efectuada por el paciente para saldar o abonar a un cobro. |
| Método de Pago | `PaymentMethod` | `CASH` (efectivo), `TRANSFER` (transferencia bancaria / Nequi / Daviplata), `CARD` (tarjeta de débito/crédito). |

---

## 6. Archivos y Consentimientos (`files`)

| Término en Español | Término en Código (Inglés) | Descripción |
|---|---|---|
| Archivo Clínico | `ClinicalFile` | Documento digital, fotografía o estudio radiográfico adjunto al paciente. |
| Consentimiento Informado | `InformedConsent` | Documento legal firmado por el paciente o su representante antes de una intervención. |
| Firma Digital / Táctil | `Signature` | Trazo biométrico capturado en pantalla táctil con timestamp y hash de integridad. |
| URL Firmada | `PresignedUrl` | Enlace temporal y de corta duración emitido para descargar o visualizar archivos privados en R2 (RC-024). |

---

## 7. Conceptos Técnicos y Arquitectura (`shared`)

| Término en Código | Capa | Propósito |
|---|---|---|
| `AggregateRoot` | `domain` | Clase base para agregados que encapsulan invariantes y encolan eventos de dominio. |
| `DomainEvent` | `domain` | Hecho ocurrido en el dominio notificado a otros módulos o suscriptores. |
| `DomainError` | `domain` | Error tipado del dominio con categoría semántica (`VALIDATION`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INVARIANT_VIOLATION`). |
| `ClockPort` | `application` | Puerto para obtener fecha y hora deterministas (`now()`) y evaluar zona horaria `America/Bogota`. |
| `IdGeneratorPort` | `application` | Puerto para generar identificadores universales (UUID v4) sin instanciar utilidades globales. |
| `UnitOfWorkPort` | `application` | Puerto para ejecutar múltiples operaciones de persistencia en una transacción atómica aislada. |
| `EventBusPort` | `application` | Puerto para publicar eventos de dominio asíncronos o desacoplados entre módulos. |
| `CorrelationId` | `infrastructure` | Identificador único (`x-correlation-id`) propagado en cada ciclo de petición HTTP para trazabilidad. |
