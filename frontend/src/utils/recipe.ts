import { num, sgValue } from '../hooks/useCalculation'
import type { Recipe, RecipeCreate, WaterProfile } from '../types'

// Rascunho do formulário: tudo como texto, para permitir edição livre (e a máscara de SG).

export interface GrainDraft {
  name: string
  weight_kg: string
  potential_ppg: string
}

export interface HopDraft {
  variety: string
  weight_g: string
  alpha_acid_pct: string
  boil_time_min: string
}

export interface RecipeDraft {
  name: string
  style_number: string | null
  og: string
  fg: string
  og_mash: string
  ibu: string
  srm: string
  abv: string
  batch_size_l: string
  mash_water_l: string
  sparge_water_l: string
  sparging: boolean
  preboil_volume_l: string
  water_profile: WaterProfile | null
  kettle_capacity_l: string
  boil_off_rate_l_h: string
  dead_space_l: string
  boil_time_min: string
  yeast: string
  fermentation_temp_c: string
  expected_attenuation_pct: string
  grains: GrainDraft[]
  hops: HopDraft[]
}

// Potencial vazio = desconhecido; a API usa 37 PPG.
export const emptyGrain = (): GrainDraft => ({ name: '', weight_kg: '', potential_ppg: '' })
export const emptyHop = (): HopDraft => ({ variety: '', weight_g: '', alpha_acid_pct: '', boil_time_min: '' })

export const emptyDraft = (): RecipeDraft => ({
  name: '',
  style_number: null,
  og: '',
  fg: '',
  og_mash: '',
  ibu: '',
  srm: '',
  abv: '',
  batch_size_l: '20',
  mash_water_l: '',
  sparge_water_l: '',
  sparging: true,
  preboil_volume_l: '',
  water_profile: null,
  kettle_capacity_l: '',
  boil_off_rate_l_h: '',
  dead_space_l: '0',
  boil_time_min: '60',
  yeast: '',
  fermentation_temp_c: '',
  expected_attenuation_pct: '',
  grains: [emptyGrain()],
  hops: [emptyHop()],
})

const s = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v))
const sg = (v: number | null | undefined) => (v === null || v === undefined ? '' : v.toFixed(3))
/** Valores em campos com máscara decimal precisam vir com as casas da máscara. */
const fixed = (v: number | null | undefined, digits: number) => (v === null || v === undefined ? '' : v.toFixed(digits))

export function draftFromRecipe(r: Recipe): RecipeDraft {
  return {
    name: r.name,
    style_number: r.style_number,
    og: sg(r.og),
    fg: sg(r.fg),
    og_mash: sg(r.og_mash),
    ibu: s(r.ibu),
    srm: s(r.srm),
    abv: fixed(r.abv, 1),
    batch_size_l: s(r.batch_size_l),
    mash_water_l: s(r.mash_water_l),
    sparge_water_l: s(r.sparge_water_l),
    sparging: r.sparging,
    preboil_volume_l: s(r.preboil_volume_l),
    water_profile: r.water_profile,
    kettle_capacity_l: s(r.kettle_capacity_l),
    boil_off_rate_l_h: s(r.boil_off_rate_l_h),
    dead_space_l: s(r.dead_space_l),
    boil_time_min: s(r.boil_time_min),
    yeast: r.yeast ?? '',
    fermentation_temp_c: s(r.fermentation_temp_c),
    expected_attenuation_pct: s(r.expected_attenuation_pct),
    grains: r.grains.length
      ? r.grains.map((g) => ({
          name: g.name,
          weight_kg: fixed(g.weight_kg, 3),
          potential_ppg: g.potential_ppg === 37 ? '' : s(g.potential_ppg),
        }))
      : [emptyGrain()],
    hops: r.hops.length
      ? r.hops.map((h) => ({
          variety: h.variety,
          weight_g: s(h.weight_g),
          alpha_acid_pct: s(h.alpha_acid_pct),
          boil_time_min: s(h.boil_time_min),
        }))
      : [emptyHop()],
  }
}

const isBlank = (row: object) => Object.values(row).every((v) => v === '')

/** Converte o rascunho para o payload da API; `errors` lista o que impede salvar. */
export function draftToRecipe(d: RecipeDraft): { data: RecipeCreate; errors: string[] } {
  const errors: string[] = []
  if (!d.name.trim()) errors.push('Informe o nome da receita.')

  const grains = d.grains.filter((g) => !isBlank(g))
  grains.forEach((g, i) => {
    if (!g.name.trim() || !(num(g.weight_kg)! > 0)) errors.push(`Malte ${i + 1}: informe nome e peso.`)
  })
  const hops = d.hops.filter((h) => !isBlank(h))
  hops.forEach((h, i) => {
    const t = num(h.boil_time_min)
    if (!h.variety.trim() || !(num(h.weight_g)! > 0) || !(num(h.alpha_acid_pct)! > 0) || t === null || t < 0)
      errors.push(`Lúpulo ${i + 1}: informe variedade, peso, alfa e tempo.`)
  })
  for (const [label, v] of [['OG', d.og], ['FG', d.fg], ['OG da mostura', d.og_mash]]) {
    if (v && sgValue(v) === null) errors.push(`${label}: complete os 4 dígitos.`)
  }

  const opt = (v: string) => num(v)
  return {
    errors,
    data: {
      name: d.name.trim(),
      style_number: d.style_number,
      og: sgValue(d.og),
      fg: sgValue(d.fg),
      og_mash: sgValue(d.og_mash),
      ibu: opt(d.ibu),
      srm: opt(d.srm),
      abv: opt(d.abv),
      batch_size_l: num(d.batch_size_l) ?? 20,
      mash_water_l: opt(d.mash_water_l),
      sparge_water_l: d.sparging ? opt(d.sparge_water_l) : null,
      sparging: d.sparging,
      preboil_volume_l: opt(d.preboil_volume_l),
      water_profile: d.water_profile,
      kettle_capacity_l: opt(d.kettle_capacity_l),
      boil_off_rate_l_h: opt(d.boil_off_rate_l_h),
      dead_space_l: num(d.dead_space_l) ?? 0,
      boil_time_min: Math.round(num(d.boil_time_min) ?? 60),
      yeast: d.yeast.trim() || null,
      fermentation_temp_c: opt(d.fermentation_temp_c),
      expected_attenuation_pct: opt(d.expected_attenuation_pct),
      grains: grains.map((g) => ({
        name: g.name.trim(),
        weight_kg: num(g.weight_kg)!,
        potential_ppg: num(g.potential_ppg) ?? 37,
      })),
      hops: hops.map((h) => ({
        variety: h.variety.trim(),
        weight_g: num(h.weight_g)!,
        alpha_acid_pct: num(h.alpha_acid_pct)!,
        boil_time_min: Math.round(num(h.boil_time_min)!),
      })),
    },
  }
}

/** ABV pela mesma fórmula do backend (gravity.abv). */
export const abvFrom = (og: number, fg: number) => (og - fg) * 131.25
export const attenuationFrom = (og: number, fg: number) => ((og - fg) / (og - 1)) * 100
