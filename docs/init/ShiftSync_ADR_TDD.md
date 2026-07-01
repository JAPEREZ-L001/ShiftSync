# ShiftSync — Architecture Decision Records (ADR) + Technical Design Document (TDD)

**Versión:** 1.0  
**Fecha:** Julio 2026  
**Autores:** Pérez (Product Owner) + Claude (Architect asistente)  
**Estado:** Draft — pendiente revisión final  
**PRD de referencia:** `PRD_ShiftSync.md` v1.0  
**Alcance:** Herramienta personal single-user. No se diseña para SaaS ni multi-tenant.

---

## Índice

- [Parte I — Architecture Decision Records](#parte-i--architecture-decision-records)
  - [ADR-001: Framework — Next.js Full-Stack](#adr-001-framework--nextjs-full-stack)
  - [ADR-002: Base de datos — Supabase PostgreSQL via Prisma](#adr-002-base-de-datos--supabase-postgresql-via-prisma)
  - [ADR-003: Parsing de Excel — SheetJS en servidor](#adr-003-parsing-de-excel--sheetjs-en-servidor)
  - [ADR-004: Autenticación — Google OAuth 2.0 via Auth.js](#adr-004-autenticación--google-oauth-20-via-authjs)
  - [ADR-005: Matching de nombres — Normalización + Fuzzy scoring](#adr-005-matching-de-nombres--normalización--fuzzy-scoring)
  - [ADR-006: Idempotencia de sincronización — Anchor por `google_event_id`](#adr-006-idempotencia-de-sincronización--anchor-por-google_event_id)
  - [ADR-007: Almacenamiento de tokens OAuth — Cifrado en base de datos](#adr-007-almacenamiento-de-tokens-oauth--cifrado-en-base-de-datos)
  - [ADR-008: Notificaciones — Web Push API primero](#adr-008-notificaciones--web-push-api-primero)
- [Parte II — Technical Design Document](#parte-ii--technical-design-document)
  - [1. Visión general del sistema](#1-visión-general-del-sistema)
  - [2. Arquitectura de componentes](#2-arquitectura-de-componentes)
  - [3. Modelo de datos — Prisma Schema](#3-modelo-de-datos--prisma-schema)
  - [4. Diseño de API](#4-diseño-de-api)
  - [5. Algoritmos core](#5-algoritmos-core)
  - [6. Manejo de errores](#6-manejo-de-errores)
  - [7. Seguridad](#7-seguridad)
  - [8. Estrategia de testing](#8-estrategia-de-testing)
  - [9. Arquitectura de despliegue](#9-arquitectura-de-despliegue)
  - [10. Plan de implementación](#10-plan-de-implementación)

---

## Parte I — Architecture Decision Records

Cada ADR sigue la estructura: **Contexto → Opciones evaluadas → Decisión → Consecuencias**.

---

### ADR-001: Framework — Next.js Full-Stack

**Estado:** Aceptado  
**Fecha:** Julio 2026

#### Contexto

La herramienta requiere un frontend interactivo (upload de Excel, vista de calendario, dashboard), lógica de backend (parsing, sync con Google Calendar API) y exposición de una API interna. El presupuesto es estrictamente $0/mes y el mantenimiento lo realizará una sola persona.

#### Opciones evaluadas

| Opción | Descripción | Ventajas | Desventajas |
|--------|-------------|----------|-------------|
| **A — Next.js full-stack** | Frontend + API Routes serverless en un solo proyecto desplegado en Vercel | Un solo repo, un solo despliegue, Vercel free tier estable, cold starts aceptables para uso personal | Menos desacoplado que separar frontend/backend explícitamente |
| **B — Vite + Fastify separados** | Frontend React/Vite + backend Fastify independiente (ej. Render free) | Consistente con el stack de Health Tracker; separación explícita | Dos repositorios/despliegues, free tiers de backend con cold start agresivo o sleep (Render free = 15 min sleep) |

#### Decisión

**Opción A: Next.js full-stack en Vercel.**

Para una herramienta personal donde el desarrollador y el único usuario son la misma persona, maximizar la simplicidad operativa tiene más valor que la pureza arquitectónica. Vercel integra CI/CD nativo con GitHub, rollback instantáneo por commit y el free tier no tiene sleep agresivo. El "costo" de tener el API co-ubicado con el frontend es irrelevante en este contexto.

La lógica de dominio (parser, diff engine) se implementará en módulos TypeScript puros independientes del framework, lo que preserva la mantenibilidad sin añadir infraestructura innecesaria.

#### Consecuencias

- ✅ Un solo `npm run dev`, un solo `git push` para desplegar.
- ✅ Variables de entorno gestionadas en un solo lugar (Vercel dashboard).
- ✅ Cero costo en reposo (serverless functions).
- ⚠️ Las API routes de Next.js tienen un límite de tamaño de payload por defecto (4.5 MB) — se debe configurar `bodySizeLimit` para aceptar archivos Excel potencialmente grandes.
- ⚠️ Cold start de funciones serverless ~200–400 ms en Vercel free; aceptable para uso personal pero notable en la primera request después de inactividad.

---

### ADR-002: Base de datos — Supabase PostgreSQL via Prisma

**Estado:** Aceptado  
**Fecha:** Julio 2026

#### Contexto

El sistema necesita persistir: usuario, schedules (Excels subidos), shift entries, coworkers, preferencias de notificación y conexión a Google Calendar. El modelo es relacional por naturaleza. El presupuesto es $0.

#### Opciones evaluadas

| Opción | Free tier | Limitaciones | Notas |
|--------|-----------|--------------|-------|
| **Supabase PostgreSQL** | 500 MB, sin sleep | Proyecto pausado si inactivo >7 días (plan free nuevo) | Pausa es recuperable; para uso personal es aceptable |
| **Neon PostgreSQL** | 512 MB, branching, sin sleep forzado | Menor madurez del ecosistema | Buena alternativa si Supabase pausa el proyecto |
| **PlanetScale (MySQL)** | Free tier eliminado en 2024 | — | Descartado |
| **SQLite local** | Sin costo, sin latencia de red | No persistiría entre deploys serverless; requeriría almacenamiento adicional | Descartado para producción |

#### Decisión

**Supabase PostgreSQL** como base de datos, accedida exclusivamente a través de **Prisma ORM**.

Supabase ofrece el free tier más generoso y estable en este segmento. Prisma añade tipado fuerte end-to-end, migraciones versionadas y un cliente que se integra bien con Next.js serverless (con connection pooling via Prisma Accelerate o `pgbouncer` de Supabase).

Se usará Prisma en modo `DATABASE_URL` directamente, sin depender del cliente de Supabase Auth ni de su SDK (para mantener la capa de datos desacoplada del proveedor).

#### Consecuencias

- ✅ Migraciones declarativas y versionadas con `prisma migrate`.
- ✅ Tipos TypeScript autogenerados desde el schema → sin casteos manuales.
- ✅ Panel de administración de Supabase para inspección directa de datos en desarrollo.
- ⚠️ En Vercel serverless, cada invocación puede abrir una nueva conexión a PostgreSQL. Se debe usar `prisma.$connect()` con el patrón singleton o habilitar connection pooling en Supabase (`?pgbouncer=true&connection_limit=1` en la DATABASE_URL).
- ⚠️ Si el proyecto Supabase se pausa por inactividad (>7 días en free tier), requiere activación manual desde el panel.

---

### ADR-003: Parsing de Excel — SheetJS en servidor

**Estado:** Aceptado  
**Fecha:** Julio 2026

#### Contexto

El archivo fuente es un `.xlsx` de estructura fija pero con datos inconsistentes (nombres con/sin coma, fechas como seriales de Excel, múltiples hojas). El parsing debe ocurrir en un entorno seguro dado que el archivo contiene datos de 75 empleados.

#### Opciones evaluadas

| Opción | Pro | Contra |
|--------|-----|--------|
| **SheetJS (xlsx) — backend** | Librería estándar de facto, soporta seriales de fecha, múltiples hojas, lectura de celdas individuales | Ninguno relevante para este caso |
| **ExcelJS — backend** | API más ergonómica, soporte de estilos | Mayor tamaño de bundle, menos documentación de edge cases de seriales |
| **Parse en cliente (browser)** | Sin round-trip al servidor | El archivo con datos de 75 personas nunca debe exponerse al cliente más allá de lo necesario; el procesamiento debe ocurrir en backend |

#### Decisión

**SheetJS (`xlsx`) ejecutado en una API Route de Next.js (backend).**

El archivo se recibe como `multipart/form-data`, se parsea en memoria en el servidor, se extraen **únicamente** los datos del usuario autenticado, y el buffer original se descarta. Ningún dato del Excel crudo se almacena en base de datos (solo los `ShiftEntry` ya procesados del usuario).

#### Consecuencias

- ✅ Datos de los 75 empleados nunca persisten; solo se leen en memoria durante el procesamiento.
- ✅ SheetJS maneja correctamente los seriales de fecha de Excel (`dateNF`, `cellDates: true`).
- ⚠️ El payload de la API Route debe configurarse para archivos de hasta ~5 MB: `export const config = { api: { bodyParser: { sizeLimit: '5mb' } } }`.
- ⚠️ SheetJS lee fórmulas calculadas, no recalcula — si el Excel usa fórmulas en las celdas de turno, hay que leer el valor calculado (`w` o `v`), no la fórmula (`f`).

---

### ADR-004: Autenticación — Google OAuth 2.0 via Auth.js

**Estado:** Aceptado  
**Fecha:** Julio 2026

#### Contexto

La autenticación con Google es obligatoria para acceder a la Google Calendar API. El sistema es single-user, por lo que el flujo de autenticación no necesita ser complejo.

#### Opciones evaluadas

| Opción | Pro | Contra |
|--------|-----|--------|
| **Auth.js (NextAuth v5)** | Integración nativa con Next.js, maneja el flujo OAuth + callback + session automáticamente, soporta `account.access_token` y `refresh_token` en callbacks | Algo de magia negra en la configuración de callbacks para guardar tokens |
| **Implementación manual (googleapis library)** | Control total del flujo | Reinventar el flujo OAuth, más código de mantenimiento |
| **Supabase Auth** | Integrado con la base de datos | Acopla el sistema de auth al proveedor de DB; dificulta migraciones futuras |

#### Decisión

**Auth.js (NextAuth v5) con el proveedor de Google**, configurando el callback `jwt` para capturar y persistir el `access_token` y `refresh_token` en la tabla `CalendarConnection` de la base de datos (cifrados).

Auth.js maneja la sesión del navegador, pero los tokens de Google Calendar se persisten en la propia base de datos para poder usarlos en sincronizaciones server-side sin que el usuario esté presente.

**Scopes solicitados:**
- `openid email profile` — identidad del usuario
- `https://www.googleapis.com/auth/calendar.events` — crear/editar/eliminar eventos
- `https://www.googleapis.com/auth/calendar` — necesario solo para crear calendarios nuevos; se solicita condicionalmente

#### Consecuencias

- ✅ Flujo OAuth completo con manejo de CSRF, estado y callback implementado por Auth.js.
- ✅ El `refresh_token` solo se devuelve en el primer consentimiento; si se pierde, el usuario debe revocar el acceso y reconectar. Se documenta este comportamiento.
- ⚠️ `access_token` expira en 1 hora — cada llamada a Google Calendar API debe verificar la expiración y refrescar usando el `refresh_token` antes de ejecutar la petición.
- ⚠️ Auth.js v5 (app router) difiere significativamente de v4 en configuración — usar exclusivamente la documentación de la rama `next` de Auth.js.

---

### ADR-005: Matching de nombres — Normalización + Fuzzy scoring

**Estado:** Aceptado  
**Fecha:** Julio 2026

#### Contexto

La columna B del Excel presenta nombres en formatos inconsistentes: `"NOMBRE APELLIDO"`, `"APELLIDO, NOMBRE"`, con o sin tildes, en mayúsculas. El usuario configura su nombre en la app una vez. El sistema debe encontrar su fila de forma confiable sin intervención manual en cargas posteriores.

#### Opciones evaluadas

| Estrategia | Pro | Contra |
|-----------|-----|--------|
| **Búsqueda exacta (normalizada)** | Simple, sin dependencias | Falla ante mínimas variaciones (tilde, orden) |
| **Normalización + Levenshtein** | Tolera errores tipográficos y variaciones menores | Puede generar falsos positivos con nombres similares |
| **Normalización + Token Set Ratio** | Mejor para reordenamiento (APELLIDO, NOMBRE vs NOMBRE APELLIDO) | Requiere librería externa (`fastest-levenshtein` o `fuse.js`) |
| **Normalización + Token Set + Confirmación obligatoria** | Combina fuzzy matching con supervisión humana; el usuario confirma una vez y el resultado se guarda como alias | Mayor fricción en primera carga; complejidad del flujo |

#### Decisión

**Pipeline en 3 fases:**

1. **Normalización**: Convertir a mayúsculas, eliminar tildes (NFD + regex), trim, colapsar espacios múltiples.
2. **Canonicalización**: Si el candidato tiene coma (`"APELLIDO, NOMBRE"`), invertir tokens → `"NOMBRE APELLIDO"` para normalizar el formato.
3. **Scoring en dos rondas**:
   - Ronda 1: coincidencia exacta entre el nombre normalizado del usuario y el candidato canonicalizado → si hay exactamente 1 match, se usa directamente.
   - Ronda 2 (si ronda 1 falla): Levenshtein + Token Set Ratio via `fuse.js`. Se retornan todos los candidatos con score > 0.80 para selección manual.
4. **Confirmación y alias**: Independientemente del resultado, en la **primera carga** siempre se muestra una pantalla de confirmación. La fila confirmada se guarda como `name_aliases[]` en el perfil del usuario para que cargas futuras hagan match exacto sin intervención.

#### Consecuencias

- ✅ Cero dependencia de la consistencia del formato del Excel tras la primera carga.
- ✅ La pantalla de confirmación elimina el riesgo de sincronizar el horario de otra persona.
- ✅ `fuse.js` pesa ~26 KB minificado; aceptable como dependencia de servidor.
- ⚠️ Si la empresa cambia el nombre del empleado en el Excel (ej. corrección de apellido), el alias guardado fallará y pedirá confirmación manual nuevamente — comportamiento correcto.

---

### ADR-006: Idempotencia de sincronización — Anchor por `google_event_id`

**Estado:** Aceptado  
**Fecha:** Julio 2026

#### Contexto

El usuario puede subir el mismo Excel múltiples veces (por accidente o para verificar). La sincronización debe producir el mismo estado en Google Calendar sin crear duplicados ni eliminar eventos correctos.

#### Opciones evaluadas

| Estrategia | Pro | Contra |
|-----------|-----|--------|
| **Buscar eventos existentes en Calendar API antes de crear** | No requiere estado local | Lento (N llamadas a API), sujeto a rate limits, frágil si el usuario editó el evento manualmente |
| **Identificar por clave compuesta (fecha + hora_inicio + hora_fin) en Calendar** | Determinista | Requiere listar todos los eventos del período para comparar |
| **Almacenar `google_event_id` en DB + diff local** | Un solo punto de verdad; diff O(n) en memoria sin llamadas extra a API | Requiere mantener el estado local sincronizado; si se pierde la DB, habría que re-sincronizar desde cero |

#### Decisión

**Almacenar `google_event_id` en cada `ShiftEntry` y ejecutar el diff localmente.**

El motor de diff compara el estado actual de la DB contra el nuevo Excel parseado usando una **clave de negocio** (`date + start_time + end_time + type`). Solo se hacen llamadas a Google Calendar API para las entradas que el diff marca como CREATE, UPDATE o DELETE.

**Algoritmo del diff:**

```
diff(existingEntries[], newEntries[]) → Delta:
  existingByKey = index(existingEntries, by: businessKey)
  newByKey      = index(newEntries, by: businessKey)

  toCreate = newEntries.filter(e => !existingByKey[e.key])
  toDelete = existingEntries.filter(e => !newByKey[e.key] && e.googleEventId != null)
  toUpdate = newEntries.filter(e =>
    existingByKey[e.key] &&
    existingByKey[e.key].googleEventId != null &&
    metadataChanged(existingByKey[e.key], e)  // ej. cambio en compañeros de turno
  )
  unchanged = ...
```

#### Consecuencias

- ✅ Subir el mismo Excel N veces no genera cambios adicionales en Calendar.
- ✅ Mínimo de llamadas a Google Calendar API (solo los cambios reales).
- ✅ Si la sincronización falla a mitad (ej. rate limit), el estado parcial persiste en DB y el siguiente intento solo reintenta las entradas pendientes.
- ⚠️ Si el usuario elimina un evento en Google Calendar manualmente, la DB lo sigue teniendo como `SYNCED`. En la próxima re-sincronización, el diff lo considerará sin cambios (la clave existe en ambos lados), por lo que el evento no se recreará automáticamente — comportamiento aceptable para uso personal.

---

### ADR-007: Almacenamiento de tokens OAuth — Cifrado en base de datos

**Estado:** Aceptado  
**Fecha:** Julio 2026

#### Contexto

Los tokens de Google Calendar (`access_token`, `refresh_token`) deben persistirse para poder sincronizar server-side sin presencia del usuario. Son credenciales de alto valor: permiten leer/escribir en el Google Calendar del usuario.

#### Opciones evaluadas

| Opción | Pro | Contra |
|--------|-----|--------|
| **En sesión (cookie cifrada)** | Sin costo adicional de infraestructura | Solo disponible mientras el usuario tiene sesión activa; imposible usar en tareas de background |
| **Texto plano en PostgreSQL** | Simple | Inaceptable: cualquier leak de la DB expone las credenciales de Google |
| **Cifrado simétrico (AES-256-GCM) en PostgreSQL** | Tokens ilegibles en la DB; clave de cifrado en variable de entorno | La clave de cifrado en Vercel env vars es el único punto de fallo; aceptable para uso personal |
| **Gestor de secretos externo (Vault, AWS Secrets Manager)** | Máxima seguridad | Costo y complejidad innecesarios para uso personal |

#### Decisión

**Cifrado AES-256-GCM** usando la Web Crypto API (nativa en Node.js 18+) antes de persistir en PostgreSQL. La clave de cifrado (`TOKEN_ENCRYPTION_KEY`) se almacena como variable de entorno en Vercel.

```typescript
// util/crypto.ts (pseudocódigo)
const encrypt = (plaintext: string, key: CryptoKey): Promise<string>
const decrypt = (ciphertext: string, key: CryptoKey): Promise<string>
```

Los tokens nunca se retornan al frontend; solo se usan en server-side functions.

#### Consecuencias

- ✅ Tokens ilegibles en la base de datos (Supabase dashboard incluido).
- ✅ Sin costo adicional (Web Crypto API es nativa).
- ⚠️ Si se pierde `TOKEN_ENCRYPTION_KEY`, los tokens almacenados son irrecuperables — el usuario deberá reconectar su cuenta de Google. Se documenta como operación de recuperación.
- ⚠️ Rotar la clave de cifrado requiere re-cifrar todos los tokens existentes — script de migración a preparar si se decide rotar.

---

### ADR-008: Notificaciones — Web Push API primero

**Estado:** Aceptado  
**Fecha:** Julio 2026

#### Contexto

El usuario quiere recordatorios configurables (15/30/60 minutos) antes de cada turno. Las opciones incluyen Web Push, Telegram, WhatsApp Business API y notificaciones de Google Calendar nativas.

#### Opciones evaluadas

| Canal | Costo | Fricción de setup | Disponibilidad offline |
|-------|-------|-------------------|----------------------|
| **Google Calendar nativas** | $0 | Cero — ya se crean los eventos | Solo en dispositivos con Calendar app | 
| **Web Push** | $0 | Requiere Service Worker + suscripción | Solo si el browser/PWA está activo |
| **Telegram Bot** | $0 | Crear bot vía BotFather, guardar chat_id | Alta — Telegram siempre activo en móvil |
| **WhatsApp Business API** | Costo por mensaje | Proceso de aprobación complejo | Alta |

#### Decisión

**Delegar las notificaciones a Google Calendar para el MVP** (los eventos creados ya incluyen recordatorios configurables via `event.reminders`). Web Push como segunda opción en Fase 2, Telegram como opción adicional en Fase 3.

Para el MVP: al crear/actualizar cada evento en Google Calendar, se incluyen los `reminders` configurados por el usuario directamente en el payload del evento. Esto delega toda la lógica de notificación a Google Calendar sin necesidad de Service Workers, cron jobs ni infraestructura adicional.

```json
"reminders": {
  "useDefault": false,
  "overrides": [
    { "method": "popup", "minutes": 60 },
    { "method": "popup", "minutes": 15 }
  ]
}
```

#### Consecuencias

- ✅ Cero infraestructura adicional en MVP.
- ✅ Notificaciones funcionan en todos los dispositivos donde el usuario tenga Google Calendar.
- ⚠️ El usuario debe tener las notificaciones de Google Calendar habilitadas en su dispositivo.
- ⚠️ Si en Fase 2 se implementa Web Push, requerirá: registro de Service Worker, endpoint de suscripción VAPID, y cron job (ej. Vercel Cron o GitHub Actions) para enviar la notificación en el momento correcto.

---

## Parte II — Technical Design Document

---

### 1. Visión general del sistema

ShiftSync es una aplicación web personal que automatiza la sincronización del horario laboral de Pérez desde un Excel mensual hacia Google Calendar. El usuario es el desarrollador, lo que elimina la necesidad de onboarding, soporte y documentación de usuario final.

**Flujo principal:**

```
Usuario sube Excel (.xlsx)
        ↓
  [API Route: POST /api/schedules/upload]
        ↓
  ExcelParser: lee hojas, extrae estructura
        ↓
  NameMatcher: localiza fila del usuario
        ↓ (si ambiguo → pantalla de confirmación)
  ShiftExtractor: parsea celdas → ShiftEntry[]
        ↓
  Vista previa en UI
        ↓ (usuario confirma)
  [API Route: POST /api/schedules/:id/sync]
        ↓
  DiffEngine: compara con estado previo en DB
        ↓
  CalendarSyncService: aplica delta a Google Calendar API
        ↓
  DB actualizada con google_event_id y sync_status
        ↓
  UI refleja estado sincronizado
```

---

### 2. Arquitectura de componentes

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App (Vercel)                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                   Frontend (React)                │   │
│  │                                                   │   │
│  │  ScheduleUploader │ CalendarView │ Dashboard      │   │
│  │  IdentityConfirm  │ StatsPanel   │ Settings       │   │
│  └──────────────────────────────────────────────────┘   │
│                          │ fetch                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │               API Routes (serverless)             │   │
│  │                                                   │   │
│  │  /api/auth/[...nextauth]  (Auth.js)              │   │
│  │  /api/schedules/upload                           │   │
│  │  /api/schedules/:id/confirm-identity             │   │
│  │  /api/schedules/:id/sync                         │   │
│  │  /api/shifts                                     │   │
│  │  /api/dashboard/summary                          │   │
│  │  /api/stats                                      │   │
│  │  /api/settings                                   │   │
│  │  /api/notifications/preferences                  │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Capa de Dominio (módulos puros TS)     │   │
│  │                                                   │   │
│  │  ExcelParser      NameMatcher    DiffEngine       │   │
│  │  ShiftExtractor   TimeUtils      StatsCalculator  │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Capa de Infraestructura                  │   │
│  │                                                   │   │
│  │  PrismaClient (DB)   CalendarClient (Google API)  │   │
│  │  TokenCrypto         AuthAdapter (Auth.js)        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
  Supabase PostgreSQL      Google Calendar API v3
```

**Principio de separación:** Los módulos de dominio (`ExcelParser`, `DiffEngine`, etc.) son funciones TypeScript puras sin dependencias de framework. Las API Routes orquestan estos módulos y delegan persistencia a la capa de infraestructura. Esto permite testear la lógica de negocio sin mocks de Next.js ni de la base de datos.

---

### 3. Modelo de datos — Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // para migraciones (sin pgbouncer)
}

// ─── Enums ────────────────────────────────────────────────

enum ShiftType {
  WORK
  REST
  VACATION
}

enum SyncStatus {
  PENDING   // parseado, aún no sincronizado con Calendar
  SYNCED    // existe en Google Calendar como evento activo
  UPDATED   // el turno cambió; pendiente de actualizar el evento
  DELETED   // ya no existe en el Excel; pendiente de eliminar el evento
}

enum NotifChannel {
  PUSH
  TELEGRAM
}

// ─── Modelos ──────────────────────────────────────────────

model User {
  id                String   @id @default(uuid())
  googleId          String   @unique @map("google_id")
  email             String   @unique
  displayName       String   @map("display_name")
  // Variantes de nombre confirmadas por el usuario para matching futuro
  // Ej: ["PÉREZ GARCÍA JUAN", "PÉREZ, JUAN"]
  nameAliases       String[] @map("name_aliases") @default([])
  timezone          String   @default("America/El_Salvador")
  timeFormat        String   @default("24h") @map("time_format") // "12h" | "24h"
  language          String   @default("es")
  defaultEventColor String   @default("#4285F4") @map("default_event_color")
  createdAt         DateTime @default(now()) @map("created_at")

  schedules            Schedule[]
  shiftEntries         ShiftEntry[]
  notificationPrefs    NotificationPreference[]
  calendarConnection   CalendarConnection?

  @@map("users")
}

model Schedule {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  sourceFilename String   @map("source_filename")
  month          Int      // 1–12
  year           Int
  uploadedAt     DateTime @default(now()) @map("uploaded_at")
  // SHA-256 del archivo para detectar re-subida de archivo idéntico
  rawFileHash    String   @map("raw_file_hash")

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  shiftEntries ShiftEntry[]

  // Solo puede existir una versión activa por mes/año por usuario
  @@unique([userId, month, year])
  @@map("schedules")
}

model ShiftEntry {
  id            String     @id @default(uuid())
  scheduleId    String     @map("schedule_id")
  userId        String     @map("user_id")
  date          DateTime   @db.Date
  type          ShiftType
  // Almacenados como "HH:MM" en string para evitar ambigüedad de zona horaria
  startTime     String?    @map("start_time")
  endTime       String?    @map("end_time")
  // True cuando el turno empieza en el día `date` y termina en `date + 1`
  crossesMidnight Boolean  @default(false) @map("crosses_midnight")
  department    String
  // ID del evento en Google Calendar — null hasta que se sincronice
  googleEventId String?    @map("google_event_id")
  syncStatus    SyncStatus @default(PENDING) @map("sync_status")

  schedule  Schedule   @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  user      User       @relation(fields: [userId], references: [id])
  coworkers Coworker[]

  @@index([userId, date])
  @@map("shift_entries")
}

// Dato mínimo sobre compañeros de turno. No son usuarios del sistema.
model Coworker {
  id           String @id @default(uuid())
  shiftEntryId String @map("shift_entry_id")
  fullName     String @map("full_name")
  department   String

  shiftEntry ShiftEntry @relation(fields: [shiftEntryId], references: [id], onDelete: Cascade)

  @@map("coworkers")
}

model NotificationPreference {
  id            String       @id @default(uuid())
  userId        String       @map("user_id")
  minutesBefore Int          @map("minutes_before") // 15 | 30 | 60
  channel       NotifChannel
  enabled       Boolean      @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, minutesBefore, channel])
  @@map("notification_preferences")
}

model CalendarConnection {
  id                  String    @id @default(uuid())
  userId              String    @unique @map("user_id")
  googleCalendarId    String    @map("google_calendar_id")
  // Almacenados cifrados con AES-256-GCM
  accessToken         String    @map("access_token")
  refreshToken        String    @map("refresh_token")
  tokenExpiresAt      DateTime? @map("token_expires_at")
  isDedicatedCalendar Boolean   @default(true) @map("is_dedicated_calendar")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("calendar_connections")
}
```

#### Estrategia de migraciones

```bash
# Desarrollo: crear nueva migración
npx prisma migrate dev --name <descripcion_corta>

# Producción: aplicar migraciones pendientes (en el pipeline de CI/CD de Vercel)
npx prisma migrate deploy

# Inspección rápida en desarrollo
npx prisma studio
```

---

### 4. Diseño de API

Todas las rutas requieren sesión autenticada (middleware de Auth.js), excepto las rutas de auth.

#### Convención de respuesta

```typescript
// Éxito
{ data: T, error: null }

// Error
{ data: null, error: { code: string, message: string, details?: unknown } }
```

---

#### `POST /api/schedules/upload`

Sube y parsea un archivo Excel. No persiste shift entries aún — devuelve preview para confirmación.

**Request:** `multipart/form-data` con campo `file` (.xlsx, max 5 MB)

**Response `200`:**
```typescript
{
  data: {
    scheduleId: string          // ID temporal para el flujo de confirmación
    month: number
    year: number
    fileHash: string
    isDuplicate: boolean        // true si el hash ya existe en DB
    identityStatus: 'AUTO_MATCHED' | 'NEEDS_CONFIRMATION'
    matchedRow?: {
      rawName: string
      confidence: number        // 0–1
    }
    candidates?: Array<{        // solo si identityStatus = 'NEEDS_CONFIRMATION'
      rowIndex: number
      rawName: string
      department: string
      score: number
    }>
    preview?: ShiftEntry[]      // solo si identityStatus = 'AUTO_MATCHED'
  }
}
```

**Errores:**
- `400 INVALID_FILE` — no es un .xlsx o está corrupto
- `400 INVALID_STRUCTURE` — la estructura del Excel no coincide con la esperada (no se encontró fila de fechas)
- `413 FILE_TOO_LARGE` — supera 5 MB

---

#### `POST /api/schedules/:id/confirm-identity`

Confirma la fila del usuario (manual o automática). Persiste los ShiftEntry en DB.

**Request:**
```typescript
{
  rowIndex: number       // índice de la fila confirmada
  saveAsAlias: boolean   // si true, guarda el rawName como alias para futuros matchings
}
```

**Response `200`:**
```typescript
{
  data: {
    scheduleId: string
    shiftCount: number
    preview: ShiftEntry[]
  }
}
```

---

#### `POST /api/schedules/:id/sync`

Ejecuta el diff y sincroniza con Google Calendar. Operación idempotente.

**Response `200`:**
```typescript
{
  data: {
    created: number
    updated: number
    deleted: number
    unchanged: number
    errors: Array<{
      shiftEntryId: string
      date: string
      errorCode: string
      message: string
    }>
  }
}
```

**Errores:**
- `400 NOT_CONFIRMED` — el schedule aún no tiene identidad confirmada
- `401 CALENDAR_UNAUTHORIZED` — el token de Google Calendar es inválido o fue revocado
- `429 RATE_LIMITED` — Google Calendar API devolvió 429; el cliente puede reintentar

---

#### `GET /api/shifts`

Retorna los turnos del usuario en un rango de fechas.

**Query params:** `from` (ISO date), `to` (ISO date)

**Response `200`:**
```typescript
{
  data: Array<{
    id: string
    date: string         // "YYYY-MM-DD"
    type: ShiftType
    startTime: string | null
    endTime: string | null
    crossesMidnight: boolean
    department: string
    syncStatus: SyncStatus
    coworkers: Array<{ fullName: string; department: string }>
  }>
}
```

---

#### `GET /api/dashboard/summary`

Datos para el widget de resumen del dashboard.

**Response `200`:**
```typescript
{
  data: {
    nextShift: {
      date: string
      startTime: string
      endTime: string
      crossesMidnight: boolean
      hoursUntil: number
    } | null
    nextRest: {
      date: string
    } | null
    weekHours: number     // horas trabajadas en la semana ISO actual
    monthHours: number    // horas trabajadas en el mes calendario actual
    monthShiftCount: number
  }
}
```

---

#### `GET /api/stats`

Estadísticas avanzadas del período solicitado.

**Query params:** `period` (`week` | `month` | `custom`), `from?`, `to?`

**Response `200`:**
```typescript
{
  data: {
    totalHours: number
    nightHours: number           // horas entre 22:00 y 06:00
    overtimeHours: number        // horas sobre el umbral configurado
    consecutiveWorkingDays: number
    restDays: number
    vacationDays: number
    avgDailyHours: number
  }
}
```

---

#### `GET /api/settings` · `PUT /api/settings`

**PUT Request:**
```typescript
{
  displayName?: string
  timezone?: string
  timeFormat?: '12h' | '24h'
  language?: string
  defaultEventColor?: string
}
```

---

#### `GET /api/notifications/preferences` · `PUT /api/notifications/preferences`

**PUT Request:**
```typescript
{
  preferences: Array<{
    minutesBefore: 15 | 30 | 60
    channel: 'PUSH' | 'TELEGRAM'
    enabled: boolean
  }>
}
```

---

### 5. Algoritmos core

#### 5.1 ExcelParser

```typescript
// lib/domain/excel-parser.ts

interface ParsedSchedule {
  month: number
  year: number
  sheetName: string
  rawRows: RawRow[]
  dateColumns: Map<number, Date>  // columnIndex → Date
}

interface RawRow {
  rowIndex: number
  rawName: string       // valor crudo de columna B
  department: string    // valor de columna A
  cells: Map<number, string>  // columnIndex → valor de celda
}

function parseWorkbook(buffer: Buffer): ParsedSchedule[] {
  const workbook = XLSX.read(buffer, { cellDates: true, type: 'buffer' })

  return workbook.SheetNames.map(sheetName => {
    const sheet = workbook.Sheets[sheetName]
    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      dateNF: 'YYYY-MM-DD'
    })

    // Fila 0 = nombres de días (lunes, martes…) — usada solo para validación
    // Fila 1 = fechas de cada columna
    const dateRow = matrix[1] as string[]
    const dateColumns = buildDateColumnMap(dateRow)

    // Filas 2+ = empleados
    const rawRows = matrix.slice(2).map((row, idx) => ({
      rowIndex: idx + 2,
      department: String(row[0] ?? '').trim(),
      rawName: String(row[1] ?? '').trim(),
      cells: buildCellMap(row as string[], dateColumns)
    }))

    const { month, year } = inferMonthYear(dateColumns)

    return { month, year, sheetName, rawRows, dateColumns }
  })
}
```

**Validación de estructura defensiva:** antes de asumir que fila 1 contiene fechas, verificar que al menos el 60% de las celdas no vacías parsean como fechas válidas. Si falla, lanzar `INVALID_STRUCTURE` con el nombre de la hoja y la posición esperada, no un error genérico.

---

#### 5.2 NameMatcher

```typescript
// lib/domain/name-matcher.ts

interface MatchResult {
  status: 'EXACT' | 'FUZZY' | 'AMBIGUOUS' | 'NOT_FOUND'
  bestMatch?: { rowIndex: number; rawName: string; score: number }
  candidates: Array<{ rowIndex: number; rawName: string; score: number }>
}

// Normaliza para comparación: mayúsculas, sin tildes, sin puntuación extra
function normalize(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Canonicaliza "APELLIDO, NOMBRE" → "NOMBRE APELLIDO"
function canonicalize(name: string): string {
  const normalized = normalize(name)
  if (normalized.includes(',')) {
    const [apellido, nombre] = normalized.split(',').map(s => s.trim())
    return `${nombre} ${apellido}`
  }
  return normalized
}

function matchName(
  userAliases: string[],   // displayName + aliases del usuario, ya normalizados
  candidates: RawRow[]
): MatchResult {
  const normalizedAliases = userAliases.map(normalize)

  // Ronda 1: exact match
  const exactMatches = candidates.filter(row => {
    const canonical = canonicalize(row.rawName)
    return normalizedAliases.some(alias =>
      alias === canonical || normalize(alias) === canonical
    )
  })

  if (exactMatches.length === 1) {
    return {
      status: 'EXACT',
      bestMatch: { rowIndex: exactMatches[0].rowIndex, rawName: exactMatches[0].rawName, score: 1 },
      candidates: []
    }
  }

  // Ronda 2: fuzzy con fuse.js
  const fuse = new Fuse(candidates, {
    keys: ['rawName'],
    includeScore: true,
    threshold: 0.2,       // lower = stricter
    getFn: (row) => canonicalize(row.rawName)
  })

  const fuzzyResults = userAliases
    .flatMap(alias => fuse.search(normalize(alias)))
    .filter(r => r.score !== undefined && r.score < 0.2) // fuse score: 0=perfect, 1=worst

  const scored = deduplicateByRowIndex(fuzzyResults)
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))

  if (scored.length === 0) return { status: 'NOT_FOUND', candidates: [] }
  if (scored.length === 1) return {
    status: 'FUZZY',
    bestMatch: { rowIndex: scored[0].item.rowIndex, rawName: scored[0].item.rawName, score: 1 - (scored[0].score ?? 0) },
    candidates: scored.map(r => ({ rowIndex: r.item.rowIndex, rawName: r.item.rawName, score: 1 - (r.score ?? 0) }))
  }

  return { status: 'AMBIGUOUS', candidates: scored.slice(0, 5).map(r => ({
    rowIndex: r.item.rowIndex,
    rawName: r.item.rawName,
    score: 1 - (r.score ?? 0)
  })) }
}
```

---

#### 5.3 ShiftExtractor

```typescript
// lib/domain/shift-extractor.ts

const WORK_PATTERN = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/
const REST_VALUES  = ['libre', 'descanso']
const VACATION_VALUES = ['vacaciones', 'vac']

function extractShifts(
  row: RawRow,
  dateColumns: Map<number, Date>,
  scheduleId: string,
  userId: string
): ShiftEntryInput[] {
  const entries: ShiftEntryInput[] = []

  for (const [colIndex, date] of dateColumns) {
    const rawValue = (row.cells.get(colIndex) ?? '').trim().toLowerCase()

    if (!rawValue) continue  // celda vacía = no registrado

    let type: ShiftType
    let startTime: string | null = null
    let endTime: string | null = null
    let crossesMidnight = false

    if (VACATION_VALUES.includes(rawValue)) {
      type = 'VACATION'
    } else if (REST_VALUES.includes(rawValue)) {
      type = 'REST'
    } else {
      const match = WORK_PATTERN.exec(rawValue.toUpperCase())
      if (!match) {
        // Valor desconocido — loggear y saltar, no fallar todo el parse
        console.warn(`[ShiftExtractor] Valor desconocido en fila ${row.rowIndex}, col ${colIndex}: "${rawValue}"`)
        continue
      }
      type = 'WORK'
      startTime = match[1]
      endTime = match[2]
      crossesMidnight = isAfterMidnight(startTime, endTime)
    }

    entries.push({ scheduleId, userId, date, type, startTime, endTime, crossesMidnight, department: row.department })
  }

  return entries
}

// Si la hora de fin es menor que la de inicio, el turno cruza medianoche
function isAfterMidnight(start: string, end: string): boolean {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em < sh * 60 + sm
}
```

---

#### 5.4 DiffEngine

```typescript
// lib/domain/diff-engine.ts

type BusinessKey = string // `${date}|${type}|${startTime ?? ''}|${endTime ?? ''}`

interface SyncDelta {
  toCreate: ShiftEntryInput[]
  toUpdate: Array<{ id: string; googleEventId: string; changes: Partial<ShiftEntryInput> }>
  toDelete: Array<{ id: string; googleEventId: string }>
  unchanged: ShiftEntry[]
}

function computeBusinessKey(entry: Pick<ShiftEntry, 'date' | 'type' | 'startTime' | 'endTime'>): BusinessKey {
  const dateStr = entry.date instanceof Date
    ? entry.date.toISOString().split('T')[0]
    : entry.date
  return `${dateStr}|${entry.type}|${entry.startTime ?? ''}|${entry.endTime ?? ''}`
}

function computeDiff(existing: ShiftEntry[], incoming: ShiftEntryInput[]): SyncDelta {
  const existingByKey = new Map(existing.map(e => [computeBusinessKey(e), e]))
  const incomingByKey = new Map(incoming.map(e => [computeBusinessKey(e), e]))

  const toCreate: ShiftEntryInput[] = []
  const toUpdate: SyncDelta['toUpdate'] = []
  const toDelete: SyncDelta['toDelete'] = []
  const unchanged: ShiftEntry[] = []

  // Evaluar entradas nuevas
  for (const [key, newEntry] of incomingByKey) {
    const existing = existingByKey.get(key)
    if (!existing) {
      toCreate.push(newEntry)
    } else if (existing.googleEventId && metadataChanged(existing, newEntry)) {
      toUpdate.push({ id: existing.id, googleEventId: existing.googleEventId, changes: newEntry })
    } else {
      unchanged.push(existing)
    }
  }

  // Entradas existentes que ya no están en el nuevo Excel
  for (const [key, entry] of existingByKey) {
    if (!incomingByKey.has(key) && entry.googleEventId && entry.syncStatus !== 'DELETED') {
      toDelete.push({ id: entry.id, googleEventId: entry.googleEventId })
    }
  }

  return { toCreate, toUpdate, toDelete, unchanged }
}

// Detecta cambios en metadata que no afectan la clave de negocio
// (ej. cambio en la lista de compañeros de turno)
function metadataChanged(existing: ShiftEntry, incoming: ShiftEntryInput): boolean {
  return existing.department !== incoming.department
  // Futuro: comparar coworkers cuando RF-13 se implemente
}
```

---

#### 5.5 CalendarSyncService

```typescript
// lib/infra/calendar-sync.service.ts

class CalendarSyncService {
  constructor(private readonly calendarClient: GoogleCalendarClient) {}

  async applyDelta(delta: SyncDelta, calendarId: string): Promise<SyncResult> {
    const results: SyncResult = { created: 0, updated: 0, deleted: 0, errors: [] }

    // Procesar en secuencia para respetar rate limits (max 10 req/s en API Calendar)
    // Para ~31 turnos/mes, la secuencia es suficientemente rápida

    for (const entry of delta.toCreate) {
      try {
        const event = buildCalendarEvent(entry)
        const created = await this.calendarClient.events.insert({
          calendarId,
          requestBody: event
        })
        await db.shiftEntry.update({
          where: { id: entry.tempId },
          data: { googleEventId: created.data.id, syncStatus: 'SYNCED' }
        })
        results.created++
      } catch (err) {
        results.errors.push({ shiftEntryId: entry.tempId, ...formatError(err) })
      }
    }

    for (const { id, googleEventId, changes } of delta.toUpdate) {
      try {
        const event = buildCalendarEvent(changes)
        await this.calendarClient.events.update({
          calendarId,
          eventId: googleEventId,
          requestBody: event
        })
        await db.shiftEntry.update({ where: { id }, data: { syncStatus: 'SYNCED' } })
        results.updated++
      } catch (err) {
        results.errors.push({ shiftEntryId: id, ...formatError(err) })
      }
    }

    for (const { id, googleEventId } of delta.toDelete) {
      try {
        await this.calendarClient.events.delete({ calendarId, eventId: googleEventId })
        await db.shiftEntry.update({ where: { id }, data: { syncStatus: 'DELETED' } })
        results.deleted++
      } catch (err) {
        results.errors.push({ shiftEntryId: id, ...formatError(err) })
      }
    }

    return results
  }
}

function buildCalendarEvent(entry: ShiftEntryInput): CalendarEventBody {
  // Caso: turno normal
  if (!entry.crossesMidnight) {
    return {
      summary: `Turno — ${entry.department}`,
      description: buildDescription(entry),
      start: { dateTime: `${formatDate(entry.date)}T${entry.startTime}:00`, timeZone: 'America/El_Salvador' },
      end:   { dateTime: `${formatDate(entry.date)}T${entry.endTime}:00`,   timeZone: 'America/El_Salvador' },
      reminders: buildReminders(entry.notifPrefs)
    }
  }

  // Caso: turno nocturno que cruza medianoche (ej. 21:00–06:00)
  const nextDay = addDays(entry.date, 1)
  return {
    summary: `Turno nocturno — ${entry.department}`,
    description: buildDescription(entry),
    start: { dateTime: `${formatDate(entry.date)}T${entry.startTime}:00`, timeZone: 'America/El_Salvador' },
    end:   { dateTime: `${formatDate(nextDay)}T${entry.endTime}:00`,      timeZone: 'America/El_Salvador' },
    reminders: buildReminders(entry.notifPrefs)
  }
}
```

---

### 6. Manejo de errores

| Capa | Error | Respuesta | Acción |
|------|-------|-----------|--------|
| Upload | Excel corrupto o no-.xlsx | `400 INVALID_FILE` | Mensaje claro en UI |
| Upload | Estructura inesperada (sin fila de fechas) | `400 INVALID_STRUCTURE` con detalle de la hoja | Mensaje + instrucción de qué revisar |
| Upload | Nombre no encontrado | `200` con `identityStatus: NEEDS_CONFIRMATION` + candidates | Pantalla de selección manual |
| Sync | Token de Google expirado | Refresh automático; si falla → `401 CALENDAR_UNAUTHORIZED` | UI pide reconectar cuenta |
| Sync | Rate limit (429) | Retry con backoff exponencial (3 intentos: 1s, 2s, 4s) | Si persiste, error parcial en response |
| Sync | Evento de Google no encontrado (404 en update/delete) | Log de advertencia; marcar `sync_status = PENDING` para reintento | No fallar el batch completo |
| Parser | Celda con valor desconocido | Log de advertencia; saltar la celda | Nunca fallar el parse completo por una celda desconocida |
| DB | Error de conexión | `500` genérico + log detallado | Reintentar con `prisma.$connect()` singleton pattern |

**Principio:** errores parciales en la sincronización no deben bloquear el resto. El batch continúa y los errores se retornan en el campo `errors[]` de la response para que el usuario sepa qué entradas fallaron.

---

### 7. Seguridad

#### 7.1 Cifrado de tokens

```typescript
// lib/infra/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex') // 32 bytes → 64 hex chars

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Formato: iv(24) + tag(32) + ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decrypt(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, 'base64')
  const iv  = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(tag)
  return decipher.update(enc) + decipher.final('utf8')
}
```

#### 7.2 Privacidad del Excel

- El buffer del archivo se procesa en memoria y **nunca se persiste en disco ni en base de datos**.
- Solo se almacenan los `ShiftEntry` del usuario autenticado.
- Del resto del Excel (74 empleados) solo se persisten nombre y departamento de quienes comparten turno exacto (`Coworker`), y solo para RF-13 (compañeros de turno) — dato mínimo necesario.

#### 7.3 Scopes OAuth mínimos

Solo se solicitan los scopes necesarios para las operaciones reales:

```typescript
// Solo para crear/editar/eliminar eventos
scope: 'openid email profile https://www.googleapis.com/auth/calendar.events'

// Adicional, solo si el usuario elige crear un calendario nuevo
// scope: 'https://www.googleapis.com/auth/calendar'
```

#### 7.4 Headers de seguridad (next.config.ts)

```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; ..." }
]
```

---

### 8. Estrategia de testing

#### Pirámide de tests

```
          [E2E — Playwright]
        Flujo crítico completo
               ~3 tests

      [Integración — Vitest]
    API Routes con DB en memoria
           ~15–20 tests

  [Unitario — Vitest]
  Módulos de dominio puros
      ~60–80 tests  ← mayor cobertura aquí
```

#### Tests unitarios (módulos de dominio)

```typescript
// lib/domain/__tests__/name-matcher.test.ts
describe('NameMatcher', () => {
  it('match exacto con formato NOMBRE APELLIDO')
  it('match exacto con formato APELLIDO, NOMBRE')
  it('match exacto ignorando tildes')
  it('fuzzy match con error tipográfico menor')
  it('retorna AMBIGUOUS cuando hay dos candidatos similares')
  it('retorna NOT_FOUND cuando no hay ningún match')
  it('prioriza alias guardados sobre búsqueda fuzzy')
})

// lib/domain/__tests__/shift-extractor.test.ts
describe('ShiftExtractor', () => {
  it('parsea turno diurno correctamente')
  it('parsea turno nocturno (21:00-06:00) y detecta crossesMidnight=true')
  it('clasifica "Libre" como REST')
  it('clasifica "Vacaciones" como VACATION')
  it('salta celda vacía sin error')
  it('loggea advertencia y salta celda con valor desconocido')
})

// lib/domain/__tests__/diff-engine.test.ts
describe('DiffEngine', () => {
  it('retorna toCreate para turnos nuevos')
  it('retorna toDelete para turnos eliminados del Excel')
  it('retorna unchanged para turnos idénticos')
  it('es idempotente: mismos inputs → mismo delta')
  it('no marca toDelete si googleEventId es null')
})
```

#### Fixtures

Usar el Excel real (anonimizado) como fixture en `__fixtures__/horario-julio.xlsx`:
- Incluye al menos: un turno nocturno, una fila con "Vacaciones", un nombre con coma, y dos nombres similares entre sí.

#### Tests de integración

```typescript
// app/api/schedules/__tests__/upload.test.ts
// Usar @prisma/client con base de datos de test (SQLite en CI o Supabase branch)
describe('POST /api/schedules/upload', () => {
  it('procesa el fixture y retorna preview correcta')
  it('retorna isDuplicate=true si se sube el mismo hash dos veces')
  it('retorna 400 si el archivo no es un .xlsx válido')
})
```

#### E2E (Playwright, solo flujo crítico)

```typescript
test('flujo completo: subir Excel → confirmar identidad → sync → verificar turnos en UI', async ({ page }) => {
  // Mock de Google Calendar API con MSW
  await page.goto('/dashboard')
  await page.getByLabel('Subir Excel').setInputFiles('fixtures/horario-julio.xlsx')
  await expect(page.getByText('Confirma tu fila')).toBeVisible()
  await page.getByText('PÉREZ JUAN').click()
  await page.getByRole('button', { name: 'Confirmar y continuar' }).click()
  await page.getByRole('button', { name: 'Sincronizar con Google Calendar' }).click()
  await expect(page.getByText('31 eventos sincronizados')).toBeVisible()
})
```

---

### 9. Arquitectura de despliegue

```
GitHub (main branch)
        │
        │ push
        ▼
  Vercel (CI/CD automático)
  ┌─────────────────────────────────────────┐
  │  Build: next build                       │
  │  Migrate: prisma migrate deploy          │
  │  Deploy: Edge Network                    │
  └─────────────────────────────────────────┘
        │                    │
        ▼                    ▼
  Serverless Functions    Static Assets (CDN)
  (API Routes)
        │
        ▼
  Supabase PostgreSQL
  (connection via pgbouncer URL)
```

#### Variables de entorno requeridas

```bash
# Base de datos
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://..."   # sin pgbouncer, para migraciones

# Auth.js
NEXTAUTH_URL="https://shiftsync.vercel.app"
NEXTAUTH_SECRET="..."           # openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Cifrado de tokens
TOKEN_ENCRYPTION_KEY="..."      # openssl rand -hex 32 (64 chars = 32 bytes)
```

#### Rollback

Vercel mantiene un historial de despliegues inmutables. Rollback = promover un despliegue anterior desde el panel de Vercel (< 30 segundos). Las migraciones de DB son aditivas en todo momento — sin migraciones destructivas que requieran rollback coordinado.

---

### 10. Plan de implementación

#### Fase 1 — MVP (core del producto)

| Semana | Módulos | Entregable verificable |
|--------|---------|----------------------|
| 1 | Setup proyecto (Next.js + Prisma + Auth.js + Supabase), variables de entorno, CI/CD base | `npm run dev` funciona; login con Google funciona; Prisma conecta a Supabase |
| 2 | `ExcelParser` + `NameMatcher` + `ShiftExtractor` con tests unitarios | Fixture de Excel real parseado correctamente; tests verdes |
| 3 | API Routes de upload + confirm-identity; UI de upload + pantalla de confirmación | Subir Excel → ver preview de turnos en pantalla |
| 4 | `DiffEngine` + `CalendarSyncService`; API Route de sync | Sincronización completa con Google Calendar sin duplicados |
| 5 | Vista de calendario (`GET /api/shifts`); dashboard (`GET /api/dashboard/summary`) | UI funcional completa; primer turno real sincronizado |
| 6 | Manejo de errores, retry logic, tests E2E del flujo crítico, QA manual contra cuenta de Google real | MVP listo para uso diario |

#### Fase 2 — Enriquecimiento personal

- Compañeros de turno (RF-13): `Coworker` ya está en el schema; solo se necesita el extractor de compañeros en `ShiftExtractor` y mostrarlo en la UI.
- Estadísticas completas (`GET /api/stats` con horas nocturnas, días consecutivos, etc.).
- Web Push notifications (Service Worker + VAPID + Vercel Cron).
- Configuración completa (RF-18): colores de eventos, formato de hora, zona horaria.

#### Fase 3 — Multi-fuente de importación

- Google Drive API: importar Excel directamente desde Drive (scope adicional `drive.readonly`).
- Telegram Bot: notificaciones opcionales via Bot API.

---

*Documento generado como complemento al `PRD_ShiftSync.md` v1.0. Ante cualquier conflicto entre este documento y el PRD, el PRD prevalece como fuente de verdad del producto. Este documento es la fuente de verdad técnica.*
