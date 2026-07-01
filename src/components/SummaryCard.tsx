import type { MonthEntry, MonthStats } from '../types'
import { toTitleCase } from '../lib/utils'
import { MONTH_NAMES_ES } from '../lib/constants'

interface SummaryCardProps {
  month: MonthEntry
  stats: MonthStats
}

export function SummaryCard({ month, stats }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Resumen</h2>
      <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Nombre</dt>
          <dd className="text-slate-200">{toTitleCase(month.employeeName)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Departamento</dt>
          <dd className="text-slate-200">{month.department}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Mes</dt>
          <dd className="text-slate-200">
            {month.monthIndex !== null ? toTitleCase(MONTH_NAMES_ES[month.monthIndex]) : '—'} {month.year}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Total turnos</dt>
          <dd className="text-slate-200 font-mono">{stats.shiftsCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Días libres</dt>
          <dd className="text-slate-200 font-mono">{stats.restDaysCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Vacaciones</dt>
          <dd className="text-slate-200 font-mono">{stats.vacationDaysCount}</dd>
          {stats.vacationDaysCount === 0 && (
            <dd className="text-xs text-slate-500">(sin datos de vacaciones en el archivo)</dd>
          )}
        </div>
      </dl>
    </div>
  )
}
