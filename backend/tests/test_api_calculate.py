import pytest


def test_mash(client):
    r = client.post("/api/calculate/mash", json={
        "grain_kg": 5, "water_to_grain_ratio": 3, "kettle_capacity_l": 25, "preboil_volume_l": 25,
    })
    assert r.status_code == 200
    body = r.json()
    assert body["strike_water_l"] == 15
    assert body["mash_volume_l"] == pytest.approx(18.35)
    assert body["grain_absorption_l"] == 5
    assert body["first_runnings_l"] == 10
    assert body["sparge_water_l"] == 15
    assert body["kettle"]["fits"] is True


def test_mash_overflow_and_no_sparge(client):
    r = client.post("/api/calculate/mash", json={
        "grain_kg": 8, "water_to_grain_ratio": 3, "kettle_capacity_l": 25, "sparging": False, "preboil_volume_l": 25,
    })
    body = r.json()
    assert body["kettle"]["fits"] is False and body["kettle"]["warning"]
    assert body["sparge_water_l"] is None


def test_mash_rejects_invalid_input(client):
    assert client.post("/api/calculate/mash", json={"grain_kg": 0}).status_code == 422


def test_gravity_blocks(client):
    r = client.post("/api/calculate/gravity", json={
        "sg": 1.050, "expected_sg": 1.050, "actual_sg": 1.040, "og": 1.052, "fg": 1.012,
        "preboil_sg": 1.040, "preboil_volume_l": 28, "postboil_volume_l": 22,
        "grains": [{"weight_kg": 5, "potential_ppg": 37}], "fermenter_volume_l": 20,
    })
    body = r.json()
    assert body["conversion"]["plato"] == pytest.approx(12.4, abs=0.05)
    assert body["comparison"] == {"deviation": -0.01, "status": "below"}
    assert body["attenuation"]["abv_pct"] == pytest.approx(5.25)
    assert body["expected_postboil_sg"] == pytest.approx(1.0509, abs=1e-4)
    assert body["mash_efficiency_pct"] == pytest.approx(72.6, abs=0.1)
    assert body["brewhouse_efficiency_pct"] == pytest.approx(67.4, abs=0.1)


def test_gravity_on_target(client):
    body = client.post("/api/calculate/gravity", json={"expected_sg": 1.050, "actual_sg": 1.049}).json()
    assert body["comparison"]["status"] == "on_target"


def test_gravity_water_adjustment(client):
    body = client.post("/api/calculate/gravity", json={
        "actual_sg": 1.060, "target_og": 1.052, "current_volume_l": 20,
    }).json()
    assert body["adjustment"]["action"] == "add_water"
    assert body["adjustment"]["liters"] == pytest.approx(3.08, abs=0.01)


def test_gravity_plato_input(client):
    body = client.post("/api/calculate/gravity", json={"plato": 12}).json()
    assert body["conversion"]["sg"] == pytest.approx(1.048, abs=0.001)


def test_hops(client):
    r = client.post("/api/calculate/hops", json={
        "volume_l": 20, "og": 1.050,
        "additions": [
            {"variety": "Cascade", "weight_g": 30, "alpha_acid_pct": 6, "boil_time_min": 60, "new_boil_time_min": 45},
            {"variety": "Cascade", "weight_g": 20, "alpha_acid_pct": 6, "boil_time_min": 15},
            {"variety": "Cascade", "weight_g": 10, "alpha_acid_pct": 6, "boil_time_min": 0},
        ],
    })
    body = r.json()
    first = body["additions"][0]
    assert first["ibu"] == pytest.approx(20.76, abs=0.05)
    assert first["utilization_pct"] == pytest.approx(23.07, abs=0.05)
    assert first["adjusted_weight_g"] == pytest.approx(32.68, abs=0.05)
    assert body["total_ibu"] == pytest.approx(sum(a["ibu"] for a in body["additions"]))
    assert body["balance"] in {"malty", "balanced", "hoppy"}


def test_hops_rager(client):
    body = client.post("/api/calculate/hops", json={
        "volume_l": 20, "og": 1.050, "formula": "rager",
        "additions": [{"weight_g": 30, "alpha_acid_pct": 6, "boil_time_min": 60}],
    }).json()
    assert body["formula"] == "rager" and body["total_ibu"] == pytest.approx(27.74, abs=0.05)


def test_hops_zero_boil_time_recalc_is_422(client):
    r = client.post("/api/calculate/hops", json={
        "volume_l": 20, "og": 1.050,
        "additions": [{"weight_g": 30, "alpha_acid_pct": 6, "boil_time_min": 60, "new_boil_time_min": 0}],
    })
    assert r.status_code == 422


def test_water(client):
    body = client.post("/api/calculate/water", json={
        "profile": "malty", "mash_volume_l": 13, "sparge_volume_l": 17,
    }).json()
    assert body["mash"]["salts"] == {"caso4_g": 0.13, "mgso4_g": 1.17, "cacl_g": 5.07}
    assert body["sparge"]["salts"] == {"caso4_g": 0.17, "mgso4_g": 1.53, "cacl_g": 6.63}
    assert body["mash"]["ascorbic_acid"]["label"] == "6-7 gotas"
    assert body["sparge"]["ascorbic_acid"]["label"] == "8-9 gotas"


def test_water_profiles_reference_table(client):
    rows = client.get("/api/calculate/water/profiles").json()
    assert {r["profile"] for r in rows} == {"hoppy", "malty", "balanced"}


def test_carbonation(client):
    body = client.post("/api/calculate/carbonation", json={
        "target_vols": 2.4, "volume_l": 20, "beer_temp_c": 20, "fridge_temp_c": 4,
    }).json()
    assert body["table_sugar_g"] == pytest.approx(118, abs=2)
    assert body["force_carb_psi"] == pytest.approx(10.8, abs=0.2)


def test_carbonation_requires_a_method(client):
    assert client.post("/api/calculate/carbonation", json={"target_vols": 2.4}).status_code == 422


def test_mash_kettle_suggestion(client):
    r = client.post("/api/calculate/mash", json={
        "grain_kg": 5, "water_to_grain_ratio": 3.6, "kettle_capacity_l": 20, "sparge_water_l": 10,
    })
    s = r.json()["suggestion"]
    assert s["action"] == "redistribute"
    assert s["mash_water_l"] == pytest.approx(16.6)
    assert s["sparge_water_l"] == pytest.approx(11.4)


def test_mash_preboil_overflow(client):
    body = client.post("/api/calculate/mash", json={
        "grain_kg": 5, "kettle_capacity_l": 22, "preboil_volume_l": 24,
    }).json()
    assert body["suggestion"] is None
    assert body["preboil"]["overflow_l"] == pytest.approx(2)


def test_mash_recalculate_water_via_api(client):
    body = client.post("/api/calculate/mash", json={
        "grain_kg": 4.8, "kettle_capacity_l": 20, "sparging": True,
        "recalculate": {"batch_size_l": 20, "dead_space_l": 0, "boil_off_rate_l_h": 1, "boil_time_min": 60, "ratio": 3.0},
    }).json()
    r = body["recalculation"]
    assert r["fits"] is True
    assert r["mash_water_l"] == pytest.approx(14.4)
    assert r["sparge_water_l"] == pytest.approx(11.4)
    assert r["preboil_volume_l"] == pytest.approx(21.0)


def test_mash_without_recalculate_field_stays_backward_compatible(client):
    body = client.post("/api/calculate/mash", json={"grain_kg": 5, "water_to_grain_ratio": 3.6}).json()
    assert body["recalculation"] is None
