# Requerimientos del Frontend – Sistema de Gestión Odontológica

**Cliente:** Dra. Angelee Pacheco (odontóloga independiente) **Elaborado por:** Luis Guillermo Pérez Rubio **Fuente:** Reunión de levantamiento de requisitos del 21 de septiembre de 2026 **Versión:** 1.1 (auditada y alineada con arquitectura y alcance MVP) **Alcance del documento:** Interfaz de usuario, experiencia de uso, pantallas y comportamiento en el dispositivo. Los servicios, datos e integraciones están en el documento de Backend.

## 1. Introducción

### 1.1 Propósito

Definir los requerimientos funcionales y no funcionales de la interfaz de un sistema de gestión para consultorio odontológico, pensado para usarse principalmente en un **iPad** durante la atención, con soporte también en computador y celular.

### 1.2 Perfil del usuario

- La doctora atiende sola entre 1 y 3 pacientes al día, con las manos ocupadas y guantes durante buena parte de la consulta.
- Hoy escribe y registra todo manualmente; el registro clínico le resulta “tedioso” y por eso lo ha dejado de hacer. **La interfaz debe hacer que registrar sea más rápido que no registrar.**
- Revisa mensajes de pacientes con frecuencia desde la calle, por lo que necesita rapidez en pantallas pequeñas.
- Quizás trabaje con una auxiliar ocasional que apoya con mensajes y datos básicos.
- No es una usuaria técnica: requiere una interfaz simple, con pocos pasos y textos claros en español.

### 1.3 Contextos de uso

| Contexto | Dispositivo | Necesidad principal |
| --- | --- | --- |
| En consulta, con el paciente | iPad horizontal, con Apple Pencil | Odontograma, historia clínica, fotos, firmas de consentimiento |
| En el escritorio o administrando | Computador | Reportes, catálogos, configuración |
| En la calle o entre pacientes | Celular | Mensajes (Fase 2), agenda del día, confirmar citas |

### 1.4 Fuera de alcance (primera versión)

- Portal para pacientes con inicio de sesión.
- Aplicaciones nativas publicadas en tiendas (se parte de una aplicación web instalable).
- Interfaz de la tienda de insumos odontológicos.
- Facturación electrónica.

### 1.5 Prioridades

Escala MoSCoW: **M** (Debe), **S** (Debería), **C** (Podría). La columna MVP indica si entra en el primer prototipo.

## 2. Plataforma y enfoque técnico

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-001 | La aplicación debe ser una aplicación web progresiva (PWA) instalable en la pantalla de inicio del iPad, el celular y el computador. | M | Sí |
| RF-F-002 | El diseño debe ser **iPad primero**: la experiencia en iPad horizontal y vertical se diseña antes que la de computador. | M | Sí |
| RF-F-003 | La interfaz debe adaptarse (responsiva) a iPad, computador y celular sin perder funciones esenciales. | M | Sí |
| RF-F-004 | Debe funcionar en Safari (iPadOS e iOS), Chrome y Edge en sus dos últimas versiones principales. | M | Sí |
| RF-F-005 | Debe soportar entrada táctil y Apple Pencil, además de teclado y ratón en computador. | M | Sí |

## 3. Requerimientos funcionales por pantalla

### 3.1 Acceso y navegación (`features/auth` y `app/`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-010 | Pantalla de inicio de sesión con correo y contraseña, y opción de mantener la sesión iniciada en el dispositivo. | M | Sí |
| RF-F-011 | Navegación principal siempre visible: Hoy, Agenda, Pacientes, Cotizaciones, Reportes y Configuración (barra lateral en iPad y computador, barra inferior en celular); Mensajes se añade cuando entre la mensajería, fuera del MVP. | M | Sí |
| RF-F-012 | Búsqueda global de pacientes accesible desde cualquier pantalla, con resultados mientras se escribe. | M | Sí |
| RF-F-013 | Las opciones y datos que el rol auxiliar no puede ver (finanzas, reportes financieros, notas privadas) no deben mostrarse en su interfaz. | M | Sí |
| RF-F-014 | Cierre de sesión automático por inactividad, con aviso previo y sin perder el trabajo en curso. | S | No |

### 3.2 Pantalla “Hoy” (tablero diario) (`features/appointments`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-020 | Mostrar las citas del día en orden, con hora, nombre del paciente, procedimiento y estado. | M | Sí |
| RF-F-021 | Desde cada cita, abrir la ficha del paciente o iniciar la atención con un solo toque. | M | Sí |
| RF-F-022 | Mostrar indicadores de mensajes sin responder o que requieren atención humana. | M | No |
| RF-F-023 | Mostrar alertas: pacientes con alergias o condiciones médicas relevantes en las citas del día. | S | No |
| RF-F-024 | Mostrar pacientes pendientes de seguimiento o control. | S | No |

### 3.3 Agenda (`features/appointments`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-030 | Vistas de día, semana y mes con las citas coloreadas por estado o tipo de procedimiento. | M | Sí |
| RF-F-031 | Crear una cita en pocos pasos: buscar o crear paciente, elegir procedimiento, elegir hora entre las disponibles. | M | Sí |
| RF-F-032 | Reprogramar arrastrando y soltando la cita (táctil y ratón con FullCalendar) o desde un formulario. | S | Sí |
| RF-F-033 | Cambiar el estado de una cita (confirmada, asistió, no asistió, cancelada) con un toque. | M | Sí |
| RF-F-034 | Indicar visualmente los horarios no disponibles, los bloqueos y el límite de citas por día. | M | Sí |
| RF-F-035 | Mostrar el estado de sincronización con Google Calendar y permitir reintentarla. | S | Sí |
| RF-F-036 | Configurar la disponibilidad semanal (por ejemplo, inicio desde las 9:00 a. m.) y los bloqueos puntuales. | S | Sí |

### 3.4 Pacientes (`features/patients`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-040 | Lista de pacientes con búsqueda, orden y filtros (nuevos, con tratamiento en curso, sin control reciente). | M | Sí |
| RF-F-041 | Formulario de datos básicos con validaciones claras y guardado automático de borradores. | M | Sí |
| RF-F-042 | Ficha del paciente con pestañas: Resumen, Historia clínica, Odontograma, Atenciones, Archivos y Consentimientos, Mensajes, Cotizaciones y Cobros. La pestaña Mensajes se activa cuando entre la mensajería (fuera del MVP). | M | Sí |
| RF-F-043 | El Resumen debe mostrar de un vistazo: última visita, próximo control, tratamiento en curso, alertas médicas, saldo pendiente. | M | Sí |
| RF-F-044 | Aviso de posible paciente duplicado al crear o editar. | S | Sí |
| RF-F-045 | Botón para escribir al paciente por WhatsApp desde su ficha. | M | No |

### 3.5 Historia clínica y atención (`features/attention`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-050 | Formulario guiado de historia clínica por secciones: motivo de consulta, historia actual, antecedentes, examen clínico, diagnóstico y plan de tratamiento. | M | Sí |
| RF-F-051 | Antecedentes médicos con casillas y opciones rápidas (hipertensión, diabetes, alergias) y campo de texto libre solo cuando haga falta. | M | Sí |
| RF-F-052 | Registro rápido de atención: al abrir una atención, ofrecer los procedimientos del plan de tratamiento para marcar con un toque. | M | Sí |
| RF-F-053 | Selector de **material utilizado** por diente y procedimiento (marca, tipo, color como A1, A2, BW), con lista de materiales usados recientemente. | M | Sí |
| RF-F-054 | Al abrir un diente del odontograma, mostrar el historial de materiales y tratamientos de ese diente, para repetir el mismo material en una reparación. | M | Sí |
| RF-F-055 | Guardado automático continuo; el usuario nunca debe perder lo escrito si se cierra la aplicación o se cae la conexión. | M | Sí |
| RF-F-056 | Entrada por dictado de voz nativo del teclado del iPad en los campos de texto largos. | S | Sí |
| RF-F-057 | Plantillas de texto frecuentes para observaciones y diagnósticos. | C | No |
| RF-F-058 | Cerrar la atención y mostrar claramente su estado (borrador o cerrada); las ediciones posteriores deben advertir que se registrará el cambio como nueva versión. | S | Sí |
| RF-F-059 | Notas privadas de la doctora, marcadas visualmente y excluidas de lo que se comparte con el paciente y del rol auxiliar. | S | Sí |
| RF-F-060 | Vista de impresión y descarga en PDF de la historia clínica para entregarla al paciente. | S | Sí |

### 3.6 Odontograma interactivo (`features/odontogram`)

Es la funcionalidad más distintiva del sistema, porque la doctora hoy no puede hacerlo en Google Docs.

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-070 | Mostrar el esquema de los 32 dientes permanentes (y opcionalmente los temporales) con una representación por superficies de cada diente. | M | Sí |
| RF-F-071 | Tocar una superficie y asignarle un hallazgo desde una paleta (caries, restauración en resina, cálculo, bolsa periodontal, ausente, extracción indicada, entre otros) con colores y símbolos estándar. | M | Sí |
| RF-F-072 | Mostrar una leyenda visible con la simbología y los colores empleados. | M | Sí |
| RF-F-073 | Zonas táctiles suficientemente grandes para operar con el dedo o el lápiz sin errores (mínimo 44 × 44 puntos o ampliación al tocar el diente). | M | Sí |
| RF-F-074 | Deshacer y rehacer cambios en el odontograma. | M | Sí |
| RF-F-075 | Distinguir visualmente lo existente (encontrado en el examen) de lo planificado y de lo realizado. | S | Sí |
| RF-F-076 | Ver instantáneas de fechas anteriores y compararlas con el estado actual. | S | Sí |
| RF-F-077 | Tocar un diente abre un panel con su detalle: hallazgos, tratamientos y materiales. | M | Sí |
| RF-F-078 | Incluir el odontograma en el PDF de la historia clínica. | S | Sí |

### 3.7 Fotos, radiografías y archivos (`features/files`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-080 | Subir imágenes tomando la foto directamente con la cámara del iPad o eligiéndola desde la galería o archivos. | M | Sí |
| RF-F-081 | Subir varias imágenes a la vez, con barra de progreso y reintento si la conexión falla. | M | Sí |
| RF-F-082 | Etiquetar cada archivo por tipo (radiografía, antes, después, documento) y opcionalmente por diente o atención. | M | Sí |
| RF-F-083 | Galería por paciente en cuadrícula, ordenada por fecha y filtrable por tipo. | M | Sí |
| RF-F-084 | Visor a pantalla completa con zoom, desplazamiento y gestos táctiles (`react-zoom-pan-pinch`). | M | Sí |
| RF-F-085 | Vista comparativa “antes y después” lado a lado, con deslizador. | S | No |
| RF-F-086 | Ajustes básicos de la imagen en el visor (brillo y contraste) sin modificar el original. | C | No |
| RF-F-087 | Compartir imágenes seleccionadas con el paciente por WhatsApp o correo. | S | No |

### 3.8 Consentimientos y firma (`features/files`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-090 | Mostrar el consentimiento informado en pantalla completa para que el paciente lo lea y lo firme con el dedo o el Apple Pencil (`signature_pad`). | M | Sí |
| RF-F-091 | Área de firma amplia con opción de borrar y repetir, y confirmación previa a guardar. | M | Sí |
| RF-F-092 | Opción de subir una foto o escaneo de un consentimiento firmado en papel. | M | Sí |
| RF-F-093 | Mostrar el estado del consentimiento por paciente (pendiente, firmado, vencido). | S | Sí |
| RF-F-094 | Enviar copia automática del consentimiento firmado al paciente por WhatsApp/correo. | S | No |

### 3.9 Mensajes (bandeja de WhatsApp) (`features/messaging` - Fase 2)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-100 | Bandeja de conversaciones con vista de lista y conversación, similar a las aplicaciones de mensajería que ya conoce la doctora. | M | No |
| RF-F-101 | Indicar claramente quién está respondiendo en cada conversación: asistente de IA, doctora o auxiliar, y diferenciar visualmente los mensajes automáticos. | M | No |
| RF-F-102 | Resaltar y priorizar las conversaciones que el asistente derivó a una persona. | M | No |
| RF-F-103 | Botón para pausar el asistente y tomar el control, y otro para devolvérselo. | M | No |
| RF-F-104 | Respuestas rápidas y plantillas insertables con un toque. | S | No |
| RF-F-105 | Vincular una conversación con un paciente existente o crear uno nuevo desde la conversación. | M | No |
| RF-F-106 | Desde la conversación, ofrecer horarios disponibles y crear una cita. | S | No |
| RF-F-107 | Enviar una cotización desde la conversación. | S | No |
| RF-F-108 | Notificaciones push de mensajes nuevos que requieren atención, con control para silenciarlas por horario. | M | No |
| RF-F-109 | Editor de la base de conocimiento del asistente (preguntas frecuentes, precios, descripciones de tratamientos), con vista previa de cómo respondería. | M | No |
| RF-F-110 | Pantalla de seguimiento automático: reglas de recordatorio por tipo de procedimiento (por ejemplo, control a los 6 meses) activables y editables. | S | No |

### 3.10 Cotizaciones (`features/quotes`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-120 | Constructor de cotización: elegir procedimientos del catálogo, ajustar cantidad y precio, aplicar descuento y definir vigencia. | M | Sí |
| RF-F-121 | Vista previa de la cotización con la imagen del consultorio antes de enviarla. | M | Sí |
| RF-F-122 | Descargar en PDF y compartirlo desde la hoja de compartir del dispositivo (abrir WhatsApp o correo manualmente); el envío automático desde el sistema queda fuera del MVP. | M | Sí |
| RF-F-123 | Listado de cotizaciones del paciente con su estado. | M | Sí |
| RF-F-124 | Convertir una cotización aceptada en plan de tratamiento con un botón. | S | No |

### 3.11 Cobros (`features/payments`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-130 | Registrar un cobro al cerrar una atención, con valor sugerido según el catálogo y la posibilidad de modificarlo indicando el motivo. | M | Sí |
| RF-F-131 | Elegir el método de pago con un toque (llave, transferencia, efectivo, otro). | M | Sí |
| RF-F-132 | Mostrar el historial de cobros y el saldo pendiente por paciente. | S | Sí |

### 3.12 Reportes (`features/reports`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-140 | Tablero con ingresos del mes, comparación con el mes anterior, pacientes nuevos y procedimientos más solicitados. | M | Sí |
| RF-F-141 | Gráficos simples y legibles (`Recharts`), con selector de periodo (semana, mes, año, rango personalizado). | M | Sí |
| RF-F-142 | Reporte de asistencia y cancelaciones. | S | No |
| RF-F-143 | Lista de pacientes sin control reciente con acceso rápido para escribirles. | S | No |
| RF-F-144 | Exportar reportes a CSV o Excel. | C | No |
| RF-F-145 | Los reportes financieros solo deben ser visibles para la administradora. | M | Sí |

### 3.13 Configuración (`features/settings`)

| ID | Requisito | Prior. | MVP |
| --- | --- | --- | --- |
| RF-F-150 | Perfil del consultorio: nombre, logo, dirección, horarios, datos para cotizaciones y plantillas de consentimientos. | M | Sí |
| RF-F-151 | Gestión de usuarios y roles. | M | Sí |
| RF-F-152 | Catálogo de procedimientos y precios, y catálogo de materiales propios. | M | Sí |
| RF-F-153 | Conexión con Google Calendar, mostrando el estado de la conexión; la conexión con WhatsApp se habilita fuera del MVP. | M | Sí |
| RF-F-154 | Importación de pacientes existentes desde una hoja de cálculo. | S | No |
| RF-F-155 | Vista de existencias de los materiales propios, con cantidad disponible y alerta de bajo stock, que se descuenta al registrar el material usado en una atención. | C | Sí |

## 4. Requerimientos no funcionales

### 4.1 Usabilidad

| ID | Requisito |
| --- | --- |
| RNF-F-001 | Una atención completa (abrir la ficha, registrar procedimiento y material, y cobrar) debe poder hacerse en **menos de 2 minutos** y no más de 10 toques. |
| RNF-F-002 | Todas las acciones frecuentes deben quedar a un máximo de 3 toques desde la pantalla Hoy. |
| RNF-F-003 | La interfaz debe estar en español de Colombia, con lenguaje odontológico propio de la doctora y sin términos técnicos de sistemas. |
| RNF-F-004 | Los elementos táctiles deben medir al menos 44 × 44 puntos, con separación suficiente para evitar toques accidentales. |
| RNF-F-005 | Los mensajes de error deben explicar qué pasó y cómo resolverlo, sin códigos técnicos. |
| RNF-F-006 | Las acciones destructivas o irreversibles requieren confirmación; las demás deben poder deshacerse. |
| RNF-F-007 | Un nuevo usuario (la auxiliar) debe poder realizar las tareas básicas con menos de 30 minutos de explicación. |

### 4.2 Diseño visual y accesibilidad

| ID | Requisito |
| --- | --- |
| RNF-F-010 | Diseño limpio y profesional, con la identidad visual del consultorio (logo y paleta de colores) y componentes consistentes. |
| RNF-F-011 | Contraste y tamaño de texto conformes con WCAG 2.1 nivel AA; texto base de al menos 16 px. |
| RNF-F-012 | La información no debe depender únicamente del color (por ejemplo, en el odontograma se combinan color y símbolo). |
| RNF-F-013 | Soporte de modo claro y oscuro. |
| RNF-F-014 | Soporte de orientación horizontal y vertical en el iPad sin perder datos ni el lugar donde se estaba. |
| RNF-F-015 | Compatibilidad con el zoom de texto del sistema y con lectores de pantalla en los flujos principales. |

### 4.3 Rendimiento

| ID | Requisito |
| --- | --- |
| RNF-F-020 | Carga inicial en menos de 3 segundos con conexión 4G y en menos de 1 segundo en visitas posteriores (almacenamiento en caché). |
| RNF-F-021 | Las transiciones entre pantallas y la respuesta a toques deben sentirse inmediatas (menos de 100 ms para la respuesta visual). |
| RNF-F-022 | El odontograma debe responder a 60 cuadros por segundo en un iPad de los últimos 4 años. |
| RNF-F-023 | Las galerías deben usar miniaturas y carga progresiva; las imágenes de radiografía grandes se cargan solo al abrirlas. |
| RNF-F-024 | Las listas largas (pacientes, conversaciones) deben paginarse o virtualizarse. |

### 4.4 Conectividad y confiabilidad

| ID | Requisito |
| --- | --- |
| RNF-F-030 | Si se pierde la conexión, la aplicación debe mostrar un aviso claro y conservar localmente lo digitado para sincronizarlo al volver la conexión. |
| RNF-F-031 | Debe poder consultarse sin conexión la agenda del día y las fichas de los pacientes citados (modo de solo lectura). |
| RNF-F-032 | Mostrar siempre el estado de guardado (“Guardado”, “Guardando…”, “Pendiente de sincronizar”). |
| RNF-F-033 | Se debe manejar el conflicto cuando dos usuarios editan lo mismo, avisando y sin sobrescribir en silencio. |

### 4.5 Seguridad y privacidad en el cliente

| ID | Requisito |
| --- | --- |
| RNF-F-040 | No almacenar contraseñas ni datos clínicos sensibles sin cifrar en el dispositivo; limitar el contenido en caché a lo mínimo necesario. |
| RNF-F-041 | Bloqueo de pantalla de la aplicación tras inactividad, con desbloqueo mediante Face ID, Touch ID o PIN cuando el dispositivo lo permita (Fase 3). |
| RNF-F-042 | Ocultar o difuminar datos sensibles en la vista previa de la aplicación al cambiar de aplicación (MVP). |
| RNF-F-043 | Mostrar al usuario el aviso de privacidad y registrar el consentimiento de tratamiento de datos del paciente en la primera atención. |
| RNF-F-044 | Protección del frontend contra XSS y manejo seguro de los tokens de sesión. |
| RNF-F-045 | Las pantallas con información sensible no deben quedar guardadas en el historial o en la caché compartida del navegador. |

### 4.6 Mantenibilidad y calidad

| ID | Requisito |
| --- | --- |
| RNF-F-050 | Sistema de diseño con componentes reutilizables y documentados. |
| RNF-F-051 | Código tipado y con pruebas automatizadas de los componentes críticos (odontograma, formularios de atención, agenda, consentimientos, cobros). |
| RNF-F-052 | Pruebas de extremo a extremo de los flujos principales en iPad (Safari/WebKit) y computador. |
| RNF-F-053 | Las cadenas de texto deben estar centralizadas para facilitar cambios de redacción. |
| RNF-F-054 | Registro de errores del cliente con alertas al desarrollador, sin datos clínicos. |

## 5. Flujos principales

### 5.1 Llega un mensaje de un paciente nuevo (fuera del MVP)

1. Llega el mensaje por WhatsApp y el asistente responde la pregunta frecuente (por ejemplo, el precio de una limpieza).
2. Si el paciente quiere cita, el asistente propone horarios disponibles.
3. El paciente elige, deja sus datos básicos y se crea la cita y su ficha.
4. La cita aparece en la agenda y se sincroniza con Google Calendar.
5. Si el asistente no sabe responder, se marca la conversación como prioritaria y se notifica a la doctora.

### 5.2 Atención en consulta (en el iPad - MVP)

1. La doctora abre la cita desde Hoy y llega a la ficha del paciente.
2. Revisa alertas médicas y antecedentes; si es la primera vez, registra el consentimiento de datos (Ley 1581) y completa la historia clínica guiada (pudiendo usar el dictado de voz del iPad).
3. Marca los hallazgos en el odontograma con el lápiz.
4. Toma fotos y radiografías y las adjunta al diente o atención.
5. Registra el procedimiento y el material utilizado (marca y color, descontando existencias).
6. Si corresponde, el paciente lee y firma el consentimiento informado en pantalla (o se adjunta foto del papel).
7. Registra el cobro y cierra la atención; el seguimiento automático se incorpora fuera del MVP.

### 5.3 Seguimiento posterior (fuera del MVP)

1. El sistema detecta pacientes sin control en el plazo definido.
2. Propone el mensaje de seguimiento y la doctora lo aprueba o lo deja automático.
3. El paciente responde y, si desea, agenda desde la misma conversación.

## 6. Mapa de pantallas

Hoy · Agenda (día, semana, mes; detalle de cita) · Pacientes (lista; ficha con Resumen, Historia clínica, Odontograma, Atenciones, Archivos y Consentimientos, Mensajes [Fase 2], Cotizaciones, Cobros) · Mensajes (bandeja; conversación; base de conocimiento; fuera del MVP) · Cotizaciones (lista; constructor) · Reportes · Configuración (consultorio, usuarios, catálogos, stock de materiales, conexiones).

## 7. Supuestos, riesgos y pendientes

### Supuestos

- La doctora adquirirá un iPad (con Apple Pencil o uso con el dedo) como dispositivo principal de consulta.
- El WhatsApp del consultorio quedará en un número propio y accesible desde el sistema en la Fase 2.
- La identidad visual del consultorio (logo y colores) la proporciona la doctora o se define con ella.

### Riesgos

- **Limitaciones de las PWA en iPadOS** (notificaciones push, cámara, almacenamiento sin conexión). Mitigación: probar temprano en el dispositivo real y evaluar una envoltura nativa (Capacitor) si fuera necesario.
- **Complejidad del odontograma interactivo.** Mitigación: construirlo primero como prototipo con la doctora y validar la simbología que usa.
- **Adopción:** si registrar toma más tiempo que hoy, la doctora volverá a abandonarlo. Mitigación: medir tiempos reales con el criterio RNF-F-001.

### Pendientes por definir

- Simbología y colores exactos del odontograma que prefiere la doctora (norma estándar o personalizada).
- Modelo de iPad y si usará Apple Pencil.
- Identidad visual del consultorio y de la página web ya existente, para mantener coherencia.
- Textos de los consentimientos informados por procedimiento.
- Confirmar el alcance exacto de lectura de la auxiliar en la ficha clínica (notas privadas y finanzas quedan estrictamente ocultas).

## 8. Plan sugerido de entrega (Alineado con Tablas MoSCoW)

**MVP:** inicio de sesión y permisos por rol (`auth`), pantalla Hoy y agenda con arrastrar y soltar y sincronización con Google Calendar (`appointments`), pacientes con búsqueda instantánea, aviso de duplicados e historia clínica guiada con dictado nativo del iPad (`patients`, `attention`), odontograma interactivo SVG con materiales por diente y comparación de instantáneas por fecha (`odontogram`), cierre de atención con control de cambios y PDF de la historia clínica (`attention`), carga de fotos y radiografías con visor táctil y firma de consentimientos informados en pantalla o por foto (`files`), cotizaciones descargables en PDF para compartir desde el iPad (`quotes`), cobros básicos (`payments`), tablero de reportes (`reports`), configuración de consultorio, catálogos y control de existencias de materiales propios (`settings`), y soporte offline con Dexie + difuminado de privacidad al cambiar de app.

**Segunda fase:** mensajería de WhatsApp (bandeja, asistente con base de conocimiento, notificaciones, recordatorios y envío automático de cotizaciones y consentimientos), conversión de cotización a plan de tratamiento con un botón (RF-F-124), comparación antes y después de imágenes con deslizador (RF-F-085) y seguimiento automático.

**Tercera fase:** plantillas de texto rápidas (RF-F-057), bloqueo biométrico por inactividad (RNF-F-041), exportaciones a CSV/Excel y ajustes de brillo/contraste de imagen en el visor.