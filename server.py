import os
from datetime import timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    unset_jwt_cookies,
    verify_jwt_in_request,
)
from flask_jwt_extended.exceptions import JWTExtendedException
from jwt.exceptions import PyJWTError
from models import db, User
import secrets

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///meal_planner.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', app.config['SECRET_KEY'])
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = False
app.config['JWT_COOKIE_HTTPONLY'] = True
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['JWT_COOKIE_CSRF_PROTECT'] = False
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

db.init_app(app)
jwt = JWTManager(app)

with app.app_context():
    db.create_all()


def get_current_user_id():
    """Return the current JWT identity if a valid JWT cookie exists."""
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except (JWTExtendedException, PyJWTError, ValueError):
        return None


@app.route('/')
def home():
    """Home page route."""
    is_logged_in = get_current_user_id() is not None
    return render_template('index.html', is_logged_in=is_logged_in)


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page and handler."""
    if request.method == 'GET':
        if get_current_user_id() is not None:
            return redirect(url_for('home'))
        return render_template('login.html')
    
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Please fill in all fields'}), 400
    
    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password):
        access_token = create_access_token(identity=str(user.id))
        response = jsonify({'success': True, 'message': 'Login successful'})
        set_access_cookies(response, access_token)
        return response
    
    return jsonify({'success': False, 'message': 'Invalid username or password'}), 401


@app.route('/register', methods=['GET', 'POST'])
def register():
    """Registration page and handler."""
    if request.method == 'GET':
        if get_current_user_id() is not None:
            return redirect(url_for('home'))
        return render_template('register.html')
    
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    confirm_password = data.get('confirm_password', '').strip()
    
    if not username or not email or not password or not confirm_password:
        return jsonify({'success': False, 'message': 'Please fill in all fields'}), 400
    
    if len(username) < 3:
        return jsonify({'success': False, 'message': 'Username must be at least 3 characters'}), 400
    
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
    
    if password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Username already taken'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    try:
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        access_token = create_access_token(identity=str(new_user.id))
        response = jsonify({'success': True, 'message': 'Registration successful'})
        set_access_cookies(response, access_token)
        return response
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'An error occurred during registration'}), 500


@app.route('/logout')
def logout():
    """Logout route."""
    response = redirect(url_for('home'))
    unset_jwt_cookies(response)
    return response


@app.route('/api/user')
@jwt_required(optional=True)
def get_user_info():
    """Get current logged-in user info."""
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'user': None})

    try:
        user = db.session.get(User, int(user_id))
    except (TypeError, ValueError):
        return jsonify({'user': None})

    if user:
        return jsonify({'user': user.to_dict()})

    return jsonify({'user': None})


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return render_template('404.html'), 404


@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors."""
    return render_template('500.html'), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
