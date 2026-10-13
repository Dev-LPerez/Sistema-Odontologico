# Requerimientos del Backend – Sistema de Gestión Odontológica

**Cliente:** Dra. Angelee Pacheco (odontóloga independiente) **Elaborado por:** Luis Guillermo Pérez Rubio **Fuente:** Reunión de levantamiento de requisitos del 21 de septiembre de 2026 **Versión:** 1.1 (auditada y alineada con arquitectura y alcance MVP) **Alcance del documento:** Servicios, datos, integraciones y reglas de negocio del lado del servidor. Los requisitos de interfaz están en el documento de Frontend.

## 1. Introducción

### 1.1 Propósito

Definir los requerimientos funcionales y no funcionales del backend de un sistema propio de gestión para un consultorio odontológico, que reemplace el trabajo manual actual (WhatsApp, Google Docs y Google Calendar sueltos) y evite el pago de suscripciones mensuales a plataformas de terceros.

### 1.2 Contexto del negocio

- Odontóloga independiente que alquila su espacio en un consultorio compartido.
- Atiende entre 1 y 3 pacientes por día (máximo 4), casi siempre sola, sin auxiliar fija.
- El canal principal de contacto con pacientes es WhatsApp; la mayoría llega por referidos y planea invertir en publicidad en Instagram.
- Hoy no lleva historia clínica digital de forma consistente ni control de seguimiento a pacientes.
- El inventario general del consultorio no es suyo; solo requiere control de sus materiales propios (resinas y materiales de diseño de sonrisa).

### 1.3 Alcance

El backend expone una API segura que da soporte a: consultorio, usuarios y roles, pacientes, catálogos de procedimientos y materiales propios, historia clínica, odontograma, atenciones, agenda, comunicaciones (WhatsApp y correo en segunda fase), archivos clínicos, consentimientos informados, cotizaciones, cobros, reportes y auditoría.

### 1.4 Fuera de alcance (primera versión)

- Facturación electrónica ante la DIAN (la doctora indicó que no la necesita por ahora).
- Control de inventario general del consultorio.
- Integración directa con el software y el equipo de radiografía existente.
- Pagos en línea y financiación de tratamientos a plazos posteriores a su finalización.
- Gestión de la tienda de insumos odontológicos.

### 1.5 Definiciones

- **Odontograma:** esquema de los 32 dientes del paciente donde se registran hallazgos y tratamientos con simbología estandarizada.
- **MVP:** producto mínimo viable que se presentará a la doctora para recibir retroalimentación.
- **Auxiliar:** persona de apoyo con acceso restringido al sistema.

### 1.6 Prioridades

Se usa la escala MoSCoW: **M** (Debe), **S** (Debería), **C** (Podría), **W** (No en esta versión). La columna MVP indica si entra en el primer prototipo.

## 2. Actores y roles

| Rol | Descripción | Permisos principales |
| --- | --- | --- |
| Odontóloga (administradora) | Dueña del sistema | Acceso total, incluida configuración y reportes financieros |
| Auxiliar | Apoyo en consulta o atención de mensajes | Agenda, mensajes y datos básicos de pacientes; sin acceso a finanzas ni a notas clínicas privadas |
| Soporte técnico (desarrollador) | Mantenimiento | Acceso a logs y configuración técnica, sin acceso a datos clínicos |
| Paciente | Receptor de mensajes y documentos | No tiene acceso directo al sistema; recibe enlaces o archivos |

Se estima un máximo de **3 usuarios simultáneos** en la primera versión. Todas las entidades llevan un identificador de consultorio (`clinicId`) desde la primera versión (RNF-B-032).

## 3. Requerimientos funcionales

### 3.1 Autenticación, usuarios y consultorio (`modules/identity`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-001 | El sistema debe autenticar usuarios con correo y contraseña. | M | Sí |
| RF-B-002 | El sistema debe soportar roles (administradora, auxiliar) con permisos concedidos por administradora. | M | Sí |
| RF-B-003 | La administradora debe poder crear, desactivar y editar usuarios. | M | Sí |
| RF-B-004 | El sistema debe ofrecer recuperación de contraseña por correo. | S | No |
| RF-B-005 | El sistema debe permitir autenticación en dos pasos. | C | No |
| RF-B-006 | Las sesiones deben expirar por inactividad y poder cerrarse de forma remota. | S | No |

*(Nota arquitectónica: la configuración del consultorio RF-B-141 también es gestionada dentro del módulo `identity` para proveer el `clinicId` base).*

### 3.2 Gestión de pacientes (`modules/patients`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-010 | Crear, consultar, editar y desactivar pacientes (no se eliminan físicamente). | M | Sí |
| RF-B-011 | Almacenar datos básicos: nombres, apellidos, documento de identidad, fecha de nacimiento, teléfono, correo, dirección, contacto de emergencia y fecha/autorización de tratamiento de datos personales (Ley 1581). | M | Sí |
| RF-B-012 | Buscar pacientes por nombre, documento o teléfono, tolerando errores tipográficos (`pg_trgm`). | M | Sí |
| RF-B-013 | Detectar posibles duplicados (mismo documento o teléfono) al crear o editar un paciente. | S | Sí |
| RF-B-014 | Registrar la fuente de captación del paciente (referido, Instagram, WhatsApp, directo) para reportes. | S | Sí |
| RF-B-015 | Registrar etiquetas (por ejemplo: familiar, conocido, tarifa especial). | C | No |

### 3.3 Historia clínica y atenciones (`modules/clinical`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-020 | Crear una historia clínica por paciente con motivo de consulta e historia de la enfermedad actual. | M | Sí |
| RF-B-021 | Registrar antecedentes médicos personales y familiares (hipertensión, diabetes, alergias, medicación, entre otros). | M | Sí |
| RF-B-022 | Registrar examen clínico, hallazgos por diente y diagnósticos. | M | Sí |
| RF-B-023 | Registrar un plan de tratamiento con procedimientos, estado (pendiente, en curso, realizado) y costo asociado. | M | Sí |
| RF-B-024 | Registrar evoluciones por cada atención (fecha, procedimiento realizado, observaciones). | M | Sí |
| RF-B-025 | Registrar los **materiales utilizados** por procedimiento, incluyendo marca, referencia y color (por ejemplo, resina A1, A2, BW), vinculados al diente tratado. | M | Sí |
| RF-B-026 | Consultar el historial de materiales por diente para poder repetir el mismo material en una reparación. | M | Sí |
| RF-B-027 | Permitir notas privadas de la doctora que no sean visibles para el rol auxiliar ni se incluyan en documentos para el paciente. | S | Sí |
| RF-B-028 | Mantener versionado: toda modificación de una atención ya cerrada debe conservar la versión anterior. | M | Sí |
| RF-B-029 | Permitir cerrar una atención para que no se pueda modificar sin dejar rastro. | S | Sí |
| RF-B-030 | Generar un resumen de historia clínica exportable en PDF para entregar al paciente (excluyendo notas privadas). | S | Sí |

### 3.4 Odontograma (`modules/clinical`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-040 | Almacenar el estado de cada una de las 32 piezas dentales (permanentes), con soporte opcional para dentición temporal. | M | Sí |
| RF-B-041 | Almacenar el estado por superficie del diente (oclusal, vestibular, lingual/palatina, mesial, distal). | M | Sí |
| RF-B-042 | Soportar un catálogo de hallazgos estandarizados: caries, restauración en resina, ausencia, extracción indicada, cálculo, bolsa periodontal, entre otros, distinguiendo estado (existente, planificado, realizado). | M | Sí |
| RF-B-043 | Guardar instantáneas del odontograma por fecha para comparar la evolución. | S | Sí |
| RF-B-044 | Exponer el odontograma en un formato estructurado (JSONB) y poder renderizarlo como imagen/SVG para PDF. | M | Sí |

### 3.5 Catálogo de procedimientos, precios y materiales (`modules/catalogs`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-050 | Mantener un catálogo de procedimientos (limpieza, blanqueamiento, resina, diseño de sonrisa, etc.) con precio estándar y descripción. | M | Sí |
| RF-B-051 | Permitir ajustar el precio por paciente y registrar el motivo (conocido, familiar, promoción). | M | Sí |
| RF-B-052 | Mantener un catálogo de materiales propios (marca, referencia, tipo, color). | M | Sí |
| RF-B-053 | Llevar un control básico de existencias solo de los materiales propios, con descuento automático al registrar su uso en una atención y alerta de bajo stock. | C | Sí |

### 3.6 Agenda y citas (`modules/scheduling`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-060 | Crear, reprogramar y cancelar citas con paciente, procedimiento, fecha, hora y duración. | M | Sí |
| RF-B-061 | Impedir citas que se solapen y respetar la disponibilidad configurada (por ejemplo, citas a partir de las 9:00 a. m., máximo 3 o 4 por día). | M | Sí |
| RF-B-062 | Sincronizar de forma bidireccional las citas con Google Calendar de la doctora. | M | Sí |
| RF-B-063 | Registrar el estado de la cita: programada, confirmada, asistió, no asistió, cancelada. | M | Sí |
| RF-B-064 | Marcar automáticamente al paciente que no asistió para activar un mensaje de reagendamiento. | S | No |
| RF-B-065 | Permitir configurar la disponibilidad semanal y bloqueos (vacaciones, días libres). | S | Sí |
| RF-B-066 | Ofrecer un enlace público de agendamiento donde el paciente elija entre los horarios disponibles y complete sus datos básicos. | S | No |
| RF-B-067 | Al agendar, crear automáticamente el registro del paciente con los datos que él diligencie. | S | No |

### 3.7 Comunicaciones con pacientes (WhatsApp y correo) (`modules/messaging`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-070 | Integrarse con WhatsApp Business mediante la API oficial (WhatsApp Cloud API) para recibir y enviar mensajes desde un número propio de la doctora. | M | No |
| RF-B-071 | Registrar todo el historial de conversación asociado al paciente. | M | No |
| RF-B-072 | Implementar un asistente con inteligencia artificial que responda preguntas frecuentes (precios, duración, qué incluye un tratamiento, horarios) a partir de una base de conocimiento que la doctora pueda editar. | M | No |
| RF-B-073 | El asistente debe limitarse a la información cargada, y cuando no sepa responder, derivar la conversación a la doctora o auxiliar y notificarla. | M | No |
| RF-B-074 | El asistente no debe dar diagnósticos ni recomendaciones clínicas; ante síntomas o urgencias debe derivar a la doctora. | M | No |
| RF-B-075 | Permitir a la doctora pausar el asistente en una conversación y tomar el control manual. | M | No |
| RF-B-076 | El asistente debe poder ofrecer horarios disponibles y agendar la cita previa confirmación del paciente. | S | No |
| RF-B-077 | Enviar recordatorios automáticos de cita (por ejemplo, 24 horas y 2 horas antes) por WhatsApp y correo, con opción de confirmar o reprogramar. | M | No |
| RF-B-078 | Enviar mensajes de seguimiento postratamiento y de control periódico configurables por tipo de procedimiento. | M | No |
| RF-B-079 | Enviar correos de confirmación de cita y cotizaciones desde un correo con el dominio propio de la doctora. | M | No |
| RF-B-080 | Gestionar plantillas de mensajes aprobadas por WhatsApp y respetar la ventana de 24 horas de conversación. | M | No |
| RF-B-081 | Respetar la decisión del paciente de no recibir mensajes (opt-out) y registrar su consentimiento de contacto. | M | No |
| RF-B-082 | Notificar a la doctora (notificación push o correo) cuando llegue un mensaje nuevo que requiera atención humana. | M | No |

### 3.8 Archivos clínicos (fotos, radiografías y documentos) (`modules/files`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-090 | Subir, almacenar y descargar imágenes (JPG, PNG, HEIC) y PDF asociados al paciente y opcionalmente a una atención o diente. | M | Sí |
| RF-B-091 | Clasificar archivos por tipo: radiografía, foto antes, foto después, documento, consentimiento. | M | Sí |
| RF-B-092 | Generar miniaturas y versiones optimizadas sin perder el original. | S | Sí |
| RF-B-093 | Permitir comparar pares de imágenes antes y después (el backend debe poder emparejarlas por tratamiento). | S | No |
| RF-B-094 | Entregar archivos solo mediante URLs firmadas y temporales; nunca públicas. | M | Sí |
| RF-B-095 | Soportar archivos de radiografía de gran tamaño (hasta 25 MB por archivo). | S | Sí |

### 3.9 Consentimientos y firmas (`modules/files`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-100 | Gestionar plantillas de consentimiento informado por tipo de procedimiento. | M | Sí |
| RF-B-101 | Almacenar la firma capturada (imagen o trazo vectorial) junto con fecha, hora, usuario y dispositivo, y generar un PDF firmado inalterable. | M | Sí |
| RF-B-102 | Permitir adjuntar la fotografía o escaneo de un consentimiento firmado en físico. | M | Sí |
| RF-B-103 | Calcular y guardar el hash criptográfico (SHA-256) y sellado avanzado del documento firmado para peritaje externo. | S | No |

### 3.10 Cotizaciones (`modules/billing`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-110 | Generar cotizaciones a partir de procedimientos del catálogo, con precios ajustables, descuentos y vigencia. | M | Sí |
| RF-B-111 | Generar la cotización en PDF con la identidad de la doctora y compartirla. | M | Sí |
| RF-B-112 | Guardar todas las cotizaciones por paciente para consulta posterior, con estados: enviada, aceptada, rechazada, vencida. | M | Sí |
| RF-B-113 | Convertir una cotización aceptada en plan de tratamiento. | S | No |

### 3.11 Cobros y finanzas (`modules/billing`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-120 | Registrar cobros por atención o procedimiento con valor, fecha y método (transferencia, llave, efectivo, otro). | M | Sí |
| RF-B-121 | Registrar el valor realmente cobrado frente al precio de lista y el motivo de la diferencia. | M | Sí |
| RF-B-122 | Registrar abonos parciales para tratamientos largos y calcular el saldo pendiente. | S | No |
| RF-B-123 | Generar un comprobante simple de pago (no es factura electrónica) cuando la doctora lo requiera. | C | No |

### 3.12 Reportes y analítica (`modules/reporting`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-130 | Reporte de ingresos por día, semana y mes, con filtro por procedimiento. | M | Sí |
| RF-B-131 | Reporte de pacientes nuevos por periodo y fuente de captación. | M | Sí |
| RF-B-132 | Reporte de procedimientos más solicitados. | M | Sí |
| RF-B-133 | Reporte de asistencia: citas atendidas, canceladas y no asistidas. | S | No |
| RF-B-134 | Listado de pacientes sin control o sin visita en un periodo definido, para campañas de reactivación. | S | No |
| RF-B-135 | Exportar reportes a CSV o Excel. | C | No |

### 3.13 Auditoría y administración (`modules/audit` y `modules/identity`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-B-140 | Registrar un log de auditoría de quién consultó, creó, modificó o exportó datos de pacientes, con fecha y hora. | M | Sí |
| RF-B-141 | Permitir configurar datos del consultorio: nombre, logo, dirección, horarios, textos de plantillas. | M | Sí |
| RF-B-142 | Realizar copias de seguridad automáticas y poder restaurarlas. | M | Sí |
| RF-B-143 | Permitir exportar todos los datos de un paciente (derecho de acceso). | S | No |
| RF-B-144 | Permitir a la doctora importar pacientes existentes desde una hoja de cálculo. | S | No |

## 4. Requerimientos no funcionales

### 4.1 Seguridad y privacidad

| ID | Requisito |
| --- | --- |
| RNF-B-001 | Toda comunicación debe cifrarse con TLS 1.2 o superior. |
| RNF-B-002 | Los datos sensibles (historia clínica, archivos) deben cifrarse en reposo. |
| RNF-B-003 | Las contraseñas deben almacenarse con un algoritmo de hash robusto (Argon2 o bcrypt) con sal. |
| RNF-B-004 | Debe aplicarse control de acceso por rol en cada endpoint, evaluado en el servidor. |
| RNF-B-005 | La API debe protegerse contra las vulnerabilidades del OWASP Top 10 (inyección, XSS, CSRF, control de acceso roto, entre otras). |
| RNF-B-006 | Debe aplicarse límite de intentos de inicio de sesión y de peticiones por usuario. |
| RNF-B-007 | Los secretos (tokens de WhatsApp, claves de IA, credenciales de correo) deben almacenarse fuera del código, en un gestor de secretos o variables de entorno protegidas. |
| RNF-B-008 | Los datos enviados al servicio de inteligencia artificial deben minimizarse: no se envían historias clínicas ni datos sensibles; solo la base de conocimiento y el mensaje del paciente. |
| RNF-B-009 | Los logs no deben contener datos clínicos ni credenciales. |

### 4.2 Cumplimiento normativo (Colombia)

Pendiente de validación con un asesor jurídico o de salud antes del lanzamiento.

| ID | Requisito |
| --- | --- |
| RNF-B-010 | Cumplir la Ley 1581 de 2012 y el Decreto 1377 de 2013 sobre protección de datos personales: autorización de tratamiento, finalidad, derechos de acceso, actualización y supresión. |
| RNF-B-011 | Los datos de salud son datos sensibles; deben registrarse con autorización explícita del paciente. |
| RNF-B-012 | La historia clínica debe conservarse según la normativa colombiana vigente (Resolución 1995 de 1999 y normas sobre historia clínica electrónica, como la Ley 2015 de 2020); el sistema no debe permitir su eliminación definitiva antes del periodo legal. |
| RNF-B-013 | Garantizar la integridad, el control de modificaciones y la trazabilidad de la historia clínica. |
| RNF-B-014 | Evaluar si es necesario el registro de la base de datos ante la autoridad de protección de datos (SIC). |

### 4.3 Disponibilidad y confiabilidad

| ID | Requisito |
| --- | --- |
| RNF-B-020 | Disponibilidad objetivo del 99,5 % mensual en horario de consultorio. |
| RNF-B-021 | Copias de seguridad diarias con retención mínima de 30 días y copia en una región distinta. |
| RNF-B-022 | Objetivo de recuperación: RPO máximo de 24 horas y RTO máximo de 4 horas. |
| RNF-B-023 | Las integraciones externas (WhatsApp, correo, Google, IA) deben ejecutarse en colas con reintentos y manejo de fallos, sin bloquear la operación de la doctora. |
| RNF-B-024 | Los mensajes entrantes de WhatsApp no deben perderse; deben procesarse de forma idempotente ante reenvíos del proveedor. |

### 4.4 Rendimiento y escalabilidad

| ID | Requisito |
| --- | --- |
| RNF-B-030 | El 95 % de las peticiones de lectura debe responder en menos de 500 ms y las de escritura en menos de 1 s. |
| RNF-B-031 | Las búsquedas de pacientes deben responder en menos de 300 ms con hasta 10.000 pacientes. |
| RNF-B-032 | El diseño debe soportar al menos 3 usuarios concurrentes y crecer a decenas de consultorios sin rediseño de datos (preparado para multiusuario por cuenta con `clinicId`). |
| RNF-B-033 | La subida de archivos de hasta 25 MB debe ser reanudable ante cortes de conexión. |

### 4.5 Mantenibilidad y calidad

| ID | Requisito |
| --- | --- |
| RNF-B-040 | API REST documentada con OpenAPI, versionada desde la primera versión (`/v1`). |
| RNF-B-041 | Cobertura mínima de pruebas automatizadas del 80 % global y del 90 % en dominio y casos de uso. |
| RNF-B-042 | Integración y despliegue continuos con ambientes separados de desarrollo, pruebas y producción. |
| RNF-B-043 | Migraciones de base de datos versionadas y reversibles. |
| RNF-B-044 | Registro de errores y monitoreo con alertas al desarrollador. |
| RNF-B-045 | Todas las fechas deben almacenarse en UTC y presentarse en la zona horaria America/Bogota. |

### 4.6 Costos y operación

| ID | Requisito |
| --- | --- |
| RNF-B-050 | La infraestructura debe mantener un costo mensual bajo, dado que la doctora busca evitar suscripciones elevadas; se debe presentar un estimado de alojamiento, base de datos, almacenamiento, mensajería de WhatsApp y consumo de IA antes de definir el presupuesto. |
| RNF-B-051 | El consumo de IA debe tener topes configurables para controlar el costo. |
| RNF-B-052 | Los datos y el código deben ser portables: la doctora debe poder migrar a otro proveedor y exportar sus datos. |

## 5. Integraciones externas

| Integración | Uso | Notas |
| --- | --- | --- |
| WhatsApp Business (Cloud API) | Mensajes, recordatorios, asistente (Fase 2) | Requiere número propio de la doctora, no sujeto a pérdida por inactividad; los mensajes iniciados por el negocio usan plantillas aprobadas con costo por conversación |
| Google Calendar API | Sincronización de citas (MVP) | Autorización OAuth de la cuenta de la doctora |
| Servicio de correo transaccional | Confirmaciones y cotizaciones (Fase 2) | Correo con el dominio propio ya adquirido por la doctora (aún sin crear) |
| Modelo de lenguaje (IA) | Respuestas automáticas (Fase 2) | Solo con base de conocimiento del consultorio |
| Almacenamiento de objetos (R2) | Fotos, radiografías, PDFs de historia, cotizaciones y consentimientos (MVP) | Cifrado y URLs firmadas |
| Notificaciones push | Aviso de mensajes nuevos (Fase 2) | Para iPad y celular |

## 6. Modelo de datos de alto nivel

Entidades principales: Consultorio (`Clinic`), Usuario, Rol, Paciente, HistoriaClínica, Antecedente, Atención, VersiónAtención, Diagnóstico, PlanDeTratamiento, ProcedimientoCatálogo, PrecioPaciente, Odontograma, InstantáneaOdontograma, HallazgoDental, MaterialCatálogo, MaterialUsado, Cita, Disponibilidad, BloqueoAgenda, Conversación (Fase 2), Mensaje (Fase 2), PlantillaMensaje (Fase 2), BaseDeConocimiento (Fase 2), Recordatorio (Fase 2), ArchivoClínico, PlantillaConsentimiento, ConsentimientoFirmado, Cotización, ItemCotización, Cobro, RegistroDeAuditoría.

Relaciones clave: un consultorio agrupa todas las entidades (`clinicId`); un paciente tiene una historia clínica, muchas atenciones y un odontograma con instantáneas; una atención tiene procedimientos realizados, materiales usados por diente (que descuentan del stock de materiales propios), archivos, consentimientos y cobros; una cita puede originar una atención; una cotización aceptada puede originar un plan de tratamiento.

## 7. Supuestos, riesgos y dependencias

### Supuestos

- La doctora migrará su número personal actual a número de consultorio en WhatsApp Business y obtendrá un número personal nuevo (para la Fase 2).
- Se creará el correo con el dominio propio ya adquirido.
- Se usará inicialmente un único consultorio y una única cuenta, aunque la base de datos nace preparada con `clinicId`.

### Riesgos

- **Costos y aprobaciones de WhatsApp API:** la verificación del negocio y las plantillas pueden demorar el lanzamiento de la Fase 2. Mitigación: iniciar el trámite administrativo mientras se desarrolla el MVP.
- **Cumplimiento normativo sobre historia clínica electrónica:** puede exigir requisitos adicionales. Mitigación: revisión con asesor jurídico antes de usar el sistema con datos reales.
- **Respuestas inadecuadas del asistente de IA (Fase 2):** mitigación con límites de alcance, derivación humana y revisión de conversaciones.
- **Dependencia del desarrollador de la página web actual:** el acceso al código, alojamiento y dominio aún no está resuelto; no bloquea el backend pero afecta la integración del enlace de agendamiento público de la Fase 2.

### Pendientes por definir

- Presupuesto y proveedor definitivo de alojamiento en producción.
- Si se integrará la información del software de radiografías o se mantendrá separado.
- Tiempo de retención de datos acordado y política de privacidad.
- Confirmar el alcance exacto de lectura de la auxiliar en la ficha clínica (las notas privadas y finanzas quedan estrictamente ocultas).

## 8. Plan sugerido de entrega (Alineado con Tablas MoSCoW)

**MVP (primera entrega):** autenticación, roles y configuración de consultorio (`identity`); pacientes con búsqueda tolerante a errores, aviso de duplicados y autorización Ley 1581 (`patients`); catálogos de procedimientos, precios por paciente y materiales propios con control de existencias (`catalogs`); historia clínica, antecedentes, odontograma JSONB con instantáneas por fecha, atenciones con materiales por diente, notas privadas de la doctora, cierre y versionado inmutable de atenciones, y resumen de historia clínica en PDF (`clinical`); agenda con disponibilidad, bloqueos y sincronización bidireccional con Google Calendar (`scheduling`); archivos clínicos en R2 con miniaturas y consentimientos informados con plantillas, firma digital en pantalla generando PDF inalterable y adjunto en físico (`files`); cotizaciones en PDF y cobros básicos (`billing`); reportes de ingresos, pacientes nuevos y procedimientos (`reporting`); y log de auditoría junto con copias de seguridad (`audit`).

**Segunda fase:** seguimiento automático postratamiento, agendamiento público, hash criptográfico de consentimientos para peritaje (RF-B-103), conversión automática de cotización a plan de tratamiento (RF-B-113), WhatsApp Business con asistente de preguntas frecuentes y recordatorios (`messaging`), comparación antes y después de imágenes (RF-B-093), y exportación de datos de paciente / importación por hoja de cálculo.

**Tercera fase:** abonos parciales y saldos de tratamientos largos (RF-B-122), analítica de reactivación y asistencia, exportación a CSV/Excel, doble factor de autenticación y operación multiconsultorio activa.