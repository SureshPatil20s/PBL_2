from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    saved_meals = db.relationship('SavedMeal', back_populates='user', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set the password."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if the provided password matches the hash."""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<User {self.username}>'


class SavedMeal(db.Model):
    __tablename__ = 'saved_meals'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    mealdb_id = db.Column(db.String(40), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100))
    area = db.Column(db.String(100))
    thumbnail_url = db.Column(db.String(500))
    instructions = db.Column(db.Text)
    source_url = db.Column(db.String(500))
    youtube_url = db.Column(db.String(500))
    ingredients = db.Column(db.JSON)
    timing = db.Column(db.String(40))
    style = db.Column(db.String(80))
    calorie_min = db.Column(db.Integer)
    calorie_max = db.Column(db.Integer)
    estimated_calories = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship('User', back_populates='saved_meals')

    __table_args__ = (
        db.UniqueConstraint('user_id', 'mealdb_id', name='uq_saved_meal_user_mealdb'),
    )

    def to_dict(self):
        """Convert saved meal to dictionary."""
        return {
            'id': self.id,
            'mealdb_id': self.mealdb_id,
            'name': self.name,
            'category': self.category,
            'area': self.area,
            'thumbnail_url': self.thumbnail_url,
            'instructions': self.instructions,
            'source_url': self.source_url,
            'youtube_url': self.youtube_url,
            'ingredients': self.ingredients or [],
            'timing': self.timing,
            'style': self.style,
            'calorie_min': self.calorie_min,
            'calorie_max': self.calorie_max,
            'estimated_calories': self.estimated_calories,
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<SavedMeal {self.name}>'
