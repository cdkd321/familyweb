from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
# Assuming models.py and app.py are in the parent directory (backend/)
# Adjust if your project structure for models and db is different
from models import User 
from app import db

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify(message="Missing username, email, or password"), 400

    if User.query.filter_by(username=username).first() or \
       User.query.filter_by(email=email).first():
        return jsonify(message="Username or email already exists"), 400

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify(message="Error creating user", error=str(e)), 500
        
    return jsonify(message="User registered successfully"), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify(message="Missing username or password"), 400

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity={'username': user.username, 'role': user.role, 'id': user.id})
        return jsonify(access_token=access_token), 200
    else:
        return jsonify(message="Invalid username or password"), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_identity = get_jwt_identity()
    # Ensure that the identity is a dictionary and contains 'id'
    if not isinstance(current_user_identity, dict) or 'id' not in current_user_identity:
        return jsonify(message="Invalid token identity"), 400
        
    user = User.query.filter_by(id=current_user_identity['id']).first()

    if not user:
        return jsonify(message="User not found"), 404

    return jsonify(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role
    ), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user_identity = get_jwt_identity()
    user_id = current_user_identity.get('id')

    if not user_id:
        return jsonify(message="Invalid token: User ID missing"), 400 # Should not happen with valid JWT

    user = User.query.get(user_id)
    if not user:
        return jsonify(message="User not found"), 404 # Should not happen if JWT ID is valid

    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify(message="Missing current_password or new_password"), 400

    if not user.check_password(current_password):
        return jsonify(message="Invalid current password"), 400
    
    # Basic validation for new_password (e.g. not empty, maybe min length)
    if len(new_password) < 1: # Replace with actual policy if desired, e.g. < 8
        return jsonify(message="New password is too short"), 400

    user.set_password(new_password)
    try:
        db.session.commit()
        return jsonify(message="Password updated successfully"), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(message="Error updating password", error=str(e)), 500
