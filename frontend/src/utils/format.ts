import type { Severity, StyleParam } from '../types'
import { COLOR_LABEL, type ColorUnit, formatColor } from './color'

export const fmt = (n: number | null | undefined, digits = 1) =>
  n === null || n === undefined ? '—' : n.toFixed(digits)

export const fmtSg = (n: number | null | undefined) => fmt(n, 3)

export const PARAM_LABELS: Record<StyleParam, string> = { og: 'OG', fg: 'FG', ibu: 'IBU', srm: 'SRM', abv: 'ABV' }

/** Rótulo do parâmetro; a cor segue a unidade escolhida (SRM/EBC). */
export const paramLabel = (p: StyleParam, unit: ColorUnit = 'srm') => (p === 'srm' ? COLOR_LABEL[unit] : PARAM_LABELS[p])

export const SEVERITY_ICON: Record<Severity, string> = { within: '✓', slight: '⚠', significant: '✗' }

export const SEVERITY_TEXT: Record<Severity, string> = {
  within: 'dentro do estilo',
  slight: 'levemente fora do estilo',
  significant: 'muito fora do estilo',
}

export function formatRange(param: StyleParam, min: number, max: number, unit: ColorUnit = 'srm'): string {
  if (param === 'og' || param === 'fg') return `${min.toFixed(3)}–${max.toFixed(3)}`
  if (param === 'srm') return `${formatColor(min, unit)}–${formatColor(max, unit)}`
  if (param === 'abv') return `${min}–${max}%`
  return `${min}–${max}`
}

export function formatValue(param: StyleParam, value: number, unit: ColorUnit = 'srm'): string {
  if (param === 'og' || param === 'fg') return value.toFixed(3)
  if (param === 'abv') return `${value.toFixed(1)}%`
  if (param === 'srm') return formatColor(value, unit)
  return value.toFixed(0)
}

/** Máscara de gravidade: só dígitos (máx. 4), ponto após o primeiro — "1052" → "1.052". */
export function maskGravity(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '').slice(0, 4)
  return digits.length <= 1 ? digits : `${digits[0]}.${digits.slice(1)}`
}

/**
 * Máscara decimal "de caixa registradora": só dígitos, ponto antes das últimas
 * `decimals` casas — com 1 casa "63" → "6.3"; com 3 casas "250" → "0.250".
 */
export function maskDecimal(raw: string | null | undefined, decimals: number, maxDigits: number): string {
  const digits = (raw ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, maxDigits)
  if (!digits) return ''
  const padded = digits.padStart(decimals + 1, '0')
  return `${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`
}
