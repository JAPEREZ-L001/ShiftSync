import type { MonthEntry, MonthStats, Day } from '../types'
import { MonthTabs } from './MonthTabs'
import { DashboardCards } from './DashboardCards'
import { SummaryCard } from './SummaryCard'
import { Calendar } from './Calendar'
import { Agenda } from './Agenda'
import { NextShiftCard } from './NextShiftCard'
import { NextRestCard } from './NextRestCard'
import { CoworkersCard } from './CoworkersCard'
import { StatsSection } from './StatsSection'
import { StatsCharts } from './StatsCharts'

interface DashboardProps {
  monthEntries: MonthEntry[]
  activeMonthIndex: number
  activeMonth: MonthEntry
  stats: MonthStats
  selectedDateKey: string | null
  nextShift: Day | null
  nextRest: Day | null
  onMonthChange: (index: number) => void
  onDateSelect: (key: string) => void
}

export function Dashboard({
  monthEntries,
  activeMonthIndex,
  activeMonth,
  stats,
  selectedDateKey,
  nextShift,
  nextRest,
  onMonthChange,
  onDateSelect
}: DashboardProps) {
  return (
    <div className="space-y-6">
      <MonthTabs
        monthEntries={monthEntries}
        activeMonthIndex={activeMonthIndex}
        onMonthChange={onMonthChange}
      />

      <DashboardCards stats={stats} nextShift={nextShift} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SummaryCard month={activeMonth} stats={stats} />
          <Calendar
            month={activeMonth}
            selectedDateKey={selectedDateKey}
            onDateSelect={onDateSelect}
          />
          <Agenda
            month={activeMonth}
            selectedDateKey={selectedDateKey}
            onDateSelect={onDateSelect}
          />
          <StatsCharts stats={stats} targetDays={activeMonth.targetDays} />
        </div>

        <div className="space-y-6">
          <NextShiftCard nextShift={nextShift} />
          <NextRestCard nextRest={nextRest} />
          <CoworkersCard month={activeMonth} selectedDateKey={selectedDateKey} />
          <StatsSection stats={stats} />
        </div>
      </div>
    </div>
  )
}
