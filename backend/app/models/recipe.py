"""SQLAlchemy models for recipes and ingredients."""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


# Association table for recipe tags (many-to-many)
recipe_tag_association = Table(
    'recipe_tags',
    Base.metadata,
    Column('recipe_id', Integer, ForeignKey('recipes.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)
    is_favorite = Column(Boolean, default=False)
    difficulty = Column(Integer, default=1)  # 1-5 difficulty rating
    cooking_time_minutes = Column(Integer, nullable=True)  # total cooking time in minutes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=recipe_tag_association, back_populates="recipes")


class LLMKey(Base):
    __tablename__ = "llm_keys"

    id = Column(Integer, primary_key=True, index=True)
    api_key = Column(String(500), nullable=False, unique=True, index=True)
    provider = Column(String(50), nullable=False, default="openai")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    is_bookmarked = Column(Boolean, default=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)

    recipe = relationship("Recipe", back_populates="ingredients")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)

    recipes = relationship("Recipe", secondary=recipe_tag_association, back_populates="tags")
