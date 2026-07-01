import type { MonthEntry } from '../types'
import { toTitleCase } from '../lib/utils'

interface MonthTabsProps {
  monthEntries: MonthEntry[]
  activeMonthIndex: number
  onMonthChange: (index: number) => void
}

export function MonthTabs({ monthEntries, activeMonthIndex, onMonthChange }: MonthTabsProps) {
  if (monthEntries.length < 2) return null

  return (
    <div className="flex gap-2">
      {monthEntries.map((m, i) => {
        const active = i === activeMonthIndex
        return (
          <button
            key={i}
            type="button"
            onClick={() => onMonthChange(i)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {toTitleCase(m.sheetName)}
          </button>
        )
      })}
    </div>
  )
}
