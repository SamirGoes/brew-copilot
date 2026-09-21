"""Biblioteca BJCP e validação de conformidade de parâmetros contra um estilo."""

import json
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
from pathlib import Path

from app.config import settings

# Parâmetros validados: chave -> (sufixo no JSON, é gravidade?)
PARAMETERS = ("og", "fg", "ibu", "srm", "abv")
GRAVITY_PARAMS = {"og", "fg"}
SLIGHT_THRESHOLD_PCT = 15.0


class Severity(str, Enum):
    WITHIN = "within"  # verde
    SLIGHT = "slight"  # laranja: até 15% fora
    SIGNIFICANT = "significant"  # vermelho: mais de 15% fora


@dataclass(frozen=True)
class ParamResult:
    parameter: str
    value: float
    range_min: float
    range_max: float
    severity: Severity
    deviation_pct: float  # 0 dentro; positivo acima do máx; negativo abaixo do mín
    deviation_abs: float
    message: str | None


def _parse_style(raw: dict) -> dict:
    style = dict(raw)
    style["id"] = raw["number"]
    # Categorias abertas (frutas, especiarias, madeira...) não têm faixas no BJCP.
    style["ranges"] = {
        p: (float(raw[f"{p}min"]), float(raw[f"{p}max"]))
        for p in PARAMETERS
        if raw.get(f"{p}min") and raw.get(f"{p}max")
    }
    return style


@lru_cache(maxsize=4)
def _load(path: str) -> tuple[dict, ...]:
    with open(path, encoding="utf-8") as f:
        return tuple(_parse_style(s) for s in json.load(f))


def load_styles(path: Path | str | None = None) -> list[dict]:
    """Carrega os estilos BJCP; cada um ganha `id` (número, ex.: 21A) e `ranges`."""
    return list(_load(str(path or settings.styles_path)))


def get_style(style_id: str, styles: list[dict] | None = None) -> dict | None:
    for s in styles if styles is not None else load_styles():
        if s["id"].lower() == style_id.lower():
            return s
    return None


def search_styles(query: str, styles: list[dict] | None = None) -> list[dict]:
    q = query.strip().lower()
    pool = styles if styles is not None else load_styles()
    if not q:
        return pool
    return [s for s in pool if q in s["name"].lower() or q in s["category"].lower()]


def style_midpoints(style: dict) -> dict[str, float]:
    """Alvos preenchidos a partir do estilo: ponto médio de cada faixa."""
    return {p: (lo + hi) / 2 for p, (lo, hi) in style["ranges"].items()}


def deviation_severity(deviation_pct: float) -> Severity:
    magnitude = abs(deviation_pct)
    if magnitude == 0:
        return Severity.WITHIN
    if magnitude <= SLIGHT_THRESHOLD_PCT:
        return Severity.SLIGHT
    return Severity.SIGNIFICANT


def _deviation(parameter: str, value: float, lo: float, hi: float) -> float:
    """% fora da faixa; OG/FG são medidos em pontos de gravidade ((SG-1)*1000)."""
    if parameter in GRAVITY_PARAMS:
        value, lo, hi = (value - 1) * 1000, (lo - 1) * 1000, (hi - 1) * 1000
    if value < lo:
        return -(lo - value) / lo * 100
    if value > hi:
        return (value - hi) / hi * 100
    return 0.0


def validate_params(style: dict, params: dict[str, float | None]) -> dict[str, ParamResult]:
    """Valida cada parâmetro informado (og, fg, ibu, srm, abv) contra o estilo."""
    results: dict[str, ParamResult] = {}
    for parameter, value in params.items():
        if value is None or parameter not in style["ranges"]:
            continue
        lo, hi = style["ranges"][parameter]
        pct = _deviation(parameter, value, lo, hi)
        if pct == 0:
            message, abs_dev = None, 0.0
        elif pct < 0:
            message, abs_dev = f"{pct:.0f}% abaixo do mín. do estilo", value - lo
        else:
            message, abs_dev = f"+{pct:.0f}% acima do máx. do estilo", value - hi
        results[parameter] = ParamResult(
            parameter, value, lo, hi, deviation_severity(pct), pct, abs_dev, message
        )
    return results


@dataclass(frozen=True)
class ConformitySummary:
    total: int
    within: int
    slight: list[str]
    significant: list[str]
    compliant: bool  # todos dentro -> selo "BJCP Compliant"
    text: str


def conformity_summary(results: dict[str, ParamResult]) -> ConformitySummary:
    total = len(results)
    within = [p for p, r in results.items() if r.severity is Severity.WITHIN]
    slight = [p for p, r in results.items() if r.severity is Severity.SLIGHT]
    significant = [p for p, r in results.items() if r.severity is Severity.SIGNIFICANT]
    parts = [f"{len(within)}/{total} dentro do estilo"]
    if slight:
        parts.append(f"{len(slight)} levemente fora ({', '.join(p.upper() for p in slight)})")
    if significant:
        parts.append(f"{len(significant)} muito fora ({', '.join(p.upper() for p in significant)})")
    return ConformitySummary(
        total, len(within), slight, significant, total > 0 and len(within) == total, ", ".join(parts)
    )
