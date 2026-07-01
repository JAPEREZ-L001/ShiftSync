import { useState, useRef, useCallback, useMemo } from 'react'
import * as XLSX from 'xlsx'
import type { MonthEntry, SkippedSheet, Day, MonthStats } from '../types'
import { parseWorkbook } from '../lib/parser'
import { computeMonthStats, getAllTargetDaysSorted, findNextShift, findNextRest } from '../lib/stats'
import { toTitleCase, toKey } from '../lib/utils'

interface ScheduleState {
  monthEntries: MonthEntry[]
  skipped: SkippedSheet[]
  activeMonthIndex: number
  selectedDateKey: string | null
  error: string | null
}

export function useSchedule() {
  const [state, setState] = useState<ScheduleState>({
    monthEntries: [],
    skipped: [],
    activeMonthIndex: 0,
    selectedDateKey: null,
    error: null
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeMonth = useMemo(() => {
    return state.monthEntries[state.activeMonthIndex] || null
  }, [state.monthEntries, state.activeMonthIndex])

  const stats = useMemo((): MonthStats | null => {
    if (!activeMonth) return null
    return computeMonthStats(activeMonth)
  }, [activeMonth])

  const allDays = useMemo(() => {
    return getAllTargetDaysSorted(state.monthEntries)
  }, [state.monthEntries])

  const nextShift = useMemo((): Day | null => {
    return findNextShift(allDays, new Date())
  }, [allDays])

  const nextRest = useMemo((): Day | null => {
    return findNextRest(allDays, new Date())
  }, [allDays])

  const hasData = state.monthEntries.length > 0

  const headerSubtitle = useMemo(() => {
    if (!activeMonth) return 'Cargá tu archivo Excel para comenzar'
    return `${toTitleCase(activeMonth.employeeName)} · ${activeMonth.department}`
  }, [activeMonth])

  const pickDefaultMonthIndex = useCallback((entries: MonthEntry[]): number => {
    const now = new Date()
    const idx = entries.findIndex(m => m.year === now.getFullYear() && m.monthIndex === now.getMonth())
    return idx >= 0 ? idx : 0
  }, [])

  const pickDefaultSelectedDate = useCallback((entries: MonthEntry[], monthIndex: number): string | null => {
    const now = new Date()
    const allDays = getAllTargetDaysSorted(entries)
    const next = findNextShift(allDays, now)
    if (next) return toKey(next.date)
    const month = entries[monthIndex]
    return month && month.targetDays.length ? toKey(month.targetDays[0].date) : null
  }, [])

  const handleFile = useCallback((file: File | null) => {
    if (!file) return

    setState(prev => ({ ...prev, error: null }))

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) throw new Error('No se pudo leer el archivo')
        
        const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array', cellDates: true })
        const { monthEntries, skipped } = parseWorkbook(workbook)

        if (!monthEntries.length) {
          setState(prev => ({
            ...prev,
            error: 'No se encontró al empleado objetivo en ninguna hoja de este archivo.',
            monthEntries: [],
            skipped
          }))
          return
        }

        const activeMonthIndex = pickDefaultMonthIndex(monthEntries)
        const selectedDateKey = pickDefaultSelectedDate(monthEntries, activeMonthIndex)

        setState({
          monthEntries,
          skipped,
          activeMonthIndex,
          selectedDateKey,
          error: null
        })
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Ocurrió un error inesperado al leer el archivo.'
        }))
      }
    }
    reader.onerror = () => {
      setState(prev => ({
        ...prev,
        error: 'No se pudo leer el archivo seleccionado.'
      }))
    }
    reader.readAsArrayBuffer(file)
  }, [pickDefaultMonthIndex, pickDefaultSelectedDate])

  const setActiveMonth = useCallback((index: number) => {
    setState(prev => {
      const selectedDateKey = pickDefaultSelectedDate(prev.monthEntries, index)
      return { ...prev, activeMonthIndex: index, selectedDateKey }
    })
  }, [pickDefaultSelectedDate])

  const setSelectedDate = useCallback((key: string) => {
    setState(prev => ({ ...prev, selectedDateKey: key }))
  }, [])

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    ...state,
    activeMonth,
    stats,
    nextShift,
    nextRest,
    hasData,
    headerSubtitle,
    fileInputRef,
    handleFile,
    setActiveMonth,
    setSelectedDate,
    triggerFileInput
  }
}
