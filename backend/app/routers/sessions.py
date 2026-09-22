import re

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import PHASE_ORDER, BrewSession, Recipe, SessionReading
from app.models.recipe import utcnow
from app.schemas import (
    ReadingCreate,
    ReadingRead,
    RecipeRead,
    SessionCreate,
    SessionExport,
    SessionRead,
    SessionUpdate,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Leitura gravada ao concluir uma fase; o recorded_at marca o horário de conclusão.
PHASE_COMPLETED = "phase_completed"


def _read(session: BrewSession) -> SessionRead:
    out = SessionRead.model_validate(session)
    out.recipe_name = session.recipe.name if session.recipe else None
    return out


def _get_or_404(db: Session, session_id: int) -> BrewSession:
    session = db.get(BrewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="sessão não encontrada")
    return session


@router.get("", response_model=list[SessionRead])
def list_sessions(db: Session = Depends(get_db)) -> list[SessionRead]:
    stmt = (
        select(BrewSession)
        .options(selectinload(BrewSession.readings), selectinload(BrewSession.recipe))
        .order_by(BrewSession.created_at.desc())
    )
    return [_read(s) for s in db.scalars(stmt)]


@router.post("", response_model=SessionRead, status_code=201)
def create_session(data: SessionCreate, db: Session = Depends(get_db)) -> SessionRead:
    recipe = None
    if data.recipe_id is not None:
        recipe = db.get(Recipe, data.recipe_id)
        if recipe is None:
            raise HTTPException(status_code=422, detail="receita não encontrada")
    name = data.name or (recipe.name if recipe else None)
    if not name:
        raise HTTPException(status_code=422, detail="informe um nome ou uma receita")
    session = BrewSession(name=name, recipe_id=data.recipe_id, notes=data.notes)
    db.add(session)
    db.commit()
    db.refresh(session)
    return _read(session)


@router.get("/{session_id}", response_model=SessionRead)
def get_session(session_id: int, db: Session = Depends(get_db)) -> SessionRead:
    return _read(_get_or_404(db, session_id))


@router.patch("/{session_id}", response_model=SessionRead)
def update_session(session_id: int, data: SessionUpdate, db: Session = Depends(get_db)) -> SessionRead:
    session = _get_or_404(db, session_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return _read(session)


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db)) -> Response:
    db.delete(_get_or_404(db, session_id))
    db.commit()
    return Response(status_code=204)


@router.post("/{session_id}/phase", response_model=SessionRead)
def advance_phase(session_id: int, db: Session = Depends(get_db)) -> SessionRead:
    """Conclui a fase atual e avança para a próxima; na última, encerra a sessão."""
    session = _get_or_404(db, session_id)
    if session.completed_at is not None:
        raise HTTPException(status_code=409, detail="sessão já concluída")
    session.readings.append(SessionReading(phase=session.current_phase, parameter=PHASE_COMPLETED))
    idx = PHASE_ORDER.index(session.current_phase)
    if idx + 1 < len(PHASE_ORDER):
        session.current_phase = PHASE_ORDER[idx + 1]
    else:
        session.completed_at = utcnow()
    db.commit()
    db.refresh(session)
    return _read(session)


def _slug(text: str) -> str:
    """Nome de arquivo seguro a partir do nome da sessão."""
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "brassagem"


@router.get("/{session_id}/export", response_model=SessionExport)
def export_session(session_id: int, db: Session = Depends(get_db)) -> JSONResponse:
    """Sessão completa em JSON (receita + todas as leituras), como arquivo para download."""
    session = _get_or_404(db, session_id)
    export = SessionExport(
        exported_at=utcnow(),
        session=_read(session),
        recipe=RecipeRead.model_validate(session.recipe) if session.recipe else None,
    )
    filename = f"brassagem-{session.id}-{_slug(session.name)}.json"
    return JSONResponse(
        content=export.model_dump(mode="json"),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{session_id}/reading", response_model=ReadingRead, status_code=201)
def add_reading(session_id: int, data: ReadingCreate, db: Session = Depends(get_db)) -> SessionReading:
    session = _get_or_404(db, session_id)
    reading = SessionReading(**data.model_dump(exclude={"phase"}), phase=data.phase or session.current_phase)
    session.readings.append(reading)
    db.commit()
    db.refresh(reading)
    return reading
