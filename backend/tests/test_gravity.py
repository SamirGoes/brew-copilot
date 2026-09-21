import pytest

from app.calculators import gravity


def test_sg_to_plato():
    assert gravity.sg_to_plato(1.050) == pytest.approx(12.4, abs=0.05)


def test_plato_to_sg():
    assert gravity.plato_to_sg(12) == pytest.approx(1.048, abs=0.001)


def test_roundtrip():
    assert gravity.plato_to_sg(gravity.sg_to_plato(1.060)) == pytest.approx(1.060, abs=1e-4)


def test_deviation_matches_target():
    assert gravity.gravity_deviation(1.050, 1.049) == -0.001


def test_deviation_below_target():
    assert gravity.gravity_deviation(1.050, 1.040) == -0.010


def test_abv_and_attenuation():
    assert gravity.abv(1.052, 1.012) == pytest.approx(5.25)
    assert gravity.apparent_attenuation(1.052, 1.012) == pytest.approx(76.9, abs=0.05)


def test_post_boil_gravity_conserves_points():
    assert gravity.post_boil_gravity(1.038, 28, 22) == pytest.approx(1.0484, abs=1e-4)


def test_mash_efficiency():
    # 5 kg a 37 PPG, pré-fervura 1.040, 28 L
    assert gravity.efficiency(1.040, 28, [(5, 37)]) == pytest.approx(72.6, abs=0.1)


def test_brewhouse_efficiency():
    assert gravity.efficiency(1.052, 20, [(5, 37)]) == pytest.approx(67.4, abs=0.1)


def test_efficiency_requires_grain():
    with pytest.raises(ValueError):
        gravity.efficiency(1.040, 20, [])


def test_og_too_high_add_water():
    adj = gravity.water_adjustment(1.060, 1.052, 20)
    assert adj.action == "add_water"
    assert adj.liters == pytest.approx(3.08, abs=0.01)
    assert adj.final_volume_l == pytest.approx(23.08, abs=0.01)


def test_og_too_low_boil_off():
    adj = gravity.water_adjustment(1.045, 1.052, 22)
    assert adj.action == "boil_off"
    assert adj.liters == pytest.approx(2.96, abs=0.01)


def test_on_target_needs_nothing():
    assert gravity.water_adjustment(1.052, 1.052, 20).action == "none"
