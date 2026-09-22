import type { ReactNode } from 'react'

interface NumberFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  unit?: string
  step?: string
  placeholder?: string
  hint?: ReactNode
  /** Controle extra ao lado do rótulo (ex.: seletor de unidade). */
  labelExtra?: ReactNode
}

/** Input numérico com rótulo e unidade; mantém o texto cru para permitir edição livre. */
export function NumberField({ label, value, onChange, unit, step = 'any', placeholder, hint, labelExtra }: NumberFieldProps) {
  return (
    <label className="field">
      <span className="field-label-row">
        <span className="field-label">{label}</span>
        {labelExtra}
      </span>
      <span className="field-input">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && <span className="field-unit">{unit}</span>}
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

/** Linha de resultado "rótulo ........ valor". */
export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'ok' | 'warn' | 'bad' }) {
  return (
    <div className={`stat${tone ? ` stat-${tone}` : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  )
}

export function CalcStatus({ loading, error }: { loading: boolean; error: string | null }) {
  if (error) return <p className="alert alert-bad" role="alert">{error}</p>
  if (loading) return <p className="muted" aria-live="polite">Calculando…</p>
  return null
}
