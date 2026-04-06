/**
 * Recipe Manager V2 — main application logic.
 * Features: CRUD, live search, difficulty, cooking time,
 * shopping list with recipe separators + checkboxes,
 * AI tools (structure steps, grammar check, unit check),
 * dynamic tags, smooth animations.
 */
document.addEventListener('DOMContentLoaded', () => {
    // State
    let recipes = [];
    let allTags = [];
    let editingRecipeId = null;
    let selectedImageFile = null;
    let currentFilter = 'all';
    let searchDebounceTimer = null;

    // DOM Elements
    const recipeListEl = document.getElementById('recipeList');
    const addRecipeBtn = document.getElementById('addRecipeBtn');
    const aiToolsBtn = document.getElementById('aiToolsBtn');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const recipeModal = document.getElementById('recipeModal');
    const recipeDetailModal = document.getElementById('recipeDetailModal');
    const aiModal = document.getElementById('aiModal');
    const modalTitle = document.getElementById('modalTitle');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    const closeAIModalBtn = document.getElementById('closeAIModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const recipeForm = document.getElementById('recipeForm');
    const ingredientsList = document.getElementById('ingredientsList');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const generateListBtn = document.getElementById('generateListBtn');
    const shoppingListResult = document.getElementById('shoppingListResult');
    const llmKeyForm = document.getElementById('llmKeyForm');
    const llmKeyStatus = document.getElementById('llmKeyStatus');
    const filterControls = document.getElementById('filterControls');
    const showFavoritesBtn = document.getElementById('showFavoritesBtn');
    const showAllBtn = document.getElementById('showAllBtn');
    const tagFilterGroup = document.getElementById('tagFilterGroup');
    const tagFilterSelect = document.getElementById('tagFilterSelect');

    // Image upload
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('recipeImageInput');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const imagePreview = document.getElementById('imagePreview');
    const imageRemoveBtn = document.getElementById('imageRemoveBtn');

    // AI tabs
    const aiTabs = document.querySelectorAll('.ai-tab');
    const aiTabContents = {
        steps: document.getElementById('aiTabSteps'),
        grammar: document.getElementById('aiTabGrammar'),
        units: document.getElementById('aiTabUnits'),
    };

    // ===== Utility =====
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    function formatCookingTime(totalMin) {
        if (!totalMin && totalMin !== 0) return '--';
        const d = Math.floor(totalMin / 1440);
        const h = Math.floor((totalMin % 1440) / 60);
        const m = totalMin % 60;
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0 || parts.length === 0) parts.push(`${m}m`);
        return parts.join(':');
    }

    function renderDifficultyStars(level) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<span class="difficulty-star ${i <= level ? '' : 'empty'}">★</span>`;
        }
        return html;
    }

    // ===== Auto-resize textareas =====
    document.querySelectorAll('.form__textarea--autoresize').forEach(ta => {
        ta.addEventListener('input', () => {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 400) + 'px';
        });
    });

    // ===== Recipe List Rendering =====
    function renderRecipeList(recipesToRender, animate = true) {
        if (recipesToRender.length === 0) {
            recipeListEl.innerHTML = '<div class="empty-state">No recipes yet. Add your first recipe!</div>';
            return;
        }

        recipeListEl.innerHTML = recipesToRender.map(recipe => {
            const ct = formatCookingTime(recipe.cooking_time_minutes);
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
                            <button class="recipe-card__tools-btn" data-id="${recipe.id}" title="More">⚙️</button>
                            <div class="recipe-card__tools-menu" id="tools-menu-${recipe.id}">
                                <button class="edit-btn" data-id="${recipe.id}">✏️ Edit</button>
                                <button class="delete-btn btn--danger" data-id="${recipe.id}">🗑️ Delete</button>
                            </div>
                        </div>
                    </div>
                    ${recipe.description ? `<p class="recipe-card__description">${escapeHtml(recipe.description)}</p>` : ''}
                    ${recipe.tags && recipe.tags.length > 0 ? `
                        <div class="recipe-tags">
                            ${recipe.tags.map(tag => `<span class="recipe-tag" data-tag="${escapeHtml(tag.name)}">${escapeHtml(tag.name)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="recipe-card__meta-row" style="display:flex;justify-content:space-between;align-items:center;margin-top:0.75rem;font-size:0.85rem;color:var(--color-text);">
                        <div style="display:flex;align-items:center;gap:0.75rem;">
                            <span class="difficulty-stars" style="font-size:1.25rem;">${renderDifficultyStars(recipe.difficulty || 1)}</span>
                            <span style="font-size:0.95rem;font-weight:600;">⏱ ${ct}</span>
                        </div>
                        <span style="font-size:0.8rem;">${recipe.ingredients.length} ing. · ${formatDate(recipe.updated_at)}</span>
                    </div>
                </div>`;
        }).join('');

        // Event listeners
        recipeListEl.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', e => {
                if (e.target.closest('.recipe-card__favorite,.recipe-card__tools-btn,.recipe-card__tools-menu,.recipe-tag')) return;
                showRecipeDetail(parseInt(card.dataset.id));
            });
        });

        recipeListEl.querySelectorAll('.recipe-card__favorite').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                btn.classList.add('pop');
                setTimeout(() => btn.classList.remove('pop'), 400);
                await toggleRecipeFavorite(parseInt(btn.dataset.id));
                closeAllToolsMenus();
            });
        });

        recipeListEl.querySelectorAll('.recipe-card__tools-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const menu = document.getElementById(`tools-menu-${btn.dataset.id}`);
                closeAllToolsMenus();
                if (!menu.classList.contains('show')) menu.classList.add('show');
            });
        });

        recipeListEl.querySelectorAll('.recipe-tag').forEach(tag => {
            tag.addEventListener('click', e => { e.stopPropagation(); filterByTag(tag.dataset.tag); });
        });

        recipeListEl.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', e => { e.stopPropagation(); openEditModal(parseInt(btn.dataset.id)); closeAllToolsMenus(); });
        });

        recipeListEl.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => { e.stopPropagation(); deleteRecipe(parseInt(btn.dataset.id)); closeAllToolsMenus(); });
        });
    }

    function closeAllToolsMenus() {
        document.querySelectorAll('.recipe-card__tools-menu').forEach(m => m.classList.remove('show'));
    }

    // ===== Tags =====
    async function loadTags() {
        try {
            allTags = await api.getAllTags();
            const cur = tagFilterSelect.value;
            tagFilterSelect.innerHTML = '<option value="">All Tags</option>';
            allTags.forEach(t => {
                const o = document.createElement('option');
                o.value = t.name; o.textContent = t.name;
                tagFilterSelect.appendChild(o);
            });
            tagFilterSelect.value = cur;
            tagFilterGroup.style.display = allTags.length > 0 ? 'block' : 'none';
        } catch (e) { console.error('Tags error:', e); }
    }

    // ===== Modals =====
    function openAddModal() {
        editingRecipeId = null;
        selectedImageFile = null;
        modalTitle.textContent = 'Add Recipe';
        recipeForm.reset();
        ingredientsList.innerHTML = '';
        resetImageUpload();
        addIngredientRow();
        document.querySelectorAll('.form__textarea--autoresize').forEach(t => t.style.height = 'auto');
        const d = document.getElementById('recipeDifficulty'); if (d) d.value = '1';
        ['cookingDays','cookingHours','cookingMinutes'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        recipeModal.style.display = 'flex';
    }

    async function openEditModal(id) {
        const r = await api.getRecipe(id);
        if (!r) return;
        editingRecipeId = id;
        selectedImageFile = null;
        modalTitle.textContent = 'Edit Recipe';
        document.getElementById('recipeTitle').value = r.title;
        document.getElementById('recipeDescription').value = r.description || '';
        document.getElementById('recipeInstructions').value = r.instructions;
        document.getElementById('recipeTags').value = r.tags ? r.tags.map(t => t.name).join(', ') : '';
        document.querySelectorAll('.form__textarea--autoresize').forEach(t => t.dispatchEvent(new Event('input')));

        if (r.image_url) {
            imagePreview.src = r.image_url; imagePreview.style.display = 'block';
            imagePlaceholder.style.display = 'none'; imageRemoveBtn.style.display = 'flex';
        } else resetImageUpload();

        const d = document.getElementById('recipeDifficulty');
        if (d) d.value = r.difficulty || 1;

        const total = r.cooking_time_minutes || 0;
        const dd = Math.floor(total / 1440);
        const hh = Math.floor((total % 1440) / 60);
        const mm = total % 60;
        const daysEl = document.getElementById('cookingDays');
        const hoursEl = document.getElementById('cookingHours');
        const minEl = document.getElementById('cookingMinutes');
        if (daysEl) daysEl.value = dd > 0 ? dd : '';
        if (hoursEl) hoursEl.value = hh > 0 ? hh : '';
        if (minEl) minEl.value = (mm > 0 || total === 0) ? mm : '';

        ingredientsList.innerHTML = '';
        r.ingredients.forEach(i => addIngredientRow(i));
        recipeModal.style.display = 'flex';
    }

    function closeModal() { recipeModal.style.display = 'none'; }

    async function showRecipeDetail(id) {
        const r = await api.getRecipe(id);
        if (!r) return;
        document.getElementById('detailTitle').textContent = r.title;
        let h = '';
        if (r.image_url) h += `<img src="${r.image_url}" class="recipe-detail__image">`;
        if (r.description) h += `<p>${escapeHtml(r.description)}</p>`;
        if (r.tags?.length) h += `<div class="recipe-tags">${r.tags.map(t => `<span class="recipe-tag">${escapeHtml(t.name)}</span>`).join('')}</div>`;
        h += `<div style="display:flex;gap:1.5rem;margin:0.75rem 0;font-size:1rem;">`;
        h += `<span style="font-weight:600;">Difficulty:</span> <span class="difficulty-stars" style="font-size:1.35rem;">${renderDifficultyStars(r.difficulty||1)}</span>`;
        h += `<span style="font-weight:600;">⏱ ${formatCookingTime(r.cooking_time_minutes)}</span>`;
        h += `</div>`;
        h += `<h3>Instructions</h3><pre>${escapeHtml(r.instructions)}</pre>`;
        h += `<h3>Ingredients</h3><ul class="recipe-checklist">`;
        r.ingredients.forEach(ing => {
            h += `<li data-ingredient-id="${ing.id}">
                <input type="checkbox">
                <span class="ingredient-text">${ing.is_bookmarked?'☆ ':''}${ing.quantity} ${escapeHtml(ing.unit)} ${escapeHtml(ing.name)}</span>
                <button class="btn btn--small btn--secondary ingredient-bookmark-toggle" data-ingredient-id="${ing.id}">${ing.is_bookmarked?'★':'☆'}</button>
            </li>`;
        });
        h += '</ul>';
        document.getElementById('recipeDetail').innerHTML = h;

        document.querySelectorAll('.recipe-checklist li').forEach(li => {
            const cb = li.querySelector('input[type="checkbox"]');
            cb.addEventListener('change', () => li.classList.toggle('checked', cb.checked));
            li.addEventListener('click', e => {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
                    cb.checked = !cb.checked; cb.dispatchEvent(new Event('change'));
                }
            });
        });

        document.querySelectorAll('.ingredient-bookmark-toggle').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                await toggleIngredientBookmark(parseInt(btn.dataset.ingredientId), r.id);
            });
        });

        recipeDetailModal.style.display = 'flex';
    }

    function closeDetailModal() { recipeDetailModal.style.display = 'none'; }

    // ===== Image Upload =====
    function resetImageUpload() {
        imagePreview.src=''; imagePreview.style.display='none';
        imagePlaceholder.style.display='block'; imageRemoveBtn.style.display='none';
        imageInput.value=''; selectedImageFile=null;
    }

    imageUploadArea.addEventListener('click', e => { if (e.target !== imageRemoveBtn) imageInput.click(); });
    imageInput.addEventListener('change', () => {
        const f = imageInput.files[0];
        if (!f) return;
        if (!f.type.startsWith('image/')) { alert('Select an image file.'); return; }
        if (f.size > 10*1024*1024) { alert('Max 10MB.'); return; }
        selectedImageFile = f;
        const reader = new FileReader();
        reader.onload = e => {
            imagePreview.src = e.target.result; imagePreview.style.display = 'block';
            imagePlaceholder.style.display = 'none'; imageRemoveBtn.style.display = 'flex';
        };
        reader.readAsDataURL(f);
    });
    imageRemoveBtn.addEventListener('click', e => { e.stopPropagation(); resetImageUpload(); });

    // ===== Ingredients =====
    function addIngredientRow(data = {}) {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        row.innerHTML = `
            <input type="text" placeholder="Name" value="${escapeHtml(data.name||'')}" required maxlength="255">
            <input type="number" placeholder="Qty" step="0.01" min="0.01" value="${data.quantity||''}" required>
            <input type="text" placeholder="Unit" value="${escapeHtml(data.unit||'')}" required maxlength="50">
            <button type="button" class="ingredient-bookmark-btn" data-bookmarked="${data.is_bookmarked||false}">${data.is_bookmarked?'★':'☆'}</button>
            <button type="button" class="ingredient-remove">&times;</button>`;

        row.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('blur', () => validateIngredientRow(row));
            inp.addEventListener('input', () => { inp.classList.remove('input-error'); const er = row.querySelector('.validation-error'); if (er) er.remove(); });
        });
        row.querySelector('.ingredient-bookmark-btn').addEventListener('click', function() {
            const is = this.dataset.bookmarked === 'true';
            this.dataset.bookmarked = !is; this.textContent = is ? '☆' : '★'; this.classList.toggle('bookmarked');
        });
        row.querySelector('.ingredient-remove').addEventListener('click', () => row.remove());
        ingredientsList.appendChild(row);
    }

    function getIngredientsFromForm() {
        return Array.from(ingredientsList.querySelectorAll('.ingredient-row')).map(row => {
            const inputs = row.querySelectorAll('input');
            const btn = row.querySelector('.ingredient-bookmark-btn');
            return { name: inputs[0].value.trim(), quantity: parseFloat(inputs[1].value), unit: inputs[2].value.trim(), is_bookmarked: btn.dataset.bookmarked === 'true' };
        }).filter(i => i.name && i.quantity && i.unit);
    }

    function validateIngredientRow(row) {
        const inputs = row.querySelectorAll('input');
        let ok = true;
        inputs.forEach(i => i.classList.remove('input-error'));
        const er = row.querySelector('.validation-error'); if (er) er.remove();
        if (!inputs[0].value.trim()) { inputs[0].classList.add('input-error'); ok = false; }
        if (!inputs[1].value || parseFloat(inputs[1].value) <= 0) { inputs[1].classList.add('input-error'); ok = false; }
        if (!inputs[2].value.trim()) { inputs[2].classList.add('input-error'); ok = false; }
        if (!ok) { const e = document.createElement('span'); e.className = 'validation-error'; e.textContent = 'Fill all fields'; row.appendChild(e); }
        return ok;
    }

    function validateForm() {
        const title = document.getElementById('recipeTitle').value.trim();
        const instr = document.getElementById('recipeInstructions').value.trim();
        if (!title) { alert('Enter a title'); return false; }
        if (!instr) { alert('Enter instructions'); return false; }
        const rows = ingredientsList.querySelectorAll('.ingredient-row');
        let ok = true;
        rows.forEach(r => { if (!validateIngredientRow(r)) ok = false; });
        if (rows.length && !ok) { alert('Fix ingredient errors'); return false; }
        return true;
    }

    // ===== CRUD =====
    async function loadRecipes() {
        recipeListEl.innerHTML = '<div class="loading">Loading...</div>';
        try {
            recipes = await api.getRecipes();
            renderRecipeList(recipes, true);
            renderShoppingListCheckboxes();
            await loadTags();
            filterControls.style.display = 'block';
        } catch (e) {
            recipeListEl.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        if (!validateForm()) return;

        const tags = document.getElementById('recipeTags').value.trim().split(',').map(t => t.trim()).filter(Boolean);
        const d = parseInt(document.getElementById('cookingDays')?.value || 0);
        const h = parseInt(document.getElementById('cookingHours')?.value || 0);
        const m = parseInt(document.getElementById('cookingMinutes')?.value || 0);
        const totalMin = d * 1440 + h * 60 + m;
        const difficulty = parseInt(document.getElementById('recipeDifficulty')?.value || 1);

        const data = {
            title: document.getElementById('recipeTitle').value.trim(),
            description: document.getElementById('recipeDescription').value.trim(),
            instructions: document.getElementById('recipeInstructions').value.trim(),
            ingredients: getIngredientsFromForm(),
            tags, difficulty,
            cooking_time_minutes: totalMin > 0 ? totalMin : null,
        };

        try {
            let recipe;
            if (editingRecipeId) {
                recipe = await api.updateRecipe(editingRecipeId, data);
                if (selectedImageFile) recipe = await api.uploadRecipeImage(editingRecipeId, selectedImageFile);
            } else {
                recipe = await api.createRecipe(data);
                if (selectedImageFile) recipe = await api.uploadRecipeImage(recipe.id, selectedImageFile);
            }
            closeModal();
            await loadRecipes();
            await loadTags();
        } catch (e) { alert(`Error: ${e.message}`); }
    }

    async function deleteRecipe(id) {
        if (!confirm('Delete this recipe?')) return;
        try { await api.deleteRecipe(id); await loadRecipes(); await loadTags(); }
        catch (e) { alert(`Error: ${e.message}`); }
    }

    async function toggleRecipeFavorite(id) {
        try {
            // Animate the star first
            const card = recipeListEl.querySelector(`.recipe-card[data-id="${id}"]`);
            if (card) {
                card.style.transition = 'opacity 0.25s ease';
                card.style.opacity = '0.4';
            }

            await api.toggleRecipeFavorite(id);
            await loadRecipes();

            if (currentFilter === 'favorites') { renderRecipeList(await api.getFavoriteRecipes()); }
            else if (currentFilter && currentFilter !== 'all') { renderRecipeList(await api.getRecipesByTag(currentFilter)); }
        } catch (e) { alert(`Error: ${e.message}`); }
    }

    async function toggleIngredientBookmark(ingId, recipeId) {
        try { await api.toggleIngredientBookmark(ingId); await showRecipeDetail(recipeId); }
        catch (e) { alert(`Error: ${e.message}`); }
    }

    async function filterByFavorites() {
        currentFilter = 'favorites';
        renderRecipeList(await api.getFavoriteRecipes());
        showFavoritesBtn.className = 'btn btn--primary';
        showAllBtn.className = 'btn btn--secondary';
        tagFilterSelect.value = '';
    }

    async function filterByTag(name) {
        currentFilter = name;
        renderRecipeList(await api.getRecipesByTag(name));
        tagFilterSelect.value = name;
        showFavoritesBtn.className = 'btn btn--secondary';
        showAllBtn.className = 'btn btn--secondary';
    }

    async function showAllRecipes() {
        currentFilter = 'all';
        await loadRecipes();
        showFavoritesBtn.className = 'btn btn--secondary';
        showAllBtn.className = 'btn btn--primary';
        tagFilterSelect.value = '';
    }

    // ===== Smooth Live Search =====
    async function handleSearch() {
        const q = searchInput.value.trim();
        if (!q) { await showAllRecipes(); return; }
        try { renderRecipeList(await api.searchRecipes(q)); }
        catch (e) { alert(`Error: ${e.message}`); }
    }

    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(handleSearch, 250);
    });
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') { clearTimeout(searchDebounceTimer); handleSearch(); } });

    // ===== Shopping List Checkboxes =====
    function renderShoppingListCheckboxes() {
        const el = document.getElementById('recipeCheckboxes');
        if (!el) return;
        el.innerHTML = recipes.map(r => `
            <label><input type="checkbox" value="${r.id}"> ${escapeHtml(r.title)}</label>
        `).join('');
    }

    // ===== Shopping List with Recipe Groups =====
    async function handleGenerateShoppingList() {
        const el = document.getElementById('recipeCheckboxes');
        const ids = Array.from(el.querySelectorAll('input:checked')).map(c => parseInt(c.value));
        if (!ids.length) { alert('Select at least one recipe'); return; }

        try {
            const result = await api.generateShoppingListWithRecipes(ids);
            shoppingListResult.style.display = 'block';

            if (!result.recipe_groups?.length) {
                shoppingListResult.innerHTML = '<p>No ingredients found.</p>';
                return;
            }

            let html = '<h3 style="margin-bottom:0.75rem;">Shopping List</h3>';
            result.recipe_groups.forEach(group => {
                html += `<div class="shopping-recipe-group">
                    <div class="shopping-recipe-group__header">${escapeHtml(group.recipe_title)}</div>
                    <ul class="shopping-recipe-group__ingredients">
                        ${group.ingredients.map(ing => `
                            <li class="shopping-recipe-group__ingredient">
                                <input type="checkbox">
                                <span>${ing.quantity} ${escapeHtml(ing.unit)} ${escapeHtml(ing.name)}</span>
                            </li>`).join('')}
                    </ul>
                </div>`;
            });

            // Combined
            const combined = await api.generateShoppingList(ids);
            if (combined.items?.length) {
                html += `<div class="shopping-recipe-group" style="margin-top:1rem;border-color:var(--color-primary);">
                    <div class="shopping-recipe-group__header" style="background:var(--color-primary);color:#fff;">📋 Combined</div>
                    <ul class="shopping-recipe-group__ingredients">
                        ${combined.items.map(i => `
                            <li class="shopping-recipe-group__ingredient">
                                <input type="checkbox">
                                <span>${i.quantity} ${escapeHtml(i.unit)} ${escapeHtml(i.name)}</span>
                            </li>`).join('')}
                    </ul>
                </div>`;
            }

            shoppingListResult.innerHTML = html;

            shoppingListResult.querySelectorAll('.shopping-recipe-group__ingredient').forEach(li => {
                const cb = li.querySelector('input[type="checkbox"]');
                cb.addEventListener('change', () => li.classList.toggle('checked', cb.checked));
                li.addEventListener('click', e => {
                    if (e.target.tagName !== 'INPUT') { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); }
                });
            });
        } catch (e) { alert(`Error: ${e.message}`); }
    }

    // ===== AI Tools =====
    let aiActiveTab = 'steps';

    // Tab switching
    aiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            aiTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            aiActiveTab = tab.dataset.tab;
            Object.values(aiTabContents).forEach(c => c.style.display = 'none');
            aiTabContents[aiActiveTab].style.display = 'block';
        });
    });

    function openAIModal() {
        aiModal.style.display = 'flex';
        // Reset
        aiTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.ai-tab[data-tab="steps"]').classList.add('active');
        Object.values(aiTabContents).forEach(c => c.style.display = 'none');
        aiTabContents.steps.style.display = 'block';
        ['aiStepsResult','aiGrammarResult','aiUnitsResult'].forEach(id => {
            const el = document.getElementById(id); if (el) { el.style.display = 'none'; el.innerHTML = ''; }
        });
        ['aiStepsLoading','aiGrammarLoading','aiUnitsLoading'].forEach(id => {
            const el = document.getElementById(id); if (el) el.style.display = 'none';
        });
    }

    function closeAIModal() { aiModal.style.display = 'none'; }

    // Structure Steps
    document.getElementById('aiStepsBtn').addEventListener('click', async () => {
        const text = document.getElementById('aiStepsText').value.trim();
        if (!text) { alert('Paste recipe text first'); return; }
        document.getElementById('aiStepsLoading').style.display = 'block';
        document.getElementById('aiStepsResult').style.display = 'none';
        try {
            const data = await api.getStructuredCookingSteps({ recipe_text: text });
            document.getElementById('aiStepsLoading').style.display = 'none';
            const res = document.getElementById('aiStepsResult');
            res.style.display = 'block';
            let html = `<h3 style="margin-bottom:0.5rem;">Structured Cooking Steps</h3>`;
            html += `<p style="font-size:0.875rem;color:var(--color-text-light);">Estimated total: ${data.total_estimated_minutes || '?'} min</p>`;
            html += `<ol style="padding-left:1.5rem;">`;
            (data.structured_steps || []).forEach(s => {
                html += `<li style="margin-bottom:0.5rem;"><strong>Step ${s.step_number}</strong>`;
                if (s.estimated_minutes) html += ` <span style="color:var(--color-text-light);">(~${s.estimated_minutes} min)</span>`;
                html += `<br>${escapeHtml(s.instruction)}`;
                if (s.tip) html += `<br><em style="color:var(--color-secondary);">💡 ${escapeHtml(s.tip)}</em>`;
                html += `</li>`;
            });
            html += `</ol>`;

            if (data.grammar_corrections?.length) {
                html += `<h4 style="margin-top:1rem;">Grammar Corrections</h4><ul>`;
                data.grammar_corrections.forEach(c => { html += `<li><s style="color:var(--color-danger);">${escapeHtml(c.original)}</s> → <strong>${escapeHtml(c.corrected)}</strong></li>`; });
                html += `</ul>`;
            }
            if (data.unit_corrections?.length) {
                html += `<h4 style="margin-top:1rem;">Unit Corrections</h4><ul>`;
                data.unit_corrections.forEach(c => { html += `<li>${escapeHtml(c.item)}: <s style="color:var(--color-danger);">${escapeHtml(c.original)}</s> → <strong>${escapeHtml(c.corrected)}</strong></li>`; });
                html += `</ul>`;
            }
            if (data.chef_tips?.length) {
                html += `<h4 style="margin-top:1rem;">Chef Tips</h4><ul>`;
                data.chef_tips.forEach(t => { html += `<li>${escapeHtml(t)}</li>`; });
                html += `</ul>`;
            }
            res.innerHTML = html;
        } catch (e) {
            document.getElementById('aiStepsLoading').style.display = 'none';
            alert(`Error: ${e.message}`);
        }
    });

    document.getElementById('aiStepsClearBtn').addEventListener('click', () => {
        document.getElementById('aiStepsText').value = '';
        document.getElementById('aiStepsResult').style.display = 'none';
    });

    // Grammar Check
    document.getElementById('aiGrammarBtn').addEventListener('click', async () => {
        const text = document.getElementById('aiGrammarText').value.trim();
        if (!text) { alert('Paste text first'); return; }
        document.getElementById('aiGrammarLoading').style.display = 'block';
        document.getElementById('aiGrammarResult').style.display = 'none';
        try {
            const data = await api.grammarCheck({ text });
            document.getElementById('aiGrammarLoading').style.display = 'none';
            const res = document.getElementById('aiGrammarResult');
            res.style.display = 'block';
            let html = `<h3>Corrected Text</h3><pre style="white-space:pre-wrap;background:var(--color-background);padding:1rem;border-radius:var(--radius);">${escapeHtml(data.corrected_text || text)}</pre>`;
            if (data.corrections?.length) {
                html += `<h4 style="margin-top:1rem;">Corrections</h4><ul>`;
                data.corrections.forEach(c => { html += `<li><s style="color:var(--color-danger);">${escapeHtml(c.original)}</s> → <strong>${escapeHtml(c.corrected)}</strong> <span style="color:var(--color-text-light);">(${c.type})</span></li>`; });
                html += `</ul>`;
            }
            res.innerHTML = html;
        } catch (e) {
            document.getElementById('aiGrammarLoading').style.display = 'none';
            alert(`Error: ${e.message}`);
        }
    });

    document.getElementById('aiGrammarClearBtn').addEventListener('click', () => {
        document.getElementById('aiGrammarText').value = '';
        document.getElementById('aiGrammarResult').style.display = 'none';
    });

    // Unit Check
    document.getElementById('aiUnitsBtn').addEventListener('click', async () => {
        const text = document.getElementById('aiUnitsText').value.trim();
        if (!text) { alert('Paste ingredients first'); return; }
        document.getElementById('aiUnitsLoading').style.display = 'block';
        document.getElementById('aiUnitsResult').style.display = 'none';
        try {
            const data = await api.unitCheck({ ingredients_text: text });
            document.getElementById('aiUnitsLoading').style.display = 'none';
            const res = document.getElementById('aiUnitsResult');
            res.style.display = 'block';
            let html = `<h3>Corrected Ingredients</h3><pre style="white-space:pre-wrap;background:var(--color-background);padding:1rem;border-radius:var(--radius);">${escapeHtml(data.corrected_ingredients || text)}</pre>`;
            if (data.corrections?.length) {
                html += `<h4 style="margin-top:1rem;">Corrections</h4><ul>`;
                data.corrections.forEach(c => { html += `<li><strong>${escapeHtml(c.item)}</strong>: <s style="color:var(--color-danger);">${escapeHtml(c.original)}</s> → <strong>${escapeHtml(c.corrected)}</strong></li>`; });
                html += `</ul>`;
            }
            res.innerHTML = html;
        } catch (e) {
            document.getElementById('aiUnitsLoading').style.display = 'none';
            alert(`Error: ${e.message}`);
        }
    });

    document.getElementById('aiUnitsClearBtn').addEventListener('click', () => {
        document.getElementById('aiUnitsText').value = '';
        document.getElementById('aiUnitsResult').style.display = 'none';
    });

    // LLM Key
    let hasActiveLLMKey = false;
    async function checkLLMKeyStatus() {
        try {
            const status = await api.getActiveLLMKey('openai');
            hasActiveLLMKey = status.has_active_key;
            llmKeyStatus.innerHTML = hasActiveLLMKey
                ? `<span class="llm-key-status llm-key-status--active">✓ API key registered (${escapeHtml(status.provider)})</span>`
                : `<span class="llm-key-status llm-key-status--inactive">No API key registered</span>`;
        } catch { llmKeyStatus.innerHTML = `<span class="llm-key-status llm-key-status--inactive">No API key registered</span>`; }
    }

    llmKeyForm.addEventListener('submit', async e => {
        e.preventDefault();
        const key = document.getElementById('llmApiKey').value.trim();
        if (!key) return;
        try { await api.registerLLMKey({ api_key: key, provider: 'openai' }); document.getElementById('llmApiKey').value = ''; await checkLLMKeyStatus(); }
        catch (err) { alert(`Error: ${err.message}`); }
    });

    // ===== Events =====
    addRecipeBtn.addEventListener('click', openAddModal);
    aiToolsBtn.addEventListener('click', openAIModal);
    closeModalBtn.addEventListener('click', closeModal);
    closeDetailBtn.addEventListener('click', closeDetailModal);
    closeAIModalBtn.addEventListener('click', closeAIModal);
    cancelBtn.addEventListener('click', closeModal);
    recipeForm.addEventListener('submit', handleFormSubmit);
    addIngredientBtn.addEventListener('click', () => addIngredientRow());
    generateListBtn.addEventListener('click', handleGenerateShoppingList);
    showFavoritesBtn.addEventListener('click', filterByFavorites);
    showAllBtn.addEventListener('click', showAllRecipes);
    tagFilterSelect.addEventListener('change', e => { if (e.target.value) filterByTag(e.target.value); else showAllRecipes(); });

    window.addEventListener('click', e => {
        if (e.target === recipeModal) closeModal();
        if (e.target === recipeDetailModal) closeDetailModal();
        if (e.target === aiModal) closeAIModal();
        if (!e.target.closest('.recipe-card__tools')) closeAllToolsMenus();
    });

    // ===== Init =====
    loadRecipes();
    checkLLMKeyStatus();
});
