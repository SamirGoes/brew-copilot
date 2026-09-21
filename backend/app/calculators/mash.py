"""Cálculos de mosturação. Funções puras, volumes em litros e massas em kg."""

from dataclasses import dataclass

GRAIN_DISPLACEMENT_L_PER_KG = 0.67
GRAIN_ABSORPTION_L_PER_KG = 1.0


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
