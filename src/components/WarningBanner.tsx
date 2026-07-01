import type { SkippedSheet } from '../types'
import { toTitleCase } from '../lib/utils'

interface WarningBannerProps {
  skipped: SkippedSheet[]
  unknownDaysCount: number
}

export function WarningBanner({ skipped, unknownDaysCount }: WarningBannerProps) {
  const items: string[] = skipped.map(s => `«${toTitleCase(s.sheetName)}»: ${s.reason}`)
  
  if (unknownDaysCount > 0) {
    items.push(`Este mes tiene ${unknownDaysCount} día(s) con un valor no reconocido en el Excel (ni "Libre" ni un horario válido); no se contaron como trabajo, descanso ni vacaciones.`)
  }

  if (!items.length) return null

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
