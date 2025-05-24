# Manual Testing Guide for Family Tree Application

This guide details the steps to manually test the application's current state, covering both backend API and frontend functionality.

## I. Backend API Testing (using a tool like Postman or curl)

### 1. Setup:

*   **Ensure MariaDB is running and accessible.** (Refer to `backend/README.md` for setup instructions if needed).
*   **Navigate to the `backend` directory:**
    ```bash
    cd path/to/your/project/backend
    ```
*   **Set up Python virtual environment and install dependencies:**
    If not done already, create and activate a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
    Install dependencies (ensure `PyMySQL` is included if it wasn't added to a requirements.txt yet):
    ```bash
    pip install Flask Flask-SQLAlchemy Flask-Migrate Flask-JWT-Extended python-dotenv PyMySQL Werkzeug
    ```
    *(Note: A `requirements.txt` should ideally be generated and used here via `pip install -r requirements.txt`)*
*   **Create a `.env` file:**
    Copy `.env.example` to `.env` and update `DATABASE_URL` with your actual MariaDB credentials (user, password, host, database name). Also, set `JWT_SECRET_KEY` and `SECRET_KEY`.
    Example `DATABASE_URL`: `mysql+pymysql://family_tree_user:yoursecurepassword@127.0.0.1:3306/family_tree_db`
*   **Run database migrations:**
    Ensure your `FLASK_APP` environment variable is set (e.g., `export FLASK_APP=app.py` or ensure it's in your `.env` file as `FLASK_APP=app.py`).
    ```bash
    python3 -m flask db init  # Only if the 'migrations' folder doesn't exist
    python3 -m flask db migrate -m "Initial migration with all models" # Or a more specific message
    python3 -m flask db upgrade
    ```
    *(Note: The `migrate` and `upgrade` commands require a running and accessible database configured in `.env`)*
*   **Start the Flask development server:**
    ```bash
    python3 -m flask run
    ```
    The server should start on `http://127.0.0.1:5000/`.

### 2. Authentication Endpoints (`/auth`)

Base URL for these requests: `http://127.0.0.1:5000/auth`

*   **Register User (`POST /register`)**
    *   **Request Body:**
        ```json
        {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        ```
    *   **Expected Response:** Status Code `201 Created`, JSON message like `{"message": "User registered successfully"}`.
    *   **Verification:** Check your MariaDB `user` table to confirm the new user is created with a hashed password.

*   **Register Duplicate User (`POST /register`)**
    *   **Request Body:** (Same as above)
        ```json
        {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        ```
    *   **Expected Response:** Status Code `400 Bad Request`, JSON message like `{"message": "Username or email already exists"}`.

*   **Login User (`POST /login`)**
    *   **Request Body:**
        ```json
        {
            "username": "testuser",
            "password": "password123"
        }
        ```
    *   **Expected Response:** Status Code `200 OK`, JSON containing an `access_token`: `{"access_token": "your.jwt.token.here"}`.
    *   **Action:** Note down the received `access_token` for subsequent authenticated requests.

*   **Login User - Invalid Credentials (`POST /login`)**
    *   **Request Body:**
        ```json
        {
            "username": "testuser",
            "password": "wrongpassword"
        }
        ```
    *   **Expected Response:** Status Code `401 Unauthorized`, JSON message like `{"message": "Invalid username or password"}`.

*   **Get User Details (`GET /me`)**
    *   **Headers:** `Authorization: Bearer <your_access_token>` (replace `<your_access_token>` with the token from the login step).
    *   **Expected Response:** Status Code `200 OK`, JSON with user details:
        ```json
        {
            "id": 1, 
            "username": "testuser",
            "email": "test@example.com",
            "role": "viewer" 
        }
        ```
        *(ID and role might vary based on implementation)*

*   **Get User Details - No Token (`GET /me`)**
    *   **Headers:** (No Authorization header)
    *   **Expected Response:** Status Code `401 Unauthorized`, error message indicating missing token (e.g., `{"msg": "Missing Authorization Header"}`).

### 3. FamilyTreeInfo Endpoints (`/api/family-tree-info`)

Base URL for these requests: `http://127.0.0.1:5000/api/family-tree-info`

*   **Get Info - Initially (`GET /`)**
    *   **Expected Response:** Status Code `404 Not Found`, JSON message like `{"message": "FamilyTreeInfo not found. Consider creating one."}` (as no info is set yet by default).

*   **Update/Create Info (`POST /`)**
    *   **Headers:** `Authorization: Bearer <your_access_token>` (Use the token obtained during login).
        *(Note: Current backend implementation might not strictly check roles for this, but it's good practice to test as an authenticated user.)*
    *   **Request Body:**
        ```json
        {
            "name": "My Awesome Family",
            "description": "A brief history of our lineage, starting from the early 1900s.",
            "historical_documents_links": "link.to/document1.pdf\nlink.to/another_document.jpg"
        }
        ```
    *   **Expected Response:** Status Code `200 OK`, JSON with the created/updated info:
        ```json
        {
            "id": 1,
            "name": "My Awesome Family",
            "description": "A brief history of our lineage, starting from the early 1900s.",
            "historical_documents_links": "link.to/document1.pdf\nlink.to/another_document.jpg"
        }
        ```
    *   **Verification:** Check your MariaDB `family_tree_info` table to confirm the data is saved/updated correctly. There should typically be only one row.

*   **Get Info - After Update (`GET /`)**
    *   **Expected Response:** Status Code `200 OK`, JSON with the previously set info.

## II. Frontend Application Testing (in a web browser)

### 1. Setup:

*   **Ensure the Flask backend is running and accessible** (see Backend API Testing setup, step 1).
*   **Navigate to the `frontend` directory:**
    ```bash
    cd path/to/your/project/frontend
    ```
*   **Install dependencies (if not done already):**
    ```bash
    npm install
    ```
*   **Start the Vue development server:**
    ```bash
    npm run dev
    ```
*   **Open the application in a browser:** Vite will typically indicate the URL, usually `http://localhost:5173`.

### 2. Family Tree Info Page (`/about-family`)

Navigate to `http://localhost:5173/about-family` in your browser.

*   **View Information:**
    *   **Initial Load:** When the page loads, it should attempt to fetch family tree information.
        *   If no information is set in the backend (e.g., first time running or `family_tree_info` table is empty), the page should display default placeholder values (e.g., "Family Tree Name Not Set", "No description provided.") or a specific "no information" message.
        *   If information *is* set in the backend, the page should display the current `name`, `description`, and `historical_documents_links` correctly. The links should be displayed as a block of text, preserving newlines.
    *   **Loading/Error States:** Observe for brief "Loading..." messages. If the backend is down or returns an error, an error message should be displayed on the page.

*   **Update Information Form:**
    *   **Interaction:** The form fields (Name, Description, Historical Documents/Links) should be editable.
    *   **Populate Form:**
        *   Enter a new name (e.g., "The Updated Family Legacy").
        *   Enter a new description.
        *   Enter or modify links in the "Historical Documents/Links" textarea.
    *   **Submit Form:** Click the "Update Information" button.
    *   **Expected Behavior:**
        *   A request should be sent to the backend (`POST /api/family-tree-info`).
        *   **If successful (and assuming no frontend auth for now):**
            *   The page should display a success message briefly.
            *   The displayed information on the page (above the form) should update to reflect the new values.
            *   **Verification:** The changes should be persisted in the database. You can verify this by refreshing the `/about-family` page, or by using Postman/curl to hit the `GET /api/family-tree-info` backend endpoint.
        *   **If authentication is required by the backend and not implemented/handled by frontend:**
            *   The update will likely fail. An error message should be displayed on the page (e.g., "Failed to update... Ensure you are logged in..."). The specific error might indicate a 401 or 403 if the backend returns these.
            *   The displayed information should *not* change.
        *   **Loading State:** The "Update Information" button should show a "Updating..." state and be disabled during the request.

This guide should help in manually verifying the core functionalities implemented so far. As new features are added, this document should be updated.
