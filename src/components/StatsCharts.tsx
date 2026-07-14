import { useMemo } from 'react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend
} from 'recharts'
import type { MonthStats, Day } from '../types'
import { SLEEP_HOURS_TARGET } from '../lib/constants'

interface StatsChartsProps {
  stats: MonthStats
  targetDays: Day[]
}

const COLORS = {
  trabajo: '#34d399',
  descanso: '#38bdf8',
  vacaciones: '#fbbf24',
  desconocido: '#94a3b8'
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  fontSize: '12px'
}

export function StatsCharts({ stats, targetDays }: StatsChartsProps) {
  const distributionData = useMemo(() => [
    { name: 'Trabajo', value: stats.shiftsCount, color: COLORS.trabajo },
    { name: 'Descanso', value: stats.restDaysCount, color: COLORS.descanso },
    { name: 'Vacaciones', value: stats.vacationDaysCount, color: COLORS.vacaciones },
    { name: 'Sin datos', value: stats.unknownDaysCount, color: COLORS.desconocido }
  ].filter(d => d.value > 0), [stats])

  const weeklyHoursData = useMemo(() => {
    const weeks: { week: string; hours: number }[] = []
    let currentWeek = 1
    let weekHours = 0

    targetDays.forEach((day, i) => {
      const dayOfWeek = (day.date.getDay() + 6) % 7
      
      if (dayOfWeek === 0 && i > 0) {
        weeks.push({ week: `Sem ${currentWeek}`, hours: Math.round(weekHours * 10) / 10 })
        currentWeek++
        weekHours = 0
      }

      if (day.type === 'trabajo' && day.durationHours) {
        weekHours += day.durationHours
      }
    })

    if (weekHours > 0 || weeks.length === 0) {
      weeks.push({ week: `Sem ${currentWeek}`, hours: Math.round(weekHours * 10) / 10 })
    }

    return weeks
  }, [targetDays])

  const sleepGapsData = useMemo(() => {
    return stats.sleepGaps.map((gap, i) => ({
      name: `T${i + 1}`,
      fullLabel: `T${i + 1} → T${i + 2}`,
      hours: Math.round(gap * 10) / 10,
      fill: gap >= SLEEP_HOURS_TARGET ? '#34d399' : '#f87171'
    }))
  }, [stats.sleepGaps])

  const sleepChartWidth = Math.max(sleepGapsData.length * 36, 280)

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Estadísticas visuales</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Distribución de días</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="45%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Horas por semana</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyHoursData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} width={32} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value) => [`${value}h`, 'Horas']}
                cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Horas entre turnos (meta: {SLEEP_HOURS_TARGET}h)
          </h3>
          {sleepGapsData.length > 0 ? (
            <>
              <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
                <div style={{ width: sleepChartWidth, height: 220 }}>
                  <BarChart
                    width={sleepChartWidth}
                    height={220}
                    data={sleepGapsData}
                    margin={{ top: 8, right: 8, left: -12, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} width={28} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: '#e2e8f0' }}
                      formatter={(value) => [`${value}h`, 'Disponible']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ''}
                      cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                    />
                    <ReferenceLine y={SLEEP_HOURS_TARGET} stroke="#fbbf24" strokeDasharray="5 5" />
                    <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={24}>
                      {sleepGapsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              </div>
              <div className="mt-2 flex justify-center items-center gap-2 text-xs text-amber-400">
                <span className="inline-block w-4 border-t-2 border-dashed border-amber-400" />
                <span>Meta: {SLEEP_HOURS_TARGET}h · deslizá para ver todos los turnos</span>
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">
              No hay suficientes turnos consecutivos para mostrar huecos de sueño.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
