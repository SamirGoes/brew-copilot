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


# --- Sugestão para caber na panela --------------------------------------------

def test_suggest_moves_water_from_mash_to_sparge():
    s = mash.suggest_water_split(5, 18, 10, 20)
    assert s.action == "redistribute"
    assert s.mash_water_l == pytest.approx(16.6)
    assert s.sparge_water_l == pytest.approx(11.4)
    assert s.moved_l == pytest.approx(1.4)
    # água total mantida e a mostura sugerida cabe
    assert s.mash_water_l + s.sparge_water_l == pytest.approx(28)
    assert mash.mash_volume(5, s.mash_water_l) <= 20


def test_suggest_none_when_mash_fits():
    assert mash.suggest_water_split(5, 15, 10, 25) is None


def test_suggest_reduce_grain_when_mash_too_thick():
    # 8 kg em 20 L: caberiam 14,6 L (1,8 L/kg) < 2,5 L/kg
    s = mash.suggest_water_split(8, 24, 5, 20)
    assert s.action == "reduce_grain"
    assert s.mash_water_l is None
    assert s.max_grain_kg == pytest.approx(20 / 3.17)
    assert "Reduza o malte" in s.message


def test_suggest_enable_sparge_for_biab():
    s = mash.suggest_water_split(5, 28, None, 22, sparging=False)
    assert s.action == "enable_sparge"
    assert s.mash_water_l == pytest.approx(18.6)
    assert s.sparge_water_l == pytest.approx(9.4)
    assert s.message.startswith("Ative a lavagem")


def test_preboil_exceeds_kettle():
    check = mash.check_preboil_fit(24, 22)
    assert check.overflow_l == 2
    assert "2.0 L" in check.warning and "após a fervura" in check.warning


def test_preboil_fits():
    assert mash.check_preboil_fit(20, 22) is None


# --- Recálculo de água a partir do equipamento (forward, não reativo) --------

def test_recalculate_fits_the_example_from_the_milk_stout_recipe():
    r = mash.recalculate_water(4.8, batch_size_l=20, dead_space_l=0, boil_off_rate_l_h=1, boil_time_min=60, kettle_capacity_l=20)
    assert r.fits
    assert r.ratio_used == pytest.approx(3.0)
    assert r.mash_water_l == pytest.approx(14.4)
    assert r.sparge_water_l == pytest.approx(11.4)
    assert r.preboil_volume_l == pytest.approx(21.0)
    assert r.mash_volume_l < 20  # cabe, com margem
    # total bem menor que os 18 + 13,72 = 31,72 L que não cabiam
    assert r.mash_water_l + r.sparge_water_l < 31.72


def test_recalculate_clamps_ratio_down_to_fit():
    r = mash.recalculate_water(6, batch_size_l=20, dead_space_l=0, boil_off_rate_l_h=1, boil_time_min=60, kettle_capacity_l=20)
    assert r.fits
    assert r.ratio_used == pytest.approx(2.65)
    assert r.ratio_used >= mash.MIN_MASH_RATIO_L_PER_KG
    assert r.mash_volume_l <= 20


def test_recalculate_reduce_grain_when_even_floor_ratio_overflows():
    r = mash.recalculate_water(8, batch_size_l=20, dead_space_l=0, boil_off_rate_l_h=1, boil_time_min=60, kettle_capacity_l=20)
    assert not r.fits
    assert r.sparge_water_l is None
    assert "Reduza o malte" in r.warning
    assert r.max_grain_kg == pytest.approx(20 / 3.17)


def test_recalculate_biab_full_volume_method():
    r = mash.recalculate_water(4, batch_size_l=15, dead_space_l=0.5, boil_off_rate_l_h=3, boil_time_min=60, kettle_capacity_l=26, sparging=False)
    assert r.fits
    assert r.sparge_water_l is None
    assert r.preboil_volume_l == pytest.approx(18.5)
    assert r.mash_water_l == pytest.approx(18.5 + 4)  # pré-fervura + absorção


def test_recalculate_biab_overflow_suggests_sparge_or_less_grain():
    r = mash.recalculate_water(5, batch_size_l=20, dead_space_l=1, boil_off_rate_l_h=4, boil_time_min=60, kettle_capacity_l=25, sparging=False)
    assert not r.fits
    assert r.sparge_water_l is None
    assert "Ative a lavagem" in r.warning


def test_recalculate_rejects_negative_equipment_values():
    with pytest.raises(ValueError):
        mash.recalculate_water(5, batch_size_l=20, dead_space_l=-1, boil_off_rate_l_h=4, boil_time_min=60, kettle_capacity_l=25)
