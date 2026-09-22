import { styles } from '../api/client'
import type { StyleValues } from '../types'
import { useCalculation } from './useCalculation'

/** Valida os valores contra o estilo em tempo real (debounce curto). */
export function useStyleValidation(styleId: string | null, values: StyleValues) {
  const clean = Object.fromEntries(Object.entries(values).filter(([, v]) => typeof v === 'number'))
  return useCalculation(styles.validate, styleId ? { style_id: styleId, ...clean } : null, 150)
}
