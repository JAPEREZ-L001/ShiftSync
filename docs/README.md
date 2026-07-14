# ShiftSync

**Tu horario de turnos, claro y al alcance de un clic.**

ShiftSync es una mini SPA que convierte el Excel de turnos de tu equipo en un dashboard interactivo: calendario, estadísticas, compañeros de turno y enlaces para compartir. Todo el parseo del archivo ocurre en tu navegador; el Excel nunca se sube tal cual.

---

## En vivo

| | |
|---|---|
| **App** | [shiftsync-rho-neon.vercel.app](https://shiftsync-rho-neon.vercel.app) |
| **Código** | [github.com/JAPEREZ-L001/ShiftSync](https://github.com/JAPEREZ-L001/ShiftSync) |

---

## Qué puedes hacer hoy

- **Subir un `.xlsx`** y ver el horario al instante, sin instalar nada.
- **Buscar cualquier empleado** del archivo con autocompletado (no solo uno fijo).
- **Explorar el mes** con calendario, agenda semanal y tarjetas de resumen.
- **Consultar estadísticas** en texto y con gráficas (horas, descansos, huecos entre turnos).
- **Compartir un enlace** de solo lectura (`?s=…`) para que un compañero vea su horario guardado.

---

## Cómo funciona (en 30 segundos)

```
Excel en tu PC  →  SheetJS en el navegador  →  Dashboard React
                              ↓
                    (opcional) Supabase  →  link compartible
```

1. Arrastrás o elegís el archivo Excel.
2. Elegís de quién querés ver el horario.
3. Navegás meses, días y métricas.
4. Si querés compartir, guardás y copiás el link generado.

---

## Documentación

| Guía | Contenido |
|------|-----------|
| **[SPA — producción y arquitectura](SPA.md)** | Stack, formato del Excel, Supabase, variables de entorno, despliegue en Vercel y limitaciones actuales. |
| **[Contribuir](CONTRIBUTING.md)** | Clonar el repo, correr en local, dónde tocar el código y flujo para pull requests. |

También en el repo:

- `docs/Prototype/index.html` — prototipo HTML original (referencia).
- `docs/Sprint-0-NoAprobado/` — diseño futuro aún no implementado en este SPA.

---

## Stack (resumen)

React 19 · TypeScript · Vite · Tailwind CSS v4 · SheetJS · Recharts · Supabase · Vercel

---

## Arranque rápido para desarrolladores

```bash
git clone https://github.com/JAPEREZ-L001/ShiftSync.git
cd ShiftSync
npm install
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173). Para probar «Guardar y compartir», configurá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` — detalles en [SPA.md](SPA.md).

---

¿Primera vez acá? Empezá por **[SPA.md](SPA.md)**. ¿Querés meter mano al código? Seguí **[CONTRIBUTING.md](CONTRIBUTING.md)**.
