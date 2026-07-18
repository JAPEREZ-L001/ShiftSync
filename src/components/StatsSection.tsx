import type { Day, MonthStats } from '../types'
import { fmtHours, formatDateShort } from '../lib/utils'

interface StatsSectionProps {
  stats: MonthStats
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-800/70 last:border-0">
      <span className="min-w-0 flex-1 text-sm text-slate-400 leading-snug">{label}</span>
      <span className="max-w-[60%] shrink-0 text-right text-sm font-mono text-slate-200 leading-snug">{value}</span>
    </div>
  )
}

function formatExtremeShifts(shifts: Day[]): string {
  if (!shifts.length) return '—'
  const hours = fmtHours(shifts[0].durationHours ?? null)
  const dates = shifts.map(d => formatDateShort(d.date)).join(', ')
  return `${hours} (${dates})`
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
          label={stats.longestShifts.length > 1 ? 'Turnos más largos' : 'Turno más largo'}
          value={formatExtremeShifts(stats.longestShifts)}
        />
        <StatRow
          label={stats.shortestShifts.length > 1 ? 'Turnos más cortos' : 'Turno más corto'}
          value={formatExtremeShifts(stats.shortestShifts)}
        />

        <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wide mb-1 mt-4">Descanso</h3>
        <StatRow label="Días libres" value={String(stats.restDaysCount)} />
        <StatRow label="Vacaciones" value={String(stats.vacationDaysCount)} />
        <StatRow label="Días consecutivos trabajados (máx.)" value={String(stats.longestStreak)} />
      </div>
    </div>
  )
}
