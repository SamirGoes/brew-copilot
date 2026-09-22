"""Cálculos de mosturação. Funções puras, volumes em litros e massas em kg."""

import math
from dataclasses import dataclass
from typing import Literal

GRAIN_DISPLACEMENT_L_PER_KG = 0.67
GRAIN_ABSORPTION_L_PER_KG = 1.0
# Abaixo disso a mostura fica grossa demais para uma infusão simples.
MIN_MASH_RATIO_L_PER_KG = 2.5


def _positive(name: str, value: float) -> None:
    if value <= 0:
        raise ValueError(f"{name} deve ser maior que zero")


def strike_water(grain_kg: float, water_to_grain_ratio: float) -> float:
    """Volume de água de mostura (L) para uma proporção L/kg."""
    _positive("grain_kg", grain_kg)
    _positive("water_to_grain_ratio", water_to_grain_ratio)
    return grain_kg * water_to_grain_ratio


def mash_volume(grain_kg: float, strike_water_l: float) -> float:
    """Volume total da mostura: água + deslocamento do malte (~0,67 L/kg)."""
    _positive("grain_kg", grain_kg)
    _positive("strike_water_l", strike_water_l)
    return strike_water_l + grain_kg * GRAIN_DISPLACEMENT_L_PER_KG


def grain_absorption(grain_kg: float) -> float:
    """Água retida pelo malte (L), ~1 L/kg."""
    _positive("grain_kg", grain_kg)
    return grain_kg * GRAIN_ABSORPTION_L_PER_KG


@dataclass(frozen=True)
class KettleCheck:
    fits: bool
    mash_volume_l: float
    capacity_l: float
    margin_l: float  # folga (>= 0) quando cabe
    overflow_l: float  # excesso (> 0) quando não cabe
    warning: str | None


def check_kettle_fit(mash_volume_l: float, kettle_capacity_l: float) -> KettleCheck:
    """Valida se a mostura cabe na panela, com folga ou excesso."""
    _positive("mash_volume_l", mash_volume_l)
    _positive("kettle_capacity_l", kettle_capacity_l)
    diff = kettle_capacity_l - mash_volume_l
    if diff >= 0:
        return KettleCheck(True, mash_volume_l, kettle_capacity_l, diff, 0.0, None)
    overflow = -diff
    warning = (
        f"A mostura excede a panela em {overflow:.1f} L. "
        "Reduza a quantidade de malte ou divida em mais de uma batelada."
    )
    return KettleCheck(False, mash_volume_l, kettle_capacity_l, 0.0, overflow, warning)


def sparge_water(
    preboil_volume_l: float,
    first_runnings_l: float,
    absorption_loss_l: float = 0.0,
    enabled: bool = True,
) -> float | None:
    """Água de lavagem (batch sparge) = pré-fervura alvo - primeiro mosto (+ perdas).

    Retorna None quando a lavagem está desativada (estilo BIAB / no-sparge).
    """
    if not enabled:
        return None
    _positive("preboil_volume_l", preboil_volume_l)
    if first_runnings_l < 0 or absorption_loss_l < 0:
        raise ValueError("first_runnings_l e absorption_loss_l não podem ser negativos")
    return max(preboil_volume_l - first_runnings_l, 0.0) + absorption_loss_l


@dataclass(frozen=True)
class WaterSplitSuggestion:
    """Como redistribuir a água para a mostura caber na panela (água total inalterada)."""

    action: Literal["redistribute", "enable_sparge", "reduce_grain"]
    mash_water_l: float | None  # água de mostura sugerida
    sparge_water_l: float | None  # água de lavagem sugerida
    moved_l: float  # litros movidos da mostura para a lavagem
    max_grain_kg: float  # maior quantidade de malte que cabe a 2,5 L/kg
    message: str


def suggest_water_split(
    grain_kg: float,
    mash_water_l: float,
    sparge_water_l: float | None,
    kettle_capacity_l: float,
    sparging: bool = True,
) -> WaterSplitSuggestion | None:
    """Sugere mover água da mostura para a lavagem quando a mostura não cabe na panela.

    Retorna None se já cabe. A água de mostura sugerida é arredondada para baixo
    (0,1 L) para garantir que caiba.
    """
    _positive("grain_kg", grain_kg)
    _positive("mash_water_l", mash_water_l)
    _positive("kettle_capacity_l", kettle_capacity_l)
    if mash_volume(grain_kg, mash_water_l) <= kettle_capacity_l:
        return None

    max_grain = kettle_capacity_l / (MIN_MASH_RATIO_L_PER_KG + GRAIN_DISPLACEMENT_L_PER_KG)
    max_mash = math.floor((kettle_capacity_l - grain_kg * GRAIN_DISPLACEMENT_L_PER_KG) * 10) / 10
    if max_mash < grain_kg * MIN_MASH_RATIO_L_PER_KG:
        return WaterSplitSuggestion(
            "reduce_grain", None, None, 0.0, max_grain,
            f"A mostura não cabe na panela nem com o mínimo de {MIN_MASH_RATIO_L_PER_KG} L/kg. "
            f"Reduza o malte para até {max_grain:.1f} kg ou divida a brassagem.",
        )

    moved = round(mash_water_l - max_mash, 2)
    new_sparge = round((sparge_water_l or 0.0) + moved, 2)
    action = "redistribute" if sparging else "enable_sparge"
    prefix = "" if sparging else "Ative a lavagem: "
    return WaterSplitSuggestion(
        action, max_mash, new_sparge, moved, max_grain,
        f"{prefix}use {max_mash:.1f} L na mostura ({max_mash / grain_kg:.1f} L/kg) "
        f"e {new_sparge:.1f} L na lavagem (+{moved:.1f} L). A água total não muda.",
    )


@dataclass(frozen=True)
class WaterRecalculation:
    """Água de mostura, lavagem e volume pré-fervura recalculados do zero a partir do
    equipamento, do malte e de uma proporção — em vez de só ajustar valores já digitados
    (ver `suggest_water_split`, que preserva a água total mesmo quando ela já estava errada)."""

    fits: bool
    ratio_used: float  # L/kg efetivamente aplicado (pode ter sido reduzido para caber)
    mash_water_l: float
    sparge_water_l: float | None  # None quando sparging=False (BIAB)
    preboil_volume_l: float
    mash_volume_l: float
    max_grain_kg: float  # maior malte que cabe a MIN_MASH_RATIO_L_PER_KG
    warning: str | None  # None quando cabe


def recalculate_water(
    grain_kg: float,
    batch_size_l: float,
    dead_space_l: float,
    boil_off_rate_l_h: float,
    boil_time_min: float,
    kettle_capacity_l: float,
    ratio: float = 3.0,
    sparging: bool = True,
) -> WaterRecalculation:
    """Deriva água de mostura, lavagem e volume pré-fervura do equipamento e do malte.

    Com lavagem: água de mostura = proporção × malte, reduzida até `MIN_MASH_RATIO_L_PER_KG`
    se necessário para caber na panela; água de lavagem = pré-fervura − primeiro mosto
    (mesma fórmula de `sparge_water`). Sem lavagem (BIAB): água de mostura = pré-fervura +
    absorção (método de volume total), sem lavagem — ver "No-sparge brewing" no spec.
    """
    _positive("grain_kg", grain_kg)
    _positive("batch_size_l", batch_size_l)
    _positive("kettle_capacity_l", kettle_capacity_l)
    _positive("ratio", ratio)
    if dead_space_l < 0 or boil_off_rate_l_h < 0 or boil_time_min < 0:
        raise ValueError("dead_space_l, boil_off_rate_l_h e boil_time_min não podem ser negativos")

    preboil_volume_l = batch_size_l + dead_space_l + boil_off_rate_l_h * boil_time_min / 60
    max_grain = kettle_capacity_l / (MIN_MASH_RATIO_L_PER_KG + GRAIN_DISPLACEMENT_L_PER_KG)
    absorption = grain_absorption(grain_kg)
    reduce_grain_warning = (
        f"A mostura não cabe na panela nem com o mínimo de {MIN_MASH_RATIO_L_PER_KG} L/kg. "
        f"Reduza o malte para até {max_grain:.1f} kg ou divida a brassagem."
    )

    if not sparging:
        water = preboil_volume_l + absorption  # método de volume total: tudo de uma vez
        volume = mash_volume(grain_kg, water)
        ratio_used = water / grain_kg
        if volume <= kettle_capacity_l:
            return WaterRecalculation(True, ratio_used, water, None, preboil_volume_l, volume, max_grain, None)
        overflow = volume - kettle_capacity_l
        warning = (
            f"Sem lavagem, é preciso {water:.1f} L, que excedem a panela em {overflow:.1f} L. "
            f"Ative a lavagem ou reduza o malte para até {max_grain:.1f} kg."
        )
        return WaterRecalculation(False, ratio_used, water, None, preboil_volume_l, volume, max_grain, warning)

    water = ratio * grain_kg
    volume = mash_volume(grain_kg, water)
    if volume > kettle_capacity_l:
        # Reduz a proporção até o piso de 2,5 L/kg para caber (mesma regra de suggest_water_split).
        water = math.floor((kettle_capacity_l - grain_kg * GRAIN_DISPLACEMENT_L_PER_KG) * 10) / 10
        if water < grain_kg * MIN_MASH_RATIO_L_PER_KG:
            water = max(water, 0.0)
            ratio_used = water / grain_kg if water > 0 else 0.0
            volume = mash_volume(grain_kg, water) if water > 0 else grain_kg * GRAIN_DISPLACEMENT_L_PER_KG
            return WaterRecalculation(
                False, ratio_used, water, None, preboil_volume_l, volume, max_grain, reduce_grain_warning
            )
        volume = mash_volume(grain_kg, water)

    ratio_used = water / grain_kg
    first_runnings = max(water - absorption, 0.0)
    sparge = sparge_water(preboil_volume_l, first_runnings, enabled=True)
    return WaterRecalculation(True, ratio_used, water, sparge, preboil_volume_l, volume, max_grain, None)


@dataclass(frozen=True)
class PreboilCheck:
    overflow_l: float
    warning: str


def check_preboil_fit(preboil_volume_l: float, kettle_capacity_l: float) -> PreboilCheck | None:
    """Aviso quando o volume pré-fervura não cabe na panela."""
    _positive("preboil_volume_l", preboil_volume_l)
    _positive("kettle_capacity_l", kettle_capacity_l)
    overflow = preboil_volume_l - kettle_capacity_l
    if overflow <= 0:
        return None
    return PreboilCheck(
        overflow,
        f"O volume pré-fervura excede a panela em {overflow:.1f} L. Reduza o pré-fervura "
        "e complete com água após a fervura.",
    )
