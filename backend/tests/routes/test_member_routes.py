import pytest
from models import User, Member
from app import db as _app_db # Using _app_db to avoid conflict with the db fixture

# --- Helper Functions ---

def register_user_for_token(client, username, email, password, role='viewer'):
    """Registers a user if they don't exist, for token generation tests."""
    user = User.query.filter_by(username=username).first()
    if not user:
        response = client.post('/auth/register', json={
            'username': username,
            'email': email,
            'password': password
            # Role is assigned by default in User model or needs an admin to change it.
            # For testing, we'll assume new users get 'viewer' or we can update manually.
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
            raise Exception(f"Failed to register or find user for token generation: {response.get_json()}")
    elif user.role != role and role != 'viewer': # User exists, update role if different and not default
        user.role = role
        _app_db.session.commit()
    return user


def get_auth_token(client, username, password, role='viewer', email_suffix="@test.com"):
    """
    Ensures a user with the specified role exists and returns an auth token.
    """
    email = f"{username}{email_suffix}"
    register_user_for_token(client, username, email, password, role)
    
    response = client.post('/auth/login', json={
        'username': username,
        'password': password
    })
    if response.status_code == 200:
        return response.get_json().get('access_token')
    raise Exception(f"Login failed for token generation: {response.get_json()}")

def create_member_api_call(client, token, member_data):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    return client.post('/api/members', json=member_data, headers=headers)

def create_sample_member(client, token, name="Sample Member", **kwargs):
    """Helper to create a member via API and return its ID."""
    data = {"name": name, **kwargs}
    response = create_member_api_call(client, token, data)
    if response.status_code == 201:
        return response.get_json()['id']
    return None

# --- Create Member Tests (`POST /api/members`) ---

@pytest.mark.parametrize("role", ['editor', 'admin'])
def test_create_member_success_privileged_roles(client, db, role):
    token = get_auth_token(client, f'{role}user_cm', 'password', role=role)
    member_data = {'name': f'New Member by {role}'}
    response = create_member_api_call(client, token, member_data)
    
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['name'] == member_data['name']
    assert 'id' in json_data
    
    member = Member.query.get(json_data['id'])
    assert member is not None
    assert member.name == member_data['name']

def test_create_member_unauthorized_viewer_role(client, db):
    token = get_auth_token(client, 'vieweruser_cm', 'password', role='viewer')
    member_data = {'name': 'Member by Viewer'}
    response = create_member_api_call(client, token, member_data)
    assert response.status_code == 403

def test_create_member_unauthorized_no_token(client, db):
    member_data = {'name': 'Member by No Token'}
    response = create_member_api_call(client, None, member_data)
    assert response.status_code == 401

def test_create_member_invalid_data_missing_name(client, db):
    token = get_auth_token(client, 'editor_cm_inv', 'password', role='editor')
    member_data = {'bio': 'Some bio without name'} # Missing name
    response = create_member_api_call(client, token, member_data)
    assert response.status_code == 400
    assert 'Missing required field: name' in response.get_json()['message']

def test_create_member_nonexistent_parent(client, db):
    token = get_auth_token(client, 'editor_cm_parent', 'password', role='editor')
    member_data = {'name': 'Child With Invalid Parent', 'parent1_id': 9999}
    response = create_member_api_call(client, token, member_data)
    assert response.status_code == 400 # or 404 depending on backend logic, current is 400
    assert 'Parent with id 9999 not found' in response.get_json()['message']

# --- List Members Tests (`GET /api/members`) ---

def test_list_members_success(client, db):
    editor_token = get_auth_token(client, 'editor_lm', 'password', role='editor')
    create_sample_member(client, editor_token, "Member One")
    create_sample_member(client, editor_token, "Member Two")

    response = client.get('/api/members')
    assert response.status_code == 200
    json_data = response.get_json()
    assert isinstance(json_data, list)
    assert len(json_data) >= 2 # Can be more if other tests added members not cleaned by function scope db

def test_list_members_empty(client, db):
    # db fixture ensures clean DB for this test
    response = client.get('/api/members')
    assert response.status_code == 200
    json_data = response.get_json()
    assert isinstance(json_data, list)
    assert len(json_data) == 0

# --- Get Member Tests (`GET /api/members/<id>`) ---

def test_get_member_success(client, db):
    editor_token = get_auth_token(client, 'editor_gm', 'password', role='editor')
    member_id = create_sample_member(client, editor_token, name="Specific Member")
    assert member_id is not None

    response = client.get(f'/api/members/{member_id}')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['id'] == member_id
    assert json_data['name'] == "Specific Member"

def test_get_member_not_found(client, db):
    response = client.get('/api/members/99999') # Non-existent ID
    assert response.status_code == 404

# --- Update Member Tests (`PUT /api/members/<id>`) ---

@pytest.mark.parametrize("role", ['editor', 'admin'])
def test_update_member_success_privileged_roles(client, db, role):
    token = get_auth_token(client, f'{role}user_um', 'password', role=role)
    member_id = create_sample_member(client, token, name="Original Name")
    assert member_id is not None

    update_data = {'name': 'Updated Name by ' + role, 'bio': 'Updated bio.'}
    response = client.put(f'/api/members/{member_id}', json=update_data, headers={'Authorization': f'Bearer {token}'})
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['name'] == update_data['name']
    assert json_data['bio'] == update_data['bio']

    updated_member = Member.query.get(member_id)
    assert updated_member.name == update_data['name']

def test_update_member_unauthorized_viewer_role(client, db):
    editor_token = get_auth_token(client, 'editor_um_setup', 'password', role='editor')
    member_id = create_sample_member(client, editor_token, name="To Be Updated by Viewer")
    assert member_id is not None

    viewer_token = get_auth_token(client, 'viewer_um', 'password', role='viewer')
    update_data = {'name': 'Update Attempt by Viewer'}
    response = client.put(f'/api/members/{member_id}', json=update_data, headers={'Authorization': f'Bearer {viewer_token}'})
    assert response.status_code == 403

def test_update_member_unauthorized_no_token(client, db):
    editor_token = get_auth_token(client, 'editor_um_setup2', 'password', role='editor')
    member_id = create_sample_member(client, editor_token, name="To Be Updated by No Token")
    assert member_id is not None

    update_data = {'name': 'Update Attempt by No Token'}
    response = client.put(f'/api/members/{member_id}', json=update_data)
    assert response.status_code == 401

def test_update_member_not_found(client, db):
    admin_token = get_auth_token(client, 'admin_um_nf', 'password', role='admin')
    update_data = {'name': 'Update for Non-existent'}
    response = client.put('/api/members/99999', json=update_data, headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 404

def test_update_member_invalid_parent_id(client, db):
    admin_token = get_auth_token(client, 'admin_um_inv_parent', 'password', role='admin')
    member_id = create_sample_member(client, admin_token, name="Member to update parent")
    assert member_id is not None
    
    update_data = {'parent1_id': 88888} # Non-existent parent
    response = client.put(f'/api/members/{member_id}', json=update_data, headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 400 # or 404, current is 400
    assert 'Parent with id 88888 not found' in response.get_json()['message']


# --- Delete Member Tests (`DELETE /api/members/<id>`) ---

@pytest.mark.parametrize("role", ['editor', 'admin'])
def test_delete_member_success_privileged_roles(client, db, role):
    token = get_auth_token(client, f'{role}user_dm', 'password', role=role)
    member_id = create_sample_member(client, token, name="To Be Deleted by " + role)
    assert member_id is not None

    response = client.delete(f'/api/members/{member_id}', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200 # Or 204 if implemented that way
    assert f"Member with id {member_id} deleted successfully" in response.get_json()['message']
    
    deleted_member = Member.query.get(member_id)
    assert deleted_member is None

def test_delete_member_unauthorized_viewer_role(client, db):
    editor_token = get_auth_token(client, 'editor_dm_setup', 'password', role='editor')
    member_id = create_sample_member(client, editor_token, name="To Be Deleted by Viewer")
    assert member_id is not None

    viewer_token = get_auth_token(client, 'viewer_dm', 'password', role='viewer')
    response = client.delete(f'/api/members/{member_id}', headers={'Authorization': f'Bearer {viewer_token}'})
    assert response.status_code == 403

def test_delete_member_unauthorized_no_token(client, db):
    editor_token = get_auth_token(client, 'editor_dm_setup2', 'password', role='editor')
    member_id = create_sample_member(client, editor_token, name="To Be Deleted by No Token")
    assert member_id is not None

    response = client.delete(f'/api/members/{member_id}')
    assert response.status_code == 401

def test_delete_member_not_found(client, db):
    admin_token = get_auth_token(client, 'admin_dm_nf', 'password', role='admin')
    response = client.delete('/api/members/99999', headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 404
```
