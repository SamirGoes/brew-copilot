"""IBU (Tinseth e Rager) e recálculo de lúpulo."""

import math
from dataclasses import dataclass
from typing import Literal

Formula = Literal["tinseth", "rager"]


def utilization(boil_time_min: float, sg: float, formula: Formula = "tinseth") -> float:
    """Fração (0-1) dos alfa-ácidos isomerizados."""
    if boil_time_min < 0:
        raise ValueError("boil_time_min não pode ser negativo")
    if formula == "tinseth":
        bigness = 1.65 * 0.000125 ** (sg - 1)
        boil_factor = (1 - math.exp(-0.04 * boil_time_min)) / 4.15
        return bigness * boil_factor
    if formula == "rager":
        return (18.11 + 13.86 * math.tanh((boil_time_min - 31.32) / 18.27)) / 100
    raise ValueError(f"fórmula desconhecida: {formula}")


def _gravity_adjustment(sg: float) -> float:
    """Ajuste de gravidade do Rager (só acima de 1.050)."""
    return (sg - 1.050) / 0.2 if sg > 1.050 else 0.0


def tinseth_ibu(
    weight_g: float,
    alpha_acid_pct: float,
    boil_time_min: float,
    volume_l: float,
    sg: float,
    formula: Formula = "tinseth",
) -> float:
    """IBU de uma adição de lúpulo."""
    if weight_g < 0 or alpha_acid_pct < 0:
        raise ValueError("weight_g e alpha_acid_pct não podem ser negativos")
    if volume_l <= 0:
        raise ValueError("volume_l deve ser maior que zero")
    mg_alpha_per_l = weight_g * alpha_acid_pct / 100 * 1000 / volume_l
    ibu = mg_alpha_per_l * utilization(boil_time_min, sg, formula)
    if formula == "rager":
        ibu /= 1 + _gravity_adjustment(sg)
    return ibu


@dataclass(frozen=True)
class HopContribution:
    weight_g: float
    alpha_acid_pct: float
    boil_time_min: float
    utilization: float
    ibu: float


def total_ibu(
    additions: list[tuple[float, float, float]],
    volume_l: float,
    sg: float,
    formula: Formula = "tinseth",
) -> tuple[float, list[HopContribution]]:
    """IBU total e contribuição de cada adição, dadas tuplas (peso_g, AA%, tempo_min)."""
    contributions = [
        HopContribution(
            w, aa, t, utilization(t, sg, formula), tinseth_ibu(w, aa, t, volume_l, sg, formula)
        )
        for w, aa, t in additions
    ]
    return sum(c.ibu for c in contributions), contributions


def recalculate_hops(
    weight_g: float,
    original_time_min: float,
    new_time_min: float,
    sg: float,
    formula: Formula = "tinseth",
) -> float:
    """Peso de lúpulo que mantém o mesmo IBU ao mudar o tempo de fervura."""
    new_util = utilization(new_time_min, sg, formula)
    if new_util <= 0:
        raise ValueError("com esse tempo de fervura não há isomerização; aumente o tempo")
    return weight_g * utilization(original_time_min, sg, formula) / new_util


def hop_weight_for_ibu(
    target_ibu: float,
    alpha_acid_pct: float,
    boil_time_min: float,
    volume_l: float,
    sg: float,
    formula: Formula = "tinseth",
) -> float:
    """Peso (g) necessário para atingir um IBU alvo com uma única adição."""
    if alpha_acid_pct <= 0:
        raise ValueError("alpha_acid_pct deve ser maior que zero")
    unit_ibu = tinseth_ibu(1.0, alpha_acid_pct, boil_time_min, volume_l, sg, formula)
    if unit_ibu <= 0:
        raise ValueError("com esse tempo de fervura não há isomerização; aumente o tempo")
    return target_ibu / unit_ibu


def bu_gu_ratio(ibu: float, og: float) -> tuple[float, str]:
    """Relação IBU:pontos de OG e classificação (malty < 0.5 <= balanced <= 0.8 < hoppy)."""
    if og <= 1:
        raise ValueError("og deve ser maior que 1.000")
    ratio = ibu / ((og - 1) * 1000)
    if ratio < 0.5:
        return ratio, "malty"
    if ratio <= 0.8:
        return ratio, "balanced"
    return ratio, "hoppy"
