# Random Meal Planner

A Flask web application where users can register, log in, get meal suggestions, view cooking instructions, and save meals to their personal history.

## How It Works

1. A user registers or logs in.
2. The backend creates a JWT access token and stores it in secure HTTP-only cookies.
3. The dashboard asks the user for:
   - meal timing: breakfast, lunch, snack, or dinner
   - calorie target: minimum and maximum calories
   - food style: North Indian, Chinese, Italian, Japanese, South Indian, etc.
4. The frontend sends those choices to the Flask API.
5. The backend fetches meal data from TheMealDB, normalizes the response, adds preference metadata, and returns one meal suggestion.
6. The user can:
   - view the recipe/instructions
   - save the meal
   - view saved meals history
   - delete saved meals

Note: TheMealDB does not provide calorie data, so calories are estimated using a simple backend calculation.

## System Architecture

```text
Browser UI
  |
  | HTML/CSS/Vanilla JS
  | JWT cookies + CSRF header
  v
Flask App: server.py
  |
  | registers routes, auth, database, API blueprint
  v
API Layer: api.py
  |
  | protected /api/* endpoints
  | meal suggestion, save, list, delete
  v
Database Models: models.py
  |
  | SQLAlchemy ORM
  v
SQLite Database
```

## Main Files

- `server.py`: Creates the Flask app, configures JWT auth, handles login/register/logout, and registers the API blueprint.
- `api.py`: Contains JWT-protected API endpoints for user info, meal suggestions, saved meals, and deleting meals.
- `models.py`: Defines the database schema for users and saved meals.
- `templates/`: Contains Flask HTML templates.
- `static/js/`: Contains frontend logic for auth, dashboard actions, messages, and API calls.
- `static/css/style.css`: Contains all frontend styling.

## Database Schema

### `users`

Stores account information:

- `id`
- `username`
- `email`
- `password_hash`
- `created_at`

### `saved_meals`

Stores each user's saved meal history:

- `id`
- `user_id`
- `mealdb_id`
- `name`
- `category`
- `area`
- `thumbnail_url`
- `instructions`
- `source_url`
- `youtube_url`
- `ingredients`
- `timing`
- `style`
- `calorie_min`
- `calorie_max`
- `estimated_calories`
- `created_at`

## API Overview

### Auth Routes

- `POST /login`: Logs in a user and sets JWT cookies.
- `POST /register`: Creates a user and sets JWT cookies.
- `GET /logout`: Clears JWT cookies.

### Protected API Routes

All `/api/*` routes require JWT authentication.

- `GET /api/user`: Returns the current user.
- `POST /api/meal-suggestion`: Returns a meal suggestion based on dashboard inputs.
- `GET /api/meals`: Returns saved meals for the logged-in user.
- `POST /api/meals`: Saves a meal for the logged-in user.
- `DELETE /api/meals/<meal_id>`: Deletes one saved meal owned by the logged-in user.

## Frontend Flow

- `main.js` handles shared API requests, JWT cookie credentials, CSRF headers, and success/error/loading messages.
- `auth.js` handles login and registration forms.
- `home.js` handles the dashboard:
  - getting meal suggestions
  - showing recipe instructions
  - saving meals
  - loading saved meals
  - expanding saved recipes
  - deleting saved meals

## Run The Project

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

Open:

```text
http://localhost:5000
```

## Tech Stack

- Flask
- Flask-JWT-Extended
- Flask-SQLAlchemy
- SQLite
- Vanilla JavaScript
- HTML/CSS
- TheMealDB API
