from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401  (registra as tabelas no Base)
from app.calculators.style_validator import load_styles
from app.config import settings
from app.database import Base, add_missing_columns, engine
from app.routers import calculate, recipes, sessions, styles


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(engine)  # cria tabelas novas
    add_missing_columns(engine)  # acrescenta colunas novas às tabelas existentes, sem perder dados
    load_styles()  # carrega o BJCP em memória no startup
    yield


app = FastAPI(title="Brew Copilot API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (calculate, recipes, sessions, styles):
    app.include_router(r.router)


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
