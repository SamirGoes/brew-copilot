import type { MashResponse } from '../types'
import { fmt } from '../utils/format'
import { NumberField, Stat } from './Field'

interface RecalculateWaterProps {
  result: MashResponse | null
  ratio: string
  onRatioChange: (v: string) => void
  onApply: () => void
  sparging: boolean
}

/**
 * Deriva água de mostura, lavagem e volume pré-fervura do zero a partir do equipamento e
 * do malte — ação principal para caber na panela, em vez de só ajustar reativamente o que
 * já foi digitado (isso o "Aplicar ajuste" abaixo continua fazendo, para ajustes manuais).
 */
export default function RecalculateWater({ result, ratio, onRatioChange, onApply, sparging }: RecalculateWaterProps) {
  const r = result?.recalculation

  return (
    <div className="subsection recalculate-water">
      <h3>Recalcular água</h3>
      <p className="muted">Deriva os volumes do equipamento e do malte, em vez de só ajustar o que já foi digitado.</p>
      <NumberField
        label="Proporção água/malte"
        unit="L/kg"
        step="0.1"
        value={ratio}
        onChange={onRatioChange}
        hint={<span className="muted">2,5 (grossa) a 4 (fina); padrão 3</span>}
      />
      {r && (
        <>
          <div className="results">
            <Stat label="Água de mostura" value={`${fmt(r.mash_water_l)} L`} />
            {sparging && <Stat label="Água de lavagem" value={r.sparge_water_l !== null ? `${fmt(r.sparge_water_l)} L` : '—'} />}
            <Stat label="Volume pré-fervura" value={`${fmt(r.preboil_volume_l)} L`} />
            {Math.abs(r.ratio_used - (Number(ratio.replace(',', '.')) || 3)) > 0.01 && (
              <Stat label="Proporção aplicada" value={`${fmt(r.ratio_used, 2)} L/kg (reduzida para caber)`} tone="warn" />
            )}
          </div>
          {!r.fits && (
            <p className="alert alert-bad" role="alert">
              ✗ {r.warning}
            </p>
          )}
          <button type="button" className="btn" onClick={onApply}>
            Recalcular água
          </button>
        </>
      )}
    </div>
  )
}
