from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt # Assuming get_jwt() might be used for roles
# Adjust imports based on final project structure (e.g., if models.py is in a 'models' package)
from models import Member 
from app import db

member_bp = Blueprint('member_bp', __name__, url_prefix='/api/members')

@member_bp.route('/', methods=['POST'])
@jwt_required()
def create_member():
    current_user_claims = get_jwt()
    current_user_role = current_user_claims.get('role')
    if current_user_role not in ['admin', 'editor']:
        return jsonify(message="Admin or editor access required"), 403

    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify(message="Missing required field: name"), 400

    # Validate parent and spouse IDs if provided
    parent1_id = data.get('parent1_id')
    parent2_id = data.get('parent2_id')
    spouse_id = data.get('spouse_id')

    if parent1_id and not Member.query.get(parent1_id):
        return jsonify(message=f"Parent with id {parent1_id} not found"), 400
    if parent2_id and not Member.query.get(parent2_id):
        return jsonify(message=f"Parent with id {parent2_id} not found"), 400
    if spouse_id and not Member.query.get(spouse_id):
        return jsonify(message=f"Spouse with id {spouse_id} not found"), 400
    
    # Prevent self-parenting or self-spousing, though model constraints might also handle this
    # This basic check is illustrative. More complex validation might be needed.
    # if data.get('id') and (data.get('id') == parent1_id or data.get('id') == parent2_id or data.get('id') == spouse_id):
    #     return jsonify(message="Member cannot be their own parent or spouse."), 400


    new_member = Member(
        name=data['name'],
        birth_date=data.get('birth_date'), # Add date parsing/validation if needed
        death_date=data.get('death_date'), # Add date parsing/validation if needed
        bio=data.get('bio'),
        photo_url=data.get('photo_url'),
        parent1_id=parent1_id,
        parent2_id=parent2_id,
        spouse_id=spouse_id
    )
    
    try:
        db.session.add(new_member)
        db.session.commit()
        return jsonify(new_member.to_dict(include_relationships=True)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify(message="Error creating member", error=str(e)), 500

@member_bp.route('/<int:member_id>', methods=['GET'])
# @jwt_required() # Public for now
def get_member(member_id):
    member = Member.query.get_or_404(member_id, description=f"Member with id {member_id} not found")
    return jsonify(member.to_dict(include_relationships=True))

@member_bp.route('/', methods=['GET'])
# @jwt_required() # Public for now
def list_members():
    members = Member.query.all()
    return jsonify([member.to_dict() for member in members]) # Using include_relationships=False by default for list view

@member_bp.route('/<int:member_id>', methods=['PUT'])
@jwt_required()
def update_member(member_id):
    current_user_claims = get_jwt()
    current_user_role = current_user_claims.get('role')
    if current_user_role not in ['admin', 'editor']:
        return jsonify(message="Admin or editor access required"), 403

    member = Member.query.get_or_404(member_id, description=f"Member with id {member_id} not found")
    data = request.get_json()

    if not data:
        return jsonify(message="No data provided for update"), 400

    # Update fields if provided in request
    if 'name' in data:
        member.name = data['name']
    if 'birth_date' in data: # Add date parsing/validation if needed
        member.birth_date = data['birth_date']
    if 'death_date' in data: # Add date parsing/validation if needed
        member.death_date = data['death_date']
    if 'bio' in data:
        member.bio = data['bio']
    if 'photo_url' in data:
        member.photo_url = data['photo_url']

    # Validate and update parent/spouse IDs
    parent1_id = data.get('parent1_id')
    if 'parent1_id' in data: # Check if key is present to allow setting to null
        if parent1_id and not Member.query.get(parent1_id):
            return jsonify(message=f"Parent with id {parent1_id} not found"), 400
        if parent1_id == member.id:
             return jsonify(message="Member cannot be their own parent."), 400
        member.parent1_id = parent1_id
        
    parent2_id = data.get('parent2_id')
    if 'parent2_id' in data:
        if parent2_id and not Member.query.get(parent2_id):
            return jsonify(message=f"Parent with id {parent2_id} not found"), 400
        if parent2_id == member.id:
             return jsonify(message="Member cannot be their own parent."), 400
        member.parent2_id = parent2_id

    spouse_id = data.get('spouse_id')
    if 'spouse_id' in data:
        if spouse_id and not Member.query.get(spouse_id):
            return jsonify(message=f"Spouse with id {spouse_id} not found"), 400
        if spouse_id == member.id:
             return jsonify(message="Member cannot be their own spouse."), 400
        member.spouse_id = spouse_id
    
    try:
        db.session.commit()
        return jsonify(member.to_dict(include_relationships=True))
    except Exception as e:
        db.session.rollback()
        return jsonify(message="Error updating member", error=str(e)), 500

@member_bp.route('/<int:member_id>', methods=['DELETE'])
@jwt_required()
def delete_member(member_id):
    current_user_claims = get_jwt()
    current_user_role = current_user_claims.get('role')
    if current_user_role not in ['admin', 'editor']:
        return jsonify(message="Admin or editor access required"), 403

    member = Member.query.get_or_404(member_id, description=f"Member with id {member_id} not found")
    
    try:
        # Before deleting, consider implications:
        # - What happens to other members who list this member as a parent or spouse?
        #   The foreign key constraints (if set to ON DELETE SET NULL or similar) might handle this,
        #   or you might need to manually nullify these relationships in other records.
        # For now, we'll proceed with a simple delete.
        # Example: Nullify children's parent links if this member is a parent
        # Member.query.filter(Member.parent1_id == member_id).update({"parent1_id": None})
        # Member.query.filter(Member.parent2_id == member_id).update({"parent2_id": None})
        # Member.query.filter(Member.spouse_id == member_id).update({"spouse_id": None}) 
        # The above lines would require careful testing and consideration of relationship integrity.
        # A simpler approach for now is to rely on database-level cascade or set-null if defined,
        # or accept that these links might become stale if not handled.

        db.session.delete(member)
        db.session.commit()
        return jsonify(message=f"Member with id {member_id} deleted successfully"), 200
        # Alternatively, return 204 No Content:
        # return '', 204
    except Exception as e:
        db.session.rollback()
        # This could be due to foreign key constraints if not handled properly
        return jsonify(message="Error deleting member", error=str(e)), 500
