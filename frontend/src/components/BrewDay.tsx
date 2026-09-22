import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { errorMessage, recipes, sessions } from '../api/client'
import { useStyleValidation } from '../hooks/useStyleValidation'
import { type BrewSession, PHASES, type Phase, type Recipe } from '../types'
import { PHASE_COMPLETED, FERMENTATION_GRAVITY, PHASE_LABELS, type PhaseParam, actualOf, latestReadings } from '../utils/phases'
import { type RecipeDraft, abvFrom, draftFromRecipe, draftToRecipe } from '../utils/recipe'
import { CarbonationCalc, FermentationLog } from './PhaseExtras'
import PhaseSection, { type PhaseStatus } from './PhaseSection'
import RecipeForm from './RecipeForm'
import SessionSummary from './SessionSummary'

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })

/** Receita salva automaticamente (debounce) quando o rascunho é válido e mudou. */
function useRecipeAutosave(recipe: Recipe | null, draft: RecipeDraft | null, onSaved: (r: Recipe) => void) {
  const [state, setState] = useState<{ status: 'idle' | 'saving' | 'saved' | 'error'; messages: string[] }>({
    status: 'idle',
    messages: [],
  })
  const savedKey = useRef<string | null>(null)
  const onSavedRef = useRef(onSaved)
  useEffect(() => {
    onSavedRef.current = onSaved
  })

  const { data, errors } = draft ? draftToRecipe(draft) : { data: null, errors: [] }
  const key = data ? JSON.stringify(data) : null

  useEffect(() => {
    if (!recipe || key === null) return
    if (savedKey.current === null) {
      savedKey.current = key // primeira carga: nada a salvar
      return
    }
    if (key === savedKey.current || errors.length) return
    const timer = setTimeout(() => {
      setState({ status: 'saving', messages: [] })
      recipes
        .update(recipe.id, JSON.parse(key))
        .then((r) => {
          savedKey.current = key
          onSavedRef.current(r)
          setState({ status: 'saved', messages: [] })
        })
        .catch((e) => setState({ status: 'error', messages: [errorMessage(e)] }))
    }, 800)
    return () => clearTimeout(timer)
  }, [recipe, key, errors.length])

  return errors.length ? { status: 'error' as const, messages: errors } : state
}

export default function BrewDay() {
  const { id } = useParams()
  const sessionId = Number(id)
  const [session, setSession] = useState<BrewSession | null>(null)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [draft, setDraft] = useState<RecipeDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editDone, setEditDone] = useState(false)
  // Muda quando um valor é gravado fora da seção (ex.: "usar como FG"), para remontá-la.
  const [rev, setRev] = useState(0)

  useEffect(() => {
    let cancelled = false
    sessions
      .get(sessionId)
      .then(async (s) => {
        const r = s.recipe_id ? await recipes.get(s.recipe_id).catch(() => null) : null
        if (cancelled) return
        setSession(s)
        setRecipe(r)
        setDraft(r ? draftFromRecipe(r) : null)
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const autosave = useRecipeAutosave(recipe, draft, setRecipe)

  const latest = latestReadings(session?.readings ?? [])
  const og = actualOf(latest, 'boil', 'og')
  const fg = actualOf(latest, 'fermentation', 'fg')
  const actualValidation = useStyleValidation(recipe?.style_number ?? null, {
    og,
    fg,
    ibu: actualOf(latest, 'boil', 'ibu'),
    abv: og && fg ? abvFrom(og, fg) : null,
  })
  const styleResults = actualValidation.result?.results ?? {}

  if (error) return <p className="alert alert-bad">{error}</p>
  if (!session) return <p className="muted">Carregando brassagem…</p>

  const completed = session.completed_at !== null
  const currentIdx = PHASES.indexOf(session.current_phase)
  const statusOf = (i: number): PhaseStatus => (completed || i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'pending')
  const readOnly = completed && !editDone

  const addReading = async (req: Parameters<typeof sessions.addReading>[1]) => {
    const reading = await sessions.addReading(sessionId, req)
    setSession((s) => (s ? { ...s, readings: [...s.readings, reading] } : s))
  }
  const onRecord = (phase: Phase, p: PhaseParam, expected: number | null, actual: number) =>
    addReading({ phase, parameter: p.key, expected, actual, unit: p.unit })
  const onAdvance = async () => {
    try {
      setSession(await sessions.advancePhase(sessionId))
      setError(null)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const gravityLog = session.readings.filter((r) => r.parameter === FERMENTATION_GRAVITY)
  const fermentationStart =
    session.readings.find((r) => r.phase === 'cooling' && r.parameter === PHASE_COMPLETED)?.recorded_at ?? null

  const extras = (phase: Phase) => {
    if (phase === 'fermentation')
      return (
        <FermentationLog
          readings={gravityLog}
          og={og ?? recipe?.og ?? null}
          startedAt={fermentationStart}
          readOnly={readOnly}
          onAdd={(sg, temp) =>
            addReading({
              phase: 'fermentation',
              parameter: FERMENTATION_GRAVITY,
              actual: sg,
              unit: 'SG',
              notes: temp !== null ? `${temp} °C` : null,
            })
          }
          onUseAsFg={async (sg) => {
            await addReading({ phase: 'fermentation', parameter: 'fg', expected: recipe?.fg ?? null, actual: sg, unit: 'SG' })
            setRev((r) => r + 1)
          }}
        />
      )
    if (phase === 'carbonation')
      return (
        <CarbonationCalc
          volumeL={actualOf(latest, 'cooling', 'fermenter_volume_l') ?? recipe?.batch_size_l ?? null}
          targetVols={actualOf(latest, 'carbonation', 'co2_volumes')}
        />
      )
    return null
  }

  const summary = (
    <section className="card">
      <h2>Resumo: planejado vs. atingido</h2>
      <SessionSummary recipe={recipe} latest={latest} styleResults={styleResults} />
    </section>
  )

  return (
    <div className="stack brew-day">
      <header className="brew-head">
        <div>
          <h2>{session.name}</h2>
          <p className="muted">
            {dateFmt.format(new Date(session.created_at))} ·{' '}
            {completed ? 'Concluída' : `Fase atual: ${PHASE_LABELS[session.current_phase]}`}
          </p>
        </div>
        <Link to="/nova" className="btn btn-secondary">
          + Nova
        </Link>
      </header>

      {completed && (
        <>
          {summary}
          <button type="button" className="link" onClick={() => setEditDone((v) => !v)}>
            {editDone ? 'Parar de editar' : 'Corrigir valores registrados'}
          </button>
        </>
      )}

      <section className="card">
        <details open={!completed}>
          <summary className="section-summary">
            <h2>Receita e estilo</h2>
            <span className="muted">{recipe ? recipe.name : 'sem receita'}</span>
          </summary>
          {draft ? (
            <>
              <RecipeForm draft={draft} onChange={setDraft} />
              <p className={`save-state ${autosave.status === 'error' ? 'alert alert-warn' : 'muted'}`} aria-live="polite">
                {autosave.status === 'saving' && 'Salvando receita…'}
                {autosave.status === 'saved' && 'Receita salva ✓'}
                {autosave.status === 'error' && autosave.messages.join(' ')}
              </p>
            </>
          ) : (
            <p className="muted">A receita desta brassagem foi removida; valores esperados indisponíveis.</p>
          )}
        </details>
      </section>

      {PHASES.map((phase, i) => (
        <PhaseSection
          key={`${phase}-${statusOf(i)}-${phase === 'fermentation' ? rev : 0}-${readOnly}`}
          phase={phase}
          index={i}
          status={statusOf(i)}
          recipe={recipe}
          latest={latest}
          styleResults={styleResults}
          readOnly={readOnly}
          onRecord={onRecord}
          onAdvance={onAdvance}
        >
          {extras(phase)}
        </PhaseSection>
      ))}

      {!completed && summary}
    </div>
  )
}
