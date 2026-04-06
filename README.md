# Recipe Manager — se-toolkit-hackathon

A web-based recipe manager with AI-powered cooking assistance, shopping list aggregation, and meal planning.

---

## Demo

> *Screenshots of the main recipe list, recipe detail view, and shopping list.*

- **Home page** — browse all saved recipes with difficulty ratings and cooking times, search as you type
- **Recipe detail** — view structured ingredients with checkboxes to track what you've gathered
- **Shopping list** — select multiple recipes, get a consolidated list grouped by recipe with checkable items
- **AI Assistant** — generate recipes, structure cooking steps, check grammar and units

---

## Product Context

### End Users
Home cooks, students living independently, families who want to plan meals and organize grocery shopping efficiently.

### Problem
People struggle to keep track of recipes and their ingredients. When planning meals for the week, manually compiling a shopping list from multiple recipes is tedious and error-prone. Recipe instructions are often poorly structured, and units are inconsistent.

### Our Solution
A simple web app where you save recipes with structured ingredients and difficulty ratings, then select multiple recipes to auto-generate a merged shopping list organized by recipe. AI tools help structure cooking steps, fix grammar, and correct cooking unit errors.

---

## Features

### Implemented
- **Full CRUD** — Create, Read, Update, Delete recipes with ingredients
- **Live Search** — Debounced smooth search that updates results as you type
- **Difficulty Rating** — 1–5 stars shown on main page, separate from favorites
- **Cooking Time** — Days/hours/minutes input, smart display on recipe cards
- **Shopping List Aggregator** — Select multiple recipes → get a list grouped by recipe with synced checkable ingredients (marking an item in a recipe group auto-checks it in the combined list and vice versa)
- **AI-Powered Tools:**
  - Generate random recipes with cuisine/dietary preferences
  - Structure raw cooking instructions into clear step-by-step format
  - Grammar check for recipe text
  - Unit check for ingredient measurements
- **Favorite Recipes** — Toggle favorites with smooth animation
- **Tag System** — Dynamic tags auto-populated from existing recipes, cleaned up on delete
- **Image Upload** — Upload and display recipe images
- **Ingredient Bookmarking** — Mark starred ingredients in recipes
- **Persistent Storage** — SQLite database
- **Responsive Web UI** — Works on desktop and mobile browsers
- **Dockerized** — Backend + frontend via Docker Compose

### Not Yet Implemented
- PostgreSQL support for production
- Cloud deployment (Render / Railway / Fly.io)
- User authentication and multi-user support
- Meal planning calendar

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python 3.11), SQLAlchemy, OpenAI API |
| Database | SQLite |
| Frontend | HTML / CSS / Vanilla JavaScript |
| Containerization | Docker & Docker Compose |
| Deployment | Azure VM (Ubuntu 24.04) |

---

## Usage

### Docker Compose (Recommended)

```bash
docker compose up -d
```

Access the app:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Interactive API docs**: http://localhost:8000/docs

To check logs:
```bash
docker compose logs -f
```

To stop:
```bash
docker compose down
```

### Local Development

**1. Setup:**
```bash
bash scripts/setup.sh
```

**2. Start the backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**3. Serve the frontend:**
```bash
python3 -m http.server 3000 --directory frontend
```

**4. Access the app:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

---

## Database Schema

### `recipes` table
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | Primary Key |
| title | String(255) | Not Null, Indexed |
| description | Text | Nullable |
| instructions | Text | Not Null |
| image_path | String(500) | Nullable |
| is_favorite | Boolean | Default: False |
| difficulty | Integer | Default: 1 (1-5 scale) |
| cooking_time_minutes | Integer | Nullable (total minutes) |
| created_at | DateTime | Default: UTC now |
| updated_at | DateTime | Auto-update |

### `ingredients` table
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | Primary Key |
| name | String(255) | Not Null |
| quantity | Float | Not Null (> 0) |
| unit | String(50) | Not Null |
| is_bookmarked | Boolean | Default: False |
| recipe_id | Integer | Foreign Key → recipes.id |

---

## API Endpoints

### Recipes
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/recipes/` | List all recipes |
| `GET` | `/api/recipes/favorites` | List favorite recipes |
| `GET` | `/api/recipes/search?q=` | Search recipes |
| `GET` | `/api/recipes/{id}` | Get single recipe |
| `POST` | `/api/recipes/` | Create recipe |
| `PUT` | `/api/recipes/{id}` | Update recipe |
| `DELETE` | `/api/recipes/{id}` | Delete recipe |
| `PATCH` | `/api/recipes/{id}/favorite` | Toggle favorite |
| `POST` | `/api/recipes/shopping-list` | Aggregated shopping list |
| `POST` | `/api/recipes/shopping-list-with-recipes` | Shopping list grouped by recipe |

### AI Tools
| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/llm/find-recipe` | Generate random recipe |
| `POST` | `/api/llm/structured-cooking-steps` | Structure cooking steps |
| `POST` | `/api/llm/grammar-check` | Check grammar in text |
| `POST` | `/api/llm/unit-check` | Check cooking units |

---

## Deployment

### Requirements
- **OS**: Ubuntu 24.04 LTS (or any Linux distribution)
- **Docker** (20.10+)
- **Docker Compose** (v2+)

### Step-by-Step

**1. Install Docker:**
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**2. Clone the repository:**
```bash
git clone https://github.com/Original-Show/se-toolkit-hackathon.git
cd se-toolkit-hackathon
```

**3. Build and start:**
```bash
docker compose up -d --build
```

**4. Access:**
- Frontend: `http://<vm-ip>:3000`
- Backend API: `http://<vm-ip>:8000`
- API docs: `http://<vm-ip>:8000/docs`

**5. Check logs:**
```bash
docker compose logs -f
```

### Updating an Existing Deployment
```bash
cd se-toolkit-hackathon
git pull
docker compose down
docker compose up -d --build
```

---

## Running Tests

```bash
bash scripts/test.sh
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./recipes.db` | Database connection string |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

---

## License

MIT
