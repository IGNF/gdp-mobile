import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { clampNumber } from '@/shared/utils/number'
import styles from './YearWheelPicker.module.css'

const ROW_HEIGHT = 44
const VISIBLE_ROWS = 5
const WHEEL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS
const SPACER_HEIGHT = (WHEEL_HEIGHT - ROW_HEIGHT) / 2
const SETTLE_DEBOUNCE_MS = 120
const MAX_FADE_DISTANCE = 3

export interface YearWheelPickerProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  ariaLabel?: string
}

export function YearWheelPicker({ min, max, value, onChange, ariaLabel }: YearWheelPickerProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const settleTimerRef = useRef<number | undefined>(undefined)

  const years = useMemo(() => {
    const items: number[] = []
    for (let year = min; year <= max; year++) {
      items.push(year)
    }
    return items
  }, [min, max])

  const indexForYear = useCallback(
    (year: number) => clampNumber(year, min, max) - min,
    [min, max],
  )

  const [liveIndex, setLiveIndex] = useState(() => indexForYear(value))

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTop = indexForYear(value) * ROW_HEIGHT
    // Centrage uniquement au montage (ouverture du picker) : on ne veut pas re-scroller
    // par-dessus le geste de l'utilisateur si `value` change ensuite via le scroll lui-même.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current)
    },
    [],
  )

  const handleScroll = () => {
    const list = listRef.current
    if (!list) return
    const { scrollTop } = list

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = undefined
        setLiveIndex(clampNumber(Math.round(scrollTop / ROW_HEIGHT), 0, years.length - 1))
      })
    }

    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current)
    settleTimerRef.current = window.setTimeout(() => {
      const index = clampNumber(Math.round(scrollTop / ROW_HEIGHT), 0, years.length - 1)
      onChange(years[index])
    }, SETTLE_DEBOUNCE_MS)
  }

  const scrollToIndex = (index: number) => {
    listRef.current?.scrollTo({ top: index * ROW_HEIGHT, behavior: 'smooth' })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = listRef.current
    if (!list) return

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      scrollToIndex(clampNumber(liveIndex - 1, 0, years.length - 1))
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      scrollToIndex(clampNumber(liveIndex + 1, 0, years.length - 1))
    } else if (event.key === 'Home') {
      event.preventDefault()
      scrollToIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      scrollToIndex(years.length - 1)
    }
  }

  const wheelStyle = {
    '--row-height': `${ROW_HEIGHT}px`,
    '--wheel-height': `${WHEEL_HEIGHT}px`,
    '--spacer-height': `${SPACER_HEIGHT}px`,
  } as CSSProperties

  return (
    <div className={styles.wheel} style={wheelStyle}>
      <div
        ref={listRef}
        className={styles.list}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.spacer} aria-hidden />
        {years.map((year, index) => (
          <div
            key={year}
            role="option"
            aria-selected={index === liveIndex}
            className={styles.row}
            data-distance={Math.min(Math.abs(index - liveIndex), MAX_FADE_DISTANCE)}
            onClick={() => scrollToIndex(index)}
          >
            {year}
          </div>
        ))}
        <div className={styles.spacer} aria-hidden />
      </div>
      <div className={styles.frameTop} aria-hidden />
      <div className={styles.frameBottom} aria-hidden />
    </div>
  )
}
