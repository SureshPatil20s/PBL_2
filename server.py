import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from models import db, User
from datetime import timedelta
import secrets

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///meal_planner.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = secrets.token_hex(32)
app.config['SESSION_COOKIE_SECURE'] = False 
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

db.init_app(app)

with app.app_context():
    db.create_all()


@app.route('/')
def home():
    """Home page route."""
    is_logged_in = 'user_id' in session
    return render_template('index.html', is_logged_in=is_logged_in)


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page and handler."""
    if request.method == 'GET':
        if 'user_id' in session:
            return redirect(url_for('home'))
        return render_template('login.html')
    
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Please fill in all fields'}), 400
    
    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password):
        session.permanent = True
        session['user_id'] = user.id
        session['username'] = user.username
        return jsonify({'success': True, 'message': 'Login successful'})
    
    return jsonify({'success': False, 'message': 'Invalid username or password'}), 401


@app.route('/register', methods=['GET', 'POST'])
def register():
    """Registration page and handler."""
    if request.method == 'GET':
        if 'user_id' in session:
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
        
        session.permanent = True
        session['user_id'] = new_user.id
        session['username'] = new_user.username
        
        return jsonify({'success': True, 'message': 'Registration successful'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'An error occurred during registration'}), 500


@app.route('/logout')
def logout():
    """Logout route."""
    session.clear()
    return redirect(url_for('home'))


@app.route('/api/user')
def get_user_info():
    """Get current logged-in user info."""
    if 'user_id' not in session:
        return jsonify({'user': None})
    
    user = User.query.get(session['user_id'])
    if user:
        return jsonify({'user': user.to_dict()})
    
    session.clear()
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
