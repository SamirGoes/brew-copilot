from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.calculators import style_validator as sv

router = APIRouter(prefix="/api", tags=["styles"])

DETAIL_FIELDS = (
    "overallimpression", "aroma", "appearance", "flavor", "mouthfeel", "comments", "history",
    "characteristicingredients", "stylecomparison", "commercialexamples", "tags",
)


class Range(BaseModel):
    min: float
    max: float


class StyleSummary(BaseModel):
    id: str
    name: str
    category: str
    ranges: dict[str, Range]


class StyleDetail(StyleSummary):
    details: dict[str, str]
    midpoints: dict[str, float]


class ValidateRequest(BaseModel):
    style_id: str
    og: float | None = None
    fg: float | None = None
    ibu: float | None = None
    srm: float | None = None
    abv: float | None = None


class ParamResultOut(BaseModel):
    parameter: str
    value: float
    range_min: float
    range_max: float
    severity: sv.Severity
    deviation_pct: float
    deviation_abs: float
    message: str | None


class SummaryOut(BaseModel):
    total: int
    within: int
    slight: list[str]
    significant: list[str]
    compliant: bool
    text: str


class ValidateResponse(BaseModel):
    style_id: str
    style_name: str
    results: dict[str, ParamResultOut]
    summary: SummaryOut


def _summary(s: dict) -> StyleSummary:
    return StyleSummary(
        id=s["id"], name=s["name"], category=s["category"],
        ranges={p: Range(min=lo, max=hi) for p, (lo, hi) in s["ranges"].items()},
    )


def _get_or_404(style_id: str) -> dict:
    style = sv.get_style(style_id)
    if style is None:
        raise HTTPException(status_code=404, detail=f"estilo {style_id} não encontrado")
    return style


@router.get("/styles", response_model=list[StyleSummary])
def list_styles(q: str = "") -> list[StyleSummary]:
    return [_summary(s) for s in sv.search_styles(q)]


@router.get("/styles/{style_id}", response_model=StyleDetail)
def get_style(style_id: str) -> StyleDetail:
    s = _get_or_404(style_id)
    return StyleDetail(
        **_summary(s).model_dump(),
        details={f: s[f] for f in DETAIL_FIELDS if s.get(f)},
        midpoints=sv.style_midpoints(s),
    )


@router.post("/validate/style", response_model=ValidateResponse)
def validate_style(req: ValidateRequest) -> ValidateResponse:
    s = _get_or_404(req.style_id)
    results = sv.validate_params(s, req.model_dump(exclude={"style_id"}))
    summary = sv.conformity_summary(results)
    return ValidateResponse(
        style_id=s["id"],
        style_name=s["name"],
        results={p: ParamResultOut(**vars(r)) for p, r in results.items()},
        summary=SummaryOut(**vars(summary)),
    )
