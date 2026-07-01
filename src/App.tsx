import { useSchedule } from './hooks/useSchedule'
import { Header } from './components/Header'
import { WarningBanner } from './components/WarningBanner'
import { EmptyState } from './components/EmptyState'
import { ErrorState } from './components/ErrorState'
import { Dashboard } from './components/Dashboard'
import { EmployeePicker } from './components/EmployeePicker'
import { ShareBar } from './components/ShareBar'

export default function App() {
  const schedule = useSchedule()
  const isEditMode = schedule.mode === 'edit'

  if (schedule.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <Header
        subtitle={schedule.headerSubtitle}
        showChangeFile={isEditMode && schedule.hasData}
        onChangeFile={schedule.triggerFileInput}
      />

      {!isEditMode && (
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">
          Estás viendo un horario compartido en modo solo lectura.
          <button
            onClick={() => window.location.href = window.location.pathname}
            className="ml-2 underline hover:text-sky-100"
          >
            Cargar tu propio archivo
          </button>
        </div>
      )}

      <WarningBanner
        skipped={schedule.skipped}
        unknownDaysCount={schedule.stats?.unknownDaysCount ?? 0}
      />

      {schedule.error && (
        <ErrorState message={schedule.error} />
      )}

      {isEditMode && !schedule.hasData && !schedule.error && (
        <EmptyState
          onPickFile={schedule.triggerFileInput}
          onFileDrop={schedule.handleFile}
        />
      )}

      {isEditMode && schedule.hasData && schedule.availableNames.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EmployeePicker
            value={schedule.targetName}
            availableNames={schedule.availableNames}
            onChange={schedule.setTargetName}
          />
          <ShareBar
            targetName={schedule.targetName}
            monthEntries={schedule.monthEntries}
            shareId={schedule.shareId}
            onShareIdChange={schedule.setShareId}
          />
        </div>
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

      {isEditMode && (
        <input
          ref={schedule.fileInputRef}
          id="fileInput"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => schedule.handleFile(e.target.files?.[0] ?? null)}
        />
      )}

      <footer className="pt-2 text-center text-xs text-slate-600">
        {isEditMode 
          ? 'Procesado localmente en tu navegador con SheetJS · sin backend, sin instalación.'
          : 'Horario compartido · solo lectura'
        }
      </footer>
    </div>
  )
}
