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
│       │   ├── BrewDay.tsx          # página principal da brassagem
│       │   ├── PhaseSection.tsx     # seção de cada fase
│       │   ├── RecipeForm.tsx
│       │   └── SessionHistory.tsx
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

### 9. Máscaras de entrada (gravidade, ABV, peso)

**Decisão:** Componente reutilizável `GravityInput` para todo campo de gravidade específica (SG): aceita apenas dígitos (máx. 4) e insere o ponto após o primeiro dígito (`1052` → `1.052`, `0998` → `0.998`), com `inputMode="numeric"`. Valor parcial (menos de 4 dígitos) é tratado como incompleto e não dispara cálculo.

**Alternativas consideradas:**
- Digitar só os pontos (`52` → `1.052`): mais curto, mas não permite FG abaixo de 1.000
- Input decimal livre: exige o ponto, difícil no teclado numérico do celular com mãos molhadas

**Rationale:** Entrada rápida no celular durante a brassagem; formato fixo de 4 dígitos cobre toda a faixa de SG usada em cerveja. Campos em Plato mantêm entrada decimal livre.

**Extensão:** `MaskedDecimalInput` genérico com número de casas configurável, para ABV (1 casa: `63` → 6.3) e peso do malte em kg (3 casas, dígitos em gramas: `5500` → 5.500). Peso de lúpulo em gramas mantém entrada livre. Valores preenchidos programaticamente (padrões do estilo, botões "usar", receita carregada) são formatados com o número de casas da máscara antes de entrar no campo.

### 10. Brew day como página principal + ferramentas

**Decisão:** A rota `/` é a página da brassagem (BrewDay); as calculadoras (Mostura, Gravidade, Lúpulo, Água, Estilos) continuam como páginas independentes num menu "Ferramentas".

A página é uma coluna única de seções:
1. **Estilo + Receita**: seleção do estilo BJCP e formulário da receita (salva e reutilizável), com comparação receita vs. estilo (indicadores + resumo "X/5").
2. **Uma seção por fase**, na ordem da sessão. A fase ativa fica expandida; fases concluídas continuam visíveis com os valores registrados (esperado, medido, desvio, indicador de estilo quando aplicável).

| Fase | Parâmetros |
|------|------------|
| Mostura | água de mostura, temperatura, gravidade |
| Lavagem | água de lavagem, volume pré-fervura, gravidade pré-fervura |
| Fervura | tempo de fervura, volume pós-fervura, OG |
| Resfriamento | volume no fermentador, temperatura de inoculação |
| Fermentação | leituras de gravidade/temperatura, FG |
| Maturação | tempo, temperatura |
| Carbonatação | volumes de CO₂ |

Cada valor é gravado como `SessionReading` (`expected` vem da receita, `actual` é o medido); uma leitura mais nova do mesmo parâmetro na mesma fase substitui a anterior na tela. Fases linkam a ferramenta relevante (ex.: Mostura → calculadora de mostura). Todo o estado vem da API, então abrir uma ferramenta e voltar não perde dados.

**Alternativas consideradas:**
- Uma página por fase (wizard): esconde os valores já registrados, dificultando a comparação durante a brassagem
- Receita copiada dentro da sessão: mais simples, mas obriga a redigitar para repetir a receita

**Rationale:** Tudo que importa no dia da brassagem fica numa tela só, com o planejado vs. atingido sempre visível; as calculadoras continuam úteis como apoio pontual.

### 11. Ajuste de água para caber na panela

**Decisão:** Cálculo no backend (`calculators/mash.py`), exposto em `POST /api/calculate/mash`, que passa a receber `sparge_water_l` e a devolver `suggestion`:
- Volume da mostura = água de mostura + malte × 0,67 L/kg. Se exceder a capacidade útil da panela (informada em litros), a água máxima de mostura é `capacidade − malte × 0,67`; o excedente vai para a lavagem, mantendo a água total.
- Se a água resultante ficar abaixo de 2,5 L/kg, não há ajuste possível: sugere reduzir malte ou dividir a brassagem.
- Sem lavagem (BIAB): sugere ativar a lavagem com o excedente.
- Volume pré-fervura acima da capacidade: aviso com os litros excedentes e sugestão de reduzir o pré-fervura e completar com água após a fervura.

A UI mostra a sugestão no bloco "Água e volumes" dos parâmetros da receita (junto dos campos de mostura, lavagem e pré-fervura) e na ferramenta de mostura, com botão "Aplicar ajuste".

**Rationale:** Regras de cálculo ficam nas funções puras testáveis (decisão 3); a UI só apresenta e aplica.

### 12. Unidade de cor (SRM/EBC)

**Decisão:** Cor sempre armazenada em SRM (receita e faixas BJCP). O frontend converte para exibição e entrada (EBC = SRM × 1,97) conforme a preferência do usuário, salva em `localStorage` (com fallback para SRM). O seletor SRM/EBC fica embutido no campo de cor (`ColorInput`) e junto das faixas de cor, não no cabeçalho; trocar em qualquer lugar atualiza o app todo.

**Rationale:** Backend e validação de estilo continuam numa unidade só; a conversão é trivial e puramente de apresentação.

**Correção de alinhamento:** a primeira implementação colocava o seletor ao lado do *rótulo* do campo (`field-label-row`), o que aumentava a altura da linha quando o campo de cor dividia uma grade com outro campo sem seletor (ex.: IBU), desalinhando os dois. O seletor passa a ocupar o lugar onde hoje o campo mostra a unidade fixa ("SG", "kg", "SRM"...) — esse texto vira clicável. Como esse espaço já é usado por toda unidade do app sem nunca desalinhar nada, o campo de cor passa a se comportar como qualquer outro campo.

### 13. Novos campos da receita sem perder dados

**Decisão:** A receita ganha `preboil_volume_l` e `water_profile` (ambos opcionais). Como não há Alembic, o startup do backend adiciona colunas ausentes às tabelas existentes (SQLite, `ALTER TABLE ... ADD COLUMN`, só para colunas nullable/com default), comparando o modelo com o schema do banco. Vale para o banco de dev e para o volume do Docker.

O esperado de "Volume pré-fervura" na fase Lavagem passa a ser o `preboil_volume_l` da receita; vazio, usa o cálculo lote + volume morto + evaporação × tempo.

**Alternativas consideradas:**
- Apagar e recriar o banco: perde receitas e brassagens reais já registradas
- Alembic: mais robusto, mas pesado para adicionar colunas opcionais num app pessoal

**Rationale:** Evolução aditiva simples e segura; se aparecer mudança destrutiva de schema no futuro, adotar Alembic.

### 14. OG da mostura e pré-fervura tratadas como a mesma densidade

**Decisão:** A receita deixa de ter um alvo de "OG pré-fervura" separado do "OG da mostura" — na prática eles não mudam entre o fim da mostura e o início da fervura, então pedir os dois é redundante (confirmado em receitas reais já salvas: a Milk Stout tinha os dois iguais). O alvo da receita passa a ser só OG da mostura + OG (pós-fervura, o valor usado em todo o resto do app: comparação com estilo, ABV, eficiência).

Durante a brassagem em si, a fase Lavagem continua registrando a gravidade pré-fervura *medida de verdade* (isso pode divergir do planejado), mas o valor "esperado" mostrado ao lado passa a ser o `og_mash` da receita.

**Dados existentes:** a coluna `og_preboil` continua no banco (nunca removemos coluna existente, decisão 13); só deixa de ser exibida e preenchida pelo formulário da receita. Receitas com valor antigo aí guardado não são afetadas nem perdem dado, o campo só fica sem uso a partir de agora.

**Rationale:** Um campo a menos para preencher, sem perda de informação útil — o usuário já não estava preenchendo esse campo na prática.

### 15. Recalcular água a partir do equipamento (em vez de só ajustar reativamente)

**Contexto:** A decisão 11 (ajuste reativo) só redistribui a água entre mostura e lavagem *mantendo o total que o usuário digitou*. Isso resolve o aviso de "não cabe na panela" mas pode preservar um total já errado: testado com a Milk Stout real (4,8 kg malte, 18 L mostura + 13,72 L lavagem, panela 20 L), o ajuste reativo produziria um volume pré-fervura de quase 27 L — mais estourado que antes.

**Decisão:** Nova ação "Recalcular água", que deriva os volumes do zero a partir do equipamento, em vez de só corrigir o que já foi digitado:
- Água de mostura = proporção (padrão 3 L/kg, ajustável 2,5–4 L/kg) × peso do malte, com a proporção reduzida automaticamente até 2,5 L/kg se necessário para caber na panela.
- Volume pré-fervura = lote + volume morto + evaporação × tempo de fervura (já calculado hoje como sugestão).
- Água de lavagem = volume pré-fervura − primeiro mosto (água de mostura aplicada − absorção do malte).
- Sem lavagem (BIAB): água de mostura = volume pré-fervura + absorção do malte (método de volume total), sem lavagem.
- Se mesmo a 2,5 L/kg não couber, cai no aviso já existente (reduzir malte ou dividir a brassagem).

A proporção é um controle de trabalho do formulário, não é salva no banco; só os volumes resultantes são gravados, como já acontece hoje.

"Recalcular água" passa a ser a ação principal em "Água e volumes"; o "Aplicar ajuste" reativo (decisão 11) continua existindo como apoio para quando o usuário edita os volumes manualmente depois de recalcular.

**Fontes:** cálculo inspirado em referências de cervejaria caseira brasileira sobre volume de água (cálculo do volume final para trás, contabilizando evaporação e absorção) e proporção água/malte (faixa 2,5–4 L/kg conforme mostura mais grossa ou mais fina).

**Rationale:** Corrige o problema de verdade (a receita pede água demais para o equipamento) em vez de só maquiar o sintoma.

## Risks / Trade-offs

**[SQLite concurrent writes]** → Mitigação: uso pessoal single-user, não é problema. Se necessário futuramente, WAL mode resolve.

**[Perda de dados se volume não configurado]** → Mitigação: documentar claramente no README a configuração do volume. Docker-compose já inclui volume nomeado.

**[Fórmulas de cálculo podem ter variações]** → Mitigação: usar fórmulas padrão (Tinseth) como default. Futuramente permitir escolha via settings.

**[Mobile UX durante brassagem]** → Mitigação: design mobile-first com botões grandes e inputs fáceis de usar com mãos molhadas.

**[CORS em dev]** → Mitigação: FastAPI middleware configurado para permitir localhost:5173 (Vite dev server).
