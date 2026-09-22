from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.calculators.water import WaterProfile


class GrainBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    weight_kg: float = Field(gt=0)
    potential_ppg: float = Field(default=37.0, gt=0, le=46)


class GrainCreate(GrainBase):
    pass


class GrainRead(GrainBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class HopAdditionBase(BaseModel):
    variety: str = Field(min_length=1, max_length=100)
    weight_g: float = Field(gt=0)
    alpha_acid_pct: float = Field(gt=0, le=30)
    boil_time_min: int = Field(ge=0, le=300)


class HopAdditionCreate(HopAdditionBase):
    pass


class HopAdditionRead(HopAdditionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class RecipeBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    style_number: str | None = None

    batch_size_l: float = Field(default=20.0, gt=0)
    mash_water_l: float | None = Field(default=None, gt=0)
    sparge_water_l: float | None = Field(default=None, ge=0)
    sparging: bool = True

    kettle_capacity_l: float | None = Field(default=None, gt=0)
    boil_off_rate_l_h: float | None = Field(default=None, ge=0)
    dead_space_l: float = Field(default=0.0, ge=0)
    boil_time_min: int = Field(default=60, gt=0, le=300)

    og_mash: float | None = Field(default=None, ge=1.0, le=1.2)
    og_preboil: float | None = Field(default=None, ge=1.0, le=1.2)
    og: float | None = Field(default=None, ge=1.0, le=1.2)
    fg: float | None = Field(default=None, ge=0.99, le=1.2)
    ibu: float | None = Field(default=None, ge=0, le=200)
    srm: float | None = Field(default=None, ge=0, le=100)
    abv: float | None = Field(default=None, ge=0, le=25)

    preboil_volume_l: float | None = Field(default=None, gt=0)
    water_profile: WaterProfile | None = Field(default=None)

    yeast: str | None = None
    fermentation_temp_c: float | None = None
    expected_attenuation_pct: float | None = Field(default=None, gt=0, le=100)


class RecipeCreate(RecipeBase):
    grains: list[GrainCreate] = []
    hops: list[HopAdditionCreate] = []


class RecipeUpdate(RecipeCreate):
    """PUT semântico: grains/hops substituem as listas existentes."""


class RecipeRead(RecipeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    grains: list[GrainRead] = []
    hops: list[HopAdditionRead] = []
