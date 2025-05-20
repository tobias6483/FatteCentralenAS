# Fattecentralen - Modernization In Progress

**⚠️ This project is currently undergoing a significant modernization effort and is not yet feature-complete or stable. ⚠️**

This repository contains the Fattecentralen project, which is being transformed from its original HTML, JavaScript, and Python (Flask) stack into a modern web application. The goal is to create a high-performance, scalable platform with an enhanced user experience.

The new architecture involves:
*   A **monorepo structure** (`fattecentralen-monorepo/`) housing the distinct frontend and backend applications.
*   A **Next.js frontend** (React, TypeScript, Tailwind CSS, Shadcn/ui) for a dynamic Single Page Application (SPA) experience. This means that while the application will have many "pages" or views (converted from the original HTML files), navigation between them will primarily involve dynamically updating the content of the main page rather than full page reloads from the server, leading to a faster and smoother user experience.
*   A **Python/Flask backend** serving as a headless API, integrated with Firebase for authentication and potentially other services.

## Project Vision

To transform the Fattecentralen project into a state-of-the-art web application. The frontend will be inspired by UI/UX from platforms like Bet365/FlashScore (for Sports) and Nordnet/TradingView (for Stock Market Challenge). The backend will continue to use Python/Flask for core business logic while leveraging Firebase for robust authentication and other real-time features.

## Current Status & Key Technologies

The project is actively under development. Key modernization efforts include:

*   **Frontend:**
    *   Next.js (App Router)
    *   React & TypeScript
    *   Tailwind CSS & Shadcn/ui for styling and UI components
    *   Zustand for state management
    *   TanStack Query (React Query) for server-state management
    *   React Hook Form & Zod for forms and validation
    *   Firebase SDK for authentication and real-time database interactions
*   **Backend:**
    *   Python & Flask (as a headless API)
    *   Firebase Admin SDK for backend authentication verification
    *   SQLAlchemy for database interaction (existing database)
    *   Flask-SocketIO for real-time communication
*   **Monorepo Structure:**
    *   The `fattecentralen-monorepo/` directory contains the new `apps/frontend/` and `apps/backend/`.
    *   The original Flask application (HTML templates, static assets) is still present in the root directory but is being progressively replaced.

## Development Progress

We are following a phased approach outlined in the `PROJECT_PLAN.md`. Recent developments and ongoing work can be tracked in the `CHANGELOG.md`.

**Key recent updates include:**
*   Establishment of the monorepo structure.
*   Initialization of the Next.js frontend application with core dependencies and tooling (ESLint, Prettier, Shadcn/ui).
*   Integration of Firebase Authentication in the backend, including modifications to user models and API routes to support Firebase UIDs and token verification.
*   Refinement of backend models and Pylance type checking.
*   Cleanup of project structure and `.gitignore` configurations.

## What's Next?

The immediate next steps involve:
*   Continuing the backend API development and ensuring all necessary endpoints are Firebase-aware.
*   Beginning the transformation of existing HTML/CSS/JS pages into Next.js/React components.
*   Integrating the new frontend with the backend APIs for data fetching and real-time updates.

Please refer to `PROJECT_PLAN.md` for a detailed roadmap.

---

This README provides a high-level overview. For more detailed information, please consult:
*   `PROJECT_PLAN.md`: The comprehensive plan for the modernization effort.
*   `CHANGELOG.md`: A log of recent development activities and changes.
*   `fattecentralen-monorepo/apps/frontend/README.md`: For frontend-specific details.
*   (Consider adding a `fattecentralen-monorepo/apps/backend/README.md` in the future for backend specifics)
