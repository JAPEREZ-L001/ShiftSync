import type { Day, MonthEntry, MonthStats, CoworkerMatchResult } from '../types'
import { toKey, stripTime, normalize } from './utils'

export function computeMonthStats(monthEntry: MonthEntry): MonthStats {
  const days = monthEntry.targetDays
  const worked = days.filter(d => d.type === 'trabajo')
  const totalWorkedHours = worked.reduce((sum, d) => sum + (d.durationHours ?? 0), 0)
  const shiftsCount = worked.length
  const avgShiftHours = shiftsCount ? totalWorkedHours / shiftsCount : null

  let maxHours = -Infinity
  let minHours = Infinity
  for (const d of worked) {
    const hours = d.durationHours ?? 0
    if (hours > maxHours) maxHours = hours
    if (hours < minHours) minHours = hours
  }

  const longestShifts = Number.isFinite(maxHours)
    ? worked.filter(d => (d.durationHours ?? 0) === maxHours)
    : []
  const shortestShifts = Number.isFinite(minHours)
    ? worked.filter(d => (d.durationHours ?? 0) === minHours)
    : []

  const restDaysCount = days.filter(d => d.type === 'descanso').length
  const vacationDaysCount = days.filter(d => d.type === 'vacaciones').length
  const unknownDaysCount = days.filter(d => d.type === 'desconocido').length

  let longestStreak = 0
  let currentStreak = 0
  for (const d of days) {
    if (d.type === 'trabajo') { currentStreak += 1; longestStreak = Math.max(longestStreak, currentStreak) }
    else currentStreak = 0
  }

  return {
    totalWorkedHours, shiftsCount, avgShiftHours, longestShifts, shortestShifts,
    restDaysCount, vacationDaysCount, unknownDaysCount, longestStreak
  }
}

export function getAllTargetDaysSorted(monthEntries: MonthEntry[]): Day[] {
  return monthEntries.flatMap(m => m.targetDays)
}

export function findNextShift(allDays: Day[], now: Date): Day | null {
  for (const d of allDays) {
    if (d.type !== 'trabajo') continue
    if (d.startDateTime && d.startDateTime >= now) return d
  }
  return null
}

export function findNextRest(allDays: Day[], now: Date): Day | null {
  const todayMidnight = stripTime(now)
  for (const d of allDays) {
    if (d.type !== 'descanso') continue
    if (d.date >= todayMidnight) return d
  }
  return null
}

export function getCoworkerMatches(monthEntry: MonthEntry, dateKey: string): CoworkerMatchResult {
  const targetDay = monthEntry.targetDays.find(d => toKey(d.date) === dateKey)
  if (!targetDay || targetDay.type !== 'trabajo') return { applicable: false, targetDay: targetDay || null }

  const matches: { name: string; raw: string }[] = []
  for (const [name, days] of Object.entries(monthEntry.coworkerDaysByName)) {
    const cDay = days.find(d => toKey(d.date) === dateKey)
    if (cDay && cDay.type === 'trabajo' && normalize(cDay.raw) === normalize(targetDay.raw)) {
      matches.push({ name, raw: cDay.raw })
    }
  }
  return { applicable: true, targetDay, matches }
}
