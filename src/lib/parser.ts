import * as XLSX from 'xlsx'
import type { ShiftInfo, Day, MonthEntry, SkippedSheet, ParsedWorkbook, ParsedSheet, Employee } from '../types'
import { REST_VALUE, SHIFT_PATTERN } from './constants'
import { normalize, namesMatch, excelDateToLocalMidnight, withTime } from './utils'

export function parseShiftValue(rawInput: unknown): ShiftInfo {
  const raw = (rawInput === undefined || rawInput === null) ? '' : String(rawInput).trim()
  if (!raw) return { type: 'desconocido', raw: '' }
  if (normalize(raw) === normalize(REST_VALUE)) return { type: 'descanso', raw }

  const m = raw.match(SHIFT_PATTERN)
  if (m) {
    const startH = +m[1], startM = +m[2], endH = +m[3], endM = +m[4]
    const startMinutes = startH * 60 + startM
    let endMinutes = endH * 60 + endM
    let crosses = false
    if (endMinutes <= startMinutes) { endMinutes += 24 * 60; crosses = true }
    const durationHours = (endMinutes - startMinutes) / 60
    return { type: 'trabajo', raw, startH, startM, endH, endM, crosses, durationHours }
  }

  if (normalize(raw).includes('VACAC')) return { type: 'vacaciones', raw }
  return { type: 'desconocido', raw }
}

export function parseWorkbookAll(workbook: XLSX.WorkBook): ParsedWorkbook {
  const sheets: ParsedSheet[] = []
  const skipped: SkippedSheet[] = []
  const allNamesSet = new Set<string>()

  for (const sheetName of workbook.SheetNames) {
    try {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: '', raw: true })
      if (rows.length < 3) {
        skipped.push({ sheetName, reason: 'La hoja no tiene suficientes filas (se esperan encabezados y al menos un empleado).' })
        continue
      }

      const dateCells = (rows[1] as unknown[]).slice(2)
      if (!dateCells.some(v => v instanceof Date)) {
        skipped.push({ sheetName, reason: 'No se encontró una fila de fechas reconocible.' })
        continue
      }
      const dates = dateCells.map(v => (v instanceof Date) ? excelDateToLocalMidnight(v) : null)

      const employees: Employee[] = (rows.slice(2) as unknown[][])
        .filter(r => r && String(r[1] || '').trim() !== '')
        .map(r => {
          const department = String(r[0] || '').trim()
          const name = String(r[1] || '').trim()
          const cells = r.slice(2)
          const days: Day[] = []
          for (let i = 0; i < dates.length; i++) {
            const date = dates[i]
            if (!date) continue
            const cellValue = cells[i]
            const info = parseShiftValue(cellValue instanceof Date ? '' : cellValue)
            const day: Day = { date, ...info }
            if (day.type === 'trabajo' && day.startH !== undefined && day.startM !== undefined && day.endH !== undefined && day.endM !== undefined) {
              day.startDateTime = withTime(date, day.startH, day.startM, 0)
              day.endDateTime = withTime(date, day.endH, day.endM, day.crosses ? 1 : 0)
            }
            days.push(day)
          }
          days.sort((a, b) => a.date.getTime() - b.date.getTime())
          allNamesSet.add(name)
          return { department, name, days }
        })

      const firstDate = employees[0]?.days[0]?.date ?? null
      sheets.push({
        sheetName,
        year: firstDate ? firstDate.getFullYear() : null,
        monthIndex: firstDate ? firstDate.getMonth() : null,
        employees
      })
    } catch (err) {
      skipped.push({ sheetName, reason: 'Error al leer la hoja: ' + (err instanceof Error ? err.message : String(err)) })
    }
  }

  sheets.sort((a, b) => ((a.year ?? 0) - (b.year ?? 0)) || ((a.monthIndex ?? 0) - (b.monthIndex ?? 0)))
  
  return {
    sheets,
    allNames: Array.from(allNamesSet).sort((a, b) => a.localeCompare(b)),
    skipped
  }
}

export function buildMonthEntriesForTarget(parsed: ParsedWorkbook, targetName: string): { monthEntries: MonthEntry[], skipped: SkippedSheet[] } {
  const monthEntries: MonthEntry[] = []
  const skipped: SkippedSheet[] = [...parsed.skipped]

  for (const sheet of parsed.sheets) {
    const n1Employees = sheet.employees.filter(e => normalize(e.department).includes('N1'))
    const pool = n1Employees.length ? n1Employees : sheet.employees

    const target = pool.find(e => namesMatch(e.name, targetName))
    if (!target) {
      skipped.push({ sheetName: sheet.sheetName, reason: `No se encontró a ${targetName} en esta hoja.` })
      continue
    }

    const coworkerDaysByName: Record<string, Day[]> = {}
    for (const emp of pool) {
      if (!namesMatch(emp.name, targetName) && emp.department === target.department) {
        coworkerDaysByName[emp.name] = emp.days
      }
    }

    monthEntries.push({
      sheetName: sheet.sheetName,
      department: target.department,
      employeeName: target.name,
      year: sheet.year,
      monthIndex: sheet.monthIndex,
      targetDays: target.days,
      coworkerDaysByName
    })
  }

  return { monthEntries, skipped }
}
