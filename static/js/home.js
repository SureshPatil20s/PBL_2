// Home Page JavaScript

// Get random meal from TheMealDB API
async function getRandomMeal() {
    const mealSuggestionSection = document.getElementById('mealSuggestionSection');
    if (!mealSuggestionSection) return;

    try {
        // Fetch random meal from TheMealDB API
        const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
        if (!response.ok) throw new Error('Failed to fetch meal');

        const data = await response.json();
        if (data.meals && data.meals.length > 0) {
            const meal = data.meals[0];
            displayMeal(meal);
            mealSuggestionSection.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching meal:', error);
        showError('Failed to fetch meal suggestion. Please try again.');
    }
}

// Display meal in the meal card
function displayMeal(meal) {
    document.getElementById('mealImage').src = meal.strMealThumb;
    document.getElementById('mealImage').alt = meal.strMeal;
    document.getElementById('mealName').textContent = meal.strMeal;
    document.getElementById('mealCategory').textContent = `Category: ${meal.strCategory} | Area: ${meal.strArea}`;

    // Store current meal for saving
    window.currentMeal = meal;
}

// Save meal to user's account (for future implementation)
async function saveMeal() {
    if (!window.currentMeal) return;

    const user = await getCurrentUser();
    if (!user) {
        showError('Please log in to save meals');
        return;
    }

    // This would save to database in a full implementation
    showSuccess('Meal saved to your collection!');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const suggestMealBtn = document.getElementById('suggestMealBtn');
    const refreshMealBtn = document.getElementById('refreshMealBtn');
    const saveMealBtn = document.getElementById('saveMealBtn');
    const myMealsBtn = document.getElementById('myMealsBtn');

    if (suggestMealBtn) {
        suggestMealBtn.addEventListener('click', getRandomMeal);
    }

    if (refreshMealBtn) {
        refreshMealBtn.addEventListener('click', getRandomMeal);
    }

    if (saveMealBtn) {
        saveMealBtn.addEventListener('click', saveMeal);
    }

    if (myMealsBtn) {
        myMealsBtn.addEventListener('click', function() {
            // Placeholder for navigating to my meals page
            alert('My Meals feature coming soon!');
        });
    }

    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});

// Add loading indicator for meal fetching
function showMealLoading() {
    const mealCard = document.getElementById('mealCard');
    if (mealCard) {
        mealCard.innerHTML = '<div class="meal-loading">Loading meal suggestion...</div>';
    }
}
