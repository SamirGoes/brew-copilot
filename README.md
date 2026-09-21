# Brew Copilot

Copiloto de brassagem para cervejeiros artesanais: acompanhe e recalcule parâmetros em tempo real durante a produção, sem depender de contas manuais.

> **Status:** planejamento. O repositório contém as especificações ([OpenSpec](https://github.com/Fission-AI/OpenSpec)) da aplicação; a implementação ainda não começou.

## Motivação

Desvios nos valores esperados (OG, volume, etc.) durante a brassagem exigem cálculos manuais de correção, propensos a erro, num processo que já exige atenção total. O Brew Copilot registra o esperado vs. o atingido em cada fase e calcula as correções.

## Funcionalidades planejadas

| Capacidade | Descrição |
|---|---|
| `mash-calculator` | Água, malte, proporções, capacidade da panela e lavagem |
| `gravity-tracker` | Registro e correção de gravidades (mostura, pré-fervura, OG, FG); ajuste de OG adicionando/removendo água |
| `hop-calculator` | IBU (Tinseth) e recálculo de lúpulo para um IBU alvo com tempo de fervura ajustado |
| `water-chemistry` | Sais (CaSO₄, MgSO₄, CaCl) e ácido ascórbico por perfil de água e volume |
| `brew-session` | Fases da brassagem até fermentação e carbonatação, com histórico de proposto vs. atingido |
| `recipe-input` | Parâmetros da receita e valores esperados |
| `style-guidelines` | Biblioteca de estilos BJCP com alertas visuais de conformidade (verde / laranja até 15% fora / vermelho acima) |

## Arquitetura

- **Backend:** Python 3.12, FastAPI, SQLAlchemy, Pydantic
- **Frontend:** React 18, Vite, TypeScript (mobile-first)
- **Persistência:** SQLite (arquivo único, sem dependências externas)
- **Execução:** local ou via Docker / docker-compose (backend + frontend com nginx)

Os cálculos ficam em funções puras em `backend/app/calculators/`, testáveis sem mocks. A API REST expõe docs em `/docs`.

> **Backup dos dados:** o SQLite fica no volume `brew-data` do docker-compose. Não remova o volume, ou você perde o histórico.

## Estrutura do repositório

```
openspec/
├── config.yaml
└── changes/brew-pilot-app/
    ├── proposal.md   # por quê e o quê
    ├── design.md     # decisões técnicas
    ├── tasks.md      # plano de implementação
    └── specs/        # requisitos por capacidade
.claude/              # comandos e skills do OpenSpec
```

## Fluxo de trabalho

O desenvolvimento segue o fluxo spec-driven do OpenSpec, com os comandos `/opsx:*` no Claude Code:

- `/opsx:explore`: explorar ideias e requisitos
- `/opsx:propose`: propor uma mudança com todos os artefatos
- `/opsx:apply`: implementar as tarefas de `tasks.md`
- `/opsx:archive`: arquivar a mudança concluída

## Não-objetivos

Multiusuário/autenticação, integração com serviços externos (BeerXML, Brewfather) e app mobile nativo.

## Créditos

Dados de estilos: [bjcp-styleview](https://github.com/ascholer/bjcp-styleview).
