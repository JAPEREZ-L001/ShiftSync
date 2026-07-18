export interface ShiftInfo {
  type: 'trabajo' | 'descanso' | 'vacaciones' | 'desconocido'
  raw: string
  startH?: number
  startM?: number
  endH?: number
  endM?: number
  crosses?: boolean
  durationHours?: number
}

export interface Day extends ShiftInfo {
  date: Date
  startDateTime?: Date
  endDateTime?: Date
}

export interface MonthEntry {
  sheetName: string
  department: string
  employeeName: string
  year: number | null
  monthIndex: number | null
  targetDays: Day[]
  coworkerDaysByName: Record<string, Day[]>
}

export interface SkippedSheet {
  sheetName: string
  reason: string
}

export interface ParseResult {
  monthEntries: MonthEntry[]
  skipped: SkippedSheet[]
}

export interface Employee {
  department: string
  name: string
  days: Day[]
}

export interface ParsedSheet {
  sheetName: string
  year: number | null
  monthIndex: number | null
  employees: Employee[]
}

export interface ParsedWorkbook {
  sheets: ParsedSheet[]
  allNames: string[]
  skipped: SkippedSheet[]
}

export interface MonthStats {
  totalWorkedHours: number
  shiftsCount: number
  avgShiftHours: number | null
  longestShifts: Day[]
  shortestShifts: Day[]
  restDaysCount: number
  vacationDaysCount: number
  unknownDaysCount: number
  longestStreak: number
}

export interface CoworkerMatch {
  name: string
  raw: string
}

export interface CoworkerMatchResult {
  applicable: boolean
  targetDay: Day | null
  matches?: CoworkerMatch[]
}

export type StatusType = 'trabajo' | 'descanso' | 'vacaciones' | 'desconocido'

export interface StatusMeta {
  emoji: string
  label: string
  text: string
  bg: string
}
