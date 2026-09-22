import { type ReactNode, useState } from 'react'
import { calculate } from '../api/client'
import { num, sgValue, useCalculation } from '../hooks/useCalculation'
import { useStyleValidation } from '../hooks/useStyleValidation'
import type { StyleParam } from '../types'
import { fmt } from '../utils/format'
import { type RecipeDraft, abvFrom, attenuationFrom, emptyGrain, emptyHop } from '../utils/recipe'
import ConformityBadge from './ConformityBadge'
import ConformitySummary from './ConformitySummary'
import { NumberField, Toggle } from './Field'
import ColorInput from './ColorInput'
import GravityInput from './GravityInput'
import KettleAdvice from './KettleAdvice'
import MaskedDecimalInput from './MaskedDecimalInput'
import RecalculateWater from './RecalculateWater'
import StyleSelector from './StyleSelector'
import WaterSaltsCalc from './WaterSaltsCalc'

interface RecipeFormProps {
  draft: RecipeDraft
  onChange: (draft: RecipeDraft) => void
}

/** Sugestão calculada com botão para aplicar ao campo. */
function Suggestion({ children, onUse }: { children: ReactNode; onUse: () => void }) {
  return (
    <span className="suggestion">
      {children}{' '}
      <button type="button" className="link link-small" onClick={onUse}>
        usar
      </button>
    </span>
  )
}

function Group({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="group" open={open}>
      <summary>{title}</summary>
      <div className="group-body">{children}</div>
    </details>
  )
}

/** Formulário da receita: estilo, alvos (comparados ao estilo), volumes, equipamento, maltes, lúpulos. */
export default function RecipeForm({ draft, onChange }: RecipeFormProps) {
  const set = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) => onChange({ ...draft, [key]: value })

  const og = sgValue(draft.og)
  const fg = sgValue(draft.fg)
  const batch = num(draft.batch_size_l)

  // Comparação dos alvos com o estilo
  const targets = { og, fg, ibu: num(draft.ibu), srm: num(draft.srm), abv: num(draft.abv) }
  const validation = useStyleValidation(draft.style_number, targets)
  const badge = (p: StyleParam) => {
    const r = validation.result?.results[p]
    return r ? <ConformityBadge result={r} showRange={false} /> : null
  }

  // IBU calculado a partir dos lúpulos
  const hops = draft.hops
    .map((h, row) => ({
      row,
      variety: h.variety,
      weight_g: num(h.weight_g) ?? 0,
      alpha_acid_pct: num(h.alpha_acid_pct) ?? 0,
      boil_time_min: num(h.boil_time_min) ?? -1,
    }))
    .filter((h) => h.weight_g > 0 && h.alpha_acid_pct > 0 && h.boil_time_min >= 0)
  const ibuCalc = useCalculation(
    calculate.hops,
    hops.length && og && batch && batch > 0
      ? { volume_l: batch, og, additions: hops.map(({ row: _row, ...h }) => h) }
      : null,
  )
  /** IBU da linha `row` do formulário (só linhas completas entram no cálculo). */
  const hopIbu = (row: number) => ibuCalc.result?.additions[hops.findIndex((h) => h.row === row)]?.ibu

  // Maltes: total e percentuais
  const grainKg = draft.grains.map((g) => num(g.weight_kg) ?? 0)
  const totalKg = grainKg.reduce((a, b) => a + b, 0)

  // Capacidade da panela
  const mashWater = num(draft.mash_water_l)
  const boilOff = num(draft.boil_off_rate_l_h)
  // Estimativa por lote + volume morto + evaporação; usada como sugestão quando o campo está vazio.
  const preboilSuggestion =
    batch && boilOff ? batch + (num(draft.dead_space_l) ?? 0) + (boilOff * (num(draft.boil_time_min) ?? 60)) / 60 : null
  const preboilVolume = num(draft.preboil_volume_l) ?? preboilSuggestion
  const kettle = num(draft.kettle_capacity_l)
  // Proporção para "Recalcular água": controle de trabalho do formulário, não é salva na receita.
  const [waterRatio, setWaterRatio] = useState('3')
  const mashCalc = useCalculation(
    calculate.mash,
    totalKg > 0 && kettle && kettle > 0
      ? {
          grain_kg: totalKg,
          water_to_grain_ratio: mashWater && mashWater > 0 ? mashWater / totalKg : 3,
          kettle_capacity_l: kettle,
          sparging: draft.sparging,
          sparge_water_l: draft.sparging ? num(draft.sparge_water_l) : null,
          preboil_volume_l: preboilVolume,
          recalculate:
            batch && batch > 0
              ? {
                  batch_size_l: batch,
                  dead_space_l: num(draft.dead_space_l) ?? 0,
                  boil_off_rate_l_h: num(draft.boil_off_rate_l_h) ?? 0,
                  boil_time_min: num(draft.boil_time_min) ?? 60,
                  ratio: num(waterRatio) ?? 3,
                }
              : null,
        }
      : null,
  )

  const att = num(draft.expected_attenuation_pct)
  const expectedFg = og && att && att > 0 && att < 100 ? 1 + (og - 1) * (1 - att / 100) : null
  const abvCalc = og && fg && og > fg ? abvFrom(og, fg) : null

  const updateRow = <K extends 'grains' | 'hops'>(key: K, i: number, patch: Partial<RecipeDraft[K][number]>) =>
    set(key, draft[key].map((r, j) => (j === i ? { ...r, ...patch } : r)) as RecipeDraft[K])

  return (
    <div className="recipe-form">
      <label className="field">
        <span className="field-label">Nome da receita</span>
        <input type="text" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Session IPA" />
      </label>

      <StyleSelector value={draft.style_number} onChange={(s) => set('style_number', s?.id ?? null)} />

      <Group title="Alvos da receita" open>
        <div className="grid grid-2">
          <GravityInput label="OG" value={draft.og} onChange={(v) => set('og', v)} hint={badge('og')} />
          <GravityInput
            label="FG"
            value={draft.fg}
            onChange={(v) => set('fg', v)}
            placeholder="1.012"
            hint={
              <>
                {badge('fg')}
                {expectedFg && !fg && (
                  <Suggestion onUse={() => set('fg', expectedFg.toFixed(3))}>FG pela atenuação: {expectedFg.toFixed(3)}</Suggestion>
                )}
              </>
            }
          />
          <NumberField
            label="IBU"
            value={draft.ibu}
            onChange={(v) => set('ibu', v)}
            hint={
              <>
                {badge('ibu')}
                {ibuCalc.result && (
                  <Suggestion onUse={() => set('ibu', ibuCalc.result!.total_ibu.toFixed(0))}>
                    Calculado: {fmt(ibuCalc.result.total_ibu, 0)}
                  </Suggestion>
                )}
              </>
            }
          />
          <ColorInput srm={num(draft.srm)} onChange={(v) => set('srm', v === null ? '' : String(v))} hint={badge('srm')} />
          <MaskedDecimalInput
            label="ABV"
            unit="%"
            decimals={1}
            maxDigits={3}
            placeholder="6.3"
            value={draft.abv}
            onChange={(v) => set('abv', v)}
            hint={
              <>
                {badge('abv')}
                {abvCalc !== null && (
                  <Suggestion onUse={() => set('abv', abvCalc.toFixed(1))}>
                    OG/FG: {fmt(abvCalc)}% · atenuação {fmt(attenuationFrom(og!, fg!), 0)}%
                  </Suggestion>
                )}
              </>
            }
          />
        </div>
        <GravityInput
          label="OG da mostura"
          value={draft.og_mash}
          onChange={(v) => set('og_mash', v)}
          placeholder="1.045"
          hint={<span className="muted">usada também como esperado na lavagem</span>}
        />
        {draft.style_number && validation.result && <ConformitySummary validation={validation.result} />}
      </Group>

      <Group title={`Maltes${totalKg > 0 ? ` · ${fmt(totalKg, 2)} kg` : ''}`} open>
        {draft.grains.map((g, i) => (
          <div className="row-card" key={i}>
            <label className="field row-wide">
              <span className="field-label">Malte</span>
              <input type="text" value={g.name} onChange={(e) => updateRow('grains', i, { name: e.target.value })} placeholder="Pilsen" />
            </label>
            <MaskedDecimalInput
              label="Peso"
              unit="kg"
              decimals={3}
              maxDigits={5}
              placeholder="5.000"
              value={g.weight_kg}
              onChange={(v) => updateRow('grains', i, { weight_kg: v })}
            />
            <NumberField
              label="Potencial (opcional)"
              unit="PPG"
              placeholder="37 (padrão)"
              value={g.potential_ppg}
              onChange={(v) => updateRow('grains', i, { potential_ppg: v })}
            />
            <div className="row-foot">
              <span className="muted">{totalKg > 0 && grainKg[i] > 0 ? `${fmt((grainKg[i] / totalKg) * 100, 0)}% do total` : ''}</span>
              <button type="button" className="btn-icon" aria-label="Remover malte" onClick={() => set('grains', draft.grains.filter((_, j) => j !== i))}>
                ×
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-secondary" onClick={() => set('grains', [...draft.grains, emptyGrain()])}>
          + Adicionar malte
        </button>
      </Group>

      <Group title={`Lúpulos${ibuCalc.result ? ` · ${fmt(ibuCalc.result.total_ibu, 0)} IBU` : ''}`}>
        {draft.hops.map((h, i) => {
          const ibu = hopIbu(i)
          return (
            <div className="row-card row-card-4" key={i}>
              <label className="field row-wide">
                <span className="field-label">Variedade</span>
                <input type="text" value={h.variety} onChange={(e) => updateRow('hops', i, { variety: e.target.value })} placeholder="Cascade" />
              </label>
              <NumberField label="Peso" unit="g" value={h.weight_g} onChange={(v) => updateRow('hops', i, { weight_g: v })} />
              <NumberField label="Alfa" unit="%" value={h.alpha_acid_pct} onChange={(v) => updateRow('hops', i, { alpha_acid_pct: v })} />
              <NumberField label="Tempo" unit="min" value={h.boil_time_min} onChange={(v) => updateRow('hops', i, { boil_time_min: v })} />
              <div className="row-foot">
                <span className="muted">{ibu !== undefined ? `${fmt(ibu)} IBU` : ''}</span>
                <button type="button" className="btn-icon" aria-label="Remover lúpulo" onClick={() => set('hops', draft.hops.filter((_, j) => j !== i))}>
                  ×
                </button>
              </div>
            </div>
          )
        })}
        <button type="button" className="btn btn-secondary" onClick={() => set('hops', [...draft.hops, emptyHop()])}>
          + Adicionar lúpulo
        </button>
      </Group>

      <Group title="Água e volumes" open>
        <div className="grid grid-2">
          <NumberField label="Tamanho do lote" unit="L" value={draft.batch_size_l} onChange={(v) => set('batch_size_l', v)} />
          <NumberField label="Água de mostura" unit="L" value={draft.mash_water_l} onChange={(v) => set('mash_water_l', v)} />
        </div>
        <Toggle label="Lavagem (sparge)" checked={draft.sparging} onChange={(v) => set('sparging', v)} />
        {draft.sparging && (
          <NumberField label="Água de lavagem" unit="L" value={draft.sparge_water_l} onChange={(v) => set('sparge_water_l', v)} />
        )}
        <NumberField
          label="Volume pré-fervura"
          unit="L"
          value={draft.preboil_volume_l}
          onChange={(v) => set('preboil_volume_l', v)}
          placeholder={preboilSuggestion !== null ? preboilSuggestion.toFixed(1) : 'opcional'}
          hint={
            preboilSuggestion !== null &&
            num(draft.preboil_volume_l) !== Math.round(preboilSuggestion * 10) / 10 && (
              <Suggestion onUse={() => set('preboil_volume_l', preboilSuggestion.toFixed(1))}>
                Sugestão (lote + evaporação): {fmt(preboilSuggestion)} L
              </Suggestion>
            )
          }
        />

        <RecalculateWater
          result={mashCalc.result}
          ratio={waterRatio}
          onRatioChange={setWaterRatio}
          sparging={draft.sparging}
          onApply={() => {
            const r = mashCalc.result?.recalculation
            if (!r) return
            onChange({
              ...draft,
              mash_water_l: r.mash_water_l.toFixed(1),
              sparge_water_l: r.sparge_water_l !== null ? r.sparge_water_l.toFixed(1) : draft.sparge_water_l,
              preboil_volume_l: r.preboil_volume_l.toFixed(1),
            })
          }}
        />

        {mashCalc.result && (
          <KettleAdvice
            result={mashCalc.result}
            onApply={(s) =>
              onChange({
                ...draft,
                mash_water_l: String(s.mash_water_l),
                sparge_water_l: String(s.sparge_water_l),
                sparging: true,
              })
            }
          />
        )}

        <WaterSaltsCalc
          title="Correção de sais"
          profile={draft.water_profile}
          onProfileChange={(p) => set('water_profile', p)}
          mashVolumeL={mashWater}
          spargeVolumeL={draft.sparging ? num(draft.sparge_water_l) : null}
        />

        <div className="grid grid-2">
          <NumberField label="Capacidade da panela" unit="L" value={draft.kettle_capacity_l} onChange={(v) => set('kettle_capacity_l', v)} />
          <NumberField label="Evaporação" unit="L/h" value={draft.boil_off_rate_l_h} onChange={(v) => set('boil_off_rate_l_h', v)} />
          <NumberField label="Volume morto" unit="L" value={draft.dead_space_l} onChange={(v) => set('dead_space_l', v)} />
          <NumberField label="Tempo de fervura" unit="min" step="1" value={draft.boil_time_min} onChange={(v) => set('boil_time_min', v)} />
        </div>
      </Group>

      <Group title="Fermentação">
        <label className="field">
          <span className="field-label">Levedura</span>
          <input type="text" value={draft.yeast} onChange={(e) => set('yeast', e.target.value)} placeholder="US-05" />
        </label>
        <div className="grid grid-2">
          <NumberField label="Temperatura" unit="°C" value={draft.fermentation_temp_c} onChange={(v) => set('fermentation_temp_c', v)} />
          <NumberField label="Atenuação esperada" unit="%" value={draft.expected_attenuation_pct} onChange={(v) => set('expected_attenuation_pct', v)} />
        </div>
      </Group>
    </div>
  )
}

