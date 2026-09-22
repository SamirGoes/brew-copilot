import type { MashResponse, WaterSplit } from '../types'
import { fmt } from '../utils/format'

interface KettleAdviceProps {
  result: MashResponse
  /** Aplica a redistribuição sugerida (omitido = só exibe). */
  onApply?: (suggestion: WaterSplit) => void
}

/** Se a mostura cabe na panela e, se não, como redistribuir a água. */
export default function KettleAdvice({ result, onApply }: KettleAdviceProps) {
  const { kettle, suggestion, preboil } = result
  if (!kettle) return null
  return (
    <div className="kettle-advice">
      {kettle.fits ? (
        <p className="alert alert-ok">
          ✓ Mostura ({fmt(result.mash_volume_l)} L) cabe na panela — sobra {fmt(kettle.margin_l)} L.
        </p>
      ) : (
        <div className={`alert ${suggestion?.action === 'reduce_grain' ? 'alert-bad' : 'alert-warn'}`} role="alert">
          <p>
            ✗ Mostura com {fmt(result.mash_volume_l)} L não cabe na panela de {fmt(kettle.capacity_l)} L (excede{' '}
            {fmt(kettle.overflow_l)} L).
          </p>
          {suggestion && (
            <>
              <p>
                <strong>Sugestão:</strong> {suggestion.message}
              </p>
              {suggestion.action !== 'reduce_grain' && onApply && (
                <button type="button" className="btn" onClick={() => onApply(suggestion)}>
                  Aplicar ajuste
                </button>
              )}
            </>
          )}
        </div>
      )}
      {preboil && <p className="alert alert-warn">⚠ {preboil.warning}</p>}
    </div>
  )
}
