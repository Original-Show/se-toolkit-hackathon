# Quick Feature Demo Guide

## 🎯 Feature 1: Responsive Design

### Mobile View (≤640px)
```
┌─────────────────────────┐
│  Recipe Manager         │
│  [🎲 Find] [+ Add]      │
├─────────────────────────┤
│ [Search recipes...] [S] │
├─────────────────────────┤
│ Filter by:              │
│ [⭐ Fav] [All]          │
│ Tags: [dropdown ▼]      │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ ☆ Recipe Title      │ │
│ │ [Edit] [Delete]     │ │
│ │ [tag1] [tag2]       │ │
│ │ 3 ingredients       │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Desktop View (>1024px)
```
┌──────────────────────────────────────────────────────┐
│  Recipe Manager              [🎲 Find] [+ Add Recipe] │
├──────────────────────────────────────────────────────┤
│ [Search recipes...              ] [Search]            │
│ Filter: [⭐ Favorites] [All] Tags: [dropdown ▼]       │
├──────────────────────────────────────────────────────┤
│ ┌────────────────────────┐ ┌────────────────────────┐│
│ │ ⭐ Recipe 1            │ │ ☆ Recipe 2             ││
│ │ [Edit] [Delete]        │ │ [Edit] [Delete]        ││
│ │ [quick] [vegetarian]   │ │ [italian]              ││
│ │ 5 ingredients          │ │ 3 ingredients          ││
│ └────────────────────────┘ └────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

---

## 📝 Feature 2: Wide Add/Edit Recipe Modal (900px)

```
┌────────────────────────────────────────────────────────────┐
│ Add Recipe                                            [×]  │
├────────────────────────────────────────────────────────────┤
│ Title: [Pasta Carbonara              ]                     │
│                                                             │
│ Description:                                                │
│ [Classic Italian pasta dish                             ]   │
│ [                                                          ]│
│                                                             │
│ Instructions:                                               │
│ [1. Boil pasta                                           ] │
│ [2. Cook guanciale                                     ]   │
│ [3. Mix eggs and cheese                                ]   │
│ [                                                         ]│
│                                                             │
│ Tags: [italian, pasta, quick        ]                       │
│ (Enter tags separated by commas)                            │
│                                                             │
│ Recipe Image:                                               │
│ ┌──────────────────────────────────────────────────────┐   │
│ │  📷                                                   │   │
│ │  Click to upload an image                            │   │
│ │  JPG, PNG, WebP, GIF (max 10MB)                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ Ingredients:                                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Name         │ Qty │ Unit  │ ★ │ × │                 │   │
│ │ Spaghetti    │ 400 │ g     │ ☆ │ × │                 │   │
│ │ Guanciale    │ 200 │ g     │ ★ │ × │                 │   │
│ │ Eggs         │   4 │ pcs   │ ★ │ × │                 │   │
│ │ Parmesan     │ 100 │ g     │ ★ │ × │                 │   │
│ └──────────────────────────────────────────────────────┘   │
│ [+ Add Ingredient]                                          │
│                                                             │
│                    [Cancel] [Save Recipe]                   │
└────────────────────────────────────────────────────────────┘
```

**Ingredient Row Columns:**
1. **Name** (widest) - Ingredient name
2. **Qty** - Numeric quantity
3. **Unit** - Measurement unit (g, ml, pcs, etc.)
4. **★** - Bookmark toggle button
5. **×** - Remove ingredient button

---

## ✅ Feature 3: Input Validation

### Example with Errors:
```
Ingredients:
┌──────────────────────────────────────────────────────┐
│ Name         │ Qty │ Unit  │ ★ │ × │                │
│              │ 200 │ g     │ ☆ │ × │                │ ← Empty name (red border)
│ Flour        │     │ g     │ ☆ │ × │                │ ← Missing qty (red border)
│ Sugar        │ 100 │       │ ☆ │ × │                │ ← Empty unit (red border)
└──────────────────────────────────────────────────────┘
⚠️ Please fill in all fields correctly
```

### Validation Rules:
- ✅ Name: Must not be empty
- ✅ Quantity: Must be a number > 0
- ✅ Unit: Must not be empty
- ✅ Title: Required
- ✅ Instructions: Required

---

## ☑️ Feature 4: Ingredient Checklist

### Recipe Detail View:
```
┌────────────────────────────────────────────────────────┐
│ Pasta Carbonara                                   [×]  │
├────────────────────────────────────────────────────────┤
│ [Recipe image if available]                            │
│                                                         │
│ Classic Italian pasta dish with creamy egg sauce       │
│                                                         │
│ [italian] [pasta] [quick]                               │
│                                                         │
│ Instructions:                                           │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 1. Boil pasta in salted water                      │ │
│ │ 2. Cook guanciale until crispy                     │ │
│ │ 3. Mix eggs and Parmesan                           │ │
│ │ 4. Combine everything                              │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ Ingredients (☆ = bookmarked):                           │
│ ☑ ☐ Spaghetti 400 g                                    │
│ ☑ ☑ Guanciale 200 g ☆                                  │
│ ☑ ☐ Eggs 4 pcs                                         │
│ ☑ ☑ Parmesan 100 g ☆                                   │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Features:**
- Click checkbox or anywhere on the line
- Checked items get strikethrough and fade
- ☆ shows bookmarked ingredients
- Perfect for shopping/cooking prep

---

## ⭐ Feature 5: Recipe Favorites

### Recipe Card with Favorite Button:
```
┌────────────────────────────────────────┐
│ ⭐ Spaghetti Carbonara    [Edit][Del]  │ ← Filled star = favorite
│ Creamy Italian pasta dish              │
│ [italian] [pasta] [quick]               │
│ 5 ingredients · Updated 4/5/2026       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ☆ Chicken Salad           [Edit][Del]  │ ← Empty star = not favorite
│ Fresh and healthy salad                │
│ [healthy] [quick]                       │
│ 4 ingredients · Updated 4/4/2026       │
└────────────────────────────────────────┘
```

### Filter Controls:
```
Filter by: [⭐ Favorites] [All Recipes]
```

**Click "⭐ Favorites"** → Shows only favorited recipes
**Click "All Recipes"** → Shows all recipes

---

## 🏷️ Feature 6: Tagging System

### Adding Tags in Recipe Form:
```
Tags (comma-separated): [vegetarian, quick, italian   ]
Enter tags separated by commas
```

### Tags Display on Recipe Card:
```
┌────────────────────────────────────────┐
│ ⭐ Pasta Carbonara        [Edit][Del]  │
│ Classic Italian dish                   │
│ ┌──────────────────────────────────┐   │
│ │ [italian] [pasta] [quick]        │   │ ← Click to filter
│ └──────────────────────────────────┘   │
│ 5 ingredients · Updated 4/5/2026       │
└────────────────────────────────────────┘
```

### Tag Filter Dropdown:
```
Tags: [All Tags ▼]
      │
      ├─ All Tags
      ├─ italian
      ├─ quick
      ├─ vegetarian
      ├─ pasta
      └─ healthy
```

**Features:**
- Auto-creates tags if they don't exist
- Case-insensitive matching
- Click any tag pill to filter
- Use dropdown to select tags
- Reset by choosing "All Tags"

---

## ☆ Feature 7: Ingredient Bookmarks

### In Add/Edit Modal:
```
┌──────────────────────────────────────────────────────┐
│ Name         │ Qty │ Unit  │ ★ │ × │                │
│ Spaghetti    │ 400 │ g     │ ★ │ × │ ← Bookmarked    │
│ Guanciale    │ 200 │ g     │ ★ │ × │ ← Bookmarked    │
│ Black pepper │   1 │ g     │ ☆ │ × │ ← Not bookmarked│
└──────────────────────────────────────────────────────┘
```

### In Recipe Detail:
```
Ingredients (☆ = bookmarked):
  ☐ Spaghetti 400 g ☆          ← Bookmarked ingredient
  ☐ Guanciale 200 g ☆
  ☐ Black pepper 1 g           ← Not bookmarked
  ☐ Eggs 4 pcs ☆
```

**Bookmark Button States:**
- ☆ (empty) = Not bookmarked
- ★ (filled/purple) = Bookmarked

**Use Cases:**
- Mark important ingredients
- Create focused shopping lists
- Quick reference for key items

---

## 🎨 Color Scheme

```
Primary (Purple):    #4f46e5  ← Tags, bookmark buttons
Primary Hover:       #4338ca
Secondary (Gray):    #6b7280  ← Secondary buttons
Danger (Red):        #ef4444  ← Delete buttons
Success (Green):     #10b981  ← Success states
Background:          #f3f4f6  ← Page background
Surface:             #ffffff  ← Card backgrounds
```

---

## 📱 Responsive Breakpoints

```
Mobile:     ≤640px   → Single column, stacked layout
Tablet:     641-1024px → Wider modals, better spacing
Desktop:    >1024px  → Full layout, 900px modals
```

---

## 🚀 Quick Test Flow

1. **Start app:** `docker-compose up -d`
2. **Open browser:** `http://localhost:3000`
3. **Add recipe:**
   - Click "+ Add Recipe"
   - Title: "Test Recipe"
   - Tags: "test, quick"
   - Add ingredients, bookmark some
   - Save
4. **Test features:**
   - ⭐ Click favorite star
   - 🏷️ Click tag filter
   - ☑️ Open recipe, use checklist
   - 🔍 Search recipes
   - 📱 Resize browser to test responsive

---

**All features are production-ready and fully tested!** 🎉
