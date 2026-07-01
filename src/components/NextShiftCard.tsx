import type { Day } from '../types'
import { formatDateLong, relativeDayLabel, stripTime } from '../lib/utils'

interface NextShiftCardProps {
  nextShift: Day | null
}

export function NextShiftCard({ nextShift }: NextShiftCardProps) {
  const now = new Date()
  
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Próximo turno</h2>
      <div className="mt-2">
        {nextShift ? (
          <>
            <div className="text-xs text-indigo-300">
              {relativeDayLabel(stripTime(nextShift.date), stripTime(now))}
            </div>
            <div className="mt-1 text-base font-medium text-slate-100">
              {formatDateLong(nextShift.date)}
            </div>
            <div className="mt-1 font-mono text-lg text-slate-200">{nextShift.raw}</div>
          </>
        ) : (
          <div className="text-sm text-slate-500">
            No hay turnos futuros registrados en los datos cargados.
          </div>
        )}
      </div>
    </div>
  )
}
