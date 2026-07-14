import type { MonthStats } from '../types'
import { fmtHours, formatDateShort } from '../lib/utils'
import { SLEEP_HOURS_TARGET } from '../lib/constants'

interface StatsSectionProps {
  stats: MonthStats
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-800/70 last:border-0">
      <span className="min-w-0 flex-1 text-sm text-slate-400 leading-snug">{label}</span>
      <span className="shrink-0 whitespace-nowrap text-right text-sm font-mono text-slate-200">{value}</span>
    </div>
  )
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Estadísticas</h2>
      <div className="mt-2">
        <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">Trabajo</h3>
        <StatRow label="Horas trabajadas este mes" value={fmtHours(stats.totalWorkedHours)} />
        <StatRow label="Número de turnos" value={String(stats.shiftsCount)} />
        <StatRow label="Promedio por turno" value={fmtHours(stats.avgShiftHours)} />
        <StatRow
          label="Turno más largo"
          value={stats.longestShift ? `${fmtHours(stats.longestShift.durationHours ?? null)} (${formatDateShort(stats.longestShift.date)})` : '—'}
        />
        <StatRow
          label="Turno más corto"
          value={stats.shortestShift ? `${fmtHours(stats.shortestShift.durationHours ?? null)} (${formatDateShort(stats.shortestShift.date)})` : '—'}
        />

        <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wide mb-1 mt-4">Descanso</h3>
        <StatRow label="Días libres" value={String(stats.restDaysCount)} />
        <StatRow label="Vacaciones" value={String(stats.vacationDaysCount)} />
        <StatRow label="Días consecutivos trabajados (máx.)" value={String(stats.longestStreak)} />

        <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wide mb-1 mt-4">
          Sueño (meta: {SLEEP_HOURS_TARGET}h/día)
        </h3>
        <StatRow label="Promedio disponible entre turnos" value={fmtHours(stats.avgSleepGap)} />
        <StatRow
          label={`Días con menos de ${SLEEP_HOURS_TARGET}h`}
          value={stats.sleepGaps.length ? String(stats.daysBelowTarget) : '—'}
        />
        <StatRow
          label={`Días con ${SLEEP_HOURS_TARGET}h o más`}
          value={stats.sleepGaps.length ? String(stats.daysAtOrAboveTarget) : '—'}
        />
        {!stats.sleepGaps.length && (
          <p className="text-xs text-slate-500 mt-1">
            No hay suficientes turnos consecutivos este mes para calcular huecos de sueño.
          </p>
        )}
        <p className="text-xs text-slate-500 mt-2">
          El primer turno del mes no tiene un turno anterior dentro del mismo mes, así que ese hueco no se cuenta.
        </p>
      </div>
    </div>
  )
}
