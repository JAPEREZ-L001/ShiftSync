# Contribuir a ShiftSync

Guía mínima para trabajar en el mini SPA en local y enviar cambios.

## Requisitos

- Node.js 20+ (probado con 22)
- npm 10+
- Git

Opcional para probar compartir: proyecto Supabase con las RPC documentadas en [SPA.md](SPA.md).

## Primer arranque

```bash
git clone https://github.com/JAPEREZ-L001/ShiftSync.git
cd ShiftSync
npm install
```

Variables de entorno (solo si vas a probar «Guardar y compartir»):

```bash
# Crear .env.local en la raíz
VITE_SUPABASE_URL=https://<tu-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

```bash
npm run dev      # http://localhost:5173
npm run build    # verificar que compila
npm run preview  # servir dist/ localmente
```

## Dónde tocar según el cambio

| Objetivo | Archivo(s) |
|----------|------------|
| Parseo del Excel / empleados | `src/lib/parser.ts` |
| Estadísticas y lógica de fechas | `src/lib/stats.ts`, `src/lib/utils.ts` |
| Estado y carga de archivo | `src/hooks/useSchedule.ts` |
| Compartir / Supabase | `src/lib/share.ts`, `src/lib/supabase.ts` |
| UI de una sección | `src/components/*.tsx` |
| Layout y modos edit/view | `src/App.tsx` |
| Constantes (patrón turno, meta visual) | `src/lib/constants.ts` |
| Tipos | `src/types.ts` |

Convenciones del repo:

- TypeScript estricto; componentes funcionales con hooks.
- Tailwind v4 vía `@import "tailwindcss"` en `src/index.css` (sin `tailwind.config.js`).
- Mantener cambios acotados; no refactorizar lo no relacionado con tu PR.

## Flujo de contribución

1. Crea una rama desde `master`.
2. Implementa el cambio y ejecuta `npm run build`.
3. Prueba manualmente con un Excel real (subida, buscador, calendario; share si aplica).
4. Abre un Pull Request hacia `master` con descripción breve y pasos para probar.

## Despliegue

No hace falta desplegar manualmente para mergear: Vercel construye desde `master`. Si tienes acceso al proyecto Vercel, las variables `VITE_*` deben existir **antes** del build de producción.

## Documentación relacionada

- [SPA.md](SPA.md) — arquitectura, Excel, Supabase, producción
- `docs/Prototype/index.html` — prototipo HTML original (referencia histórica)
- `docs/Sprint-0-NoAprobado/` — diseño futuro no implementado en este SPA
