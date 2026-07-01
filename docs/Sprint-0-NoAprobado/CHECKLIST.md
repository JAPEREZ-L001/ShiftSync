# Sprint 0 — Checklist de Ejecución

Checklist detallado para seguimiento diario del sprint.

---

## Día 1: Setup inicial

### Proyecto Next.js
- [ ] `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir`
- [ ] Verificar que `npm run dev` funciona
- [ ] Crear `.nvmrc` con `20`
- [ ] Configurar `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```

### Estructura de carpetas
- [ ] Crear `src/lib/domain/`
- [ ] Crear `src/lib/infra/`
- [ ] Crear `src/lib/utils/`
- [ ] Crear `src/components/ui/`
- [ ] Crear `src/components/schedule/`
- [ ] Crear `src/components/calendar/`
- [ ] Crear `src/components/dashboard/`
- [ ] Crear `src/types/`
- [ ] Crear `src/hooks/`

---

## Día 2: Supabase + Prisma

### Supabase
- [ ] Crear cuenta en https://supabase.com
- [ ] Crear nuevo proyecto (región más cercana)
- [ ] Esperar a que el proyecto esté listo (~2 min)
- [ ] Copiar `DATABASE_URL` desde Settings > Database > Connection string > URI
- [ ] Copiar `DIRECT_URL` (sin pooler, para migraciones)

### Prisma
- [ ] `npm install prisma @prisma/client`
- [ ] `npx prisma init`
- [ ] Crear `.env.local` con:
  ```
  DATABASE_URL="postgresql://..."
  DIRECT_URL="postgresql://..."
  ```
- [ ] Agregar `.env.local` a `.gitignore` (verificar que ya está)
- [ ] Copiar schema completo al `prisma/schema.prisma`
- [ ] `npx prisma db push`
- [ ] `npx prisma generate`
- [ ] Verificar con `npx prisma studio`

### Crear cliente Prisma
- [ ] Crear `src/lib/infra/prisma.ts` con patrón singleton
- [ ] Agregar a `package.json`:
  ```json
  "postinstall": "prisma generate"
  ```

---

## Día 3: Google OAuth + Auth.js

### Google Cloud Console
- [ ] Ir a https://console.cloud.google.com
- [ ] Crear nuevo proyecto "ShiftSync"
- [ ] Ir a APIs & Services > OAuth consent screen
- [ ] Seleccionar "External"
- [ ] Llenar información básica (nombre, email de soporte)
- [ ] Agregar scopes: `email`, `profile`, `openid`
- [ ] Agregar scope: `https://www.googleapis.com/auth/calendar.events`
- [ ] Agregar usuario de prueba (tu email)
- [ ] Ir a Credentials > Create Credentials > OAuth 2.0 Client ID
- [ ] Tipo: Web application
- [ ] Agregar Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- [ ] Copiar Client ID y Client Secret

### Auth.js
- [ ] `npm install next-auth@beta`
- [ ] Crear `auth.ts` en raíz del proyecto
- [ ] Crear `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Agregar a `.env.local`:
  ```
  NEXTAUTH_URL="http://localhost:3000"
  NEXTAUTH_SECRET="..." # openssl rand -base64 32
  GOOGLE_CLIENT_ID="..."
  GOOGLE_CLIENT_SECRET="..."
  ```
- [ ] Crear middleware en `middleware.ts`
- [ ] Probar login en `localhost:3000`

---

## Día 4: Módulo de cifrado + Tests

### Cifrado (ADR-007)
- [ ] Crear `src/lib/infra/crypto.ts`
- [ ] Generar clave: `openssl rand -hex 32`
- [ ] Agregar a `.env.local`:
  ```
  TOKEN_ENCRYPTION_KEY="..."
  ```
- [ ] Implementar `encrypt()` y `decrypt()`

### Vitest
- [ ] `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`
- [ ] Crear `vitest.config.ts`
- [ ] Crear `src/lib/infra/__tests__/crypto.test.ts`
- [ ] Agregar scripts a `package.json`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest"
  ```
- [ ] `npm run test` pasa

---

## Día 5: UI básica + Vercel

### Páginas
- [ ] Crear `src/app/page.tsx` - Landing con botón de login
- [ ] Crear `src/app/(protected)/layout.tsx` - Layout autenticado
- [ ] Crear `src/app/(protected)/dashboard/page.tsx` - Dashboard placeholder
- [ ] Mostrar info del usuario (nombre, email)
- [ ] Implementar logout

### Vercel
- [ ] Crear cuenta en https://vercel.com (conectar GitHub)
- [ ] Importar repositorio
- [ ] Configurar variables de entorno:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `NEXTAUTH_URL` (URL de Vercel)
  - `NEXTAUTH_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `TOKEN_ENCRYPTION_KEY`
- [ ] Agregar URI de redirect en Google Console para dominio de Vercel
- [ ] Verificar despliegue exitoso
- [ ] Probar login en producción

---

## Día 6-7: Pulido y documentación

### Calidad de código
- [ ] Configurar Prettier (`.prettierrc`)
- [ ] Verificar `npm run lint` sin errores
- [ ] Revisar todos los archivos creados

### Documentación
- [ ] Crear `.env.example` con todas las variables (sin valores)
- [ ] Actualizar `README.md` con:
  - Descripción del proyecto
  - Requisitos (Node 20+, npm)
  - Instrucciones de setup local
  - Variables de entorno necesarias
  - Comandos disponibles

### Verificación final
- [ ] `npm run dev` funciona
- [ ] `npm run build` sin errores
- [ ] `npm run test` pasa
- [ ] Login funciona en local
- [ ] Login funciona en Vercel
- [ ] Prisma Studio muestra tablas correctas

---

## Comandos rápidos de referencia

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Tests
npm run test
npm run test:watch

# Prisma
npx prisma studio      # GUI de DB
npx prisma db push     # Sync schema → DB
npx prisma generate    # Regenerar cliente
npx prisma migrate dev # Crear migración

# Generar secretos
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -hex 32     # TOKEN_ENCRYPTION_KEY
```

---

## Troubleshooting común

### Auth.js: "Missing secret"
Asegúrate de tener `NEXTAUTH_SECRET` en `.env.local`

### Prisma: "Can't reach database server"
- Verifica que `DATABASE_URL` use `?pgbouncer=true&connection_limit=1`
- Verifica que el proyecto Supabase no esté pausado

### Google OAuth: "redirect_uri_mismatch"
- La URI de redirect debe coincidir exactamente en Google Console
- Para local: `http://localhost:3000/api/auth/callback/google`
- Para Vercel: `https://tu-proyecto.vercel.app/api/auth/callback/google`

### Vercel: "Build failed"
- Revisa que `prisma generate` esté en `postinstall`
- Verifica que todas las variables de entorno estén configuradas
