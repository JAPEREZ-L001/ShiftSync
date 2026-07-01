import type { StatusType } from '../types'
import { STATUS_META } from '../lib/constants'

interface StatusChipProps {
  type: StatusType
}

export function StatusChip({ type }: StatusChipProps) {
  const meta = STATUS_META[type]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.bg} ${meta.text}`}>
      {meta.emoji} {meta.label}
    </span>
  )
}
