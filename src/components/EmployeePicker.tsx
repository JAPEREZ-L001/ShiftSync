import { useState, useCallback, useId } from 'react'
import { toTitleCase } from '../lib/utils'

interface EmployeePickerProps {
  value: string
  availableNames: string[]
  onChange: (name: string) => void
}

export function EmployeePicker({ value, availableNames, onChange }: EmployeePickerProps) {
  const [inputValue, setInputValue] = useState(value ? toTitleCase(value) : '')
  const listId = useId()

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleSelect = useCallback(() => {
    const match = availableNames.find(
      name => name.toLowerCase() === inputValue.toLowerCase() ||
              toTitleCase(name).toLowerCase() === inputValue.toLowerCase()
    )
    if (match && match !== value) {
      onChange(match)
      setInputValue(toTitleCase(match))
    }
  }, [inputValue, availableNames, value, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSelect()
    }
  }, [handleSelect])

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Buscar empleado</h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          list={listId}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleSelect}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un nombre..."
          className="min-w-0 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-400 focus:outline-none transition-colors sm:flex-1"
        />
        <datalist id={listId}>
          {availableNames.map(name => (
            <option key={name} value={toTitleCase(name)} />
          ))}
        </datalist>
        <button
          onClick={handleSelect}
          className="w-full shrink-0 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition-colors sm:w-auto"
        >
          Buscar
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {availableNames.length} empleado(s) disponibles en el archivo cargado
      </p>
    </div>
  )
}
