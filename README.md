# Recipe Manager — se-toolkit-hackathon

A web-based recipe manager that stores recipes and displays structured ingredient lists with precise quantities for easy cooking and shopping planning.

## Features

### Version 1 (Core)
- **Create, Read, Update, Delete** recipes with title, description, instructions, and ingredients
- **Search** recipes by title or description
- **Persistent storage** via SQLite database
- **Responsive web UI** — works on desktop and mobile browsers

### Version 2 (Planned)
- **Shopping List Aggregator** — select multiple recipes and generate a consolidated grocery list with merged ingredients
- **PostgreSQL** support for production deployment
- **Cloud deployment** on Render / Railway / Fly.io

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python 3.11) |
| Database | SQLite (V1) → PostgreSQL (V2) |
| Frontend | HTML / CSS / Vanilla JavaScript |
| Containerization | Docker & Docker Compose |

## Project Structure

```
se-toolkit-hackathon/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── core/
│   │   │   └── database.py     # DB engine, session, Base model
│   │   ├── models/
│   │   │   └── recipe.py       # SQLAlchemy models (Recipe, Ingredient)
│   │   ├── schemas/
│   │   │   └── recipe.py       # Pydantic validation schemas
│   │   ├── crud/
│   │   │   └── recipe.py       # Database CRUD operations
│   │   ├── routers/
│   │   │   └── recipes.py      # API route handlers
│   │   └── main.py             # FastAPI app entry point
│   ├── tests/
│   │   └── test_recipes.py     # Pytest test suite
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables
│   └── .env.example            # Environment template
├── frontend/                   # Web frontend (vanilla JS)
│   ├── index.html              # Main HTML page
│   ├── css/
│   │   └── styles.css          # Application styles
│   ├── js/
│   │   ├── api.js              # API client (fetch wrapper)
│   │   └── app.js              # Application logic & DOM manipulation
│   └── assets/                 # Static assets (images, icons)
├── docker/
│   ├── Dockerfile.backend      # Backend container image
│   └── Dockerfile.frontend     # Frontend container image (nginx)
├── scripts/
│   ├── setup.sh                # Linux/macOS setup script
│   ├── setup.bat               # Windows setup script
│   └── test.sh                 # Run test suite
├── docker-compose.yml          # Docker Compose configuration
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Database Schema

### `recipes` table
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | Primary Key, Auto-increment |
| title | String(255) | Not Null, Indexed |
| description | Text | Nullable |
| instructions | Text | Not Null |
| created_at | DateTime | Default: UTC now |
| updated_at | DateTime | Default: UTC now, auto-update |

### `ingredients` table
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | Primary Key, Auto-increment |
| name | String(255) | Not Null |
| quantity | Float | Not Null (> 0) |
| unit | String(50) | Not Null |
| recipe_id | Integer | Foreign Key → recipes.id, Not Null |

**Relationship:** One Recipe → Many Ingredients (one-to-many, cascade delete)

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/recipes/` | List all recipes (supports `skip`, `limit`) |
| `GET` | `/api/recipes/search?q=` | Search recipes by title/description |
| `GET` | `/api/recipes/{id}` | Get single recipe with ingredients |
| `POST` | `/api/recipes/` | Create new recipe |
| `PUT` | `/api/recipes/{id}` | Update existing recipe |
| `DELETE` | `/api/recipes/{id}` | Delete recipe |
| `POST` | `/api/recipes/shopping-list` | Generate consolidated shopping list |

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
docker compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

### Option 2: Local Development

**1. Setup:**
```bash
# Linux/macOS
bash scripts/setup.sh

# Windows
scripts\setup.bat
```

**2. Start the backend:**
```bash
cd backend
source venv/bin/activate   # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

**3. Serve the frontend:**
```bash
# Option A: Simple HTTP server
python3 -m http.server 3000 --directory frontend

# Option B: Just open frontend/index.html in your browser
```

**4. Access the app:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs

## Running Tests

```bash
bash scripts/test.sh

# Or manually:
cd backend
source venv/bin/activate
pytest tests/ -v
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./recipes.db` | Database connection string |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |

## Development Workflow

1. **V1 Demo for TA:** Add a recipe → Save it → Refresh page → Verify data persists
2. **V2 Iteration:** Implement shopping list aggregator → Deploy to cloud platform
3. **Feedback loop:** Adjust UI, validation, and API based on TA review

## License

MIT
