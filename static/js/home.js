// Home Page JavaScript

async function getMealSuggestion(event) {
    if (event) {
        event.preventDefault();
    }

    const preferences = getPreferences();
    if (!preferences) return;

    try {
        setDashboardDisabled(true);
        setButtonText('suggestMealBtn', 'Finding meal...');
        showInfo('Finding a meal that matches your choices...');
        const response = await apiRequest('/api/meal-suggestion', 'POST', preferences);

        if (response.ok && response.data.meal) {
            displayMeal(response.data.meal);
            showSection('mealSuggestionSection');
            hideRecipe();
            showSuccess('Meal suggestion ready. You can view the recipe or save it.');
        } else {
            showError(response.data.message || 'Failed to fetch meal suggestion');
        }
    } catch (error) {
        console.error('Meal suggestion error:', error);
        showError('Failed to fetch meal suggestion. Please try again.');
    } finally {
        setDashboardDisabled(false);
        setButtonText('suggestMealBtn', 'Get Meal');
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

    setButtonText('saveMealBtn', 'Saving...');
    setDashboardDisabled(true);
    showInfo('Saving meal to your history...');
    const response = await apiRequest('/api/meals', 'POST', {
        meal: window.currentMeal
    });

    if (response.ok) {
        showSuccess(response.data.message || 'Meal added successfully');
        await loadSavedMeals(false, true);
    } else {
        showError(response.data.message || 'Failed to save meal');
    }

    setDashboardDisabled(false);
    setButtonText('saveMealBtn', 'Save Meal');
}

async function loadSavedMeals(shouldShowSection = true, quiet = false) {
    const myMealsSection = document.getElementById('myMealsSection');
    const savedMealsGrid = document.getElementById('savedMealsGrid');
    if (!myMealsSection || !savedMealsGrid) return;

    if (!quiet) {
        setButtonText('myMealsBtn', 'Loading meals...');
        setDashboardDisabled(true);
        showInfo('Loading your saved meals...');
    }

    if (shouldShowSection) {
        myMealsSection.style.display = 'block';
        savedMealsGrid.innerHTML = '<p class="empty-meals">Loading saved meals...</p>';
    }

    const response = await apiRequest('/api/meals');
    if (!response.ok) {
        showError(response.data.message || 'Failed to load saved meals');
        if (!quiet) {
            setDashboardDisabled(false);
            setButtonText('myMealsBtn', 'View My Meals');
        }
        return;
    }

    renderSavedMeals(response.data.meals || []);
    if (!quiet) {
        showSuccess('Saved meals loaded.');
    }

    if (shouldShowSection) {
        showSection('myMealsSection');
    }

    if (!quiet) {
        setDashboardDisabled(false);
        setButtonText('myMealsBtn', 'View My Meals');
    }
}

function renderSavedMeals(meals) {
    const savedMealsGrid = document.getElementById('savedMealsGrid');
    if (!savedMealsGrid) return;

    if (!meals.length) {
        savedMealsGrid.innerHTML = '<p class="empty-meals">No saved meals yet.</p>';
        return;
    }

    window.savedMealsById = {};
    meals.forEach((meal) => {
        window.savedMealsById[String(meal.id)] = meal;
    });

    savedMealsGrid.innerHTML = meals.map((meal) => `
        <article class="saved-meal">
            <img src="${escapeHtml(meal.thumbnail_url || '')}" alt="${escapeHtml(meal.name)}">
            <div class="saved-meal-content">
                <h3>${escapeHtml(meal.name)}</h3>
                <p>${escapeHtml(meal.timing || 'Meal')} | ${escapeHtml(meal.style || 'Any style')}</p>
                <p>${escapeHtml(meal.category || 'Unknown')} | ${escapeHtml(meal.area || 'Unknown')}</p>
                <p>About ${escapeHtml(meal.estimated_calories || 'N/A')} calories</p>
                <p>Saved ${escapeHtml(formatDate(meal.created_at))}</p>
                <button class="btn btn-primary saved-recipe-btn" data-meal-id="${meal.id}">View Recipe</button>
                <button class="btn btn-secondary remove-meal-btn" data-meal-id="${meal.id}">Delete</button>
                <div class="saved-recipe-details" id="savedRecipe-${meal.id}" style="display: none;"></div>
            </div>
        </article>
    `).join('');
}

function toggleSavedRecipe(mealId) {
    const meal = window.savedMealsById && window.savedMealsById[String(mealId)];
    const details = document.getElementById(`savedRecipe-${mealId}`);
    if (!meal || !details) return;

    if (details.style.display === 'block') {
        details.style.display = 'none';
        return;
    }

    const ingredients = meal.ingredients || [];
    details.innerHTML = `
        <h4>How to cook</h4>
        ${ingredients.length ? `
            <ul>${ingredients.map((item) => `
                <li>${escapeHtml(item.measure)} ${escapeHtml(item.ingredient)}</li>
            `).join('')}</ul>
        ` : '<p>No ingredients found.</p>'}
        <p>${escapeHtml(meal.instructions || 'No cooking instructions were found for this meal.')}</p>
    `;
    details.style.display = 'block';
}

async function removeSavedMeal(mealId) {
    showInfo('Deleting meal from your history...');
    const response = await apiRequest(`/api/meals/${mealId}`, 'DELETE');
    if (response.ok) {
        showSuccess(response.data.message || 'Meal deleted successfully');
        await loadSavedMeals(false, true);
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

function setButtonText(buttonId, text) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.textContent = text;
    }
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
        if (event.target.classList.contains('saved-recipe-btn')) {
            toggleSavedRecipe(event.target.dataset.mealId);
        }

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
