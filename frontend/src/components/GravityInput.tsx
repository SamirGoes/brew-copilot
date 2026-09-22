import type { ReactNode } from 'react'
import { maskGravity } from '../utils/format'

interface GravityInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: ReactNode
}

/** Campo de gravidade específica: digita-se só os números e o ponto entra sozinho. */
export default function GravityInput({ label, value, onChange, placeholder = '1.050', hint }: GravityInputProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9.]*"
          autoComplete="off"
          maxLength={5}
          value={maskGravity(value)}
          placeholder={placeholder}
          onChange={(e) => onChange(maskGravity(e.target.value))}
        />
        <span className="field-unit">SG</span>
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
