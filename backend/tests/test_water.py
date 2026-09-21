import pytest

from app.calculators.water import WaterProfile, calculate_acid, calculate_salts


@pytest.mark.parametrize(
    "profile,expected",
    [
        (WaterProfile.HOPPY, (3.7, 0.9, 0.8)),
        (WaterProfile.MALTY, (0.1, 0.9, 3.9)),
        (WaterProfile.BALANCED, (2.0, 0.8, 2.3)),
    ],
)
def test_base_ratios_at_10l(profile, expected):
    s = calculate_salts(10, profile)
    assert (s.caso4_g, s.mgso4_g, s.cacl_g) == expected


def test_salts_for_mash_water():
    s = calculate_salts(13, WaterProfile.MALTY)
    assert (s.caso4_g, s.mgso4_g, s.cacl_g) == (0.13, 1.17, 5.07)


def test_salts_for_sparge_water():
    s = calculate_salts(17, WaterProfile.MALTY)
    assert (s.caso4_g, s.mgso4_g, s.cacl_g) == (0.17, 1.53, 6.63)


def test_recalculates_on_volume_and_profile_change():
    assert calculate_salts(15, WaterProfile.MALTY) != calculate_salts(13, WaterProfile.MALTY)
    assert calculate_salts(13, WaterProfile.HOPPY) != calculate_salts(13, WaterProfile.MALTY)


def test_ascorbic_acid_mash():
    assert calculate_acid(13).label == "6-7 gotas"


def test_ascorbic_acid_sparge():
    assert calculate_acid(17).label == "8-9 gotas"


def test_ascorbic_acid_exact_number():
    assert calculate_acid(10).label == "5 gotas"


def test_negative_volume_rejected():
    with pytest.raises(ValueError):
        calculate_salts(-1, WaterProfile.MALTY)
