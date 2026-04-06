"""CRUD operations for recipes, ingredients, LLM keys, and image handling."""
import os
import uuid
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.models.recipe import Recipe, Ingredient, LLMKey, Tag
from app.schemas.recipe import RecipeCreate, RecipeUpdate, LLMKeyCreate
from app.core.database import UPLOAD_DIR


def get_or_create_tag(db: Session, name: str) -> Tag:
    """Get a tag by name or create it if it doesn't exist."""
    tag = db.query(Tag).filter(Tag.name.ilike(name)).first()
    if not tag:
        tag = Tag(name=name)
        db.add(tag)
        db.commit()
        db.refresh(tag)
    return tag


def get_recipe(db: Session, recipe_id: int) -> Recipe | None:
    """Fetch a single recipe with its ingredients."""
    return db.query(Recipe).filter(Recipe.id == recipe_id).first()


def get_recipes(db: Session, skip: int = 0, limit: int = 100) -> list[Recipe]:
    """Fetch all recipes with optional pagination."""
    return db.query(Recipe).offset(skip).limit(limit).all()


def get_favorite_recipes(db: Session, skip: int = 0, limit: int = 100) -> list[Recipe]:
    """Fetch only favorite recipes."""
    return db.query(Recipe).filter(Recipe.is_favorite == True).offset(skip).limit(limit).all()


def get_recipes_by_tag(db: Session, tag_name: str) -> list[Recipe]:
    """Fetch recipes filtered by tag name."""
    return db.query(Recipe).join(Recipe.tags).filter(Tag.name.ilike(tag_name)).all()


def get_all_tags(db: Session) -> list[Tag]:
    """Get all unique tags."""
    return db.query(Tag).all()


def search_recipes(db: Session, query: str) -> list[Recipe]:
    """Search recipes by title or description."""
    search_pattern = f"%{query}%"
    return db.query(Recipe).filter(
        Recipe.title.ilike(search_pattern) | Recipe.description.ilike(search_pattern)
    ).all()


def toggle_favorite(db: Session, recipe_id: int) -> Recipe | None:
    """Toggle the favorite status of a recipe."""
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return None
    db_recipe.is_favorite = not db_recipe.is_favorite
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def create_recipe(db: Session, recipe_data: RecipeCreate) -> Recipe:
    """Create a new recipe with its ingredients."""
    db_recipe = Recipe(
        title=recipe_data.title,
        description=recipe_data.description,
        instructions=recipe_data.instructions,
        is_favorite=recipe_data.is_favorite,
        difficulty=recipe_data.difficulty,
        cooking_time_minutes=recipe_data.cooking_time_minutes,
    )
    for ing_data in recipe_data.ingredients:
        ingredient = Ingredient(
            name=ing_data.name,
            quantity=ing_data.quantity,
            unit=ing_data.unit,
            is_bookmarked=ing_data.is_bookmarked,
        )
        db_recipe.ingredients.append(ingredient)
    
    # Add tags if provided
    if recipe_data.tags:
        for tag_name in recipe_data.tags:
            tag = get_or_create_tag(db, tag_name)
            db_recipe.tags.append(tag)
    
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def update_recipe(db: Session, recipe_id: int, recipe_data: RecipeUpdate) -> Recipe | None:
    """Update an existing recipe and replace all ingredients."""
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return None

    if recipe_data.title is not None:
        db_recipe.title = recipe_data.title
    if recipe_data.description is not None:
        db_recipe.description = recipe_data.description
    if recipe_data.instructions is not None:
        db_recipe.instructions = recipe_data.instructions
    if recipe_data.is_favorite is not None:
        db_recipe.is_favorite = recipe_data.is_favorite
    if recipe_data.difficulty is not None:
        db_recipe.difficulty = recipe_data.difficulty
    if recipe_data.cooking_time_minutes is not None:
        db_recipe.cooking_time_minutes = recipe_data.cooking_time_minutes

    if recipe_data.ingredients is not None:
        db.query(Ingredient).filter(Ingredient.recipe_id == recipe_id).delete()
        for ing_data in recipe_data.ingredients:
            ingredient = Ingredient(
                name=ing_data.name,
                quantity=ing_data.quantity,
                unit=ing_data.unit,
                recipe_id=recipe_id,
                is_bookmarked=ing_data.is_bookmarked,
            )
            db.add(ingredient)

    # Update tags if provided
    if recipe_data.tags is not None:
        db_recipe.tags.clear()
        for tag_name in recipe_data.tags:
            tag = get_or_create_tag(db, tag_name)
            db_recipe.tags.append(tag)

    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def update_ingredient_bookmark(db: Session, ingredient_id: int, is_bookmarked: bool) -> Ingredient | None:
    """Toggle bookmark status for an ingredient."""
    ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
    if not ingredient:
        return None
    ingredient.is_bookmarked = is_bookmarked
    db.commit()
    db.refresh(ingredient)
    return ingredient


def update_recipe_image(db: Session, recipe_id: int, image_path: str | None) -> Recipe | None:
    """Update the image path for a recipe."""
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return None
    db_recipe.image_path = image_path
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


def delete_recipe(db: Session, recipe_id: int) -> bool:
    """Delete a recipe and all its ingredients."""
    db_recipe = get_recipe(db, recipe_id)
    if not db_recipe:
        return False
    # Delete associated image file if exists
    if db_recipe.image_path:
        full_path = os.path.join(UPLOAD_DIR, db_recipe.image_path)
        if os.path.exists(full_path):
            os.remove(full_path)
    db.delete(db_recipe)
    db.commit()
    return True


def generate_shopping_list(db: Session, recipe_ids: list[int], bookmarked_only: bool = False) -> list[dict]:
    """Aggregate ingredients from multiple recipes, merging duplicates."""
    aggregated = {}
    for recipe_id in recipe_ids:
        recipe = get_recipe(db, recipe_id)
        if not recipe:
            continue

        ingredients = recipe.ingredients
        if bookmarked_only:
            ingredients = [ing for ing in ingredients if ing.is_bookmarked]

        for ingredient in ingredients:
            key = (ingredient.name.lower(), ingredient.unit.lower())
            if key in aggregated:
                aggregated[key]["quantity"] += ingredient.quantity
            else:
                aggregated[key] = {
                    "name": ingredient.name,
                    "quantity": ingredient.quantity,
                    "unit": ingredient.unit,
                }
    return list(aggregated.values())


def generate_shopping_list_with_recipes(db: Session, recipe_ids: list[int], bookmarked_only: bool = False) -> list[dict]:
    """Return shopping list grouped by recipe with separators."""
    result = []
    for recipe_id in recipe_ids:
        recipe = get_recipe(db, recipe_id)
        if not recipe:
            continue

        ingredients = recipe.ingredients
        if bookmarked_only:
            ingredients = [ing for ing in ingredients if ing.is_bookmarked]

        result.append({
            "recipe_id": recipe.id,
            "recipe_title": recipe.title,
            "ingredients": [
                {"id": ing.id, "name": ing.name, "quantity": ing.quantity, "unit": ing.unit}
                for ing in ingredients
            ],
        })
    return result


# --- LLM Key Management ---
def create_llm_key(db: Session, key_data: LLMKeyCreate) -> LLMKey:
    """Register a new LLM API key."""
    db_key = LLMKey(
        api_key=key_data.api_key,
        provider=key_data.provider,
    )
    db.add(db_key)
    db.commit()
    db.refresh(db_key)
    return db_key


def get_active_llm_key(db: Session, provider: str = "openai") -> LLMKey | None:
    """Fetch the active LLM key for a given provider."""
    return db.query(LLMKey).filter(
        LLMKey.provider == provider,
        LLMKey.is_active == True,
    ).first()


def list_llm_keys(db: Session) -> list[LLMKey]:
    """List all registered LLM keys (without exposing the actual key)."""
    return db.query(LLMKey).all()


def delete_llm_key(db: Session, key_id: int) -> bool:
    """Delete a registered LLM key."""
    db_key = db.query(LLMKey).filter(LLMKey.id == key_id).first()
    if not db_key:
        return False
    db.delete(db_key)
    db.commit()
    return True


# --- Image Handling ---
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_uploaded_image(file: UploadFile) -> str:
    """Save an uploaded image and return its relative path."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise ValueError("Image too large. Maximum size: 10 MB")

    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(content)
    return filename
