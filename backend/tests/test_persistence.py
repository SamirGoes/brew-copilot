"""Persistência em disco: os dados sobrevivem ao processo que os gravou.

Usa um SQLite em arquivo (não `:memory:`) e descarta o engine entre a escrita e a
leitura, simulando o restart do servidor.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401
from app.database import Base, get_db, make_engine
from app.main import app

RECIPE = {
    "name": "Vienna Lager",
    "style_number": "7A",
    "og": 1.049,
    "fg": 1.012,
    "mash_water_l": 13.5,
    "sparge_water_l": 17.0,
    "grains": [{"name": "Vienna", "weight_kg": 4.0}],
    "hops": [{"variety": "Saaz", "weight_g": 30, "alpha_acid_pct": 3.5, "boil_time_min": 60}],
}


def _client(db_path):
    """Cliente ligado a um engine novo sobre o mesmo arquivo — como um processo recém-iniciado."""
    engine = make_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    return TestClient(app), engine


def test_recipes_and_sessions_survive_a_restart(tmp_path):
    db_path = tmp_path / "brew.db"

    # --- processo 1: grava receita, sessão, leituras e avança de fase ---
    client, engine = _client(db_path)
    recipe_id = client.post("/api/recipes", json=RECIPE).json()["id"]
    session_id = client.post("/api/sessions", json={"recipe_id": recipe_id}).json()["id"]
    client.post(f"/api/sessions/{session_id}/reading", json={
        "parameter": "og_mash", "expected": 1.043, "actual": 1.040, "unit": "SG",
    })
    client.post(f"/api/sessions/{session_id}/phase")
    client.post(f"/api/sessions/{session_id}/reading", json={
        "parameter": "sparge_water_l", "expected": 17.0, "actual": 19.6, "unit": "L",
    })
    app.dependency_overrides.clear()
    engine.dispose()  # nada mais em memória

    # --- processo 2: engine novo sobre o mesmo arquivo ---
    client, engine = _client(db_path)
    try:
        recipe = client.get(f"/api/recipes/{recipe_id}").json()
        assert recipe["name"] == "Vienna Lager"
        assert recipe["og"] == 1.049
        assert [g["name"] for g in recipe["grains"]] == ["Vienna"]
        assert [h["variety"] for h in recipe["hops"]] == ["Saaz"]

        session = client.get(f"/api/sessions/{session_id}").json()
        assert session["recipe_name"] == "Vienna Lager"
        assert session["current_phase"] == "lauter"  # a fase avançada persistiu
        readings = {(r["phase"], r["parameter"]): r for r in session["readings"]}
        assert readings[("mash", "og_mash")]["actual"] == 1.040
        assert readings[("mash", "og_mash")]["expected"] == 1.043
        assert readings[("lauter", "sparge_water_l")]["actual"] == 19.6
        assert ("mash", "phase_completed") in readings  # marcação de fase concluída
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_deleting_a_recipe_keeps_the_session(tmp_path):
    """A sessão referencia a receita com ON DELETE SET NULL; o histórico não some junto."""
    db_path = tmp_path / "brew.db"
    client, engine = _client(db_path)
    try:
        recipe_id = client.post("/api/recipes", json=RECIPE).json()["id"]
        session_id = client.post("/api/sessions", json={"recipe_id": recipe_id}).json()["id"]
        client.post(f"/api/sessions/{session_id}/reading", json={"parameter": "og", "actual": 1.048})

        assert client.delete(f"/api/recipes/{recipe_id}").status_code == 204

        session = client.get(f"/api/sessions/{session_id}").json()
        assert session["recipe_id"] is None
        assert session["readings"][0]["actual"] == 1.048
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
