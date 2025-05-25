from flask import Blueprint, jsonify
# Removed imports that were specific to auth_bp and family_tree_info_bp
# Kept User and FamilyTreeInfo for now if main_bp might use them,
# but ideally, main_bp would have its own model imports if needed or be truly generic.
# For a cleaner refactor, if main_bp doesn't use these models, they should be removed.
from models import User, FamilyTreeInfo 
from app import db

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    # This is a placeholder. If you have a frontend, 
    # this might serve the main index.html or be removed if Flask is API-only.
    return jsonify(message="Welcome to the Flask Backend Main Index!")

# Other main/public routes can be defined here if necessary.
# auth_bp and family_tree_info_bp have been moved to their own files
# in the 'routes' subdirectory.
# member_bp will also be in its own file in the 'routes' subdirectory.
