# Feature Demo Guide

This guide provides visual representations of each feature using text-based layouts for reference.

## Feature 1: Responsive Design

### Mobile View (up to 640px)

```
+---------------------------+
|  Recipe Manager           |
|  [Find] [+ Add Recipe]    |
+---------------------------+
| [Search recipes...] [S]   |
+---------------------------+
| Filter by:                |
| [Favorites] [All]         |
| Tags: [dropdown]          |
+---------------------------+
| +-----------------------+ |
| | Recipe Title          | |
| | [tag1] [tag2]         | |
| | 3 ingredients         | |
| +-----------------------+ |
+---------------------------+
```

### Desktop View (above 1024px)

```
+--------------------------------------------------------------+
|  Recipe Manager              [Find Random] [+ Add Recipe]    |
+--------------------------------------------------------------+
| [Search recipes...                          ] [Search]        |
| Filter: [Favorites] [All] Tags: [dropdown]                   |
+--------------------------------------------------------------+
| +-----------------------+  +-----------------------+         |
| | Recipe 1 (star)       |  | Recipe 2 (star)       |         |
| | [tag1] [tag2]         |  | [italian]             |         |
| | 5 ingredients         |  | 3 ingredients         |         |
| +-----------------------+  +-----------------------+         |
+--------------------------------------------------------------+
```

## Feature 2: Recipe Modal (900px wide)

```
+--------------------------------------------------------------------+
| Add Recipe                                                    [x]  |
+--------------------------------------------------------------------+
| Title: [Pasta Carbonara                        ]                   |
|                                                                     |
| Description:                                                        |
| [Classic Italian pasta dish with creamy egg sauce               ]   |
| [                                                                    ] |
|                                                                     |
| Instructions:                                                       |
| [1. Boil pasta in salted water                                  ]   |
| [2. Cook guanciale until crispy                                 ]   |
| [3. Mix eggs and Parmesan                                       ]   |
| [                                                                 ] |
|                                                                     |
| Tags (comma-separated): [italian, pasta, quick       ]             |
|                                                                     |
| Recipe Image:                                                       |
| +----------------------------------------------------------------+ |
| |  [Click to upload an image]                                    | |
| |  JPG, PNG, WebP, GIF (max 10MB)                                | |
| +----------------------------------------------------------------+ |
|                                                                     |
| Ingredients:                                                        |
| +----------------------------------------------------------------+ |
| | Name          | Qty | Unit  | Bkmk | Remove |                   | |
| | Spaghetti     | 400 | g     |  [x] |   x    |                   | |
| | Guanciale     | 200 | g     |  [x] |   x    |                   | |
| | Eggs          |   4 | pcs   |  [x] |   x    |                   | |
| | Parmesan      | 100 | g     |  [x] |   x    |                   | |
| +----------------------------------------------------------------+ |
| [+ Add Ingredient]                                                |
|                                                                     |
|                        [Cancel] [Save Recipe]                      |
+--------------------------------------------------------------------+
```

Ingredient row columns:
1. Name (widest) - Ingredient name input
2. Quantity - Numeric quantity input
3. Unit - Measurement unit input (g, ml, pcs)
4. Bookmark - Toggle button for marking important ingredients
5. Remove - Delete ingredient row

## Feature 3: Input Validation

### Example with validation errors

```
Ingredients:
+----------------------------------------------------------------+
| Name          | Qty | Unit  | Bkmk | Remove |                   |
|               | 200 | g     |  [ ] |   x    |  <- Empty name    |
| Flour         |     | g     |  [ ] |   x    |  <- Missing qty   |
| Sugar         | 100 |       |  [ ] |   x    |  <- Empty unit    |
+----------------------------------------------------------------+
Error: Please fill in all fields correctly
```

Validation rules:
- Name field: Required, must not be empty
- Quantity field: Required, must be a number greater than zero
- Unit field: Required, must not be empty
- Title field: Required for recipe
- Instructions field: Required for recipe

Validation behavior:
- On field blur: Immediate validation with visual error indicators
- On user input: Error indicators cleared as user types
- On form submission: All rows validated before saving

## Feature 4: Ingredient Checklist

Recipe detail view displays ingredients with checkboxes:

```
+----------------------------------------------------------------+
| Pasta Carbonara                                           [x]  |
+----------------------------------------------------------------+
| [Recipe image if available]                                    |
|                                                                 |
| Classic Italian pasta dish with creamy egg sauce               |
|                                                                 |
| [italian] [pasta] [quick]                                       |
|                                                                 |
| Instructions:                                                   |
| +------------------------------------------------------------+ |
| | 1. Boil pasta in salted water                                | |
| | 2. Cook guanciale until crispy                               | |
| | 3. Mix eggs and Parmesan                                     | |
| | 4. Combine everything                                        | |
| +------------------------------------------------------------+ |
|                                                                 |
| Ingredients (star = bookmarked):                               |
| [ ] Spaghetti 400 g                                            |
| [x] Guanciale 200 g *                                          |
| [ ] Eggs 4 pcs                                                 |
| [x] Parmesan 100 g *                                           |
|                                                                 |
+----------------------------------------------------------------+
```

Features:
- Click checkbox or anywhere on the ingredient line to toggle
- Checked items display with strikethrough and reduced opacity
- Star symbol (*) indicates bookmarked ingredients
- Checkbox state persists during the current session only
- State cleared when recipe detail modal is closed

## Feature 5: Recipe Favorites

Recipe card with favorite button:

```
+------------------------------------------+
| * Spaghetti Carbonara         [gear]     |  <- Star = favorited
| Creamy Italian pasta dish                |
| [italian] [pasta] [quick]                |
| 5 ingredients - Updated 4/5/2026        |
+------------------------------------------+

+------------------------------------------+
| o Chicken Salad               [gear]     |  <- Empty star = not favorited
| Fresh and healthy salad                  |
| [healthy] [quick]                        |
| 4 ingredients - Updated 4/4/2026        |
+------------------------------------------+
```

Filter controls:
```
Filter by: [Favorites] [All Recipes]
```

- Clicking "Favorites" displays only favorited recipes
- Clicking "All Recipes" resets to the full recipe list
- Toggling the star on a recipe does not change the active filter

## Feature 6: Tagging System

Adding tags in the recipe form:
```
Tags (comma-separated): [vegetarian, quick, italian   ]
Enter tags separated by commas
```

Tags displayed on recipe card:
```
+------------------------------------------+
| * Pasta Carbonara             [gear]     |
| Classic Italian dish                     |
| +--------------------------------------+ |
| | [italian] [pasta] [quick]            | | <- Click to filter
| +--------------------------------------+ |
| 5 ingredients - Updated 4/5/2026        |
+------------------------------------------+
```

Tag filter dropdown:
```
Tags: [All Tags v]
      |
      +- All Tags
      +- italian
      +- quick
      +- vegetarian
      +- pasta
      +- healthy
```

Features:
- Tags created automatically if they do not exist
- Case-insensitive tag matching
- Click any tag badge to filter by that tag
- Use dropdown selector to filter by tag
- Reset filter by selecting "All Tags"

## Feature 7: Ingredient Bookmarks

In add/edit modal:
```
+----------------------------------------------------------------+
| Name          | Qty | Unit  | Bkmk | Remove |                   |
| Spaghetti     | 400 | g     |  [*] |   x    |  <- Bookmarked    |
| Guanciale     | 200 | g     |  [*] |   x    |  <- Bookmarked    |
| Black pepper  |   1 | g     |  [ ] |   x    |  <- Not bookmarked|
+----------------------------------------------------------------+
```

In recipe detail view:
```
Ingredients (star = bookmarked):
  [ ] Spaghetti 400 g *          <- Bookmarked ingredient
  [ ] Guanciale 200 g *
  [ ] Black pepper 1 g           <- Not bookmarked
  [ ] Eggs 4 pcs *
```

Bookmark button states:
- Empty star: Not bookmarked
- Filled star with accent color: Bookmarked

Use cases:
- Mark important or hard-to-find ingredients
- Create focused shopping lists (future feature)
- Quick reference for critical items

## Tools Menu

Recipe card with tools menu:
```
+------------------------------------------+
| * Pasta Carbonara             [gear v]   |
| Classic Italian dish                     |
| [italian] [pasta] [quick]                |
| 5 ingredients - Updated 4/5/2026        |
+------------------------------------------+
                              +------------+
                              | Edit       |
                              | Delete     |
                              +------------+
```

- Gear button reveals dropdown menu with Edit and Delete actions
- Only one menu can be open at a time
- Menu closes automatically when clicking outside
- Menu closes after selecting an action

## Color Scheme

Current color palette (food-themed):

```
Primary (Deep Green):     #225603
Primary Hover:            #1a4202
Secondary (Lime Green):   #779400
Secondary Hover:          #5f7700
Danger (Red):             #e74c3c
Danger Hover:             #c0392b
Success (Lime Green):     #779400
Accent (Gold):            #c5a009
Background (Cream):       #faf7f2
Surface (White):          #ffffff
Text (Dark Gray):         #2c3e50
Text Light (Medium Gray): #7f8c8d
Border (Light Gray):      #e8e4de
Tag Background:           #e8f0d4
Tag Text:                 #225603
```

## Responsive Breakpoints

```
Mobile:     Up to 640px     - Single column, stacked layout
Tablet:     641px to 1024px - Wider modals, balanced spacing
Desktop:    Above 1024px    - Full layout, 900px modals
```

## Quick Test Flow

1. Start application: `docker-compose up -d`
2. Open browser: `http://localhost:3000`
3. Add recipe:
   - Click "Add Recipe"
   - Enter title and tags (comma-separated)
   - Add ingredients with bookmarks
   - Save
4. Test features:
   - Click favorite star on recipe cards
   - Click tag badges to filter
   - Open recipe detail, use ingredient checklist
   - Toggle ingredient bookmarks
   - Search recipes
   - Resize browser to verify responsive behavior

---

All features are production-ready and tested across mobile, tablet, and desktop viewports.
