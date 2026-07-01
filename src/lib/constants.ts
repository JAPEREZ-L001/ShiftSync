import type { StatusType, StatusMeta } from '../types'

export const REST_VALUE = 'Libre'
export const TARGET_EMPLOYEE = 'PEREZ LOPEZ JOSUE ADONAI'
export const WATCHED_COWORKERS = ['DUEÑAS MEJIA CARLOS ANTONIO', 'OCHOA VASQUEZ LUIS GERARDO']
export const SLEEP_HOURS_TARGET = 8
export const SHIFT_PATTERN = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/

export const WEEKDAY_FULL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
export const MONTH_NAMES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export const STATUS_META: Record<StatusType, StatusMeta> = {
  trabajo:     { emoji: '🟢', label: 'Trabajo',    text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  descanso:    { emoji: '🔵', label: 'Descanso',   text: 'text-sky-400',     bg: 'bg-sky-500/10' },
  vacaciones:  { emoji: '🟡', label: 'Vacaciones', text: 'text-amber-300',   bg: 'bg-amber-400/10' },
  desconocido: { emoji: '⚪', label: 'Sin datos',  text: 'text-slate-400',   bg: 'bg-slate-500/10' }
}
