import { useState } from 'react'
import type { MonthEntry } from '../types'
import { createSchedule } from '../lib/share'

interface ShareBarProps {
  targetName: string
  monthEntries: MonthEntry[]
  shareId: string | null
  onShareIdChange: (id: string) => void
}

export function ShareBar({ targetName, monthEntries, shareId, onShareIdChange }: ShareBarProps) {
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shareUrl = shareId ? `${window.location.origin}${window.location.pathname}?s=${shareId}` : null

  const handleSave = async () => {
    if (!targetName || !monthEntries.length) return
    
    setSaving(true)
    setError(null)
    
    try {
      const id = await createSchedule(targetName, monthEntries)
      if (id) {
        onShareIdChange(id)
      } else {
        setError('No se pudo guardar. Intenta de nuevo.')
      }
    } catch {
      setError('Error al guardar el horario.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('No se pudo copiar al portapapeles.')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Compartir horario</h2>
      
      {error && (
        <p className="text-sm text-rose-400 mb-3">{error}</p>
      )}

      {!shareId ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-400">
            Guarda este horario para compartirlo con tus compañeros. Se generará un enlace único.
          </p>
          <button
            onClick={handleSave}
            disabled={saving || !targetName || !monthEntries.length}
            className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar y generar enlace'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl ?? ''}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 truncate"
            />
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Cualquier persona con este enlace podrá ver el horario de {targetName} (solo lectura).
          </p>
        </div>
      )}
    </div>
  )
}
