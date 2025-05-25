import pytest

def test_app_exists(app):
    """Check if the Flask app fixture is created and not None."""
    assert app is not None

def test_app_is_testing(app):
    """Check if the app is configured for testing."""
    assert app.config['TESTING']
    # Check if using SQLite in-memory, assuming that's the testing default
    # This might need adjustment if TEST_DATABASE_URL is set in pytest.ini to something else
    assert 'sqlite:///:memory:' in app.config['SQLALCHEMY_DATABASE_URI']
    assert app.config['JWT_SECRET_KEY'] == 'test-jwt-secret' # From app factory's testing default

def test_hello_world_route_main_bp(client):
    """
    Test the '/' route from main_bp.
    It's currently defined to return: jsonify(message="Welcome to the Flask Backend Main Index!")
    """
    response = client.get('/')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data is not None
    assert 'message' in json_data
    assert json_data['message'] == "Welcome to the Flask Backend Main Index!"

def test_database_fixture_works(db):
    """
    A simple test to ensure the db fixture works and tables can be interacted with.
    This doesn't test specific models, just the fixture's ability to setup/teardown.
    """
    # At this point, db.create_all() should have been called by the fixture.
    # We can try a very simple operation if needed, but the fixture itself handles setup/teardown.
    # For example, checking if the User table exists (though this is more of a model test)
    # from sqlalchemy import inspect
    # inspector = inspect(db.engine)
    # assert 'user' in inspector.get_table_names() # Assumes User model maps to 'user' table
    assert db is not None # Basic check that fixture provides the db object

# Example of how a test for a protected route might look (though this is more for route testing)
# def test_protected_route_requires_auth(client):
#     response = client.get('/api/members') # Assuming /api/members is protected
#     # If strictly protected and no token, might be 401 (if JWT handles it) or redirect
#     # Depending on how @jwt_required handles missing token (it usually returns 401)
#     assert response.status_code == 401 # Or check for redirect if app behaves differently
#
#     # This is just a placeholder, actual auth testing will be more involved.
#     # We'd need a way to generate a test token and include it in headers.
```
