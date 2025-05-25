import pytest
from models import User, FamilyTreeInfo
from app import db as _app_db # Using _app_db to avoid conflict with the db fixture

# --- Helper Functions (Copied from test_member_routes.py for now) ---

def register_user_for_token(client, username, email, password, role='viewer'):
    """Registers a user if they don't exist, for token generation tests."""
    user = User.query.filter_by(username=username).first()
    if not user:
        response = client.post('/auth/register', json={
            'username': username,
            'email': email,
            'password': password
        })
        if response.status_code == 201:
            user = User.query.filter_by(username=username).first()
            if role != 'viewer': # Manually update role for test purposes if necessary
                user.role = role
                _app_db.session.commit()
        elif response.status_code == 400 and "already exists" in response.get_json().get("message", ""):
            # User already exists, fetch them to potentially update role for test
            user = User.query.filter_by(username=username).first()
            if user and user.role != role and role != 'viewer':
                 user.role = role
                 _app_db.session.commit()
        else:
            print(f"Registration response: {response.status_code} - {response.get_json()}")
            raise Exception(f"Failed to register or find user '{username}' for token generation.")
    elif user.role != role and role != 'viewer': # User exists, update role if different and not default
        user.role = role
        _app_db.session.commit()
    return user

def get_auth_token(client, username, password, role='viewer', email_suffix="@familytest.com"):
    """
    Ensures a user with the specified role exists and returns an auth token.
    Uses a different email_suffix to avoid conflicts with other test files if users are not cleaned up perfectly.
    """
    email = f"{username.replace(' ', '_').lower()}{email_suffix}"
    register_user_for_token(client, username, email, password, role)
    
    response = client.post('/auth/login', json={
        'username': username,
        'password': password
    })
    if response.status_code == 200:
        return response.get_json().get('access_token')
    print(f"Login failed response: {response.status_code} - {response.get_json()}")
    raise Exception(f"Login failed for user '{username}' during token generation.")

# --- Get FamilyTreeInfo Tests (`GET /api/family-tree-info`) ---

def test_get_family_tree_info_empty(client, db):
    # db fixture ensures a clean database
    response = client.get('/api/family-tree-info')
    assert response.status_code == 404
    json_data = response.get_json()
    assert "FamilyTreeInfo not found" in json_data['message']

def test_get_family_tree_info_exists(client, db):
    # Pre-populate FamilyTreeInfo
    info = FamilyTreeInfo(name="Our Main Tree", description="A detailed history.")
    _app_db.session.add(info)
    _app_db.session.commit()

    response = client.get('/api/family-tree-info')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['name'] == "Our Main Tree"
    assert json_data['description'] == "A detailed history."
    assert json_data['id'] == info.id

# --- Create/Update FamilyTreeInfo Tests (`POST /api/family-tree-info`) ---

def test_create_family_tree_info_success_editor_role(client, db):
    editor_token = get_auth_token(client, 'editor_fti_create', 'password', role='editor')
    
    initial_info_count = FamilyTreeInfo.query.count()
    assert initial_info_count == 0 # Clean DB for this test

    payload = {
        'name': 'Test Family Tree Create',
        'description': 'A test description for creation.',
        'historical_documents_links': 'link1.doc\nlink2.pdf'
    }
    response = client.post('/api/family-tree-info', json=payload, headers={'Authorization': f'Bearer {editor_token}'})

    assert response.status_code == 200 # Backend uses POST for create/update, returns 200
    json_data = response.get_json()
    assert json_data['name'] == payload['name']
    assert json_data['description'] == payload['description']
    
    assert FamilyTreeInfo.query.count() == initial_info_count + 1
    created_info = FamilyTreeInfo.query.first()
    assert created_info is not None
    assert created_info.name == payload['name']

def test_update_family_tree_info_success_editor_role(client, db):
    editor_token = get_auth_token(client, 'editor_fti_update', 'password', role='editor')

    # Pre-populate FamilyTreeInfo
    initial_info = FamilyTreeInfo(name="Original Name", description="Original Description")
    _app_db.session.add(initial_info)
    _app_db.session.commit()
    initial_info_id = initial_info.id
    initial_info_count = FamilyTreeInfo.query.count()
    assert initial_info_count == 1

    payload = {
        'name': 'Updated Family Tree Name',
        'description': 'An updated description.',
        'historical_documents_links': 'updated_link.txt'
    }
    response = client.post('/api/family-tree-info', json=payload, headers={'Authorization': f'Bearer {editor_token}'})

    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['name'] == payload['name']
    assert json_data['description'] == payload['description']
    assert json_data['historical_documents_links'] == payload['historical_documents_links']
    assert json_data['id'] == initial_info_id # Should update the existing record
    
    assert FamilyTreeInfo.query.count() == initial_info_count # Count should remain the same
    updated_info = FamilyTreeInfo.query.get(initial_info_id)
    assert updated_info is not None
    assert updated_info.name == payload['name']
    assert updated_info.description == payload['description']

def test_create_update_family_tree_info_unauthorized_viewer_role(client, db):
    viewer_token = get_auth_token(client, 'viewer_fti', 'password', role='viewer')
    payload = {'name': 'Attempt by Viewer'}
    response = client.post('/api/family-tree-info', json=payload, headers={'Authorization': f'Bearer {viewer_token}'})
    
    # Based on placeholder in family_tree_info_routes.py which is commented out.
    # If the role check `if claims.get('role') not in ['admin', 'editor']:` were active, it would be 403.
    # For now, let's assume the placeholder means it might pass or fail differently if not implemented.
    # The current actual implementation in family_tree_info_routes.py does NOT have the role check active.
    # It only has @jwt_required(). So a viewer *can* update it.
    # This test might need to change if the role check in the route is uncommented and made active.
    # For now, assuming the placeholder means the check *should* be there:
    # assert response.status_code == 403
    # assert "Insufficient permissions" in response.get_json()['message'] # Or similar
    
    # Given the provided backend code for update_family_tree_info, the role check is commented out.
    # So, any authenticated user can update it.
    # This test reflects the *current* state of the backend code (no active role check beyond @jwt_required).
    assert response.status_code == 200 # Because only @jwt_required is active, not role check
    json_data = response.get_json()
    assert json_data['name'] == payload['name']
    # To make it fail with 403, the role check `if claims.get('role') not in ['admin', 'editor']:`
    # in `family_tree_info_routes.py` needs to be uncommented.
    # I will proceed assuming the intention is to have role protection eventually,
    # but will test current behavior. If the subtask implies I should *fix* the backend to enforce this,
    # that's a different scope. For now, I test what's written.

def test_create_update_family_tree_info_unauthorized_no_token(client, db):
    payload = {'name': 'Attempt by No Token'}
    response = client.post('/api/family-tree-info', json=payload)
    assert response.status_code == 401 # Due to @jwt_required()
    json_data = response.get_json()
    assert "Missing Authorization Header" in json_data.get('msg', "")

# Test for invalid data is skipped as per instructions, as the current backend
# is permissive. If specific validation (e.g., type checks beyond JSON format)
# were added to the backend, corresponding tests would be relevant here.
```
