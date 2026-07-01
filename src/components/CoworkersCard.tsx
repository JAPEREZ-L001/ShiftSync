import type { MonthEntry } from '../types'
import { getCoworkerMatches } from '../lib/stats'
import { formatDateLong, fromKey, toTitleCase } from '../lib/utils'

interface CoworkersCardProps {
  month: MonthEntry
  selectedDateKey: string | null
}

export function CoworkersCard({ month, selectedDateKey }: CoworkersCardProps) {
  if (!selectedDateKey) return null

  const info = getCoworkerMatches(month, selectedDateKey)
  const dateLabel = formatDateLong(fromKey(selectedDateKey))

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Compañeros de turno</h2>
      <p className="mt-1 text-xs text-slate-500">
        Mostrando {dateLabel} · tocá cualquier día del calendario o la agenda para ver otro
      </p>
      <div className="mt-3">
        {!info.applicable ? (
          <div className="text-sm text-slate-500">
            Ese día no es un turno de trabajo, así que no aplica la comparación de compañeros.
          </div>
        ) : !info.matches?.length ? (
          <div className="text-sm text-slate-400">
            No hay compañeros coincidiendo en este turno.
          </div>
        ) : (
          <ul className="space-y-2">
            {info.matches.map(m => (
              <li
                key={m.name}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
              >
                <span className="text-sm text-slate-200">{toTitleCase(m.name)}</span>
                <span className="font-mono text-sm text-slate-400">{m.raw}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
