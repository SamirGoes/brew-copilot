# Design

## Context

Projeto greenfield para aplicação de cálculos de brassagem. Ver proposal.md para motivação. A aplicação precisa rodar localmente e também via Docker para deploy em servidor pessoal. Os cálculos são baseados em fórmulas conhecidas de cervejaria (Tinseth para IBU, conversões SG/Plato, etc.).

## Goals / Non-Goals

**Goals:**
- Arquitetura moderna: React SPA + Python FastAPI backend
- Persistência local com SQLite (funciona em Docker sem dependências externas)
- Interface responsiva para uso durante a brassagem (mobile-friendly)
- Containerização completa com docker-compose
- Type safety em ambas as camadas (TypeScript + Pydantic)

**Non-Goals:**
- Multi-usuário ou autenticação (uso pessoal)
- Sincronização com serviços externos (BeerXML, Brewfather, etc.)
- Aplicativo mobile nativo

## Decisions

### 1. Stack tecnológica

**Decisão:**
- Backend: Python 3.12 + FastAPI
- Frontend: React 18 + Vite + TypeScript

**Alternativas consideradas:**
- Node.js/Express: descartado em favor de FastAPI por preferência do usuário e typing superior com Pydantic
- Angular: descartado por ser mais pesado que React para esta aplicação
- JS vanilla: descartado por falta de componentização e tooling moderno

**Rationale:** FastAPI oferece async, validação automática com Pydantic, e docs OpenAPI gerados. React + Vite oferece DX excelente com HMR instantâneo e build otimizado.

### 2. Persistência de dados

**Decisão:** SQLite com SQLAlchemy

**Alternativas consideradas:**
- PostgreSQL: requer container adicional, overkill para uso pessoal
- JSON files: funciona mas SQLite oferece queries e integridade

**Rationale:** SQLite é um arquivo único, zero configuração, funciona perfeitamente em Docker, fácil de fazer backup. SQLAlchemy oferece ORM maduro com migrations via Alembic.

### 3. Estrutura de módulos de cálculo

**Decisão:** Cada capability como módulo Python isolado em `backend/calculators/` com funções puras

**Rationale:** Testabilidade - funções puras de cálculo podem ser testadas unitariamente sem mocks. FastAPI routes chamam esses módulos.

### 4. API Design

**Decisão:** REST com FastAPI, schemas Pydantic, OpenAPI docs automático

```
POST /api/calculate/mash     - cálculos de mostura
POST /api/calculate/gravity  - cálculos de gravidade
POST /api/calculate/hops     - cálculos de IBU
POST /api/calculate/water    - cálculos de sais

GET /api/styles              - lista estilos BJCP
GET /api/styles/{id}         - detalhes do estilo
POST /api/validate/style     - valida parâmetros contra estilo

GET/POST /api/recipes        - CRUD de receitas
GET/POST /api/sessions       - CRUD de sessões
POST /api/sessions/{id}/phase   - avançar fase
POST /api/sessions/{id}/reading - registrar leitura
```

**Rationale:** FastAPI gera docs Swagger/ReDoc automaticamente em `/docs`. Pydantic valida inputs e serializa outputs.

### 5. Estrutura de diretórios

```
brew-copilot/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Settings
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── recipe.py
│   │   │   └── session.py
│   │   ├── schemas/             # Pydantic schemas
│   │   │   ├── recipe.py
│   │   │   └── session.py
│   │   ├── calculators/         # Funções de cálculo puras
│   │   │   ├── mash.py
│   │   │   ├── gravity.py
│   │   │   ├── hops.py
│   │   │   ├── water.py
│   │   │   ├── carbonation.py
│   │   │   └── style_validator.py
│   │   ├── routers/             # FastAPI routers
│   │   │   ├── calculate.py
│   │   │   ├── recipes.py
│   │   │   ├── sessions.py
│   │   │   └── styles.py
│   │   └── data/
│   │       └── styles.json      # BJCP styles database
│   └── tests/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                 # API client
│       │   └── client.ts
│       ├── components/          # React components
│       │   ├── MashCalculator.tsx
│       │   ├── GravityTracker.tsx
│       │   ├── HopCalculator.tsx
│       │   ├── WaterChemistry.tsx
│       │   ├── StyleSelector.tsx
│       │   ├── ConformityBadge.tsx
│       │   └── SessionManager.tsx
│       ├── hooks/               # Custom hooks
│       ├── types/               # TypeScript types
│       └── styles/              # CSS
└── data/                        # Volume para SQLite
    └── brew-copilot.db
```

### 6. Docker setup

**Decisão:** Multi-container com docker-compose (backend + frontend como serviços separados)

**Backend Dockerfile:**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install .
COPY app ./app
VOLUME /app/data
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile (production):**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**docker-compose.yml:**
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - brew-data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  brew-data:
```

**Rationale:** Separação permite escalar/atualizar backend e frontend independentemente. Nginx serve o build estático do React.

### 7. BJCP Style Data

**Decisão:** Bundled JSON file (backend/app/data/styles.json) carregado em memória no startup

**Fonte:** https://github.com/ascholer/bjcp-styleview/blob/main/styles.json

**Alternativas consideradas:**
- SQLite table: overhead desnecessário para dados read-only
- Fetch externo: adiciona dependência de rede

**Rationale:** ~100 estilos, ~200KB JSON. Cabe em memória, acesso instantâneo, zero latência. Atualização manual quando BJCP publicar nova versão.

### 8. Style Validation UI

**Decisão:** Indicadores visuais com 3 níveis de conformidade

```
Verde (✓): dentro do range do estilo
Laranja (⚠): até 15% fora do range
Vermelho (✗): mais de 15% fora do range
```

**Cálculo de desvio:**
- Se valor < min: `(min - valor) / min * 100`
- Se valor > max: `(valor - max) / max * 100`

**Rationale:** Feedback visual imediato permite ajustar receita antes de brassar. Threshold de 15% distingue "levemente fora" de "significativamente fora".

## Risks / Trade-offs

**[SQLite concurrent writes]** → Mitigação: uso pessoal single-user, não é problema. Se necessário futuramente, WAL mode resolve.

**[Perda de dados se volume não configurado]** → Mitigação: documentar claramente no README a configuração do volume. Docker-compose já inclui volume nomeado.

**[Fórmulas de cálculo podem ter variações]** → Mitigação: usar fórmulas padrão (Tinseth) como default. Futuramente permitir escolha via settings.

**[Mobile UX durante brassagem]** → Mitigação: design mobile-first com botões grandes e inputs fáceis de usar com mãos molhadas.

**[CORS em dev]** → Mitigação: FastAPI middleware configurado para permitir localhost:5173 (Vite dev server).
