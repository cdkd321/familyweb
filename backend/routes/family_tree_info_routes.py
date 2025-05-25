from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
# Assuming models.py and app.py are in the parent directory (backend/)
# Adjust if your project structure for models and db is different
from models import FamilyTreeInfo
from app import db

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
        info.historical_documents_links = historical_documents_links

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
