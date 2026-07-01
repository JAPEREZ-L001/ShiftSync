import { useSchedule } from './hooks/useSchedule'
import { Header } from './components/Header'
import { WarningBanner } from './components/WarningBanner'
import { EmptyState } from './components/EmptyState'
import { ErrorState } from './components/ErrorState'
import { Dashboard } from './components/Dashboard'

export default function App() {
  const schedule = useSchedule()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Header
        subtitle={schedule.headerSubtitle}
        showChangeFile={schedule.hasData}
        onChangeFile={schedule.triggerFileInput}
      />

      <WarningBanner
        skipped={schedule.skipped}
        unknownDaysCount={schedule.stats?.unknownDaysCount ?? 0}
      />

      {schedule.error && (
        <ErrorState message={schedule.error} />
      )}

      {!schedule.hasData && !schedule.error && (
        <EmptyState
          onPickFile={schedule.triggerFileInput}
          onFileDrop={schedule.handleFile}
        />
      )}

      {schedule.hasData && schedule.activeMonth && schedule.stats && (
        <Dashboard
          monthEntries={schedule.monthEntries}
          activeMonthIndex={schedule.activeMonthIndex}
          activeMonth={schedule.activeMonth}
          stats={schedule.stats}
          selectedDateKey={schedule.selectedDateKey}
          nextShift={schedule.nextShift}
          nextRest={schedule.nextRest}
          onMonthChange={schedule.setActiveMonth}
          onDateSelect={schedule.setSelectedDate}
        />
      )}

      <input
        ref={schedule.fileInputRef}
        id="fileInput"
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => schedule.handleFile(e.target.files?.[0] ?? null)}
      />

      <footer className="pt-2 text-center text-xs text-slate-600">
        Procesado localmente en tu navegador con SheetJS · sin backend, sin instalación.
      </footer>
    </div>
  )
}
