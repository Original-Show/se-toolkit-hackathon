# Recipe Manager - Features Documentation

## Overview

The Recipe Manager is a web-based application for storing, organizing, and managing recipes. It provides structured ingredient entry, shopping list generation, and AI-powered recipe discovery.

## Implemented Features

### 1. Responsive Design for Multiple Screen Sizes

The application adapts its layout based on screen size to ensure usability across devices.

**Mobile (up to 640px):**
- Stacked layout for header and controls
- Full-width ingredient rows with vertically stacked inputs
- Modal widths optimized to 95% of viewport
- Touch-friendly button sizing
- Collapsed filter controls

**Tablet (641px to 1024px):**
- Modal width increased to 800px
- Adjusted container padding
- Balanced grid layouts

**Desktop (above 1024px):**
- Full-featured layout with 900px wide recipe modal
- Multi-column ingredient rows displaying name, quantity, unit, bookmark, and delete controls
- Side-by-side filter controls

**Viewport Configuration:**
- Meta viewport tag set with maximum-scale=5.0 for accessibility
- All interactive elements sized for touch interaction
- Proper scaling across device types

### 2. Wide Add/Edit Recipe Modal

The recipe creation and editing modal has been expanded to display all fields without requiring horizontal scrolling.

- Modal width increased from 500px to 900px
- Ingredient rows use five-column grid layout:
  - Ingredient name (3fr)
  - Quantity (1fr)
  - Unit (1fr)
  - Bookmark button (50px)
  - Remove button (auto)
- Background color applied to ingredient rows for visual separation
- Input field padding and spacing optimized for readability

### 3. Input Validation for Ingredients

Validation occurs both during user interaction and on form submission.

**Visual Feedback:**
- Red border applied to invalid fields via `.input-error` class
- Error messages displayed below invalid rows
- Form-level error alerts displayed before submission

**Validation Rules:**
- Name: Required, non-empty string
- Quantity: Required, must be greater than zero, accepts decimal values
- Unit: Required, non-empty string
- Title: Required for recipe
- Instructions: Required for recipe

**Behavior:**
- Validation triggers on field blur (when user leaves the field)
- Errors clear immediately as user types
- All ingredient rows validated before form submission

### 4. Ingredient Checklist (Recipe Detail View)

Each recipe detail view includes interactive checkboxes for tracking ingredients during shopping or cooking preparation.

**Functionality:**
- Checkboxes provided for each ingredient
- Click anywhere on the ingredient row to toggle the checkbox
- Checked items display with strikethrough text and reduced opacity
- Checked state tracked in session using JavaScript Set
- State cleared when recipe detail modal is closed

**Use Cases:**
- Grocery shopping list tracking
- Cooking preparation tracking
- Inventory management

### 5. Recipe Favorites

Users can mark recipes as favorites for quick access and filtering.

**Interface:**
- Star button displayed on each recipe card
- Filled star indicates favorited recipe
- Empty star indicates non-favorited recipe
- Visual feedback on hover and click

**Filtering:**
- "Favorites" button in filter controls displays only favorited recipes
- "All Recipes" button resets to full recipe list
- Filter state preserved when toggling favorite status on individual recipes

**Backend Implementation:**
- `is_favorite` boolean field stored in Recipe model
- Dedicated endpoint: `GET /api/recipes/favorites`
- Toggle endpoint: `PATCH /api/recipes/{id}/favorite`

### 6. Tagging System

Recipes can be organized using tags for efficient categorization and filtering.

**Tag Creation:**
- Comma-separated tag input field in recipe form
- Tags created automatically if they do not exist
- Case-insensitive tag matching prevents duplicates

**Tag Display:**
- Tags displayed as styled badges on recipe cards
- Tags visible in recipe detail view
- Clicking any tag filters the recipe list

**Tag Filtering:**
- Dropdown selector populated with all existing tags
- Selecting a tag filters the recipe list immediately
- "All Tags" option resets the filter

**Backend Implementation:**
- Tag model with id and name fields
- Many-to-many relationship between Recipe and Tag
- Association table: `recipe_tags`
- Endpoints: `GET /api/recipes/tags` and `GET /api/recipes/tags/{tag_name}`

### 7. Ingredient Bookmarks

Individual ingredients can be bookmarked for emphasis and potential filtering in future features.

**Interface:**
- Bookmark button (star icon) on each ingredient in add/edit modal
- Bookmark button also available in recipe detail view
- Empty star indicates non-bookmarked ingredient
- Filled star with accent color indicates bookmarked ingredient

**Use Cases:**
- Marking critical or hard-to-find ingredients
- Future filtering for focused shopping lists
- Quick reference for important items

**Backend Implementation:**
- `is_bookmarked` boolean field stored in Ingredient model
- Endpoint: `PATCH /api/recipes/ingredients/{ingredient_id}/bookmark`

## Database Schema

### Recipe Table
- id (Integer, Primary Key)
- title (String, required)
- description (Text, optional)
- instructions (Text, required)
- image_path (String, optional)
- is_favorite (Boolean, default=False)
- created_at (DateTime)
- updated_at (DateTime)

### Ingredient Table
- id (Integer, Primary Key)
- name (String, required)
- quantity (Float, required)
- unit (String, required)
- is_bookmarked (Boolean, default=False)
- recipe_id (Integer, Foreign Key)

### Tag Table
- id (Integer, Primary Key)
- name (String, required, unique)

### Recipe-Tags Association Table
- recipe_id (Integer, Foreign Key)
- tag_id (Integer, Foreign Key)

## API Endpoints

### Recipe Endpoints
- `GET /api/recipes/` - List all recipes
- `GET /api/recipes/favorites` - List favorited recipes
- `GET /api/recipes/{id}` - Get single recipe
- `POST /api/recipes/` - Create recipe
- `PUT /api/recipes/{id}` - Update recipe
- `DELETE /api/recipes/{id}` - Delete recipe
- `PATCH /api/recipes/{id}/favorite` - Toggle favorite status

### Ingredient Endpoints
- `PATCH /api/recipes/ingredients/{ingredient_id}/bookmark` - Toggle bookmark status

### Tag Endpoints
- `GET /api/recipes/tags` - List all tags
- `GET /api/recipes/tags/{tag_name}` - Get recipes by tag

### Shopping List
- `POST /api/recipes/shopping-list` - Generate consolidated shopping list

## Deployment

Build and start the application:
```bash
docker-compose up --build -d
```

Access points:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Documentation: http://localhost:8000/docs

---

**Last Updated:** April 5, 2026
**Version:** 2.2.0
