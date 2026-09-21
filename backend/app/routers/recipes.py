from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Grain, HopAddition, Recipe
from app.schemas import RecipeCreate, RecipeRead, RecipeUpdate

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


def _get_or_404(db: Session, recipe_id: int) -> Recipe:
    recipe = db.get(Recipe, recipe_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="receita não encontrada")
    return recipe


def _apply(recipe: Recipe, data: RecipeCreate) -> None:
    for field, value in data.model_dump(exclude={"grains", "hops"}).items():
        setattr(recipe, field, value)
    recipe.grains = [Grain(**g.model_dump()) for g in data.grains]
    recipe.hops = [HopAddition(**h.model_dump()) for h in data.hops]


@router.get("", response_model=list[RecipeRead])
def list_recipes(db: Session = Depends(get_db)) -> list[Recipe]:
    stmt = select(Recipe).options(selectinload(Recipe.grains), selectinload(Recipe.hops)).order_by(Recipe.name)
    return list(db.scalars(stmt))


@router.post("", response_model=RecipeRead, status_code=201)
def create_recipe(data: RecipeCreate, db: Session = Depends(get_db)) -> Recipe:
    recipe = Recipe()
    _apply(recipe, data)
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.get("/{recipe_id}", response_model=RecipeRead)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)) -> Recipe:
    return _get_or_404(db, recipe_id)


@router.put("/{recipe_id}", response_model=RecipeRead)
def update_recipe(recipe_id: int, data: RecipeUpdate, db: Session = Depends(get_db)) -> Recipe:
    recipe = _get_or_404(db, recipe_id)
    _apply(recipe, data)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)) -> Response:
    db.delete(_get_or_404(db, recipe_id))
    db.commit()
    return Response(status_code=204)
