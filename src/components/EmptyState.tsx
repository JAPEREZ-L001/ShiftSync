import { useState, useCallback } from 'react'

interface EmptyStateProps {
  onPickFile: () => void
  onFileDrop: (file: File | null) => void
}

export function EmptyState({ onPickFile, onFileDrop }: EmptyStateProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    onFileDrop(e.dataTransfer.files[0] ?? null)
  }, [onFileDrop])

  return (
    <div
      onClick={onPickFile}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border border-dashed bg-slate-900/40 p-10 text-center cursor-pointer transition-colors ${
        isDragging ? 'border-indigo-400' : 'border-slate-700'
      }`}
    >
      <p className="text-slate-300 font-medium">Arrastrá tu archivo .xlsx aquí, o hacé clic para elegirlo</p>
      <p className="mt-1 text-sm text-slate-500">Todo se procesa en tu navegador. El archivo nunca se envía a ningún servidor.</p>
      <button
        onClick={(e) => { e.stopPropagation(); onPickFile() }}
        className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition-colors"
      >
        Elegir archivo
      </button>
    </div>
  )
}
