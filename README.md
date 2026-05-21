# Random Meal Planner - Flask Web Application

A modern, responsive Flask web application for discovering and planning random meals. Features user authentication, meal suggestions from TheMealDB API, and a clean, intuitive user interface.

## Features

- **User Authentication**
  - User registration with email validation
  - Secure login/logout functionality
  - Password hashing with Werkzeug security
  - Session management

- **Home Page**
  - Hero section with call-to-action buttons
  - Feature showcase cards
  - Random meal suggestions (for logged-in users)
  - Beautiful responsive design

- **Random Meal Planner**
  - Integration with TheMealDB API
  - Get random meal suggestions with images
  - Save favorite meals (foundation for future expansion)
  - Meal category and area information

- **Responsive Design**
  - Mobile-first approach
  - Works seamlessly on all devices
  - Modern, gradient-based UI

## Project Structure

```
PBL_2/
├── server.py              # Main Flask application
├── models.py              # SQLAlchemy database models
├── requirements.txt       # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css     # All styling
│   └── js/
│       ├── main.js       # Main JavaScript functions
│       ├── auth.js       # Authentication logic
│       └── home.js       # Home page functionality
├── templates/
│   ├── base.html         # Base template with navbar
│   ├── index.html        # Home page
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── 404.html          # 404 error page
│   └── 500.html          # 500 error page
└── meal_planner.db       # SQLite database (created on first run)
```

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup Steps

1. **Clone/Navigate to the project**
   ```bash
   cd PBL_2
   ```

2. **Create a virtual environment** (recommended)
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   
   **Windows:**
   ```bash
   venv\Scripts\activate
   ```
   
   **macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the application**
   ```bash
   python server.py
   ```

6. **Access the application**
   - Open your browser and navigate to: `http://localhost:5000`

## Usage

### Creating an Account
1. Click the "Register" button on the home page
2. Fill in your username (min 3 characters), email, and password (min 6 characters)
3. Click "Create Account"
4. You'll be automatically logged in

### Logging In
1. Click the "Login" button on the home page
2. Enter your username and password
3. Click "Login"

### Getting Meal Suggestions
1. Make sure you're logged in
2. Click "Get Random Meal" on the home page
3. A random meal will be displayed with an image and details
4. Click "Get Another Meal" to fetch a different meal
5. Click "Save Meal" to save it to your collection (for future expansion)

## Database

The application uses SQLite for data persistence. The database file (`meal_planner.db`) is automatically created on first run. The database includes:

- **Users Table**: Stores user accounts with hashed passwords, email, and creation date

## Security Features

- Password hashing using Werkzeug
- Session management with secure cookies
- CSRF protection ready (can be enabled)
- Input validation on both client and server side
- Email validation

## API Endpoints

### Authentication
- `POST /login` - Login user (JSON)
- `POST /register` - Register new user (JSON)
- `GET /logout` - Logout user

### Pages
- `GET /` - Home page
- `GET /login` - Login page
- `GET /register` - Registration page

### API
- `GET /api/user` - Get current user information

## Technologies Used

### Backend
- **Flask** - Web framework
- **Flask-SQLAlchemy** - ORM for database operations
- **SQLAlchemy** - Database toolkit
- **Werkzeug** - WSGI utilities and security

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with gradients and animations
- **Vanilla JavaScript** - Interactivity
- **TheMealDB API** - Meal data source

## Future Enhancements

1. **Meal Saving System**
   - Save favorite meals to user profile
   - View saved meals history

2. **Weekly Meal Planning**
   - Create weekly meal plans
   - Add meals to specific days

3. **Shopping List Generator**
   - Generate shopping lists from planned meals
   - Export to PDF

4. **User Profile**
   - Edit profile information
   - Change password
   - Account settings

5. **Advanced Search**
   - Filter meals by cuisine
   - Search by ingredients
   - Dietary restrictions

6. **Social Features**
   - Share meal plans with friends
   - Rate and review meals
   - Community meal suggestions

## Troubleshooting

### Database Issues
If you encounter database errors, delete `meal_planner.db` and run the app again. It will create a fresh database.

### Port Already in Use
If port 5000 is already in use, modify the port in `server.py`:
```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Change 5000 to 5001
```

### Module Import Errors
Make sure your virtual environment is activated and all dependencies are installed:
```bash
pip install -r requirements.txt
```

## Configuration

Edit `server.py` to modify:
- Database URI: `SQLALCHEMY_DATABASE_URI`
- Debug mode: `debug=True` (set to False in production)
- Host and port: `host='0.0.0.0', port=5000`
- Session settings: `SESSION_COOKIE_*` variables

## Deployment

For production deployment:
1. Set `debug=False` in server.py
2. Use a production WSGI server (Gunicorn, uWSGI)
3. Set `SESSION_COOKIE_SECURE=True` (requires HTTPS)
4. Use environment variables for sensitive configuration
5. Set a strong `SECRET_KEY`

Example with Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 server:app
```

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please check the code comments or refer to the documentation of the respective libraries:
- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [TheMealDB API](https://www.themealdb.com/api.php)

---

**Enjoy planning your meals!** 🍽️