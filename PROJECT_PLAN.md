Absolut! Her er en komplet og opdateret projektplan for "Fattecentralen", designet til at være struktureret og med plads til kreativitet med de valgte teknologier. Alle tidligere afkrydsninger er fjernet for at give et klart billede af den nye start. Planen tager højde for dine ønsker om en monorepo-tilgang, integration af Firebase (specielt til autentificering og potentielt andre services), og at omdanne dit eksisterende projekt til Next.js, React, TypeScript, Tailwind CSS.

Fattecentralen Projekt - Komplet Moderniseringsplan (Revideret)

Overordnet Vision:
At transformere det nuværende Fattecentralen-projekt (HTML, JavaScript, Python, CSS) til en topmoderne, højtydende og skalerbar webapplikation. Frontend moderniseres til en Single Page Application (SPA) med Next.js, React, og TypeScript, inspireret af UI/UX fra platforme som Bet365/FlashScore (for Sport) og Nordnet/TradingView (for Aktiedyst). Backend forbliver Python/Flask for kerneforretningslogikken, men udvides og integreres med Firebase for autentificering og potentielt andre realtids-/databaseløsninger. Projektet struktureres som et monorepo.

Overordnet Arkitektur Filosofi:

Monorepo: Frontend og backend udvikles i et samlet Git-repository for centraliseret versionsstyring, nemmere deling af kode/typer (hvor relevant) og forenklede build/deploy processer.
Frontend (Next.js): Håndterer al brugerinteraktion, visning og klient-side logik. Udnytter Next.js App Router, Server Components (for performance og SEO) og Client Components (for interaktivitet). Stærkt fokus på at omdanne eksisterende HTML-sider til genbrugelige React-komponenter.
Backend (Python/Flask): Fungerer primært som en "headless" API-leverandør til den nye Next.js frontend. Den håndterer kerneforretningslogik (sport, aktiedyst-logik), databaseinteraktion (med eksisterende database) og real-time events via WebSockets (Flask-SocketIO).
API Lag (REST): Klare, konsistente RESTful API'er udstilles af Python-backenden, som Next.js-frontenden kommunikerer med via fetch API eller biblioteker som TanStack Query.
Autentificering (Firebase Authentication): Håndteres af Firebase for robust, sikker og skalerbar brugerstyring (login, signup, password reset etc.). JWTs fra Firebase vil blive brugt til at autentificere anmodninger til Flask-backend.
Real-time Kommunikation (Flask-SocketIO & evt. Firebase): Den eksisterende Flask-SocketIO (app/sockets.py) bibeholdes og optimeres for live-opdateringer (sportsresultater, aktiekurser). Firebase Realtime Database eller Firestore kan overvejes til specifikke realtidsfeatures (f.eks. chat, notifikationer) for at aflaste Flask.
Styling (Tailwind CSS & Shadcn/ui): Utility-first CSS med Tailwind CSS for hurtig UI-udvikling. Shadcn/ui bruges som base for smukke, tilgængelige og tilpassede UI-komponenter.
Database (Eksisterende + Firebase): Den primære database for kernefunktionalitet (sport, aktiedyst-data) forbliver den, der er knyttet til Flask (formodentlig SQLite/PostgreSQL via SQLAlchemy). Firebase Firestore/Realtime Database kan bruges til nye funktioner eller data, der passer godt til NoSQL-modellen (f.eks. brugerprofil-udvidelser, notifikationer, forum-indlæg).
Teknologi Stack (Udvalgte Værktøjer):

Monorepo Tool: npm/yarn/pnpm workspaces eller Nx/Turborepo (start simpelt med workspaces).
Frontend: Next.js (App Router), React, TypeScript.
Backend (API): Python, Flask, Flask-RESTful (eller lignende).
Styling: Tailwind CSS, Shadcn/ui.
State Management (Client): Zustand eller Jotai (foretrækkes over React Context for global state). TanStack Query (React Query) for server-state.
Formularer: React Hook Form med Zod til validering.
Animation: Framer Motion (primært), Anime.js (til specifikke, komplekse animationer hvis nødvendigt).
Diagrammer/Grafer: Recharts eller Nivo.
Real-time (Client-Backend): Socket.IO Client.
Autentificering: Firebase Authentication.
Database (Suppl.): Firebase Firestore eller Realtime Database.
Testing: Jest & React Testing Library (unit/integration), Playwright eller Cypress (E2E).
Linting/Formatting: ESLint, Prettier.
Deployment: Vercel (for Next.js frontend), Docker & en cloud-platform (f.eks. Google Cloud Run, AWS ECS/App Runner) for Flask backend. Firebase Hosting for statiske dele, hvis relevant.

Fase 0: Monorepo & Grundlæggende Frontend Setup
Mål: At etablere monorepo-strukturen, initialisere et kørende Next.js-projekt med grundlæggende konfiguration, tooling og Firebase-integration.

[X] Etabler Monorepo Struktur:
[X] Opret en rodmappe (f.eks. fattecentralen-monorepo/).
[X] Initialiser package.json i roden for at håndtere workspaces. (Note: `npm init -y` anvendt)
[X] Opret apps/ mappe.
[X] Flyt eksisterende Flask-backend-kode (app/) til apps/backend/.
[X] Opret apps/frontend/ for Next.js-projektet.
[ ] (Valgfrit senere) Opret packages/ mappe for delt kode (f.eks. packages/ui-core, packages/types).
[X] Initialiser Next.js Projekt (i apps/frontend/):
[X] Kør: npx create-next-app@latest . --typescript --tailwind --eslint --app (indenfor apps/frontend/).
[X] Konfigurer src/ directory hvis det ikke er standard. (Note: `src/` blev oprettet som standard under initialisering)
[X] Installer Basis Frontend Afhængigheder (i apps/frontend/):
[X] Primære: @tanstack/react-query, zustand (eller jotai), react-hook-form, zod, framer-motion, socket.io-client, recharts (eller nivo), firebase. (Note: `zustand` og `recharts` valgt)
[X] Dev: @tanstack/eslint-plugin-query, @testing-library/react, @testing-library/jest-dom, jest, jest-environment-jsdom, @types/jest, prettier-plugin-tailwindcss.
[X] Opsæt Shadcn/ui (i apps/frontend/):
[X] Kør: npx shadcn-ui@latest init. (Note: `npx shadcn@latest init` anvendt da `shadcn-ui` er deprecated. Valgte 'Slate' som basefarve og `--legacy-peer-deps` for React 19.)
[X] Installer nødvendige komponenter: button, card, input, label, table, tabs, dialog, skeleton, badge, avatar, dropdown-menu, toast etc. (Note: `sonner` installeret i stedet for `toast` da det er deprecated.)
[X] Konfigurer Linting & Formatting (i apps/frontend/ og roden):
[X] Opsæt ESLint (.eslintrc.json) og Prettier (.prettierrc.js med prettier-plugin-tailwindcss) i apps/frontend/. (Note: ESLint konfigureret som `eslint.config.mjs` af Next.js. `.prettierrc.js` oprettet.)
[X] Overvej en global Prettier-konfiguration i monorepo-roden. (Note: Global config oprettet i `fattecentralen-monorepo/.prettierrc.js`. Frontend-specifik config i `fattecentralen-monorepo/apps/frontend/.prettierrc.js` er bibeholdt for nu; overvej konsolidering/fjernelse senere.)
[X] Etabler Grundlæggende Frontend Mappestruktur (i apps/frontend/src/):
[X] app/ (Routing, Pages, Layouts - Next.js standard) (Oprettet af Next.js)
[X] components/ (Genbrugelige UI-komponenter: ui/ (Shadcn-baserede/generiske), layout/, features/) (Note: `ui/` oprettet af Shadcn, `layout/` og `features/` manuelt)
[X] lib/ (Hjælpefunktioner, utils, constants, Firebase SDK setup, API-klient opsætning) (Note: `lib/utils.ts` oprettet af Shadcn)
[X] hooks/ (Custom React Hooks) (Oprettet manuelt)
[X] store/ (Zustand/Jotai stores) (Oprettet manuelt)
[X] styles/ (Global CSS udover Tailwind, globals.css) (Note: `src/app/globals.css` dækker dette for nu)
[X] types/ (Globale TypeScript interfaces/types, evt. delt fra packages/types senere) (Oprettet manuelt)
[X] Implementer Grundlæggende Layout (i apps/frontend/src/):
[X] Opret components/layout/DashboardLayout.tsx (indeholder Header, Sidebar/Navbar, Footer, main content area for {children}).
[X] Brug DashboardLayout i app/layout.tsx. (Note: Titel og beskrivelse i `layout.tsx` også opdateret.)
[ ] Opsæt navigationselementer (statisk for nu).
[X] Opsæt Basis Test Framework (i apps/frontend/):
[X] Konfigurer Jest (jest.config.js, jest.setup.js).
[X] Skriv en simpel komponenttest for at verificere setup. (Note: Test for `DashboardLayout.tsx` oprettet. `@testing-library/jest-dom` tilføjet til `tsconfig.json` for at løse typefejl.)
[X] Firebase Projekt Setup & SDK Integration:
[X] Opret et nyt Firebase-projekt i Firebase Console. (User confirmed. Note: Firebase Hosting setup was skipped during web app registration as per plan.)
[X] Aktiver Firebase Authentication (vælg login-metoder, f.eks. E-mail/Password, Google). (User confirmed Email/Password enabled)
[X] (Valgfrit for nu) Aktiver Firestore eller Realtime Database. (User confirmed Realtime Database enabled)
[X] Hent Firebase config-objektet og gem det sikkert i apps/frontend/ (via miljøvariabler). (Stored in `.env.local`)
[X] Initialiser Firebase SDK i apps/frontend/src/lib/firebase.ts (eller lignende). (Created `src/lib/firebase.ts` with initialization logic)

Fase 1: Backend API Klargøring & Grundlæggende Autentificering (Python/Flask apps/backend/)
Mål: At sikre at backend'en eksponerer de nødvendige API'er, integrerer med Firebase Authentication, og at real-time setup er klar.

**Generelle Bemærkninger og Status for Indledende Backend Arbejde:**
*   **Fuldført Indledende API'er**: Kernen af User Profile API (`GET` og `PUT` for `/api/v1/users/me/profile`) og Forum API'er (fuld CRUD for tråde og posts) er implementeret og funktionelle. Se [`CHANGELOG.md`](CHANGELOG.md) for detaljer (Maj 19).
*   **Lokal Flask JWTs vs. Firebase ID Tokens**: Der er en løbende overvejelse om potentielt at udfase lokale Flask JWTs (access/refresh tokens) genereret af backend til API-autentificering. Målet ville være, at frontend udelukkende stoler på Firebase ID tokens for alle API-anmodninger for at strømline autentificering. Dette er stadig under diskussion, og den nuværende lokale JWT-generering forbliver på plads indtil videre.
*   **Løbende Opgaver**: Fejlhåndtering, sikkerhedsforbedringer, databasemigreringer og omfattende testning vil være kontinuerlige bestræbelser gennem alle faser.

**Detaljerede Opgaver for Fase 1:**

79.1 | [X] Backend Miljø Opsætning:
79.2 |   [X] Genereret `requirements.txt` fra det oprindelige projektmiljø.
79.3 |   [X] Flyttet `requirements.txt` til `fattecentralen-monorepo/apps/backend/`.
79.4 |   [X] Oprettet et nyt virtuelt miljø (`.venv`) i `fattecentralen-monorepo/apps/backend/`.
79.5 |   [X] Installeret afhængigheder fra `requirements.txt` i det nye backend-miljø.
79.6 |   [X] Downloadet Firebase Admin SDK service account key og gemt sikkert. (Note: Gemt i `~/.firebase_keys/fattecentralenas-service-account.json`)
79.7 |   [X] Konfigureret environment variable for service account key path. (Note: `GOOGLE_APPLICATION_CREDENTIALS` sat i `apps/backend/.env`)
[X] Flask-JWT-Extended & Firebase Auth Integration: (Omfattende arbejde udført på Firebase ID token validering, API endpoint refactoring for Firebase auth, og sammenkædning af lokale konti. Se CHANGELOG Maj 19.)
  Flask-JWT-Extended er allerede delvist opsat. Nu skal fokus være på at validere JWTs udstedt af Firebase Authentication.
  [X] Implementer en funktion/decorator i Flask til at verificere Firebase ID tokens sendt i Authorization headeren fra frontend. (Udført, f.eks. @firebase_token_required)
  [X] Opdater login_route, register_route, me_route til ikke selv at udstede JWTs, men i stedet forvente at frontend håndterer login/signup via Firebase, og derefter sender Firebase ID token til Flask. me_route vil validere dette token og returnere brugerdata fra din lokale database baseret på Firebase UID. (Udført for /api/v1/auth/me og register_or_sync_firebase_user)
  [X] Sørg for at user_loader mm. i Flask-JWT-Extended fungerer med brugeridentiteter fra Firebase-tokens (f.eks. ved at slå brugeren op i din database via Firebase UID). (Implicit håndteret ved at hente bruger via firebase_uid)
  *Bemærkning: Som diskuteret forbliver lokal JWT-generering i traditionelle login-flows indtil videre. Fokus er på Firebase ID token validering for API-kald.*
[X] Database Review (Eksisterende apps/backend/): (Bruger model udvidet for Firebase, migrationer anvendt. Se CHANGELOG Maj 18.)
  [X] Bekræft at nuværende databasemodeller (models.py) er tilstrækkelige for kernefunktionaliteter. Migrationer (Alembic/Flask-Migrate) skal være up-to-date. (Modeller opdateret, migrationer kørt)
[/] API Design - Live Sports (Mål: Omfattende API dækning):
    *   [X] GET /api/v1/sports: Liste af sportsgrene/ligaer.
    *   [X] GET /api/v1/sports/{sportId}/matches?status=[live|upcoming|finished]&date=YYYY-MM-DD: Liste af kampe.
    *   [X] GET /api/v1/matches/{matchId}: Detaljer for én kamp. (Endpoint refactored, blueprint `matches_api_bp` created)
    *   [X] Definer JSON request/response strukturer for hver.
    *   *Status: JSON request/response strukturer for eksisterende endpoints er defineret nedenfor. Yderligere endpoints for ligaer, hold, stillinger og udvidede kampdetaljer er foreslået for omfattende dækning.*
```markdown
### Live Sports API JSON Structures:

**1. `GET /api/v1/sports`**
    *   Description: Retrieves a list of all available sports.
    *   Response: `200 OK`
        ```json
        [
          {
            "id": "football",
            "name": "Football",
            "icon_svg_name": "football-icon",
            "league_count": 15
          },
          {
            "id": "basketball",
            "name": "Basketball",
            "icon_svg_name": "basketball-icon",
            "league_count": 8
          }
        ]
        ```

**2. `GET /api/v1/sports/{sportId}/matches`**
    *   Description: Retrieves a list of matches for a specific sport, filterable by status and date.
    *   Path Parameters:
        *   `sportId` (string): The ID of the sport (e.g., "football").
    *   Query Parameters:
        *   `status` (string, optional): `live`, `upcoming`, `finished`, `scheduled`. Default: `upcoming`.
        *   `date` (string, optional, format: `YYYY-MM-DD`): Filter matches for a specific date.
        *   `leagueId` (string, optional): Filter matches for a specific league within the sport.
        *   `page` (integer, optional, default: 1): Page number for pagination.
        *   `per_page` (integer, optional, default: 20): Number of matches per page.
    *   Response: `200 OK`
        ```json
        {
          "sport": {
            "id": "football",
            "name": "Football"
          },
          "filters": {
            "status": "live",
            "date": "2025-05-20",
            "leagueId": "premier-league"
          },
          "matches": [
            {
              "id": "match_123",
              "league": {
                "id": "premier-league",
                "name": "Premier League",
                "logo_url": "/static/logos/premier_league.png"
              },
              "home_team": {
                "id": "team_A",
                "name": "Team A",
                "logo_url": "/static/logos/team_a.png"
              },
              "away_team": {
                "id": "team_B",
                "name": "Team B",
                "logo_url": "/static/logos/team_b.png"
              },
              "start_time_utc": "2025-05-20T19:00:00Z",
              "status": "live",
              "minute": 65,
              "score": {
                "home": 1,
                "away": 0,
                "period": "2H"
              },
              "venue": {
                "id": "venue_1",
                "name": "Stadium X",
                "city": "City Y"
              }
            }
          ],
          "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total_items": 5,
            "total_pages": 1
          }
        }
        ```

**3. `GET /api/v1/matches/{matchId}`**
    *   Description: Retrieves detailed information for a single match.
    *   Path Parameters:
        *   `matchId` (string): The ID of the match.
    *   Response: `200 OK`
        ```json
        {
          "id": "match_123",
          "sport": { "id": "football", "name": "Football" },
          "league": { "id": "premier-league", "name": "Premier League", "country": "England", "logo_url": "/static/logos/premier_league.png" },
          "home_team": { "id": "team_A", "name": "Team A", "logo_url": "/static/logos/team_a.png", "country": "England" },
          "away_team": { "id": "team_B", "name": "Team B", "logo_url": "/static/logos/team_b.png", "country": "England" },
          "start_time_utc": "2025-05-20T19:00:00Z",
          "status": "finished",
          "minute": 90,
          "score": {
            "home": 2, "away": 1, "winner": "home", "period": "FT",
            "half_time_score": { "home": 1, "away": 0 },
            "full_time_score": { "home": 2, "away": 1 }
          },
          "venue": { "id": "venue_1", "name": "Stadium X", "city": "City Y", "capacity": 50000 },
          "referee": { "id": "ref_007", "name": "John Doe", "nationality": "English" },
          "lineups": {
            "home_team_formation": "4-3-3", "away_team_formation": "4-4-2",
            "home_team_starters": [{ "player_id": "p1", "player_name": "Player One", "jersey_number": 10, "position": "Forward" }],
            "away_team_starters": [{ "player_id": "p101", "player_name": "Player One Oh One", "jersey_number": 7, "position": "Midfielder" }],
            "home_team_substitutes": [{ "player_id": "p2", "player_name": "Player Two", "jersey_number": 15, "position": "Defender" }],
            "away_team_substitutes": [{ "player_id": "p102", "player_name": "Player One Oh Two", "jersey_number": 18, "position": "Forward" }]
          },
          "events": [
            { "id": "event_1", "type": "goal", "minute": 25, "team_id": "team_A", "player_id": "p1", "player_name": "Player One", "detail": "Left foot shot", "score_at_event": { "home": 1, "away": 0 } },
            { "id": "event_2", "type": "card", "minute": 30, "team_id": "team_B", "player_id": "p101", "player_name": "Player One Oh One", "detail": "Yellow Card - Unsporting behavior" }
          ],
          "statistics": {
            "home_team": { "possession_percentage": 60, "shots_total": 15, "shots_on_target": 7, "corners": 8, "fouls_committed": 10 },
            "away_team": { "possession_percentage": 40, "shots_total": 8, "shots_on_target": 3, "corners": 3, "fouls_committed": 12 }
          },
          "head_to_head_summary": {
            "last_5_matches": [{ "match_id": "h2h_1", "date": "2024-10-10", "home_team_score": 1, "away_team_score": 1, "winner": "draw" }],
            "overall_stats": { "total_matches": 10, "team_a_wins": 5, "team_b_wins": 3, "draws": 2 }
          },
          "betting_odds": {
             "pre_match": [{"bookmaker_id": "bm1", "market_name": "Match Winner", "odds": [{"outcome": "Home", "value": 1.8}, {"outcome": "Draw", "value": 3.5}, {"outcome": "Away", "value": 4.0}]}]
          }
        }
        ```

**Proposed New Endpoints for Comprehensive Live Sports API Coverage:**

**4. `GET /api/v1/sports/{sportId}/leagues`**
    *   Description: Retrieves a list of leagues for a specific sport.
    *   Path Parameters: `sportId` (string)
    *   Query Parameters: `page` (int, opt), `per_page` (int, opt)
    *   Response: `200 OK`
        ```json
        {
          "sport": { "id": "football", "name": "Football" },
          "leagues": [
            { "id": "premier-league", "name": "Premier League", "country_code": "GB", "country_name": "United Kingdom", "logo_url": "/static/logos/premier_league.png", "current_season_id": "season_2024_2025", "type": "League" }
          ],
          "pagination": { "current_page": 1, "per_page": 20, "total_items": 1, "total_pages": 1 }
        }
        ```

**5. `GET /api/v1/leagues/{leagueId}`**
    *   Description: Retrieves details for a specific league.
    *   Path Parameters: `leagueId` (string)
    *   Response: `200 OK`
        ```json
        {
          "id": "premier-league", "name": "Premier League", "sport_id": "football", "country_code": "GB", "country_name": "United Kingdom", "logo_url": "/static/logos/premier_league.png",
          "current_season": { "id": "season_2024_2025", "name": "2024/2025", "start_date": "2024-08-10", "end_date": "2025-05-18" },
          "type": "League",
          "active_seasons": [ {"id": "season_2024_2025", "name": "2024/2025"}, {"id": "season_2023_2024", "name": "2023/2024"} ]
        }
        ```

**6. `GET /api/v1/leagues/{leagueId}/standings`**
    *   Description: Retrieves the standings for a specific league and season.
    *   Path Parameters: `leagueId` (string)
    *   Query Parameters: `seasonId` (string, opt)
    *   Response: `200 OK`
        ```json
        {
          "league": { "id": "premier-league", "name": "Premier League" },
          "season": { "id": "season_2024_2025", "name": "2024/2025" },
          "standings": [
            {
              "group_name": "Overall",
              "table": [
                { "rank": 1, "team": { "id": "team_A", "name": "Team A", "logo_url": "/static/logos/team_a.png" }, "played": 10, "wins": 8, "draws": 1, "losses": 1, "goals_for": 25, "goals_against": 5, "goal_difference": 20, "points": 25, "form": "WWLWD" }
              ]
            }
          ]
        }
        ```

**7. `GET /api/v1/leagues/{leagueId}/teams`**
    *   Description: Retrieves teams in a specific league and season.
    *   Path Parameters: `leagueId` (string)
    *   Query Parameters: `seasonId` (string, opt), `page` (int, opt), `per_page` (int, opt)
    *   Response: `200 OK`
        ```json
        {
          "league": { "id": "premier-league", "name": "Premier League" },
          "season": { "id": "season_2024_2025", "name": "2024/2025" },
          "teams": [
            { "id": "team_A", "name": "Team A", "short_name": "TMA", "country": "England", "logo_url": "/static/logos/team_a.png", "venue_name": "Stadium X" }
          ],
          "pagination": { "current_page": 1, "per_page": 20, "total_items": 1, "total_pages": 1 }
        }
        ```

**8. `GET /api/v1/teams/{teamId}`**
    *   Description: Retrieves details for a specific team.
    *   Path Parameters: `teamId` (string)
    *   Response: `200 OK`
        ```json
        {
          "id": "team_A", "name": "Team A", "short_name": "TMA", "country": "England", "founded_year": 1900, "logo_url": "/static/logos/team_a.png",
          "venue": { "id": "venue_1", "name": "Stadium X", "city": "City Y", "capacity": 50000 },
          "current_leagues": [ { "id": "premier-league", "name": "Premier League" } ],
          "coach": { "id": "coach_1", "name": "Coach Name", "nationality": "Spanish" }
        }
        ```

**9. `GET /api/v1/teams/{teamId}/matches`**
    *   Description: Retrieves matches for a specific team.
    *   Path Parameters: `teamId` (string)
    *   Query Parameters: `status` (string, opt), `seasonId` (string, opt), `limit` (int, opt), `page` (int, opt), `per_page` (int, opt)
    *   Response: `200 OK`
        ```json
        {
          "team": { "id": "team_A", "name": "Team A" },
          "filters": { "status": "upcoming", "seasonId": "season_2024_2025" },
          "matches": [
            {
              "id": "match_456",
              "league": { "id": "premier-league", "name": "Premier League" },
              "home_team": { "id": "team_A", "name": "Team A" },
              "away_team": { "id": "team_C", "name": "Team C" },
              "start_time_utc": "2025-05-25T14:00:00Z",
              "status": "upcoming",
              "venue": { "id": "venue_1", "name": "Stadium X" }
            }
          ],
          "pagination": { "current_page": 1, "per_page": 10, "total_items": 5, "total_pages": 1 }
        }
        ```

*Note: Consider adding `Player` related endpoints (`/api/v1/players/{playerId}`, `/api/v1/players/{playerId}/stats`) in a future iteration if detailed player information becomes a requirement.*

```
[/] API Design - Aktiedyst (Mål: Omfattende API dækning):
    *   [X] GET /api/v1/aktiedyst/portfolio: Brugerens portefølje (kræver Firebase Auth). (Placeholder implemented)
    *   [X] GET /api/v1/aktiedyst/transactions: Brugerens transaktionshistorik (kræver Firebase Auth). (Placeholder implemented)
    *   [X] GET /api/v1/aktiedyst/markets: Liste over handlebare aktier/symboler. (Placeholder implemented)
    *   [X] GET /api/v1/aktiedyst/markets/{symbol}/history?period=[1d|7d|1m|...]: Kursdata. (Placeholder implemented)
    *   [X] POST /api/v1/aktiedyst/orders: Placer en ordre (kræver Firebase Auth). (Placeholder implemented)
    *   [X] Definer JSON request/response strukturer for hver.
    *   *Status: JSON request/response strukturer for eksisterende endpoints er defineret nedenfor. Yderligere endpoints for markedsdetaljer, ordrestatus, og potentielt ranglister er foreslået for omfattende dækning.*
```markdown
### Aktiedyst API JSON Structures:

**1. `GET /api/v1/aktiedyst/portfolio`**
    *   Description: Retrieves the current user's stock portfolio. Requires Firebase Authentication.
    *   Response: `200 OK`
        ```json
        {
          "user_uid": "firebase_auth_user_uid",
          "portfolio_value": 12550.75,
          "cash_balance": 1550.25,
          "total_investment": 11000.50,
          "overall_pnl": 1550.25,
          "overall_pnl_percentage": 14.09,
          "holdings": [
            {
              "symbol": "AAPL",
              "company_name": "Apple Inc.",
              "quantity": 10,
              "average_buy_price": 150.00,
              "current_price": 175.50,
              "market_value": 1755.00,
              "pnl": 255.00,
              "pnl_percentage": 17.00,
              "logo_url": "/static/logos/aapl.png"
            },
            {
              "symbol": "MSFT",
              "company_name": "Microsoft Corp.",
              "quantity": 5,
              "average_buy_price": 300.00,
              "current_price": 320.10,
              "market_value": 1600.50,
              "pnl": 100.50,
              "pnl_percentage": 6.67,
              "logo_url": "/static/logos/msft.png"
            }
          ],
          "last_updated_utc": "2025-05-20T10:30:00Z"
        }
        ```

**2. `GET /api/v1/aktiedyst/transactions`**
    *   Description: Retrieves the current user's transaction history. Requires Firebase Authentication.
    *   Query Parameters:
        *   `page` (integer, optional, default: 1): Page number for pagination.
        *   `per_page` (integer, optional, default: 20): Number of transactions per page.
        *   `type` (string, optional): Filter by transaction type (`buy`, `sell`).
        *   `symbol` (string, optional): Filter by stock symbol.
    *   Response: `200 OK`
        ```json
        {
          "user_uid": "firebase_auth_user_uid",
          "transactions": [
            {
              "id": "txn_123",
              "symbol": "AAPL",
              "company_name": "Apple Inc.",
              "type": "buy",
              "quantity": 10,
              "price_per_share": 150.00,
              "total_amount": 1500.00,
              "timestamp_utc": "2025-05-10T14:30:00Z",
              "status": "completed"
            },
            {
              "id": "txn_124",
              "symbol": "MSFT",
              "company_name": "Microsoft Corp.",
              "type": "sell",
              "quantity": 2,
              "price_per_share": 310.00,
              "total_amount": 620.00,
              "timestamp_utc": "2025-05-15T09:15:00Z",
              "status": "completed"
            }
          ],
          "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total_items": 2,
            "total_pages": 1
          }
        }
        ```

**3. `GET /api/v1/aktiedyst/markets`**
    *   Description: Retrieves a list of tradable stocks/symbols.
    *   Query Parameters:
        *   `page` (integer, optional, default: 1): Page number for pagination.
        *   `per_page` (integer, optional, default: 50): Number of markets per page.
        *   `search` (string, optional): Search by symbol or company name.
        *   `sector` (string, optional): Filter by sector (e.g., "Technology").
    *   Response: `200 OK`
        ```json
        {
          "markets": [
            {
              "symbol": "AAPL",
              "company_name": "Apple Inc.",
              "current_price": 175.50,
              "change_today_value": 1.25,
              "change_today_percentage": 0.72,
              "market_cap": 2.8E12,
              "sector": "Technology",
              "exchange": "NASDAQ",
              "logo_url": "/static/logos/aapl.png"
            },
            {
              "symbol": "GOOGL",
              "company_name": "Alphabet Inc.",
              "current_price": 150.70,
              "change_today_value": -0.50,
              "change_today_percentage": -0.33,
              "market_cap": 1.9E12,
              "sector": "Communication Services",
              "exchange": "NASDAQ",
              "logo_url": "/static/logos/googl.png"
            }
          ],
          "pagination": {
            "current_page": 1,
            "per_page": 50,
            "total_items": 100,
            "total_pages": 2
          }
        }
        ```

**4. `GET /api/v1/aktiedyst/markets/{symbol}/history`**
    *   Description: Retrieves historical price data for a specific stock symbol.
    *   Path Parameters:
        *   `symbol` (string): The stock symbol (e.g., "AAPL").
    *   Query Parameters:
        *   `period` (string, optional): `1d`, `5d`, `1m`, `3m`, `6m`, `1y`, `ytd`, `max`. Default: `1m`.
        *   `interval` (string, optional): `1min`, `5min`, `15min`, `1h`, `1d`. Default depends on period.
    *   Response: `200 OK`
        ```json
        {
          "symbol": "AAPL",
          "company_name": "Apple Inc.",
          "period": "1m",
          "interval": "1d",
          "history": [
            { "timestamp_utc": "2025-04-20T00:00:00Z", "open": 165.00, "high": 166.50, "low": 164.00, "close": 165.75, "volume": 12000000 },
            { "timestamp_utc": "2025-04-21T00:00:00Z", "open": 165.80, "high": 167.20, "low": 165.50, "close": 166.90, "volume": 15000000 }
          ],
          "previous_close": 164.50,
          "currency": "USD"
        }
        ```

**5. `POST /api/v1/aktiedyst/orders`**
    *   Description: Places a new stock order (buy/sell). Requires Firebase Authentication.
    *   Request Body:
        ```json
        {
          "symbol": "AAPL",
          "type": "buy", // "buy" or "sell"
          "order_type": "market", // "market", "limit", "stop"
          "quantity": 10,
          "limit_price": null, // Required if order_type is "limit"
          "stop_price": null   // Required if order_type is "stop"
        }
        ```
    *   Response: `201 Created` (for successful market orders or pending limit/stop orders)
        ```json
        {
          "order_id": "order_789",
          "user_uid": "firebase_auth_user_uid",
          "symbol": "AAPL",
          "type": "buy",
          "order_type": "market",
          "quantity": 10,
          "status": "pending_execution", // or "filled", "partially_filled", "cancelled", "rejected"
          "message": "Market order for 10 AAPL shares submitted.",
          "created_at_utc": "2025-05-20T11:00:00Z"
        }
        ```
    *   Response: `400 Bad Request` (for validation errors, insufficient funds, etc.)
        ```json
        {
          "error_code": "INSUFFICIENT_FUNDS",
          "message": "Insufficient funds to place this order."
        }
        ```

**Proposed New Endpoints for Comprehensive Aktiedyst API Coverage:**

**6. `GET /api/v1/aktiedyst/markets/{symbol}`**
    *   Description: Retrieves detailed information for a specific stock symbol, including company info, news, and key stats.
    *   Path Parameters: `symbol` (string)
    *   Response: `200 OK`
        ```json
        {
          "symbol": "AAPL",
          "company_name": "Apple Inc.",
          "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
          "sector": "Technology",
          "industry": "Consumer Electronics",
          "exchange": "NASDAQ",
          "website": "https://www.apple.com",
          "logo_url": "/static/logos/aapl.png",
          "current_price_info": {
            "price": 175.50,
            "change_value": 1.25,
            "change_percentage": 0.72,
            "day_high": 176.00,
            "day_low": 174.50,
            "volume": 25000000,
            "previous_close": 174.25,
            "timestamp_utc": "2025-05-20T11:15:00Z"
          },
          "key_stats": {
            "market_cap": 2.8E12,
            "pe_ratio": 28.5,
            "eps": 6.15,
            "dividend_yield": 0.55,
            "52_week_high": 190.00,
            "52_week_low": 140.00
          },
          "news": [
            { "id": "news_1", "title": "Apple Announces New Product Line", "source": "Tech News Daily", "url": "https://example.com/news1", "published_at_utc": "2025-05-19T08:00:00Z" }
          ],
          "analyst_ratings": {
            "buy": 25,
            "hold": 10,
            "sell": 2,
            "recommendation": "Strong Buy"
          }
        }
        ```

**7. `GET /api/v1/aktiedyst/orders`**
    *   Description: Retrieves a list of the current user's orders (open, filled, cancelled). Requires Firebase Authentication.
    *   Query Parameters:
        *   `status` (string, optional): `open`, `filled`, `cancelled`, `pending_execution`, `rejected`.
        *   `symbol` (string, optional): Filter by stock symbol.
        *   `page` (integer, optional, default: 1).
        *   `per_page` (integer, optional, default: 20).
    *   Response: `200 OK`
        ```json
        {
          "user_uid": "firebase_auth_user_uid",
          "orders": [
            {
              "id": "order_789",
              "symbol": "AAPL",
              "type": "buy",
              "order_type": "limit",
              "quantity_ordered": 10,
              "quantity_filled": 0,
              "limit_price": 170.00,
              "status": "open",
              "created_at_utc": "2025-05-20T11:00:00Z",
              "updated_at_utc": "2025-05-20T11:00:00Z"
            }
          ],
          "pagination": { "current_page": 1, "per_page": 20, "total_items": 1, "total_pages": 1 }
        }
        ```

**8. `GET /api/v1/aktiedyst/orders/{orderId}`**
    *   Description: Retrieves details for a specific order. Requires Firebase Authentication.
    *   Path Parameters: `orderId` (string)
    *   Response: `200 OK`
        ```json
        {
          "id": "order_789",
          "user_uid": "firebase_auth_user_uid",
          "symbol": "AAPL",
          "company_name": "Apple Inc.",
          "type": "buy",
          "order_type": "limit",
          "quantity_ordered": 10,
          "quantity_filled": 5,
          "average_fill_price": 169.50, // If partially or fully filled
          "limit_price": 170.00,
          "status": "partially_filled",
          "created_at_utc": "2025-05-20T11:00:00Z",
          "updated_at_utc": "2025-05-20T12:30:00Z",
          "fills": [ // Details of each fill for the order
            { "fill_id": "fill_abc", "quantity": 5, "price": 169.50, "timestamp_utc": "2025-05-20T12:30:00Z" }
          ]
        }
        ```

**9. `DELETE /api/v1/aktiedyst/orders/{orderId}`**
    *   Description: Cancels an open order. Requires Firebase Authentication.
    *   Path Parameters: `orderId` (string)
    *   Response: `200 OK`
        ```json
        {
          "order_id": "order_789",
          "status": "cancelled",
          "message": "Order successfully cancelled."
        }
        ```
    *   Response: `404 Not Found` (if order doesn't exist or isn't cancellable)
    *   Response: `403 Forbidden` (if user doesn't own the order)

**10. `GET /api/v1/aktiedyst/leaderboard`**
    *   Description: Retrieves the Aktiedyst leaderboard.
    *   Query Parameters:
        *   `period` (string, optional): `daily`, `weekly`, `monthly`, `all_time`. Default: `weekly`.
        *   `page` (integer, optional, default: 1).
        *   `per_page` (integer, optional, default: 20).
    *   Response: `200 OK`
        ```json
        {
          "period": "weekly",
          "leaderboard": [
            {
              "rank": 1,
              "user": { "username": "StockWizard", "avatar_url": "/static/avatars/stockwizard.png" },
              "portfolio_value": 18500.00,
              "pnl_percentage_period": 22.50
            },
            {
              "rank": 2,
              "user": { "username": "MarketMaster", "avatar_url": "/static/avatars/marketmaster.png" },
              "portfolio_value": 17200.00,
              "pnl_percentage_period": 18.75
            }
          ],
          "pagination": { "current_page": 1, "per_page": 20, "total_items": 50, "total_pages": 3 },
          "last_updated_utc": "2025-05-20T00:00:00Z"
        }
        ```
```
[X] API Design - Forum & Andre Features (Fuldført for Forum & Brugerprofil):
  [X] Forum: GET /api/v1/forum/categories, GET /api/v1/forum/categories/{catId}/threads, GET /api/v1/forum/threads/{threadId}/posts, POST /api/v1/forum/threads/{threadId}/posts (kræver Firebase Auth for POST). (All Forum API endpoints implemented)
  [X] Brugerprofil: GET /api/v1/users/me/profile (baseret på Firebase Auth), PUT /api/v1/users/me/profile. (Implemented in [`fattecentralen-monorepo/apps/backend/routes/api_user_profile.py`](fattecentralen-monorepo/apps/backend/routes/api_user_profile.py:1) and registered in [`fattecentralen-monorepo/apps/backend/__init__.py`](fattecentralen-monorepo/apps/backend/__init__.py:1))
Definer JSON request/response strukturer for hver. Overvej om dele af forum/profil data kan flyttes til Firebase Firestore for nemmere realtid og skalerbarhed.
```markdown
### Forum API JSON Structures:

1.  **`GET /api/v1/forum/categories`**
    *   Description: Retrieves a list of all forum categories.
    *   Response: `200 OK`
        ```json
        [
          {
            "id": 1,
            "name": "General Discussion",
            "slug": "general-discussion",
            "description": "Talk about anything and everything.",
            "icon": "bi-chat-dots",
            "thread_count": 15,
            "post_count": 120,
            "last_activity": {
              "thread_id": 101,
              "thread_title": "Welcome to the new forum!",
              "last_post_at": "2025-05-20T10:00:00Z",
              "last_post_by_username": "admin_user"
            }
          }
        ]
        ```

2.  **`GET /api/v1/forum/categories/{categoryId}/threads`**
    *   Description: Retrieves a list of threads within a specific category. Supports pagination.
    *   Path Parameters:
        *   `categoryId` (integer): The ID of the forum category.
    *   Query Parameters:
        *   `page` (integer, optional, default: 1): Page number for pagination.
        *   `per_page` (integer, optional, default: 20): Number of threads per page.
    *   Response: `200 OK`
        ```json
        {
          "category": {
            "id": 1,
            "name": "General Discussion",
            "slug": "general-discussion"
          },
          "threads": [
            {
              "id": 101,
              "title": "Welcome to the new forum!",
              "author_username": "admin_user",
              "created_at": "2025-05-19T12:00:00Z",
              "updated_at": "2025-05-20T10:00:00Z",
              "post_count": 5,
              "view_count": 250,
              "is_sticky": true,
              "is_locked": false,
              "last_post": {
                "id": 505,
                "author_username": "new_user",
                "created_at": "2025-05-20T10:00:00Z"
              }
            }
          ],
          "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total_items": 15,
            "total_pages": 1
          }
        }
        ```

3.  **`GET /api/v1/forum/threads/{threadId}/posts`**
    *   Description: Retrieves posts within a specific thread. Supports pagination.
    *   Path Parameters:
        *   `threadId` (integer): The ID of the forum thread.
    *   Query Parameters:
        *   `page` (integer, optional, default: 1): Page number for pagination.
        *   `per_page` (integer, optional, default: 15): Number of posts per page.
    *   Response: `200 OK`
        ```json
        {
          "thread": {
            "id": 101,
            "title": "Welcome to the new forum!",
            "category_id": 1,
            "category_name": "General Discussion"
          },
          "posts": [
            {
              "id": 501,
              "author_username": "admin_user",
              "body_html": "<p>Hello everyone! This is the <strong>first</strong> post.</p>",
              "created_at": "2025-05-19T12:00:00Z",
              "updated_at": "2025-05-19T12:05:00Z",
              "last_edited_by_username": "admin_user",
              "user_avatar_url": "/static/avatars/admin_user_avatar.png"
            }
          ],
          "pagination": {
            "current_page": 1,
            "per_page": 15,
            "total_items": 5,
            "total_pages": 1
          }
        }
        ```

4.  **`POST /api/v1/forum/threads/{threadId}/posts`**
    *   Description: Creates a new post in a specific thread. Requires Firebase Authentication.
    *   Path Parameters:
        *   `threadId` (integer): The ID of the forum thread.
    *   Request Body (Authenticated):
        ```json
        {
          "body": "This is my reply to the thread. Supports **Markdown**!"
        }
        ```
    *   Response: `201 Created`
        ```json
        {
          "id": 506,
          "author_username": "current_authenticated_user",
          "body_html": "<p>This is my reply to the thread. Supports <strong>Markdown</strong>!</p>",
          "created_at": "2025-05-20T14:30:00Z",
          "thread_id": 101
        }
        ```

### User Profile API JSON Structures:

1.  **`GET /api/v1/users/me/profile`**
    *   Description: Retrieves the profile of the currently authenticated user.
    *   Response (Authenticated): `200 OK`
        ```json
        {
          "uid": "internal_db_user_uid_123",
          "firebase_uid": "firebase_auth_user_uid",
          "username": "current_user",
          "email": "user@example.com",
          "role": "user",
          "balance": 100.50,
          "registration_date": "2025-01-15T09:30:00Z",
          "last_login": "2025-05-20T12:00:00Z",
          "avatar_url": "/static/avatars/current_user_avatar.png",
          "about_me": "Loves coding and sports!",
          "level": 5,
          "xp": 1250,
          "post_count": 42,
          "settings": {
            "theme": "dark",
            "notifications_enabled": true
          },
          "privacy_settings": {
            "profile_public": true,
            "show_activity": false,
            "show_bet_history": true,
            "show_online_status": true
          }
        }
        ```

2.  **`PUT /api/v1/users/me/profile`**
    *   Description: Updates the profile of the currently authenticated user.
    *   Request Body (Authenticated):
        ```json
        {
          "about_me": "Updated about me section. Still loves coding and now also enjoys hiking!",
          "settings": {
            "theme": "light",
            "notifications_enabled": false
          },
          "privacy_settings": {
            "show_activity": true,
            "show_bet_history": false
          }
        }
        ```
    *   Response: `200 OK`
        ```json
        {
          "uid": "internal_db_user_uid_123",
          "firebase_uid": "firebase_auth_user_uid",
          "username": "current_user",
          "email": "user@example.com",
          "role": "user",
          "balance": 100.50,
          "registration_date": "2025-01-15T09:30:00Z",
          "last_login": "2025-05-20T12:00:00Z",
          "avatar_url": "/static/avatars/current_user_avatar.png",
          "about_me": "Updated about me section. Still loves coding and now also enjoys hiking!",
          "level": 5,
          "xp": 1250,
          "post_count": 42,
          "settings": {
            "theme": "light",
            "notifications_enabled": false
          },
          "privacy_settings": {
            "profile_public": true,
            "show_activity": true,
            "show_bet_history": false,
            "show_online_status": true
          },
          "message": "Profile updated successfully."
        }
        ```
```
[X] Implementer/Opdater API Endpoints i Flask: (Initial placeholders for Aktiedyst and refactoring for Sports Match API done. Forum API and User Profile API fully implemented.)
  [X] Skriv/opdater Flask routes i [`apps/backend/routes/`](fattecentralen-monorepo/apps/backend/routes/) for at matche de designede endpoints. (Aktiedyst placeholders created in [`api_aktiedyst.py`](fattecentralen-monorepo/apps/backend/routes/api_aktiedyst.py), Sports match endpoint refactored in [`api_sports.py`](fattecentralen-monorepo/apps/backend/routes/api_sports.py). Forum API: `forum_api_bp` created and registered; `GET /categories`, `GET /categories/{catId}/threads`, `GET /threads/{threadId}/posts`, and `POST /threads/{threadId}/posts` (with Firebase Auth) implemented in [`forum.py`](fattecentralen-monorepo/apps/backend/routes/forum.py). User Profile API: `user_profile_api_bp` created and registered with `GET` and `PUT` for `/users/me/profile` in [`fattecentralen-monorepo/apps/backend/routes/api_user_profile.py`](fattecentralen-monorepo/apps/backend/routes/api_user_profile.py:1).)
  [X] Brug SQLAlchemy til databaseinteraktion. (Done for Forum API and User Profile API)
  [X] Implementer serialisering og korrekt HTTP statuskode/fejlhåndtering. (Done for Forum API and User Profile API)
  [X] Sikre endpoints med den nye Firebase Auth token validering. (Done for Forum POST API and User Profile API)
[X] Real-time (Socket.IO) Forberedelse i Flask (apps/backend/sockets.py):
  [X] Gennemgå eksisterende Flask-SocketIO setup. (Reviewed existing setup in [`apps/backend/sockets.py`](fattecentralen-monorepo/apps/backend/sockets.py))
  [X] Definer klare event-navne (live_score_update, stock_price_update, new_user_notification). (Defined `live_score_update` and `stock_price_update`)
  [X] Standardiser datastrukturer for events. (Defined for `live_score_update` and `stock_price_update`)
  [X] Overvej Socket.IO rooms for målrettede events (f.eks. match_{matchId}, user_{firebaseUserId}). (Adopted `match_{matchId}` for live sports, `aktiedyst_market_{symbol}` for stocks, and noted `user_{firebaseUserId}` for user-specific notifications. Refactored `handle_subscribe_to_live_scores` to use `match_{matchId}` in [`apps/backend/sockets.py`](fattecentralen-monorepo/apps/backend/sockets.py:931))
  [X] Sørg for at Socket.IO forbindelser også kan autentificeres (f.eks. ved at klienten sender Firebase ID token ved connect). (Implemented Firebase ID token verification in `on_connect` handler in [`apps/backend/sockets.py`](fattecentralen-monorepo/apps/backend/sockets.py:83). Addressed Pylance errors.)


Fase 2: Core Frontend Features - UI Transformation & Statiske Komponenter (apps/frontend/)
Mål: At omdanne de vigtigste dele af den eksisterende HTML/CSS/JS til responsive Next.js/React komponenter. Fokus på statisk struktur og udseende med mock data. Inspireret af Bet365/Nordnet.

[ ] Identificer Nøgle-HTML Sider/Sektioner til Transformation:
Gennemgå det eksisterende projekt og prioriter de vigtigste sider (login, sportsoversigt, aktiedyst, forum etc.).
Analyser eksisterende JavaScript-biblioteker (som anime.js) og planlæg, hvordan funktionaliteten kan genskabes med React/Framer Motion eller bibeholdes omhyggeligt.
[ ] Login/Signup Side (app/(auth)/login/page.tsx, app/(auth)/signup/page.tsx):
Opret routes (brug Next.js Route Groups for (auth)).
Design UI med Shadcn Card, Input, Button.
Klargør til Firebase Auth UI-elementer eller custom UI der kalder Firebase SDK (funktionalitet i Fase 3).
[ ] Brugerprofil Side (app/profile/page.tsx):
Opret route/side.
Vis brugerinfo (Shadcn Avatar, Card) med mock data.
Design sektioner for indstillinger, historik (statisk).
[ ] Live Sports - Oversigt Side (app/live-sports/page.tsx):
Opret route/side. UI inspireret af Bet365/FlashScore (data-tæt, klar).
Brug Shadcn Tabs (sport/liga valgt), Table (kamp-liste).
Opret LiveMatchRow komponent (viser mock data: hold, score, tid, status med Badge).
Implementer filter/sorterings-UI (uden funktionalitet endnu).
[ ] Aktiedyst - Dashboard Side (app/aktiedyst/page.tsx):
Opret route/side. UI inspireret af Nordnet/TradingView.
Vis nøgletal (Shadcn Card, mock data).
Vis portefølje (Shadcn Table, mock data).
Opret statisk StockChart komponent (Recharts/Nivo med mock data).
Design "handels-widget" (Shadcn Dialog med Input, Button, mock).
[ ] Forum - Oversigt Side (app/forum/page.tsx):
Opret route/side.
Vis forum-kategorier (Shadcn Card eller List).
Vis liste af tråde for en valgt kategori (Shadcn Table, mock data).
[ ] Identificer & Genopbyg Genbrugelige UI-Elementer:
Fra det gamle HTML/CSS: Identificer mønstre, knapper, kort, layouts der kan blive til genbrugelige React-komponenter.
Byg disse som custom Shadcn-komponenter eller rene React/Tailwind komponenter i components/ui/ eller components/common/.
[ ] (Stærkt Anbefalet) Opsæt Storybook (apps/frontend/):
Kør: npx storybook@latest init.
Tilføj dine genbrugelige UI-komponenter (Shadcn og custom) til Storybook for isoleret udvikling, test og dokumentation.


Fase 3: Frontend Data Integration & Firebase Autentificering (apps/frontend/)
Mål: At forbinde den statiske UI til Firebase Authentication og backend API'erne. Hente og vise rigtige data. Implementere formular-logik.

[ ] Opsæt TanStack Query (React Query) Provider:
Opret QueryClient og wrap applikationen (f.eks. i app/providers.tsx).
[ ] Implementer Firebase Autentificering Flow:
Brug Firebase SDK (firebase/auth) til signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged.
Integrer med Login/Signup siderne. Brug react-hook-form + zod for formularvalidering.
Brug onAuthStateChanged til at lytte til auth state og opdatere en global Zustand/Jotai store (store/authStore.ts) med brugerens status og Firebase user object (inkl. ID token).
Automatisk refresh af ID token håndteres typisk af Firebase SDK.
Opsæt en API-klient (f.eks. en wrapper om fetch i lib/apiClient.ts) der automatisk tilføjer Firebase ID token (Authorization: Bearer <token>) til anmodninger mod Flask-backend.
Sidebeskyttelse: Implementer "Protected Routes" (Higher-Order Components, layout checks, eller Next.js Middleware) baseret på auth-status i store'en.
Kald Flask GET /api/v1/users/me/profile efter login for at synkronisere/hente yderligere brugerdata fra din lokale backend.
[ ] Hent Data til Live Sports (med TanStack Query):
useQuery til at hente sport/liga-liste fra Flask /api/v1/sports.
useQuery (med dynamiske query keys) til kamp-liste fra Flask /api/v1/sports/....
Vis loading states (Shadcn Skeleton) og error states.
[ ] Hent Data til Aktiedyst (med TanStack Query):
useQuery for portefølje, transaktioner, markeder, historik fra Flask API'er.
Opdater StockChart med rigtige data.
Implementer handelsformular (Shadcn Dialog) med react-hook-form + zod.
useMutation til at sende ordre til Flask POST /api/v1/aktiedyst/orders. Invalider relevante queries ved succes.
[ ] Hent Data til Forum & Andre Sider (med TanStack Query):
Implementer useQuery for forum data, brugerprofiler etc. fra Flask API'er (eller direkte fra Firebase Firestore hvis dele er flyttet dertil).
[ ] API Error Handling & Notifikationer:
Brug Shadcn Toast (via Sonner) til at vise API-fejl og succes-notifikationer (f.eks. "Ordre placeret!").


Fase 4: Real-time Implementering (apps/frontend/ & apps/backend/)
Mål: At integrere live-opdateringer fra backend (Flask-SocketIO og evt. Firebase) ind i frontend.

[ ] Etabler WebSocket Forbindelse til Flask-SocketIO:
Brug socket.io-client i en custom hook (hooks/useSocket.ts).
Initialiser socket med URL til Flask-backend. Send Firebase ID token under handshake for autentificering af socket-sessionen.
Håndter connect, disconnect, error events. Gør socket-instansen tilgængelig globalt (via Context eller hook).
[ ] Live Sports Opdateringer:
Lyt til events som live_score_update fra Flask-SocketIO.
Opdater UI (direkte state eller React Query cache via queryClient.setQueryData).
Overvej visuelle effekter for opdateringer (Framer Motion).
Håndter socket.join() og socket.leave() for specifikke kamp-rum.
[ ] Aktiedyst Opdateringer (Real-time priser hvis relevant):
Lyt til stock_price_update fra Flask-SocketIO. Opdater UI.
[ ] Real-time Notifikationer:
Backend (Flask/Socket.IO eller Firebase Functions + Firestore/RTDB) sender events (f.eks. new_forum_reply, user_notification).
Frontend lytter og viser notifikationer (Shadcn Toast).
[ ] Performance Optimering for Real-time:
React.memo, omhyggelig datahåndtering for at undgå unødvendige re-renders. Send kun ændrede data over sockets.


Fase 5: Avancerede Features & UI/UX Polishing (apps/frontend/)
Mål: At implementere mere komplekse funktioner og forfine den samlede brugeroplevelse.

[ ] Udvikling af Admin API: Definition af scope og implementering af nødvendige endpoints (Status: Ikke påbegyndt).
[ ] Avancerede Aktiedyst Features:
Udvidet StockChart (forskellige graf-typer, tekniske indikatorer, zoom/pan).
Avancerede ordretyper (limit, stop-loss).
Watchlist funktionalitet.
[ ] Avancerede Live Sports Features:
Detaljeret kampvisningsside (app/live-sports/[matchId]/page.tsx).
Vis udvidet statistik, H2H, lineups (kræver API support).
Favoritmarkering af kampe/ligaer.
[ ] Forum Implementering (Fuld CRUD):
Oprette nye tråde, skrive svar/posts (med useMutation mod Flask API eller direkte til Firebase).
Redigering, sletning (hvis relevant).
[ ] Animationer & Overgange (Framer Motion & Anime.js):
Subtile sideovergange, modal-animationer, hover-effekter, animerede loaders.
Brug Anime.js hvis der er behov for meget specifikke, komplekse sekventielle animationer som ikke nemt opnås med Framer Motion.
[ ] Responsivt Design Finpudsning:
Grundig test på forskellige skærmstørrelser (mobil, tablet, desktop). Juster Tailwind breakpoints.
[ ] Tilgængelighed (a11y):
Semantisk HTML, tastaturnavigation, ARIA-attributter (Shadcn/Radix hjælper). Test med a11y-værktøjer.
[ ] Dark Mode (Valgfrit):
Implementer med next-themes og Tailwind's dark: variant.


Fase 6: Yderligere Firebase Integration (Udvidelsesmuligheder)
Mål: At udnytte Firebase yderligere hvor det giver mening for at forbedre funktionalitet, skalerbarhed eller udviklingshastighed.

[ ] Firestore/Realtime Database:
Overvej at flytte/implementere features som chat, realtids forum-kommentarer, komplekse brugerindstillinger, eller activity feeds.
Opsæt sikkerhedsregler for Firebase databaser.
[ ] Firebase Storage:
Til brugeruploadede filer (profilbilleder, vedhæftninger i forum).
Integrer med frontend og opsæt sikkerhedsregler.
[ ] Firebase Functions (Cloud Functions):
Til serverless backend-logik tæt knyttet til Firebase-events (f.eks. billedbehandling efter upload til Storage, sende notifikationer når data ændres i Firestore, eller til at håndtere specifikke webhook-kald).
Kan skrives i Node.js, Python, Go m.fl.
[ ] Firebase Hosting:
Kan overvejes for Next.js frontend, især hvis der er tæt integration med andre Firebase services. Alternativt er Vercel stadig et stærkt valg for Next.js.


Fase 7: Testning & Deployment
Mål: At sikre applikationens kvalitet og stabilitet, og opsætte en automatiseret deployment pipeline.

[ ] Unit & Integration Tests (apps/frontend/ & apps/backend/):
Frontend: Jest & RTL for komponenter, hooks, state. Mock Firebase og API kald.
Backend: PyTest for Flask routes, logik, databaseinteraktioner.
[ ] End-to-End (E2E) Tests (apps/frontend/):
Opsæt Playwright eller Cypress. Test kritiske bruger-flows.
[ ] Manuel Test & QA:
Gennemgående test i forskellige browsere og på forskellige enheder.
[ ] Performance Optimering:
Frontend: next-build-analyzer, next/image, next/dynamic, React DevTools Profiler, listevirtualisering.
Backend: Database query optimering, caching strategier.
[ ] Opsæt CI/CD Pipeline (f.eks. GitHub Actions):
For monorepo: Konfigurer workflows til at bygge/teste/deploye frontend og backend separat eller samlet.
Deploy frontend til Vercel eller Firebase Hosting.
Deploy backend (Docker-container) til Google Cloud Run, AWS App Runner, eller lignende.
[ ] Konfigurer Miljøvariabler:
Brug .env.local (i .gitignore) til lokal udvikling.
Konfigurer produktionsvariabler i hosting platformenes UI (Vercel, Firebase, Cloud provider). Adskil NEXT_PUBLIC_ (browser) og server-side variabler.


Fase 8: Launch & Vedligeholdelse
Mål: At lancere den moderniserede applikation og etablere processer for løbende drift og forbedring.

[ ] Endelig Deployment til Produktion.
[ ] Monitorering:
Fejl-tracking: Sentry (frontend & backend).
Performance/Analytics: Vercel Analytics, Google Analytics, Firebase Performance Monitoring.
[ ] Indsaml Feedback fra Brugere.
[ ] Iterér & Forbedr:
Vedligehold backlog, planlæg sprints/iterationer for nye features og bug fixes.
Regelmæssig opdatering af afhængigheder.
Tips til Brug af Planen & Kreativ Udfoldelse:

Iterativ Tilgang: Hver fase kan opdeles i mindre, håndterbare opgaver.
Fleksibilitet: Vær åben for at justere planen undervejs baseret på nye indsigter.
Eksperimenter: Med UI/UX (Shadcn/Tailwind), animationer (Framer Motion/Anime.js) for at matche Bet365/Nordnet-inspirationen.
HTML Transformation: Bryd de gamle HTML-sider ned komponent for komponent. Start med de ydre layouts og arbejd dig indad. Overfør CSS-stilarter til Tailwind-klasser. Omskriv JavaScript-logik til React-hooks og event handlers.
Valg af Værktøjer: Jeg har foreslået værktøjer, der er populære og passer godt sammen. Hvis du har præferencer for alternativer (f.eks. en anden state manager, et andet diagrambibliotek), kan de typisk substitueres.
AI som Sparringspartner: Brug mig (eller andre AI-værktøjer) til at få kodeeksempler, diskutere arkitekturvalg for specifikke features, eller brainstorme løsninger på udfordringer.
Denne plan er omfattende, men den skulle give en solid ramme for moderniseringen af Fattecentralen. Held og lykke med projektet!



Baseret på den plan, vi har lagt, er her de primære eksterne JavaScript-biblioteker (udover React og Next.js selv, som er frameworks), vi kommer til at bruge på frontend-siden:

@tanstack/react-query (også kendt som React Query):
Formål: Håndtering af server-state, datahentning, caching, baggrundsopdateringer og synkronisering med din Flask API. Gør det meget nemmere at arbejde med data, loading- og error-tilstande.
zustand (eller jotai):
Formål: Letvægts global client-side state management. Bruges til at holde styr på ting som brugerens autentificeringsstatus, UI-tilstande (f.eks. om en sidebar er åben), notifikationer osv., som deles på tværs af mange komponenter.
react-hook-form:
Formål: Håndtering af formularer på en effektiv og performant måde. Giver god kontrol over formular-state, validering og submission.
zod:
Formål: Skema-baseret validering. Bruges typisk sammen med react-hook-form til at definere, hvordan dine formulardata skal se ud og validere dem, før de sendes. Fungerer rigtig godt med TypeScript.
framer-motion:
Formål: Et kraftfuldt bibliotek til at skabe flydende og komplekse animationer og overgange i React. Bruges til at forbedre UI/UX med visuelle effekter.
socket.io-client:
Formål: Klient-side bibliotek til at etablere og håndtere realtidskommunikation (WebSockets) med din Flask-SocketIO backend.
recharts (eller nivo):
Formål: Biblioteker til at tegne diagrammer og grafer, f.eks. til din StockChart komponent i Aktiedyst-sektionen.
firebase (SDK):
Formål: Klient-side SDK til at interagere med Firebase-services, primært Firebase Authentication, men potentielt også Firestore, Storage, osv., hvis du vælger at udvide brugen af Firebase.
anime.js:
Formål: Du nævnte det specifikt. Det er et fleksibelt animationsbibliotek. Selvom framer-motion vil være det primære animationsværktøj, kan anime.js stadig bruges til meget specifikke, avancerede eller performance-kritiske animationer, hvis framer-motion ikke er det bedste fit til en bestemt opgave. Det vil være et "efter behov" valg.
shadcn/ui komponenter (indirekte Radix UI):
Formål: Selvom shadcn/ui ikke er et bibliotek du installerer direkte som en afhængighed i node_modules på traditionel vis (du kopierer koden ind), så bygger mange af dens komponenter (som Dialog, DropdownMenu, Tabs osv.) oven på Radix UI primitives. Radix UI er et JavaScript-bibliotek, der leverer uformaterede, tilgængelige UI-primitiver. Så indirekte bruger du funktionaliteten fra Radix.
next-themes (Valgfrit, nævnt for Dark Mode):
Formål: Hvis du implementerer Dark Mode, gør dette bibliotek det nemt at håndtere tema-skift og persistens i Next.js-applikationer.
Udviklingsværktøjer (Dev Dependencies):
Selvom de ikke er en del af din produktions-bundle på samme måde, er disse også vigtige JavaScript-baserede værktøjer:

@testing-library/react og jest (til test)
eslint og prettier (til kodestil og -kvalitet)
Denne liste dækker de mest centrale JavaScript-biblioteker, som planen lægger op til for at bygge en moderne, interaktiv og datadrevet frontend, der lever op til din vision.


--> Eventuelt flere til 3d visualsering, anime.js alt muligt kreativt senere hen!
