"""API router for LLM-based recipe generation."""
import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from openai import OpenAI
from app.core.database import get_db
from app.schemas.recipe import LLMRecipeRequest, LLMRecipeResponse, LLMKeyCreate, LLMKeyResponse
from app.crud import recipe as crud

router = APIRouter(prefix="/api/llm", tags=["llm"])


def _build_llm_prompt(cuisine: str | None, dietary: str | None) -> str:
    """Build the prompt for the LLM to generate a random recipe."""
    parts = ["Generate a random, realistic recipe."]
    if cuisine:
        parts.append(f"Cuisine type: {cuisine}.")
    if dietary:
        parts.append(f"Dietary requirement: {dietary}.")
    parts.append(
        "Return ONLY a valid JSON object with this exact structure:\n"
        '{\n'
        '  "title": "Recipe name",\n'
        '  "description": "Short description",\n'
        '  "instructions": "Step by step instructions",\n'
        '  "ingredients": [\n'
        '    {"name": "Ingredient", "quantity": 1.0, "unit": "g"}\n'
        '  ]\n'
        '}'
    )
    return "\n".join(parts)


@router.post("/find-recipe", response_model=LLMRecipeResponse)
async def find_random_recipe(
    request: LLMRecipeRequest,
    db: Session = Depends(get_db),
):
    """Use an LLM to find/generate a random recipe based on preferences."""
    # Try using the provided API key first
    api_key = request.api_key

    # Also check if there's a stored key
    stored_key = crud.get_active_llm_key(db)
    if stored_key and not api_key:
        api_key = stored_key.api_key

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No API key provided. Register a key or pass one in the request.",
        )

    prompt = _build_llm_prompt(request.cuisine, request.dietary)

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9,
            max_tokens=1500,
        )
        content = response.choices[0].message.content.strip()

        # Try to parse JSON from the response
        # Handle potential markdown code block wrapping
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        data = json.loads(content)

        # Validate structure
        if "title" not in data or "instructions" not in data or "ingredients" not in data:
            raise ValueError("Response missing required fields")

        recipes = [
            {
                "title": data["title"],
                "description": data.get("description", ""),
                "instructions": data["instructions"],
                "ingredients": data["ingredients"],
            }
        ]

        return LLMRecipeResponse(recipes=recipes)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM returned invalid response format",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM response validation failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM API call failed: {str(e)}",
        )


# --- LLM Key Management Endpoints ---
@router.post("/keys", response_model=LLMKeyResponse, status_code=status.HTTP_201_CREATED)
def register_llm_key(key_data: LLMKeyCreate, db: Session = Depends(get_db)):
    """Register a new LLM API key."""
    return crud.create_llm_key(db, key_data)


@router.get("/keys", response_model=list[LLMKeyResponse])
def list_keys(db: Session = Depends(get_db)):
    """List all registered LLM keys."""
    return crud.list_llm_keys(db)


@router.delete("/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_llm_key(key_id: int, db: Session = Depends(get_db)):
    """Delete a registered LLM API key."""
    success = crud.delete_llm_key(db, key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")


@router.get("/keys/active/{provider}")
def get_active_key_info(provider: str, db: Session = Depends(get_db)):
    """Check if there's an active key for a provider."""
    key = crud.get_active_llm_key(db, provider)
    if not key:
        return {"has_active_key": False}
    return {"has_active_key": True, "provider": key.provider, "created_at": key.created_at}
