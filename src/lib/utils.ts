import { WEEKDAY_FULL, MONTH_NAMES_ES } from './constants'

export function normalize(str: string | null | undefined): string {
  return (str || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase().replace(/\s+/g, ' ')
}

export function namesMatch(a: string, b: string): boolean {
  return normalize(a) === normalize(b)
}

export function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function excelDateToLocalMidnight(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

export function toKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function withTime(localMidnight: Date, h: number, m: number, dayOffset: number = 0): Date {
  const d = new Date(localMidnight)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  return d
}

export function formatDateLong(d: Date): string {
  const wd = WEEKDAY_FULL[(d.getDay() + 6) % 7]
  return `${wd} ${d.getDate()} de ${MONTH_NAMES_ES[d.getMonth()]}`
}

export function formatDateShort(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES_ES[d.getMonth()].slice(0, 3)}`
}

export function relativeDayLabel(dateLocalMidnight: Date, todayLocalMidnight: Date): string {
  const diffDays = Math.round((dateLocalMidnight.getTime() - todayLocalMidnight.getTime()) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Mañana'
  if (diffDays > 1) return `En ${diffDays} días`
  return `Hace ${-diffDays} días`
}

export function fmtHours(h: number | null | undefined): string {
  if (h === null || h === undefined || !isFinite(h)) return '—'
  const sign = h < 0 ? '-' : ''
  h = Math.abs(h)
  let hh = Math.floor(h)
  let mm = Math.round((h - hh) * 60)
  if (mm === 60) { mm = 0; hh += 1 }
  return `${sign}${hh}h ${mm}m`
}
