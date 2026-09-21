"""Gravidade, eficiência e correções de OG. SG = densidade específica (ex.: 1.050)."""

from dataclasses import dataclass

LITERS_PER_GALLON = 3.78541
POUNDS_PER_KG = 2.20462


def sg_to_plato(sg: float) -> float:
    return -616.868 + 1111.14 * sg - 630.272 * sg**2 + 135.997 * sg**3


def plato_to_sg(plato: float) -> float:
    return 1 + plato / (258.6 - (plato / 258.2) * 227.1)


def gravity_deviation(expected_sg: float, actual_sg: float) -> float:
    """Desvio (real - esperado) em SG, arredondado a 4 casas."""
    return round(actual_sg - expected_sg, 4)


def abv(og: float, fg: float) -> float:
    return (og - fg) * 131.25


def apparent_attenuation(og: float, fg: float) -> float:
    """Atenuação aparente em %."""
    if og <= 1:
        raise ValueError("og deve ser maior que 1.000")
    return (og - fg) / (og - 1) * 100


def post_boil_gravity(preboil_sg: float, preboil_volume_l: float, postboil_volume_l: float) -> float:
    """OG esperado pós-fervura: os pontos de gravidade se conservam, o volume cai."""
    if preboil_volume_l <= 0 or postboil_volume_l <= 0:
        raise ValueError("volumes devem ser maiores que zero")
    return 1 + (preboil_sg - 1) * preboil_volume_l / postboil_volume_l


def efficiency(gravity_sg: float, volume_l: float, grains: list[tuple[float, float]]) -> float:
    """Eficiência (%) = pontos extraídos / pontos potenciais.

    `grains` é uma lista de (peso_kg, potencial_ppg). Use gravidade e volume
    pré-fervura para a eficiência da mostura, e OG e volume no fermentador
    para a eficiência da cervejaria (brewhouse).
    """
    if volume_l <= 0:
        raise ValueError("volume_l deve ser maior que zero")
    potential = sum(kg * POUNDS_PER_KG * ppg for kg, ppg in grains)
    if potential <= 0:
        raise ValueError("a receita precisa de malte com potencial > 0")
    extracted = (gravity_sg - 1) * 1000 * volume_l / LITERS_PER_GALLON
    return extracted / potential * 100


@dataclass(frozen=True)
class WaterAdjustment:
    action: str  # "add_water" | "boil_off" | "none"
    liters: float
    final_volume_l: float


def water_adjustment(current_sg: float, target_sg: float, current_volume_l: float) -> WaterAdjustment:
    """Água a adicionar (OG alto) ou a evaporar (OG baixo) para atingir o OG alvo."""
    if current_volume_l <= 0:
        raise ValueError("current_volume_l deve ser maior que zero")
    if current_sg <= 1 or target_sg <= 1:
        raise ValueError("gravidades devem ser maiores que 1.000")
    final_volume = current_volume_l * (current_sg - 1) / (target_sg - 1)
    delta = final_volume - current_volume_l
    if abs(delta) < 1e-9:
        return WaterAdjustment("none", 0.0, current_volume_l)
    if delta > 0:
        return WaterAdjustment("add_water", delta, final_volume)
    return WaterAdjustment("boil_off", -delta, final_volume)
