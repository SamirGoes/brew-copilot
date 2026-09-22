# Brew Copilot

Copiloto de brassagem para cervejeiros artesanais: acompanhe e recalcule parâmetros em tempo real durante a produção, sem depender de contas manuais.

## Motivação

Desvios nos valores esperados (OG, volume, etc.) durante a brassagem exigem cálculos manuais de correção, propensos a erro, num processo que já exige atenção total. O Brew Copilot registra o esperado vs. o atingido em cada fase e calcula as correções.

## Como funciona

A tela principal é a **brassagem**: você escolhe o estilo BJCP, preenche a receita e vai registrando os valores medidos em cada fase — tudo na mesma página, com o planejado sempre ao lado do atingido.

- **Receita e estilo**: alvos (OG, FG, IBU, cor, ABV) comparados com a faixa do estilo, com indicador verde / laranja / vermelho e resumo "X/5 dentro do estilo".
- **Fases**: mostura, lavagem, fervura, resfriamento, fermentação, maturação e carbonatação. Cada uma mostra o esperado da receita, o campo para o medido e o desvio. As fases concluídas continuam visíveis.
- **Água e volumes**: o botão **Recalcular água** deriva a água de mostura, de lavagem e o volume pré-fervura a partir do malte, da proporção água/malte e do seu equipamento — avisando quando a mostura não cabe na panela e como ajustar.
- **Ferramentas**: as calculadoras avulsas (mostura, gravidade, lúpulo, água, estilos) continuam disponíveis no menu Ferramentas.
- **Histórico**: brassagens anteriores com o resumo do que foi atingido, e exportação em JSON.

Pensado para uso no celular durante a brassagem: campos grandes, teclado numérico e máscara nos campos de densidade (digite `1052`, vira `1.052`).

## Como rodar

### Docker (compilando localmente)

```bash
docker compose up -d --build
```

- App: <http://localhost:3000>
- API e docs: <http://localhost:8000/docs>

Para parar: `docker compose down`. Os dados ficam no volume `brew-data` e sobrevivem a parar, recriar ou atualizar os containers.

> **Não use `docker compose down -v`** a menos que queira apagar o histórico: a flag `-v` remove o volume junto.

### Deploy num servidor (imagens prontas)

As imagens estão publicadas no Docker Hub, então o servidor não precisa compilar nada — basta o arquivo `docker-compose.prod.yml`:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

O app fica na porta 3000. Só o frontend é exposto: o nginx alcança a API pela rede interna e a publica em `/api`. Para expor também o `/docs`, descomente o bloco `ports` do backend no arquivo.

Imagens (`linux/amd64`): [`samirgoes/brew-copilot-backend`](https://hub.docker.com/r/samirgoes/brew-copilot-backend) e [`samirgoes/brew-copilot-frontend`](https://hub.docker.com/r/samirgoes/brew-copilot-frontend), nas tags `v1` e `latest`.

Para fixar outra versão sem editar o arquivo, ou trocar a porta:

```bash
BREW_VERSION=v2 BREW_PORT=8080 docker compose -f docker-compose.prod.yml up -d
```

> **Sem autenticação:** o app é de uso pessoal e não tem login (ver Não-objetivos). Quem alcançar a porta lê e escreve tudo — exponha só na sua rede local ou atrás de VPN, proxy com senha ou firewall.

### Desenvolvimento local

Backend (Python 3.12+), na pasta `backend/`:

```bash
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/uvicorn app.main:app --reload
```

Frontend (Node 20+), na pasta `frontend/`:

```bash
npm install
npm run dev
```

O app fica em <http://localhost:5173> e o Vite faz proxy de `/api` para o backend em `localhost:8000`. Para usar pelo celular na mesma rede, rode `npm run dev -- --host` e acesse pelo IP da máquina.

### Testes

```bash
cd backend && .venv/bin/pytest          # testes do backend
cd frontend && npm run build && npm run lint
```

## Arquitetura

- **Backend:** Python 3.12, FastAPI, SQLAlchemy, Pydantic
- **Frontend:** React, Vite, TypeScript (mobile-first)
- **Persistência:** SQLite (arquivo único, sem dependências externas)

Os cálculos ficam em funções puras em `backend/app/calculators/` (mostura, gravidade, lúpulo, água, carbonatação, validação de estilo), testáveis sem mocks; as rotas FastAPI apenas as chamam. O frontend não duplica fórmula: pede o cálculo à API.

Colunas novas nos modelos são adicionadas ao banco existente no startup (`ALTER TABLE ... ADD COLUMN`, só para colunas opcionais), então atualizar a aplicação não apaga dados.

```
backend/app/
├── calculators/   # funções puras de cálculo
├── models/        # tabelas SQLAlchemy
├── schemas/       # validação Pydantic
├── routers/       # endpoints REST
└── data/          # styles.json (BJCP)
frontend/src/
├── components/    # BrewDay, RecipeForm, PhaseSection, calculadoras...
├── hooks/         # cálculo com debounce, unidade de cor, validação de estilo
├── utils/         # fases, receita, formatação, conversões
└── styles/
openspec/changes/  # specs, design e tarefas (OpenSpec)
```

## Capacidades

| Capacidade | Descrição |
|---|---|
| `mash-calculator` | Água, malte, proporções, capacidade da panela, lavagem e recálculo de água pelo equipamento |
| `gravity-tracker` | Registro e correção de gravidades; ajuste de OG adicionando/removendo água; eficiência; SG ↔ Plato |
| `hop-calculator` | IBU (Tinseth e Rager) e recálculo de lúpulo para um IBU alvo com tempo de fervura ajustado |
| `water-chemistry` | Sais (CaSO₄, MgSO₄, CaCl) e ácido ascórbico por perfil de água e volume |
| `brew-session` | Fases da brassagem até carbonatação, histórico de proposto vs. atingido e exportação JSON |
| `recipe-input` | Parâmetros da receita e valores esperados, reutilizáveis entre brassagens |
| `style-guidelines` | Estilos BJCP com alertas de conformidade (verde / laranja até 15% fora / vermelho acima), em SRM ou EBC |

## Fluxo de trabalho

O desenvolvimento segue o fluxo spec-driven do [OpenSpec](https://github.com/Fission-AI/OpenSpec), com os comandos `/opsx:*` no Claude Code:

- `/opsx:explore`: explorar ideias e requisitos
- `/opsx:propose`: propor uma mudança com todos os artefatos
- `/opsx:apply`: implementar as tarefas de `tasks.md`
- `/opsx:archive`: arquivar a mudança concluída

## Não-objetivos

Multiusuário/autenticação, integração com serviços externos (BeerXML, Brewfather) e app mobile nativo.

## Créditos

Dados de estilos: [bjcp-styleview](https://github.com/ascholer/bjcp-styleview).
