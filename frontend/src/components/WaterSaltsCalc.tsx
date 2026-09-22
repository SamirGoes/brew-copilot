import { calculate } from '../api/client'
import { useCalculation } from '../hooks/useCalculation'
import type { WaterDose, WaterProfile, WaterRequest } from '../types'
import { fmt } from '../utils/format'
import { WATER_PROFILES } from '../utils/water'
import { CalcStatus, Stat } from './Field'

function WaterDoseCard({ title, dose }: { title: string; dose: WaterDose }) {
  return (
    <div className="results">
      <h3>
        {title} <span className="muted">({fmt(dose.volume_l)} L)</span>
      </h3>
      <Stat label="CaSO₄ (gesso)" value={`${fmt(dose.salts.caso4_g, 2)} g`} />
      <Stat label="MgSO₄ (sal de Epsom)" value={`${fmt(dose.salts.mgso4_g, 2)} g`} />
      <Stat label="CaCl₂" value={`${fmt(dose.salts.cacl_g, 2)} g`} />
      <Stat label="Ácido ascórbico" value={dose.ascorbic_acid.label} />
    </div>
  )
}

interface WaterSaltsCalcProps {
  profile: WaterProfile | null
  onProfileChange: (profile: WaterProfile) => void
  mashVolumeL: number | null
  spargeVolumeL: number | null
  title?: string
}

/** Correção de sais (CaSO₄, MgSO₄, CaCl) e ácido ascórbico para os volumes informados. */
export default function WaterSaltsCalc({ profile, onProfileChange, mashVolumeL, spargeVolumeL, title }: WaterSaltsCalcProps) {
  const request: WaterRequest | null =
    profile && mashVolumeL !== null && mashVolumeL >= 0
      ? { profile, mash_volume_l: mashVolumeL, sparge_volume_l: spargeVolumeL !== null && spargeVolumeL >= 0 ? spargeVolumeL : null }
      : null
  // Sem debounce: o cálculo é barato e a atualização deve ser imediata.
  const { result, error } = useCalculation(calculate.water, request, 0)

  return (
    <div className="subsection">
      {title && <h3>{title}</h3>}
      <div className="segmented" role="radiogroup" aria-label="Perfil de água">
        {WATER_PROFILES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={profile === p.id}
            className={profile === p.id ? 'active' : ''}
            onClick={() => onProfileChange(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <CalcStatus loading={false} error={error} />
      {!profile && <p className="muted">Escolha um perfil para calcular os sais.</p>}
      {profile && mashVolumeL === null && <p className="muted">Informe a água de mostura para calcular.</p>}
      {result && request && (
        <div className="grid grid-2">
          <WaterDoseCard title="Mostura" dose={result.mash} />
          {result.sparge && <WaterDoseCard title="Lavagem" dose={result.sparge} />}
        </div>
      )}
    </div>
  )
}
