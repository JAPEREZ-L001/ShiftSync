import type { Day } from '../types'
import { formatDateLong, relativeDayLabel, stripTime } from '../lib/utils'

interface NextRestCardProps {
  nextRest: Day | null
}

export function NextRestCard({ nextRest }: NextRestCardProps) {
  const now = new Date()
  
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Próximo descanso</h2>
      <div className="mt-2">
        {nextRest ? (
          <>
            <div className="text-xs text-sky-300">
              {relativeDayLabel(stripTime(nextRest.date), stripTime(now))}
            </div>
            <div className="mt-1 text-base font-medium text-slate-100">
              {formatDateLong(nextRest.date)}
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-500">
            No hay días libres futuros registrados en los datos cargados.
          </div>
        )}
      </div>
    </div>
  )
}
