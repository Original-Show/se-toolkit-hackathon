/**
 * Main application logic for the Recipe Manager frontend V2.
 * Features: favorites, tags, bookmarks, validation, checklist,
 * difficulty ratings, cooking time, smooth search, structured AI steps.
 */
document.addEventListener('DOMContentLoaded', () => {
    // State
    let recipes = [];
    let allTags = [];
    let editingRecipeId = null;
    let selectedImageFile = null;
    let hasActiveLLMKey = false;
    let currentFilter = 'all';
    let searchDebounceTimer = null;

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

    // ===== Utility Functions =====
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    function formatCookingTime(minutes) {
        if (!minutes && minutes !== 0) return '';
        const d = Math.floor(minutes / (60 * 24));
        const h = Math.floor((minutes % (60 * 24)) / 60);
        const m = minutes % 60;
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || parts.length === 0) parts.push(`${m}m`);
        return parts.join(' ');
    }

    function renderDifficultyStars(level) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<span class="difficulty-star ${i <= level ? '' : 'empty'}">★</span>`;
        }
        return html;
    }

    // ===== Recipe List Rendering =====
    function renderRecipeList(recipesToRender, animate = true) {
        if (recipesToRender.length === 0) {
            recipeListEl.innerHTML = '<div class="empty-state">No recipes yet. Add your first recipe!</div>';
            return;
        }

        const html = recipesToRender.map(recipe => {
            const cookingTime = formatCookingTime(recipe.cooking_time_minutes);
            return `
                <div class="recipe-card ${animate ? 'recipe-list-fade-enter' : ''}" data-id="${recipe.id}">
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
                    <div class="recipe-card__meta-row" style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; font-size:0.75rem; color:var(--color-text-light);">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <span class="recipe-card__difficulty">
                                <span class="difficulty-stars">${renderDifficultyStars(recipe.difficulty || 1)}</span>
                            </span>
                            ${cookingTime ? `<span class="recipe-card__cooking-time">⏱ ${cookingTime}</span>` : `<span class="recipe-card__cooking-time">⏱ --</span>`}
                        </div>
                        <span>${recipe.ingredients.length} ingredients &middot; ${formatDate(recipe.updated_at)}</span>
                    </div>
                </div>
            `;
        }).join('');

        recipeListEl.innerHTML = html;

        // Event listeners
        recipeListEl.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.recipe-card__favorite') ||
                    e.target.closest('.recipe-card__tools-btn') ||
                    e.target.closest('.recipe-card__tools-menu') ||
                    e.target.closest('.recipe-tag')) return;
                showRecipeDetail(parseInt(card.dataset.id));
            });
        });

        recipeListEl.querySelectorAll('.recipe-card__favorite').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                btn.classList.add('pop');
                setTimeout(() => btn.classList.remove('pop'), 400);
                await toggleRecipeFavorite(id);
                closeAllToolsMenus();
            });
        });

        recipeListEl.querySelectorAll('.recipe-card__tools-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = btn.dataset.id;
                const menu = document.getElementById(`tools-menu-${recipeId}`);
                const isOpen = menu.classList.contains('show');
                closeAllToolsMenus();
                if (!isOpen) menu.classList.add('show');
            });
        });

        recipeListEl.querySelectorAll('.recipe-tag').forEach(tag => {
            tag.addEventListener('click', async (e) => {
                e.stopPropagation();
                await filterByTag(tag.dataset.tag);
            });
        });

        recipeListEl.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(parseInt(btn.dataset.id));
                closeAllToolsMenus();
            });
        });

        recipeListEl.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRecipe(parseInt(btn.dataset.id));
                closeAllToolsMenus();
            });
        });
    }

    function closeAllToolsMenus() {
        document.querySelectorAll('.recipe-card__tools-menu').forEach(menu => menu.classList.remove('show'));
    }

    // ===== Tags Management =====
    async function loadTags() {
        try {
            allTags = await api.getAllTags();
            const currentValue = tagFilterSelect.value;
            tagFilterSelect.innerHTML = '<option value="">All Tags</option>';
            allTags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.name;
                option.textContent = tag.name;
                tagFilterSelect.appendChild(option);
            });
            tagFilterSelect.value = currentValue;
            tagFilterGroup.style.display = allTags.length > 0 ? 'block' : 'none';
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
        document.querySelectorAll('.form__textarea--autoresize').forEach(ta => { ta.style.height = 'auto'; });
        // Reset difficulty selector
        const diffSelect = document.getElementById('recipeDifficulty');
        if (diffSelect) diffSelect.value = '1';
        // Reset cooking time
        ['cookingDays', 'cookingHours', 'cookingMinutes'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
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

        const tagsString = recipe.tags ? recipe.tags.map(t => t.name).join(', ') : '';
        document.getElementById('recipeTags').value = tagsString;

        document.querySelectorAll('.form__textarea--autoresize').forEach(ta => {
            ta.dispatchEvent(new Event('input'));
        });

        if (recipe.image_url) {
            imagePreview.src = recipe.image_url;
            imagePreview.style.display = 'block';
            imagePlaceholder.style.display = 'none';
            imageRemoveBtn.style.display = 'flex';
        } else {
            resetImageUpload();
        }

        // Difficulty
        const diffSelect = document.getElementById('recipeDifficulty');
        if (diffSelect) diffSelect.value = recipe.difficulty || 1;

        // Cooking time
        const totalMin = recipe.cooking_time_minutes || 0;
        const d = Math.floor(totalMin / (60 * 24));
        const h = Math.floor((totalMin % (60 * 24)) / 60);
        const m = totalMin % 60;
        const daysEl = document.getElementById('cookingDays');
        const hoursEl = document.getElementById('cookingHours');
        const minEl = document.getElementById('cookingMinutes');
        if (daysEl) daysEl.value = d > 0 ? d : '';
        if (hoursEl) hoursEl.value = h > 0 ? h : '';
        if (minEl) minEl.value = (m > 0 || totalMin === 0) ? m : '';

        ingredientsList.innerHTML = '';
        recipe.ingredients.forEach(ing => addIngredientRow(ing));
        recipeModal.style.display = 'flex';
    }

    function closeModal() { recipeModal.style.display = 'none'; }

    async function showRecipeDetail(id) {
        const recipe = await api.getRecipe(id);
        if (!recipe) return;

        document.getElementById('detailTitle').textContent = recipe.title;
        let html = '';
        if (recipe.image_url) {
            html += `<img src="${recipe.image_url}" alt="${escapeHtml(recipe.title)}" class="recipe-detail__image">`;
        }
        if (recipe.description) html += `<p>${escapeHtml(recipe.description)}</p>`;
        if (recipe.tags && recipe.tags.length > 0) {
            html += `<div class="recipe-tags">${recipe.tags.map(tag => `<span class="recipe-tag">${escapeHtml(tag.name)}</span>`).join('')}</div>`;
        }

        // Difficulty and cooking time
        html += `<div style="display:flex; gap:1rem; margin:0.5rem 0; font-size:0.875rem; color:var(--color-text-light);">`;
        html += `<span>Difficulty: <span class="difficulty-stars">${renderDifficultyStars(recipe.difficulty || 1)}</span></span>`;
        html += `<span>⏱ ${formatCookingTime(recipe.cooking_time_minutes) || '--'}</span>`;
        html += `</div>`;

        html += `
            <h3>Instructions</h3>
            <pre>${escapeHtml(recipe.instructions)}</pre>
            <h3>Ingredients ${recipe.ingredients.some(ing => ing.is_bookmarked) ? '(☆ = bookmarked)' : ''}</h3>
            <ul class="recipe-checklist">
                ${recipe.ingredients.map(ing => `
                    <li data-ingredient-id="${ing.id}">
                        <input type="checkbox">
                        <span class="ingredient-text">
                            ${ing.is_bookmarked ? '☆ ' : ''}${ing.quantity} ${escapeHtml(ing.unit)} ${escapeHtml(ing.name)}
                        </span>
                        <button class="btn btn--small btn--secondary ingredient-bookmark-toggle" data-ingredient-id="${ing.id}">
                            ${ing.is_bookmarked ? '★' : '☆'}
                        </button>
                    </li>
                `).join('')}
            </ul>
        `;
        document.getElementById('recipeDetail').innerHTML = html;

        // Checkbox listeners
        document.querySelectorAll('.recipe-checklist li').forEach(li => {
            const checkbox = li.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                li.classList.toggle('checked', checkbox.checked);
            });
            li.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        });

        // Bookmark toggle
        document.querySelectorAll('.ingredient-bookmark-toggle').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await toggleIngredientBookmark(parseInt(btn.dataset.ingredientId), recipe.id);
            });
        });

        recipeDetailModal.style.display = 'flex';
    }

    function closeDetailModal() { recipeDetailModal.style.display = 'none'; }

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
        if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
        if (file.size > 10 * 1024 * 1024) { alert('Image must be smaller than 10MB.'); return; }
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

    imageRemoveBtn.addEventListener('click', (e) => { e.stopPropagation(); resetImageUpload(); });

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

        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('blur', () => validateIngredientRow(row));
            input.addEventListener('input', () => {
                input.classList.remove('input-error');
                const err = row.querySelector('.validation-error');
                if (err) err.remove();
            });
        });

        row.querySelector('.ingredient-bookmark-btn').addEventListener('click', () => {
            const btn = row.querySelector('.ingredient-bookmark-btn');
            const is = btn.dataset.bookmarked === 'true';
            btn.dataset.bookmarked = !is;
            btn.textContent = is ? '☆' : '★';
            btn.classList.toggle('bookmarked');
        });

        row.querySelector('.ingredient-remove').addEventListener('click', () => row.remove());
        ingredientsList.appendChild(row);
    }

    function getIngredientsFromForm() {
        return Array.from(ingredientsList.querySelectorAll('.ingredient-row')).map(row => {
            const inputs = row.querySelectorAll('input');
            const btn = row.querySelector('.ingredient-bookmark-btn');
            return {
                name: inputs[0].value.trim(),
                quantity: parseFloat(inputs[1].value),
                unit: inputs[2].value.trim(),
                is_bookmarked: btn.dataset.bookmarked === 'true',
            };
        }).filter(ing => ing.name && ing.quantity && ing.unit);
    }

    function validateIngredientRow(row) {
        const inputs = row.querySelectorAll('input');
        let valid = true;
        inputs.forEach(input => { input.classList.remove('input-error'); });
        const err = row.querySelector('.validation-error');
        if (err) err.remove();

        if (!inputs[0].value.trim()) { inputs[0].classList.add('input-error'); valid = false; }
        if (!inputs[1].value || parseFloat(inputs[1].value) <= 0) { inputs[1].classList.add('input-error'); valid = false; }
        if (!inputs[2].value.trim()) { inputs[2].classList.add('input-error'); valid = false; }

        if (!valid) {
            const error = document.createElement('span');
            error.className = 'validation-error';
            error.textContent = 'Please fill in all fields correctly';
            row.appendChild(error);
        }
        return valid;
    }

    function validateForm() {
        const title = document.getElementById('recipeTitle').value.trim();
        const instructions = document.getElementById('recipeInstructions').value.trim();
        if (!title) { alert('Please enter a recipe title'); return false; }
        if (!instructions) { alert('Please enter instructions'); return false; }

        const rows = ingredientsList.querySelectorAll('.ingredient-row');
        let allValid = true;
        rows.forEach(row => { if (!validateIngredientRow(row)) allValid = false; });
        if (rows.length > 0 && !allValid) { alert('Please fix the errors in ingredients'); return false; }
        return true;
    }

    // ===== CRUD Operations =====
    async function loadRecipes() {
        recipeListEl.innerHTML = '<div class="loading">Loading recipes...</div>';
        try {
            recipes = await api.getRecipes();
            renderRecipeList(recipes, false);
            await loadTags();
            filterControls.style.display = 'block';
        } catch (error) {
            recipeListEl.innerHTML = `<div class="empty-state">Error loading recipes: ${error.message}</div>`;
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        if (!validateForm()) return;

        const tagsString = document.getElementById('recipeTags').value.trim();
        const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];

        // Get cooking time from days/hours/minutes fields
        const days = parseInt(document.getElementById('cookingDays')?.value || 0);
        const hours = parseInt(document.getElementById('cookingHours')?.value || 0);
        const minutes = parseInt(document.getElementById('cookingMinutes')?.value || 0);
        const totalMinutes = days * 24 * 60 + hours * 60 + minutes;

        const difficulty = parseInt(document.getElementById('recipeDifficulty')?.value || 1);

        const data = {
            title: document.getElementById('recipeTitle').value.trim(),
            description: document.getElementById('recipeDescription').value.trim(),
            instructions: document.getElementById('recipeInstructions').value.trim(),
            ingredients: getIngredientsFromForm(),
            tags: tags,
            difficulty: difficulty,
            cooking_time_minutes: totalMinutes > 0 ? totalMinutes : null,
        };

        try {
            let recipe;
            if (editingRecipeId) {
                recipe = await api.updateRecipe(editingRecipeId, data);
                if (selectedImageFile) {
                    recipe = await api.uploadRecipeImage(editingRecipeId, selectedImageFile);
                }
            } else {
                recipe = await api.createRecipe(data);
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
            await loadRecipes();
            if (currentFilter === 'favorites') {
                const favRecipes = await api.getFavoriteRecipes();
                renderRecipeList(favRecipes);
            } else if (currentFilter && currentFilter !== 'all') {
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
            await showRecipeDetail(recipeId);
        } catch (error) {
            alert(`Error updating bookmark: ${error.message}`);
        }
    }

    async function filterByFavorites() {
        currentFilter = 'favorites';
        try {
            const favRecipes = await api.getFavoriteRecipes();
            renderRecipeList(favRecipes);
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

    // ===== Smooth Live Search =====
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

    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => handleSearch(), 300);
    });

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { clearTimeout(searchDebounceTimer); handleSearch(); }
    });

    // ===== Shopping List with Recipe Groups =====
    async function handleGenerateShoppingList() {
        const recipeCheckboxesEl = document.getElementById('recipeCheckboxes');
        const selectedIds = Array.from(recipeCheckboxesEl.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));

        if (selectedIds.length === 0) { alert('Please select at least one recipe.'); return; }

        try {
            const result = await api.generateShoppingListWithRecipes(selectedIds);
            shoppingListResult.style.display = 'block';

            if (!result.recipe_groups || result.recipe_groups.length === 0) {
                shoppingListResult.innerHTML = '<p>No ingredients found in selected recipes.</p>';
                return;
            }

            let html = '<h3 style="margin-bottom:1rem;">Shopping List</h3>';
            result.recipe_groups.forEach(group => {
                html += `
                    <div class="shopping-recipe-group">
                        <div class="shopping-recipe-group__header">${escapeHtml(group.recipe_title)}</div>
                        <ul class="shopping-recipe-group__ingredients">
                            ${group.ingredients.map(ing => `
                                <li class="shopping-recipe-group__ingredient">
                                    <input type="checkbox">
                                    <span>${ing.quantity} ${escapeHtml(ing.unit)} ${escapeHtml(ing.name)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            });

            // Also show aggregated total
            const aggregatedItems = await api.generateShoppingList(selectedIds);
            if (aggregatedItems.items && aggregatedItems.items.length > 0) {
                html += `
                    <div class="shopping-recipe-group" style="margin-top:1rem; border-color: var(--color-primary);">
                        <div class="shopping-recipe-group__header" style="background-color: var(--color-primary); color: white;">📋 Combined List</div>
                        <ul class="shopping-recipe-group__ingredients">
                            ${aggregatedItems.items.map(item => `
                                <li class="shopping-recipe-group__ingredient">
                                    <input type="checkbox">
                                    <span>${item.quantity} ${escapeHtml(item.unit)} ${escapeHtml(item.name)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }

            shoppingListResult.innerHTML = html;

            // Add checkbox listeners
            shoppingListResult.querySelectorAll('.shopping-recipe-group__ingredient').forEach(li => {
                const checkbox = li.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', () => {
                    li.classList.toggle('checked', checkbox.checked);
                });
                li.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'INPUT') {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });
            });
        } catch (error) {
            alert(`Error generating shopping list: ${error.message}`);
        }
    }

    function renderShoppingListCheckboxes() {
        const el = document.getElementById('recipeCheckboxes');
        el.innerHTML = recipes.map(recipe => `
            <label>
                <input type="checkbox" value="${recipe.id}">
                ${escapeHtml(recipe.title)}
            </label>
        `).join('');
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
            alert('Please register your OpenAI API key first.');
            return;
        }
        llmForm.reset();
        llmLoading.style.display = 'none';
        llmResult.style.display = 'none';
        llmResult.innerHTML = '';
        llmModal.style.display = 'flex';
    }

    function closeLLMModal() { llmModal.style.display = 'none'; }

    async function handleLLMFormSubmit(e) {
        e.preventDefault();
        const cuisine = document.getElementById('llmCuisine').value.trim() || null;
        const dietary = document.getElementById('llmDietary').value.trim() || null;

        llmForm.style.display = 'none';
        llmLoading.style.display = 'block';
        llmResult.style.display = 'none';

        try {
            const response = await api.findRandomRecipe({ api_key: '', cuisine, dietary, max_results: 1 });
            const recipe = response.recipes[0];
            llmLoading.style.display = 'none';
            llmResult.style.display = 'block';
            llmResult.innerHTML = `
                <div class="llm-result">
                    <h3>${escapeHtml(recipe.title)}</h3>
                    ${recipe.description ? `<p>${escapeHtml(recipe.description)}</p>` : ''}
                    <h4>Ingredients</h4>
                    <ul>${recipe.ingredients.map(ing => `<li>${ing.quantity} ${escapeHtml(ing.unit)} ${escapeHtml(ing.name)}</li>`).join('')}</ul>
                    <h4>Instructions</h4>
                    <pre>${escapeHtml(recipe.instructions)}</pre>
                    <div class="llm-result__actions">
                        <button class="btn btn--primary llm-save-btn">Save to My Recipes</button>
                        <button class="btn btn--secondary llm-regenerate-btn">Try Another</button>
                    </div>
                </div>
            `;

            llmResult.querySelector('.llm-save-btn').addEventListener('click', async () => {
                try {
                    await api.createRecipe({
                        title: recipe.title,
                        description: recipe.description || '',
                        instructions: recipe.instructions,
                        ingredients: recipe.ingredients,
                    });
                    closeLLMModal();
                    await loadRecipes();
                } catch (error) { alert(`Error saving: ${error.message}`); }
            });

            llmResult.querySelector('.llm-regenerate-btn').addEventListener('click', async () => {
                llmResult.style.display = 'none';
                llmLoading.style.display = 'block';
                try {
                    const newResp = await api.findRandomRecipe({ api_key: '', cuisine, dietary, max_results: 1 });
                    const newRecipe = newResp.recipes[0];
                    llmLoading.style.display = 'none';
                    llmResult.style.display = 'block';
                    llmResult.innerHTML = `
                        <div class="llm-result">
                            <h3>${escapeHtml(newRecipe.title)}</h3>
                            ${newRecipe.description ? `<p>${escapeHtml(newRecipe.description)}</p>` : ''}
                            <h4>Ingredients</h4>
                            <ul>${newRecipe.ingredients.map(ing => `<li>${ing.quantity} ${escapeHtml(ing.unit)} ${escapeHtml(ing.name)}</li>`).join('')}</ul>
                            <h4>Instructions</h4>
                            <pre>${escapeHtml(newRecipe.instructions)}</pre>
                            <div class="llm-result__actions">
                                <button class="btn btn--primary llm-save-btn">Save to My Recipes</button>
                                <button class="btn btn--secondary llm-regenerate-btn">Try Another</button>
                            </div>
                        </div>
                    `;
                    bindLLMResultButtons(newRecipe, cuisine, dietary);
                } catch (error) {
                    llmLoading.style.display = 'none';
                    llmForm.style.display = 'block';
                    alert(`Error generating: ${error.message}`);
                }
            });

            bindLLMResultButtons(recipe, cuisine, dietary);
        } catch (error) {
            llmLoading.style.display = 'none';
            llmForm.style.display = 'block';
            alert(`Error generating recipe: ${error.message}`);
        }
    }

    function bindLLMResultButtons(recipe, cuisine, dietary) {
        const saveBtn = llmResult.querySelector('.llm-save-btn');
        const regenBtn = llmResult.querySelector('.llm-regenerate-btn');
        if (saveBtn) {
            saveBtn.replaceWith(saveBtn.cloneNode(true));
            llmResult.querySelector('.llm-save-btn').addEventListener('click', async () => {
                try {
                    await api.createRecipe({
                        title: recipe.title,
                        description: recipe.description || '',
                        instructions: recipe.instructions,
                        ingredients: recipe.ingredients,
                    });
                    closeLLMModal();
                    await loadRecipes();
                } catch (error) { alert(`Error saving: ${error.message}`); }
            });
        }
        if (regenBtn) {
            regenBtn.replaceWith(regenBtn.cloneNode(true));
            llmResult.querySelector('.llm-regenerate-btn').addEventListener('click', () => handleLLMFormSubmit(new Event('submit')));
        }
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
    generateListBtn.addEventListener('click', handleGenerateShoppingList);
    showFavoritesBtn.addEventListener('click', filterByFavorites);
    showAllBtn.addEventListener('click', showAllRecipes);
    tagFilterSelect.addEventListener('change', (e) => {
        if (e.target.value) filterByTag(e.target.value);
        else showAllRecipes();
    });

    window.addEventListener('click', (e) => {
        if (e.target === recipeModal) closeModal();
        if (e.target === recipeDetailModal) closeDetailModal();
        if (e.target === llmModal) closeLLMModal();
        if (!e.target.closest('.recipe-card__tools')) closeAllToolsMenus();
    });

    // ===== Initial Load =====
    loadRecipes();
    checkLLMKeyStatus();
});
