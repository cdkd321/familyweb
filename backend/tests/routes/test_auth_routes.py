import pytest
from models import User  # Assuming models.py is accessible via pythonpath in pytest.ini
# from app import db as main_app_db # For direct db operations if needed, but fixture 'db' is preferred

# Helper function to register a user (can be expanded or moved to conftest if used widely)
def register_user(client, username, email, password):
    return client.post('/auth/register', json={
        'username': username,
        'email': email,
        'password': password
    })

# Helper function to log in a user and get token
def login_user(client, username, password):
    response = client.post('/auth/login', json={
        'username': username,
        'password': password
    })
    if response.status_code == 200:
        return response.get_json().get('access_token')
    return None

# --- Registration Tests ---
def test_register_success(client, db):
    response = register_user(client, 'testuser', 'test@example.com', 'password123')
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['message'] == 'User registered successfully'
    
    user = User.query.filter_by(username='testuser').first()
    assert user is not None
    assert user.email == 'test@example.com'
    assert user.check_password('password123') # Verify password hash

def test_register_duplicate_username(client, db):
    register_user(client, 'testuser', 'test1@example.com', 'password123') # First user
    response = register_user(client, 'testuser', 'test2@example.com', 'password456') # Duplicate username
    
    assert response.status_code == 400 # As per current implementation
    json_data = response.get_json()
    assert json_data['message'] == 'Username or email already exists'

def test_register_duplicate_email(client, db):
    register_user(client, 'user1', 'test@example.com', 'password123') # First user
    response = register_user(client, 'user2', 'test@example.com', 'password456') # Duplicate email
    
    assert response.status_code == 400 # As per current implementation
    json_data = response.get_json()
    assert json_data['message'] == 'Username or email already exists'

def test_register_missing_username(client, db):
    response = client.post('/auth/register', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 400
    json_data = response.get_json()
    assert 'Missing username, email, or password' in json_data['message']

def test_register_missing_email(client, db):
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'password': 'password123'
    })
    assert response.status_code == 400
    json_data = response.get_json()
    assert 'Missing username, email, or password' in json_data['message']

def test_register_missing_password(client, db):
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com'
    })
    assert response.status_code == 400
    json_data = response.get_json()
    assert 'Missing username, email, or password' in json_data['message']

# Note: Backend does not currently implement specific email format validation beyond what SQLAlchemy/browser might do.
# A dedicated test for invalid email format would require adding that validation logic first.

# --- Login Tests ---
def test_login_success(client, db):
    register_user(client, 'loginuser', 'login@example.com', 'password123')
    response = client.post('/auth/login', json={
        'username': 'loginuser',
        'password': 'password123'
    })
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'access_token' in json_data

def test_login_invalid_username(client, db):
    response = client.post('/auth/login', json={
        'username': 'nonexistentuser',
        'password': 'password123'
    })
    assert response.status_code == 401
    json_data = response.get_json()
    assert json_data['message'] == 'Invalid username or password'

def test_login_incorrect_password(client, db):
    register_user(client, 'loginuser2', 'login2@example.com', 'password123')
    response = client.post('/auth/login', json={
        'username': 'loginuser2',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    json_data = response.get_json()
    assert json_data['message'] == 'Invalid username or password'

def test_login_missing_fields(client, db):
    response = client.post('/auth/login', json={'username': 'testuser'})
    assert response.status_code == 400
    json_data = response.get_json()
    assert 'Missing username or password' in json_data['message']

# --- Get User Details (/me) Tests ---
def test_me_success(client, db):
    # Register and login to get a token
    register_user(client, 'me_user', 'me@example.com', 'password123')
    token = login_user(client, 'me_user', 'password123')
    assert token is not None

    headers = {'Authorization': f'Bearer {token}'}
    response = client.get('/auth/me', headers=headers)
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['username'] == 'me_user'
    assert json_data['email'] == 'me@example.com'
    assert 'id' in json_data
    assert 'role' in json_data # Assuming role is returned

def test_me_unauthorized_no_token(client, db):
    response = client.get('/auth/me')
    assert response.status_code == 401 # Flask-JWT-Extended default for missing token
    json_data = response.get_json()
    assert 'Missing Authorization Header' in json_data.get('msg', '') # Flask-JWT-Extended specific message

def test_me_unauthorized_invalid_token(client, db):
    headers = {'Authorization': 'Bearer invalidtoken123'}
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 422 # Flask-JWT-Extended default for invalid token format
    json_data = response.get_json()
    assert 'Invalid token' in json_data.get('msg', '') # Or similar message from Flask-JWT-Extended

# --- Change Password Tests ---
def test_change_password_success(client, db):
    register_user(client, 'changepwuser', 'changepw@example.com', 'oldpassword')
    token = login_user(client, 'changepwuser', 'oldpassword')
    assert token is not None

    headers = {'Authorization': f'Bearer {token}'}
    response = client.post('/auth/change-password', headers=headers, json={
        'current_password': 'oldpassword',
        'new_password': 'newpassword123'
    })
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['message'] == 'Password updated successfully'

    # Verify new password works for login
    new_token = login_user(client, 'changepwuser', 'newpassword123')
    assert new_token is not None
    # Verify old password no longer works
    old_token_response = client.post('/auth/login', json={
        'username': 'changepwuser',
        'password': 'oldpassword'
    })
    assert old_token_response.status_code == 401

def test_change_password_incorrect_current(client, db):
    register_user(client, 'changepwuser2', 'changepw2@example.com', 'oldpassword')
    token = login_user(client, 'changepwuser2', 'oldpassword')
    assert token is not None

    headers = {'Authorization': f'Bearer {token}'}
    response = client.post('/auth/change-password', headers=headers, json={
        'current_password': 'wrongoldpassword',
        'new_password': 'newpassword123'
    })
    assert response.status_code == 400 # As per current endpoint implementation
    json_data = response.get_json()
    assert json_data['message'] == 'Invalid current password'

def test_change_password_missing_fields(client, db):
    register_user(client, 'changepwuser3', 'changepw3@example.com', 'oldpassword')
    token = login_user(client, 'changepwuser3', 'oldpassword')
    assert token is not None

    headers = {'Authorization': f'Bearer {token}'}
    response = client.post('/auth/change-password', headers=headers, json={
        'current_password': 'oldpassword' 
        # Missing new_password
    })
    assert response.status_code == 400
    json_data = response.get_json()
    assert 'Missing current_password or new_password' in json_data['message']

def test_change_password_unauthorized_no_token(client, db):
    response = client.post('/auth/change-password', json={
        'current_password': 'oldpassword',
        'new_password': 'newpassword123'
    })
    assert response.status_code == 401
    json_data = response.get_json()
    assert 'Missing Authorization Header' in json_data.get('msg', '')

def test_change_password_new_password_too_short(client, db): # Assuming backend has a min length, current is just not empty
    register_user(client, 'changepwuser4', 'changepw4@example.com', 'oldpassword')
    token = login_user(client, 'changepwuser4', 'oldpassword')
    assert token is not None

    headers = {'Authorization': f'Bearer {token}'}
    # Test with empty new password as per current backend logic (len < 1)
    response_empty = client.post('/auth/change-password', headers=headers, json={
        'current_password': 'oldpassword',
        'new_password': '' 
    })
    assert response_empty.status_code == 400
    json_data_empty = response_empty.get_json()
    assert json_data_empty['message'] == 'New password is too short'
```
