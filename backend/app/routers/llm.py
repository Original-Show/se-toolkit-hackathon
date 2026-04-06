"""API router for LLM-based recipe assistance."""
import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from openai import OpenAI
from app.core.database import get_db
from app.schemas.recipe import LLMRecipeRequest, LLMRecipeResponse, LLMKeyCreate, LLMKeyResponse
from app.crud import recipe as crud

router = APIRouter(prefix="/api/llm", tags=["llm"])


def _get_api_key(provided_key: str, db: Session) -> str:
    """Get API key from request or stored key."""
    api_key = provided_key
    stored_key = crud.get_active_llm_key(db)
    if stored_key and not api_key:
        api_key = stored_key.api_key
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No API key provided. Register a key or pass one in the request.",
        )
    return api_key


def _parse_llm_json(content: str) -> dict:
    """Parse JSON from LLM response, handling markdown code blocks."""
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()
    return json.loads(content)


@router.post("/find-recipe", response_model=LLMRecipeResponse)
async def find_random_recipe(
    request: LLMRecipeRequest,
    db: Session = Depends(get_db),
):
    """Use an LLM to generate a random recipe based on preferences."""
    api_key = _get_api_key(request.api_key, db)

    prompt = (
        "Generate a realistic, detailed recipe."
        "Return ONLY a valid JSON object with this exact structure:\n"
        '{\n'
        '  "title": "Recipe name",\n'
        '  "description": "Short description (1-2 sentences)",\n'
        '  "instructions": "Step-by-step cooking instructions",\n'
        '  "ingredients": [\n'
        '    {"name": "Ingredient", "quantity": 1.0, "unit": "g"}\n'
        '  ]\n'
        '}'
    )
    if request.cuisine:
        prompt = f"Cuisine type: {request.cuisine}. " + prompt
    if request.dietary:
        prompt = f"Dietary requirement: {request.dietary}. " + prompt

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9,
            max_tokens=1500,
        )
        content = response.choices[0].message.content.strip()
        data = _parse_llm_json(content)

        if "title" not in data or "instructions" not in data or "ingredients" not in data:
            raise ValueError("Response missing required fields")

        recipes = [{
            "title": data["title"],
            "description": data.get("description", ""),
            "instructions": data["instructions"],
            "ingredients": data["ingredients"],
        }]
        return LLMRecipeResponse(recipes=recipes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="LLM returned invalid response format")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"LLM response validation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"LLM API call failed: {str(e)}")


@router.post("/structured-cooking-steps")
async def generate_structured_cooking_steps(
    recipe_text: dict,
    db: Session = Depends(get_db),
):
    """Take raw recipe text and return structured cooking steps with grammar and unit checks."""
    api_key = _get_api_key(recipe_text.get("api_key", ""), db)

    prompt = (
        "You are a professional chef and editor. Analyze the following recipe text and:\n"
        "1. Restructure the instructions into clear, numbered step-by-step cooking steps\n"
        "2. Fix any grammar or spelling errors\n"
        "3. Check and correct any incorrect cooking units (e.g., fix '1 kg of water' to '1 liter of water')\n"
        "4. Add estimated time for each step if possible\n"
        "5. Highlight any potential issues or tips\n\n"
        "Return ONLY a valid JSON object with this structure:\n"
        '{\n'
        '  "structured_steps": [\n'
        '    {"step_number": 1, "instruction": "Clear step text", "estimated_minutes": 5, "tip": "Optional tip or null"},\n'
        '    ...\n'
        '  ],\n'
        '  "grammar_corrections": [{"original": "wrong text", "corrected": "fixed text"}],\n'
        '  "unit_corrections": [{"original": "wrong unit", "corrected": "fixed unit", "item": "item name"}],\n'
        '  "total_estimated_minutes": 30,\n'
        '  "chef_tips": ["tip1", "tip2"]\n'
        '}\n\n'
        f"Recipe to analyze:\n{recipe_text.get('recipe_text', '')}"
    )

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000,
        )
        content = response.choices[0].message.content.strip()
        data = _parse_llm_json(content)

        if "structured_steps" not in data:
            raise ValueError("Response missing structured_steps")

        return data
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="LLM returned invalid response format")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"LLM response validation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"LLM API call failed: {str(e)}")


@router.post("/grammar-check")
async def grammar_check(
    request_data: dict,
    db: Session = Depends(get_db),
):
    """Check and fix grammar in recipe text."""
    api_key = _get_api_key(request_data.get("api_key", ""), db)

    prompt = (
        "You are a professional editor. Check the following recipe text for grammar, spelling, and punctuation errors.\n"
        "Return ONLY a valid JSON object:\n"
        '{\n'
        '  "corrected_text": "The fully corrected text",\n'
        '  "corrections": [{"original": "wrong", "corrected": "right", "type": "grammar/spelling/punctuation"}]\n'
        '}\n\n'
        f"Text to check:\n{request_data.get('text', '')}"
    )

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=1500,
        )
        content = response.choices[0].message.content.strip()
        return _parse_llm_json(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid response")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"LLM API call failed: {str(e)}")


@router.post("/unit-check")
async def unit_check(
    request_data: dict,
    db: Session = Depends(get_db),
):
    """Check and correct cooking units in ingredient lists."""
    api_key = _get_api_key(request_data.get("api_key", ""), db)

    prompt = (
        "You are a professional chef. Review the following ingredient list and check for incorrect units.\n"
        "Fix any unit errors (e.g., '1 kg of milk' → '1 liter of milk', '100 ml of flour' → '100 g of flour').\n"
        "Return ONLY a valid JSON object:\n"
        '{\n'
        '  "corrected_ingredients": "The corrected ingredient list as text",\n'
        '  "corrections": [{"original": "wrong unit phrase", "corrected": "fixed phrase", "item": "ingredient name"}]\n'
        '}\n\n'
        f"Ingredients to check:\n{request_data.get('ingredients_text', '')}"
    )

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=1000,
        )
        content = response.choices[0].message.content.strip()
        return _parse_llm_json(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid response")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"LLM API call failed: {str(e)}")


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
