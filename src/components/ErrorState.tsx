interface ErrorStateProps {
  message: string
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
      <p className="font-medium">No se pudo procesar el archivo</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  )
}
