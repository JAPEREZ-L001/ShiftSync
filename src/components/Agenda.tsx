import type { MonthEntry, Day } from '../types'
import { WEEKDAY_FULL, MONTH_NAMES_ES } from '../lib/constants'
import { toKey } from '../lib/utils'
import { StatusChip } from './StatusChip'

interface AgendaProps {
  month: MonthEntry
  selectedDateKey: string | null
  onDateSelect: (key: string) => void
}

function buildMonthGrid(month: MonthEntry): (Day | null)[] {
  const dayMap = new Map<number, Day>()
  month.targetDays.forEach(d => dayMap.set(d.date.getDate(), d))
  
  const year = month.year ?? new Date().getFullYear()
  const monthIndex = month.monthIndex ?? 0
  const firstOfMonth = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7

  const cells: (Day | null)[] = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let dnum = 1; dnum <= daysInMonth; dnum++) {
    cells.push(dayMap.get(dnum) || { 
      date: new Date(year, monthIndex, dnum), 
      type: 'desconocido', 
      raw: '' 
    })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function AgendaCard({ day, isSelected, onClick }: { day: Day; isSelected: boolean; onClick: () => void }) {
  const wd = WEEKDAY_FULL[(day.date.getDay() + 6) % 7]
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[132px] shrink-0 rounded-xl border p-3 text-left transition-colors ${
        isSelected
          ? 'border-indigo-400 bg-indigo-500/10'
          : 'border-slate-800 bg-slate-900/60 hover:border-indigo-400/40'
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">{wd}</div>
      <div className="text-sm font-medium text-slate-200">
        {day.date.getDate()} {MONTH_NAMES_ES[day.date.getMonth()].slice(0, 3)}
      </div>
      {day.type === 'trabajo' ? (
        <div className="font-mono text-sm text-slate-200 mt-1">{day.raw}</div>
      ) : (
        <div className="text-sm text-slate-500 mt-1">—</div>
      )}
      <div className="mt-2">
        <StatusChip type={day.type} />
      </div>
    </button>
  )
}

export function Agenda({ month, selectedDateKey, onDateSelect }: AgendaProps) {
  const cells = buildMonthGrid(month)
  const weeks: (Day | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Agenda semanal</h2>
      <div className="space-y-4">
        {weeks.map((week, weekIdx) => {
          const real = week.filter((d): d is Day => d !== null)
          if (!real.length) return null
          const label = `${real[0].date.getDate()} – ${real[real.length - 1].date.getDate()} de ${MONTH_NAMES_ES[real[0].date.getMonth()]}`
          
          return (
            <div key={weekIdx}>
              <div className="text-xs text-slate-500 mb-2">{label}</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {real.map(day => (
                  <AgendaCard
                    key={toKey(day.date)}
                    day={day}
                    isSelected={toKey(day.date) === selectedDateKey}
                    onClick={() => onDateSelect(toKey(day.date))}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
