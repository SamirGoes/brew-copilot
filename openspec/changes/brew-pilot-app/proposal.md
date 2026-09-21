# Proposal

## Why

Cervejeiros artesanais precisam de uma ferramenta para acompanhar e recalcular parâmetros durante a brassagem em tempo real. Atualmente, desvios nos valores esperados (OG, volume, etc.) exigem cálculos manuais para correção, o que é propenso a erros e consome tempo durante um processo que exige atenção.

## What Changes

- Criar aplicação web local (frontend React + backend Python/FastAPI) para cálculos de brassagem
- Calcular parâmetros de mosturação: proporção água/malte, capacidade da panela, lavagem do mosto
- Registrar e comparar valores esperados vs. atingidos em cada fase (mosturação, pré-fervura, pós-fervura)
- Calcular correções de OG (adicionar/remover água após fervura)
- Calcular IBU baseado em quantidade de lúpulo, alfa-ácidos e tempo de fervura
- Recalcular lúpulo necessário para atingir IBU alvo com tempo de fervura ajustado
- Calcular correção de sais da água (CaSO₄, MgSO₄, CaCl) e ácido ascórbico por perfil de água e volume
- Acompanhar fases até fermentação e carbonatação
- Manter histórico de valores propostos vs. atingidos por brassagem
- Suportar execução via Docker para deploy em servidor pessoal
- Biblioteca de estilos BJCP com validação visual de conformidade (alertas para valores fora do range)

## Capabilities

### New Capabilities

- `mash-calculator`: Cálculos de mosturação (água, malte, proporções, capacidade de panela, lavagem)
- `gravity-tracker`: Registro e correção de gravidades (OG mostura, OG pré-fervura, OG final, FG)
- `hop-calculator`: Cálculo de IBU e recálculo de lúpulo por tempo de fervura
- `water-chemistry`: Cálculo de sais (CaSO₄, MgSO₄, CaCl) e ácido ascórbico por perfil de água
- `brew-session`: Gerenciamento de sessão de brassagem, fases e histórico de valores
- `recipe-input`: Entrada de parâmetros da receita e valores esperados
- `style-guidelines`: Biblioteca BJCP com validação de conformidade e alertas visuais para desvios

### Modified Capabilities

(nenhuma - projeto greenfield)

## Impact

- **Código**: Criação de nova aplicação frontend (React + Vite + TypeScript) e backend (Python + FastAPI)
- **APIs**: API REST local para cálculos e persistência de sessões
- **Dependências**: FastAPI, SQLAlchemy, Pydantic (backend); React, Vite, TypeScript (frontend)
- **Infraestrutura**: Dockerfile e docker-compose para execução local e deploy em servidor pessoal
- **Sistemas**: Execução local ou via container Docker
