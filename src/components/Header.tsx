interface HeaderProps {
  subtitle: string
  showChangeFile: boolean
  onChangeFile: () => void
}

export function Header({ subtitle, showChangeFile, onChangeFile }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Horario de turnos</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {showChangeFile && (
          <button
            onClick={onChangeFile}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 hover:border-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Cambiar archivo
          </button>
        )}
      </div>
    </header>
  )
}
