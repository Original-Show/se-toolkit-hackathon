# Changelog - Recipe Manager

## [2.2.0] - 2026-04-05

### Added

#### Responsive Design System
- Full mobile support for screens up to 640px with stacked layouts and touch-optimized controls
- Tablet optimization for 641-1024px range with wider modals and balanced grid layouts
- Desktop enhancements for screens above 1024px with 900px wide recipe modals
- Viewport meta configuration with maximum-scale=5.0 for accessibility
- All interactive elements sized for touch interaction (minimum 44x44px tap targets)

#### Recipe Favorites System
- Star toggle button on each recipe card for marking favorites
- Visual distinction between favorited (filled star) and non-favorited (empty star) recipes
- Filter controls to view only favorites or all recipes
- Backend implementation with `is_favorite` boolean field in Recipe model
- Dedicated API endpoint: `GET /api/recipes/favorites`
- Toggle endpoint: `PATCH /api/recipes/{id}/favorite`

#### Tagging System
- Tag creation through comma-separated input in recipe form
- Automatic tag creation with case-insensitive matching
- Tag display as styled badges on recipe cards
- Tag-based filtering via dropdown selector
- Backend implementation with Tag model and many-to-many relationship
- API endpoints: `GET /api/recipes/tags` and `GET /api/recipes/tags/{tag_name}`

#### Ingredient Bookmarks
- Bookmark toggle button on each ingredient in add/edit modal and recipe detail view
- Visual indicators distinguishing bookmarked and non-bookmarked ingredients
- Backend support with `is_bookmarked` boolean field
- API endpoint: `PATCH /api/recipes/ingredients/{ingredient_id}/bookmark`

#### Ingredient Checklist
- Interactive checkboxes in recipe detail view for tracking ingredients
- Session-based persistence of checked items during modal view
- Visual feedback with strikethrough text and reduced opacity for checked items
- Click anywhere on ingredient row to toggle checkbox state

#### Input Validation System
- Real-time validation for ingredient fields on blur and form submission
- Visual error indicators with red borders and error messages
- Validation rules: name (required), quantity (must be greater than zero), unit (required)
- Form-level validation for title and instructions
- Error clearing as user types for immediate feedback

#### Tools Menu Interface
- Consolidated recipe actions into single gear button menu
- Dropdown menu containing Edit and Delete actions
- Automatic menu closure on outside click
- Single menu open state enforcement

### Changed

#### Wider Add/Edit Recipe Modal
- Increased modal width from 500px to 900px
- Five-column ingredient row layout: name, quantity, unit, bookmark, remove
- Background shading on ingredient rows for visual separation
- All parameter fields visible without horizontal scrolling

#### Color Scheme Update
- Primary color changed to deep forest green (#225603)
- Secondary color set to fresh lime green (#779400)
- Accent color set to warm gold (#c5a009)
- Background set to warm cream (#faf7f2)
- Tag styling updated to light green background with deep green text
- All colors chosen based on color theory principles for food applications

#### Typography
- Updated font stack to prioritize Segoe UI, Georgia, and Merriweather
- Improved readability across all screen sizes
- Maintained system font fallbacks for performance

#### Filter Behavior Fix
- Fixed favorite toggle to preserve current filter state
- Star clicks no longer reset active filters
- Favorites and tag filters now work independently without interference

### Technical Changes

#### Database Schema
- Added `is_favorite` column to recipes table (Boolean, default=False)
- Added `is_bookmarked` column to ingredients table (Boolean, default=False)
- Created tags table with id and name columns
- Created recipe_tags association table for many-to-many relationship

#### API Endpoints
- `GET /api/recipes/favorites` - Retrieve favorited recipes
- `PATCH /api/recipes/{id}/favorite` - Toggle recipe favorite status
- `GET /api/recipes/tags` - List all tags
- `GET /api/recipes/tags/{tag_name}` - Retrieve recipes by tag
- `PATCH /api/recipes/ingredients/{ingredient_id}/bookmark` - Toggle ingredient bookmark

#### Pydantic Schemas
- Added `is_favorite` field to RecipeBase schema
- Added `tags` field (optional list of strings) to RecipeBase
- Added `is_bookmarked` field to IngredientBase schema
- Created TagBase, TagCreate, and TagResponse schemas
- Created IngredientUpdate schema for bookmark operations

#### CRUD Operations
- `get_or_create_tag(db, name)` - Retrieve or create tag by name
- `get_favorite_recipes(db, skip, limit)` - Query favorited recipes
- `get_recipes_by_tag(db, tag_name)` - Filter recipes by tag
- `get_all_tags(db)` - Retrieve all tags
- `toggle_favorite(db, recipe_id)` - Toggle recipe favorite status
- `update_ingredient_bookmark(db, ingredient_id, is_bookmarked)` - Update ingredient bookmark

### Files Modified

Backend:
- `backend/app/models/recipe.py` - Added Tag model and association table
- `backend/app/schemas/recipe.py` - Updated validation schemas
- `backend/app/crud/recipe.py` - Added CRUD operations for new features
- `backend/app/routers/recipes.py` - Added API endpoints

Frontend:
- `frontend/index.html` - Added filter controls and tags input
- `frontend/css/styles.css` - Updated responsive design and color scheme
- `frontend/js/api.js` - Added API client methods
- `frontend/js/app.js` - Implemented all new features

### Migration Notes

Database recreation required for new schema. SQLAlchemy handles table creation automatically on application startup. Existing recipes remain functional without tags or favorites; these can be added through the edit interface.

---

**Release Date:** April 5, 2026
**Version:** 2.2.0
**Status:** Production Ready
