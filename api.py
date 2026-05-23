import json
import random
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import SavedMeal, User, db

api_bp = Blueprint('api', __name__, url_prefix='/api')

THEMEALDB_RANDOM_URL = 'https://www.themealdb.com/api/json/v1/1/random.php'

STYLE_AREAS = {
    'North Indian': ['Indian'],
    'South Indian': ['Indian'],
    'Chinese': ['Chinese'],
    'Italian': ['Italian'],
    'Japanese': ['Japanese'],
    'Mexican': ['Mexican'],
    'Thai': ['Thai'],
    'American': ['American'],
    'British': ['British'],
    'Any': []
}

TIMING_CALORIE_HINTS = {
    'Breakfast': (300, 550),
    'Lunch': (500, 850),
    'Snack': (150, 400),
    'Dinner': (450, 800)
}


def current_user_id():
    """Return the authenticated user's id from the JWT identity."""
    return int(get_jwt_identity())


def extract_ingredients(meal):
    """Extract TheMealDB ingredient and measure pairs."""
    ingredients = []
    for index in range(1, 21):
        ingredient = (meal.get(f'strIngredient{index}') or '').strip()
        measure = (meal.get(f'strMeasure{index}') or '').strip()
        if ingredient:
            ingredients.append({
                'ingredient': ingredient,
                'measure': measure
            })
    return ingredients


def estimate_calories(ingredients, timing=None, calorie_min=None, calorie_max=None):
    """Return a simple calorie estimate because TheMealDB does not include nutrition."""
    ingredient_count = max(len(ingredients), 1)
    base = 120 + (ingredient_count * 45)

    if timing in TIMING_CALORIE_HINTS:
        low, high = TIMING_CALORIE_HINTS[timing]
        base = int((base + low + high) / 3)

    if calorie_min is not None and calorie_max is not None:
        return min(max(base, calorie_min), calorie_max)

    return base


def parse_preferences(data):
    timing = (data.get('timing') or '').strip()
    style = (data.get('style') or 'Any').strip()

    try:
        calorie_min = int(data.get('calorie_min'))
        calorie_max = int(data.get('calorie_max'))
    except (TypeError, ValueError):
        calorie_min = None
        calorie_max = None

    if calorie_min is not None and calorie_max is not None and calorie_min > calorie_max:
        calorie_min, calorie_max = calorie_max, calorie_min

    return {
        'timing': timing,
        'style': style,
        'calorie_min': calorie_min,
        'calorie_max': calorie_max
    }


def normalize_themealdb_meal(meal, preferences=None):
    """Convert a TheMealDB meal payload into the app's API shape."""
    preferences = preferences or {}
    ingredients = extract_ingredients(meal)
    return {
        'mealdb_id': meal.get('idMeal'),
        'name': meal.get('strMeal'),
        'category': meal.get('strCategory'),
        'area': meal.get('strArea'),
        'thumbnail_url': meal.get('strMealThumb'),
        'instructions': meal.get('strInstructions'),
        'source_url': meal.get('strSource'),
        'youtube_url': meal.get('strYoutube'),
        'ingredients': ingredients,
        'timing': preferences.get('timing'),
        'style': preferences.get('style'),
        'calorie_min': preferences.get('calorie_min'),
        'calorie_max': preferences.get('calorie_max'),
        'estimated_calories': estimate_calories(
            ingredients,
            preferences.get('timing'),
            preferences.get('calorie_min'),
            preferences.get('calorie_max')
        )
    }


@api_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_info():
    """Get current authenticated user info."""
    user = db.session.get(User, current_user_id())
    if not user:
        return jsonify({'user': None}), 404

    return jsonify({
        'user': user.to_dict()
    })


def meal_from_request(data):
    """Normalize either a frontend meal payload or raw TheMealDB payload."""
    meal = data.get('meal', data)

    preferences = parse_preferences(data)

    if meal.get('idMeal') or meal.get('strMeal'):
        return normalize_themealdb_meal(meal, preferences)

    return {
        'mealdb_id': meal.get('mealdb_id'),
        'name': meal.get('name'),
        'category': meal.get('category'),
        'area': meal.get('area'),
        'thumbnail_url': meal.get('thumbnail_url'),
        'instructions': meal.get('instructions'),
        'source_url': meal.get('source_url'),
        'youtube_url': meal.get('youtube_url'),
        'ingredients': meal.get('ingredients') or [],
        'timing': meal.get('timing') or preferences.get('timing'),
        'style': meal.get('style') or preferences.get('style'),
        'calorie_min': meal.get('calorie_min') or preferences.get('calorie_min'),
        'calorie_max': meal.get('calorie_max') or preferences.get('calorie_max'),
        'estimated_calories': meal.get('estimated_calories')
            or estimate_calories(
                meal.get('ingredients') or [],
                meal.get('timing') or preferences.get('timing'),
                meal.get('calorie_min') or preferences.get('calorie_min'),
                meal.get('calorie_max') or preferences.get('calorie_max')
            )
    }


def fetch_random_themealdb_meal():
    with urlopen(THEMEALDB_RANDOM_URL, timeout=10) as response:
        payload = json.loads(response.read().decode('utf-8'))

    meals = payload.get('meals') or []
    return meals[0] if meals else None


def style_matches(meal, style):
    if not style or style == 'Any':
        return True

    allowed_areas = STYLE_AREAS.get(style, [style])
    if allowed_areas and meal.get('strArea') in allowed_areas:
        return True

    meal_name = (meal.get('strMeal') or '').lower()
    if style == 'North Indian':
        return any(word in meal_name for word in ['paneer', 'chicken', 'lamb', 'curry'])
    if style == 'South Indian':
        return any(word in meal_name for word in ['dosa', 'idli', 'sambar', 'rice'])

    return False


@api_bp.route('/meal-suggestion', methods=['POST'])
@jwt_required()
def meal_suggestion():
    """Fetch a meal suggestion that best fits the user's dashboard choices."""
    data = request.get_json(silent=True) or {}
    preferences = parse_preferences(data)

    if not preferences['timing']:
        return jsonify({
            'success': False,
            'message': 'Please choose a meal timing'
        }), 400

    if preferences['calorie_min'] is None or preferences['calorie_max'] is None:
        return jsonify({
            'success': False,
            'message': 'Please enter a valid calorie range'
        }), 400

    matched_meal = None
    fallback_meals = []

    try:
        for _ in range(8):
            meal = fetch_random_themealdb_meal()
            if not meal:
                continue
            fallback_meals.append(meal)
            if style_matches(meal, preferences['style']):
                matched_meal = meal
                break
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return jsonify({
            'success': False,
            'message': 'Failed to fetch a meal suggestion'
        }), 502

    if not matched_meal and fallback_meals:
        matched_meal = random.choice(fallback_meals)

    if not matched_meal:
        return jsonify({
            'success': False,
            'message': 'No meal suggestion was found'
        }), 404

    return jsonify({
        'success': True,
        'meal': normalize_themealdb_meal(matched_meal, preferences)
    })


@api_bp.route('/meals', methods=['GET'])
@jwt_required()
def get_saved_meals():
    """Return meals saved by the authenticated user."""
    meals = (
        SavedMeal.query
        .filter_by(user_id=current_user_id())
        .order_by(SavedMeal.created_at.desc())
        .all()
    )
    return jsonify({
        'success': True,
        'meals': [meal.to_dict() for meal in meals]
    })


@api_bp.route('/meals', methods=['POST'])
@jwt_required()
def save_meal():
    """Save a meal to the authenticated user's collection."""
    data = request.get_json(silent=True) or {}
    meal_data = meal_from_request(data)

    if not meal_data.get('mealdb_id') or not meal_data.get('name'):
        return jsonify({
            'success': False,
            'message': 'Meal id and name are required'
        }), 400

    user_id = current_user_id()
    existing_meal = SavedMeal.query.filter_by(
        user_id=user_id,
        mealdb_id=meal_data['mealdb_id']
    ).first()

    if existing_meal:
        return jsonify({
            'success': True,
            'message': 'Meal is already saved',
            'meal': existing_meal.to_dict()
        })

    saved_meal = SavedMeal(user_id=user_id, **meal_data)
    db.session.add(saved_meal)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Meal saved successfully',
        'meal': saved_meal.to_dict()
    }), 201


@api_bp.route('/meals/<int:meal_id>', methods=['DELETE'])
@jwt_required()
def delete_saved_meal(meal_id):
    """Delete one saved meal owned by the authenticated user."""
    saved_meal = SavedMeal.query.filter_by(
        id=meal_id,
        user_id=current_user_id()
    ).first()

    if not saved_meal:
        return jsonify({
            'success': False,
            'message': 'Saved meal not found'
        }), 404

    db.session.delete(saved_meal)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Meal removed successfully'
    })
