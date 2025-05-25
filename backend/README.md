# Backend Setup for Family Tree Application

This document provides instructions for setting up the backend server, including database configuration with MariaDB.

## Prerequisites

- Python 3.10+
- Pip (Python package installer)
- MariaDB Server (or a compatible MySQL server)
- Git

## Initial Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>/backend
    ```

2.  **Create and activate a virtual environment (recommended):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  **Install Python dependencies:**
    The backend uses Flask and several extensions. These were installed globally in the development environment due to sandbox limitations. In a local setup, install them into your virtual environment:
    ```bash
    pip install Flask Flask-SQLAlchemy Flask-Migrate Flask-JWT-Extended python-dotenv PyMySQL Werkzeug
    ```
    You will also need testing dependencies for running tests:
    ```bash
    pip install pytest pytest-flask pytest-cov
    ```
    (Note: `PyMySQL` is used as the DB driver, compatible with MariaDB. `Werkzeug` is for password hashing.)

## MariaDB Database Setup

The application requires a MariaDB (or MySQL) database. You can set this up using Docker, a local installation, or a cloud service.

**1. Install MariaDB:**

   - **Docker (Recommended for local development):**
     ```bash
     docker run --name mariadb-familytree -e MARIADB_ROOT_PASSWORD=mysecretrootpassword -p 3306:3306 -d mariadb:latest
     ```
     This command starts a MariaDB container named `mariadb-familytree`, sets the root password, and maps port 3306.

   - **Local Installation:**
     Follow the instructions for your operating system from the [official MariaDB website](https://mariadb.org/download/).

   - **Cloud Service (AWS RDS, Azure Database for MariaDB, etc.):**
     Provision a MariaDB instance through your cloud provider's console or CLI. Ensure you have the connection details (host, port, user, password).

**2. Create Database and User:**

   Connect to your MariaDB instance. If using Docker, you can connect to the container:
   ```bash
   docker exec -it mariadb-familytree mariadb -u root -pmysecretrootpassword
   ```
   If installed locally, you might use:
   ```bash
   mariadb -u root -p
   ```

   Once connected, run the following SQL commands to create a database and a dedicated user for the application:

   ```sql
   CREATE DATABASE family_tree_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'family_tree_user'@'localhost' IDENTIFIED BY 'yoursecurepassword'; 
   -- If your app connects from a different host than 'localhost' (e.g., another Docker container or remote machine), 
   -- replace 'localhost' with '%' or the specific IP address.
   -- For Docker, if the app runs on the host machine, 'localhost' might need to be '172.17.0.1' (Docker host IP) or allow connections from '%'.
   GRANT ALL PRIVILEGES ON family_tree_db.* TO 'family_tree_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

   **Important:**
   - Replace `yoursecurepassword` with a strong password.
   - Adjust `'family_tree_user'@'localhost'` if your application connects from a host other than where MariaDB is running (e.g., use `'family_tree_user'@'%'` for any host, but be mindful of security implications).

**3. Database Connection Details:**

   Your application will need the following details to connect to the database:
   - **Host:** The address of your MariaDB server (e.g., `localhost` if running locally or in Docker on the same machine, or the RDS/Azure endpoint).
   - **Port:** The port MariaDB is listening on (default is `3306`).
   - **User:** The user created for the application (e.g., `family_tree_user`).
   - **Password:** The password for the application user.
   - **Database Name:** The name of the database created (e.g., `family_tree_db`).

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the `backend` directory by copying `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual database credentials and a secure JWT secret key.

Example `DATABASE_URL` format:
`DATABASE_URL="mysql+pymysql://family_tree_user:yoursecurepassword@localhost:3306/family_tree_db"`

If using Docker and your application is running on the host machine, `localhost` might need to be `127.0.0.1` or the specific IP of your Docker host network if MariaDB is in a container.

## Database Migrations (Flask-Migrate)

Flask-Migrate handles database schema changes.

1.  **Set Flask App (if not set automatically):**
    Ensure your terminal knows where the Flask app is. `app.py` should be auto-detected if `python-dotenv` is used and `FLASK_APP` is in `.env`.
    ```bash
    # export FLASK_APP=app.py  (if needed)
    ```
    Ensure your `backend` directory is installable (e.g., it has `pyproject.toml` and `setup.cfg` and you've run `pip install -e .` from within the `backend` directory if you encounter import issues with the `flask` command).

2.  **Initialize Migrations (only once per project):**
    If the `migrations` folder does not exist:
    ```bash
    python3 -m flask db init
    ```

3.  **Generate a Migration Script:**
    After changing models in `models.py`, generate a migration script:
    ```bash
    python3 -m flask db migrate -m "Brief description of changes"
    ```
    For the initial setup, this would be:
    ```bash
    python3 -m flask db migrate -m "Initial migration with User, Member, FamilyTreeInfo models."
    ```
    **Note:** This step requires a running and accessible database configured in your `.env` file because Flask-Migrate connects to the database to compare the current schema with your models.

4.  **Apply Migrations to Database:**
    This command applies the generated migration scripts to your database, creating or updating tables.
    ```bash
    python3 -m flask db upgrade
    ```
    **Note:** A MariaDB instance must be running and accessible with the credentials provided in your `.env` file for `flask db upgrade` to work.

## Running the Backend Server

Once the database is set up and migrations are applied:

```bash
python3 -m flask run
```

The server will typically start on `http://127.0.0.1:5000`.

## Running Tests

The backend tests are written using Pytest.

1.  **Ensure Test Dependencies are Installed:**
    If you haven't already, install the testing dependencies (from within your activated virtual environment):
    ```bash
    pip install pytest pytest-flask pytest-cov
    ```

2.  **Run Tests:**
    Navigate to the project's root directory (the one containing the `backend` and `frontend` folders).
    To run all tests in the `backend/tests` directory:
    ```bash
    python -m pytest backend/tests
    ```
    Or, if you are inside the `backend` directory:
    ```bash
    python -m pytest tests/
    # or simply
    pytest tests/
    ```

3.  **Run Tests with Coverage:**
    To generate a test coverage report, run Pytest with the `pytest-cov` plugin. From the project root:
    ```bash
    python -m pytest --cov=backend backend/tests/
    ```
    Or, from the `backend` directory:
    ```bash
    python -m pytest --cov=. tests/
    ```
    This will output a coverage summary to the console. An HTML report can often be found in `backend/htmlcov/` if configured (though not explicitly configured in `pytest.ini` to output HTML by default, `pytest-cov` might do so).

4.  **Test Environment:**
    *   As configured in `backend/pytest.ini`, tests run with `FLASK_ENV=testing`.
    *   The Flask app factory in `backend/app.py` detects this and configures the application to use an **in-memory SQLite database** by default for tests. This ensures tests are isolated and do not affect your development MariaDB database.
    *   Test-specific secret keys are also used.

## Backend Structure

-   `app.py`: Main Flask application setup, extension initialization.
-   `config.py`: Configuration loading (from environment variables).
-   `models.py`: SQLAlchemy database models.
-   `routes/`: Subdirectory containing blueprint modules (`auth_routes.py`, `member_routes.py`, etc.).
    -   `__init__.py`: Makes `routes` a package.
    -   `auth_routes.py`: Authentication related API endpoints.
    -   `family_tree_info_routes.py`: FamilyTreeInfo related API endpoints.
    -   `member_routes.py`: Member related API endpoints.
-   `routes.py`: Contains `main_bp` (for general/public routes, if any).
-   `migrations/`: Database migration scripts generated by Flask-Migrate.
-   `tests/`: Contains Pytest tests.
    -   `conftest.py`: Core test fixtures (`app`, `client`, `db`).
    -   `test_app.py`: Basic application tests.
    -   `routes/`: Subdirectory for route-specific tests.
-   `.env`: Local environment variables (ignored by Git).
-   `.env.example`: Example environment variables.
-   `venv/`: Python virtual environment (ignored by Git).
-   `pytest.ini`: Pytest configuration file.
-   `pyproject.toml`, `setup.cfg`: Packaging and project metadata.
```
