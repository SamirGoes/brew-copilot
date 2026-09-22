from sqlalchemy import inspect, text
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.database import Base, add_missing_columns, make_engine


def _old_recipes_table(engine):
    """Simula um banco criado antes das colunas preboil_volume_l/water_profile existirem."""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE recipes (
                    id INTEGER PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    style_number VARCHAR(10),
                    created_at DATETIME,
                    updated_at DATETIME,
                    batch_size_l FLOAT,
                    mash_water_l FLOAT,
                    sparge_water_l FLOAT,
                    sparging BOOLEAN,
                    kettle_capacity_l FLOAT,
                    boil_off_rate_l_h FLOAT,
                    dead_space_l FLOAT,
                    boil_time_min INTEGER,
                    og_mash FLOAT,
                    og_preboil FLOAT,
                    og FLOAT,
                    fg FLOAT,
                    ibu FLOAT,
                    srm FLOAT,
                    abv FLOAT
                )
                """
            )
        )
        conn.execute(text("INSERT INTO recipes (id, name, batch_size_l) VALUES (1, 'Milk Stout', 20.0)"))


def test_add_missing_columns_preserves_existing_data():
    engine = make_engine("sqlite://", poolclass=StaticPool)
    _old_recipes_table(engine)

    added = add_missing_columns(engine)

    assert "recipes.preboil_volume_l" in added
    assert "recipes.water_profile" in added
    cols = {c["name"] for c in inspect(engine).get_columns("recipes")}
    assert {"preboil_volume_l", "water_profile"} <= cols
    with engine.connect() as conn:
        row = conn.execute(text("SELECT name, preboil_volume_l, water_profile FROM recipes WHERE id = 1")).one()
    assert row == ("Milk Stout", None, None)


def test_add_missing_columns_creates_new_tables_via_create_all_first():
    # Banco totalmente novo: create_all cria tudo, add_missing_columns não tem nada a fazer.
    engine = make_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    assert add_missing_columns(engine) == []


def test_add_missing_columns_idempotent():
    engine = make_engine("sqlite://", poolclass=StaticPool)
    _old_recipes_table(engine)
    add_missing_columns(engine)
    assert add_missing_columns(engine) == []
