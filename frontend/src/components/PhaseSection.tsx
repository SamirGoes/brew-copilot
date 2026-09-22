import { type ReactNode, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { num, sgValue } from '../hooks/useCalculation'
import type { ParamResult, Phase, Reading, Recipe, StyleParam } from '../types'
import { fmt, fmtSg } from '../utils/format'
import { PHASE_CONFIG, PHASE_LABELS, type PhaseParam } from '../utils/phases'
import ConformityBadge from './ConformityBadge'
import { NumberField } from './Field'
import GravityInput from './GravityInput'

export type PhaseStatus = 'done' | 'active' | 'pending'

interface PhaseSectionProps {
  phase: Phase
  index: number
  status: PhaseStatus
  recipe: Recipe | null
  latest: Map<string, Reading>
  styleResults: Partial<Record<StyleParam, ParamResult>>
  readOnly?: boolean
  onRecord: (phase: Phase, param: PhaseParam, expected: number | null, actual: number) => Promise<void>
  onAdvance?: () => Promise<void>
  children?: ReactNode
}

const STATUS_TEXT: Record<PhaseStatus, string> = { done: 'concluída', active: 'em andamento', pending: 'pendente' }

const parse = (p: PhaseParam, v: string) => (p.kind === 'sg' ? sgValue(v) : num(v))
const show = (p: PhaseParam, v: number | null | undefined) =>
  v === null || v === undefined ? '' : p.kind === 'sg' ? v.toFixed(3) : String(v)

/** Desvio medido − esperado, com tom: SG tolera 0.002; demais, 5% do esperado. */
function Deviation({ p, expected, actual }: { p: PhaseParam; expected: number | null; actual: number | null }) {
  if (expected === null || actual === null) return null
  const dev = actual - expected
  const ok = p.kind === 'sg' ? Math.abs(dev) <= 0.002 : Math.abs(dev) <= Math.abs(expected) * 0.05
  const text = p.kind === 'sg' ? fmtSg(dev) : fmt(dev)
  return (
    <span className={`deviation deviation-${ok ? 'ok' : 'warn'}`}>
      {ok ? '✓' : '⚠'} {dev > 0 ? '+' : ''}
      {text} {p.kind === 'sg' ? '' : p.unit}
    </span>
  )
}

/** Uma fase da brassagem: esperado (receita) vs. medido, desvio e indicador de estilo. */
export default function PhaseSection(props: PhaseSectionProps) {
  const { phase, index, status, recipe, latest, styleResults, readOnly, onRecord, onAdvance, children } = props
  const config = PHASE_CONFIG[phase]
  const params = config.params.filter((p) => !(recipe && p.hidden?.(recipe)))
  const saved = (p: PhaseParam) => latest.get(`${phase}:${p.key}`)?.actual ?? null
  const expectedOf = (p: PhaseParam) => (recipe && p.expected ? p.expected(recipe) : null) ?? null

  const [open, setOpen] = useState(status !== 'pending')
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(params.map((p) => [p.key, show(p, saved(p))])),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = params.filter((p) => {
    const v = parse(p, values[p.key] ?? '')
    return v !== null && v !== saved(p)
  })

  // Gravações em fila: o blur de um campo e o clique em "Concluir" não duplicam leituras.
  const queue = useRef<Promise<void>>(Promise.resolve())
  const recordedNow = useRef<Record<string, number>>({})

  const saveDirty = () => {
    const snapshot = values
    const run = queue.current.then(async () => {
      const todo = params.filter((p) => {
        const v = parse(p, snapshot[p.key] ?? '')
        return v !== null && v !== (recordedNow.current[p.key] ?? saved(p))
      })
      if (!todo.length) return
      setSaving(true)
      setError(null)
      try {
        for (const p of todo) {
          const v = parse(p, snapshot[p.key])!
          await onRecord(phase, p, expectedOf(p), v)
          recordedNow.current[p.key] = v
        }
      } catch (e) {
        setError(errorMessage(e))
        throw e
      } finally {
        setSaving(false)
      }
    })
    queue.current = run.catch(() => {})
    return run
  }

  const advance = async () => {
    try {
      await saveDirty()
      await onAdvance?.()
    } catch {
      /* erro já exibido */
    }
  }

  const recorded = params.filter((p) => saved(p) !== null).length

  return (
    <section className={`card phase phase-${status}`} aria-labelledby={`phase-${phase}`}>
      <button type="button" className="phase-header" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="phase-number">{status === 'done' ? '✓' : index + 1}</span>
        <span className="phase-title" id={`phase-${phase}`}>
          {PHASE_LABELS[phase]}
        </span>
        <span className={`phase-status phase-status-${status}`}>
          {STATUS_TEXT[status]}
          {recorded > 0 && ` · ${recorded}/${params.length}`}
        </span>
      </button>

      {open && (
        <div className="phase-body" onBlur={() => !readOnly && saveDirty().catch(() => {})}>
          {params.map((p) => {
            const expected = expectedOf(p)
            const actual = saved(p)
            const style = p.style ? styleResults[p.style] : undefined
            const label = `${p.label}${expected !== null ? ` · esperado ${show(p, expected)}${p.kind === 'sg' ? '' : ` ${p.unit}`}` : ''}`
            const hint = (
              <span className="param-hint">
                <Deviation p={p} expected={expected} actual={actual} />
                {style && <ConformityBadge result={style} />}
              </span>
            )
            const onChange = (v: string) => setValues((s) => ({ ...s, [p.key]: v }))
            return (
              <div className="param-row" key={p.key}>
                {readOnly ? (
                  <div className="field">
                    <span className="field-label">{label}</span>
                    <strong>{actual !== null ? `${show(p, actual)} ${p.kind === 'sg' ? '' : p.unit}` : '—'}</strong>
                    {hint}
                  </div>
                ) : p.kind === 'sg' ? (
                  <GravityInput label={label} value={values[p.key] ?? ''} onChange={onChange} hint={hint} placeholder="" />
                ) : (
                  <NumberField label={label} unit={p.unit} value={values[p.key] ?? ''} onChange={onChange} hint={hint} />
                )}
              </div>
            )
          })}

          {children}

          {error && <p className="alert alert-bad">{error}</p>}
          {!readOnly && (
            <p className="muted save-state" aria-live="polite">
              {saving ? 'Salvando…' : dirty.length ? 'Alterações serão salvas ao sair do campo.' : recorded ? 'Valores salvos ✓' : ''}
            </p>
          )}

          {config.tools.length > 0 && (
            <div className="phase-tools">
              <span className="muted">Ferramentas:</span>
              {config.tools.map((t) => (
                <Link key={t.to} to={t.to} className="chip">
                  {t.label}
                </Link>
              ))}
            </div>
          )}

          {status === 'active' && onAdvance && !readOnly && (
            <button type="button" className="btn" onClick={advance} disabled={saving}>
              {phase === 'carbonation' ? 'Concluir brassagem' : `Concluir ${PHASE_LABELS[phase].toLowerCase()} e avançar`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
