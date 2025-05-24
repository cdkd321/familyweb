from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt # Added get_jwt
from models import User, FamilyTreeInfo # Changed to absolute import, added FamilyTreeInfo
from app import db # Changed to absolute import

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return jsonify(message="Welcome to the Flask Backend!")

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
    user = User.query.filter_by(id=current_user_identity['id']).first()

    if not user:
        return jsonify(message="User not found"), 404

    return jsonify(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role
    ), 200

# Blueprint for FamilyTreeInfo
family_tree_info_bp = Blueprint('family_tree_info_bp', __name__, url_prefix='/api/family-tree-info')

@family_tree_info_bp.route('/', methods=['GET'])
def get_family_tree_info():
    info = FamilyTreeInfo.query.first()
    if info:
        return jsonify(
            id=info.id,
            name=info.name,
            description=info.description,
            historical_documents_links=info.historical_documents_links
        ), 200
    else:
        return jsonify(message="FamilyTreeInfo not found. Consider creating one."), 404

@family_tree_info_bp.route('/', methods=['POST', 'PUT'])
@jwt_required() 
def update_family_tree_info():
    claims = get_jwt()
    # Placeholder for role check - e.g., allow only 'admin' or 'editor'
    # if claims.get('role') not in ['admin', 'editor']:
    #     return jsonify(message="Insufficient permissions"), 403

    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    historical_documents_links = data.get('historical_documents_links')

    info = FamilyTreeInfo.query.first()
    if not info:
        info = FamilyTreeInfo()
        db.session.add(info)
    
    if name is not None:
        info.name = name
    if description is not None:
        info.description = description
    if historical_documents_links is not None:
        info.historical_documents_links = historical_documents_links # Storing as text

    try:
        db.session.commit()
        return jsonify(
            id=info.id,
            name=info.name,
            description=info.description,
            historical_documents_links=info.historical_documents_links
        ), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(message="Error updating FamilyTreeInfo", error=str(e)), 500

# Define other routes here
