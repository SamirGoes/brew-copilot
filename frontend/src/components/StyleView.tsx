import { useState } from 'react'
import { num, sgValue } from '../hooks/useCalculation'
import { useStyleValidation } from '../hooks/useStyleValidation'
import type { StyleDetail, StyleParam } from '../types'
import ColorInput from './ColorInput'
import ConformityBadge from './ConformityBadge'
import ConformitySummary from './ConformitySummary'
import { CalcStatus, NumberField } from './Field'
import GravityInput from './GravityInput'
import MaskedDecimalInput from './MaskedDecimalInput'
import StyleSelector from './StyleSelector'

// Texto dos campos; cor guardada em SRM (o ColorInput converte para a unidade escolhida).
interface Targets {
  og: string
  fg: string
  ibu: string
  srm: number | null
  abv: string
}

const emptyTargets = (): Targets => ({ og: '', fg: '', ibu: '', srm: null, abv: '' })

/** Seleção de estilo e validação dos alvos da receita contra o BJCP. */
export default function StyleView() {
  const [style, setStyle] = useState<StyleDetail | null>(null)
  const [targets, setTargets] = useState(emptyTargets)
  const set = <K extends keyof Targets>(key: K, value: Targets[K]) => setTargets((t) => ({ ...t, [key]: value }))

  const { result, error } = useStyleValidation(style?.id ?? null, {
    og: sgValue(targets.og),
    fg: sgValue(targets.fg),
    ibu: num(targets.ibu),
    srm: targets.srm,
    abv: num(targets.abv),
  })
  const badge = (p: StyleParam) => {
    const r = result?.results[p]
    return r && <ConformityBadge result={r} showRange={false} />
  }

  const applyDefaults = () => {
    if (!style) return
    const m = style.midpoints
    setTargets({
      og: m.og?.toFixed(3) ?? '',
      fg: m.fg?.toFixed(3) ?? '',
      ibu: m.ibu !== undefined ? String(Math.round(m.ibu)) : '',
      srm: m.srm !== undefined ? Math.round(m.srm * 10) / 10 : null,
      abv: m.abv?.toFixed(1) ?? '',
    })
  }

  return (
    <div className="stack">
      <section className="card">
        <h2>Estilo</h2>
        <StyleSelector value={style?.id ?? null} onChange={setStyle} />
        {style && Object.keys(style.midpoints).length > 0 && (
          <button type="button" className="btn btn-secondary" onClick={applyDefaults}>
            Usar padrões do estilo
          </button>
        )}
      </section>

      <section className="card">
        <h2>Alvos da receita</h2>
        <div className="grid">
          <GravityInput label="OG" value={targets.og} onChange={(v) => set('og', v)} placeholder="1.060" hint={badge('og')} />
          <GravityInput label="FG" value={targets.fg} onChange={(v) => set('fg', v)} placeholder="1.010" hint={badge('fg')} />
          <NumberField label="IBU" unit="IBU" step="1" value={targets.ibu} onChange={(v) => set('ibu', v)} hint={badge('ibu')} />
          <ColorInput srm={targets.srm} onChange={(v) => set('srm', v)} hint={badge('srm')} />
          <MaskedDecimalInput
            label="ABV"
            unit="%"
            decimals={1}
            maxDigits={3}
            placeholder="6.3"
            value={targets.abv}
            onChange={(v) => set('abv', v)}
            hint={badge('abv')}
          />
        </div>
        <CalcStatus loading={false} error={error} />
        {!style && <p className="muted">Selecione um estilo para validar.</p>}
      </section>

      {style && result && (
        <section className="card">
          <h2>Conformidade</h2>
          <ConformitySummary validation={result} />
        </section>
      )}
    </div>
  )
}
