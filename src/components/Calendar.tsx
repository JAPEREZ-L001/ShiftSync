import type { MonthEntry, Day } from '../types'
import { STATUS_META } from '../lib/constants'
import { toKey, stripTime } from '../lib/utils'

interface CalendarProps {
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

function CalendarCell({ 
  cell, 
  isSelected, 
  isToday, 
  onClick 
}: { 
  cell: Day | null
  isSelected: boolean
  isToday: boolean
  onClick?: () => void 
}) {
  if (!cell) return <div />
  
  const meta = STATUS_META[cell.type]
  const ring = isSelected 
    ? 'ring-2 ring-indigo-400' 
    : (isToday ? 'ring-1 ring-slate-500' : 'ring-1 ring-slate-800')

  return (
    <button
      type="button"
      onClick={onClick}
      className={`aspect-square w-full rounded-lg ${ring} ${meta.bg} p-1.5 sm:p-2 flex flex-col items-start text-left hover:ring-indigo-400/60 transition-colors`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-xs sm:text-sm font-mono text-slate-200">{cell.date.getDate()}</span>
        <span className="text-[10px] sm:text-xs">{meta.emoji}</span>
      </div>
      {cell.type === 'trabajo' && (
        <div className="mt-1 text-[10px] sm:text-xs font-mono text-slate-400 truncate">
          {cell.raw}
        </div>
      )}
    </button>
  )
}

export function Calendar({ month, selectedDateKey, onDateSelect }: CalendarProps) {
  const cells = buildMonthGrid(month)
  const todayKey = toKey(stripTime(new Date()))
  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Calendario mensual</h2>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {weekdays.map(w => (
          <div key={w} className="text-center text-xs text-slate-500">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          const key = cell ? toKey(cell.date) : `blank-${i}`
          return (
            <CalendarCell
              key={key}
              cell={cell}
              isSelected={key === selectedDateKey}
              isToday={key === todayKey}
              onClick={cell ? () => onDateSelect(toKey(cell.date)) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
