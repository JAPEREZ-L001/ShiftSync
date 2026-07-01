import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import type { MonthEntry, SkippedSheet, Day, MonthStats, ParsedWorkbook } from '../types'
import { parseWorkbookAll, buildMonthEntriesForTarget } from '../lib/parser'
import { computeMonthStats, getAllTargetDaysSorted, findNextShift, findNextRest } from '../lib/stats'
import { toTitleCase, toKey } from '../lib/utils'
import { TARGET_EMPLOYEE } from '../lib/constants'
import { getSchedule, rebuildMonthEntries } from '../lib/share'

type AppMode = 'edit' | 'view'

interface ScheduleState {
  parsed: ParsedWorkbook | null
  targetName: string
  monthEntries: MonthEntry[]
  skipped: SkippedSheet[]
  activeMonthIndex: number
  selectedDateKey: string | null
  error: string | null
  mode: AppMode
  shareId: string | null
  loading: boolean
}

export function useSchedule() {
  const [state, setState] = useState<ScheduleState>({
    parsed: null,
    targetName: '',
    monthEntries: [],
    skipped: [],
    activeMonthIndex: 0,
    selectedDateKey: null,
    error: null,
    mode: 'edit',
    shareId: null,
    loading: true
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
  const availableNames = state.parsed?.allNames ?? []

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get('s')
    
    if (shareId) {
      getSchedule(shareId).then(result => {
        if (result) {
          const monthEntries = rebuildMonthEntries(result.payload)
          const activeMonthIndex = pickDefaultMonthIndex(monthEntries)
          const selectedDateKey = pickDefaultSelectedDate(monthEntries, activeMonthIndex)
          setState({
            parsed: null,
            targetName: result.target_name,
            monthEntries,
            skipped: [],
            activeMonthIndex,
            selectedDateKey,
            error: null,
            mode: 'view',
            shareId,
            loading: false
          })
        } else {
          setState(prev => ({
            ...prev,
            error: 'No se encontró el horario compartido. El enlace puede ser inválido o haber expirado.',
            loading: false
          }))
        }
      }).catch(() => {
        setState(prev => ({
          ...prev,
          error: 'Error al cargar el horario compartido.',
          loading: false
        }))
      })
    } else {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [pickDefaultMonthIndex, pickDefaultSelectedDate])

  const handleFile = useCallback((file: File | null) => {
    if (!file) return

    setState(prev => ({ ...prev, error: null }))

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) throw new Error('No se pudo leer el archivo')
        
        const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array', cellDates: true })
        const parsed = parseWorkbookAll(workbook)

        if (!parsed.sheets.length) {
          setState(prev => ({
            ...prev,
            error: 'No se encontraron hojas válidas en este archivo.',
            parsed: null,
            monthEntries: [],
            skipped: parsed.skipped
          }))
          return
        }

        const defaultTarget = parsed.allNames.find(n => n.toUpperCase().includes(TARGET_EMPLOYEE.toUpperCase())) 
          || parsed.allNames[0] 
          || ''

        const { monthEntries, skipped } = buildMonthEntriesForTarget(parsed, defaultTarget)
        const activeMonthIndex = pickDefaultMonthIndex(monthEntries)
        const selectedDateKey = pickDefaultSelectedDate(monthEntries, activeMonthIndex)

        setState({
          parsed,
          targetName: defaultTarget,
          monthEntries,
          skipped,
          activeMonthIndex,
          selectedDateKey,
          error: null,
          mode: 'edit',
          shareId: null,
          loading: false
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

  const setTargetName = useCallback((name: string) => {
    if (!state.parsed) return
    
    const { monthEntries, skipped } = buildMonthEntriesForTarget(state.parsed, name)
    const activeMonthIndex = pickDefaultMonthIndex(monthEntries)
    const selectedDateKey = pickDefaultSelectedDate(monthEntries, activeMonthIndex)
    
    setState(prev => ({
      ...prev,
      targetName: name,
      monthEntries,
      skipped,
      activeMonthIndex,
      selectedDateKey
    }))
  }, [state.parsed, pickDefaultMonthIndex, pickDefaultSelectedDate])

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

  const setShareId = useCallback((id: string) => {
    setState(prev => ({ ...prev, shareId: id }))
  }, [])

  return {
    ...state,
    activeMonth,
    stats,
    nextShift,
    nextRest,
    hasData,
    availableNames,
    headerSubtitle,
    fileInputRef,
    handleFile,
    setTargetName,
    setActiveMonth,
    setSelectedDate,
    triggerFileInput,
    setShareId
  }
}
