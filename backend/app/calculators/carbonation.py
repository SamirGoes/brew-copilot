"""Carbonatação: açúcar de priming e pressão para carbonatação forçada."""

from typing import Literal

Sugar = Literal["table", "dextrose"]

# g de açúcar por litro para cada volume de CO2 (estequiometria da fermentação).
# 1 volume de CO2 = 1,977 g/L. Sacarose rende 0,514 g CO2/g; dextrose monohidratada, 0,444 g CO2/g.
SUGAR_G_PER_L_PER_VOL: dict[str, float] = {
    "table": 3.84,
    "dextrose": 4.45,
}


def c_to_f(temp_c: float) -> float:
    return temp_c * 9 / 5 + 32


def residual_co2(temp_c: float) -> float:
    """Volumes de CO2 já dissolvidos na cerveja à temperatura de fermentação."""
    t = c_to_f(temp_c)
    return 3.0378 - 0.050062 * t + 0.00026555 * t**2


def priming_sugar(
    volume_l: float, target_vols: float, temp_c: float, sugar: Sugar = "dextrose"
) -> float:
    """Gramas de açúcar para atingir os volumes de CO2 alvo na garrafa."""
    if volume_l <= 0 or target_vols <= 0:
        raise ValueError("volume_l e target_vols devem ser maiores que zero")
    if sugar not in SUGAR_G_PER_L_PER_VOL:
        raise ValueError(f"açúcar desconhecido: {sugar}")
    needed = max(target_vols - residual_co2(temp_c), 0.0)
    return needed * volume_l * SUGAR_G_PER_L_PER_VOL[sugar]


def force_carb_psi(target_vols: float, temp_c: float) -> float:
    """Pressão (PSI manométrico) para carbonatação forçada na temperatura da geladeira."""
    if target_vols <= 0:
        raise ValueError("target_vols deve ser maior que zero")
    t = c_to_f(temp_c)
    v = target_vols
    psi = (
        -16.6999
        - 0.0101059 * t
        + 0.00116512 * t**2
        + 0.173354 * t * v
        + 4.24267 * v
        - 0.0684226 * v**2
    )
    return max(psi, 0.0)
