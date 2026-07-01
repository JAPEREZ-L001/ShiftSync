import type { MonthStats, Day } from '../types'
import { fmtHours, formatDateShort } from '../lib/utils'

interface DashboardCardsProps {
  stats: MonthStats
  nextShift: Day | null
}

function DashboardCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-mono font-semibold text-slate-100">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

export function DashboardCards({ stats, nextShift }: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <DashboardCard label="Horas trabajadas" value={fmtHours(stats.totalWorkedHours)} sub="este mes" />
      <DashboardCard label="Promedio por turno" value={fmtHours(stats.avgShiftHours)} sub="este mes" />
      <DashboardCard label="Días libres" value={String(stats.restDaysCount)} sub="este mes" />
      <DashboardCard
        label="Próximo turno"
        value={nextShift ? formatDateShort(nextShift.date) : '—'}
        sub={nextShift ? nextShift.raw : 'sin datos'}
      />
      <DashboardCard label="Horas p/ dormir" value={fmtHours(stats.avgSleepGap)} sub="promedio este mes" />
    </div>
  )
}
