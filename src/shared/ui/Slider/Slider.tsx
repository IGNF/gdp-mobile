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
  /** Bascule uniquement entre min et max au clic (pas de réglage progressif). */
  binary?: boolean
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
  binary = false,
  ariaLabel,
  className,
}: SliderProps) {
  const hasValidRange = max > min
  const safeMin = hasValidRange ? min : 0
  const safeMax = hasValidRange ? max : 1
  const normalizedValue = clampNumber(value, safeMin, safeMax)
  const progress = ((normalizedValue - safeMin) / (safeMax - safeMin)) * 100
  const isOn = normalizedValue > safeMin

  const classes = [styles.slider, binary && styles.sliderBinary, className ?? '']
    .filter(Boolean)
    .join(' ')

  const style = {
    '--slider-progress': `${progress}%`,
  } as CSSProperties

  const toggleBinaryValue = () => {
    if (disabled || !binary) {
      return
    }

    onChange(isOn ? safeMin : safeMax)
  }

  if (binary) {
    return (
      <button
        type='button'
        className={classes}
        style={style}
        disabled={disabled}
        data-state={isOn ? 'on' : 'off'}
        aria-label={ariaLabel}
        aria-pressed={isOn}
        aria-valuenow={normalizedValue}
        aria-valuemin={safeMin}
        aria-valuemax={safeMax}
        onClick={toggleBinaryValue}
      >
        <span className={styles.binaryTrack} aria-hidden>
          <span className={styles.binaryFill} style={{ width: `${progress}%` }} />
          <span className={styles.binaryThumb} style={{ left: `${progress}%` }} />
        </span>
      </button>
    )
  }

  return (
    <input
      type='range'
      className={classes}
      min={safeMin}
      max={safeMax}
      step={binary ? safeMax - safeMin : step}
      value={normalizedValue}
      style={style}
      disabled={disabled}
      data-state={isOn ? 'on' : 'off'}
      aria-label={ariaLabel}
      aria-valuenow={normalizedValue}
      aria-valuemin={safeMin}
      aria-valuemax={safeMax}
      onChange={(event) => {
        const nextValue = Number(event.target.value)
        onChange(clampNumber(nextValue, safeMin, safeMax))
      }}
    />
  )
}
