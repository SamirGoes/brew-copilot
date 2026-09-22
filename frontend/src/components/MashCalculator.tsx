import { useState } from 'react'
import { calculate } from '../api/client'
import { allPositive, num, useCalculation } from '../hooks/useCalculation'
import type { MashRequest } from '../types'
import { fmt } from '../utils/format'
import { CalcStatus, NumberField, Stat, Toggle } from './Field'
import KettleAdvice from './KettleAdvice'
import MaskedDecimalInput from './MaskedDecimalInput'

export default function MashCalculator() {
  const [grain, setGrain] = useState('5.000')
  const [ratio, setRatio] = useState('3')
  const [kettle, setKettle] = useState('')
  const [sparging, setSparging] = useState(true)
  const [preboil, setPreboil] = useState('25')

  const grainKg = num(grain)
  const ratioN = num(ratio)
  const kettleL = num(kettle)
  const preboilL = num(preboil)

  const request: MashRequest | null = allPositive(grainKg, ratioN)
    ? {
        grain_kg: grainKg!,
        water_to_grain_ratio: ratioN!,
        kettle_capacity_l: kettleL && kettleL > 0 ? kettleL : null,
        sparging,
        preboil_volume_l: sparging && preboilL && preboilL > 0 ? preboilL : null,
      }
    : null

  const { result, error, loading } = useCalculation(calculate.mash, request)

  return (
    <section className="card">
      <h2>Mosturação</h2>
      <div className="grid">
        <MaskedDecimalInput label="Peso do malte" unit="kg" decimals={3} maxDigits={5} value={grain} onChange={setGrain} />
        <NumberField label="Proporção água/malte" unit="L/kg" value={ratio} onChange={setRatio} />
        <NumberField
          label="Capacidade da panela"
          unit="L"
          value={kettle}
          onChange={setKettle}
          placeholder="opcional"
        />
      </div>
      <Toggle label="Lavagem (sparge)" checked={sparging} onChange={setSparging} />
      {sparging && (
        <NumberField label="Volume pré-fervura alvo" unit="L" value={preboil} onChange={setPreboil} />
      )}

      <CalcStatus loading={loading && !result} error={error} />
      {!request && <p className="muted">Informe peso do malte e proporção.</p>}

      {result && request && (
        <div className="results">
          <Stat label="Água de mostura" value={`${fmt(result.strike_water_l)} L`} />
          <Stat label="Volume total da mostura" value={`${fmt(result.mash_volume_l)} L`} />
          <Stat label="Absorção do malte" value={`${fmt(result.grain_absorption_l)} L`} />
          <Stat label="Primeiro mosto" value={`${fmt(result.first_runnings_l)} L`} />
          {sparging && result.sparge_water_l !== null && (
            <Stat label="Água de lavagem" value={`${fmt(result.sparge_water_l)} L`} />
          )}
          {!sparging && (
            <p className="muted">Sem lavagem (BIAB): todo o volume entra como água de mostura.</p>
          )}
          <KettleAdvice
            result={result}
            onApply={(s) => {
              // Proporção arredondada para baixo: a água resultante nunca passa da sugerida.
              setRatio(String(Math.floor((s.mash_water_l! / grainKg!) * 100) / 100))
              setSparging(true)
            }}
          />
        </div>
      )}
    </section>
  )
}
