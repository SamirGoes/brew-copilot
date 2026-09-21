RECIPE = {
    "name": "Session IPA",
    "style_number": "21A",
    "og": 1.052,
    "fg": 1.012,
    "grains": [{"name": "Pilsen", "weight_kg": 5}, {"name": "Crystal", "weight_kg": 0.3, "potential_ppg": 34}],
    "hops": [{"variety": "Magnum", "weight_g": 30, "alpha_acid_pct": 12, "boil_time_min": 60}],
}


def test_recipe_crud(client):
    created = client.post("/api/recipes", json=RECIPE)
    assert created.status_code == 201
    rid = created.json()["id"]
    assert len(created.json()["grains"]) == 2

    assert client.get(f"/api/recipes/{rid}").json()["name"] == "Session IPA"
    assert len(client.get("/api/recipes").json()) == 1

    updated = client.put(f"/api/recipes/{rid}", json={**RECIPE, "name": "Session IPA v2", "grains": [RECIPE["grains"][0]]})
    assert updated.json()["name"] == "Session IPA v2"
    assert len(updated.json()["grains"]) == 1

    assert client.delete(f"/api/recipes/{rid}").status_code == 204
    assert client.get(f"/api/recipes/{rid}").status_code == 404


def test_recipe_validation(client):
    assert client.post("/api/recipes", json={"name": ""}).status_code == 422


def test_session_lifecycle(client):
    rid = client.post("/api/recipes", json=RECIPE).json()["id"]
    s = client.post("/api/sessions", json={"recipe_id": rid}).json()
    assert s["name"] == "Session IPA" and s["recipe_name"] == "Session IPA"
    assert s["current_phase"] == "mash"
    sid = s["id"]

    reading = client.post(f"/api/sessions/{sid}/reading", json={
        "parameter": "og", "expected": 1.052, "actual": 1.048, "unit": "SG",
    }).json()
    assert reading["phase"] == "mash"
    assert round(reading["deviation"], 3) == -0.004

    s = client.post(f"/api/sessions/{sid}/phase").json()
    assert s["current_phase"] == "lauter"
    assert any(r["parameter"] == "phase_completed" and r["phase"] == "mash" for r in s["readings"])

    for _ in range(6):
        s = client.post(f"/api/sessions/{sid}/phase").json()
    assert s["current_phase"] == "carbonation" and s["completed_at"] is not None
    assert client.post(f"/api/sessions/{sid}/phase").status_code == 409

    listed = client.get("/api/sessions").json()
    assert listed[0]["id"] == sid and listed[0]["recipe_name"] == "Session IPA"

    assert client.patch(f"/api/sessions/{sid}", json={"notes": "ok"}).json()["notes"] == "ok"
    assert client.delete(f"/api/sessions/{sid}").status_code == 204
    assert client.get(f"/api/sessions/{sid}").status_code == 404


def test_session_requires_name_or_recipe(client):
    assert client.post("/api/sessions", json={}).status_code == 422
    assert client.post("/api/sessions", json={"recipe_id": 999}).status_code == 422
    assert client.post("/api/sessions", json={"name": "Avulsa"}).status_code == 201


def test_deleting_recipe_keeps_session(client):
    rid = client.post("/api/recipes", json=RECIPE).json()["id"]
    sid = client.post("/api/sessions", json={"recipe_id": rid}).json()["id"]
    client.delete(f"/api/recipes/{rid}")
    s = client.get(f"/api/sessions/{sid}").json()
    assert s["recipe_id"] is None and s["name"] == "Session IPA"
