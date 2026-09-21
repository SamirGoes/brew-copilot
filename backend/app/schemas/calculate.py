from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.calculators.water import WaterProfile


# --- Mostura ---------------------------------------------------------------

class MashRequest(BaseModel):
    grain_kg: float = Field(gt=0)
    water_to_grain_ratio: float = Field(default=3.0, gt=0, description="L de água por kg de malte")
    kettle_capacity_l: float | None = Field(default=None, gt=0)
    sparging: bool = True
    preboil_volume_l: float | None = Field(default=None, gt=0, description="Volume pré-fervura alvo")


class KettleCheckResponse(BaseModel):
    fits: bool
    capacity_l: float
    margin_l: float
    overflow_l: float
    warning: str | None


class MashResponse(BaseModel):
    strike_water_l: float
    mash_volume_l: float
    grain_absorption_l: float
    first_runnings_l: float
    kettle: KettleCheckResponse | None
    sparge_water_l: float | None


# --- Gravidade -------------------------------------------------------------

class GrainInput(BaseModel):
    weight_kg: float = Field(gt=0)
    potential_ppg: float = Field(default=37.0, gt=0, le=46)


class GravityRequest(BaseModel):
    """Todos os campos são opcionais; cada bloco da resposta é calculado quando seus dados existem."""

    sg: float | None = Field(default=None, ge=0.99, le=1.2, description="Converter SG para Plato")
    plato: float | None = Field(default=None, ge=0, le=45, description="Converter Plato para SG")

    expected_sg: float | None = Field(default=None, ge=0.99, le=1.2)
    actual_sg: float | None = Field(default=None, ge=0.99, le=1.2)

    og: float | None = Field(default=None, gt=1.0, le=1.2)
    fg: float | None = Field(default=None, ge=0.99, le=1.2)

    preboil_sg: float | None = Field(default=None, gt=1.0, le=1.2)
    preboil_volume_l: float | None = Field(default=None, gt=0)
    postboil_volume_l: float | None = Field(default=None, gt=0)

    current_volume_l: float | None = Field(default=None, gt=0, description="Volume atual para correção de OG")
    target_og: float | None = Field(default=None, gt=1.0, le=1.2)

    grains: list[GrainInput] = []
    fermenter_volume_l: float | None = Field(default=None, gt=0)


class Conversion(BaseModel):
    sg: float
    plato: float


class Comparison(BaseModel):
    deviation: float
    status: Literal["on_target", "below", "above"]


class Attenuation(BaseModel):
    abv_pct: float
    apparent_attenuation_pct: float


class Adjustment(BaseModel):
    action: Literal["add_water", "boil_off", "none"]
    liters: float
    final_volume_l: float


class GravityResponse(BaseModel):
    conversion: Conversion | None = None
    comparison: Comparison | None = None
    attenuation: Attenuation | None = None
    expected_postboil_sg: float | None = None
    adjustment: Adjustment | None = None
    mash_efficiency_pct: float | None = None
    brewhouse_efficiency_pct: float | None = None


# --- Lúpulo ----------------------------------------------------------------

Formula = Literal["tinseth", "rager"]


class HopInput(BaseModel):
    variety: str = ""
    weight_g: float = Field(ge=0)
    alpha_acid_pct: float = Field(gt=0, le=30)
    boil_time_min: float = Field(ge=0, le=300)
    new_boil_time_min: float | None = Field(
        default=None, ge=0, le=300, description="Recalcula o peso para manter o IBU com este tempo"
    )


class HopsRequest(BaseModel):
    additions: list[HopInput] = Field(min_length=1)
    volume_l: float = Field(gt=0)
    og: float = Field(gt=1.0, le=1.2)
    formula: Formula = "tinseth"


class HopResult(BaseModel):
    variety: str
    weight_g: float
    alpha_acid_pct: float
    boil_time_min: float
    utilization_pct: float
    ibu: float
    adjusted_weight_g: float | None = None


class HopsResponse(BaseModel):
    formula: Formula
    total_ibu: float
    additions: list[HopResult]
    bu_gu: float
    balance: Literal["malty", "balanced", "hoppy"]


# --- Água ------------------------------------------------------------------

class WaterRequest(BaseModel):
    profile: WaterProfile
    mash_volume_l: float = Field(ge=0)
    sparge_volume_l: float | None = Field(default=None, ge=0)


class SaltsResponse(BaseModel):
    caso4_g: float
    mgso4_g: float
    cacl_g: float


class AcidResponse(BaseModel):
    min_drops: int
    max_drops: int
    label: str


class WaterDose(BaseModel):
    volume_l: float
    salts: SaltsResponse
    ascorbic_acid: AcidResponse


class WaterResponse(BaseModel):
    profile: WaterProfile
    mash: WaterDose
    sparge: WaterDose | None


class WaterProfileRow(BaseModel):
    profile: WaterProfile
    label: str
    caso4_g: float
    mgso4_g: float
    cacl_g: float


# --- Carbonatação ----------------------------------------------------------

class CarbonationRequest(BaseModel):
    target_vols: float = Field(gt=0, le=5)
    volume_l: float | None = Field(default=None, gt=0)
    beer_temp_c: float | None = Field(default=None, ge=-2, le=35, description="Para priming")
    fridge_temp_c: float | None = Field(default=None, ge=-2, le=25, description="Para carbonatação forçada")

    @model_validator(mode="after")
    def _needs_one_method(self):
        priming = self.volume_l is not None and self.beer_temp_c is not None
        if not priming and self.fridge_temp_c is None:
            raise ValueError("informe volume_l e beer_temp_c (priming) ou fridge_temp_c (forçada)")
        return self


class CarbonationResponse(BaseModel):
    table_sugar_g: float | None = None
    dextrose_g: float | None = None
    force_carb_psi: float | None = None
