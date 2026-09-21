import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.recipe import Recipe, utcnow


class Phase(str, enum.Enum):
    MASH = "mash"
    LAUTER = "lauter"
    BOIL = "boil"
    COOLING = "cooling"
    FERMENTATION = "fermentation"
    CONDITIONING = "conditioning"
    CARBONATION = "carbonation"


PHASE_ORDER = list(Phase)


class BrewSession(Base):
    __tablename__ = "brew_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int | None] = mapped_column(ForeignKey("recipes.id", ondelete="SET NULL"), default=None)
    name: Mapped[str] = mapped_column(String(200))
    current_phase: Mapped[Phase] = mapped_column(Enum(Phase, native_enum=False), default=Phase.MASH)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    notes: Mapped[str | None] = mapped_column(Text, default=None)

    recipe: Mapped[Recipe | None] = relationship()
    readings: Mapped[list["SessionReading"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="SessionReading.recorded_at"
    )


class SessionReading(Base):
    """Valor esperado vs. atingido de um parâmetro em uma fase (ex.: og, volume_l, temp_c)."""

    __tablename__ = "session_readings"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("brew_sessions.id", ondelete="CASCADE"))
    phase: Mapped[Phase] = mapped_column(Enum(Phase, native_enum=False))
    parameter: Mapped[str] = mapped_column(String(50))
    expected: Mapped[float | None] = mapped_column(Float, default=None)
    actual: Mapped[float | None] = mapped_column(Float, default=None)
    unit: Mapped[str | None] = mapped_column(String(20), default=None)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    notes: Mapped[str | None] = mapped_column(Text, default=None)

    session: Mapped[BrewSession] = relationship(back_populates="readings")
