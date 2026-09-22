import { useState } from 'react'
import { calculate, errorMessage } from '../api/client'
import { num, sgValue, useCalculation } from '../hooks/useCalculation'
import type { CarbonationRequest, Reading } from '../types'
import { fmt, fmtSg } from '../utils/format'
import { attenuationFrom } from '../utils/recipe'
import { CalcStatus, NumberField, Stat } from './Field'
import GravityInput from './GravityInput'

const DAY_MS = 24 * 60 * 60 * 1000

/** Três leituras seguidas dentro de 0.001 indicam fim de fermentação. */
function isStable(values: number[]): boolean {
  if (values.length < 3) return false
  const last = values.slice(-3)
  return Math.max(...last) - Math.min(...last) <= 0.001 + 1e-9
}

interface FermentationLogProps {
  readings: Reading[]
  og: number | null
  startedAt: string | null
  readOnly?: boolean
  onAdd: (sg: number, tempC: number | null) => Promise<void>
  onUseAsFg: (sg: number) => Promise<void>
}

/** Leituras de densidade ao longo da fermentação, com atenuação e detecção de fim. */
export function FermentationLog({ readings, og, startedAt, readOnly, onAdd, onUseAsFg }: FermentationLogProps) {
  const [sg, setSg] = useState('')
  const [temp, setTemp] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Dia 1 = início da fermentação (fim do resfriamento) ou a primeira leitura.
  const start = new Date(startedAt ?? readings[0]?.recorded_at ?? 0).getTime()
  const values = readings.map((r) => r.actual!).filter((v) => v !== null)
  const stable = isStable(values)
  const last = values.at(-1)

  const add = async () => {
    const v = sgValue(sg)
    if (v === null) return
    try {
      await onAdd(v, num(temp))
      setSg('')
      setTemp('')
      setError(null)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <div className="subsection">
      <h3>Leituras de densidade</h3>
      {readings.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Dia</th>
              <th>SG</th>
              <th>Atenuação</th>
              <th>Temp.</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => (
              <tr key={r.id}>
                <td>{Math.floor((new Date(r.recorded_at).getTime() - start) / DAY_MS) + 1}</td>
                <td>{fmtSg(r.actual)}</td>
                <td>{og && r.actual ? `${fmt(attenuationFrom(og, r.actual), 0)}%` : '—'}</td>
                <td>{r.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">Nenhuma leitura ainda.</p>
      )}
      {stable && last !== undefined && (
        <p className="alert alert-ok">
          ✓ Três leituras estáveis — a fermentação pode ter terminado.{' '}
          {!readOnly && (
            <button type="button" className="link link-small" onClick={() => onUseAsFg(last)}>
              usar {fmtSg(last)} como FG
            </button>
          )}
        </p>
      )}
      {!readOnly && (
        <div className="grid grid-2 inline-add">
          <GravityInput label="Nova leitura" value={sg} onChange={setSg} placeholder="1.020" />
          <NumberField label="Temperatura" unit="°C" value={temp} onChange={setTemp} />
          <button type="button" className="btn btn-secondary" onClick={add} disabled={sgValue(sg) === null}>
            Registrar leitura
          </button>
        </div>
      )}
      {error && <p className="alert alert-bad">{error}</p>}
    </div>
  )
}

interface CarbonationCalcProps {
  volumeL: number | null
  targetVols: number | null
}

/** Priming (açúcar) e carbonatação forçada (PSI) para o volume da brassagem. */
export function CarbonationCalc({ volumeL, targetVols }: CarbonationCalcProps) {
  const [vols, setVols] = useState(targetVols ? String(targetVols) : '2.4')
  const [volume, setVolume] = useState(volumeL ? String(volumeL) : '')
  const [beerTemp, setBeerTemp] = useState('20')
  const [fridgeTemp, setFridgeTemp] = useState('4')

  const v = num(vols)
  const vol = num(volume)
  const bt = num(beerTemp)
  const ft = num(fridgeTemp)
  const priming = vol !== null && vol > 0 && bt !== null
  const request: CarbonationRequest | null =
    v && v > 0 && (priming || ft !== null)
      ? { target_vols: v, volume_l: priming ? vol : null, beer_temp_c: priming ? bt : null, fridge_temp_c: ft }
      : null
  const { result, error } = useCalculation(calculate.carbonation, request)

  return (
    <div className="subsection">
      <h3>Cálculo de carbonatação</h3>
      <div className="grid grid-2">
        <NumberField label="Volumes de CO₂ alvo" unit="vol" value={vols} onChange={setVols} />
        <NumberField label="Volume de cerveja" unit="L" value={volume} onChange={setVolume} />
        <NumberField label="Temp. da cerveja (priming)" unit="°C" value={beerTemp} onChange={setBeerTemp} />
        <NumberField label="Temp. da geladeira (forçada)" unit="°C" value={fridgeTemp} onChange={setFridgeTemp} />
      </div>
      <CalcStatus loading={false} error={error} />
      {result && request && (
        <div className="results">
          {result.table_sugar_g !== null && <Stat label="Açúcar comum" value={`${fmt(result.table_sugar_g)} g`} />}
          {result.dextrose_g !== null && <Stat label="Dextrose" value={`${fmt(result.dextrose_g)} g`} />}
          {result.force_carb_psi !== null && <Stat label="Pressão (forçada)" value={`${fmt(result.force_carb_psi)} PSI`} />}
        </div>
      )}
    </div>
  )
}
