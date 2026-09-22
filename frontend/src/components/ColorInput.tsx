import { type ReactNode, useState } from 'react'
import { num } from '../hooks/useCalculation'
import { useColorUnit } from '../hooks/useColorUnit'
import { COLOR_LABEL, type ColorUnit, formatColor, toSrm } from '../utils/color'

interface ColorInputProps {
  label?: string
  /** Cor em SRM (null = vazio). */
  srm: number | null
  onChange: (srm: number | null) => void
  hint?: ReactNode
}

/**
 * Campo de cor na unidade escolhida (SRM/EBC); devolve sempre SRM. A unidade mostrada
 * ("SRM"/"EBC", no lugar onde outros campos mostram "kg"/"L") é o próprio botão que
 * alterna — assim o campo tem a mesma altura de rótulo de qualquer outro, sem desalinhar
 * campos vizinhos numa mesma linha da grade.
 */
export default function ColorInput({ label = 'Cor', srm, onChange, hint }: ColorInputProps) {
  const [unit, setUnit] = useColorUnit()
  const shown = (v: number | null) => (v === null ? '' : formatColor(v, unit))
  // Texto digitado; ressincroniza quando o valor muda por fora ou a unidade troca.
  const [text, setText] = useState(() => shown(srm))
  const [synced, setSynced] = useState({ srm, unit })
  if (synced.unit !== unit || synced.srm !== srm) {
    setSynced({ srm, unit })
    setText(shown(srm))
  }

  const other: ColorUnit = unit === 'srm' ? 'ebc' : 'srm'

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input">
        <input
          type="number"
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            const v = e.target.value
            setText(v)
            const n = num(v)
            const next = n === null ? null : toSrm(n, unit)
            setSynced({ srm: next, unit })
            onChange(next)
          }}
        />
        <button
          type="button"
          className="field-unit field-unit-toggle"
          onClick={() => setUnit(other)}
          aria-label={`Cor em ${COLOR_LABEL[unit]}; trocar para ${COLOR_LABEL[other]}`}
          title={`Trocar para ${COLOR_LABEL[other]}`}
        >
          {COLOR_LABEL[unit]}
        </button>
      </span>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
