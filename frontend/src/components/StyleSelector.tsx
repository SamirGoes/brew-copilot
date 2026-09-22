import { useEffect, useId, useMemo, useState } from 'react'
import { errorMessage, styles } from '../api/client'
import type { StyleDetail, StyleParam, StyleSummary } from '../types'
import { useColorUnit } from '../hooks/useColorUnit'
import { formatRange, paramLabel } from '../utils/format'
import ColorUnitSwitch from './ColorUnitSwitch'

const DETAIL_LABELS: Record<string, string> = {
  overallimpression: 'Impressão geral',
  aroma: 'Aroma',
  appearance: 'Aparência',
  flavor: 'Sabor',
  mouthfeel: 'Sensação na boca',
  comments: 'Comentários',
  history: 'História',
  characteristicingredients: 'Ingredientes característicos',
  stylecomparison: 'Comparação de estilos',
  commercialexamples: 'Exemplos comerciais',
  tags: 'Tags',
}

function StyleRanges({ style }: { style: StyleSummary }) {
  const [unit] = useColorUnit()
  const entries = Object.entries(style.ranges) as [StyleParam, { min: number; max: number }][]
  if (!entries.length) return <p className="muted">Estilo sem faixas definidas no BJCP.</p>
  return (
    <dl className="ranges">
      {entries.map(([p, r]) => (
        <div key={p}>
          <dt>
            {paramLabel(p, unit)}
            {p === 'srm' && <ColorUnitSwitch />}
          </dt>
          <dd>{formatRange(p, r.min, r.max, unit)}</dd>
        </div>
      ))}
    </dl>
  )
}

function StyleModal({ style, onClose }: { style: StyleDetail; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="style-modal-title">
            {style.name} ({style.id})
          </h2>
          <button type="button" className="btn-icon" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </header>
        <p className="muted">{style.category}</p>
        <StyleRanges style={style} />
        {Object.entries(style.details).map(([field, text]) => (
          <section key={field} className="style-detail">
            <h3>{DETAIL_LABELS[field] ?? field}</h3>
            <p>{text}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

interface StyleSelectorProps {
  value: string | null
  onChange: (style: StyleDetail | null) => void
}

/** Busca de estilos BJCP por nome, categoria ou número, com modal de detalhes. */
export default function StyleSelector({ value, onChange }: StyleSelectorProps) {
  const [all, setAll] = useState<StyleSummary[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<StyleDetail | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listId = useId()

  useEffect(() => {
    styles.list().then(setAll).catch((e) => setError(errorMessage(e)))
  }, [])

  // Carrega os detalhes quando o valor vem de fora (ex.: receita carregada).
  useEffect(() => {
    if (!value || selected?.id === value) return
    styles.get(value).then(setSelected).catch((e) => setError(errorMessage(e)))
  }, [value, selected?.id])
  // O valor controlado manda: sem `value`, nada selecionado.
  const current = value && selected?.id === value ? selected : null

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.id.toLowerCase() === q,
    )
  }, [all, query])

  const pick = async (s: StyleSummary) => {
    setOpen(false)
    setQuery('')
    try {
      const detail = await styles.get(s.id)
      setSelected(detail)
      onChange(detail)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <div className="style-selector">
      <label className="field">
        <span className="field-label">Estilo BJCP</span>
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          placeholder={current ? `${current.id} · ${current.name}` : 'Buscar estilo (ex.: IPA)'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </label>
      {open && (
        <ul className="dropdown" id={listId} role="listbox">
          {matches.length === 0 && <li className="muted">Nenhum estilo encontrado.</li>}
          {matches.map((s) => (
            <li
              key={s.id}
              role="option"
              aria-selected={s.id === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
            >
              <span className="style-id">{s.id}</span> {s.name}
              <span className="muted"> · {s.category}</span>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="alert alert-bad">{error}</p>}

      {current && (
        <div className="style-selected">
          <div className="style-selected-head">
            <button type="button" className="link" onClick={() => setShowDetails(true)}>
              {current.name} ({current.id}) ⓘ
            </button>
            <button
              type="button"
              className="btn-icon"
              aria-label="Remover estilo"
              onClick={() => {
                setSelected(null)
                onChange(null)
              }}
            >
              ×
            </button>
          </div>
          <StyleRanges style={current} />
        </div>
      )}
      {showDetails && current && <StyleModal style={current} onClose={() => setShowDetails(false)} />}
    </div>
  )
}
