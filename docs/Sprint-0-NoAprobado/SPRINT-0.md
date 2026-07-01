# Sprint 0 — Fundación e Infraestructura Base

**Proyecto:** ShiftSync  
**Sprint:** 0 (Setup)  
**Duración estimada:** 1 semana  
**Fecha inicio:** Julio 2026  
**Estado:** Planificado

---

## Objetivo del Sprint

Establecer toda la infraestructura técnica necesaria para comenzar el desarrollo de features. Al finalizar este sprint, el proyecto tendrá:

- Proyecto Next.js 14+ configurado con TypeScript y App Router
- Supabase PostgreSQL conectado via Prisma ORM
- Autenticación con Google OAuth funcional (Auth.js v5)
- CI/CD básico con Vercel
- Estructura de carpetas y arquitectura de capas definida
- Herramientas de desarrollo configuradas (ESLint, Prettier, Vitest)

---

## Entregables verificables

| # | Entregable | Verificación |
|---|------------|--------------|
| E1 | Proyecto Next.js ejecutándose localmente | `npm run dev` arranca sin errores en `localhost:3000` |
| E2 | Prisma conectado a Supabase | `npx prisma db push` ejecuta sin errores; `npx prisma studio` muestra las tablas |
| E3 | Login con Google funcional | Usuario puede iniciar sesión con Google y ver su email en pantalla |
| E4 | Despliegue en Vercel | URL de preview funciona y muestra la aplicación |
| E5 | Tests unitarios configurados | `npm run test` ejecuta al menos 1 test de ejemplo |

---

## Backlog del Sprint

### ST-001: Inicializar proyecto Next.js
**Tipo:** Setup  
**Prioridad:** Crítica  
**Estimación:** 2h

**Descripción:**  
Crear el proyecto Next.js con la configuración base requerida por el ADR-001.

**Tareas:**
- [ ] Crear proyecto con `npx create-next-app@latest shiftsync --typescript --tailwind --eslint --app --src-dir`
- [ ] Configurar `tsconfig.json` con strict mode y path aliases (`@/`)
- [ ] Configurar `tailwind.config.ts` con variables CSS para theming
- [ ] Agregar `.nvmrc` con versión de Node (20.x LTS)
- [ ] Configurar `next.config.ts` con headers de seguridad (ADR-007)

**Criterios de aceptación:**
- `npm run dev` inicia sin errores
- `npm run build` compila sin errores
- TypeScript strict mode habilitado
- Path aliases funcionan (`@/components/...`)

---

### ST-002: Configurar Prisma + Supabase
**Tipo:** Setup  
**Prioridad:** Crítica  
**Estimación:** 3h

**Descripción:**  
Configurar Prisma ORM con conexión a Supabase PostgreSQL según ADR-002.

**Tareas:**
- [ ] Crear proyecto en Supabase (free tier)
- [ ] Instalar Prisma: `npm install prisma @prisma/client`
- [ ] Inicializar Prisma: `npx prisma init`
- [ ] Configurar `DATABASE_URL` y `DIRECT_URL` en `.env.local`
- [ ] Copiar el schema completo de `ShiftSync_ADR_TDD.md` (sección 3)
- [ ] Ejecutar `npx prisma db push` para crear las tablas
- [ ] Crear singleton de PrismaClient para Next.js serverless (`lib/db.ts`)
- [ ] Agregar `prisma generate` al script de postinstall

**Criterios de aceptación:**
- `npx prisma studio` abre y muestra todas las tablas del modelo
- Las tablas coinciden con el schema definido en el TDD
- El cliente Prisma se genera sin errores
- `.env.local` está en `.gitignore`

**Schema a implementar:**
```prisma
// Enums: ShiftType, SyncStatus, NotifChannel
// Models: User, Schedule, ShiftEntry, Coworker, NotificationPreference, CalendarConnection
```

---

### ST-003: Configurar Auth.js con Google OAuth
**Tipo:** Setup  
**Prioridad:** Crítica  
**Estimación:** 4h

**Descripción:**  
Implementar autenticación con Google OAuth usando Auth.js v5 según ADR-004.

**Tareas:**
- [ ] Crear proyecto en Google Cloud Console
- [ ] Configurar OAuth consent screen (tipo: External, scopes: email, profile, calendar.events)
- [ ] Crear OAuth 2.0 Client ID (Web application)
- [ ] Agregar URIs de redirección: `http://localhost:3000/api/auth/callback/google`
- [ ] Instalar Auth.js: `npm install next-auth@beta`
- [ ] Crear `auth.ts` en raíz con configuración de Google provider
- [ ] Crear route handlers en `app/api/auth/[...nextauth]/route.ts`
- [ ] Crear middleware de protección de rutas
- [ ] Implementar página de login básica
- [ ] Configurar callback para capturar `access_token` y `refresh_token`

**Criterios de aceptación:**
- Click en "Iniciar sesión con Google" redirige a Google OAuth
- Callback exitoso crea sesión y muestra email del usuario
- Rutas protegidas redirigen a login si no hay sesión
- Los tokens se capturan en el callback (aunque aún no se persisten cifrados)

**Variables de entorno requeridas:**
```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..." # openssl rand -base64 32
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

### ST-004: Estructura de carpetas y arquitectura
**Tipo:** Setup  
**Prioridad:** Alta  
**Estimación:** 2h

**Descripción:**  
Crear la estructura de carpetas que refleja la arquitectura de capas definida en el TDD.

**Tareas:**
- [ ] Crear estructura de carpetas según el diagrama del TDD

**Estructura objetivo:**
```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/[...nextauth]/
│   │   ├── schedules/
│   │   ├── shifts/
│   │   ├── dashboard/
│   │   ├── stats/
│   │   ├── settings/
│   │   └── notifications/
│   ├── (auth)/               # Rutas públicas (login)
│   ├── (protected)/          # Rutas protegidas (dashboard, calendar)
│   ├── layout.tsx
│   └── page.tsx
├── components/               # Componentes React
│   ├── ui/                   # Componentes base (Button, Input, etc.)
│   ├── schedule/             # ScheduleUploader, IdentityConfirm
│   ├── calendar/             # CalendarView
│   └── dashboard/            # Dashboard, StatsPanel
├── lib/
│   ├── domain/               # Lógica de negocio pura
│   │   ├── excel-parser.ts
│   │   ├── name-matcher.ts
│   │   ├── shift-extractor.ts
│   │   ├── diff-engine.ts
│   │   ├── time-utils.ts
│   │   └── stats-calculator.ts
│   ├── infra/                # Adaptadores de infraestructura
│   │   ├── calendar-client.ts
│   │   ├── crypto.ts
│   │   └── prisma.ts
│   └── utils/                # Utilidades generales
├── types/                    # Tipos TypeScript compartidos
└── hooks/                    # Custom hooks
```

**Criterios de aceptación:**
- Todas las carpetas principales existen
- Cada carpeta tiene un archivo `index.ts` o `.gitkeep` donde corresponda
- Hay al menos un archivo placeholder en cada capa para validar imports

---

### ST-005: Configurar herramientas de desarrollo
**Tipo:** Setup  
**Prioridad:** Media  
**Estimación:** 2h

**Descripción:**  
Configurar ESLint, Prettier y Vitest para mantener calidad de código.

**Tareas:**
- [ ] Configurar ESLint con reglas de TypeScript y React
- [ ] Instalar y configurar Prettier
- [ ] Agregar `.prettierrc` con configuración del proyecto
- [ ] Instalar Vitest: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react`
- [ ] Configurar `vitest.config.ts`
- [ ] Crear test de ejemplo en `lib/domain/__tests__/example.test.ts`
- [ ] Agregar scripts en `package.json`: `test`, `test:watch`, `lint`, `format`
- [ ] Configurar Husky + lint-staged para pre-commit hooks (opcional)

**Criterios de aceptación:**
- `npm run lint` ejecuta sin errores
- `npm run format` formatea el código
- `npm run test` ejecuta al menos 1 test de ejemplo
- Los imports entre capas funcionan correctamente

---

### ST-006: Configurar CI/CD con Vercel
**Tipo:** Setup  
**Prioridad:** Media  
**Estimación:** 1h

**Descripción:**  
Conectar el repositorio a Vercel para despliegue automático.

**Tareas:**
- [ ] Crear cuenta/proyecto en Vercel
- [ ] Conectar repositorio de GitHub
- [ ] Configurar variables de entorno en Vercel Dashboard
- [ ] Verificar que el primer despliegue sea exitoso
- [ ] Configurar dominio de preview (automático con Vercel)

**Criterios de aceptación:**
- Push a `main` dispara despliegue automático
- La URL de Vercel muestra la aplicación funcionando
- Login con Google funciona en el entorno de producción
- Las variables de entorno están configuradas correctamente

---

### ST-007: Implementar módulo de cifrado
**Tipo:** Infraestructura  
**Prioridad:** Alta  
**Estimación:** 2h

**Descripción:**  
Implementar las funciones de cifrado/descifrado para tokens OAuth según ADR-007.

**Tareas:**
- [ ] Crear `lib/infra/crypto.ts` con funciones `encrypt` y `decrypt`
- [ ] Usar AES-256-GCM con Web Crypto API / node:crypto
- [ ] Generar `TOKEN_ENCRYPTION_KEY` y agregarlo a `.env.local`
- [ ] Escribir tests unitarios para cifrado/descifrado
- [ ] Documentar proceso de rotación de clave

**Criterios de aceptación:**
- `encrypt("test")` retorna string base64 diferente cada vez (por IV aleatorio)
- `decrypt(encrypt("test"))` retorna "test"
- Tests pasan con diferentes inputs (strings, JSON, caracteres especiales)

---

### ST-008: Crear página de landing/login
**Tipo:** UI  
**Prioridad:** Media  
**Estimación:** 2h

**Descripción:**  
Crear una página de inicio con botón de login y una página de dashboard vacía como placeholder.

**Tareas:**
- [ ] Crear página de inicio (`app/page.tsx`) con branding básico
- [ ] Implementar botón "Iniciar sesión con Google"
- [ ] Crear layout de dashboard protegido (`app/(protected)/layout.tsx`)
- [ ] Crear página de dashboard placeholder (`app/(protected)/dashboard/page.tsx`)
- [ ] Mostrar información del usuario logueado (nombre, email, avatar)
- [ ] Implementar botón de logout

**Criterios de aceptación:**
- Usuario no autenticado ve página de login
- Login exitoso redirige a `/dashboard`
- Dashboard muestra nombre y email del usuario
- Logout limpia sesión y redirige a `/`

---

## Dependencias externas

| Servicio | Cuenta necesaria | Free tier |
|----------|------------------|-----------|
| Supabase | Sí | 500 MB DB, sin sleep |
| Google Cloud Console | Sí (Gmail) | OAuth gratuito |
| Vercel | Sí (GitHub) | Hobby tier gratuito |
| GitHub | Sí | Repos privados gratuitos |

---

## Riesgos del Sprint

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Auth.js v5 tiene breaking changes vs documentación | Media | Alto | Usar documentación oficial de `next-auth@beta`, no tutoriales antiguos |
| Configuración de OAuth consent screen rechazada | Baja | Medio | Mantener app en modo "Testing" hasta verificación |
| Supabase pausa proyecto por inactividad | Baja | Bajo | Hacer al menos 1 request cada 7 días durante desarrollo |

---

## Definition of Done (DoD)

Una tarea se considera completada cuando:

1. ✅ El código está escrito y funciona según los criterios de aceptación
2. ✅ No hay errores de TypeScript ni warnings de ESLint
3. ✅ Los tests relevantes pasan (si aplica)
4. ✅ El código está commiteado con mensaje descriptivo
5. ✅ El despliegue en Vercel es exitoso (si aplica)

---

## Notas técnicas

### Configuración de Auth.js v5 con App Router

```typescript
// auth.ts (raíz del proyecto)
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      // Exponer solo lo necesario al cliente
      return session
    },
  },
})
```

### Singleton de Prisma para Serverless

```typescript
// lib/infra/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

---

## Checklist de cierre del Sprint

- [ ] Todos los entregables verificados
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] README actualizado con instrucciones de setup
- [ ] Despliegue en Vercel funcionando
- [ ] Sesión de demo/revisión completada

---

## Siguiente Sprint (Preview)

**Sprint 1 — Parser de Excel + Name Matcher**

- Implementar `ExcelParser` con SheetJS
- Implementar `NameMatcher` con normalización y fuzzy matching
- Implementar `ShiftExtractor`
- Tests unitarios con fixture de Excel real
- API Route `POST /api/schedules/upload` (preview)
