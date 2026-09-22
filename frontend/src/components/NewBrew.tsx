import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage, recipes, sessions } from '../api/client'
import type { Recipe } from '../types'
import { type RecipeDraft, draftFromRecipe, draftToRecipe, emptyDraft } from '../utils/recipe'
import RecipeForm from './RecipeForm'

const STORAGE_KEY = 'brew-copilot:new-brew'

interface Stored {
  recipeId: number | null
  draft: RecipeDraft
}

// Rascunho local: sobrevive a ir numa ferramenta e voltar antes de iniciar a brassagem.
function loadStored(): Stored | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as Stored
    // Mescla com os padrões: um rascunho salvo por uma versão anterior do app pode não
    // ter todos os campos do formulário atual, o que quebraria o restante do formulário.
    return { ...stored, draft: { ...emptyDraft(), ...stored.draft } }
  } catch {
    return null
  }
}

function store(value: Stored | null) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* armazenamento indisponível: segue sem rascunho */
  }
}

/** Início da brassagem: escolhe ou preenche a receita e cria a sessão. */
export default function NewBrew() {
  const navigate = useNavigate()
  const [saved, setSaved] = useState<Recipe[]>([])
  const [recipeId, setRecipeId] = useState<number | null>(() => loadStored()?.recipeId ?? null)
  const [draft, setDraft] = useState<RecipeDraft>(() => loadStored()?.draft ?? emptyDraft())
  const [messages, setMessages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    recipes.list().then(setSaved).catch((e) => setMessages([errorMessage(e)]))
  }, [])

  useEffect(() => store({ recipeId, draft }), [recipeId, draft])

  const pick = (value: string) => {
    const r = saved.find((x) => x.id === Number(value))
    setRecipeId(r ? r.id : null)
    setDraft(r ? draftFromRecipe(r) : emptyDraft())
    setMessages([])
    setNotice(null)
  }

  /** Cria ou atualiza a receita; devolve null se houver pendências. */
  const saveRecipe = async (requireGrains: boolean): Promise<Recipe | null> => {
    const { data, errors } = draftToRecipe(draft)
    if (requireGrains && !data.grains?.length) errors.push('Adicione ao menos um malte antes de iniciar.')
    setMessages(errors)
    if (errors.length) return null
    const r = recipeId ? await recipes.update(recipeId, data) : await recipes.create(data)
    setRecipeId(r.id)
    setSaved((list) => [...list.filter((x) => x.id !== r.id), r].sort((a, b) => a.name.localeCompare(b.name)))
    return r
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setMessages([errorMessage(e)])
    } finally {
      setBusy(false)
    }
  }

  const start = () =>
    run(async () => {
      const r = await saveRecipe(true)
      if (!r) return
      const session = await sessions.create({ recipe_id: r.id })
      store(null)
      navigate(`/brassagem/${session.id}`)
    })

  const saveOnly = () =>
    run(async () => {
      const r = await saveRecipe(false)
      if (r) setNotice(`Receita "${r.name}" salva.`)
    })

  return (
    <div className="stack">
      <section className="card">
        <h2>Nova brassagem</h2>
        <label className="field">
          <span className="field-label">Receita</span>
          <select value={recipeId ?? ''} onChange={(e) => pick(e.target.value)}>
            <option value="">Nova receita</option>
            {saved.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.style_number ? ` (${r.style_number})` : ''}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card">
        <RecipeForm draft={draft} onChange={setDraft} />
      </section>

      <section className="card sticky-actions">
        {messages.length > 0 && (
          <ul className="alert alert-warn messages" role="alert">
            {messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        {notice && <p className="alert alert-ok">{notice}</p>}
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={saveOnly} disabled={busy}>
            Salvar receita
          </button>
          <button type="button" className="btn" onClick={start} disabled={busy}>
            Iniciar brassagem
          </button>
        </div>
      </section>
    </div>
  )
}
