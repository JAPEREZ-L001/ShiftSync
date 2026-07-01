import type { MonthEntry, Day } from '../types'
import { supabase } from './supabase'
import { parseShiftValue } from './parser'
import { withTime, toKey, fromKey } from './utils'

interface SerializedDay {
  dateKey: string
  raw: string
}

interface SerializedMonthEntry {
  sheetName: string
  department: string
  employeeName: string
  year: number | null
  monthIndex: number | null
  targetDays: SerializedDay[]
  coworkerDaysByName: Record<string, SerializedDay[]>
}

export interface SharePayload {
  monthEntries: SerializedMonthEntry[]
}

function serializeDay(day: Day): SerializedDay {
  return {
    dateKey: toKey(day.date),
    raw: day.raw
  }
}

function deserializeDay(serialized: SerializedDay): Day {
  const date = fromKey(serialized.dateKey)
  const info = parseShiftValue(serialized.raw)
  const day: Day = { date, ...info }
  
  if (day.type === 'trabajo' && day.startH !== undefined && day.startM !== undefined && day.endH !== undefined && day.endM !== undefined) {
    day.startDateTime = withTime(date, day.startH, day.startM, 0)
    day.endDateTime = withTime(date, day.endH, day.endM, day.crosses ? 1 : 0)
  }
  
  return day
}

export function toSharePayload(monthEntries: MonthEntry[]): SharePayload {
  return {
    monthEntries: monthEntries.map(entry => ({
      sheetName: entry.sheetName,
      department: entry.department,
      employeeName: entry.employeeName,
      year: entry.year,
      monthIndex: entry.monthIndex,
      targetDays: entry.targetDays.map(serializeDay),
      coworkerDaysByName: Object.fromEntries(
        Object.entries(entry.coworkerDaysByName).map(([name, days]) => [
          name,
          days.map(serializeDay)
        ])
      )
    }))
  }
}

export function rebuildMonthEntries(payload: SharePayload): MonthEntry[] {
  return payload.monthEntries.map(entry => ({
    sheetName: entry.sheetName,
    department: entry.department,
    employeeName: entry.employeeName,
    year: entry.year,
    monthIndex: entry.monthIndex,
    targetDays: entry.targetDays.map(deserializeDay),
    coworkerDaysByName: Object.fromEntries(
      Object.entries(entry.coworkerDaysByName).map(([name, days]) => [
        name,
        days.map(deserializeDay)
      ])
    )
  }))
}

export async function createSchedule(targetName: string, monthEntries: MonthEntry[]): Promise<string | null> {
  if (!supabase) {
    console.error('Supabase not configured')
    return null
  }

  const payload = toSharePayload(monthEntries)
  
  const { data, error } = await supabase.rpc('create_schedule', {
    p_target_name: targetName,
    p_payload: payload
  })

  if (error) {
    console.error('Error creating schedule:', error)
    return null
  }

  return data as string
}

interface ScheduleRecord {
  id: string
  target_name: string
  payload: SharePayload
  created_at: string
}

export async function getSchedule(id: string): Promise<ScheduleRecord | null> {
  if (!supabase) {
    console.error('Supabase not configured')
    return null
  }

  const { data, error } = await supabase.rpc('get_schedule', {
    p_id: id
  })

  if (error) {
    console.error('Error fetching schedule:', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0] as ScheduleRecord
}
