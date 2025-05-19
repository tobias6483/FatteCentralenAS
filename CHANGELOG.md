## Recent Development Updates

### May 19, 2025: Focused API Development Sprint

**Objective**: Advance core API functionalities for Live Sports and Aktiedyst.

**Key Achievements & Remarks**:

*   **Live Sports API Enhancement ([`apps/backend/routes/api_sports.py`](fattecentralen-monorepo/apps/backend/routes/api_sports.py)):**
    *   Refactored the event details endpoint to `GET /api/v1/matches/{match_id}`.
    *   *Comment*: This change streamlines access to specific match data and improves the overall organization of sports-related API routes by utilizing a dedicated blueprint (`matches_api_bp`).
*   **Aktiedyst API V1 Initialization ([`apps/backend/routes/api_aktiedyst.py`](fattecentralen-monorepo/apps/backend/routes/api_aktiedyst.py)):**
    *   Successfully created the foundational scaffolding for the Aktiedyst API (V1).
    *   Placeholder endpoints for key operations (e.g., portfolio, transactions, market data, order placement) are now in place.
    *   *Comment*: This establishes the basic structure, allowing for iterative development of the Aktiedyst features. Mock data is returned by placeholders for initial frontend integration testing.
*   **Backend Integration ([`apps/backend/__init__.py`](fattecentralen-monorepo/apps/backend/__init__.py)):**
    *   Updated to register the newly created blueprints for both the refined Live Sports matches endpoint and the new Aktiedyst V1 API.
    *   *Comment*: Ensures that these new API segments are correctly wired into the Flask application and accessible.

These updates represent significant progress in Phase 1 of the project plan, specifically targeting API definition and implementation.
### May 19, 2025 (Live Sports & Aktiedyst API Scaffolding)

*   **Live Sports API Refinements (`apps/backend/routes/api_sports.py`):**
    *   Refactored the endpoint for fetching specific event/match details to `GET /api/v1/matches/{match_id}`.
    *   This involved creating a new Flask Blueprint `matches_api_bp` specifically for match-related routes, improving organization.
    *   The new `matches_api_bp` was registered in `apps/backend/__init__.py`.
*   **Aktiedyst API V1 Scaffolding (`apps/backend/routes/api_aktiedyst.py`):**
    *   Created a new file `api_aktiedyst.py` to house the V1 Aktiedyst API endpoints.
    *   Defined a new Flask Blueprint `aktiedyst_api_bp` (aliased as `new_aktiedyst_v1_api_bp` in `__init__.py`) with the prefix `/api/v1/aktiedyst`.
    *   Registered the `new_aktiedyst_v1_api_bp` in `apps/backend/__init__.py`.
    *   Added placeholder implementations for the following Aktiedyst API V1 endpoints as per `PROJECT_PLAN.md`:
        *   `GET /api/v1/aktiedyst/ping` (basic test endpoint)
        *   `GET /api/v1/aktiedyst/portfolio`
        *   `GET /api/v1/aktiedyst/transactions`
        *   `GET /api/v1/aktiedyst/markets`
        *   `GET /api/v1/aktiedyst/markets/{symbol}/history`
        *   `POST /api/v1/aktiedyst/orders`
    *   These placeholders include mock data responses and are ready for further implementation of business logic and database integration.
*   **Backend Initialization (`apps/backend/__init__.py`):**
    *   Resolved a Pylance import error related to `api_aktiedyst` by ensuring the file was created before uncommenting its import and registration.

### May 19, 2025 (Model Cleanup & Pylance Fixes)

*   **Backend Model Cleanup & Refinements:**
    *   Removed the unused `JsonUserWrapper` class from `apps/backend/models.py`. This class was a remnant from a previous JSON-based user store and is no longer needed with the SQLAlchemy `User` model.
    *   Removed the corresponding import of `JsonUserWrapper` from `apps/backend/__init__.py`.
    *   Added a generic `__init__(self, **kwargs)` method to the SQLAlchemy `User` model (`apps/backend/models.py`). This resolves Pylance `reportGeneralTypeIssues` (specifically "No parameter named '...'") when instantiating `User` objects with keyword arguments in `apps/backend/routes/auth.py`.

### May 19, 2025 (Pylance and Backend Firebase Authentication)

*   **Resolved Pylance `firebase_admin` Import Resolution Issue:**
    *   Successfully fixed the `reportMissingImports` error for `firebase_admin` in `fattecentralen-monorepo/apps/backend/routes/auth.py`.
    *   **Key Fixes:**
        1.  **VS Code Interpreter Configuration:** Set the `python.defaultInterpreterPath` in `.vscode/settings.json` to the absolute path of the backend's virtual environment interpreter:
            ```json
            {
                "python.defaultInterpreterPath": "/Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/fattecentralen-monorepo/apps/backend/.venv/bin/python"
            }
            ```
        2.  **Pyright Configuration:** Corrected `pyproject.toml` to accurately point Pyright to the virtual environment:
            *   Set `tool.pyright.venvPath` to `/Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/fattecentralen-monorepo/apps/backend/`.
            *   Ensured `tool.pyright.venv` was set to `.venv`.
        3.  **Virtual Environment Recreation:** The virtual environment at `fattecentralen-monorepo/apps/backend/.venv/` was previously recreated using the `--copies` flag, which is crucial for environments where symlinks might cause issues with path resolution by tools like Pylance.
            ```bash
            # Example command used for venv recreation
            /path/to/python3.13 -m venv .venv --copies
            source .venv/bin/activate
            pip install -r requirements.txt
            ```
    *   These changes ensured that Pylance could correctly locate and resolve the `firebase_admin` package and its modules.

*   **Firebase Authentication Integration in Backend API Routes (`apps/backend/routes/auth.py`):**

*   **Firebase Authentication Integration in Backend API Routes (`apps/backend/routes/auth.py`):**
    *   **`@firebase_token_required` Decorator Utilized**: Leveraged the existing decorator from `apps/backend/utils.py` to protect routes requiring Firebase authentication. This decorator verifies the Firebase ID token from the `Authorization: Bearer` header and makes decoded token info available via `flask_g.firebase_user`.
    *   **`/api/v1/auth/me` Route Refactor**:
        *   Changed protection from local JWT (`@jwt_required()`) to `@firebase_token_required`.
        *   User is now identified and fetched from the local database using `firebase_uid` (obtained from the verified Firebase ID token) instead of a local JWT identity.
    *   **`/api/v1/auth/register` Route Repurposed to `register_or_sync_firebase_user`**:
        *   This route now serves as the primary endpoint for synchronizing a Firebase-authenticated user with the local backend database.
        *   Protected by `@firebase_token_required`.
        *   **Existing Firebase User Sync**: If a local user record with the provided `firebase_uid` already exists, the route updates their `last_login` time and potentially syncs email (if changed in Firebase and `email_verified`). It returns user details and local JWTs (though the necessity of local JWTs is under review).
        *   **New Firebase User Local Profile Creation**: If no local user exists for the `firebase_uid`:
            *   The route expects an `invite_code` in the JSON payload for new local profile creation.
            *   A local `username` is either taken from the JSON payload or derived from the Firebase user's display name or email.
            *   The new local `DBUser` record is created with the `firebase_uid`, email from the token, the chosen/derived username, and a `NULL` `password_hash`.
            *   The invite code is validated and consumed.
        *   Local password creation/validation logic has been removed from this flow, as Firebase now manages primary authentication.
    *   **Local JWTs Removed**: Stopped generating local Flask JWTs (access/refresh tokens) in the `register_or_sync_firebase_user` route. The frontend will rely on the Firebase ID token for authenticating API requests.
    *   **New Firebase Account Linking Endpoint**:
        *   Added `POST /api/v1/auth/link-firebase` to `apps/backend/routes/auth.py`.
        *   This endpoint allows a user authenticated via a traditional local Flask session (using `@login_required`) to link their local account to a Firebase account.
        *   It expects a Firebase ID token in the JSON payload, verifies it, and if valid, stores the `firebase_uid` on the local user's record.
        *   Includes checks to prevent linking if the Firebase account is already associated with another local user or if the current user is already linked to a different Firebase account.
    *   **Enhanced Traditional Login Flow (`/auth/login`, `/verify_2fa_login`, `/verify_backup_code` - JSON API parts)**:
        *   Modified the JSON responses for successful local username/password logins.
        *   If the logged-in user's account is **not yet linked** to Firebase (`firebase_uid` is `None`), the response now includes:
            *   `"needs_firebase_link": true`
            *   A message encouraging the user to link their account for enhanced security.
        *   If the logged-in user's account **is already linked** to Firebase, the response now includes:
            *   `"prompt_firebase_login": true`
            *   A message gently nudging the user to use the Firebase login method next time.
        *   This aims to guide users towards the new Firebase authentication system as part of a phased migration.
    *   **Code Cleanup**: Corrected a minor issue in the traditional form-based login part of the `login_route` to safely handle `form.username.data` potentially being `None` before calling `.strip()`.
    *   **Password Reset Flow Update for Firebase Users**: Modified the `request_password_reset` function in `apps/backend/routes/auth.py`. If a user requesting a password reset is already linked to a Firebase account (i.e., `user.firebase_uid` is set), they are now shown a message guiding them to use Firebase's password reset mechanism instead of initiating a local password reset. The local reset process remains for users not linked to Firebase.

### May 18, 2025 (Backend & Firebase Integration Setup)

*   **User Model Enhancements for Firebase Auth:**
    *   Modified `apps/backend/models.py`: Added a `firebase_uid` field (String, unique, nullable, indexed) to the `User` model to store Firebase User UIDs.
    *   Changed the `password_hash` field in the `User` model to be `nullable=True` to accommodate users authenticating primarily via Firebase.
*   **Database Migration:**
    *   Successfully generated and applied a new database migration (`fb4133b9be65_add_firebase_uid_to_user_model_and_make_.py`) to reflect the User model changes.
*   **Project Structure and Import Path Corrections (Backend):**
    *   Refactored `run.py` (at project root) to correctly import `create_app` and `socketio` from the `apps.backend` package.
    *   Updated `run.sh` to set the `PYTHONPATH` environment variable, ensuring that `run.py` can locate the `apps` package within the `fattecentralen-monorepo` subdirectory. This resolved module import issues when running Flask commands from the project root.
    *   Standardized import paths within several backend route files (e.g., `apps/backend/routes/api_dashboard.py`, `apps/backend/routes/messages.py`) to use the `apps.backend.` prefix, ensuring consistency and resolving `ModuleNotFoundError` issues during application startup.
*   **Firebase Admin SDK Integration (Backend):**
    *   Verified and ensured the `firebase-admin` Python package is correctly installed and accessible within the backend's virtual environment.
    *   Confirmed that the Firebase Admin SDK initializes successfully within the Flask application (`apps/backend/__init__.py`) at startup.
*   **Build/Environment Fixes:**
    *   Addressed various `ModuleNotFoundError` issues encountered during `flask db migrate` and application startup by correcting Python import paths and ensuring the correct virtual environment and `PYTHONPATH` were used.
    *   Ensured all existing database migrations were applied (`flask db upgrade`) before generating new ones.

