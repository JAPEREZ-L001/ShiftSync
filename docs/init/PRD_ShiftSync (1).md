# PRD — ShiftSync
### Automatización de horarios laborales desde Excel hacia Google Calendar

**Versión:** 1.0
**Fecha:** Julio 2026
**Autor:** Pérez (Product Owner) + Claude (PM/Architect asistente)
**Estado:** Borrador para revisión

---

## 0. Resumen ejecutivo

ShiftSync es una aplicación personal diseñada exclusivamente para las necesidades de Pérez, que toma el Excel de horarios que publica su empresa — un archivo compartido con ~75 empleados de múltiples departamentos — localiza automáticamente su fila, extrae sus turnos, y los sincroniza como eventos en Google Calendar, evitando duplicados y manteniéndose actualizado cuando el Excel cambia. Incluye visualización de calendario, dashboard de horas trabajadas y notificaciones configurables. **Esta herramienta no está diseñada para ser escalada, compartida con otros usuarios ni convertida en un servicio SaaS.**

**Decisiones de alcance confirmadas para la Fase 1 (MVP):**
| Decisión | Valor confirmado |
|---|---|
| Usuarios | Single-user (solo Pérez) |
| Presupuesto de infraestructura | $0/mes (free tiers estrictos) |
| Autenticación | Solo Google OAuth |
| Turnos que cruzan medianoche | 1 evento único (día N → día N+1) |
| Definición de "compañero de turno" | Mismo departamento (columna A) + mismo horario exacto |
| Identificación del usuario en el Excel | Detección automática por texto (con mitigación de riesgo) |
| "Vacaciones" vs "Libre" | Tipos de evento distintos |

---

## 1. Contexto y problema

Cada mes, la empresa publica un Excel compartido con el horario de todo el personal operativo (departamentos como Coordinación, MEGA N1/N2, CC N1/N2, Redes, Tercerías, Santa Ana, QA, etc.). Este archivo:
- No está pensado para un empleado individual — hay que buscar manualmente tu fila entre 75+ personas.
- No se sincroniza con ningún calendario personal.
- Cambia mes a mes (y a veces dentro del mismo mes, por reprogramaciones).
- No ofrece ninguna vista de "mis horas trabajadas", "mi próximo turno" ni estadísticas.

**Problema a resolver:** eliminar el trabajo manual de "buscar mi fila, leer mi horario, y crear eventos a mano en Google Calendar cada vez que publican o cambian el Excel", además de dar visibilidad sobre horas trabajadas, patrones de turno y compañeros de equipo.

---

## 2. Objetivos del producto

1. Cero fricción para pasar de "Excel publicado" a "mi calendario personal actualizado".
2. Cero eventos duplicados o desactualizados en Google Calendar.
3. Visibilidad clara de horas trabajadas, próximos turnos y descansos.
4. Simplicidad máxima: resolver el problema específico de Pérez sin sobre-ingeniería innecesaria.

**No-objetivos explícitos de la Fase 1:**
- No se gestionan permisos ni roles de administrador.
- No se editan turnos desde la app (es de solo lectura respecto al Excel — la fuente de verdad es siempre el Excel).
- No hay compartición de horarios entre usuarios todavía.

---

## 3. Análisis del archivo fuente (input real)

Se analizó un archivo real de ejemplo (`Horarios_Julio-Septiembre.xlsx`) para fundamentar los requisitos en la estructura real, no en suposiciones:

| Elemento | Hallazgo |
|---|---|
| Hojas | Una hoja por mes (ej. `"Julio"`). El nombre del archivo puede sugerir un rango ("Julio-Septiembre") pero cada hoja cubre un solo mes. |
| Fila 1 | Nombre del día de la semana (texto, en español) |
| Fila 2 | Fecha (serial de Excel / datetime) |
| Columna A | Departamento / Rol (ej. "MEGA N1", "CC N2", "Especialistas de Redes") |
| Columna B | Nombre completo del empleado — **formato inconsistente**: mayoría `"NOMBRE APELLIDO"`, algunos `"APELLIDO, NOMBRE"` |
| Columnas C en adelante | Una columna por día del mes con el valor del turno |
| Valores de celda | `"HH:MM-HH:MM"` (turno), `"Libre"` (descanso), `"Vacaciones"` (vacaciones) |
| Turnos nocturnos | Existen turnos que cruzan medianoche, ej. `21:00-06:00`, `18:00-06:00` — el empleado empieza un día y termina al siguiente |
| Filas de datos | 75 empleados, sin nombres duplicados, sin celdas combinadas |
| Color de celda | Presente pero aparentemente decorativo/agrupador visual, no confirmado como portador de significado adicional |

⚠️ **Riesgo identificado:** el formato inconsistente de nombres (con/sin coma) hace que una búsqueda ingenua por texto pueda fallar en encontrar al usuario o encontrar coincidencias parciales incorrectas (ej. nombres muy similares entre sí). Este riesgo se documenta en la sección 9 (Riesgos) con su estrategia de mitigación.

---

## 4. Personas y casos de uso

### 4.1 Persona principal
**Pérez — Empleado operativo / Ingeniero de Software.** Recibe el Excel mensual de la empresa, quiere ver su horario sin buscar manualmente, y quiere que su Google Calendar personal siempre refleje sus turnos reales sin trabajo manual.

### 4.2 Casos de uso

**CU-01: Primera carga del Excel**
1. El usuario sube el archivo Excel mensual.
2. El sistema detecta las hojas (meses) presentes.
3. El sistema localiza la fila del usuario por búsqueda de nombre.
4. Si hay ambigüedad (múltiples coincidencias posibles, o ninguna), el sistema solicita confirmación manual.
5. El sistema extrae todos los turnos, descansos y vacaciones del usuario.
6. El sistema muestra una vista previa antes de sincronizar.

**CU-02: Sincronización con Google Calendar**
1. El usuario conecta su cuenta de Google (OAuth) y elige/crea el calendario destino.
2. El sistema crea eventos de trabajo, descanso (si está habilitado) y vacaciones.
3. El sistema evita crear duplicados si el evento ya existe con el mismo horario.
4. El sistema actualiza eventos existentes si el turno cambió.
5. El sistema elimina/marca como cancelados eventos que ya no existen en la nueva versión del Excel.

**CU-03: Re-carga por cambio de Excel**
1. La empresa publica una versión actualizada del Excel (mismo mes, turnos modificados).
2. El usuario sube el nuevo archivo.
3. El sistema hace un diff contra los turnos previamente sincronizados.
4. El sistema aplica solo los cambios (crear/actualizar/eliminar) — no resincroniza todo desde cero.

**CU-04: Consulta de horario y estadísticas**
1. El usuario abre el dashboard.
2. Ve su próximo turno, próximo descanso, horas trabajadas en la semana/mes, y número de turnos.
3. Puede navegar a vista mensual/semanal/diaria del calendario.

**CU-05: Configuración de notificaciones**
1. El usuario configura recordatorios (1h/30min/15min antes).
2. El sistema programa las notificaciones asociadas a cada evento futuro.

---

## 5. User Stories

| ID | Historia | Prioridad |
|---|---|---|
| US-01 | Como usuario, quiero subir un Excel y que el sistema encuentre automáticamente mi fila, para no tener que buscarla manualmente entre 75 personas. | Must |
| US-02 | Como usuario, si mi nombre no se detecta con certeza, quiero poder confirmarlo/seleccionarlo manualmente, para evitar que se sincronice el horario de otra persona. | Must |
| US-03 | Como usuario, quiero conectar mi cuenta de Google y elegir si crear un calendario nuevo o usar uno existente. | Must |
| US-04 | Como usuario, quiero que mis turnos se creen como eventos en Google Calendar sin duplicarse si ya existían. | Must |
| US-05 | Como usuario, quiero que si vuelvo a subir un Excel con cambios, solo se actualicen los turnos que cambiaron. | Must |
| US-06 | Como usuario, quiero ver mi horario en vista mensual, semanal y diaria dentro de la app. | Must |
| US-07 | Como usuario, quiero un dashboard con mi próximo turno, próximo descanso y horas trabajadas. | Must |
| US-08 | Como usuario, quiero identificar qué compañeros de mi mismo departamento trabajan en mi mismo horario exacto. | Should |
| US-09 | Como usuario, quiero configurar recordatorios antes de cada turno. | Should |
| US-10 | Como usuario, quiero ver estadísticas de horas nocturnas, horas extra y días consecutivos trabajados. | Should |
| US-11 | Como usuario, quiero configurar mi nombre, zona horaria, formato de hora e idioma. | Could |
| US-12 | Como usuario, quiero recibir notificaciones por Telegram/WhatsApp además de push. | Could (post-MVP) |
| US-13 | Como usuario, en el futuro quiero poder importar el Excel directamente desde Google Drive/OneDrive/SharePoint. | Won't (esta fase) |

---

## 6. Requisitos funcionales

**RF-01** El sistema debe permitir subir un archivo `.xlsx`.
**RF-02** El sistema debe parsear la estructura de fila-de-día/columna-de-fecha descrita en la sección 3, soportando múltiples hojas (una por mes).
**RF-03** El sistema debe localizar la fila del usuario mediante búsqueda normalizada de texto (mayúsculas/minúsculas, tildes, orden nombre-apellido, con/sin coma).
**RF-04** Si la búsqueda produce 0 o más de 1 coincidencia con confianza aceptable, el sistema debe presentar las filas candidatas para selección manual.
**RF-05** El sistema debe clasificar cada celda del usuario en uno de: `TRABAJO` (rango horario), `DESCANSO` (Libre), `VACACIONES`.
**RF-06** El sistema debe calcular correctamente turnos que cruzan medianoche como un único evento continuo.
**RF-07** El sistema debe permitir conectar una cuenta de Google vía OAuth 2.0.
**RF-08** El sistema debe permitir elegir entre crear un calendario dedicado o usar uno existente.
**RF-09** El sistema debe crear eventos de trabajo con: título, hora inicio/fin, descripción (departamento, compañeros del mismo turno).
**RF-10** El sistema debe permitir habilitar/deshabilitar la creación de eventos de descanso.
**RF-11** El sistema debe detectar y evitar duplicados comparando fecha + hora inicio + hora fin antes de crear un evento nuevo.
**RF-12** Al re-sincronizar, el sistema debe hacer diff contra el estado anteriormente sincronizado (almacenado en base de datos) y aplicar solo cambios (crear/actualizar/eliminar).
**RF-13** El sistema debe identificar compañeros del mismo departamento con el mismo horario exacto en el mismo día.
**RF-14** El sistema debe mostrar el calendario en vista mensual, semanal y diaria.
**RF-15** El sistema debe mostrar un dashboard con: próximo turno, próximo descanso, horas trabajadas en la semana actual, horas del mes, número de turnos del mes.
**RF-16** El sistema debe permitir configurar recordatorios (1h/30min/15min antes) por evento o globalmente.
**RF-17** El sistema debe mostrar estadísticas de: horas trabajadas, horas nocturnas, horas extra (sobre un umbral configurable), días consecutivos trabajados, días libres.
**RF-18** El sistema debe permitir configurar: nombre del empleado, color de eventos, zona horaria, formato de hora (12h/24h), idioma.

---

## 7. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | **Costo:** la infraestructura completa debe operar dentro de tiers gratuitos mientras el uso sea single-user. |
| RNF-02 | **Seguridad:** los tokens OAuth de Google deben almacenarse cifrados; nunca se exponen al frontend. |
| RNF-03 | **Rendimiento:** el parseo de un Excel de ~75 filas x 31 columnas debe completarse en menos de 3 segundos. |
| RNF-04 | **Disponibilidad:** no se requiere SLA formal en Fase 1 (uso personal), pero el diseño no debe introducir puntos de fallo que impidan re-ejecutar la sincronización manualmente. |
| RNF-05 | **Mantenibilidad:** separación clara entre lógica de parsing (dominio), lógica de sincronización (integración) y presentación (UI), para facilitar evolución a multi-tenant. |
| RNF-06 | **Escalabilidad de datos:** el modelo de datos debe incluir `user_id`/`organization_id` desde el día 1, aunque solo exista un usuario. |
| RNF-07 | **UX:** la carga de un Excel hasta ver la vista previa de turnos detectados no debe tomar más de 3 pasos/clics. |
| RNF-08 | **Idempotencia:** ejecutar la sincronización múltiples veces con el mismo Excel no debe generar cambios adicionales. |
| RNF-09 | **Internacionalización:** aunque el idioma inicial es español, los textos de UI deben estar externalizados (no hardcodeados) para permitir traducción futura. |
| RNF-10 | **Privacidad:** el Excel de la empresa contiene datos de 75 personas — el sistema solo debe persistir los datos del usuario autenticado, no de terceros (excepto el nombre de compañeros de turno, dato mínimo necesario para RF-13). |

---

## 8. Modelo de datos inicial

Diseñado para single-user hoy, pero con claves de aislamiento (`user_id`) para no requerir migración destructiva al evolucionar a multi-tenant.

```
User
  id (uuid, pk)
  google_id
  email
  display_name          // usado para el matching contra el Excel
  name_aliases[]         // variantes de nombre para mejorar el matching (ej. "APELLIDO, NOMBRE")
  timezone
  time_format            // 12h | 24h
  language
  default_event_color
  created_at

Schedule                 // representa "un Excel subido" = una fuente de verdad por mes
  id (uuid, pk)
  user_id (fk)
  source_filename
  month
  year
  uploaded_at
  raw_file_hash           // para detectar si el Excel subido es idéntico al anterior

ShiftEntry                // una celda ya interpretada, perteneciente al usuario
  id (uuid, pk)
  schedule_id (fk)
  user_id (fk)
  date
  type                    // WORK | REST | VACATION
  start_time (nullable)
  end_time (nullable)
  crosses_midnight (bool)
  department
  google_event_id (nullable)   // vínculo con el evento sincronizado
  sync_status              // PENDING | SYNCED | UPDATED | DELETED

Coworker                  // dato mínimo, no una cuenta de usuario
  id (uuid, pk)
  shift_entry_id (fk)
  full_name
  department

NotificationPreference
  id (uuid, pk)
  user_id (fk)
  minutes_before          // 60 | 30 | 15
  channel                 // PUSH | TELEGRAM | WHATSAPP (post-MVP)
  enabled (bool)

CalendarConnection
  id (uuid, pk)
  user_id (fk)
  google_calendar_id
  access_token (encrypted)
  refresh_token (encrypted)
  is_dedicated_calendar (bool)
```

---

## 9. Riesgos

| Riesgo | Impacto | Probabilidad | Mitigación |
|---|---|---|---|
| **Matching de nombre falla** por formatos inconsistentes (con/sin coma, tildes, orden) | Alto — se sincroniza el horario equivocado | Media | Normalización de texto + fuzzy matching (ej. Levenshtein) + pantalla de confirmación obligatoria en la primera carga; nombre confirmado se guarda como alias para futuras cargas |
| **Cambio de estructura del Excel** (la empresa reordena columnas/hojas sin aviso) | Alto — rompe el parser | Media | Validación defensiva del parser (detectar fila de fechas, no asumir posición fija) + mensaje de error claro en vez de fallo silencioso |
| **Rate limits de Google Calendar API** | Medio — sincronización parcial | Baja (single-user, volumen bajo) | Batch requests + backoff exponencial |
| **Costos de infraestructura superan free tier** al crecer uso | Medio | Baja en Fase 1 | Monitoreo de consumo; arquitectura serverless que escala a $0 en reposo |
| **Turnos duplicados por reintentos de sincronización** | Medio — calendario sucio | Media si no se implementa bien RF-11/RF-12 | Idempotencia basada en `google_event_id` almacenado, no en búsqueda por texto en Calendar |
| **Datos de terceros (75 empleados) en el Excel** | Medio — privacidad | Baja | Solo se persiste el nombre y departamento de compañeros de turno (dato mínimo, RNF-10); el resto del Excel no se almacena más allá del procesamiento |
| **Excel con una sola hoja por mes** en vez de multi-mes en un archivo | Bajo | — | Confirmar con el usuario si esto es el patrón real (ver preguntas abiertas) |

---

## 10. MVP (Fase 1)

**Incluye:** RF-01 a RF-12, RF-14, RF-15 (parcial: próximo turno/descanso, horas semana/mes), RF-18 (parcial: nombre, zona horaria).
**Excluye del MVP:** compañeros de turno (RF-13), estadísticas avanzadas (RF-17), notificaciones Telegram/WhatsApp, multi-fuente de importación, todo lo multi-tenant.

**Criterio de éxito del MVP:** Pérez puede subir el Excel mensual, confirmar su fila una vez, ver una vista previa correcta de sus turnos (incluyendo los que cruzan medianoche), sincronizar con Google Calendar sin duplicados, y volver a subir un Excel modificado sin que se dupliquen ni se pierdan eventos.

---

## 11. Roadmap por fases

**Fase 1 — MVP personal (single-user)**
Parsing de Excel + matching de nombre + sincronización básica con Google Calendar + vista de calendario + dashboard mínimo.

**Fase 2 — Enriquecimiento personal**
Compañeros de turno (RF-13), estadísticas completas (RF-17), notificaciones push, configuración completa (RF-18).

**Fase 3 — Multi-fuente**
Importación desde Google Drive/OneDrive/SharePoint; notificaciones Telegram/WhatsApp.

**Fase 4 — Multi-usuario (pre-SaaS)**
Cuentas múltiples reales (ya no solo `user_id` técnico sino registro/login de otros usuarios), cada quien sube su propio Excel o accede a uno compartido.

**Fase 5 — SaaS / Organizaciones**
Organizaciones, equipos, roles de administrador, compartición de horarios entre miembros de un equipo, permisos.

---

## 12. Arquitectura recomendada

Dado el presupuesto $0 y el alcance single-user, se recomienda **minimizar piezas de infraestructura** para reducir superficie de mantenimiento y costo, sin sacrificar la separación de capas necesaria para escalar después.

**Opción A (recomendada): Full-stack unificado en Vercel**
- Frontend + API routes/serverless functions en un mismo proyecto (Next.js) desplegado en Vercel (free tier).
- Base de datos: Supabase Postgres (free tier) — incluye Auth administrado si se decide no manejar OAuth manualmente.
- Ventaja: una sola pieza de despliegue, cero servidores que mantener, encaja perfectamente en free tiers.
- Trade-off: menos "desacoplado" que tu patrón habitual de frontend Vite + backend Fastify separado.

**Opción B: Frontend y backend desacoplados (consistente con tu proyecto Health Tracker)**
- Frontend: React 19 + Vite + TypeScript + Tailwind (tu stack habitual).
- Backend: Fastify + Prisma, desplegado en un free tier con "cold start" aceptable (ej. Render free o Fly.io).
- Base de datos: Supabase Postgres o Neon (free tier).
- Ventaja: consistencia con tu forma de trabajar actual, más fácil de razonar cada capa por separado.
- Trade-off: una pieza más de infraestructura que mantener; los free tiers de hosting de backend dedicado son más inestables/limitados que el de Vercel.

**Mi recomendación:** Opción A (Next.js full-stack) para este proyecto, dado el criterio explícito de $0 y single-user — es la ruta de menor fricción operativa y la más sencilla de mantener para una herramienta personal. El modelo de datos y la lógica de dominio (parsing, sync) se diseñan de forma clara y modular para facilitar el mantenimiento futuro, no para prepararse para una evolución que no está planeada.

**Capas internas (diseño limpio y mantenible):**
```
[UI] → [Application layer: casos de uso] → [Domain: parser Excel, motor de diff, reglas de negocio]
                                          → [Infra: Google Calendar client, DB repository]
```
La lógica de parsing y de diff/sincronización se organiza en funciones puras y testeables, separadas de los detalles del framework. Esto asegura que el código sea claro, fácil de mantener y de debuggear en el futuro, aunque no se planee una evolución a multi-usuario.

---

## 13. Tecnologías recomendadas y justificación

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React 19 + TypeScript | Consistente con tu stack actual, tipado fuerte reduce errores en lógica de fechas/horarios |
| Estilos | Tailwind CSS v4 | Ya lo usas, velocidad de desarrollo |
| Gráficas | Recharts | Ya lo usas en Health Tracker, cubre las estadísticas requeridas |
| Backend/API | Next.js API routes (Opción A) o Fastify (Opción B) | Ver sección 12 |
| ORM | Prisma | Migraciones tipadas, ya usado en tu otro proyecto |
| Base de datos | PostgreSQL (Supabase free tier) | Relacional, encaja con el modelo de datos; free tier generoso y sin sleep agresivo |
| Parsing de Excel | `xlsx` (SheetJS) en backend | Estándar, soporta lectura de múltiples hojas y celdas con fechas |
| Autenticación | Google OAuth 2.0 (via NextAuth/Auth.js o librería oficial de Google) | Decisión ya confirmada; reutiliza el mismo consentimiento que da acceso a Calendar API |
| Integración Calendar | Google Calendar API v3 | Requisito explícito del producto |
| Notificaciones (Fase 2+) | Web Push API (nativo) primero; Telegram Bot API es la integración más simple de las opcionales | Push es gratis y no requiere aprobación de terceros; WhatsApp Business API tiene costos y fricción de aprobación — se recomienda posponerlo |
| Hosting frontend/API | Vercel (free tier) | Cero costo en reposo, despliegue continuo simple |
| Testing | Vitest + Testing Library (frontend), Vitest/Jest (lógica de dominio) | Consistente con ecosistema Vite/TS |

---

## 14. APIs necesarias

**API interna (backend propio):**
- `POST /schedules/upload` — sube Excel, retorna preview de turnos detectados + candidatos de matching si aplica.
- `POST /schedules/:id/confirm-identity` — confirma la fila/nombre correspondiente al usuario.
- `POST /schedules/:id/sync` — dispara sincronización con Google Calendar (diff + aplicar cambios).
- `GET /shifts?from&to` — turnos del usuario en un rango, para las vistas de calendario.
- `GET /dashboard/summary` — próximo turno, próximo descanso, horas de la semana/mes.
- `GET /stats?period` — estadísticas (horas nocturnas, extra, días consecutivos).
- `GET|PUT /settings` — configuración del usuario.
- `GET|PUT /notifications/preferences`.

**APIs externas consumidas:**
- Google OAuth 2.0 / Identity — autenticación.
- Google Calendar API v3 — `events.insert`, `events.update`, `events.delete`, `calendarList.insert`, `calendarList.list`.
- (Fase 3) Google Drive API, Microsoft Graph API (OneDrive/SharePoint/Outlook).
- (Fase 3) Telegram Bot API.

---

## 15. Integraciones externas

| Integración | Fase | Notas |
|---|---|---|
| Google Calendar | MVP | Núcleo del producto |
| Google OAuth | MVP | Autenticación única |
| Web Push | Fase 2 | Nativa del navegador, sin costo |
| Google Drive (import) | Fase 3 | Requiere scope adicional de Drive readonly |
| OneDrive/SharePoint (import) | Fase 3 | Requiere registro de app en Microsoft Entra/Azure AD |
| Outlook (import) | Fase 3 | Microsoft Graph API |
| Telegram | Fase 3 | Bot API, gratis, fricción baja |
| WhatsApp Business API | Evaluar más adelante | Costo y proceso de aprobación — no recomendado mientras el uso sea personal |

---

## 16. Estrategia de autenticación

- **Autenticación (MVP y única):** exclusivamente Google OAuth 2.0, dado que de todas formas se necesita el consentimiento de Google para acceder a Calendar API. Se solicitan los scopes mínimos necesarios (`calendar.events`, y `calendar` solo si se requiere crear calendarios nuevos).
- Los tokens (access + refresh) se almacenan cifrados en la base de datos, nunca en el cliente.
- El `refresh_token` permite sincronizar sin requerir que el usuario vuelva a iniciar sesión cada vez.
- Por ser una herramienta personal, no está previsto agregar otros métodos de autenticación ni soportar múltiples usuarios.

---

## 17. Estrategia de despliegue

- **CI/CD:** despliegue automático en cada push a `main` vía integración nativa de Vercel con GitHub.
- **Entornos:** `production` (Vercel) + entorno local para desarrollo. Dado el alcance single-user, no se justifica un ambiente de staging separado en el MVP.
- **Migraciones de base de datos:** gestionadas con Prisma Migrate, ejecutadas como parte del pipeline de despliegue.
- **Variables sensibles:** client ID/secret de Google OAuth y claves de cifrado gestionadas como variables de entorno en Vercel, nunca committeadas.
- **Rollback:** Vercel mantiene despliegues inmutables por commit, permitiendo rollback instantáneo a una versión previa.

---

## 18. Estrategia de testing

| Nivel | Enfoque |
|---|---|
| Unitario | Lógica de dominio pura: parser de Excel, normalización de nombres, motor de diff de turnos, cálculo de horas/estadísticas. Alta cobertura aquí porque es donde vive el riesgo real del producto. |
| Integración | Llamadas a Google Calendar API mockeadas; pruebas del flujo completo "Excel → ShiftEntry → evento de calendario". |
| Contrato/fixtures | Se usa el Excel real analizado (anonimizado) como fixture de test para el parser, incluyendo casos límite: turno nocturno, "Vacaciones", nombre con coma. |
| E2E (opcional en MVP) | Flujo crítico: subir Excel → confirmar identidad → sincronizar → verificar en UI que los turnos aparecen correctamente. |
| Manual | Verificación real contra tu cuenta de Google Calendar antes de cada release, dado que es un solo usuario y el riesgo de un bug en producción es asumible controladamente. |

---

## 19. Estimación de complejidad

| Módulo | Complejidad | Motivo |
|---|---|---|
| Parser de Excel (estructura + normalización de nombres) | Alta | Formatos inconsistentes, turnos nocturnos, múltiples hojas |
| Motor de diff/sincronización idempotente | Alta | Es el corazón del RNF-08; errores aquí generan duplicados o pérdida de eventos |
| Integración Google Calendar | Media | API bien documentada, pero requiere manejo cuidadoso de rate limits y tokens |
| Autenticación Google OAuth | Baja-Media | Flujos estándar, librerías maduras |
| UI de calendario (mensual/semanal/diario) | Media | Puede apoyarse en librerías existentes (ej. FullCalendar o construcción propia sobre Recharts/CSS Grid) |
| Dashboard y estadísticas | Baja-Media | Cálculos directos sobre datos ya normalizados |
| Notificaciones push | Media | Requiere Service Worker y gestión de suscripciones |

---

## 20. Preguntas abiertas para cerrar antes de pasar a diseño técnico detallado

1. ¿El archivo real que subirás cada mes contendrá **una sola hoja** (el mes actual) o eventualmente **varias hojas** (varios meses en un mismo archivo)? Esto afecta si RF-02 necesita seleccionar hoja o procesar todas.
2. ¿Vas a re-subir el Excel manualmente cada vez que cambie, o te interesa ya en el MVP automatizar la detección de "hay una versión nueva" (ej. vía un enlace fijo o correo)? (Recuerda que esto es Fase 3 en el roadmap, solo confirmo que no lo necesitas antes.)
3. Para el umbral de "horas extra" (RF-17), ¿cuál es tu jornada estándar diaria/semanal de referencia (ej. 8h/día, 44h/semana)?

Con tus respuestas a esas tres preguntas, seguimos con el diseño técnico detallado (Design Doc separado, como prefieres) antes de tocar código.
