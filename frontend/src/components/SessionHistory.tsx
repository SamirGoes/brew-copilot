import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage, sessions } from '../api/client'
import type { BrewSession } from '../types'
import { fmt, fmtSg } from '../utils/format'
import { PHASE_LABELS, actualOf, latestReadings } from '../utils/phases'
import { abvFrom } from '../utils/recipe'

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' })

/** Lista de brassagens com o resumo do que foi atingido. */
export default function SessionHistory() {
  const [list, setList] = useState<BrewSession[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    sessions.list().then(setList).catch((e) => setError(errorMessage(e)))
  }, [])

  const remove = async (s: BrewSession) => {
    if (!window.confirm(`Excluir a brassagem "${s.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await sessions.remove(s.id)
      setList((l) => l?.filter((x) => x.id !== s.id) ?? null)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <div className="stack">
      <header className="brew-head">
        <h2>Histórico</h2>
        <Link to="/nova" className="btn btn-secondary">
          + Nova
        </Link>
      </header>
      {error && <p className="alert alert-bad">{error}</p>}
      {list === null && !error && <p className="muted">Carregando…</p>}
      {list?.length === 0 && <p className="card muted">Nenhuma brassagem ainda.</p>}
      {list?.map((s) => {
        const latest = latestReadings(s.readings)
        const og = actualOf(latest, 'boil', 'og')
        const fg = actualOf(latest, 'fermentation', 'fg')
        return (
          <article key={s.id} className="card history-item">
            <Link to={`/brassagem/${s.id}`} className="history-link">
              <strong>{s.name}</strong>
              <span className="muted">
                {dateFmt.format(new Date(s.created_at))} ·{' '}
                {s.completed_at ? 'Concluída' : `Em andamento: ${PHASE_LABELS[s.current_phase]}`}
              </span>
              {(og || fg) && (
                <span className="history-values">
                  OG {fmtSg(og)} · FG {fmtSg(fg)}
                  {og && fg ? ` · ABV ${fmt(abvFrom(og, fg))}%` : ''}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="btn-icon"
              aria-label={`Exportar ${s.name}`}
              title="Baixar em JSON"
              onClick={() => sessions.download(s.id).catch((e) => setError(errorMessage(e)))}
            >
              ⬇
            </button>
            <button type="button" className="btn-icon" aria-label={`Excluir ${s.name}`} onClick={() => remove(s)}>
              🗑
            </button>
          </article>
        )
      })}
    </div>
  )
}
