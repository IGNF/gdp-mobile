import { toNumber } from '@/shared/utils/coercion';

export function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

export function readNonNegativeNumber(value: unknown, fallback: number): number {
  const parsed = toNumber(value)
  if (parsed === undefined || parsed < 0) return fallback
  return parsed
}

export function readFiniteNumber(value: unknown, fallback: number): number {
  const parsed = toNumber(value)
  if (parsed === undefined) return fallback
  return parsed
}

export function parseDecimalInput(value: string): number {
  return Number(value.replace(',', '.'))
}

export function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0
}

export function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value)
}

export function degreesToRadians(degrees: number): number {
  return degrees * Math.PI / 180
}
