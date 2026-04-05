/**
 * API client for communicating with the Recipe Manager backend.
 */
const API_BASE_URL = '/api';

async function fetchJSON(url, options = {}) {
    const headers = { ...options.headers };
    // Only set Content-Type for non-multipart requests
    if (!options.isMultipart) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
        body: options.isMultipart ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
}

const api = {
    // Recipes
    getRecipes: (skip = 0, limit = 100) => fetchJSON(`/recipes/?skip=${skip}&limit=${limit}`),

    getFavoriteRecipes: (skip = 0, limit = 100) => fetchJSON(`/recipes/favorites?skip=${skip}&limit=${limit}`),

    toggleRecipeFavorite: (id) => fetchJSON(`/recipes/${id}/favorite`, {
        method: 'PATCH',
    }),

    getAllTags: () => fetchJSON('/recipes/tags'),

    getRecipesByTag: (tagName) => fetchJSON(`/recipes/tags/${encodeURIComponent(tagName)}`),

    searchRecipes: (query) => fetchJSON(`/recipes/search?q=${encodeURIComponent(query)}`),

    getRecipe: (id) => fetchJSON(`/recipes/${id}`),

    createRecipe: (data) => fetchJSON('/recipes/', {
        method: 'POST',
        body: data,
    }),

    updateRecipe: (id, data) => fetchJSON(`/recipes/${id}`, {
        method: 'PUT',
        body: data,
    }),

    deleteRecipe: (id) => fetchJSON(`/recipes/${id}`, {
        method: 'DELETE',
    }),

    uploadRecipeImage: async (recipeId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchJSON(`/recipes/${recipeId}/image`, {
            method: 'POST',
            body: formData,
            isMultipart: true,
        });
    },

    // Ingredients
    toggleIngredientBookmark: (ingredientId) => fetchJSON(`/recipes/ingredients/${ingredientId}/bookmark`, {
        method: 'PATCH',
    }),

    // Shopping List
    generateShoppingList: (recipeIds, bookmarkedOnly = false) => fetchJSON('/recipes/shopping-list', {
        method: 'POST',
        body: recipeIds,
    }),

    // LLM
    findRandomRecipe: (data) => fetchJSON('/llm/find-recipe', {
        method: 'POST',
        body: data,
    }),

    registerLLMKey: (data) => fetchJSON('/llm/keys', {
        method: 'POST',
        body: data,
    }),

    listLLMKeys: () => fetchJSON('/llm/keys'),

    deleteLLMKey: (id) => fetchJSON(`/llm/keys/${id}`, {
        method: 'DELETE',
    }),

    getActiveLLMKey: (provider) => fetchJSON(`/llm/keys/active/${provider}`),
};
