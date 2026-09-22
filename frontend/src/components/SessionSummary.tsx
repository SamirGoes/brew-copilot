import { calculate } from '../api/client'
import { useCalculation } from '../hooks/useCalculation'
import type { GravityRequest, ParamResult, Reading, Recipe, StyleParam } from '../types'
import { fmt, fmtSg } from '../utils/format'
import { actualOf } from '../utils/phases'
import { abvFrom } from '../utils/recipe'
import ConformityBadge from './ConformityBadge'

interface SessionSummaryProps {
  recipe: Recipe | null
  latest: Map<string, Reading>
  styleResults: Partial<Record<StyleParam, ParamResult>>
}

interface Row {
  label: string
  expected: number | null
  actual: number | null
  format: (n: number | null) => string
  /** Desvio relativo acima do qual o parâmetro entra nas notas. */
  tolerance: (expected: number) => number
  style?: StyleParam
}

const efficiencyRequest = (recipe: Recipe | null, og: number | null, volume: number | null): GravityRequest | null =>
  recipe && recipe.grains.length && og && og > 1 && volume && volume > 0
    ? { og, fermenter_volume_l: volume, grains: recipe.grains.map((g) => ({ weight_kg: g.weight_kg, potential_ppg: g.potential_ppg })) }
    : null

/** Resumo esperado vs. atingido: OG, FG, ABV, IBU e eficiência, com notas dos maiores desvios. */
export default function SessionSummary({ recipe, latest, styleResults }: SessionSummaryProps) {
  const og = actualOf(latest, 'boil', 'og')
  const fg = actualOf(latest, 'fermentation', 'fg')
  const volume = actualOf(latest, 'cooling', 'fermenter_volume_l')

  const expectedEff = useCalculation(calculate.gravity, efficiencyRequest(recipe, recipe?.og ?? null, recipe?.batch_size_l ?? null))
  const actualEff = useCalculation(calculate.gravity, efficiencyRequest(recipe, og, volume ?? recipe?.batch_size_l ?? null))

  const expectedAbv = recipe?.abv ?? (recipe?.og && recipe?.fg ? abvFrom(recipe.og, recipe.fg) : null)
  const rows: Row[] = [
    { label: 'OG', expected: recipe?.og ?? null, actual: og, format: fmtSg, tolerance: () => 0.002, style: 'og' },
    { label: 'FG', expected: recipe?.fg ?? null, actual: fg, format: fmtSg, tolerance: () => 0.002, style: 'fg' },
    {
      label: 'ABV',
      expected: expectedAbv,
      actual: og && fg ? abvFrom(og, fg) : null,
      format: (n) => (n === null ? '—' : `${fmt(n)}%`),
      tolerance: () => 0.3,
      style: 'abv',
    },
    {
      label: 'IBU',
      expected: recipe?.ibu ?? null,
      actual: actualOf(latest, 'boil', 'ibu'),
      format: (n) => fmt(n, 0),
      tolerance: (e) => e * 0.1,
      style: 'ibu',
    },
    {
      label: 'Eficiência',
      expected: expectedEff.result?.brewhouse_efficiency_pct ?? null,
      actual: actualEff.result?.brewhouse_efficiency_pct ?? null,
      format: (n) => (n === null ? '—' : `${fmt(n, 0)}%`),
      tolerance: () => 5,
    },
  ]

  const notes = rows
    .filter((r) => r.expected !== null && r.actual !== null && Math.abs(r.actual - r.expected) > r.tolerance(r.expected))
    .map((r) => {
      const dev = r.actual! - r.expected!
      return `${r.label} ${dev > 0 ? 'acima' : 'abaixo'} do esperado (${r.format(r.expected)} → ${r.format(r.actual)})`
    })

  return (
    <div className="summary">
      <table className="table">
        <thead>
          <tr>
            <th>Parâmetro</th>
            <th>Esperado</th>
            <th>Atingido</th>
            <th>Estilo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const style = r.style ? styleResults[r.style] : undefined
            return (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.format(r.expected)}</td>
                <td>
                  <strong>{r.format(r.actual)}</strong>
                </td>
                <td>{style ? <ConformityBadge result={style} showRange={false} /> : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {notes.length > 0 ? (
        <ul className="notes">
          {notes.map((n) => (
            <li key={n}>⚠ {n}</li>
          ))}
        </ul>
      ) : (
        rows.some((r) => r.actual !== null) && <p className="alert alert-ok">✓ Sem desvios relevantes em relação ao esperado.</p>
      )}
    </div>
  )
}
