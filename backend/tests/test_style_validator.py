import pytest

from app.calculators import style_validator as sv
from app.calculators.style_validator import Severity


@pytest.fixture(scope="module")
def styles():
    return sv.load_styles()


@pytest.fixture(scope="module")
def ipa(styles):
    return sv.get_style("21A", styles)


def _one(style, **param):
    return next(iter(sv.validate_params(style, param).values()))


def test_loads_all_styles(styles):
    assert len(styles) == 116
    assert all("id" in s and "ranges" in s for s in styles)


def test_search_by_name_or_category(styles):
    found = sv.search_styles("IPA", styles)
    assert found and all("ipa" in (s["name"] + s["category"]).lower() for s in found)


def test_style_ranges(ipa):
    assert ipa["name"] == "American IPA"
    assert ipa["ranges"] == {
        "og": (1.056, 1.070), "fg": (1.008, 1.014), "ibu": (40, 70), "srm": (6, 14), "abv": (5.5, 7.5),
    }


def test_use_style_defaults_uses_midpoints(ipa):
    mid = sv.style_midpoints(ipa)
    assert mid["og"] == pytest.approx(1.063) and mid["ibu"] == 55


def test_within_range_is_green(ipa):
    r = _one(ipa, og=1.060)
    assert r.severity is Severity.WITHIN and r.message is None


def test_slightly_outside_is_orange(ipa):
    r = _one(ipa, ibu=75)
    assert r.severity is Severity.SLIGHT
    assert r.message == "+7% acima do máx. do estilo"


def test_gravity_deviation_is_measured_in_points(ipa):
    r = _one(ipa, og=1.090)  # 90 pts vs máx. 70 pts
    assert r.severity is Severity.SIGNIFICANT
    assert r.message == "+29% acima do máx. do estilo"


def test_actual_og_below_min_deviation(ipa):
    r = _one(ipa, og=1.048)
    assert round(r.deviation_pct) == -14
    assert r.message == "-14% abaixo do mín. do estilo"
    assert r.severity is Severity.SLIGHT


def test_fg_below_min(ipa):
    r = _one(ipa, fg=1.006)
    assert r.message == "-25% abaixo do mín. do estilo"
    assert r.deviation_abs == pytest.approx(-0.002)


def test_abv_above_max(ipa):
    r = _one(ipa, abv=8.0)
    assert r.message == "+7% acima do máx. do estilo"
    assert r.deviation_abs == pytest.approx(0.5)


@pytest.mark.parametrize(
    "pct,expected",
    [(0, Severity.WITHIN), (7, Severity.SLIGHT), (-15, Severity.SLIGHT), (15.1, Severity.SIGNIFICANT), (-29, Severity.SIGNIFICANT)],
)
def test_deviation_severity(pct, expected):
    assert sv.deviation_severity(pct) is expected


def test_conformity_summary(ipa):
    s = sv.conformity_summary(sv.validate_params(ipa, {"og": 1.060, "fg": 1.010, "ibu": 75, "srm": 10, "abv": 6.5}))
    assert s.text == "4/5 dentro do estilo, 1 levemente fora (IBU)"
    assert not s.compliant


def test_compliant_badge_when_all_within(ipa):
    s = sv.conformity_summary(sv.validate_params(ipa, sv.style_midpoints(ipa)))
    assert s.compliant and s.within == 5


def test_styles_without_ranges_are_not_validated(styles):
    fruit = sv.get_style("29A", styles)
    assert fruit["ranges"] == {}
    assert sv.validate_params(fruit, {"og": 1.050}) == {}
    assert not sv.conformity_summary({}).compliant


def test_ignores_missing_values(ipa):
    assert sv.validate_params(ipa, {"og": None, "ibu": 50}).keys() == {"ibu"}
