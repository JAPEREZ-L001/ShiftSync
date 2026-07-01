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
    let weekStart = 0
    let weekHours = 0

    targetDays.forEach((day, i) => {
      const dayOfWeek = (day.date.getDay() + 6) % 7
      
      if (dayOfWeek === 0 && i > 0) {
        weeks.push({ week: `Sem ${currentWeek}`, hours: Math.round(weekHours * 10) / 10 })
        currentWeek++
        weekHours = 0
        weekStart = i
      }

      if (day.type === 'trabajo' && day.durationHours) {
        weekHours += day.durationHours
      }
    })

    if (weekStart < targetDays.length) {
      weeks.push({ week: `Sem ${currentWeek}`, hours: Math.round(weekHours * 10) / 10 })
    }

    return weeks
  }, [targetDays])

  const sleepGapsData = useMemo(() => {
    return stats.sleepGaps.map((gap, i) => ({
      name: `T${i + 1}→T${i + 2}`,
      hours: Math.round(gap * 10) / 10,
      fill: gap >= SLEEP_HOURS_TARGET ? '#34d399' : '#f87171'
    }))
  }, [stats.sleepGaps])

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Estadísticas visuales</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Distribución de días</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Horas por semana</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyHoursData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value) => [`${value}h`, 'Horas']}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Horas entre turnos (meta: {SLEEP_HOURS_TARGET}h)
          </h3>
          {sleepGapsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sleepGapsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => [`${value}h`, 'Disponible']}
                />
                <ReferenceLine y={SLEEP_HOURS_TARGET} stroke="#fbbf24" strokeDasharray="5 5" />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {sleepGapsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
                <Legend 
                  wrapperStyle={{ fontSize: '11px' }}
                  content={() => (
                    <div className="flex justify-center items-center gap-2 text-xs text-amber-400">
                      <span className="inline-block w-4 border-t-2 border-dashed border-amber-400"></span>
                      <span>Meta: {SLEEP_HOURS_TARGET}h</span>
                    </div>
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-slate-500">
              No hay suficientes turnos consecutivos para mostrar huecos de sueño.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
