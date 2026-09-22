from collections.abc import Iterator
from contextlib import contextmanager

from fastapi import APIRouter, HTTPException

from app.calculators import carbonation, gravity, hops, mash, water
from app.schemas.calculate import (
    AcidResponse,
    Adjustment,
    Attenuation,
    CarbonationRequest,
    CarbonationResponse,
    Comparison,
    Conversion,
    GravityRequest,
    GravityResponse,
    HopResult,
    HopsRequest,
    HopsResponse,
    KettleCheckResponse,
    MashRequest,
    MashResponse,
    PreboilCheckResponse,
    SaltsResponse,
    WaterDose,
    WaterProfileRow,
    WaterRecalculationResponse,
    WaterRequest,
    WaterResponse,
    WaterSplitResponse,
)

router = APIRouter(prefix="/api/calculate", tags=["calculate"])

# Desvio de gravidade até este valor (em SG) conta como "no alvo".
GRAVITY_TOLERANCE = 0.002


@contextmanager
def _calc_errors() -> Iterator[None]:
    """Erros de domínio das calculadoras viram 422."""
    try:
        yield
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/mash", response_model=MashResponse)
def calculate_mash(req: MashRequest) -> MashResponse:
    with _calc_errors():
        strike = mash.strike_water(req.grain_kg, req.water_to_grain_ratio)
        volume = mash.mash_volume(req.grain_kg, strike)
        absorption = mash.grain_absorption(req.grain_kg)
        kettle = suggestion = preboil = None
        if req.kettle_capacity_l is not None:
            k = mash.check_kettle_fit(volume, req.kettle_capacity_l)
            kettle = KettleCheckResponse(
                fits=k.fits, capacity_l=k.capacity_l, margin_l=k.margin_l,
                overflow_l=k.overflow_l, warning=k.warning,
            )
        # O malte retém parte da água de mostura; o restante é o primeiro mosto.
        first_runnings = max(strike - absorption, 0.0)
        sparge = None
        if req.preboil_volume_l is not None:
            sparge = mash.sparge_water(req.preboil_volume_l, first_runnings, enabled=req.sparging)
        if req.kettle_capacity_l is not None:
            planned_sparge = req.sparge_water_l if req.sparge_water_l is not None else sparge
            s = mash.suggest_water_split(
                req.grain_kg, strike, planned_sparge, req.kettle_capacity_l, sparging=req.sparging
            )
            if s is not None:
                suggestion = WaterSplitResponse(**vars(s))
            if req.preboil_volume_l is not None:
                p = mash.check_preboil_fit(req.preboil_volume_l, req.kettle_capacity_l)
                if p is not None:
                    preboil = PreboilCheckResponse(**vars(p))
        recalculation = None
        if req.recalculate is not None and req.kettle_capacity_l is not None:
            rc = req.recalculate
            r = mash.recalculate_water(
                req.grain_kg, rc.batch_size_l, rc.dead_space_l, rc.boil_off_rate_l_h,
                rc.boil_time_min, req.kettle_capacity_l, ratio=rc.ratio, sparging=req.sparging,
            )
            recalculation = WaterRecalculationResponse(**vars(r))
    return MashResponse(
        strike_water_l=strike,
        mash_volume_l=volume,
        grain_absorption_l=absorption,
        first_runnings_l=first_runnings,
        kettle=kettle,
        sparge_water_l=sparge,
        suggestion=suggestion,
        preboil=preboil,
        recalculation=recalculation,
    )


@router.post("/gravity", response_model=GravityResponse)
def calculate_gravity(req: GravityRequest) -> GravityResponse:
    res = GravityResponse()
    with _calc_errors():
        if req.sg is not None:
            res.conversion = Conversion(sg=req.sg, plato=gravity.sg_to_plato(req.sg))
        elif req.plato is not None:
            res.conversion = Conversion(sg=gravity.plato_to_sg(req.plato), plato=req.plato)

        if req.expected_sg is not None and req.actual_sg is not None:
            dev = gravity.gravity_deviation(req.expected_sg, req.actual_sg)
            status = "on_target" if abs(dev) <= GRAVITY_TOLERANCE else ("below" if dev < 0 else "above")
            res.comparison = Comparison(deviation=dev, status=status)

        if req.og is not None and req.fg is not None:
            res.attenuation = Attenuation(
                abv_pct=gravity.abv(req.og, req.fg),
                apparent_attenuation_pct=gravity.apparent_attenuation(req.og, req.fg),
            )

        if req.preboil_sg and req.preboil_volume_l and req.postboil_volume_l:
            res.expected_postboil_sg = gravity.post_boil_gravity(
                req.preboil_sg, req.preboil_volume_l, req.postboil_volume_l
            )

        current_sg = req.actual_sg or req.og
        if current_sg and req.target_og and req.current_volume_l:
            a = gravity.water_adjustment(current_sg, req.target_og, req.current_volume_l)
            res.adjustment = Adjustment(action=a.action, liters=a.liters, final_volume_l=a.final_volume_l)

        if req.grains:
            grains = [(g.weight_kg, g.potential_ppg) for g in req.grains]
            if req.preboil_sg and req.preboil_volume_l:
                res.mash_efficiency_pct = gravity.efficiency(req.preboil_sg, req.preboil_volume_l, grains)
            if req.og and req.fermenter_volume_l:
                res.brewhouse_efficiency_pct = gravity.efficiency(req.og, req.fermenter_volume_l, grains)
    return res


@router.post("/hops", response_model=HopsResponse)
def calculate_hops(req: HopsRequest) -> HopsResponse:
    with _calc_errors():
        total, parts = hops.total_ibu(
            [(h.weight_g, h.alpha_acid_pct, h.boil_time_min) for h in req.additions],
            req.volume_l, req.og, req.formula,
        )
        results = []
        for h, p in zip(req.additions, parts, strict=True):
            adjusted = None
            if h.new_boil_time_min is not None:
                adjusted = hops.recalculate_hops(
                    h.weight_g, h.boil_time_min, h.new_boil_time_min, req.og, req.formula
                )
            results.append(HopResult(
                variety=h.variety, weight_g=h.weight_g, alpha_acid_pct=h.alpha_acid_pct,
                boil_time_min=h.boil_time_min, utilization_pct=p.utilization * 100,
                ibu=p.ibu, adjusted_weight_g=adjusted,
            ))
        ratio, balance = hops.bu_gu_ratio(total, req.og)
    return HopsResponse(formula=req.formula, total_ibu=total, additions=results, bu_gu=ratio, balance=balance)


def _water_dose(volume_l: float, profile: water.WaterProfile) -> WaterDose:
    s = water.calculate_salts(volume_l, profile)
    a = water.calculate_acid(volume_l)
    return WaterDose(
        volume_l=volume_l,
        salts=SaltsResponse(caso4_g=s.caso4_g, mgso4_g=s.mgso4_g, cacl_g=s.cacl_g),
        ascorbic_acid=AcidResponse(min_drops=a.min_drops, max_drops=a.max_drops, label=a.label),
    )


@router.post("/water", response_model=WaterResponse)
def calculate_water(req: WaterRequest) -> WaterResponse:
    with _calc_errors():
        return WaterResponse(
            profile=req.profile,
            mash=_water_dose(req.mash_volume_l, req.profile),
            sparge=_water_dose(req.sparge_volume_l, req.profile) if req.sparge_volume_l is not None else None,
        )


@router.get("/water/profiles", response_model=list[WaterProfileRow])
def water_profiles() -> list[WaterProfileRow]:
    """Tabela de referência: sais por 10 L em cada perfil."""
    return [
        WaterProfileRow(profile=p, label=water.PROFILE_LABELS[p], caso4_g=c, mgso4_g=m, cacl_g=cl)
        for p, (c, m, cl) in water.BASE_SALTS_PER_10L.items()
    ]


@router.post("/carbonation", response_model=CarbonationResponse)
def calculate_carbonation(req: CarbonationRequest) -> CarbonationResponse:
    res = CarbonationResponse()
    with _calc_errors():
        if req.volume_l is not None and req.beer_temp_c is not None:
            res.table_sugar_g = carbonation.priming_sugar(req.volume_l, req.target_vols, req.beer_temp_c, "table")
            res.dextrose_g = carbonation.priming_sugar(req.volume_l, req.target_vols, req.beer_temp_c, "dextrose")
        if req.fridge_temp_c is not None:
            res.force_carb_psi = carbonation.force_carb_psi(req.target_vols, req.fridge_temp_c)
    return res
