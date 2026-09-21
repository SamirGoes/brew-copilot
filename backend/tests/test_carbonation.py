import pytest

from app.calculators import carbonation


def test_residual_co2_falls_with_temperature():
    assert carbonation.residual_co2(25) < carbonation.residual_co2(5)


def test_priming_sugar_20l_at_2_4_volumes():
    dextrose = carbonation.priming_sugar(20, 2.4, 20, "dextrose")
    table = carbonation.priming_sugar(20, 2.4, 20, "table")
    assert dextrose == pytest.approx(137, abs=2)
    assert table == pytest.approx(118, abs=2)
    assert table < dextrose  # sacarose rende mais CO2 por grama


def test_priming_scales_with_volume_and_target():
    base = carbonation.priming_sugar(20, 2.4, 20)
    assert carbonation.priming_sugar(40, 2.4, 20) == pytest.approx(2 * base)
    assert carbonation.priming_sugar(20, 2.8, 20) > base


def test_no_sugar_when_already_carbonated():
    assert carbonation.priming_sugar(20, 0.5, 20) == 0


def test_force_carb_psi():
    assert carbonation.force_carb_psi(2.4, 4) == pytest.approx(10.8, abs=0.2)


def test_force_carb_needs_more_pressure_when_warmer():
    assert carbonation.force_carb_psi(2.4, 10) > carbonation.force_carb_psi(2.4, 4)


def test_invalid_inputs():
    with pytest.raises(ValueError):
        carbonation.priming_sugar(0, 2.4, 20)
    with pytest.raises(ValueError):
        carbonation.priming_sugar(20, 2.4, 20, "honey")
