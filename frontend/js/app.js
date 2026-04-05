/**
 * Main application logic for the Recipe Manager frontend V2.
 * Updated with favorites, tags, bookmarks, validation, and checklist features.
 */
document.addEventListener('DOMContentLoaded', () => {
    // State
    let recipes = [];
    let allTags = [];
    let editingRecipeId = null;
    let selectedImageFile = null;
    let hasActiveLLMKey = false;
    let currentFilter = 'all'; // 'all', 'favorites', or tag name
    let checkedIngredients = new Set(); // For checklist feature

    // DOM Elements
    const recipeListEl = document.getElementById('recipeList');
    const addRecipeBtn = document.getElementById('addRecipeBtn');
    const llmFindBtn = document.getElementById('llmFindBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const recipeModal = document.getElementById('recipeModal');
    const recipeDetailModal = document.getElementById('recipeDetailModal');
    const llmModal = document.getElementById('llmModal');
    const modalTitle = document.getElementById('modalTitle');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    const closeLLMModalBtn = document.getElementById('closeLLMModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const llmCancelBtn = document.getElementById('llmCancelBtn');
    const recipeForm = document.getElementById('recipeForm');
    const llmForm = document.getElementById('llmForm');
    const ingredientsList = document.getElementById('ingredientsList');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const recipeCheckboxes = document.getElementById('recipeCheckboxes');
    const generateListBtn = document.getElementById('generateListBtn');
    const shoppingListResult = document.getElementById('shoppingListResult');
    const llmKeyForm = document.getElementById('llmKeyForm');
    const llmKeyStatus = document.getElementById('llmKeyStatus');
    const llmLoading = document.getElementById('llmLoading');
    const llmResult = document.getElementById('llmResult');
    const filterControls = document.getElementById('filterControls');
    const showFavoritesBtn = document.getElementById('showFavoritesBtn');
    const showAllBtn = document.getElementById('showAllBtn');
    const tagFilterGroup = document.getElementById('tagFilterGroup');
    const tagFilterSelect = document.getElementById('tagFilterSelect');

    // Image upload elements
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('recipeImageInput');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const imagePreview = document.getElementById('imagePreview');
    const imageRemoveBtn = document.getElementById('imageRemoveBtn');

    // ===== Auto-resize textareas =====
    function initAutoResize(textarea) {
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
        });
    }

    document.querySelectorAll('.form__textarea--autoresize').forEach(initAutoResize);

    // ===== Recipe List Rendering =====
    function renderRecipeList(recipesToRender) {
        if (recipesToRender.length === 0) {
            recipeListEl.innerHTML = '<div class="empty-state">No recipes yet. Add your first recipe!</div>';
            return;
        }

        recipeListEl.innerHTML = recipesToRender.map(recipe => `
            <div class="recipe-card" data-id="${recipe.id}">
                ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${escapeHtml(recipe.title)}" class="recipe-card__image">` : ''}
                <div class="recipe-card__header">
                    <div class="recipe-card__title-wrapper">
                        <h3 class="recipe-card__title">${escapeHtml(recipe.title)}</h3>
                        <button class="recipe-card__favorite" data-id="${recipe.id}" title="${recipe.is_favorite ? 'Remove from favorites' : 'Add to favorites'}">
                            ${recipe.is_favorite ? '⭐' : '☆'}
                        </button>
                    </div>
                    <div class="recipe-card__tools">
                        <button class="recipe-card__tools-btn" data-id="${recipe.id}" title="More actions">⚙️</button>
                        <div class="recipe-card__tools-menu" id="tools-menu-${recipe.id}">
                            <button class="edit-btn" data-id="${recipe.id}">✏️ Edit Recipe</button>
                            <button class="delete-btn btn--danger" data-id="${recipe.id}">🗑️ Delete Recipe</button>
                        </div>
                    </div>
                </div>
                ${recipe.description ? `<p class="recipe-card__description">${escapeHtml(recipe.description)}</p>` : ''}
                ${recipe.tags && recipe.tags.length > 0 ? `
                    <div class="recipe-tags">
                        ${recipe.tags.map(tag => `<span class="recipe-tag" data-tag="${escapeHtml(tag.name)}">${escapeHtml(tag.name)}</span>`).join('')}
                    </div>
                ` : ''}
                <p class="recipe-card__meta">${recipe.ingredients.length} ingredients &middot; Updated ${formatDate(recipe.updated_at)}</p>
            </div>
        `).join('');

        // Add event listeners for recipe cards (click to view detail)
        recipeListEl.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open detail if clicking on interactive elements
                if (e.target.closest('.recipe-card__favorite') ||
                    e.target.closest('.recipe-card__tools-btn') ||
                    e.target.closest('.recipe-card__tools-menu') ||
                    e.target.closest('.recipe-tag')) return;
                showRecipeDetail(parseInt(card.dataset.id));
            });
        });

        // Favorite button listeners - DOES NOT change filter
        recipeListEl.querySelectorAll('.recipe-card__favorite').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await toggleRecipeFavorite(parseInt(btn.dataset.id));
                // Keep the tools menu closed and don't change filter
                closeAllToolsMenus();
            });
        });

        // Tools menu button
        recipeListEl.querySelectorAll('.recipe-card__tools-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = btn.dataset.id;
                const menu = document.getElementById(`tools-menu-${recipeId}`);
                const isOpen = menu.classList.contains('show');
                
                // Close all other menus first
                closeAllToolsMenus();
                
                // Toggle this menu
                if (!isOpen) {
                    menu.classList.add('show');
                }
            });
        });

        // Tag click listeners
        recipeListEl.querySelectorAll('.recipe-tag').forEach(tag => {
            tag.addEventListener('click', async (e) => {
                e.stopPropagation();
                const tagName = tag.dataset.tag;
                await filterByTag(tagName);
            });
        });

        // Edit button in tools menu
        recipeListEl.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(parseInt(btn.dataset.id));
                closeAllToolsMenus();
            });
        });

        // Delete button in tools menu
        recipeListEl.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRecipe(parseInt(btn.dataset.id));
                closeAllToolsMenus();
            });
        });
    }

    function closeAllToolsMenus() {
        document.querySelectorAll('.recipe-card__tools-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    function renderShoppingListCheckboxes() {
        recipeCheckboxes.innerHTML = recipes.map(recipe => `
            <label>
                <input type="checkbox" value="${recipe.id}">
                ${escapeHtml(recipe.title)}
            </label>
        `).join('');
    }

    async function loadTags() {
        try {
            allTags = await api.getAllTags();
            
            // Update tag filter dropdown
            const currentValue = tagFilterSelect.value;
            tagFilterSelect.innerHTML = '<option value="">All Tags</option>';
            allTags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.name;
                option.textContent = tag.name;
                tagFilterSelect.appendChild(option);
            });
            tagFilterSelect.value = currentValue;
            
            // Show tag filter if there are tags
            if (allTags.length > 0) {
                tagFilterGroup.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    // ===== Modal Management =====
    function openAddModal() {
        editingRecipeId = null;
        selectedImageFile = null;
        modalTitle.textContent = 'Add Recipe';
        recipeForm.reset();
        ingredientsList.innerHTML = '';
        resetImageUpload();
        addIngredientRow();
        // Reset textarea heights
        document.querySelectorAll('.form__textarea--autoresize').forEach(ta => {
            ta.style.height = 'auto';
        });
        recipeModal.style.display = 'flex';
    }

    async function openEditModal(id) {
        const recipe = await api.getRecipe(id);
        if (!recipe) return;

        editingRecipeId = id;
        selectedImageFile = null;
        modalTitle.textContent = 'Edit Recipe';
        document.getElementById('recipeTitle').value = recipe.title;
        document.getElementById('recipeDescription').value = recipe.description || '';
        document.getElementById('recipeInstructions').value = recipe.instructions;
        
        // Set tags
        const tagsString = recipe.tags ? recipe.tags.map(t => t.name).join(', ') : '';
        document.getElementById('recipeTags').value = tagsString;

        // Trigger auto-resize
        document.querySelectorAll('.form__textarea--autoresize').forEach(ta => {
            ta.dispatchEvent(new Event('input'));
        });

        // Image
        if (recipe.image_url) {
            imagePreview.src = recipe.image_url;
            imagePreview.style.display = 'block';
            imagePlaceholder.style.display = 'none';
            imageRemoveBtn.style.display = 'flex';
        } else {
            resetImageUpload();
        }

        ingredientsList.innerHTML = '';
        recipe.ingredients.forEach(ing => addIngredientRow(ing));

        recipeModal.style.display = 'flex';
    }

    function closeModal() {
        recipeModal.style.display = 'none';
    }

    async function showRecipeDetail(id) {
        const recipe = await api.getRecipe(id);
        if (!recipe) return;

        document.getElementById('detailTitle').textContent = recipe.title;
        let html = '';
        if (recipe.image_url) {
            html += `<img src="${recipe.image_url}" alt="${escapeHtml(recipe.title)}" class="recipe-detail__image">`;
        }
        if (recipe.description) {
            html += `<p>${escapeHtml(recipe.description)}</p>`;
        }
        
        // Add tags
        if (recipe.tags && recipe.tags.length > 0) {
            html += `
                <div class="recipe-tags">
                    ${recipe.tags.map(tag => `<span class="recipe-tag">${escapeHtml(tag.name)}</span>`).join('')}
                </div>
            `;
        }
        
        html += `
            <h3>Instructions</h3>
            <pre>${escapeHtml(recipe.instructions)}</pre>
            <h3>Ingredients ${recipe.ingredients.some(ing => ing.is_bookmarked) ? '(☆ = bookmarked)' : ''}</h3>
            <ul class="recipe-checklist">
                ${recipe.ingredients.map(ing => `
                    <li data-ingredient-id="${ing.id}" class="${checkedIngredients.has(ing.id) ? 'checked' : ''}">
                        <input type="checkbox" ${checkedIngredients.has(ing.id) ? 'checked' : ''}>
                        <span class="ingredient-text">
                            ${ing.is_bookmarked ? '☆ ' : ''}${ing.quantity} ${escapeHtml(ing.unit)} ${escapeHtml(ing.name)}
                        </span>
                        <button class="btn btn--small btn--secondary ingredient-bookmark-toggle" data-ingredient-id="${ing.id}">
                            ${ing.is_bookmarked ? '☆' : '☆'}
                        </button>
                    </li>
                `).join('')}
            </ul>
        `;
        document.getElementById('recipeDetail').innerHTML = html;
        
        // Add event listeners for checkboxes
        document.querySelectorAll('.recipe-checklist li').forEach(li => {
            const checkbox = li.querySelector('input[type="checkbox"]');
            const ingredientId = parseInt(li.dataset.ingredientId);
            
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    checkedIngredients.add(ingredientId);
                    li.classList.add('checked');
                } else {
                    checkedIngredients.delete(ingredientId);
                    li.classList.remove('checked');
                }
            });
            
            li.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        });
        
        // Add event listeners for bookmark toggle
        document.querySelectorAll('.ingredient-bookmark-toggle').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const ingredientId = parseInt(btn.dataset.ingredientId);
                await toggleIngredientBookmark(ingredientId, recipe.id);
            });
        });
        
        recipeDetailModal.style.display = 'flex';
    }

    function closeDetailModal() {
        recipeDetailModal.style.display = 'none';
        checkedIngredients.clear();
    }

    // ===== Image Upload =====
    function resetImageUpload() {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        imagePlaceholder.style.display = 'block';
        imageRemoveBtn.style.display = 'none';
        imageInput.value = '';
        selectedImageFile = null;
    }

    imageUploadArea.addEventListener('click', (e) => {
        if (e.target === imageRemoveBtn) return;
        imageInput.click();
    });

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (!file) return;

        // Validate
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('Image must be smaller than 10MB.');
            return;
        }

        selectedImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            imagePlaceholder.style.display = 'none';
            imageRemoveBtn.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    });

    imageRemoveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetImageUpload();
    });

    // ===== Ingredient Row Management =====
    function addIngredientRow(data = {}) {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        row.innerHTML = `
            <input type="text" placeholder="Ingredient name" value="${escapeHtml(data.name || '')}" required data-field="name">
            <input type="number" placeholder="Qty" step="0.01" min="0.01" value="${data.quantity || ''}" required data-field="quantity">
            <input type="text" placeholder="Unit (g, ml, pcs)" value="${escapeHtml(data.unit || '')}" required data-field="unit">
            <button type="button" class="ingredient-bookmark-btn" title="${data.is_bookmarked ? 'Remove bookmark' : 'Add bookmark'}" data-bookmarked="${data.is_bookmarked || false}">
                ${data.is_bookmarked ? '★' : '☆'}
            </button>
            <button type="button" class="ingredient-remove" title="Remove ingredient">&times;</button>
        `;
        
        // Add real-time validation
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateIngredientRow(row));
            input.addEventListener('input', () => {
                // Clear error as user types
                input.classList.remove('input-error');
                const existingError = row.querySelector('.validation-error');
                if (existingError) existingError.remove();
            });
        });
        
        // Bookmark button listener
        row.querySelector('.ingredient-bookmark-btn').addEventListener('click', () => {
            const btn = row.querySelector('.ingredient-bookmark-btn');
            const isBookmarked = btn.dataset.bookmarked === 'true';
            btn.dataset.bookmarked = !isBookmarked;
            btn.textContent = isBookmarked ? '☆' : '★';
            btn.classList.toggle('bookmarked');
        });
        
        // Remove button listener
        row.querySelector('.ingredient-remove').addEventListener('click', () => row.remove());
        
        ingredientsList.appendChild(row);
    }

    function getIngredientsFromForm() {
        const rows = ingredientsList.querySelectorAll('.ingredient-row');
        return Array.from(rows).map(row => {
            const inputs = row.querySelectorAll('input');
            const bookmarkBtn = row.querySelector('.ingredient-bookmark-btn');
            return {
                name: inputs[0].value.trim(),
                quantity: parseFloat(inputs[1].value),
                unit: inputs[2].value.trim(),
                is_bookmarked: bookmarkBtn.dataset.bookmarked === 'true',
            };
        }).filter(ing => ing.name && ing.quantity && ing.unit);
    }

    // ===== Validation =====
    function validateIngredientRow(row) {
        const inputs = row.querySelectorAll('input');
        const name = inputs[0].value.trim();
        const quantity = inputs[1].value;
        const unit = inputs[2].value.trim();
        let isValid = true;
        
        // Clear previous errors
        inputs.forEach(input => input.classList.remove('input-error'));
        const existingError = row.querySelector('.validation-error');
        if (existingError) existingError.remove();
        
        // Validate name
        if (!name) {
            inputs[0].classList.add('input-error');
            isValid = false;
        }
        
        // Validate quantity
        if (!quantity || parseFloat(quantity) <= 0) {
            inputs[1].classList.add('input-error');
            isValid = false;
        }
        
        // Validate unit
        if (!unit) {
            inputs[2].classList.add('input-error');
            isValid = false;
        }
        
        if (!isValid) {
            const error = document.createElement('span');
            error.className = 'validation-error';
            error.textContent = 'Please fill in all fields correctly';
            row.appendChild(error);
        }
        
        return isValid;
    }

    function validateForm() {
        const title = document.getElementById('recipeTitle').value.trim();
        const instructions = document.getElementById('recipeInstructions').value.trim();
        
        if (!title) {
            alert('Please enter a recipe title');
            return false;
        }
        
        if (!instructions) {
            alert('Please enter instructions');
            return false;
        }
        
        // Validate all ingredient rows
        const rows = ingredientsList.querySelectorAll('.ingredient-row');
        let allValid = true;
        rows.forEach(row => {
            if (!validateIngredientRow(row)) {
                allValid = false;
            }
        });
        
        if (rows.length > 0 && !allValid) {
            alert('Please fix the errors in ingredients');
            return false;
        }
        
        return true;
    }

    // ===== CRUD Operations =====
    async function loadRecipes() {
        recipeListEl.innerHTML = '<div class="loading">Loading recipes...</div>';
        try {
            recipes = await api.getRecipes();
            renderRecipeList(recipes);
            renderShoppingListCheckboxes();
            await loadTags();
            filterControls.style.display = 'block';
        } catch (error) {
            recipeListEl.innerHTML = `<div class="empty-state">Error loading recipes: ${error.message}</div>`;
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Parse tags from input
        const tagsString = document.getElementById('recipeTags').value.trim();
        const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];

        const data = {
            title: document.getElementById('recipeTitle').value.trim(),
            description: document.getElementById('recipeDescription').value.trim(),
            instructions: document.getElementById('recipeInstructions').value.trim(),
            ingredients: getIngredientsFromForm(),
            tags: tags,
        };

        try {
            let recipe;
            if (editingRecipeId) {
                recipe = await api.updateRecipe(editingRecipeId, data);
                // Upload image if selected
                if (selectedImageFile) {
                    recipe = await api.uploadRecipeImage(editingRecipeId, selectedImageFile);
                }
            } else {
                recipe = await api.createRecipe(data);
                // Upload image if selected
                if (selectedImageFile) {
                    recipe = await api.uploadRecipeImage(recipe.id, selectedImageFile);
                }
            }
            closeModal();
            await loadRecipes();
            await loadTags();
        } catch (error) {
            alert(`Error saving recipe: ${error.message}`);
        }
    }

    async function deleteRecipe(id) {
        if (!confirm('Are you sure you want to delete this recipe?')) return;
        try {
            await api.deleteRecipe(id);
            await loadRecipes();
            await loadTags();
        } catch (error) {
            alert(`Error deleting recipe: ${error.message}`);
        }
    }

    async function toggleRecipeFavorite(id) {
        try {
            await api.toggleRecipeFavorite(id);
            // Just reload recipes and maintain current filter view
            await loadRecipes();
            // Reapply current filter visually without changing the filter state
            if (currentFilter === 'favorites') {
                const favoriteRecipes = await api.getFavoriteRecipes();
                renderRecipeList(favoriteRecipes);
            } else if (currentFilter && currentFilter !== 'all') {
                // It's a tag filter
                const tagRecipes = await api.getRecipesByTag(currentFilter);
                renderRecipeList(tagRecipes);
            }
        } catch (error) {
            alert(`Error updating favorite status: ${error.message}`);
        }
    }

    async function toggleIngredientBookmark(ingredientId, recipeId) {
        try {
            await api.toggleIngredientBookmark(ingredientId);
            // Refresh recipe detail
            await showRecipeDetail(recipeId);
        } catch (error) {
            alert(`Error updating bookmark: ${error.message}`);
        }
    }

    async function filterByFavorites() {
        currentFilter = 'favorites';
        try {
            const favoriteRecipes = await api.getFavoriteRecipes();
            renderRecipeList(favoriteRecipes);
            showFavoritesBtn.classList.add('btn--primary');
            showFavoritesBtn.classList.remove('btn--secondary');
            showAllBtn.classList.add('btn--secondary');
            showAllBtn.classList.remove('btn--primary');
            tagFilterSelect.value = '';
        } catch (error) {
            alert(`Error filtering by favorites: ${error.message}`);
        }
    }

    async function filterByTag(tagName) {
        currentFilter = tagName;
        try {
            const tagRecipes = await api.getRecipesByTag(tagName);
            renderRecipeList(tagRecipes);
            tagFilterSelect.value = tagName;
            showFavoritesBtn.classList.add('btn--secondary');
            showFavoritesBtn.classList.remove('btn--primary');
            showAllBtn.classList.add('btn--secondary');
            showAllBtn.classList.remove('btn--primary');
        } catch (error) {
            alert(`Error filtering by tag: ${error.message}`);
        }
    }

    async function showAllRecipes() {
        currentFilter = 'all';
        await loadRecipes();
        showFavoritesBtn.classList.add('btn--secondary');
        showFavoritesBtn.classList.remove('btn--primary');
        showAllBtn.classList.add('btn--primary');
        showAllBtn.classList.remove('btn--secondary');
        tagFilterSelect.value = '';
    }

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            await showAllRecipes();
            return;
        }
        try {
            const results = await api.searchRecipes(query);
            renderRecipeList(results);
        } catch (error) {
            alert(`Error searching recipes: ${error.message}`);
        }
    }

    async function handleGenerateShoppingList() {
        const selectedIds = Array.from(recipeCheckboxes.querySelectorAll('input:checked'))
            .map(cb => parseInt(cb.value));

        if (selectedIds.length === 0) {
            alert('Please select at least one recipe.');
            return;
        }

        try {
            const result = await api.generateShoppingList(selectedIds);
            shoppingListResult.style.display = 'block';
            shoppingListResult.innerHTML = `
                <h3>Shopping List</h3>
                <ul>
                    ${result.items.map(item => `
                        <li>${item.quantity} ${escapeHtml(item.unit)} ${escapeHtml(item.name)}</li>
                    `).join('')}
                </ul>
            `;
        } catch (error) {
            alert(`Error generating shopping list: ${error.message}`);
        }
    }

    // ===== LLM Functions =====
    async function checkLLMKeyStatus() {
        try {
            const status = await api.getActiveLLMKey('openai');
            hasActiveLLMKey = status.has_active_key;
            if (hasActiveLLMKey) {
                llmKeyStatus.innerHTML = `<span class="llm-key-status llm-key-status--active">✓ API key registered (${escapeHtml(status.provider)})</span>`;
            } else {
                llmKeyStatus.innerHTML = `<span class="llm-key-status llm-key-status--inactive">No API key registered</span>`;
            }
        } catch {
            llmKeyStatus.innerHTML = `<span class="llm-key-status llm-key-status--inactive">No API key registered</span>`;
        }
    }

    async function handleLLMKeySubmit(e) {
        e.preventDefault();
        const apiKey = document.getElementById('llmApiKey').value.trim();
        if (!apiKey) return;

        try {
            await api.registerLLMKey({ api_key: apiKey, provider: 'openai' });
            document.getElementById('llmApiKey').value = '';
            await checkLLMKeyStatus();
        } catch (error) {
            alert(`Error registering API key: ${error.message}`);
        }
    }

    function openLLMModal() {
        if (!hasActiveLLMKey) {
            alert('Please register your OpenAI API key first in the LLM Integration section below.');
            return;
        }
        llmForm.reset();
        llmLoading.style.display = 'none';
        llmResult.style.display = 'none';
        llmResult.innerHTML = '';
        llmModal.style.display = 'flex';
    }

    function closeLLMModal() {
        llmModal.style.display = 'none';
    }

    async function handleLLMFormSubmit(e) {
        e.preventDefault();

        const cuisine = document.getElementById('llmCuisine').value.trim() || null;
        const dietary = document.getElementById('llmDietary').value.trim() || null;

        llmForm.style.display = 'none';
        llmLoading.style.display = 'block';
        llmResult.style.display = 'none';

        try {
            const response = await api.findRandomRecipe({
                api_key: '',  // Use stored key
                cuisine,
                dietary,
                max_results: 1,
            });

            const recipe = response.recipes[0];
            llmLoading.style.display = 'none';
            llmResult.style.display = 'block';
            llmResult.innerHTML = `
                <div class="llm-result">
                    <h3>${escapeHtml(recipe.title)}</h3>
                    ${recipe.description ? `<p>${escapeHtml(recipe.description)}</p>` : ''}
                    <h4>Ingredients</h4>
                    <ul>
                        ${recipe.ingredients.map(ing => `
                            <li>${ing.quantity} ${escapeHtml(ing.unit)} ${escapeHtml(ing.name)}</li>
                        `).join('')}
                    </ul>
                    <h4>Instructions</h4>
                    <pre>${escapeHtml(recipe.instructions)}</pre>
                    <div class="llm-result__actions">
                        <button class="btn btn--primary" id="llmSaveBtn">Save to My Recipes</button>
                        <button class="btn btn--secondary" id="llmRegenerateBtn">Try Another</button>
                    </div>
                </div>
            `;

            // Save button
            document.getElementById('llmSaveBtn').addEventListener('click', async () => {
                try {
                    await api.createRecipe({
                        title: recipe.title,
                        description: recipe.description || '',
                        instructions: recipe.instructions,
                        ingredients: recipe.ingredients,
                    });
                    closeLLMModal();
                    await loadRecipes();
                } catch (error) {
                    alert(`Error saving recipe: ${error.message}`);
                }
            });

            // Regenerate button
            document.getElementById('llmRegenerateBtn').addEventListener('click', async () => {
                llmResult.style.display = 'none';
                llmLoading.style.display = 'block';
                try {
                    const newResponse = await api.findRandomRecipe({
                        api_key: '',
                        cuisine,
                        dietary,
                        max_results: 1,
                    });
                    const newRecipe = newResponse.recipes[0];
                    llmLoading.style.display = 'none';
                    llmResult.style.display = 'block';
                    llmResult.innerHTML = `
                        <div class="llm-result">
                            <h3>${escapeHtml(newRecipe.title)}</h3>
                            ${newRecipe.description ? `<p>${escapeHtml(newRecipe.description)}</p>` : ''}
                            <h4>Ingredients</h4>
                            <ul>
                                ${newRecipe.ingredients.map(ing => `
                                    <li>${ing.quantity} ${escapeHtml(ing.unit)} ${escapeHtml(ing.name)}</li>
                                `).join('')}
                            </ul>
                            <h4>Instructions</h4>
                            <pre>${escapeHtml(newRecipe.instructions)}</pre>
                            <div class="llm-result__actions">
                                <button class="btn btn--primary" id="llmSaveBtn">Save to My Recipes</button>
                                <button class="btn btn--secondary" id="llmRegenerateBtn">Try Another</button>
                            </div>
                        </div>
                    `;
                    // Re-bind events for new buttons (recursive pattern)
                    document.getElementById('llmSaveBtn').addEventListener('click', async () => {
                        try {
                            await api.createRecipe({
                                title: newRecipe.title,
                                description: newRecipe.description || '',
                                instructions: newRecipe.instructions,
                                ingredients: newRecipe.ingredients,
                            });
                            closeLLMModal();
                            await loadRecipes();
                        } catch (error) {
                            alert(`Error saving recipe: ${error.message}`);
                        }
                    });
                    document.getElementById('llmRegenerateBtn').addEventListener('click', () => {
                        handleLLMFormSubmit(e);
                    });
                } catch (error) {
                    llmLoading.style.display = 'none';
                    llmForm.style.display = 'block';
                    alert(`Error generating recipe: ${error.message}`);
                }
            });

        } catch (error) {
            llmLoading.style.display = 'none';
            llmForm.style.display = 'block';
            alert(`Error generating recipe: ${error.message}`);
        }
    }

    // ===== Utility Functions =====
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    // ===== Event Listeners =====
    addRecipeBtn.addEventListener('click', openAddModal);
    llmFindBtn.addEventListener('click', openLLMModal);
    closeModalBtn.addEventListener('click', closeModal);
    closeDetailBtn.addEventListener('click', closeDetailModal);
    closeLLMModalBtn.addEventListener('click', closeLLMModal);
    cancelBtn.addEventListener('click', closeModal);
    llmCancelBtn.addEventListener('click', closeLLMModal);
    recipeForm.addEventListener('submit', handleFormSubmit);
    llmForm.addEventListener('submit', handleLLMFormSubmit);
    llmKeyForm.addEventListener('submit', handleLLMKeySubmit);
    addIngredientBtn.addEventListener('click', () => addIngredientRow());
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    generateListBtn.addEventListener('click', handleGenerateShoppingList);
    showFavoritesBtn.addEventListener('click', filterByFavorites);
    showAllBtn.addEventListener('click', showAllRecipes);
    tagFilterSelect.addEventListener('change', (e) => {
        const tagName = e.target.value;
        if (tagName) {
            filterByTag(tagName);
        } else {
            showAllRecipes();
        }
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === recipeModal) closeModal();
        if (e.target === recipeDetailModal) closeDetailModal();
        if (e.target === llmModal) closeLLMModal();
        // Close tools menus when clicking outside
        if (!e.target.closest('.recipe-card__tools')) {
            closeAllToolsMenus();
        }
    });

    // ===== Initial Load =====
    loadRecipes();
    checkLLMKeyStatus();
});
