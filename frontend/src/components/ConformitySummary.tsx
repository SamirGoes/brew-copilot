import type { StyleParam, ValidateResponse } from '../types'
import ConformityBadge from './ConformityBadge'

const ORDER: StyleParam[] = ['og', 'fg', 'ibu', 'srm', 'abv']

/** Resumo "X/5 dentro do estilo" com a lista de parâmetros e seus desvios. */
export default function ConformitySummary({ validation }: { validation: ValidateResponse }) {
  const { summary, results } = validation
  const tone = summary.significant.length ? 'bad' : summary.slight.length ? 'warn' : 'ok'
  const params = ORDER.filter((p) => results[p])

  return (
    <div className={`conformity conformity-${tone}`}>
      <div className="conformity-head">
        <strong>
          {summary.within}/{summary.total} dentro do estilo
        </strong>
        {summary.compliant && <span className="badge badge-within badge-compliant">✓ BJCP Compliant</span>}
      </div>
      {summary.total > 0 && <p className="muted">{summary.text}</p>}
      <ul className="conformity-list">
        {params.map((p) => (
          <li key={p}>
            <ConformityBadge result={results[p]!} />
            {results[p]!.message && <span className="conformity-msg">{results[p]!.message}</span>}
          </li>
        ))}
      </ul>
      {summary.total === 0 && <p className="muted">Informe valores para validar contra o estilo.</p>}
    </div>
  )
}
