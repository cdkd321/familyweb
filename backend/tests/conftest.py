import pytest
from app import create_app, db as _db # Renamed to _db to avoid conflict with fixture

@pytest.fixture(scope='session')
def app():
    """
    Creates a new Flask application for a test session.
    The configuration is set to 'testing' via pytest.ini (FLASK_ENV=testing).
    """
    _app = create_app() # create_app should now use testing config by default if FLASK_ENV=testing

    # Establish an application context before creating the tables.
    with _app.app_context():
        # You might not need to explicitly create tables if using SQLite in-memory
        # and it's recreated each time, but it's good practice for other DBs.
        # For SQLite in-memory, the DB is created when the first SQLAlchemy operation occurs.
        # However, if you have specific initialization or want to ensure a clean state:
        # _db.create_all() # Ensures tables are created based on models
        pass # create_all() will be handled in the 'db' fixture more granularly

    yield _app

    # Clean up resources after the test session (if any global cleanup needed)
    # For SQLite in-memory, this is less critical as it's ephemeral.
    # with _app.app_context():
    #     _db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture(scope='function') # 'function' scope for per-test DB isolation
def db(app):
    """
    Provides the database instance and handles setup/teardown for each test.
    This ensures each test runs with a clean database.
    """
    with app.app_context():
        # Create all tables for each test function
        _db.create_all()

        yield _db  # Provide the database session/instance to the test

        # Teardown: drop all tables after each test to ensure isolation
        _db.session.remove() # Close the session
        _db.drop_all()       # Drop all tables


@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()
