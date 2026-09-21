from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    style_number: Mapped[str | None] = mapped_column(String(10), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Volumes (L)
    batch_size_l: Mapped[float] = mapped_column(Float, default=20.0)
    mash_water_l: Mapped[float | None] = mapped_column(Float, default=None)
    sparge_water_l: Mapped[float | None] = mapped_column(Float, default=None)
    sparging: Mapped[bool] = mapped_column(Boolean, default=True)

    # Equipamento
    kettle_capacity_l: Mapped[float | None] = mapped_column(Float, default=None)
    boil_off_rate_l_h: Mapped[float | None] = mapped_column(Float, default=None)
    dead_space_l: Mapped[float] = mapped_column(Float, default=0.0)
    boil_time_min: Mapped[int] = mapped_column(Integer, default=60)

    # Gravidades alvo (SG)
    og_mash: Mapped[float | None] = mapped_column(Float, default=None)
    og_preboil: Mapped[float | None] = mapped_column(Float, default=None)
    og: Mapped[float | None] = mapped_column(Float, default=None)
    fg: Mapped[float | None] = mapped_column(Float, default=None)

    # Fermentação
    yeast: Mapped[str | None] = mapped_column(String(100), default=None)
    fermentation_temp_c: Mapped[float | None] = mapped_column(Float, default=None)
    expected_attenuation_pct: Mapped[float | None] = mapped_column(Float, default=None)

    grains: Mapped[list["Grain"]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan", order_by="Grain.id"
    )
    hops: Mapped[list["HopAddition"]] = relationship(
        back_populates="recipe", cascade="all, delete-orphan", order_by="HopAddition.id"
    )


class Grain(Base):
    __tablename__ = "grains"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100))
    weight_kg: Mapped[float] = mapped_column(Float)
    # Potencial de extrato em PPG (pontos/lb/gal), ex.: 37 para malte base
    potential_ppg: Mapped[float] = mapped_column(Float, default=37.0)

    recipe: Mapped[Recipe] = relationship(back_populates="grains")


class HopAddition(Base):
    __tablename__ = "hop_additions"

    id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id", ondelete="CASCADE"))
    variety: Mapped[str] = mapped_column(String(100))
    weight_g: Mapped[float] = mapped_column(Float)
    alpha_acid_pct: Mapped[float] = mapped_column(Float)
    boil_time_min: Mapped[int] = mapped_column(Integer)

    recipe: Mapped[Recipe] = relationship(back_populates="hops")
