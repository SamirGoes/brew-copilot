// Espelha os schemas Pydantic do backend (backend/app/schemas e routers/styles.py).
// Datas chegam como strings ISO 8601.

// --- Mostura ---------------------------------------------------------------

export interface MashRequest {
  grain_kg: number
  water_to_grain_ratio?: number
  kettle_capacity_l?: number | null
  sparging?: boolean
  preboil_volume_l?: number | null
  sparge_water_l?: number | null
  recalculate?: RecalculateWaterRequest | null
}

export interface RecalculateWaterRequest {
  batch_size_l: number
  dead_space_l?: number
  boil_off_rate_l_h?: number
  boil_time_min?: number
  ratio?: number
}

export interface KettleCheck {
  fits: boolean
  capacity_l: number
  margin_l: number
  overflow_l: number
  warning: string | null
}

export interface MashResponse {
  strike_water_l: number
  mash_volume_l: number
  grain_absorption_l: number
  first_runnings_l: number
  kettle: KettleCheck | null
  sparge_water_l: number | null
  suggestion: WaterSplit | null
  preboil: { overflow_l: number; warning: string } | null
  recalculation: WaterRecalculation | null
}

export interface WaterRecalculation {
  fits: boolean
  ratio_used: number
  mash_water_l: number
  sparge_water_l: number | null
  preboil_volume_l: number
  mash_volume_l: number
  max_grain_kg: number
  warning: string | null
}

export interface WaterSplit {
  action: 'redistribute' | 'enable_sparge' | 'reduce_grain'
  mash_water_l: number | null
  sparge_water_l: number | null
  moved_l: number
  max_grain_kg: number
  message: string
}

// --- Gravidade -------------------------------------------------------------

export interface GrainInput {
  weight_kg: number
  potential_ppg?: number
}

export interface GravityRequest {
  sg?: number | null
  plato?: number | null
  expected_sg?: number | null
  actual_sg?: number | null
  og?: number | null
  fg?: number | null
  preboil_sg?: number | null
  preboil_volume_l?: number | null
  postboil_volume_l?: number | null
  current_volume_l?: number | null
  target_og?: number | null
  grains?: GrainInput[]
  fermenter_volume_l?: number | null
}

export type ComparisonStatus = 'on_target' | 'below' | 'above'
export type AdjustmentAction = 'add_water' | 'boil_off' | 'none'

export interface GravityResponse {
  conversion: { sg: number; plato: number } | null
  comparison: { deviation: number; status: ComparisonStatus } | null
  attenuation: { abv_pct: number; apparent_attenuation_pct: number } | null
  expected_postboil_sg: number | null
  adjustment: { action: AdjustmentAction; liters: number; final_volume_l: number } | null
  mash_efficiency_pct: number | null
  brewhouse_efficiency_pct: number | null
}

// --- Lúpulo ----------------------------------------------------------------

export type IbuFormula = 'tinseth' | 'rager'
export type Balance = 'malty' | 'balanced' | 'hoppy'

export interface HopInput {
  variety?: string
  weight_g: number
  alpha_acid_pct: number
  boil_time_min: number
  new_boil_time_min?: number | null
}

export interface HopsRequest {
  additions: HopInput[]
  volume_l: number
  og: number
  formula?: IbuFormula
}

export interface HopResult {
  variety: string
  weight_g: number
  alpha_acid_pct: number
  boil_time_min: number
  utilization_pct: number
  ibu: number
  adjusted_weight_g: number | null
}

export interface HopsResponse {
  formula: IbuFormula
  total_ibu: number
  additions: HopResult[]
  bu_gu: number
  balance: Balance
}

// --- Água ------------------------------------------------------------------

export type WaterProfile = 'hoppy' | 'malty' | 'balanced'

export interface WaterRequest {
  profile: WaterProfile
  mash_volume_l: number
  sparge_volume_l?: number | null
}

export interface Salts {
  caso4_g: number
  mgso4_g: number
  cacl_g: number
}

export interface WaterDose {
  volume_l: number
  salts: Salts
  ascorbic_acid: { min_drops: number; max_drops: number; label: string }
}

export interface WaterResponse {
  profile: WaterProfile
  mash: WaterDose
  sparge: WaterDose | null
}

export interface WaterProfileRow extends Salts {
  profile: WaterProfile
  label: string
}

// --- Carbonatação ----------------------------------------------------------

export interface CarbonationRequest {
  target_vols: number
  volume_l?: number | null
  beer_temp_c?: number | null
  fridge_temp_c?: number | null
}

export interface CarbonationResponse {
  table_sugar_g: number | null
  dextrose_g: number | null
  force_carb_psi: number | null
}

// --- Estilos BJCP ----------------------------------------------------------

export type StyleParam = 'og' | 'fg' | 'ibu' | 'srm' | 'abv'
export type Severity = 'within' | 'slight' | 'significant'

export interface Range {
  min: number
  max: number
}

export interface StyleSummary {
  id: string
  name: string
  category: string
  ranges: Partial<Record<StyleParam, Range>>
}

export interface StyleDetail extends StyleSummary {
  details: Record<string, string>
  midpoints: Partial<Record<StyleParam, number>>
}

export type StyleValues = Partial<Record<StyleParam, number | null>>

export interface ValidateRequest extends StyleValues {
  style_id: string
}

export interface ParamResult {
  parameter: StyleParam
  value: number
  range_min: number
  range_max: number
  severity: Severity
  deviation_pct: number
  deviation_abs: number
  message: string | null
}

export interface ConformitySummary {
  total: number
  within: number
  slight: StyleParam[]
  significant: StyleParam[]
  compliant: boolean
  text: string
}

export interface ValidateResponse {
  style_id: string
  style_name: string
  results: Partial<Record<StyleParam, ParamResult>>
  summary: ConformitySummary
}

// --- Receitas --------------------------------------------------------------

export interface Grain {
  name: string
  weight_kg: number
  potential_ppg?: number
}

export interface HopAddition {
  variety: string
  weight_g: number
  alpha_acid_pct: number
  boil_time_min: number
}

export interface RecipeBase {
  name: string
  style_number?: string | null
  batch_size_l?: number
  mash_water_l?: number | null
  sparge_water_l?: number | null
  sparging?: boolean
  kettle_capacity_l?: number | null
  boil_off_rate_l_h?: number | null
  dead_space_l?: number
  boil_time_min?: number
  og_mash?: number | null
  og_preboil?: number | null
  og?: number | null
  fg?: number | null
  ibu?: number | null
  srm?: number | null
  abv?: number | null
  preboil_volume_l?: number | null
  water_profile?: WaterProfile | null
  yeast?: string | null
  fermentation_temp_c?: number | null
  expected_attenuation_pct?: number | null
}

export interface RecipeCreate extends RecipeBase {
  grains?: Grain[]
  hops?: HopAddition[]
}

export type RecipeUpdate = RecipeCreate

export interface Recipe extends Required<RecipeBase> {
  id: number
  created_at: string
  updated_at: string
  grains: (Required<Grain> & { id: number })[]
  hops: (HopAddition & { id: number })[]
}

// --- Sessões ---------------------------------------------------------------

export const PHASES = [
  'mash',
  'lauter',
  'boil',
  'cooling',
  'fermentation',
  'conditioning',
  'carbonation',
] as const
export type Phase = (typeof PHASES)[number]

export interface SessionCreate {
  name?: string | null
  recipe_id?: number | null
  notes?: string | null
}

export interface SessionUpdate {
  name?: string | null
  notes?: string | null
}

export interface ReadingCreate {
  phase?: Phase | null
  parameter: string
  expected?: number | null
  actual?: number | null
  unit?: string | null
  notes?: string | null
}

export interface Reading {
  id: number
  phase: Phase
  parameter: string
  expected: number | null
  actual: number | null
  unit: string | null
  recorded_at: string
  notes: string | null
  deviation: number | null
}

export interface BrewSession {
  id: number
  name: string
  recipe_id: number | null
  recipe_name: string | null
  current_phase: Phase
  created_at: string
  completed_at: string | null
  notes: string | null
  readings: Reading[]
}
