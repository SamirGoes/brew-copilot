import pytest

from app.calculators import mash


def test_strike_water_standard():
    assert mash.strike_water(5, 3) == 15


def test_strike_water_custom_ratio():
    assert mash.strike_water(4, 2.5) == 10


def test_mash_volume_includes_grain_displacement():
    assert mash.mash_volume(5, 15) == pytest.approx(15 + 5 * 0.67)


def test_mash_fits_in_kettle_with_margin():
    check = mash.check_kettle_fit(18, 25)
    assert check.fits and check.margin_l == 7 and check.warning is None


def test_mash_exceeds_kettle_capacity():
    check = mash.check_kettle_fit(28, 25)
    assert not check.fits
    assert check.overflow_l == 3
    assert "3.0 L" in check.warning and "malte" in check.warning


def test_sparge_water_batch_sparge():
    assert mash.sparge_water(25, 12) == 13


def test_sparge_water_adds_absorption_losses():
    assert mash.sparge_water(25, 12, absorption_loss_l=2) == 15


def test_no_sparge_returns_none():
    assert mash.sparge_water(25, 12, enabled=False) is None


def test_grain_absorption():
    assert mash.grain_absorption(5) == 5


@pytest.mark.parametrize("call", [lambda: mash.strike_water(0, 3), lambda: mash.strike_water(5, -1)])
def test_invalid_inputs_raise(call):
    with pytest.raises(ValueError):
        call()
