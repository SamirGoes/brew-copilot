import { useEffect, useState } from 'react'
import { errorMessage } from '../api/client'

interface CalcState<T> {
  result: T | null
  error: string | null
  loading: boolean
}

/**
 * Recalcula via API sempre que `request` muda (com debounce), descartando
 * respostas atrasadas. `request = null` significa "entradas incompletas".
 * `fn` deve ser estável (ex.: `calculate.mash`). Enquanto recalcula, mantém o
 * último resultado para a tela não piscar.
 */
export function useCalculation<Req, Res>(
  fn: (req: Req) => Promise<Res>,
  request: Req | null,
  delayMs = 250,
): CalcState<Res> {
  const key = request === null ? null : JSON.stringify(request)
  const [state, setState] = useState<{ key: string | null; result: Res | null; error: string | null }>({
    key: null,
    result: null,
    error: null,
  })

  useEffect(() => {
    if (key === null) return
    let cancelled = false
    const timer = setTimeout(() => {
      fn(JSON.parse(key) as Req)
        .then((result) => !cancelled && setState({ key, result, error: null }))
        .catch((err) => !cancelled && setState({ key, result: null, error: errorMessage(err) }))
    }, delayMs)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [fn, key, delayMs])

  if (key === null) return { result: null, error: null, loading: false }
  return { result: state.result, error: state.error, loading: state.key !== key }
}

/** Converte o texto de um input numérico; vazio ou inválido vira null. */
export function num(value: string | null | undefined): number | null {
  if (value == null || value.trim() === '') return null
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** true quando todos os valores são números positivos. */
export function allPositive(...values: (number | null | undefined)[]): boolean {
  return values.every((v) => typeof v === 'number' && v > 0)
}

/** Gravidade mascarada ("1.052"); só vira número com os 4 dígitos completos. */
export function sgValue(value: string): number | null {
  return /^\d\.\d{3}$/.test(value) ? Number(value) : null
}
