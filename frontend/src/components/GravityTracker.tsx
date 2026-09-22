import { useState } from 'react'
import { calculate } from '../api/client'
import { allPositive, num, sgValue, useCalculation } from '../hooks/useCalculation'
import type { GravityRequest } from '../types'
import { fmt, fmtSg } from '../utils/format'
import { CalcStatus, NumberField, Stat } from './Field'
import GravityInput from './GravityInput'

const STATUS_TEXT = { on_target: 'no alvo', below: 'abaixo do alvo', above: 'acima do alvo' } as const

/** Linha de uma fase: esperado vs. medido, com desvio e indicador. */
function PhaseComparison({ label, suggestion }: { label: string; suggestion?: string }) {
  const [expected, setExpected] = useState('')
  const [actual, setActual] = useState('')
  const exp = sgValue(expected)
  const act = sgValue(actual)
  const request: GravityRequest | null = allPositive(exp, act) ? { expected_sg: exp, actual_sg: act } : null
  const { result, error } = useCalculation(calculate.gravity, request)
  const cmp = result?.comparison

  return (
    <div className="phase-row">
      <h3>{label}</h3>
      <div className="grid grid-2">
        <GravityInput label="Esperado" value={expected} onChange={setExpected} />
        <GravityInput label="Medido" value={actual} onChange={setActual} placeholder="1.048" />
      </div>
      <CalcStatus loading={false} error={error} />
      {cmp && request && (
        <p className={`alert ${cmp.status === 'on_target' ? 'alert-ok' : 'alert-warn'}`}>
          {cmp.status === 'on_target' ? '✓' : '⚠'} Desvio {cmp.deviation > 0 ? '+' : ''}
          {fmtSg(cmp.deviation)} ({STATUS_TEXT[cmp.status]})
          {cmp.status !== 'on_target' && suggestion && <><br />{suggestion}</>}
        </p>
      )}
    </div>
  )
}

export default function GravityTracker() {
  // Conversão SG ↔ Plato
  const [convValue, setConvValue] = useState('1.050')
  const [convUnit, setConvUnit] = useState<'sg' | 'plato'>('sg')
  const convN = convUnit === 'sg' ? sgValue(convValue) : num(convValue)
  const conv = useCalculation(
    calculate.gravity,
    convN === null ? null : convUnit === 'sg' ? { sg: convN } : { plato: convN },
  )

  // Pré-fervura → pós-fervura esperada e eficiência de mostura
  const [preSg, setPreSg] = useState('')
  const [preVol, setPreVol] = useState('')
  const [postVol, setPostVol] = useState('')
  const [grainKg, setGrainKg] = useState('')
  const [ppg, setPpg] = useState('37')
  const pre = { sg: sgValue(preSg), vol: num(preVol), post: num(postVol), kg: num(grainKg), ppg: num(ppg) }
  const grains = allPositive(pre.kg, pre.ppg) ? [{ weight_kg: pre.kg!, potential_ppg: pre.ppg! }] : []
  const preRequest: GravityRequest | null = allPositive(pre.sg, pre.vol)
    ? { preboil_sg: pre.sg, preboil_volume_l: pre.vol, postboil_volume_l: pre.post || null, grains }
    : null
  const preCalc = useCalculation(calculate.gravity, preRequest)

  // Pós-fervura → correção de OG
  const [postSg, setPostSg] = useState('')
  const [targetOg, setTargetOg] = useState('')
  const [curVol, setCurVol] = useState('')
  const adj = { sg: sgValue(postSg), target: sgValue(targetOg), vol: num(curVol) }
  const adjCalc = useCalculation(
    calculate.gravity,
    allPositive(adj.sg, adj.target, adj.vol)
      ? { actual_sg: adj.sg, target_og: adj.target, current_volume_l: adj.vol, expected_sg: adj.target }
      : null,
  )

  // OG/FG → atenuação, ABV e eficiência da brassagem
  const [og, setOg] = useState('')
  const [fg, setFg] = useState('')
  const [fermVol, setFermVol] = useState('')
  const fin = { og: sgValue(og), fg: sgValue(fg), vol: num(fermVol) }
  const finCalc = useCalculation(
    calculate.gravity,
    allPositive(fin.og, fin.fg)
      ? { og: fin.og, fg: fin.fg, fermenter_volume_l: fin.vol || null, grains }
      : null,
  )

  const a = adjCalc.result?.adjustment
  const cmp = adjCalc.result?.comparison

  return (
    <div className="stack">
      <section className="card">
        <h2>Esperado vs. medido por fase</h2>
        <PhaseComparison label="Mostura" suggestion="Verifique moagem, temperatura e tempo de mostura." />
        <PhaseComparison
          label="Pré-fervura"
          suggestion="Ajuste o tempo de fervura para evaporar mais (ou menos) água."
        />
        <PhaseComparison
          label="Pós-fervura (OG)"
          suggestion="Use a correção de OG abaixo para calcular água a adicionar ou evaporar."
        />
        <PhaseComparison label="Final (FG)" />
      </section>

      <section className="card">
        <h2>Correção de OG pós-fervura</h2>
        <div className="grid">
          <GravityInput label="OG medido" value={postSg} onChange={setPostSg} />
          <GravityInput label="OG alvo" value={targetOg} onChange={setTargetOg} />
          <NumberField label="Volume atual" unit="L" value={curVol} onChange={setCurVol} />
        </div>
        <CalcStatus loading={false} error={adjCalc.error} />
        {a && cmp && (
          <div className="results">
            <Stat
              label="Desvio"
              value={`${cmp.deviation > 0 ? '+' : ''}${fmtSg(cmp.deviation)}`}
              tone={cmp.status === 'on_target' ? 'ok' : 'warn'}
            />
            {a.action === 'add_water' && (
              <p className="alert alert-warn">
                OG acima do alvo: adicione <strong>{fmt(a.liters)} L</strong> de água (volume final{' '}
                {fmt(a.final_volume_l)} L).
              </p>
            )}
            {a.action === 'boil_off' && (
              <p className="alert alert-warn">
                OG abaixo do alvo: evapore <strong>{fmt(a.liters)} L</strong> (volume final {fmt(a.final_volume_l)}{' '}
                L) ou adicione fermentáveis (ex.: extrato seco).
              </p>
            )}
            {a.action === 'none' && <p className="alert alert-ok">✓ OG no alvo, nenhuma correção necessária.</p>}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Pré-fervura e eficiência</h2>
        <div className="grid">
          <GravityInput label="Gravidade pré-fervura" value={preSg} onChange={setPreSg} placeholder="1.040" />
          <NumberField label="Volume pré-fervura" unit="L" value={preVol} onChange={setPreVol} />
          <NumberField label="Volume pós-fervura" unit="L" value={postVol} onChange={setPostVol} placeholder="opcional" />
          <NumberField label="Malte total" unit="kg" value={grainKg} onChange={setGrainKg} placeholder="p/ eficiência" />
          <NumberField label="Potencial" unit="PPG" value={ppg} onChange={setPpg} />
        </div>
        <CalcStatus loading={false} error={preCalc.error} />
        {preCalc.result && preRequest && (
          <div className="results">
            {preCalc.result.expected_postboil_sg !== null && (
              <Stat label="OG pós-fervura esperado" value={fmtSg(preCalc.result.expected_postboil_sg)} />
            )}
            {preCalc.result.mash_efficiency_pct !== null && (
              <Stat label="Eficiência de mostura" value={`${fmt(preCalc.result.mash_efficiency_pct)}%`} />
            )}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Atenuação e ABV</h2>
        <div className="grid">
          <GravityInput label="OG" value={og} onChange={setOg} />
          <GravityInput label="FG" value={fg} onChange={setFg} placeholder="1.012" />
          <NumberField label="Volume no fermentador" unit="L" value={fermVol} onChange={setFermVol} placeholder="opcional" />
        </div>
        <CalcStatus loading={false} error={finCalc.error} />
        {finCalc.result?.attenuation && (
          <div className="results">
            <Stat label="ABV" value={`${fmt(finCalc.result.attenuation.abv_pct, 2)}%`} />
            <Stat label="Atenuação aparente" value={`${fmt(finCalc.result.attenuation.apparent_attenuation_pct)}%`} />
            {finCalc.result.brewhouse_efficiency_pct !== null && (
              <Stat label="Eficiência da brassagem" value={`${fmt(finCalc.result.brewhouse_efficiency_pct)}%`} />
            )}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Conversão SG ↔ Plato</h2>
        <div className="segmented" role="radiogroup" aria-label="Unidade">
          {(['sg', 'plato'] as const).map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={convUnit === u}
              className={convUnit === u ? 'active' : ''}
              onClick={() => {
                setConvUnit(u)
                setConvValue(u === 'sg' ? '1.050' : '12.4')
              }}
            >
              {u === 'sg' ? 'SG' : '°P'}
            </button>
          ))}
        </div>
        <NumberField
          label="Gravidade"
          unit={convUnit === 'sg' ? 'SG' : '°P'}
          step={convUnit === 'sg' ? '0.001' : '0.1'}
          value={convValue}
          onChange={setConvValue}
        />
        <CalcStatus loading={false} error={conv.error} />
        {conv.result?.conversion && (
          <div className="results">
            <Stat label="SG" value={fmtSg(conv.result.conversion.sg)} />
            <Stat label="Plato" value={`${fmt(conv.result.conversion.plato)} °P`} />
          </div>
        )}
      </section>
    </div>
  )
}
