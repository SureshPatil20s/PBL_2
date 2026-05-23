// Home Page JavaScript

async function getMealSuggestion(event) {
    if (event) {
        event.preventDefault();
    }

    const preferences = getPreferences();
    if (!preferences) return;

    try {
        setDashboardDisabled(true);
        const response = await apiRequest('/api/meal-suggestion', 'POST', preferences);

        if (response.ok && response.data.meal) {
            displayMeal(response.data.meal);
            showSection('mealSuggestionSection');
            hideRecipe();
        } else {
            showError(response.data.message || 'Failed to fetch meal suggestion');
        }
    } catch (error) {
        console.error('Meal suggestion error:', error);
        showError('Failed to fetch meal suggestion. Please try again.');
    } finally {
        setDashboardDisabled(false);
    }
}

function getPreferences() {
    const timing = document.getElementById('mealTiming').value;
    const calorieMin = Number(document.getElementById('calorieMin').value);
    const calorieMax = Number(document.getElementById('calorieMax').value);
    const style = document.getElementById('mealStyle').value;

    if (!timing || !calorieMin || !calorieMax) {
        showError('Please fill in timing and calorie range');
        return null;
    }

    return {
        timing: timing,
        calorie_min: calorieMin,
        calorie_max: calorieMax,
        style: style
    };
}

function displayMeal(meal) {
    document.getElementById('mealImage').src = meal.thumbnail_url || '';
    document.getElementById('mealImage').alt = meal.name || 'Meal';
    document.getElementById('mealName').textContent = meal.name || 'Meal suggestion';
    document.getElementById('mealCategory').textContent =
        `Category: ${meal.category || 'Unknown'} | Area: ${meal.area || 'Unknown'}`;
    document.getElementById('mealMeta').textContent =
        `${meal.timing || 'Meal'} | ${meal.style || 'Any style'} | About ${meal.estimated_calories || 'N/A'} calories`;

    window.currentMeal = meal;
}

function viewRecipe() {
    if (!window.currentMeal) return;

    const recipePanel = document.getElementById('recipePanel');
    const recipeIngredients = document.getElementById('recipeIngredients');
    const recipeInstructions = document.getElementById('recipeInstructions');

    const ingredients = window.currentMeal.ingredients || [];
    recipeIngredients.innerHTML = ingredients.length
        ? `<ul>${ingredients.map((item) => `
            <li>${escapeHtml(item.measure)} ${escapeHtml(item.ingredient)}</li>
        `).join('')}</ul>`
        : '<p>No ingredients found.</p>';

    recipeInstructions.textContent =
        window.currentMeal.instructions || 'No cooking instructions were found for this meal.';

    recipePanel.style.display = 'block';
    recipePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideRecipe() {
    const recipePanel = document.getElementById('recipePanel');
    if (recipePanel) {
        recipePanel.style.display = 'none';
    }
}

async function saveMeal() {
    if (!window.currentMeal) {
        showError('Get a meal suggestion before saving');
        return;
    }

    const response = await apiRequest('/api/meals', 'POST', {
        meal: window.currentMeal
    });

    if (response.ok) {
        showSuccess(response.data.message || 'Meal saved');
        loadSavedMeals(false);
    } else {
        showError(response.data.message || 'Failed to save meal');
    }
}

async function loadSavedMeals(shouldShowSection = true) {
    const myMealsSection = document.getElementById('myMealsSection');
    const savedMealsGrid = document.getElementById('savedMealsGrid');
    if (!myMealsSection || !savedMealsGrid) return;

    const response = await apiRequest('/api/meals');
    if (!response.ok) {
        showError(response.data.message || 'Failed to load saved meals');
        return;
    }

    renderSavedMeals(response.data.meals || []);
    if (shouldShowSection) {
        showSection('myMealsSection');
    }
}

function renderSavedMeals(meals) {
    const savedMealsGrid = document.getElementById('savedMealsGrid');
    if (!savedMealsGrid) return;

    if (!meals.length) {
        savedMealsGrid.innerHTML = '<p class="empty-meals">No saved meals yet.</p>';
        return;
    }

    savedMealsGrid.innerHTML = meals.map((meal) => `
        <article class="saved-meal">
            <img src="${escapeHtml(meal.thumbnail_url || '')}" alt="${escapeHtml(meal.name)}">
            <div class="saved-meal-content">
                <h3>${escapeHtml(meal.name)}</h3>
                <p>${escapeHtml(meal.timing || 'Meal')} | ${escapeHtml(meal.style || 'Any style')}</p>
                <p>${escapeHtml(meal.category || 'Unknown')} | ${escapeHtml(meal.area || 'Unknown')}</p>
                <p>About ${escapeHtml(meal.estimated_calories || 'N/A')} calories</p>
                <p>Saved ${escapeHtml(formatDate(meal.created_at))}</p>
                <button class="btn btn-secondary remove-meal-btn" data-meal-id="${meal.id}">Delete</button>
            </div>
        </article>
    `).join('');
}

async function removeSavedMeal(mealId) {
    const response = await apiRequest(`/api/meals/${mealId}`, 'DELETE');
    if (response.ok) {
        showSuccess(response.data.message || 'Meal deleted');
        loadSavedMeals(false);
    } else {
        showError(response.data.message || 'Failed to delete meal');
    }
}

function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setDashboardDisabled(disabled) {
    ['suggestMealBtn', 'myMealsBtn', 'viewRecipeBtn', 'saveMealBtn'].forEach((id) => {
        const button = document.getElementById(id);
        if (button) {
            button.disabled = disabled;
        }
    });
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    const mealPreferenceForm = document.getElementById('mealPreferenceForm');
    const viewRecipeBtn = document.getElementById('viewRecipeBtn');
    const saveMealBtn = document.getElementById('saveMealBtn');
    const myMealsBtn = document.getElementById('myMealsBtn');

    if (mealPreferenceForm) {
        mealPreferenceForm.addEventListener('submit', getMealSuggestion);
    }

    if (viewRecipeBtn) {
        viewRecipeBtn.addEventListener('click', viewRecipe);
    }

    if (saveMealBtn) {
        saveMealBtn.addEventListener('click', saveMeal);
    }

    if (myMealsBtn) {
        myMealsBtn.addEventListener('click', () => loadSavedMeals(true));
    }

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-meal-btn')) {
            removeSavedMeal(event.target.dataset.mealId);
        }
    });

    const myMealsNavLink = document.querySelector('a[href="#myMealsSection"]');
    if (myMealsNavLink) {
        myMealsNavLink.addEventListener('click', function(event) {
            event.preventDefault();
            loadSavedMeals(true);
        });
    }
});
