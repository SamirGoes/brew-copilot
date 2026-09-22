import type { ParamResult } from '../types'
import { useColorUnit } from '../hooks/useColorUnit'
import { SEVERITY_ICON, SEVERITY_TEXT, formatRange, formatValue, paramLabel } from '../utils/format'

interface ConformityBadgeProps {
  result: ParamResult
  /** Mostra a faixa do estilo junto ao valor. */
  showRange?: boolean
}

/** Indicador verde/laranja/vermelho de um parâmetro contra a faixa do estilo. */
export default function ConformityBadge({ result, showRange = true }: ConformityBadgeProps) {
  const { parameter, value, severity, deviation_pct, message } = result
  const [unit] = useColorUnit()
  const label = paramLabel(parameter, unit)
  const pct = `${deviation_pct > 0 ? '+' : ''}${deviation_pct.toFixed(0)}%`
  return (
    <span
      className={`badge badge-${severity}`}
      title={`${label} ${SEVERITY_TEXT[severity]}`}
      aria-label={`${label} ${formatValue(parameter, value, unit)}: ${message ?? SEVERITY_TEXT[severity]}`}
    >
      <span className="badge-icon" aria-hidden="true">{SEVERITY_ICON[severity]}</span>
      <span className="badge-param">{label}</span>
      <span className="badge-value">{formatValue(parameter, value, unit)}</span>
      {severity !== 'within' && <span className="badge-dev">{pct}</span>}
      {showRange && (
        <span className="badge-range">{formatRange(parameter, result.range_min, result.range_max, unit)}</span>
      )}
    </span>
  )
}
