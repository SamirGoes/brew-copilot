import { type ReactNode, useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage, sessions } from './api/client'
import BrewDay from './components/BrewDay'
import GravityTracker from './components/GravityTracker'
import HopCalculator from './components/HopCalculator'
import MashCalculator from './components/MashCalculator'
import NewBrew from './components/NewBrew'
import SessionHistory from './components/SessionHistory'
import StyleView from './components/StyleView'
import Tools from './components/Tools'
import WaterChemistry from './components/WaterChemistry'
import { type ToolPath, TOOLS } from './utils/tools'

const TOOL_ELEMENTS: Record<ToolPath, ReactNode> = {
  mostura: <MashCalculator />,
  gravidade: <GravityTracker />,
  lupulo: <HopCalculator />,
  agua: <WaterChemistry />,
  estilos: <StyleView />,
}

/** `/` retoma a brassagem em andamento ou começa uma nova. */
function Home() {
  const [target, setTarget] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    sessions
      .list()
      .then((list) => {
        const active = list.find((s) => s.completed_at === null)
        setTarget(active ? `/brassagem/${active.id}` : '/nova')
      })
      .catch((e) => setError(errorMessage(e)))
  }, [])
  if (error) return <p className="alert alert-bad">{error}</p>
  return target ? <Navigate to={target} replace /> : <p className="muted">Carregando…</p>
}

function ToolPage({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <>
      <button type="button" className="link back-link" onClick={() => navigate(-1)}>
        ← Voltar
      </button>
      {children}
    </>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const inBrew = pathname === '/' || pathname === '/nova' || pathname.startsWith('/brassagem')

  return (
    <div className="app">
      <header className="app-header">
        <h1>🍺 Brew Copilot</h1>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nova" element={<NewBrew />} />
          <Route path="/brassagem/:id" element={<BrewDay />} />
          <Route path="/historico" element={<SessionHistory />} />
          <Route path="/ferramentas" element={<Tools />} />
          {TOOLS.map((t) => (
            <Route key={t.path} path={`/ferramentas/${t.path}`} element={<ToolPage>{TOOL_ELEMENTS[t.path]}</ToolPage>} />
          ))}
          {/* Endereços antigos das calculadoras */}
          {TOOLS.map((t) => (
            <Route key={`old-${t.path}`} path={`/${t.path}`} element={<Navigate to={`/ferramentas/${t.path}`} replace />} />
          ))}
          <Route path="*" element={<p className="card">Página não encontrada.</p>} />
        </Routes>
      </main>

      <nav className="app-nav" aria-label="Navegação principal">
        <NavLink to="/" className={inBrew ? 'active' : ''} end>
          <span className="nav-icon" aria-hidden="true">🍺</span>
          <span>Brassagem</span>
        </NavLink>
        <NavLink to="/ferramentas" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon" aria-hidden="true">🧰</span>
          <span>Ferramentas</span>
        </NavLink>
        <NavLink to="/historico" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon" aria-hidden="true">📋</span>
          <span>Histórico</span>
        </NavLink>
      </nav>
    </div>
  )
}
