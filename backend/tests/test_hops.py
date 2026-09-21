import pytest

from app.calculators import hops


def test_tinseth_single_addition():
    # Spec diz "aproximadamente 25 IBU / 25%"; Tinseth padrão dá 20,8 IBU / 23,1%.
    assert hops.utilization(60, 1.050) == pytest.approx(0.2307, abs=1e-3)
    assert hops.tinseth_ibu(30, 6, 60, 20, 1.050) == pytest.approx(20.76, abs=0.05)


def test_multiple_additions_sum_individual_contributions():
    total, parts = hops.total_ibu([(30, 6, 60), (20, 6, 15), (10, 6, 0)], 20, 1.050)
    assert len(parts) == 3
    assert total == pytest.approx(sum(p.ibu for p in parts))
    assert parts[2].ibu == 0  # flame-out não isomeriza na fórmula
    assert parts[0].ibu > parts[1].ibu


def test_rager_formula():
    assert hops.tinseth_ibu(30, 6, 60, 20, 1.050, "rager") == pytest.approx(27.74, abs=0.05)


def test_unknown_formula():
    with pytest.raises(ValueError):
        hops.utilization(60, 1.050, "foo")


def test_shorter_boil_needs_more_hops():
    new = hops.recalculate_hops(30, 60, 45, 1.050)
    assert new == pytest.approx(32.68, abs=0.05)


def test_longer_boil_needs_fewer_hops():
    new = hops.recalculate_hops(30, 60, 90, 1.050)
    assert new == pytest.approx(28.04, abs=0.05)


def test_recalculated_hops_keep_the_same_ibu():
    original = hops.tinseth_ibu(30, 6, 60, 20, 1.050)
    new_w = hops.recalculate_hops(30, 60, 45, 1.050)
    assert hops.tinseth_ibu(new_w, 6, 45, 20, 1.050) == pytest.approx(original)


def test_recalculate_rejects_zero_utilization():
    with pytest.raises(ValueError):
        hops.recalculate_hops(30, 60, 0, 1.050)


def test_hop_weight_for_target_ibu():
    w = hops.hop_weight_for_ibu(25, 6, 60, 20, 1.050)
    assert hops.tinseth_ibu(w, 6, 60, 20, 1.050) == pytest.approx(25)


def test_utilization_drops_with_gravity():
    assert hops.utilization(60, 1.080) < hops.utilization(60, 1.050)


def test_bu_gu_balanced():
    ratio, label = hops.bu_gu_ratio(35, 1.050)
    assert ratio == pytest.approx(0.70) and label == "balanced"


@pytest.mark.parametrize("ibu,label", [(15, "malty"), (60, "hoppy")])
def test_bu_gu_extremes(ibu, label):
    assert hops.bu_gu_ratio(ibu, 1.050)[1] == label


def test_alpha_acid_per_addition_is_used():
    cascade = hops.tinseth_ibu(30, 5.5, 60, 20, 1.050)
    magnum = hops.tinseth_ibu(30, 12, 60, 20, 1.050)
    assert magnum / cascade == pytest.approx(12 / 5.5)
