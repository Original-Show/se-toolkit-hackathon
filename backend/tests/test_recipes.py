"""Tests for recipe CRUD operations."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_recipes.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    """Override the database dependency for testing."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


class TestHealthCheck:
    def test_health_check(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestRecipeCRUD:
    def test_create_recipe(self):
        recipe_data = {
            "title": "Test Pasta",
            "description": "A simple pasta recipe",
            "instructions": "Boil water. Cook pasta. Add sauce.",
            "ingredients": [
                {"name": "Pasta", "quantity": 200, "unit": "g"},
                {"name": "Tomato Sauce", "quantity": 150, "unit": "ml"},
            ],
        }
        response = client.post("/api/recipes/", json=recipe_data)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Pasta"
        assert len(data["ingredients"]) == 2
        assert data["ingredients"][0]["name"] == "Pasta"

    def test_get_recipes(self):
        # Create a recipe first
        recipe_data = {
            "title": "Test Salad",
            "instructions": "Mix ingredients.",
            "ingredients": [{"name": "Lettuce", "quantity": 1, "unit": "pcs"}],
        }
        client.post("/api/recipes/", json=recipe_data)

        response = client.get("/api/recipes/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_get_recipe_by_id(self):
        recipe_data = {
            "title": "Test Soup",
            "instructions": "Boil and serve.",
            "ingredients": [{"name": "Water", "quantity": 500, "unit": "ml"}],
        }
        create_response = client.post("/api/recipes/", json=recipe_data)
        recipe_id = create_response.json()["id"]

        response = client.get(f"/api/recipes/{recipe_id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Test Soup"

    def test_get_nonexistent_recipe(self):
        response = client.get("/api/recipes/9999")
        assert response.status_code == 404

    def test_update_recipe(self):
        recipe_data = {
            "title": "Original Title",
            "instructions": "Original instructions.",
            "ingredients": [{"name": "Salt", "quantity": 1, "unit": "g"}],
        }
        create_response = client.post("/api/recipes/", json=recipe_data)
        recipe_id = create_response.json()["id"]

        update_data = {
            "title": "Updated Title",
            "instructions": "Updated instructions.",
            "ingredients": [{"name": "Pepper", "quantity": 2, "unit": "g"}],
        }
        response = client.put(f"/api/recipes/{recipe_id}", json=update_data)
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"
        assert response.json()["ingredients"][0]["name"] == "Pepper"

    def test_delete_recipe(self):
        recipe_data = {
            "title": "To Delete",
            "instructions": "Delete me.",
            "ingredients": [{"name": "Nothing", "quantity": 0, "unit": "g"}],
        }
        create_response = client.post("/api/recipes/", json=recipe_data)
        recipe_id = create_response.json()["id"]

        response = client.delete(f"/api/recipes/{recipe_id}")
        assert response.status_code == 204

        # Verify deletion
        get_response = client.get(f"/api/recipes/{recipe_id}")
        assert get_response.status_code == 404

    def test_search_recipes(self):
        recipe_data = {
            "title": "Chocolate Cake",
            "description": "Delicious dessert",
            "instructions": "Bake at 180C.",
            "ingredients": [{"name": "Flour", "quantity": 300, "unit": "g"}],
        }
        client.post("/api/recipes/", json=recipe_data)

        response = client.get("/api/recipes/search?q=chocolate")
        assert response.status_code == 200
        assert len(response.json()) >= 1

        response = client.get("/api/recipes/search?q=nonexistent")
        assert response.status_code == 200
        assert len(response.json()) == 0


class TestShoppingList:
    def test_generate_shopping_list(self):
        # Create two recipes with overlapping ingredients
        recipe1 = {
            "title": "Recipe 1",
            "instructions": "Step 1.",
            "ingredients": [
                {"name": "Flour", "quantity": 200, "unit": "g"},
                {"name": "Sugar", "quantity": 100, "unit": "g"},
            ],
        }
        recipe2 = {
            "title": "Recipe 2",
            "instructions": "Step 2.",
            "ingredients": [
                {"name": "Flour", "quantity": 150, "unit": "g"},
                {"name": "Eggs", "quantity": 2, "unit": "pcs"},
            ],
        }
        r1 = client.post("/api/recipes/", json=recipe1).json()
        r2 = client.post("/api/recipes/", json=recipe2).json()

        response = client.post(
            "/api/recipes/shopping-list",
            json=[r1["id"], r2["id"]],
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3  # Flour (merged), Sugar, Eggs

        # Check flour is merged
        flour = next(item for item in data["items"] if item["name"] == "Flour")
        assert flour["quantity"] == 350
