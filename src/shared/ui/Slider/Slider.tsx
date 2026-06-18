import type { CSSProperties } from 'react'
import styles from './Slider.module.css'
import { clampNumber } from '@/shared/utils/number'

export interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  disabled = false,
  ariaLabel,
  className,
}: SliderProps) {
  const hasValidRange = max > min
  const safeMin = hasValidRange ? min : 0
  const safeMax = hasValidRange ? max : 1
  const normalizedValue = clampNumber(value, safeMin, safeMax)
  const progress = ((normalizedValue - safeMin) / (safeMax - safeMin)) * 100

  const classes = [styles.slider, className ?? '']
    .filter(Boolean)
    .join(' ')

  const style = {
    '--slider-progress': `${progress}%`,
  } as CSSProperties

  return (
    <input
      type='range'
      className={classes}
      min={safeMin}
      max={safeMax}
      step={step}
      value={normalizedValue}
      style={style}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => {
        const nextValue = Number(event.target.value)
        onChange(clampNumber(nextValue, safeMin, safeMax))
      }}
    />
  )
}
