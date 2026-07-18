import type { Day, MonthEntry, MonthStats, CoworkerMatchResult } from '../types'
import { toKey, stripTime, normalize } from './utils'

export function computeMonthStats(monthEntry: MonthEntry): MonthStats {
  const days = monthEntry.targetDays
  const worked = days.filter(d => d.type === 'trabajo')
  const totalWorkedHours = worked.reduce((sum, d) => sum + (d.durationHours ?? 0), 0)
  const shiftsCount = worked.length
  const avgShiftHours = shiftsCount ? totalWorkedHours / shiftsCount : null

  let longestShift: Day | null = null
  let shortestShift: Day | null = null
  for (const d of worked) {
    if (!longestShift || (d.durationHours ?? 0) > (longestShift.durationHours ?? 0)) longestShift = d
    if (!shortestShift || (d.durationHours ?? 0) < (shortestShift.durationHours ?? 0)) shortestShift = d
  }

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
    totalWorkedHours, shiftsCount, avgShiftHours, longestShift, shortestShift,
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
