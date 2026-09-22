import { Link } from 'react-router-dom'
import { TOOLS } from '../utils/tools'

/** Índice das calculadoras avulsas. */
export default function Tools() {
  return (
    <div className="stack">
      <h2>Ferramentas</h2>
      <div className="tool-grid">
        {TOOLS.map((t) => (
          <Link key={t.path} to={`/ferramentas/${t.path}`} className="card tool-card">
            <span className="tool-icon" aria-hidden="true">
              {t.icon}
            </span>
            <strong>{t.label}</strong>
            <span className="muted">{t.description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
