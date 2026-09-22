import type { ReactNode } from 'react'
import { maskDecimal } from '../utils/format'

interface MaskedDecimalInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  /** Casas decimais: os dígitos digitados preenchem da direita para a esquerda. */
  decimals: number
  maxDigits: number
  unit?: string
  placeholder?: string
  hint?: ReactNode
}

/** Campo numérico sem ponto: digita-se só os números (ex.: ABV "63" → 6.3). */
export default function MaskedDecimalInput(props: MaskedDecimalInputProps) {
  const { label, value, onChange, decimals, maxDigits, unit, placeholder, hint } = props
  const mask = (v: string) => maskDecimal(v, decimals, maxDigits)
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9.]*"
          autoComplete="off"
          value={mask(value)}
          placeholder={placeholder}
          onChange={(e) => onChange(mask(e.target.value))}
        />
        {unit && <span className="field-unit">{unit}</span>}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
