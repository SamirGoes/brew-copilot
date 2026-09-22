import type { Phase, Reading, Recipe, StyleParam } from '../types'

export const PHASE_LABELS: Record<Phase, string> = {
  mash: 'Mostura',
  lauter: 'Lavagem',
  boil: 'Fervura',
  cooling: 'Resfriamento',
  fermentation: 'Fermentação',
  conditioning: 'Maturação',
  carbonation: 'Carbonatação',
}

export interface PhaseParam {
  key: string
  label: string
  unit: string
  /** 'sg' usa a máscara de gravidade. */
  kind: 'sg' | 'number'
  expected?: (r: Recipe) => number | null
  /** Parâmetro validado contra o estilo. */
  style?: StyleParam
  /** Esconde o parâmetro para esta receita (ex.: lavagem em BIAB). */
  hidden?: (r: Recipe) => boolean
}

export interface PhaseConfig {
  params: PhaseParam[]
  tools: { to: string; label: string }[]
}

/** Volume pré-fervura da receita, se informado; senão, estimado por lote + volume morto + evaporação. */
const preboilVolume = (r: Recipe) =>
  r.preboil_volume_l ?? (r.boil_off_rate_l_h ? r.batch_size_l + r.dead_space_l + (r.boil_off_rate_l_h * r.boil_time_min) / 60 : null)

export const PHASE_CONFIG: Record<Phase, PhaseConfig> = {
  mash: {
    params: [
      { key: 'mash_water_l', label: 'Água de mostura', unit: 'L', kind: 'number', expected: (r) => r.mash_water_l },
      { key: 'mash_temp_c', label: 'Temperatura da mostura', unit: '°C', kind: 'number' },
      { key: 'og_mash', label: 'Gravidade da mostura', unit: 'SG', kind: 'sg', expected: (r) => r.og_mash },
    ],
    tools: [
      { to: '/ferramentas/mostura', label: 'Mostura' },
      { to: '/ferramentas/agua', label: 'Água' },
    ],
  },
  lauter: {
    params: [
      {
        key: 'sparge_water_l',
        label: 'Água de lavagem',
        unit: 'L',
        kind: 'number',
        expected: (r) => r.sparge_water_l,
        hidden: (r) => !r.sparging,
      },
      { key: 'preboil_volume_l', label: 'Volume pré-fervura', unit: 'L', kind: 'number', expected: preboilVolume },
      {
        key: 'og_preboil',
        label: 'Gravidade pré-fervura',
        unit: 'SG',
        kind: 'sg',
        // A receita não tem mais um alvo de pré-fervura separado (é considerado igual ao da mostura).
        expected: (r) => r.og_mash,
      },
    ],
    tools: [
      { to: '/ferramentas/mostura', label: 'Mostura' },
      { to: '/ferramentas/gravidade', label: 'Gravidade' },
    ],
  },
  boil: {
    params: [
      { key: 'boil_time_min', label: 'Tempo de fervura', unit: 'min', kind: 'number', expected: (r) => r.boil_time_min },
      {
        key: 'postboil_volume_l',
        label: 'Volume pós-fervura',
        unit: 'L',
        kind: 'number',
        expected: (r) => r.batch_size_l + r.dead_space_l,
      },
      { key: 'og', label: 'OG', unit: 'SG', kind: 'sg', expected: (r) => r.og, style: 'og' },
      { key: 'ibu', label: 'IBU estimado', unit: 'IBU', kind: 'number', expected: (r) => r.ibu, style: 'ibu' },
    ],
    tools: [
      { to: '/ferramentas/lupulo', label: 'Lúpulo' },
      { to: '/ferramentas/gravidade', label: 'Correção de OG' },
    ],
  },
  cooling: {
    params: [
      { key: 'fermenter_volume_l', label: 'Volume no fermentador', unit: 'L', kind: 'number', expected: (r) => r.batch_size_l },
      {
        key: 'pitch_temp_c',
        label: 'Temperatura de inoculação',
        unit: '°C',
        kind: 'number',
        expected: (r) => r.fermentation_temp_c,
      },
    ],
    tools: [{ to: '/ferramentas/gravidade', label: 'Gravidade' }],
  },
  fermentation: {
    params: [
      {
        key: 'ferm_temp_c',
        label: 'Temperatura de fermentação',
        unit: '°C',
        kind: 'number',
        expected: (r) => r.fermentation_temp_c,
      },
      { key: 'fg', label: 'FG', unit: 'SG', kind: 'sg', expected: (r) => r.fg, style: 'fg' },
    ],
    tools: [{ to: '/ferramentas/gravidade', label: 'Gravidade' }],
  },
  conditioning: {
    params: [
      { key: 'conditioning_days', label: 'Tempo de maturação', unit: 'dias', kind: 'number' },
      { key: 'conditioning_temp_c', label: 'Temperatura de maturação', unit: '°C', kind: 'number' },
    ],
    tools: [],
  },
  carbonation: {
    params: [{ key: 'co2_volumes', label: 'Volumes de CO₂', unit: 'vol', kind: 'number' }],
    tools: [],
  },
}

/** Parâmetros gravados que não são valores de fase (marcação de conclusão, log de fermentação). */
export const PHASE_COMPLETED = 'phase_completed'
export const FERMENTATION_GRAVITY = 'gravity'

/** Última leitura de cada parâmetro por fase: `${phase}:${parameter}` → leitura. */
export function latestReadings(readings: Reading[]): Map<string, Reading> {
  const map = new Map<string, Reading>()
  for (const r of readings) {
    if (r.parameter === PHASE_COMPLETED || r.parameter === FERMENTATION_GRAVITY) continue
    map.set(`${r.phase}:${r.parameter}`, r) // já vêm ordenadas por recorded_at
  }
  return map
}

/** Valor medido de um parâmetro em qualquer fase (ex.: OG da fervura). */
export function actualOf(latest: Map<string, Reading>, phase: Phase, parameter: string): number | null {
  return latest.get(`${phase}:${parameter}`)?.actual ?? null
}
