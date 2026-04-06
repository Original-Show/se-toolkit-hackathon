"""API routers for recipe CRUD operations."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from app.core.database import get_db, UPLOAD_DIR
from app.schemas.recipe import (
    RecipeCreate,
    RecipeUpdate,
    RecipeResponse,
    ShoppingListResponse,
    ShoppingListWithRecipesResponse,
    TagResponse,
    IngredientUpdate,
)
from app.crud import recipe as crud

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.get("/", response_model=List[RecipeResponse])
def list_recipes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all recipes with pagination."""
    recipes = crud.get_recipes(db, skip=skip, limit=limit)
    # Add image_url to response
    for recipe in recipes:
        if recipe.image_path:
            recipe.image_url = f"/api/recipes/images/{recipe.image_path}"
    return recipes


@router.get("/favorites", response_model=List[RecipeResponse])
def list_favorite_recipes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get only favorite recipes."""
    recipes = crud.get_favorite_recipes(db, skip=skip, limit=limit)
    for recipe in recipes:
        if recipe.image_path:
            recipe.image_url = f"/api/recipes/images/{recipe.image_path}"
    return recipes


@router.get("/tags", response_model=List[TagResponse])
def get_all_tags(db: Session = Depends(get_db)):
    """Get all unique tags."""
    return crud.get_all_tags(db)


@router.get("/tags/{tag_name}", response_model=List[RecipeResponse])
def get_recipes_by_tag(tag_name: str, db: Session = Depends(get_db)):
    """Get recipes filtered by tag."""
    recipes = crud.get_recipes_by_tag(db, tag_name=tag_name)
    for recipe in recipes:
        if recipe.image_path:
            recipe.image_url = f"/api/recipes/images/{recipe.image_path}"
    return recipes


@router.get("/search", response_model=List[RecipeResponse])
def search_recipes(q: str, db: Session = Depends(get_db)):
    """Search recipes by title or description."""
    recipes = crud.search_recipes(db, query=q)
    for recipe in recipes:
        if recipe.image_path:
            recipe.image_url = f"/api/recipes/images/{recipe.image_path}"
    return recipes


@router.get("/{recipe_id}", response_model=RecipeResponse)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Get a single recipe by ID."""
    recipe = crud.get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if recipe.image_path:
        recipe.image_url = f"/api/recipes/images/{recipe.image_path}"
    return recipe


@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(recipe_data: RecipeCreate, db: Session = Depends(get_db)):
    """Create a new recipe with ingredients."""
    return crud.create_recipe(db, recipe_data)


@router.put("/{recipe_id}", response_model=RecipeResponse)
def update_recipe(recipe_id: int, recipe_data: RecipeUpdate, db: Session = Depends(get_db)):
    """Update an existing recipe."""
    updated = crud.update_recipe(db, recipe_id, recipe_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if updated.image_path:
        updated.image_url = f"/api/recipes/images/{updated.image_path}"
    return updated


@router.patch("/{recipe_id}/favorite", response_model=RecipeResponse)
def toggle_recipe_favorite(recipe_id: int, db: Session = Depends(get_db)):
    """Toggle the favorite status of a recipe."""
    updated = crud.toggle_favorite(db, recipe_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if updated.image_path:
        updated.image_url = f"/api/recipes/images/{updated.image_path}"
    return updated


@router.patch("/ingredients/{ingredient_id}/bookmark", response_model=RecipeResponse)
def toggle_ingredient_bookmark(ingredient_id: int, db: Session = Depends(get_db)):
    """Toggle the bookmark status of an ingredient."""
    # Get current ingredient to find its bookmark status
    from app.models.recipe import Ingredient
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    # Toggle the bookmark status
    updated = crud.update_ingredient_bookmark(db, ingredient_id, not ingredient.is_bookmarked)
    if not updated:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    # Return the parent recipe with updated ingredients
    recipe = crud.get_recipe(db, updated.recipe_id)
    if recipe and recipe.image_path:
        recipe.image_url = f"/api/recipes/images/{recipe.image_path}"
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """Delete a recipe and all its ingredients."""
    success = crud.delete_recipe(db, recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found")


@router.post("/shopping-list", response_model=ShoppingListResponse)
def generate_shopping_list(recipe_ids: List[int], db: Session = Depends(get_db)):
    """Generate a consolidated shopping list from multiple recipes."""
    items = crud.generate_shopping_list(db, recipe_ids)
    return {"recipes": recipe_ids, "items": items}


@router.post("/shopping-list-with-recipes", response_model=ShoppingListWithRecipesResponse)
def generate_shopping_list_with_recipes(recipe_ids: List[int], db: Session = Depends(get_db)):
    """Generate a shopping list grouped by recipe with separators."""
    groups = crud.generate_shopping_list_with_recipes(db, recipe_ids)
    return {"recipe_groups": groups}


# --- Image Endpoints ---
@router.post("/{recipe_id}/image", response_model=RecipeResponse)
async def upload_recipe_image(
    recipe_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload an image for a recipe."""
    recipe = crud.get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    try:
        filename = await crud.save_uploaded_image(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    updated = crud.update_recipe_image(db, recipe_id, filename)
    if updated.image_path:
        updated.image_url = f"/api/recipes/images/{updated.image_path}"
    return updated


@router.get("/images/{filename}")
def serve_recipe_image(filename: str):
    """Serve a recipe image."""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)
