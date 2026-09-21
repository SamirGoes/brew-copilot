from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.session import Phase


class SessionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    recipe_id: int | None = None
    notes: str | None = None


class ReadingCreate(BaseModel):
    phase: Phase | None = None  # padrão: fase atual da sessão
    parameter: str = Field(min_length=1, max_length=50)
    expected: float | None = None
    actual: float | None = None
    unit: str | None = Field(default=None, max_length=20)
    notes: str | None = None


class ReadingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    phase: Phase
    parameter: str
    expected: float | None
    actual: float | None
    unit: str | None
    recorded_at: datetime
    notes: str | None

    @computed_field
    @property
    def deviation(self) -> float | None:
        if self.expected is None or self.actual is None:
            return None
        return self.actual - self.expected


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    recipe_id: int | None
    current_phase: Phase
    created_at: datetime
    completed_at: datetime | None
    notes: str | None
    readings: list[ReadingRead] = []
