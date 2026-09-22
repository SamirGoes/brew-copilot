import { useState } from 'react'
import { calculate } from '../api/client'
import { allPositive, num, sgValue, useCalculation } from '../hooks/useCalculation'
import type { HopsRequest, IbuFormula } from '../types'
import { fmt } from '../utils/format'
import { CalcStatus, NumberField, Stat } from './Field'
import GravityInput from './GravityInput'

interface HopRow {
  variety: string
  weight: string
  alpha: string
  time: string
}

const BALANCE_TEXT = { malty: 'maltada', balanced: 'equilibrada', hoppy: 'lupulada' } as const

const emptyRow = (): HopRow => ({ variety: '', weight: '', alpha: '', time: '' })

/**
 * Tempo ajustado de uma adição: as adições são contadas a partir do fim da fervura,
 * então só a do início da fervura (tempo >= fervura original) acompanha o novo tempo;
 * as demais só mudam se não couberem na fervura mais curta.
 */
function adjustedTime(time: number, originalBoil: number, newBoil: number): number {
  return time >= originalBoil ? newBoil : Math.min(time, newBoil)
}

/**
 * Tempo a enviar para recálculo, ou null quando o peso não muda: tempo igual, ou
 * adição sem isomerização (0 min), cujo peso não pode ser compensado pelo tempo.
 */
function recalcTime(time: number, originalBoil: number, newBoil: number): number | null {
  const t = adjustedTime(time, originalBoil, newBoil)
  return t === time || t <= 0 || time <= 0 ? null : t
}

export default function HopCalculator() {
  const [rows, setRows] = useState<HopRow[]>([
    { variety: 'Magnum', weight: '30', alpha: '6', time: '60' },
    { variety: 'Cascade', weight: '20', alpha: '5.5', time: '15' },
    { variety: 'Cascade', weight: '10', alpha: '5.5', time: '0' },
  ])
  const [volume, setVolume] = useState('20')
  const [og, setOg] = useState('1.050')
  const [formula, setFormula] = useState<IbuFormula>('tinseth')
  const [boil, setBoil] = useState('60')
  const [newBoil, setNewBoil] = useState('60')

  const vol = num(volume)
  const ogN = sgValue(og)
  const boilN = num(boil)
  const newBoilN = num(newBoil)
  const adjusting = boilN !== null && newBoilN !== null && newBoilN >= 0 && newBoilN !== boilN

  const parsed = rows.map((r) => ({
    variety: r.variety,
    weight_g: num(r.weight),
    alpha_acid_pct: num(r.alpha),
    boil_time_min: num(r.time),
  }))
  const complete = parsed.filter(
    (h) => h.weight_g !== null && h.weight_g >= 0 && allPositive(h.alpha_acid_pct) && h.boil_time_min !== null && h.boil_time_min >= 0,
  )

  const request: HopsRequest | null =
    complete.length && allPositive(vol, ogN) && ogN! > 1
      ? {
          volume_l: vol!,
          og: ogN!,
          formula,
          additions: complete.map((h) => ({
            variety: h.variety,
            weight_g: h.weight_g!,
            alpha_acid_pct: h.alpha_acid_pct!,
            boil_time_min: h.boil_time_min!,
            new_boil_time_min: adjusting ? recalcTime(h.boil_time_min!, boilN!, newBoilN!) : null,
          })),
        }
      : null

  const { result, error, loading } = useCalculation(calculate.hops, request)

  const update = (i: number, patch: Partial<HopRow>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  return (
    <div className="stack">
      <section className="card">
        <h2>Lúpulo e IBU</h2>
        <div className="grid">
          <NumberField label="Volume do lote" unit="L" value={volume} onChange={setVolume} />
          <GravityInput label="OG do mosto" value={og} onChange={setOg} />
        </div>
        <div className="segmented" role="radiogroup" aria-label="Fórmula de IBU">
          {(['tinseth', 'rager'] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={formula === f}
              className={formula === f ? 'active' : ''}
              onClick={() => setFormula(f)}
            >
              {f === 'tinseth' ? 'Tinseth' : 'Rager'}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Adições</h2>
        <div className="hop-list">
          {rows.map((r, i) => {
            const res = result && complete.includes(parsed[i]) ? result.additions[complete.indexOf(parsed[i])] : null
            return (
              <div className="hop-row" key={i}>
                <label className="field hop-variety">
                  <span className="field-label">Variedade</span>
                  <input value={r.variety} onChange={(e) => update(i, { variety: e.target.value })} placeholder="Cascade" />
                </label>
                <NumberField label="Peso" unit="g" value={r.weight} onChange={(v) => update(i, { weight: v })} />
                <NumberField label="Alfa" unit="%" value={r.alpha} onChange={(v) => update(i, { alpha: v })} />
                <NumberField label="Tempo" unit="min" value={r.time} onChange={(v) => update(i, { time: v })} />
                <div className="hop-result">
                  {res ? (
                    <>
                      <span><strong>{fmt(res.ibu)}</strong> IBU</span>
                      <span className="muted">util. {fmt(res.utilization_pct)}%</span>
                      {res.adjusted_weight_g !== null && (
                        <span className="hop-adjusted">→ {fmt(res.adjusted_weight_g)} g</span>
                      )}
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label="Remover adição"
                    onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setRows((rs) => [...rs, emptyRow()])}>
          + Adicionar lúpulo
        </button>
      </section>

      <section className="card">
        <h2>Ajuste do tempo de fervura</h2>
        <p className="muted">
          Mude o tempo de fervura para recalcular o peso de cada adição mantendo o mesmo IBU.
        </p>
        <div className="grid grid-2">
          <NumberField label="Fervura da receita" unit="min" value={boil} onChange={setBoil} />
          <NumberField label="Fervura real" unit="min" value={newBoil} onChange={setNewBoil} />
        </div>
        {adjusting && result && (
          <table className="table">
            <thead>
              <tr>
                <th>Lúpulo</th>
                <th>Tempo</th>
                <th>Peso original</th>
                <th>Novo peso</th>
              </tr>
            </thead>
            <tbody>
              {result.additions.map((h, i) => (
                <tr key={i}>
                  <td>{h.variety || `#${i + 1}`}</td>
                  <td>
                    {h.boil_time_min} → {adjustedTime(h.boil_time_min, boilN!, newBoilN!)} min
                  </td>
                  <td>{fmt(h.weight_g)} g</td>
                  <td>
                    <strong>{fmt(h.adjusted_weight_g ?? h.weight_g)} g</strong>
                    {h.adjusted_weight_g === null && <span className="muted"> (sem mudança)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <CalcStatus loading={loading && !result} error={error} />
        {!request && <p className="muted">Preencha volume, OG e ao menos uma adição completa.</p>}
        {result && request && (
          <div className="results">
            <Stat label="IBU total" value={<strong className="big">{fmt(result.total_ibu)}</strong>} />
            <Stat label="BU:GU" value={`${fmt(result.bu_gu, 2)} (${BALANCE_TEXT[result.balance]})`} />
          </div>
        )}
      </section>
    </div>
  )
}
