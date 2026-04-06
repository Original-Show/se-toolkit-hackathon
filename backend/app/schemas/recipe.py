"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class IngredientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    quantity: float = Field(..., gt=0)
    unit: str = Field(..., min_length=1, max_length=50)
    is_bookmarked: bool = Field(default=False)


class IngredientCreate(IngredientBase):
    pass


class IngredientResponse(IngredientBase):
    id: int
    recipe_id: int

    class Config:
        from_attributes = True


class IngredientUpdate(BaseModel):
    is_bookmarked: bool


class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int

    class Config:
        from_attributes = True


class RecipeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    instructions: str = Field(..., min_length=1)
    is_favorite: bool = Field(default=False)
    difficulty: int = Field(default=1, ge=1, le=5)
    cooking_time_minutes: Optional[int] = Field(default=None, ge=0)
    tags: Optional[List[str]] = None


class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate]


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    is_favorite: Optional[bool] = None
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    cooking_time_minutes: Optional[int] = Field(default=None, ge=0)
    tags: Optional[List[str]] = None
    ingredients: Optional[List[IngredientCreate]] = None


class RecipeResponse(RecipeBase):
    id: int
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    ingredients: List[IngredientResponse]
    tags: List[TagResponse] = []

    class Config:
        from_attributes = True


class ShoppingListItem(BaseModel):
    name: str
    quantity: float
    unit: str


class ShoppingListIngredientItem(BaseModel):
    id: int
    name: str
    quantity: float
    unit: str


class ShoppingListRecipeGroup(BaseModel):
    recipe_id: int
    recipe_title: str
    ingredients: List[ShoppingListIngredientItem]


class ShoppingListResponse(BaseModel):
    recipes: List[int]
    items: List[ShoppingListItem]


class ShoppingListWithRecipesResponse(BaseModel):
    recipe_groups: List[ShoppingListRecipeGroup]


# --- LLM Key Management ---
class LLMKeyCreate(BaseModel):
    api_key: str = Field(..., min_length=1)
    provider: str = Field(default="openai", max_length=50)


class LLMKeyResponse(BaseModel):
    id: int
    provider: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- LLM Recipe Finder ---
class LLMRecipeRequest(BaseModel):
    api_key: str = Field(..., min_length=1)
    cuisine: Optional[str] = None
    dietary: Optional[str] = None
    max_results: int = Field(default=1, ge=1, le=10)


class LLMRecipeItem(BaseModel):
    title: str
    description: str
    ingredients: List[IngredientCreate]
    instructions: str


class LLMRecipeResponse(BaseModel):
    recipes: List[LLMRecipeItem]
