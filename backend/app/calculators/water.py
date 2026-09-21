"""Sais e ácido ascórbico por perfil de água (doses base por 10 L)."""

import math
from dataclasses import dataclass
from enum import Enum


class WaterProfile(str, Enum):
    HOPPY = "hoppy"  # Lúpulo/Amargor
    MALTY = "malty"  # Maltosidade
    BALANCED = "balanced"  # Equilibrada


PROFILE_LABELS = {
    WaterProfile.HOPPY: "Lúpulo/Amargor",
    WaterProfile.MALTY: "Maltosidade",
    WaterProfile.BALANCED: "Equilibrada",
}

# gramas por 10 L: (CaSO4, MgSO4, CaCl)
BASE_SALTS_PER_10L = {
    WaterProfile.HOPPY: (3.7, 0.9, 0.8),
    WaterProfile.MALTY: (0.1, 0.9, 3.9),
    WaterProfile.BALANCED: (2.0, 0.8, 2.3),
}

ASCORBIC_DROPS_PER_10L = 5


@dataclass(frozen=True)
class Salts:
    caso4_g: float
    mgso4_g: float
    cacl_g: float


@dataclass(frozen=True)
class AscorbicAcid:
    min_drops: int
    max_drops: int

    @property
    def label(self) -> str:
        if self.min_drops == self.max_drops:
            return f"{self.min_drops} gotas"
        return f"{self.min_drops}-{self.max_drops} gotas"


def _check_volume(volume_l: float) -> None:
    if volume_l < 0:
        raise ValueError("volume_l não pode ser negativo")


def calculate_salts(volume_l: float, profile: WaterProfile) -> Salts:
    """Sais (g) escalados linearmente do valor base de 10 L para o volume informado."""
    _check_volume(volume_l)
    factor = volume_l / 10
    caso4, mgso4, cacl = (round(v * factor, 2) for v in BASE_SALTS_PER_10L[profile])
    return Salts(caso4, mgso4, cacl)


def calculate_acid(volume_l: float) -> AscorbicAcid:
    """Ácido ascórbico: 5 gotas/10 L, como faixa (piso a teto)."""
    _check_volume(volume_l)
    drops = round(volume_l / 10 * ASCORBIC_DROPS_PER_10L, 6)
    return AscorbicAcid(math.floor(drops), math.ceil(drops))
