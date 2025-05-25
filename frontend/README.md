# Frontend for Family Tree Application (Vue.js + Vite)

This document provides instructions for setting up and running the frontend Vue.js application.

## Prerequisites

- Node.js (version recommended by Vite, e.g., 18.x, 20.x)
- npm or yarn (or pnpm)

## Project Setup

1.  **Navigate to the `frontend` directory:**
    ```bash
    cd path/to/your/project/frontend
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

3.  **Environment Variables (Optional/If Applicable):**
    If the frontend requires specific environment variables (e.g., `VITE_API_BASE_URL` if not using proxy, or other VITE prefixed variables), create a `.env` file in the `frontend` directory by copying `.env.example` (if one exists) and fill in the required values.
    Currently, the backend API calls are proxied through Vite's dev server settings in `vite.config.js`, so a specific `VITE_API_BASE_URL` is not strictly needed for local development against `http://localhost:5000`.

## Development Server

To start the development server with hot-reloading:

Using npm:
```bash
npm run dev
```
Or using yarn:
```bash
yarn dev
```
The application will typically be available at `http://localhost:5173` (Vite will indicate the exact port).

## Building for Production

To create a production build:

Using npm:
```bash
npm run build
```
Or using yarn:
```bash
yarn build
```
The production-ready files will be generated in the `dist/` directory.

## Running Tests (Vitest)

The frontend tests are written using Vitest.

1.  **Ensure Dev Dependencies are Installed:**
    If you haven't already, running `npm install` or `yarn install` (as per Project Setup) should have installed Vitest and other testing libraries from `devDependencies` in `package.json`.

2.  **Run Tests:**
    The following commands can be run from the `frontend` directory:

    *   **Run all tests once in the console:**
        ```bash
        npm test
        # or
        yarn test
        ```

    *   **Run tests in watch mode with UI (Vitest UI):**
        This provides an interactive interface in your browser to view test results.
        ```bash
        npm run test:ui
        # or
        yarn test:ui
        ```

    *   **Generate a coverage report:**
        This command runs the tests and generates a coverage report.
        ```bash
        npm run coverage
        # or
        yarn coverage
        ```
        Coverage reports are typically generated in the `frontend/coverage/` directory (e.g., an HTML report that can be opened in a browser) and/or output to the console, as configured in `vite.config.js`.

## Project Structure (Key Frontend Directories)

-   `src/`: Contains the main source code.
    -   `assets/`: Static assets like CSS, images (if not in `public/`).
    -   `components/`: Reusable Vue components.
        -   `members/`: Components specific to member management.
    -   `router/`: Vue Router configuration (`index.js`).
    -   `stores/`: Pinia state management stores (`authStore.js`, `memberStore.js`, etc.).
    -   `views/`: Page-level Vue components mapped to routes.
        -   `members/`: Views specific to member management.
    -   `App.vue`: The main application shell component.
    -   `main.js`: The entry point of the application, initializes Vue, Pinia, Router.
-   `public/`: Static assets that are directly copied to the build root.
-   `tests/`: Contains Vitest unit and component tests.
    -   `setup.js`: Global setup for tests (e.g., mocking localStorage, router).
    -   `components/`, `stores/`, `views/`: Subdirectories for organizing tests.
-   `vite.config.js`: Vite configuration, including Vitest setup and dev server proxy.
-   `package.json`: Project dependencies and scripts.
```
