Gider du skrive følgemde markdown format?  så jeg kan bruge https://dillinger.io..

Sørg for vi har alt med fra alle versioner ( version 1, 2, 3 og 4)! Hvis der er noget som er bedre og mere detaljeret, beskrivende osv osv osv i den ene version fremfor den anden så behold det og vice versa. vi skal bare have alt med!!! DU SKAL SKRIVE DET HELE TIL MIG SÅ JEG KAN COPY PASTE IND I MIT DOKUMENT! Vær gerne kreativ og kom med nye ideer hvis du finder nogle !! Men alt fra begge version skal være med.. vi skal bare have den bedste, kreative, oragniseret, struktureret, kloge, smarte, detaljeret, bemærkningsfyldte osv osv osv projekt plan!

( Se billederne .. kan se i fase 2 bliver der nævnt vi skal gå til den her SPA dynamiske fordi det er next og react osv.. men har mange forskellige templates.. og føler ikke alt er nævnt i min plan alle steder.. ) så det kan du os passende tilføje.. Skuf mig ikke nu! Lav den perfekte version til jeg kan copy paste!

Jeg forventer du skriver det her virkelig genialt og at det bliver en længere men mere detaljeret og gennemarbejdet projekt plan fordi du igennem det hele er kreativ og eventuelt kommer med flere ideer!!


------------------------>

version 1)

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




----->
Version 2;

Okay, her er din projektplan formateret i Markdown, klar til brug med f.eks. Dillinger.io:

```markdown
Okay, lad os fortsætte med at forfine resten af din projektplan. Jeg vil fortsætte med samme detaljeringsgrad og struktur som for de indledende sektioner og Fase 0. Jeg vil integrere status fra din oprindelige plan (`[X]`, `[/]`) og opdatere dem baseret på logikken og den information, du har givet.

# Fase 1: Backend API Klargøring & Grundlæggende Autentificering (Python/Flask `apps/backend/`)
**Mål:** At sikre at backend'en eksponerer de nødvendige, robuste og sikre API'er for kernefunktionaliteterne, integrerer fuldt ud med Firebase Authentication for brugerstyring, og at real-time setup via Flask-SocketIO er optimeret og klar til brug.
**Status:** Overvejende fuldført for User Profile og Forum API. Sports & Aktiedyst API'er er påbegyndt med scaffolding og definitioner. Socket.IO forberedelse er også fuldført.

## Generelle Bemærkninger og Status for Fase 1 (Baseret på projektplan og CHANGELOG):
- `[X]` **Fuldført Indledende API'er:**
    - **User Profile API:** GET og PUT for `/api/v1/users/me/profile` er fuldt implementeret (`api_user_profile.py`) og registreret. Beskyttet med Firebase Auth.
    - **Forum API:** Fuld CRUD for tråde og posts er implementeret (`forum.py`) og registreret. Endpoints er beskyttet hvor relevant (f.eks. POST/PUT/DELETE) med Firebase Auth. Pylance-fejl rettet.
    - *Reference: CHANGELOG Maj 19 (Core User Profile API, Forum API CRUD, Forum API Dev Initial Stages).*
- `[/]` **Lokal Flask JWTs vs. Firebase ID Tokens:**
    - **Strategi:** Gradvis udfasning af lokal Flask JWT-generering. Målet er at frontend udelukkende bruger Firebase ID tokens.
    - **Nuværende Status (fra CHANGELOG Maj 19 - Pylance and Backend Firebase Auth):**
        - `/api/v1/auth/me` bruger nu `@firebase_token_required`.
        - `/api/v1/auth/register` er repurposet til `register_or_sync_firebase_user` og bruger `@firebase_token_required`. Genererer ikke længere lokale JWTs.
        - `POST /api/v1/auth/link-firebase` er tilføjet for at linke eksisterende lokale konti til Firebase.
        - Traditionelle login-flows (`/auth/login`) giver beskeder om at linke/bruge Firebase.
    - **Konklusion:** Signifikant fremskridt er gjort, men fuld udfasning kræver måske yderligere review/tilpasning af alle ældre, lokale JWT-afhængige dele.
- `[X]` **Løbende Opgaver:**
    - Fejlhåndtering, sikkerhedsforbedringer, databasemigreringer (som set med `firebase_uid` tilføjelse), og testning er kontinuerlige processer, der allerede er adresseret i det udførte arbejde.

## F1.1: `[X]` Backend Miljø & Firebase Admin SDK Opsætning
- **Python Virtuelt Miljø:**
    - Genereret `requirements.txt` fra oprindeligt miljø.
    - Flyttet `requirements.txt` til `apps/backend/`.
    - Oprettet nyt virtuelt miljø (`.venv`) i `apps/backend/` (anbefalet med `--copies` for bedre Pylance/Pyright integration).
    - Installeret afhængigheder fra `requirements.txt`.
    - *Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Authentication - venv recreation with --copies), CHANGELOG Maj 18 (Build/Environment Fixes - venv).*
- **Firebase Admin SDK:**
    - Downloadet service account key (`fattecentralenas-service-account.json`) og gemt sikkert (f.eks. `~/.firebase_keys/`).
    - Konfigureret `GOOGLE_APPLICATION_CREDENTIALS` miljøvariabel i `apps/backend/.env` til at pege på service account key filen.
    - Verificeret at Firebase Admin SDK initialiseres korrekt i `apps/backend/init.py`.
    - *Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Auth), CHANGELOG Maj 18 (Firebase Admin SDK Integration).*
- **VS Code & Pylance/Pyright Konfiguration:**
    - Korrekt konfigureret `python.defaultInterpreterPath` i `.vscode/settings.json`.
    - Korrekt konfigureret `pyproject.toml` for Pyright (`tool.pyright.venvPath`, `tool.pyright.venv`).
    - *Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Auth - løsning af `firebase_admin` import issue).*

## F1.2: `[X]` Flask-JWT-Extended & Firebase Auth Integration
- **Mål:** Centralisere API-autentificering omkring Firebase ID tokens.
- Implementeret `@firebase_token_required` decorator (`apps/backend/utils.py`) til at verificere Firebase ID tokens.
    - **Detaljer:** Tjekker `Authorization: Bearer <token>` header, verificerer token mod Firebase, gør decoded token (eller `firebase_uid`) tilgængelig via `flask_g`.
- **Refaktorerede Nøgle API Endpoints:**
    - `/api/v1/auth/me`: Beskyttet med `@firebase_token_required`. Henter bruger fra lokal DB via `firebase_uid`.
    - `/api/v1/auth/register` (nu `register_or_sync_firebase_user`):
        - Beskyttet med `@firebase_token_required`.
        - Synkroniserer/opretter lokal bruger baseret på Firebase auth.
        - Kræver `invite_code` for ny lokal profiloprettelse.
        - Genererer ikke længere lokale JWTs for dette flow.
- **Lokal DB User model (`apps/backend/models.py`):**
    - Opdateret til at håndtere `firebase_uid` for identifikation. `password_hash` er nullable.
    - *Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Auth), CHANGELOG Maj 18 (User Model Enhancements).*
- **Lokal Konti Linking:**
    - `POST /api/v1/auth/link-firebase` endpoint implementeret for at tillade brugere logget ind med traditionel metode at linke deres konto til Firebase.
- `[/]` **Strategi for eksisterende lokale JWTs:**
    - **Nuværende status:** Fokus er på Firebase ID token validering for API-kald. Ældre, session-baserede login flows (HTML-sider) og JWTs genereret derfra er endnu ikke fuldt fjernet, men brugere guides mod Firebase login.
    - **F1.2.1: Plan for fuld udfasning af lokal JWT-generering (hvis endnu ikke 100% dækket):**
        - Identificer alle resterende endpoints/flows, der stadig genererer eller stoler på lokale JWTs.
        - Definer hvordan disse skal migreres til Firebase ID tokens eller fjernes.
        - Opdater frontend til udelukkende at bruge Firebase ID token til API-kald (dette er en Fase 3 opgave for frontend).

## F1.3: `[X]` Database Review & Migrationer (`apps/backend/models.py`, `migrations/`)
- **Bruger Model (User):**
    - Tilføjet `firebase_uid` (String, unique, nullable, indexed).
    - Sat `password_hash` til `nullable=True`.
    - Tilføjet `init(self, **kwargs)` for nemmere instansiering (løste Pylance-fejl).
    - *Reference: CHANGELOG Maj 18 & 19.*
- **Forum Modeller (ForumCategory, ForumThread, ForumPost):**
    - Gennemgået og anvendt for Forum API CRUD. Nødvendige relationer og felter er på plads.
    - ForumPost model fik `init` for Pylance-fejl-løsning.
    - *Reference: CHANGELOG Maj 19 (Forum API CRUD, Pylance Fixes).*
- **Alembic/Flask-Migrate:**
    - Migrationer er genereret og anvendt for User model ændringer.
    - Sikret at `PYTHONPATH` og `venv` er korrekt sat op for `flask db` kommandoer.
    - *Reference: CHANGELOG Maj 18.*
- **F1.3.1: Database Review for Sports & Aktiedyst Modeller:**
    - Gennemgå eksisterende databasemodeller for Sports og Aktiedyst.
    - Identificer eventuelle manglende felter/relationer for at understøtte de "Proposed New Endpoints" (se F1.4 & F1.5).
    - Udfør nødvendige modelændringer og generer/anvend migrationer.

## F1.4: `[/]` API Design & Implementering - Live Sports
- **Mål:** Sikre omfattende API-dækning.
- **Status (fra projektplan & Changelog):**
    - `GET /api/v1/sports`: Liste af sportsgrene/ligaer (formodentlig eksisterende).
    - `GET /api/v1/sports/{sportId}/matches`: Liste af kampe (formodentlig eksisterende).
    - `GET /api/v1/matches/{matchId}`: Detaljer for én kamp.
        - *Note: Endpoint refactored. Ny blueprint `matches_api_bp` oprettet. (Changelog Maj 19 - Focused API Dev Sprint & Live Sports & Aktiedyst API Scaffolding).*
    - JSON request/response strukturer defineret for ovenstående.
- **Implementering af "Proposed New Endpoints" (Fra projektplan - disse er `[ ]`):**
    - **F1.4.1:** `[ ]` `GET /api/v1/sports/{sportId}/leagues`
        - Implementer route i `api_sports.py` (eller en ny `leagues_api_bp`).
        - Implementer logik til at hente ligaer for en sport fra DB.
        - Serialiser respons iht. defineret JSON-struktur.
        - Tilføj paginering.
    - **F1.4.2:** `[ ]` `GET /api/v1/leagues/{leagueId}`
        - Implementer route.
        - Implementer logik for at hente specifik liga-info.
        - Serialiser.
    - **F1.4.3:** `[ ]` `GET /api/v1/leagues/{leagueId}/standings`
        - Implementer route.
        - Implementer logik for stillinger (potentielt kompleks query).
        - Serialiser. Overvej `seasonId` query parameter.
    - **F1.4.4:** `[ ]` `GET /api/v1/leagues/{leagueId}/teams`
        - Implementer route.
        - Implementer logik for hold i liga.
        - Serialiser. Paginering og `seasonId` parameter.
    - **F1.4.5:** `[ ]` `GET /api/v1/teams/{teamId}`
        - Implementer route.
        - Implementer logik for specifik team-info.
        - Serialiser.
    - **F1.4.6:** `[ ]` `GET /api/v1/teams/{teamId}/matches`
        - Implementer route.
        - Implementer logik for et holds kampe (filter på status, season etc.).
        - Serialiser. Paginering.
    - **F1.4.7: Fælles opgaver for Live Sports API implementering:**
        - Brug SQLAlchemy til alle databaseinteraktioner.
        - Implementer grundig inputvalidering for path/query parametre.
        - Standardiseret fejlhåndtering og HTTP statuskoder.
        - Overvej caching strategier for ofte tilgåede, men sjældent ændrede data (f.eks. liste af sportsgrene).
        - Skriv unit/integration tests for hvert nyt endpoint (PyTest).

## F1.5: `[/]` API Design & Implementering - Aktiedyst
- **Mål:** Sikre omfattende API-dækning.
- **Status (fra projektplan & Changelog):**
    - Placeholders implementeret for:
        - `GET /api/v1/aktiedyst/portfolio` (Firebase Auth)
        - `GET /api/v1/aktiedyst/transactions` (Firebase Auth)
        - `GET /api/v1/aktiedyst/markets`
        - `GET /api/v1/aktiedyst/markets/{symbol}/history`
        - `POST /api/v1/aktiedyst/orders` (Firebase Auth)
        - *Note: Blueprint `aktiedyst_api_bp` oprettet og registreret. Returnerer mock data. (Changelog Maj 19 - Focused API Dev Sprint & Live Sports & Aktiedyst API Scaffolding).*
    - JSON request/response strukturer defineret for ovenstående.
- **Implementering af "Proposed New Endpoints" og fuld logik for eksisterende (Disse er `[ ]` medmindre andet er specificeret):**
    - **F1.5.1:** `[ ]` Fuldfør `GET /api/v1/aktiedyst/portfolio`
        - Implementer logik for at hente brugerens portefølje fra DB.
        - Kræver `@firebase_token_required`. Hent bruger via `firebase_uid`.
        - Beregn værdier (PNL, market value etc.).
        - Serialiser iht. defineret JSON.
    - **F1.5.2:** `[ ]` Fuldfør `GET /api/v1/aktiedyst/transactions`
        - Implementer logik for at hente transaktionshistorik.
        - Kræver `@firebase_token_required`.
        - Håndter query parametre (paginering, type, symbol).
        - Serialiser.
    - **F1.5.3:** `[ ]` Fuldfør `GET /api/v1/aktiedyst/markets`
        - Implementer logik for at hente liste af handlebare aktier.
        - Håndter query parametre (paginering, search, sector).
        - Integrer med datakilde for aktiekurser/info (kan være intern DB eller ekstern API).
        - Serialiser.
    - **F1.5.4:** `[ ]` Fuldfør `GET /api/v1/aktiedyst/markets/{symbol}/history`
        - Implementer logik for at hente historiske kursdata.
        - Håndter query parametre (period, interval).
        - Integrer med datakilde for historiske data.
        - Serialiser.
    - **F1.5.5:** `[ ]` Fuldfør `POST /api/v1/aktiedyst/orders`
        - Implementer logik for at placere en ordre.
        - Kræver `@firebase_token_required`.
        - Valider request body (symbol, type, quantity, `order_type`, limit/stop price).
        - Tjek for tilstrækkelige midler/aktier.
        - Opret ordre i DB.
        - Returner respons iht. defineret JSON (inkl. `order_id`).
    - **F1.5.6:** `[ ]` Implementer `GET /api/v1/aktiedyst/markets/{symbol}` (Nyt foreslået endpoint)
        - Implementer route.
        - Implementer logik for detaljeret info om et symbol.
        - Serialiser.
    - **F1.5.7:** `[ ]` Implementer `GET /api/v1/aktiedyst/orders` (Nyt foreslået endpoint)
        - Implementer route.
        - Kræver `@firebase_token_required`.
        - Implementer logik for at hente brugerens ordrehistorik.
        - Håndter query parametre (status, symbol, paginering).
        - Serialiser.
    - **F1.5.8:** `[ ]` Implementer `GET /api/v1/aktiedyst/orders/{orderId}` (Nyt foreslået endpoint)
        - Implementer route.
        - Kræver `@firebase_token_required`.
        - Implementer logik for at hente detaljer om specifik ordre.
        - Serialiser.
    - **F1.5.9:** `[ ]` Implementer `DELETE /api/v1/aktiedyst/orders/{orderId}` (Nyt foreslået endpoint)
        - Implementer route.
        - Kræver `@firebase_token_required`.
        - Implementer logik for at annullere en åben ordre.
        - Serialiser.
    - **F1.5.10:** `[ ]` Implementer `GET /api/v1/aktiedyst/leaderboard` (Nyt foreslået endpoint)
        - Implementer route.
        - Implementer logik for leaderboard (kan være DB-intensivt).
        - Håndter query parametre (period, paginering).
        - Serialiser. Overvej caching.
    - **F1.5.11: Fælles opgaver for Aktiedyst API implementering:**
        - Definér nødvendige SQLAlchemy-modeller for Aktiedyst (Portfolio, Holdings, Transactions, Orders, etc.) og lav migrationer.
        - Brug SQLAlchemy til alle databaseinteraktioner.
        - Implementer grundig inputvalidering og robust fejlhåndtering.
        - Sikre alle bruger-specifikke endpoints med `@firebase_token_required`.
        - Planlæg integration med eksterne data-kilder for markedsdata, hvis det ikke findes i egen DB.
        - Skriv unit/integration tests (PyTest).

## F1.6: `[X]` API Design & Implementering - Forum & Brugerprofil
- **Status:** Fuldført.
- **Forum API (CRUD for tråde/posts, GET kategorier):**
    - Alle endpoints defineret i planen er implementeret i `forum.py`.
    - POST, PUT, DELETE operationer er beskyttet med Firebase Auth.
    - Pylance fejl er rettet.
    - *Reference: CHANGELOG Maj 19 (Forum API CRUD Operations Completed).*
- **Brugerprofil API (GET & PUT `/api/v1/users/me/profile`):**
    - Implementeret i `api_user_profile.py`.
    - Beskyttet med Firebase Auth.
    - *Reference: CHANGELOG Maj 19 (Core User Profile API Implementation).*
- JSON strukturer for disse API'er er defineret i projektplanen og formodentlig fulgt.
- *Bemærkning til planen: "Overvej om dele af forum/profil data kan flyttes til Firebase Firestore..." - dette er en Fase 6 overvejelse. For nu er det implementeret i Flask/SQLAlchemy.*

## F1.7: `[X]` Real-time (Socket.IO) Forberedelse i Flask (`apps/backend/sockets.py`)
- **Status:** Fuldført forberedelse.
- Gennemgået eksisterende Flask-SocketIO setup.
- **Firebase Auth Integration:**
    - Socket.IO `on_connect` handler modificeret til at verificere Firebase ID token sendt som query parameter. Forbindelser uden gyldigt token afvises.
    - *Reference: CHANGELOG Maj 19 (Socket.IO Enhancements).*
- **Event Navne & Datastrukturer:**
    - Defineret klare event-navne: `live_score_update`, `stock_price_update`. `new_user_notification` er også nævnt i planen og bør bekræftes/defineres.
    - Datastrukturer for `live_score_update` og `stock_price_update` er defineret.
- **Socket.IO Rooms:**
    - Strategi for room-navne: `match_{matchId}` (live sports), `aktiedyst_market_{symbol}` (stocks).
    - `user_{firebaseUserId}` noteret for bruger-specifikke notifikationer.
    - `handle_subscribe_to_live_scores` refaktoreret til at bruge `match_{matchId}`.
    - *Reference: CHANGELOG Maj 19 (Socket.IO Enhancements).*
- **F1.7.1:** Definer `new_user_notification` event og datastruktur (hvis ikke allerede gjort).
- **F1.7.2:** Implementer afsendelse af events fra backend:
    - Dette er mere end "forberedelse". Når backend-logikken for sport/aktiedyst ændrer data, skal de relevante Socket.IO events udsendes. Dette vil ske løbende som funktionerne implementeres (F1.4, F1.5, F5).

---

# Fase 2: Core Frontend Features - UI Transformation & Statiske Komponenter (`apps/frontend/`)
**Mål:** At omdanne de vigtigste dele af den eksisterende HTML/CSS/JS til responsive Next.js/React komponenter med TypeScript og Tailwind CSS. Fokus i denne fase er på statisk struktur og udseende ved brug af mock data. Design skal inspireres af Bet365/FlashScore og Nordnet/TradingView.
**Status:** Ikke påbegyndt.

## F2.1: `[ ]` Identificer Nøgle-HTML Sider/Sektioner til Transformation
- **F2.1.1: Analyser eksisterende HTML/CSS/JS projekt:**
    - Gennemgå alle eksisterende sider og identificer de 5-7 vigtigste/mest komplekse brugerflader, der skal transformeres først.
    - **Prioritetsliste (forslag baseret på planen):**
        1.  Login/Signup
        2.  Live Sports Oversigt (inkl. kampdetaljer-light)
        3.  Aktiedyst Dashboard (inkl. portfolio-oversigt, markedsliste-light)
        4.  Forum Oversigt (kategorier, trådliste)
        5.  Brugerprofil Side
    - Dokumenter URL-struktur og funktionalitet for hver valgt side.
- **F2.1.2: JavaScript Biblioteksanalyse (f.eks. `anime.js`):**
    - For hvert eksisterende JS-bibliotek:
        - Identificer præcis hvor og hvordan det bruges.
        - Vurder om funktionaliteten kan genskabes med Framer Motion (foretrukket for React-integration) eller via standard React/Tailwind/CSS.
        - Hvis `anime.js` (eller andet) stadig er nødvendigt for unik, kompleks animation, planlæg hvordan det integreres i React-komponenter (f.eks. via `useEffect` og `refs`).

## F2.2: `[ ]` Login/Signup Side (`app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`)
- **F2.2.1: Opret Next.js Routes:**
    - Brug Next.js Route Groups (`(auth)`) for at gruppere auth-relaterede sider uden at påvirke URL-stien.
    - Opret `app/(auth)/login/page.tsx`.
    - Opret `app/(auth)/signup/page.tsx`.
    - (Overvej) Opret `app/(auth)/layout.tsx` hvis der er et specifikt layout for auth-sider (f.eks. centreret indhold).
- **F2.2.2: Design UI med Shadcn/ui og Tailwind CSS (Statisk):**
    - **Login side:** Brug `Card`, `Input` (for email/username, password), `Button` (for login), link til signup, link til "glemt password" (funktionalitet senere).
    - **Signup side:** Brug `Card`, `Input` (for username, email, password, confirm password, invite code), `Button` (for signup), link til login.
- **F2.2.3: Klargør til Firebase Autentificering (UI-del):**
    - Design UI med tanke på, at Firebase SDK vil håndtere selve auth-logikken i Fase 3.
    - Overvej plads til fejlmeddelelser.
    - Valgfrit: Overvej FirebaseUI-biblioteket hvis en pre-built UI ønskes, ellers fortsæt med custom UI der kalder Firebase SDK funktioner. (Planen peger mod custom UI).

## F2.3: `[ ]` Brugerprofil Side (`app/profile/page.tsx`)
- **F2.3.1: Opret Route og Grundlæggende Sidestruktur:**
    - Opret `app/profile/page.tsx`.
    - Brug DashboardLayout (fra Fase 0).
- **F2.3.2: Vis Brugerinformation (Statisk/Mock Data):**
    - Brug Shadcn `Avatar` for profilbillede.
    - Brug Shadcn `Card` eller `DescriptionList` (custom komponent) til at vise mock-data: brugernavn, email, rolle, saldo, registreringsdato, level, XP, post count.
- **F2.3.3: Design Sektioner (Statisk/Mock Data):**
    - **Indstillinger:**
        - Faner (Shadcn `Tabs`) for "Generelt" (f.eks. tema), "Notifikationer", "Privatliv".
        - Vis mock input-felter/switches for indstillingerne (f.eks. `about_me` textarea, `theme` select, `notifications_enabled` switch).
    - **Historik (tomme tabeller/lister for nu):**
        - Faner for "Aktiedyst Transaktioner", "Forum Aktivitet".
        - Brug Shadcn `Table` til at vise kolonneoverskrifter, men med besked om "Ingen data" eller mock rækker.

## F2.4: `[ ]` Live Sports - Oversigt Side (`app/live-sports/page.tsx`)
- **UI Inspiration:** Bet365/FlashScore (data-tæt, klar, nem navigation).
- **F2.4.1: Opret Route og Grundlæggende Sidestruktur:**
    - Opret `app/live-sports/page.tsx`.
    - Brug DashboardLayout.
- **F2.4.2: Sport/Liga Navigation (Statisk/Mock Data):**
    - Brug Shadcn `Tabs` eller en custom `SegmentedControl` for at vælge sport (f.eks. Fodbold, Basketball).
    - Under valgt sport, vis en liste/dropdown af ligaer (mock data).
- **F2.4.3: Kamp-liste Visning (Statisk/Mock Data):**
    - Brug Shadcn `Table` til at vise en liste af kampe for den "valgte" sport/liga.
    - Opret `LiveMatchRow` komponent (`components/features/sports/LiveMatchRow.tsx`):
        - Skal modtage mock kamp-data som props.
        - Viser: Hjemmehold (navn, logo), Udehold (navn, logo), Score, Kamp-tid/status (f.eks. "65'", "HT", "FT", "14:00"), eventuelt live-indikator.
        - Brug Shadcn `Badge` for status.
        - Gør rækken klikbar (navigation til kampdetalje-side i Fase 5).
- **F2.4.4: Filter/Sorterings-UI (Statisk):**
    - Design UI-elementer for filtrering (f.eks. efter dato, live/kommende/færdige kampe - Shadcn `Select` eller `RadioGroup`).
    - Design UI for sortering (f.eks. efter tid, liga - Shadcn `Button` med ikon).
    - *Bemærkning: Funktionalitet implementeres i Fase 3.*

## F2.5: `[ ]` Aktiedyst - Dashboard Side (`app/aktiedyst/page.tsx`)
- **UI Inspiration:** Nordnet/TradingView (overskueligt, finansielt dashboard-look).
- **F2.5.1: Opret Route og Grundlæggende Sidestruktur:**
    - Opret `app/aktiedyst/page.tsx`.
    - Brug DashboardLayout.
- **F2.5.2: Vis Nøgletal (Statisk/Mock Data):**
    - Række af Shadcn `Card` komponenter øverst for at vise: Total porteføljeværdi, Cash balance, Dagens PNL, Samlet PNL (alle med mock data).
- **F2.5.3: Vis Portefølje (Statisk/Mock Data):**
    - Brug Shadcn `Table` til at vise brugerens aktiebeholdning.
    - Opret `PortfolioHoldingRow` komponent (`components/features/aktiedyst/PortfolioHoldingRow.tsx`):
        - **Props:** Mock beholdningsdata (symbol, firmanavn, antal, gennemsnitskøbspris, nuværende pris, markedsværdi, PNL).
        - Viser data i tabelrække.
- **F2.5.4: Statisk Aktiegraf Komponent (`components/features/aktiedyst/StockChart.tsx`):**
    - Brug Recharts til at vise en simpel linjegraf med mock historiske kursdata for en fiktiv aktie.
    - Titel for grafen.
- **F2.5.5: Design "Handels-Widget" (Statisk):**
    - En Shadcn `Button` "Handl" eller "Ny Ordre".
    - Ved klik (ingen logik endnu), vis en Shadcn `Dialog`.
    - Dialog indeholder: `Input` for symbol, `Select` for Køb/Salg, `Input` for antal, `Select` for ordretype (Market), `Button` for "Placer Ordre". Alt med mock værdier eller placeholders.

## F2.6: `[ ]` Forum - Oversigt Side (`app/forum/page.tsx`)
- **F2.6.1: Opret Route og Grundlæggende Sidestruktur:**
    - Opret `app/forum/page.tsx`.
    - Brug DashboardLayout.
- **F2.6.2: Vis Forum-kategorier (Statisk/Mock Data):**
    - Brug en liste af Shadcn `Card` komponenter eller en custom liste til at vise kategorier.
    - Opret `ForumCategoryCard` komponent (`components/features/forum/ForumCategoryCard.tsx`):
        - **Props:** Mock kategoridata (navn, beskrivelse, ikon, antal tråde/posts, seneste aktivitet).
        - Viser data pænt. Gør kortet klikbart (ingen logik endnu).
- **F2.6.3: Vis Liste af Tråde for en "Valgt" Kategori (Statisk/Mock Data):**
    - Under kategorilisten (eller på en separat side `app/forum/[categoryId]/page.tsx` - besluttes nu), vis en Shadcn `Table`.
    - Opret `ForumThreadRow` komponent (`components/features/forum/ForumThreadRow.tsx`):
        - **Props:** Mock trådata (titel, forfatter, antal svar, visninger, seneste svar-tidspunkt).
        - Viser data i tabelrække. Titel er et link (ingen navigation endnu).

## F2.7: `[ ]` Identificer & Genopbyg Genbrugelige UI-Elementer fra Eksisterende Projekt
- **F2.7.1: Analyse af Gammelt HTML/CSS:**
    - Gennemgå det gamle projekt for gennemgående UI-mønstre (specifikke knap-designs, kort-layouts, informationsbokse, etc.), der ikke direkte dækkes af Shadcn, men som ønskes bibeholdt/moderniseret.
- **F2.7.2: Implementer som Custom Komponenter:**
    - Byg disse elementer som nye React/Tailwind komponenter.
    - Placer dem i `apps/frontend/src/components/common/` (for generiske) eller `components/features/...` (hvis feature-specifikke).
    - Overvej om nogle er så generiske, at de kunne blive custom Shadcn-komponenter ved at følge deres mønster (bygge ovenpå Radix, CLI-integration), eller blot rene React-komponenter.

## F2.8: `[ ]` (Stærkt Anbefalet) Opsæt Storybook (i `apps/frontend/`)
- **F2.8.1: Initialiser Storybook:**
    - Kør `npx storybook@latest init` i `apps/frontend/`.
    - Følg opsætningsvejledningen. Sørg for korrekt konfiguration ift. Next.js, Tailwind, TypeScript.
- **F2.8.2: Opret Stories for Nøglekomponenter:**
    - Start med at oprette stories for de nye genbrugelige komponenter fra F2.7.
    - Opret stories for udvalgte Shadcn-komponenter som de er konfigureret/brugt i projektet.
    - Opret stories for feature-specifikke komponenter som `LiveMatchRow`, `PortfolioHoldingRow`.
- *Rationale: Isoleret udvikling, visuel test, dokumentation af UI-komponentbiblioteket, nemmere UI-review.*

---

# Fase 3: Frontend Data Integration & Firebase Autentificering (`apps/frontend/`)
**Mål:** At bringe de statiske UI-komponenter fra Fase 2 til live ved at:
- Integrere med Firebase Authentication for login/signup.
- Forbinde frontend til backend API'erne for at hente og vise rigtige data via TanStack Query.
- Implementere formularlogik for brugerinteraktioner (f.eks. afgivelse af aktieordrer).
**Status:** Ikke påbegyndt.

## F3.1: `[ ]` Opsæt TanStack Query (React Query) Provider & API Klient
- **F3.1.1: Opret QueryClient:**
    - I `apps/frontend/src/lib/react-query.ts` (eller lignende), opret en `QueryClient` instans med globale standardindstillinger (f.eks. `staleTime`, `gcTime`).
- **F3.1.2: Opret Providers Komponent:**
    - Opret `apps/frontend/src/app/providers.tsx`.
    - Denne komponent skal wrappe applikationen med `<QueryClientProvider client={queryClient}>`.
    - Inkluder også `ReactQueryDevtools` for udviklingsmiljøet.
- **F3.1.3: Wrap Applikationen:**
    - Importer og brug `Providers` komponenten i `apps/frontend/src/app/layout.tsx` til at wrappe `{children}`.
- **F3.1.4: Opret API Klient (`lib/apiClient.ts`):**
    - Opret en centraliseret funktion (eller klasse) til at foretage API-kald til Flask-backend.
    - Skal håndtere:
        - Tilføjelse af `Content-Type: application/json` og `Accept: application/json` headers.
        - Automatisk tilføjelse af Firebase ID token til `Authorization: Bearer <token>` headeren (se F3.2.5).
        - Grundlæggende fejlhåndtering (f.eks. parsing af JSON-fejl fra backend, håndtering af netværksfejl).
        - Returnere parsed JSON data eller kaste en struktureret fejl.

## F3.2: `[ ]` Implementer Firebase Autentificering Flow
- **F3.2.1: Integrer Firebase SDK Auth Funktioner:**
    - I Login/Signup siderne (`app/(auth)/...`), brug Firebase SDK funktioner fra `firebase/auth` (initialiseret i `lib/firebase.ts`):
        - `signInWithEmailAndPassword` (Login side).
        - `createUserWithEmailAndPassword` (Signup side).
        - `signOut` (til en "Log ud" knap i Header/Brugermenu).
        - Overvej `sendPasswordResetEmail` (for "Glemt Password" flow).
- **F3.2.2: Formularvalidering med React Hook Form & Zod:**
    - Integrer `react-hook-form` og `zod` på Login/Signup formularerne for inputvalidering (f.eks. gyldig email, password styrke, match mellem password og confirm password, påkrævet invite code).
- **F3.2.3: Global Auth State med Zustand (`store/authStore.ts`):**
    - Opret en Zustand store til at holde styr på:
        - `user: firebase.User | null` (Firebase user object).
        - `isLoading: boolean` (status for auth-processer).
        - `error: string | null` (auth-fejlmeddelelser).
        - `localUserProfile: UserProfile | null` (brugerens profil fra backend, se F3.2.7).
    - Brug `onAuthStateChanged` (fra `firebase/auth`) i en `useEffect` i en global layout-komponent (f.eks. DashboardLayout eller en specifik auth-lytter-komponent) til at lytte efter ændringer i brugerens auth-status.
    - Opdater Zustand store'en baseret på `onAuthStateChanged` events (login, logout).
    - *Bemærkning: Firebase SDK håndterer typisk automatisk refresh af ID tokens.*
- **F3.2.4: Gør Auth State Tilgængelig via Custom Hook (`hooks/useAuth.ts`):**
    - Opret en custom hook `useAuth` der returnerer data fra `authStore` (f.eks. `isAuthenticated`, `currentUser`, `isLoading`).
- **F3.2.5: Send Firebase ID Token med API Kald:**
    - I `lib/apiClient.ts` (fra F3.1.4), hent det aktuelle Firebase ID token (`await firebase.auth().currentUser?.getIdToken()`) og inkluder det i `Authorization` headeren for alle kald til Flask-backend.
- **F3.2.6: Sidebeskyttelse (Protected Routes):**
    - Implementer en mekanisme til at beskytte sider, der kræver login (f.eks. Profil, Aktiedyst Dashboard).
    - **Metode 1 (Client-side redirect):** I de beskyttede siders komponenter, brug `useAuth` hook'en. Hvis brugeren ikke er logget ind og loading er færdig, redirect til `/login` (brug `useRouter` fra `next/navigation`). Vis evt. en loader imens.
    - **Metode 2 (Next.js Middleware - `middleware.ts` i roden af `app` eller `src`):** Kan bruges til at tjekke auth-status (f.eks. via en cookie sat af Firebase eller ved at validere token server-side via en auth-service) og redirecte før siden renderes. Dette kan være mere komplekst at sætte op med client-side Firebase Auth.
    - **Metode 3 (Layout Check):** I et layout, der gælder for beskyttede routes, tjek auth status og render enten `children` eller en "Unauthorized" besked / redirect.
    - **Valg:** Start med Metode 1 for simplicitet.
- **F3.2.7: Synkroniser/Hent Lokal Brugerprofil efter Firebase Login:**
    - Efter succesfuld Firebase login/signup (og `onAuthStateChanged` har fyret):
        - Kald backend `POST /api/v1/auth/register_or_sync_firebase_user` for at sikre lokal brugerprofil er oprettet/synkroniseret. Denne returnerer nu ikke lokale JWTs.
        - Kald backend `GET /api/v1/users/me/profile` (med Firebase ID token) for at hente den fulde lokale brugerprofil.
        - Gem denne profil i `authStore` (se F3.2.3).

## F3.3: `[ ]` Hent Data til Live Sports (med TanStack Query)
- **F3.3.1: Liste af Sportsgrene/Ligaer:**
    - I `app/live-sports/page.tsx` (eller en underkomponent), brug `useQuery` til at hente data fra `/api/v1/sports`.
    - `queryKey`: f.eks. `['sports']`.
    - `queryFn`: Kald til `apiClient.get('/sports')`.
    - Brug de hentede data til at populere Tabs/dropdowns for sport/liga-valg (fra F2.4.2).
- **F3.3.2: Liste af Kampe:**
    - Brug `useQuery` til at hente kamp-liste fra `/api/v1/sports/{sportId}/matches` (eller det nye `/api/v1/matches?sportId=...&status=...` hvis det er det nye mønster).
    - `queryKey`: Skal være dynamisk og inkludere filtre som `sportId`, `leagueId`, `date`, `status`. F.eks. `['matches', sportId, leagueId, date, status]`.
    - `queryFn`: Kald til `apiClient` med de korrekte query parametre.
    - Brug de hentede data til at populere `LiveMatchRow` komponenter i tabellen (fra F2.4.3).
- **F3.3.3: Loading & Error States:**
    - Brug `isLoading`, `isError`, `error` fra `useQuery` resultatet.
    - Vis Shadcn `Skeleton` komponenter mens data hentes.
    - Vis en passende fejlmeddelelse (f.eks. fra `error.message` eller en generisk) hvis API-kald fejler.

## F3.4: `[ ]` Hent Data & Implementer Interaktioner for Aktiedyst (med TanStack Query)
- **F3.4.1: Portefølje, Transaktioner, Markeder, Historik:**
    - For `app/aktiedyst/page.tsx` og relaterede komponenter:
        - `useQuery` for `/api/v1/aktiedyst/portfolio` (`queryKey: ['aktiedystPortfolio']`).
        - `useQuery` for `/api/v1/aktiedyst/transactions` (`queryKey: ['aktiedystTransactions', filters]`).
        - `useQuery` for `/api/v1/aktiedyst/markets` (`queryKey: ['aktiedystMarkets', filters]`).
        - `useQuery` for `/api/v1/aktiedyst/markets/{symbol}/history` (f.eks. når en aktie vælges til grafen, `queryKey: ['aktiedystMarketHistory', symbol, period]`).
- **F3.4.2: Opdater StockChart Komponent:**
    - `StockChart.tsx` (fra F2.5.4) skal nu acceptere data som prop og rendre den dynamisk.
- **F3.4.3: Implementer Handelsformular (Order Submission):**
    - I "Handels-Widget" Dialog (fra F2.5.5):
        - Brug `react-hook-form` + `zod` for validering af ordre-input.
        - Brug `useMutation` (fra TanStack Query) til at sende ordren til `POST /api/v1/aktiedyst/orders`.
        - `mutationFn`: Kald til `apiClient.post('/aktiedyst/orders', orderData)`.
        - `onSuccess`:
            - Vis succesnotifikation (se F3.6).
            - Invalider relevante queries for at genopfriske data (f.eks. `queryClient.invalidateQueries({ queryKey: ['aktiedystPortfolio'] })`, `queryClient.invalidateQueries({ queryKey: ['aktiedystTransactions'] })`).
            - Luk dialogen.
        - `onError`: Vis fejlnotifikation.

## F3.5: `[ ]` Hent Data til Forum & Andre Sider (med TanStack Query)
- **F3.5.1: Forum Kategorier & Tråde:**
    - I `app/forum/page.tsx` (eller relevante underkomponenter/sider):
        - `useQuery` for `/api/v1/forum/categories`.
        - `useQuery` for `/api/v1/forum/categories/{categoryId}/threads` (dynamisk `queryKey`).
        - Til Fase 5: `useQuery` for `/api/v1/forum/threads/{threadId}/posts`.
- **F3.5.2: Brugerprofil Data:**
    - I `app/profile/page.tsx`: Brugerens data er allerede i `authStore` (hentet i F3.2.7). `useQuery` kan bruges her hvis der er profil-dele, der skal genhentes specifikt eller hvis data ikke skal være i global auth state. Ellers kan data tages direkte fra `useAuth().localUserProfile`.
    - For `PUT /api/v1/users/me/profile`, brug `useMutation` når brugeren opdaterer sin profil. Invalider profildata ved succes.
    - *Overvejelse fra planen: "...eller direkte fra Firebase Firestore hvis dele er flyttet dertil." Dette er primært relevant for Fase 6. Indtil da hentes data fra Flask API'er.*

## F3.6: `[ ]` API Error Handling & Notifikationer
- **F3.6.1: Centraliseret Notifikationssystem:**
    - Brug Sonner (Shadcn's anbefalede toast-bibliotek, installeret i Fase 0).
    - Wrap applikationen med Sonner's `<Toaster />` komponent (typisk i `layout.tsx` eller `providers.tsx`).
- **F3.6.2: Vis Notifikationer:**
    - I `apiClient.ts` eller direkte i `useQuery/useMutation`'s `onError` callbacks: Kald `toast.error('Fejlbesked')`.
    - I `useMutation`'s `onSuccess` callbacks: Kald `toast.success('Handlingen lykkedes!')`.
    - Vis informative fejlmeddelelser til brugeren, evt. baseret på fejltype eller statuskode fra backend.

---

# Fase 4: Real-time Implementering (`apps/frontend/` & `apps/backend/`)
**Mål:** At integrere live-opdateringer fra backend (Flask-SocketIO, og potentielt Firebase Realtime services) ind i frontend for en dynamisk og øjeblikkelig brugeroplevelse, især for sportsresultater og aktiekurser.
**Status:** Backend-forberedelse er lavet (F1.7). Frontend-integration er ikke påbegyndt.

## F4.1: `[ ]` Etabler WebSocket Forbindelse til Flask-SocketIO (Frontend)
- **F4.1.1: Opret Custom Hook `hooks/useSocket.ts`:**
    - Denne hook skal initialisere `socket.io-client`.
    - Håndter socket instansen (opret én gang, gem i `ref` eller `state`).
    - Initialiser socket med URL til Flask-backend (fra miljøvariabel `NEXT_PUBLIC_SOCKET_URL`).
- **F4.1.2: Socket.IO Autentificering:**
    - Når brugeren er logget ind (Firebase auth state er klar):
        - Hent Firebase ID token.
        - Etabler Socket.IO forbindelse og send token'et som en query parameter (f.eks. `query: { token: firebaseIdToken }`) under `connect`-eventet, som backend forventer (F1.7.2).
    - Hook'en skal håndtere re-connects og sikre, at token er vedhæftet.
- **F4.1.3: Håndter Standard Socket Events:**
    - Opsæt listeners for `connect`, `disconnect`, `connect_error`.
    - Log disse events for debugging.
    - Opdater evt. en global state (Zustand store, `socketStore.ts`?) med forbindelsesstatus.
- **F4.1.4: Gør Socket-instansen og Events Tilgængelig:**
    - `useSocket` hook'en kan returnere socket-instansen.
    - Alternativt: Brug React Context til at give socket-instansen globalt.
    - Eller: `useSocket` kan eksponere funktioner til at abonnere (`socket.on`) og afsende (`socket.emit`) events.

## F4.2: `[ ]` Live Sports Opdateringer (Frontend)
- **F4.2.1: Abonner på Specifikke Kamp-Events:**
    - Når en bruger ser på en liste af live kampe eller en specifik kampdetalje-side:
        - Brug `socket.emit('subscribe_to_match_scores', { match_ids: [...] })` for at joine relevante rooms på backend (f.eks. `match_{matchId}`). Backend skal håndtere dette (formodentlig refaktorering af `handle_subscribe_to_live_scores` til at tage en liste).
        - Sørg for at `socket.emit('unsubscribe_from_match_scores', { match_ids: [...] })` kaldes når komponenten unmountes eller brugeren navigerer væk.
- **F4.2.2: Lyt til `live_score_update` Event:**
    - Opsæt en listener `socket.on('live_score_update', (data) => { ... })`.
- **F4.2.3: Opdater UI med Nye Data:**
    - Når `live_score_update` modtages:
        - Brug `queryClient.setQueryData(['matches', ...], updatedMatchData)` eller `queryClient.setQueryData(['matchDetails', matchId], updatedMatchData)` til at opdatere den relevante cache i TanStack Query.
        - Dette vil automatisk re-rendre de komponenter, der bruger disse query keys.
        - Undgå direkte state-manipulation, hvis data styres af TanStack Query.
- **F4.2.4: Visuelle Effekter (Framer Motion):**
    - Overvej subtile animationer/fremhævninger når en score opdateres (f.eks. kortvarig baggrundsfarveændring på den opdaterede række/score).

## F4.3: `[ ]` Aktiedyst Opdateringer (Frontend - Real-time priser hvis relevant)
- **F4.3.1: Abonner på Marked/Symbol Events:**
    - Tilsvarende Live Sports: Når brugeren ser på markedslisten eller en specifik aktieside:
        - `socket.emit('subscribe_to_market_data', { symbols: [...] })` (backend room: `aktiedyst_market_{symbol}`).
        - Husk unsubscribe.
- **F4.3.2: Lyt til `stock_price_update` Event:**
    - Opsæt `socket.on('stock_price_update', (data) => { ... })`.
- **F4.3.3: Opdater UI med Nye Prisdata:**
    - Brug `queryClient.setQueryData` til at opdatere cachen for markedslisten, porteføljen (hvis den viser realtidspriser), og den aktive aktiegraf.

## F4.4: `[ ]` Real-time Notifikationer (Frontend)
- **F4.4.1: Backend Udsendelse (Flask/Socket.IO eller Firebase):**
    - Backend (F1.7.1/F1.7.2) skal kunne udsende generiske notifikationsevents (f.eks. `new_user_notification`, `new_forum_reply`, `order_filled_notification`) til specifikke brugere (`user_{firebaseUserId}` room).
- **F4.4.2: Frontend Lytter efter Notifikationer:**
    - I `useSocket` (eller en global komponent), lyt til et generelt notifikationsevent, f.eks. `socket.on('user_notification', (notificationData) => { ... })`.
- **F4.4.3: Vis Notifikationer:**
    - Brug Sonner (toast-biblioteket) til at vise notifikationen for brugeren.
    - Overvej et notifikationscenter/ikon i headeren for ulæste notifikationer.

## F4.5: `[ ]` Performance Optimering for Real-time (Frontend & Backend)
- **Frontend:**
    - **`React.memo`:** Brug `React.memo` på komponenter, der modtager hyppige prop-opdateringer (som `LiveMatchRow`), for at undgå unødvendige re-renders, hvis props reelt ikke har ændret sig.
    - **Selektiv Rendering:** Sørg for at kun de dele af UI'en, der er påvirket af realtidsdata, re-renderes.
    - **Effektiv State Management:** Undgå at opdatere store dele af global state unødvendigt. TanStack Query's cache-opdateringer er generelt effektive.
- **Backend:**
    - **Send Kun Ændrede Data:** Når en Socket.IO event udsendes, send kun de data, der reelt er ændret, for at minimere payload-størrelse.
    - **Effektiv Room Management:** Sørg for, at brugere kun er i de rooms, de har brug for.
    - **Asynkron Event Udsendelse:** Hvis event-generering er tidskrævende, overvej at køre det asynkront (f.eks. med Celery eller lignende), så det ikke blokerer hoved-request-tråden.
- **Generelt:**
    - Test med mange samtidige forbindelser/events for at identificere flaskehalse.

---

# Fase 5: Avancerede Features & UI/UX Polishing (`apps/frontend/` & `apps/backend/`)
**Mål:** At implementere mere komplekse funktioner, der bygger ovenpå kernefunktionaliteten, samt at forfine den samlede brugeroplevelse med fokus på detaljer, animationer, responsivitet og tilgængelighed.
**Status:** Nogle backend-dele (Admin API) er noteret som ikke påbegyndt. Frontend er ikke påbegyndt.

## F5.1: `[ ]` Backend: Udvikling af Admin API
- **Status fra projektplan (snippet):** Ikke påbegyndt.
- **F5.1.1: Definition af Scope for Admin Funktionaliteter:**
    - Hvilke aspekter af applikationen skal administratorer kunne styre? (Brugerstyring, content moderation i forum, sportsdata management, aktiedyst-konfigurationer etc.)
    - Udarbejd en liste over specifikke admin-actions.
- **F5.1.2: Design Admin API Endpoints:**
    - Definer URL-struktur (f.eks. `/api/v1/admin/...`).
    - Specificer request/response JSON-strukturer for hver admin-action.
    - API'et skal være strengt beskyttet (kræver admin-rolle, verificeret via Firebase custom claims eller lokal DB-rolle).
- **F5.1.3: Implementer Admin API Endpoints i Flask (`apps/backend/routes/api_admin.py`):**
    - Opret ny blueprint.
    - Implementer logik for hver admin-funktion, inkl. databaseinteraktioner.
    - Sørg for grundig logning af alle admin-actions.
- **F5.1.4: Test Admin API Grundigt.**
- *Bemærkning: Selve Admin UI'et udvikles som en del af frontend (måske i en separat `app/admin` route group).*

## F5.2: `[ ]` Frontend: Avancerede Aktiedyst Features
- **F5.2.1: Udvidet StockChart Komponent:**
    - Tilføj mulighed for at vælge forskellige graf-typer (linje, candlestick) i `StockChart.tsx`.
    - Implementer tekniske indikatorer (f.eks. Moving Averages, RSI - Recharts understøtter custom elementer).
    - Tilføj zoom/pan funktionalitet til grafen.
    - *Kræver: Potentielt mere detaljerede data fra backend API eller client-side beregninger.*
- **F5.2.2: Avancerede Ordretyper:**
    - Udvid handels-widget/dialog (fra F2.5.5 og F3.4.3) til at understøtte "Limit" og "Stop" ordretyper.
    - Tilføj inputfelter for limit pris / stop pris.
    - *Kræver: Backend `POST /api/v1/aktiedyst/orders` (F1.5.5) skal kunne håndtere disse ordretyper.*
- **F5.2.3: Watchlist Funktionalitet:**
    - Design UI for at brugere kan tilføje/fjerne aktier til/fra en personlig watchlist.
    - Vis watchlist et passende sted (f.eks. sidebar, separat fane på Aktiedyst dashboard).
    - *Kræver:*
        - Backend API endpoints til at håndtere watchlists (f.eks. `GET /users/me/watchlist`, `POST /users/me/watchlist/{symbol}`, `DELETE /users/me/watchlist/{symbol}`). Disse er nye og skal designes/implementeres.
        - DB-model for watchlists.

## F5.3: `[ ]` Frontend: Avancerede Live Sports Features
- **F5.3.1: Detaljeret Kampvisningsside (`app/live-sports/[matchId]/page.tsx`):**
    - Opret dynamisk route for individuelle kampe.
    - Hent detaljerede kampdata fra `GET /api/v1/matches/{matchId}` (backend F1.4).
    - Vis omfattende information: score, tid, events (mål, kort - med ikoner), lineups, statistik (boldbesiddelse, skud etc.), H2H (head-to-head), spillested.
    - UI-design inspireret af FlashScore/Bet365 detaljesider.
- **F5.3.2: Favoritmarkering af Kampe/Ligaer:**
    - Tillad brugere at markere kampe eller ligaer som favoritter.
    - Vis favoritter prominent eller i en separat sektion.
    - *Kræver:*
        - Backend API endpoints til at håndtere favoritter (svarende til watchlist).
        - DB-model for brugerfavoritter (kampe/ligaer).

## F5.4: `[ ]` Frontend & Backend: Forum Implementering (Fuld CRUD)
- **Backend status:** GET/POST for posts er lavet. CRUD for tråde og posts er også lavet iflg. changelog.
- **Backend API:** Fuld CRUD for Forum Tråde og Posts er implementeret (Se F1.6 og CHANGELOG for Maj 19: Forum API CRUD Operations Completed).
    - `POST /api/v1/forum/categories/{categoryId}/threads` (Opret Tråd)
    - `PUT /api/v1/forum/threads/{threadId}` (Opdater Tråd)
    - `DELETE /api/v1/forum/threads/{threadId}` (Slet Tråd)
    - `POST /api/v1/forum/threads/{threadId}/posts` (Opret Post - allerede lavet i Fase 1)
    - `PUT /api/v1/forum/threads/{threadId}/posts/{postId}` (Opdater Post)
    - `DELETE /api/v1/forum/threads/{threadId}/posts/{postId}` (Slet Post)
- **Frontend Integration:**
    - **F5.4.1: Opret Ny Tråd Side/Modal:**
        - UI med formular (titel, brødtekst - evt. Markdown editor).
        - Brug `useMutation` til `POST /api/v1/forum/categories/{categoryId}/threads`.
        - Invalider relevante trådliste-queries ved succes.
    - **F5.4.2: Skriv Svar/Post (i Tråd-visning):**
        - UI med formular for brødtekst i bunden af post-listen.
        - Brug `useMutation` til `POST /api/v1/forum/threads/{threadId}/posts`.
        - Invalider/opdater post-listen ved succes.
    - **F5.4.3: Redigering/Sletning af Tråde/Posts (hvis tilladt for brugeren):**
        - Tilføj UI-elementer (f.eks. dropdown-menu per post/tråd) for rediger/slet.
        - Vis kun for ejer eller moderator.
        - Brug `useMutation` for PUT/DELETE kaldene.
        - Invalider/opdater lister ved succes.
    - *Overvejelse: Skal forumdata (specielt posts) flyttes til Firebase RTDB/Firestore for bedre realtidsoplevelse (se Fase 6)? Hvis ja, skal disse `useMutation`-kald ændres til at skrive direkte til Firebase.*

## F5.5: `[ ]` Animationer & Overgange (Framer Motion & evt. Anime.js)
- **F5.5.1: Identificer Steder for Forbedret UX med Animation:**
    - Sideovergange (subtile fades eller slides).
    - Modal-animationer (åbning/lukning af dialogs).
    - Hover-effekter på interaktive elementer.
    - Animerede loaders/skeletons for en mere flydende oplevelse.
    - Listeelementer, der animeres ind (f.eks. nye forum-posts).
- **F5.5.2: Implementer med Framer Motion:**
    - Brug `motion` komponenter, `animate` prop, `variants`, `whileHover`, `AnimatePresence`.
- **F5.5.3: Vurder Behov for Anime.js:**
    - Hvis der er meget specifikke, komplekse sekventielle eller timeline-baserede animationer, som er svære at opnå elegant med Framer Motion, overvej at bruge Anime.js til disse isolerede tilfælde. (Som originalt noteret: dette er "efter behov").

## F5.6: `[ ]` Responsivt Design Finpudsning
- **F5.6.1: Grundig Test på Forskellige Skærmstørrelser:**
    - Mobil (små, mellem, store).
    - Tablet (portræt, landskab).
    - Desktop (forskellige bredder).
- **F5.6.2: Juster Tailwind Breakpoints & Utility Klasser:**
    - Brug Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) til at justere layout, størrelser, synlighed etc.
    - Sørg for at interaktive elementer er lette at bruge på touch-skærme.
    - Test font-størrelser og læsbarhed.

## F5.7: `[ ]` Tilgængelighed (a11y) Review & Forbedringer
- **F5.7.1: Semantisk HTML:**
    - Sørg for korrekt brug af HTML5 elementer (`<nav>`, `<main>`, `<article>`, `<aside>`, etc.).
- **F5.7.2: Tastaturnavigation:**
    - Test at hele applikationen kan navigeres og interageres med KUN ved brug af tastatur.
    - Sørg for synlige `:focus` outlines (Tailwind tilbyder `focus-visible`).
- **F5.7.3: ARIA-Attributter:**
    - Brug ARIA-attributter hvor nødvendigt for at forbedre semantikken for skærmlæsere (Shadcn/ui komponenter baseret på Radix UI er generelt gode her, men custom komponenter skal tjekkes).
    - F.eks. `aria-label`, `aria-describedby`, `role`.
- **F5.7.4: Test med a11y Værktøjer:**
    - Brug browserudvidelser som axe DevTools, Lighthouse, eller WAVE.
- **F5.7.5: Farvekontrast:** Sørg for tilstrækkelig kontrast mellem tekst og baggrund.

## F5.8: `[ ]` Dark Mode (Valgfrit, men anbefalet for moderne UX)
- **F5.8.1: Implementer Tema-skift med `next-themes`:**
    - Installer `next-themes`.
    - Wrap applikationen med `ThemeProvider` (fra `next-themes`).
    - Opret en UI-knap/switch til at skifte mellem 'light', 'dark', 'system' temaer.
- **F5.8.2: Brug Tailwind's `dark:` Variant:**
    - I `tailwind.config.js`, aktiver `darkMode: 'class'`.
    - Brug `dark:` prefix for at style komponenter forskelligt i dark mode (f.eks. `bg-white dark:bg-gray-800`).
    - Sørg for at alle komponenter, inkl. Shadcn og custom, respekterer dark mode.

---

# Fase 6: Yderligere Firebase Integration (Udvidelsesmuligheder)
**Mål:** At udnytte Firebase's økosystem yderligere for at forbedre specifikke funktionaliteter, øge skalerbarheden eller forenkle udviklingsprocesser for visse features.
**Status:** Ikke påbegyndt.

## F6.1: `[ ]` Firestore/Realtime Database (RTDB) for Specifikke Features
- **Rationale:** Firebase databaser (især RTDB for ultra-low latency, Firestore for komplekse queries/skalering) er gode til features, der kræver intens realtidsinteraktion eller ikke passer godt ind i den relationelle model.
- **F6.1.1: Overvej Feature Kandidater:**
    - **Chat-funktionalitet:** RTDB er klassisk for chat-beskeder.
    - **Realtids Forum-kommentarer/visninger:** I stedet for kun Socket.IO push, kan nye kommentarer skrives direkte til RTDB/Firestore og lyttes på af klienter.
    - **Komplekse Brugerindstillinger:** Ting der ikke er simple key-value pairs.
    - **Activity Feeds:** "X har svaret på din tråd", "Y har købt Z aktie".
    - **Notifikationssystem (data-del):** Selve notifikationsdataene kan ligge i Firestore, mens Socket.IO bruges til at "puffe" klienten om en ny notifikation.
- **F6.1.2: Implementer en Valgt Feature med Firebase DB:**
    - Vælg én af ovenstående (eller en anden) og implementer den.
    - Dette indebærer:
        - Frontend skriver/læser direkte til/fra Firebase DB (brug Firebase JS SDK).
        - Frontend lytter til realtidsopdateringer fra Firebase DB.
- **F6.1.3: Opsæt Firebase Sikkerhedsregler:**
    - Definer og implementer robuste sikkerhedsregler for den valgte Firebase database (RTDB eller Firestore) for at sikre, at brugere kun kan læse/skrive de data, de har tilladelse til.
    - Test reglerne grundigt med Firebase Simulatoren.

## F6.2: `[ ]` Firebase Storage for Filuploads
- **F6.2.1: Identificer Anvendelsesområder:**
    - Bruger-uploadede profilbilleder (avatars).
    - Vedhæftede filer i forum-posts (billeder, dokumenter).
- **F6.2.2: Frontend Integration:**
    - Brug Firebase JS SDK (`firebase/storage`) til at håndtere filuploads fra klienten.
    - Vis upload progress.
    - Håndter fejl.
- **F6.2.3: Backend Integration (hvis nødvendigt):**
    - Gem referencen (URL eller path) til den uploadede fil i din primære Flask-database (f.eks. `avatar_url` på `User` modellen).
    - Valider uploads server-side, hvis muligt/nødvendigt (f.eks. via Firebase Functions).
- **F6.2.4: Opsæt Firebase Storage Sikkerhedsregler:**
    - Definer regler for hvem der må uploade, hvilke filtyper/størrelser, og hvem der må læse filer.

## F6.3: `[ ]` Firebase Functions (Cloud Functions)
- **Rationale:** Serverless backend-logik, der kan trigges af Firebase-events (f.eks. DB-skrivning, Storage-upload) eller HTTP-requests. Kan skrives i Node.js, Python, etc.
- **F6.3.1: Identificer Brugsscenarier:**
    - **Billedbehandling:** Når et profilbillede uploades til Storage, kan en Function automatisk resizes/komprimere det.
    - **Sende Notifikationer:** Når en vigtig post oprettes i Firestore (f.eks. et nyt forum-svar til en fulgt tråd), kan en Function sende en push-notifikation eller email.
    - **Dataintegritet/Sanitering:** Køre logik efter data er skrevet til DB.
    - **Webhook Handlers:** Håndtere indgående webhooks fra tredjeparts services.
    - **Periodiske Opgaver:** Planlagte funktioner (cron jobs) f.eks. til oprydning eller generering af rapporter.
- **F6.3.2: Implementer en Valgt Firebase Function:**
    - Vælg et scenarie, skriv Function-koden (vælg sprog, f.eks. Node.js for tæt JavaScript økosystem-integration eller Python hvis logikken deles med backend).
    - Deploy Function'en til Firebase.
    - Test grundigt.

## F6.4: `[ ]` Firebase Hosting for Next.js Frontend (Vurdering)
- **Status:** Vercel er primær overvejelse for Next.js.
- **F6.4.1: Evaluer Fordele/Ulemper ved Firebase Hosting vs. Vercel:**
    - **Vercel Fordele:** Bygget af skaberne af Next.js, optimal performance, excellent DX, serverless functions, image optimization, analytics, nem integration med GitHub.
    - **Firebase Hosting Fordele:** Meget tæt integration med andre Firebase services, global CDN, nem opsætning hvis man allerede er i Firebase økosystemet. Kan være billigere for simple sites.
- **F6.4.2: Beslutning & Eventuel Migration:**
    - Baseret på evaluering, tag en endelig beslutning. Vercel er sandsynligvis stadig det stærkeste valg for et komplekst Next.js projekt, medmindre der er meget tung afhængighed af Firebase Functions til at rendere sider (hvilket Next.js typisk håndterer selv via Server Components/Route Handlers).

---

# Fase 7: Testning & Deployment
**Mål:** At sikre applikationens kvalitet, stabilitet og performance gennem omfattende testning, samt at opsætte en automatiseret og pålidelig deployment pipeline for både frontend og backend.
**Status:** Basis test framework for frontend er opsat (F0.8). Backend-tests og CI/CD er ikke formelt specificeret/påbegyndt.

## F7.1: `[ ]` Unit & Integration Tests
- **Frontend (`apps/frontend/`) - (Fortsættelse af F0.8):**
    - **Komponenttests (Jest & RTL):** Skriv tests for alle UI-komponenter (især custom og feature-specifikke), der verificerer rendering baseret på props, brugerinteraktioner, og state-ændringer.
    - **Hook Tests (Jest & RTL):** Test custom React Hooks isoleret.
    - **State Management Tests (Jest):** Test Zustand stores (actions, selectors).
    - **API Kald Mocking:** Brug `msw` (Mock Service Worker) eller Jest's mocking-funktioner til at mocke API-kald og Firebase SDK-interaktioner.
    - **Coverage Mål:** Sæt et mål for testdækning (f.eks. >70-80%) og følg op.
- **Backend (`apps/backend/`) - (Skal opsættes):**
    - **F7.1.1: Opsæt PyTest Framework:**
        - Installer PyTest og relevante plugins (f.eks. `pytest-flask`, `pytest-cov`).
        - Konfigurer `pytest.ini` eller `pyproject.toml`.
        - **Route Tests:** Test hver API endpoint for korrekte svar (statuskoder, JSON-struktur) baseret på forskellige inputs og auth-status. Brug Flask test client.
        - **Logik Tests:** Test forretningslogik i service-lag/utility-funktioner isoleret.
        - **Database Interaktion Tests:** Test databaseoperationer. Overvej test-database og fixtures for at sikre rene testtilstande.
        - **Coverage Mål:** Sæt mål for testdækning.

## F7.2: `[ ]` End-to-End (E2E) Tests (`apps/frontend/`)
- **F7.2.1: Vælg og Opsæt E2E Værktøj:**
    - Planen nævner Playwright (foretrukket) eller Cypress. Træf endeligt valg.
    - Installer og konfigurer værktøjet i `apps/frontend/` eller monorepo-roden.
- **F7.2.2: Definer Kritiske Bruger-Flows:**
    - **Eksempler:**
        - Bruger-registrering og login via Firebase.
        - Se sportskampe og navigere til en kampdetalje-side.
        - Købe/sælge en aktie i Aktiedyst.
        - Oprette en ny tråd og et svar i forum.
        - Opdatere brugerprofil.
- **F7.2.3: Skriv E2E Tests for Disse Flows:**
    - Brug Page Object Model (POM) for vedligeholdelige tests.
    - Sørg for at tests er robuste overfor mindre UI-ændringer.

## F7.3: `[ ]` Manuel Test & QA (Quality Assurance)
- **F7.3.1: Udarbejd Testplan/Checkliste for Manuel Test:**
    - Dæk alle features og bruger-flows.
    - Inkluder test-scenarier for edge cases og fejlhåndtering.
- **F7.3.2: Gennemfør Test på Forskellige Browsere:**
    - Chrome, Firefox, Safari, Edge (seneste versioner).
- **F7.3.3: Gennemfør Test på Forskellige Enheder/Skærmstørrelser:**
    - Desktop, tablet, mobil (fysiske enheder og emulatorer/simulatorer).
- **F7.3.4: User Acceptance Testing (UAT):**
    - Hvis muligt, få feedback fra potentielle brugere (eller teammedlemmer, der ikke har udviklet featuren).

## F7.4: `[ ]` Performance Optimering
- **Frontend:**
    - **Bundle Analyse:** Brug `next-build-analyzer` til at identificere store chunks i JavaScript-bundle.
    - **Billedoptimering:** Brug `next/image` konsekvent for optimerede billeder.
    - **Dynamisk Import:** Brug `next/dynamic` for komponenter, der ikke er nødvendige ved initial load (f.eks. store diagrambiblioteker, modals).
    - **Code Splitting:** Next.js håndterer meget af dette, men vær opmærksom.
    - **React DevTools Profiler:** Identificer performance flaskehalse i React-komponenter.
    - **Listevirtualisering:** For meget lange lister (f.eks. forum-posts, transaktioner), overvej biblioteker som `react-window` eller `TanStack Virtual`.
    - **Memoization:** Korrekt brug af `React.memo`, `useMemo`, `useCallback`.
    - **Lighthouse / WebPageTest:** Kør performance-tests regelmæssigt.
- **Backend:**
    - **Database Query Optimering:** Analyser langsomme DB-forespørgsler (brug `EXPLAIN`). Optimer indekser. Undgå N+1 problemer.
    - **Caching Strategier:**
        - Implementer caching for data der ikke ændres ofte (f.eks. API-responses med Flask-Caching, eller Redis).
        - Overvej client-side caching (TanStack Query gør meget, men HTTP caching headers kan også hjælpe).
    - **Load Testing:** Brug værktøjer som k6, Locust, eller Apache JMeter til at teste backend API'ers performance under pres.

## F7.5: `[ ]` Opsæt CI/CD Pipeline (Continuous Integration/Continuous Deployment)
- **F7.5.1: Vælg CI/CD Platform:**
    - GitHub Actions er foreslået og passer godt til GitHub repositories.
- **F7.5.2: Konfigurer Workflows for Monorepo:**
    - **Separate Workflows:** Opret separate workflows for frontend (`apps/frontend`) og backend (`apps/backend`).
    - **Path Filtering:** Workflows skal kun trigges, hvis der er ændringer i de relevante mapper (`paths` filter i GitHub Actions).
    - **Frontend Workflow:**
        - Checkout kode.
        - Opsæt Node.js.
        - Installer afhængigheder (`npm ci`).
        - Kør linting.
        - Kør unit/integration tests.
        - Kør E2E tests (evt. mod en staging/preview deployment).
        - Byg Next.js applikation (`npm run build`).
        - Deploy til Vercel (eller Firebase Hosting) for `main` branch pushes (produktion) og PRs (preview deployments).
    - **Backend Workflow:**
        - Checkout kode.
        - Opsæt Python.
        - Installer afhængigheder (`pip install -r requirements.txt`).
        - Kør linting.
        - Kør unit/integration tests (kræver evt. DB-service i CI-miljø).
        - Byg Docker image.
        - Push Docker image til et container registry (f.eks. Docker Hub, Google Container Registry, AWS ECR).
        - Deploy Docker image til valgt cloud platform (Cloud Run, App Runner) for `main` branch pushes.
- **F7.5.3: Håndter Hemmeligheder/Miljøvariabler i CI/CD:**
    - Brug platformens (f.eks. GitHub Actions Secrets) indbyggede funktioner til sikker opbevaring af API-nøgler, database-credentials, Firebase service account.

## F7.6: `[ ]` Konfigurer Miljøvariabler for Deployment Miljøer
- Brug `.env.local` (i `.gitignore`) til lokal frontend udvikling.
- Brug `.env` (i `.gitignore`) til lokal backend udvikling.
- **Produktion & Staging Miljøer:**
    - Konfigurer miljøvariabler direkte i UI'en for hosting platformene:
        - Vercel (for frontend: `NEXT_PUBLIC_` og server-side).
        - Firebase (for Functions, Hosting config).
        - Cloud Provider (Google Cloud Run, AWS App Runner) for backend container.
    - Sørg for at adskille `NEXT_PUBLIC_` prefixede variabler (tilgængelige i browser) fra rene server-side variabler for Next.js.

---

# Fase 8: Launch & Vedligeholdelse
**Mål:** At lancere den moderniserede Fattecentralen-applikation succesfuldt til brugerne og etablere robuste processer for løbende drift, overvågning og fremtidig forbedring.
**Status:** Ikke påbegyndt.

## F8.1: `[ ]` Endelig Deployment til Produktion
- **F8.1.1: Pre-Launch Checklist:**
    - Alle tests (unit, integration, E2E, manuel) er bestået.
    - Alle kritiske fejl er rettet.
    - Performance er acceptabel.
    - Sikkerhedsgennemgang er foretaget.
    - Produktionsmiljøvariabler er sat korrekt.
    - Database (produktion) er klar og evt. migreret/seeded.
    - DNS-ændringer (hvis relevant) er planlagt.
    - Rollback-plan er klar, hvis noget går galt.
- **F8.1.2: Udfør Produktionsdeployment:**
    - Trigger CI/CD pipeline for `main` branch.
    - Monitorer deployment processen.
- **F8.1.3: Post-Launch Smoke Test:**
    - Verificer kernefunktionaliteter i produktionsmiljøet manuelt.

## F8.2: `[ ]` Monitorering & Logging
- **F8.2.1: Fejl-tracking:**
    - **Værktøj:** Sentry er foreslået (godt valg for både frontend og backend).
    - **Opsætning:** Integrer Sentry SDK i frontend (Next.js) og backend (Flask).
    - Konfigurer source maps for bedre stack traces.
    - Opsæt alarmer for nye/hyppige fejl.
- **F8.2.2: Performance & Analytics:**
    - **Frontend:**
        - Vercel Analytics (hvis Vercel bruges) - giver Core Web Vitals, trafik.
        - Google Analytics 4 (for brugeradfærd, custom events, funnels).
    - **Backend:**
        - Logging fra cloud provider (CloudWatch, Google Cloud Logging).
        - APM (Application Performance Monitoring) værktøj (f.eks. Sentry APM, Datadog, New Relic) hvis dybere performance-indsigt er nødvendig.
    - **Firebase:**
        - Firebase Performance Monitoring (hvis relevant, især for Firebase-tunge dele).
        - Firebase Analytics (for mobil-fokuserede metrics, hvis app'en udvides).
- **F8.2.3: Backend Logging:**
    - Sørg for struktureret og tilstrækkelig logging i Flask-applikationen (requests, errors, vigtige events).
    - Send logs til en centraliseret log-management service (f.eks. den der følger med cloud provideren).

## F8.3: `[ ]` Indsaml Feedback fra Brugere
- **F8.3.1: Etabler Feedback Kanaler:**
    - In-app feedback formular.
    - Dedikeret email-adresse.
    - Forum-tråd specifikt for feedback.
    - Overvej værktøjer som Hotjar (heatmaps, session recordings, surveys) for dybere indsigt i brugeradfærd.
- **F8.3.2: Analyser Feedback Systematisk:**
    - Log og kategoriser indkommen feedback.
    - Brug det som input til fremtidig udvikling.

## F8.4: `[ ]` Iterér & Forbedr (Kontinuerlig Udvikling)
- **F8.4.1: Vedligehold Backlog:**
    - Brug et issue tracking system (f.eks. GitHub Issues, Jira, Trello).
    - Prioriter nye features, forbedringer og bug fixes.
- **F8.4.2: Planlæg Sprints/Iterationer:**
    - Arbejd i korte, fokuserede udviklingscyklusser.
- **F8.4.3: Regelmæssig Opdatering af Afhængigheder:**
    - Brug værktøjer som `npm outdated` / `pip list --outdated` og Dependabot (GitHub) til at holde styr på og opdatere biblioteker for at lukke sikkerhedshuller og få nye features.
    - Test grundigt efter opdateringer.
- **F8.4.4: Dokumentation:**
    - Hold denne projektplan (eller et lignende dokument) opdateret med status og ændringer.
    - Opdater API-dokumentation og in-code kommentarer løbende.

## Tips til Brug af Planen & Kreativ Udfoldelse (Repeteret fra original - stadig relevant):

-   **Iterativ Tilgang:** Hver fase (og hver underopgave) kan og bør opdeles i endnu mindre, håndterbare bidder. Markér fremskridt løbende.
-   **Fleksibilitet:** Verden ændrer sig. Vær åben for at justere planen undervejs baseret på nye indsigter, teknologiske ændringer, eller feedback.
-   **Eksperimenter:** Med UI/UX (Shadcn/Tailwind), animationer (Framer Motion/Anime.js) for at matche Bet365/Nordnet-inspirationen og skabe en unik Fattecentralen-følelse.
-   **HTML Transformation:** En systematisk tilgang er nøglen. Bryd de gamle HTML-sider ned komponent for komponent. Start med de ydre layouts og arbejd dig indad. Overfør CSS-stilarter til Tailwind-klasser. Omskriv JavaScript-logik til React-hooks og event handlers.
-   **Valg af Værktøjer:** De valgte værktøjer er stærke, men hvis der opstår et specifikt behov, hvor et alternativt værktøj er markant bedre, vær åben for at revurdere.
-   **AI som Sparringspartner:** Bliv ved med at bruge mig (eller andre AI-værktøjer) til kodeeksempler, arkitekturdiskussioner, fejlfinding, eller til at brainstorme løsninger.

Dette dækker hele planen med den ønskede detaljeringsgrad. Det er blevet en meget omfattende plan, men det skulle give et solidt og detaljeret fundament for projektet. Husk, at dette er et levende dokument – opdater det, efterhånden som projektet skrider frem, og nye beslutninger træffes. Held og lykke!
```




-------
Version 3;

Okay, lad os fortsætte med at forfine resten af din projektplan. Jeg vil fortsætte med samme detaljeringsgrad og struktur som for de indledende sektioner og Fase 0. Jeg vil integrere status fra din oprindelige plan ([X], [/]) og opdatere dem baseret på logikken og den information, du har givet.

Fase 1: Backend API Klargøring & Grundlæggende Autentificering (Python/Flask apps/backend/)
Mål: At sikre at backend'en eksponerer de nødvendige, robuste og sikre API'er for kernefunktionaliteterne, integrerer fuldt ud med Firebase Authentication for brugerstyring, og at real-time setup via Flask-SocketIO er optimeret og klar til brug.
Status: Overvejende fuldført for User Profile og Forum API. Sports & Aktiedyst API'er er påbegyndt med scaffolding og definitioner. Socket.IO forberedelse er også fuldført.

Generelle Bemærkninger og Status for Fase 1 (Baseret på projektplan og CHANGELOG):
[X] Fuldført Indledende API'er:
User Profile API: GET og PUT for /api/v1/users/me/profile er fuldt implementeret (api_user_profile.py) og registreret. Beskyttet med Firebase Auth.
Forum API: Fuld CRUD for tråde og posts er implementeret (forum.py) og registreret. Endpoints er beskyttet hvor relevant (f.eks. POST/PUT/DELETE) med Firebase Auth. Pylance-fejl rettet.
Reference: CHANGELOG Maj 19 (Core User Profile API, Forum API CRUD, Forum API Dev Initial Stages).
[/] Lokal Flask JWTs vs. Firebase ID Tokens:
Strategi: Gradvis udfasning af lokal Flask JWT-generering. Målet er at frontend udelukkende bruger Firebase ID tokens.
Nuværende Status (fra CHANGELOG Maj 19 - Pylance and Backend Firebase Auth):
/api/v1/auth/me bruger nu @firebase_token_required.
/api/v1/auth/register er repurposet til register_or_sync_firebase_user og bruger @firebase_token_required. Genererer ikke længere lokale JWTs.
POST /api/v1/auth/link-firebase er tilføjet for at linke eksisterende lokale konti til Firebase.
Traditionelle login-flows (/auth/login) giver beskeder om at linke/bruge Firebase.
Konklusion: Signifikant fremskridt er gjort, men fuld udfasning kræver måske yderligere review/tilpasning af alle ældre, lokale JWT-afhængige dele.
[X] Løbende Opgaver:
Fejlhåndtering, sikkerhedsforbedringer, databasemigreringer (som set med firebase_uid tilføjelse), og testning er kontinuerlige processer, der allerede er adresseret i det udførte arbejde.
F1.1: [X] Backend Miljø & Firebase Admin SDK Opsætning
Python Virtuelt Miljø:
Genereret requirements.txt fra oprindeligt miljø.
Flyttet requirements.txt til apps/backend/.
Oprettet nyt virtuelt miljø (.venv) i apps/backend/ (anbefalet med --copies for bedre Pylance/Pyright integration).
Installeret afhængigheder fra requirements.txt.
Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Authentication - venv recreation with --copies), CHANGELOG Maj 18 (Build/Environment Fixes - venv).
Firebase Admin SDK:
Downloadet service account key (fattecentralenas-service-account.json) og gemt sikkert (f.eks. ~/.firebase_keys/).
Konfigureret GOOGLE_APPLICATION_CREDENTIALS miljøvariabel i apps/backend/.env til at pege på service account key filen.
Verificeret at Firebase Admin SDK initialiseres korrekt i apps/backend/__init__.py.
Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Auth), CHANGELOG Maj 18 (Firebase Admin SDK Integration).
VS Code & Pylance/Pyright Konfiguration:
Korrekt konfigureret python.defaultInterpreterPath i .vscode/settings.json.
Korrekt konfigureret pyproject.toml for Pyright (tool.pyright.venvPath, tool.pyright.venv).
Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Auth - løsning af firebase_admin import issue).
F1.2: [X] Flask-JWT-Extended & Firebase Auth Integration
Mål: Centralisere API-autentificering omkring Firebase ID tokens.
Implementeret @firebase_token_required decorator (apps/backend/utils.py) til at verificere Firebase ID tokens.
Detaljer: Tjekker Authorization: Bearer <token> header, verificerer token mod Firebase, gør decoded token (eller firebase_uid) tilgængelig via flask_g.
Refaktorerede Nøgle API Endpoints:
/api/v1/auth/me: Beskyttet med @firebase_token_required. Henter bruger fra lokal DB via firebase_uid.
/api/v1/auth/register (nu register_or_sync_firebase_user):
Beskyttet med @firebase_token_required.
Synkroniserer/opretter lokal bruger baseret på Firebase auth.
Kræver invite_code for ny lokal profiloprettelse.
Genererer ikke længere lokale JWTs for dette flow.
Lokal DB User model (apps/backend/models.py):
Opdateret til at håndtere firebase_uid for identifikation. password_hash er nullable.
Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Auth), CHANGELOG Maj 18 (User Model Enhancements).
Lokal Konti Linking:
POST /api/v1/auth/link-firebase endpoint implementeret for at tillade brugere logget ind med traditionel metode at linke deres konto til Firebase.
[/] Strategi for eksisterende lokale JWTs:
Nuværende status: Fokus er på Firebase ID token validering for API-kald. Ældre, session-baserede login flows (HTML-sider) og JWTs genereret derfra er endnu ikke fuldt fjernet, men brugere guides mod Firebase login.
F1.2.1: Plan for fuld udfasning af lokal JWT-generering (hvis endnu ikke 100% dækket):
Identificer alle resterende endpoints/flows, der stadig genererer eller stoler på lokale JWTs.
Definer hvordan disse skal migreres til Firebase ID tokens eller fjernes.
Opdater frontend til udelukkende at bruge Firebase ID token til API-kald (dette er en Fase 3 opgave for frontend).
F1.3: [X] Database Review & Migrationer (apps/backend/models.py, migrations/)
Bruger Model (User):
Tilføjet firebase_uid (String, unique, nullable, indexed).
Sat password_hash til nullable=True.
Tilføjet __init__(self, **kwargs) for nemmere instansiering (løste Pylance-fejl).
Reference: CHANGELOG Maj 18 & 19.
Forum Modeller (ForumCategory, ForumThread, ForumPost):
Gennemgået og anvendt for Forum API CRUD. Nødvendige relationer og felter er på plads.
ForumPost model fik __init__ for Pylance-fejl-løsning.
Reference: CHANGELOG Maj 19 (Forum API CRUD, Pylance Fixes).
Alembic/Flask-Migrate:
Migrationer er genereret og anvendt for User model ændringer.
Sikret at PYTHONPATH og venv er korrekt sat op for flask db kommandoer.
Reference: CHANGELOG Maj 18.
F1.3.1: Database Review for Sports & Aktiedyst Modeller:
Gennemgå eksisterende databasemodeller for Sports og Aktiedyst.
Identificer eventuelle manglende felter/relationer for at understøtte de "Proposed New Endpoints" (se F1.4 & F1.5).
Udfør nødvendige modelændringer og generer/anvend migrationer.
F1.4: [/] API Design & Implementering - Live Sports
Mål: Sikre omfattende API-dækning.
Status (fra projektplan & Changelog):
GET /api/v1/sports: Liste af sportsgrene/ligaer (formodentlig eksisterende).
GET /api/v1/sports/{sportId}/matches: Liste af kampe (formodentlig eksisterende).
GET /api/v1/matches/{matchId}: Detaljer for én kamp.
Note: Endpoint refactored. Ny blueprint matches_api_bp oprettet. (Changelog Maj 19 - Focused API Dev Sprint & Live Sports & Aktiedyst API Scaffolding).
JSON request/response strukturer defineret for ovenstående.
Implementering af "Proposed New Endpoints" (Fra projektplan - disse er [ ]):
F1.4.1: GET /api/v1/sports/{sportId}/leagues
Implementer route i api_sports.py (eller en ny leagues_api_bp).
Implementer logik til at hente ligaer for en sport fra DB.
Serialiser respons iht. defineret JSON-struktur.
Tilføj paginering.
F1.4.2: GET /api/v1/leagues/{leagueId}
Implementer route.
Implementer logik for at hente specifik liga-info.
Serialiser.
F1.4.3: GET /api/v1/leagues/{leagueId}/standings
Implementer route.
Implementer logik for stillinger (potentielt kompleks query).
Serialiser. Overvej seasonId query parameter.
F1.4.4: GET /api/v1/leagues/{leagueId}/teams
Implementer route.
Implementer logik for hold i liga.
Serialiser. Paginering og seasonId parameter.
F1.4.5: GET /api/v1/teams/{teamId}
Implementer route.
Implementer logik for specifik team-info.
Serialiser.
F1.4.6: GET /api/v1/teams/{teamId}/matches
Implementer route.
Implementer logik for et holds kampe (filter på status, season etc.).
Serialiser. Paginering.
F1.4.7: Fælles opgaver for Live Sports API implementering:
Brug SQLAlchemy til alle databaseinteraktioner.
Implementer grundig inputvalidering for path/query parametre.
Standardiseret fejlhåndtering og HTTP statuskoder.
Overvej caching strategier for ofte tilgåede, men sjældent ændrede data (f.eks. liste af sportsgrene).
Skriv unit/integration tests for hvert nyt endpoint (PyTest).
F1.5: [/] API Design & Implementering - Aktiedyst
Mål: Sikre omfattende API-dækning.
Status (fra projektplan & Changelog):
Placeholders implementeret for:
GET /api/v1/aktiedyst/portfolio (Firebase Auth)
GET /api/v1/aktiedyst/transactions (Firebase Auth)
GET /api/v1/aktiedyst/markets
GET /api/v1/aktiedyst/markets/{symbol}/history
POST /api/v1/aktiedyst/orders (Firebase Auth)
Note: Blueprint aktiedyst_api_bp oprettet og registreret. Returnerer mock data. (Changelog Maj 19 - Focused API Dev Sprint & Live Sports & Aktiedyst API Scaffolding).
JSON request/response strukturer defineret for ovenstående.
Implementering af "Proposed New Endpoints" og fuld logik for eksisterende (Disse er [ ] medmindre andet er specificeret):
F1.5.1: Fuldfør GET /api/v1/aktiedyst/portfolio
Implementer logik for at hente brugerens portefølje fra DB.
Kræver @firebase_token_required. Hent bruger via firebase_uid.
Beregn værdier (PNL, market value etc.).
Serialiser iht. defineret JSON.
F1.5.2: Fuldfør GET /api/v1/aktiedyst/transactions
Implementer logik for at hente transaktionshistorik.
Kræver @firebase_token_required.
Håndter query parametre (paginering, type, symbol).
Serialiser.
F1.5.3: Fuldfør GET /api/v1/aktiedyst/markets
Implementer logik for at hente liste af handlebare aktier.
Håndter query parametre (paginering, search, sector).
Integrer med datakilde for aktiekurser/info (kan være intern DB eller ekstern API).
Serialiser.
F1.5.4: Fuldfør GET /api/v1/aktiedyst/markets/{symbol}/history
Implementer logik for at hente historiske kursdata.
Håndter query parametre (period, interval).
Integrer med datakilde for historiske data.
Serialiser.
F1.5.5: Fuldfør POST /api/v1/aktiedyst/orders
Implementer logik for at placere en ordre.
Kræver @firebase_token_required.
Valider request body (symbol, type, quantity, order_type, limit/stop price).
Tjek for tilstrækkelige midler/aktier.
Opret ordre i DB.
Returner respons iht. defineret JSON (inkl. order_id).
F1.5.6: Implementer GET /api/v1/aktiedyst/markets/{symbol} (Nyt foreslået endpoint)
Implementer route.
Implementer logik for detaljeret info om et symbol.
Serialiser.
F1.5.7: Implementer GET /api/v1/aktiedyst/orders (Nyt foreslået endpoint)
Implementer route.
Kræver @firebase_token_required.
Implementer logik for at hente brugerens ordrehistorik.
Håndter query parametre (status, symbol, paginering).
Serialiser.
F1.5.8: Implementer GET /api/v1/aktiedyst/orders/{orderId} (Nyt foreslået endpoint)
Implementer route.
Kræver @firebase_token_required.
Implementer logik for at hente detaljer om specifik ordre.
Serialiser.
F1.5.9: Implementer DELETE /api/v1/aktiedyst/orders/{orderId} (Nyt foreslået endpoint)
Implementer route.
Kræver @firebase_token_required.
Implementer logik for at annullere en åben ordre.
Serialiser.
F1.5.10: Implementer GET /api/v1/aktiedyst/leaderboard (Nyt foreslået endpoint)
Implementer route.
Implementer logik for leaderboard (kan være DB-intensivt).
Håndter query parametre (period, paginering).
Serialiser. Overvej caching.
F1.5.11: Fælles opgaver for Aktiedyst API implementering:
Definér nødvendige SQLAlchemy-modeller for Aktiedyst (Portfolio, Holdings, Transactions, Orders, etc.) og lav migrationer.
Brug SQLAlchemy til alle databaseinteraktioner.
Implementer grundig inputvalidering og robust fejlhåndtering.
Sikre alle bruger-specifikke endpoints med @firebase_token_required.
Planlæg integration med eksterne data-kilder for markedsdata, hvis det ikke findes i egen DB.
Skriv unit/integration tests (PyTest).
F1.6: [X] API Design & Implementering - Forum & Brugerprofil
Status: Fuldført.
Forum API (CRUD for tråde/posts, GET kategorier):
Alle endpoints defineret i planen er implementeret i forum.py.
POST, PUT, DELETE operationer er beskyttet med Firebase Auth.
Pylance fejl er rettet.
Reference: CHANGELOG Maj 19 (Forum API CRUD Operations Completed).
Brugerprofil API (GET & PUT /api/v1/users/me/profile):
Implementeret i api_user_profile.py.
Beskyttet med Firebase Auth.
Reference: CHANGELOG Maj 19 (Core User Profile API Implementation).
JSON strukturer for disse API'er er defineret i projektplanen og formodentlig fulgt.
Bemærkning til planen: "Overvej om dele af forum/profil data kan flyttes til Firebase Firestore..." - dette er en Fase 6 overvejelse. For nu er det implementeret i Flask/SQLAlchemy.
F1.7: [X] Real-time (Socket.IO) Forberedelse i Flask (apps/backend/sockets.py)
Status: Fuldført forberedelse.
Gennemgået eksisterende Flask-SocketIO setup.
Firebase Auth Integration:
Socket.IO on_connect handler modificeret til at verificere Firebase ID token sendt som query parameter. Forbindelser uden gyldigt token afvises.
Reference: CHANGELOG Maj 19 (Socket.IO Enhancements).
Event Navne & Datastrukturer:
Defineret klare event-navne: live_score_update, stock_price_update. new_user_notification er også nævnt i planen og bør bekræftes/defineres.
Datastrukturer for live_score_update og stock_price_update er defineret.
Socket.IO Rooms:
Strategi for room-navne: match_{matchId} (live sports), aktiedyst_market_{symbol} (stocks).
user_{firebaseUserId} noteret for bruger-specifikke notifikationer.
handle_subscribe_to_live_scores refaktoreret til at bruge match_{matchId}.
Reference: CHANGELOG Maj 19 (Socket.IO Enhancements).
F1.7.1: Definer new_user_notification event og datastruktur (hvis ikke allerede gjort).
F1.7.2: Implementer afsendelse af events fra backend:
Dette er mere end "forberedelse". Når backend-logikken for sport/aktiedyst ændrer data, skal de relevante Socket.IO events udsendes. Dette vil ske løbende som funktionerne implementeres (F1.4, F1.5, F5).
Fase 2: Core Frontend Features - UI Transformation & Statiske Komponenter (apps/frontend/)
Mål: At omdanne de vigtigste dele af den eksisterende HTML/CSS/JS til responsive Next.js/React komponenter med TypeScript og Tailwind CSS. Fokus i denne fase er på statisk struktur og udseende ved brug af mock data. Design skal inspireres af Bet365/FlashScore og Nordnet/TradingView.
Status: Ikke påbegyndt.

F2.1: [ ] Identificer Nøgle-HTML Sider/Sektioner til Transformation
F2.1.1: Analyser eksisterende HTML/CSS/JS projekt:
Gennemgå alle eksisterende sider og identificer de 5-7 vigtigste/mest komplekse brugerflader, der skal transformeres først.
Prioritetsliste (forslag baseret på planen):
Login/Signup
Live Sports Oversigt (inkl. kampdetaljer-light)
Aktiedyst Dashboard (inkl. portfolio-oversigt, markedsliste-light)
Forum Oversigt (kategorier, trådliste)
Brugerprofil Side
Dokumenter URL-struktur og funktionalitet for hver valgt side.
F2.1.2: JavaScript Biblioteksanalyse (f.eks. anime.js):
For hvert eksisterende JS-bibliotek:
Identificer præcis hvor og hvordan det bruges.
Vurder om funktionaliteten kan genskabes med Framer Motion (foretrukket for React-integration) eller via standard React/Tailwind/CSS.
Hvis anime.js (eller andet) stadig er nødvendigt for unik, kompleks animation, planlæg hvordan det integreres i React-komponenter (f.eks. via useEffect og refs).
F2.2: [ ] Login/Signup Side (app/(auth)/login/page.tsx, app/(auth)/signup/page.tsx)
F2.2.1: Opret Next.js Routes:
Brug Next.js Route Groups (auth) for at gruppere auth-relaterede sider uden at påvirke URL-stien.
Opret app/(auth)/login/page.tsx.
Opret app/(auth)/signup/page.tsx.
(Overvej) Opret app/(auth)/layout.tsx hvis der er et specifikt layout for auth-sider (f.eks. centreret indhold).
F2.2.2: Design UI med Shadcn/ui og Tailwind CSS (Statisk):
Login side: Brug Card, Input (for email/username, password), Button (for login), link til signup, link til "glemt password" (funktionalitet senere).
Signup side: Brug Card, Input (for username, email, password, confirm password, invite code), Button (for signup), link til login.
F2.2.3: Klargør til Firebase Autentificering (UI-del):
Design UI med tanke på, at Firebase SDK vil håndtere selve auth-logikken i Fase 3.
Overvej plads til fejlmeddelelser.
Valgfrit: Overvej FirebaseUI-biblioteket hvis en pre-built UI ønskes, ellers fortsæt med custom UI der kalder Firebase SDK funktioner. (Planen peger mod custom UI).
F2.3: [ ] Brugerprofil Side (app/profile/page.tsx)
F2.3.1: Opret Route og Grundlæggende Sidestruktur:
Opret app/profile/page.tsx.
Brug DashboardLayout (fra Fase 0).
F2.3.2: Vis Brugerinformation (Statisk/Mock Data):
Brug Shadcn Avatar for profilbillede.
Brug Shadcn Card eller DescriptionList (custom komponent) til at vise mock-data: brugernavn, email, rolle, saldo, registreringsdato, level, XP, post count.
F2.3.3: Design Sektioner (Statisk/Mock Data):
Indstillinger:
Faner (Shadcn Tabs) for "Generelt" (f.eks. tema), "Notifikationer", "Privatliv".
Vis mock input-felter/switches for indstillingerne (f.eks. about_me textarea, theme select, notifications_enabled switch).
Historik (tomme tabeller/lister for nu):
Faner for "Aktiedyst Transaktioner", "Forum Aktivitet".
Brug Shadcn Table til at vise kolonneoverskrifter, men med besked om "Ingen data" eller mock rækker.
F2.4: [ ] Live Sports - Oversigt Side (app/live-sports/page.tsx)
UI Inspiration: Bet365/FlashScore (data-tæt, klar, nem navigation).
F2.4.1: Opret Route og Grundlæggende Sidestruktur:
Opret app/live-sports/page.tsx.
Brug DashboardLayout.
F2.4.2: Sport/Liga Navigation (Statisk/Mock Data):
Brug Shadcn Tabs eller en custom SegmentedControl for at vælge sport (f.eks. Fodbold, Basketball).
Under valgt sport, vis en liste/dropdown af ligaer (mock data).
F2.4.3: Kamp-liste Visning (Statisk/Mock Data):
Brug Shadcn Table til at vise en liste af kampe for den "valgte" sport/liga.
Opret LiveMatchRow komponent (components/features/sports/LiveMatchRow.tsx):
Skal modtage mock kamp-data som props.
Viser: Hjemmehold (navn, logo), Udehold (navn, logo), Score, Kamp-tid/status (f.eks. "65'", "HT", "FT", "14:00"), eventuelt live-indikator.
Brug Shadcn Badge for status.
Gør rækken klikbar (navigation til kampdetalje-side i Fase 5).
F2.4.4: Filter/Sorterings-UI (Statisk):
Design UI-elementer for filtrering (f.eks. efter dato, live/kommende/færdige kampe - Shadcn Select eller RadioGroup).
Design UI for sortering (f.eks. efter tid, liga - Shadcn Button med ikon).
Bemærkning: Funktionalitet implementeres i Fase 3.
F2.5: [ ] Aktiedyst - Dashboard Side (app/aktiedyst/page.tsx)
UI Inspiration: Nordnet/TradingView (overskueligt, finansielt dashboard-look).
F2.5.1: Opret Route og Grundlæggende Sidestruktur:
Opret app/aktiedyst/page.tsx.
Brug DashboardLayout.
F2.5.2: Vis Nøgletal (Statisk/Mock Data):
Række af Shadcn Card komponenter øverst for at vise: Total porteføljeværdi, Cash balance, Dagens PNL, Samlet PNL (alle med mock data).
F2.5.3: Vis Portefølje (Statisk/Mock Data):
Brug Shadcn Table til at vise brugerens aktiebeholdning.
Opret PortfolioHoldingRow komponent (components/features/aktiedyst/PortfolioHoldingRow.tsx):
Props: Mock beholdningsdata (symbol, firmanavn, antal, gennemsnitskøbspris, nuværende pris, markedsværdi, PNL).
Viser data i tabelrække.
F2.5.4: Statisk Aktiegraf Komponent (components/features/aktiedyst/StockChart.tsx):
Brug Recharts til at vise en simpel linjegraf med mock historiske kursdata for en fiktiv aktie.
Titel for grafen.
F2.5.5: Design "Handels-Widget" (Statisk):
En Shadcn Button "Handl" eller "Ny Ordre".
Ved klik (ingen logik endnu), vis en Shadcn Dialog.
Dialog indeholder: Input for symbol, Select for Køb/Salg, Input for antal, Select for ordretype (Market), Button for "Placer Ordre". Alt med mock værdier eller placeholders.
F2.6: [ ] Forum - Oversigt Side (app/forum/page.tsx)
F2.6.1: Opret Route og Grundlæggende Sidestruktur:
Opret app/forum/page.tsx.
Brug DashboardLayout.
F2.6.2: Vis Forum-kategorier (Statisk/Mock Data):
Brug en liste af Shadcn Card komponenter eller en custom liste til at vise kategorier.
Opret ForumCategoryCard komponent (components/features/forum/ForumCategoryCard.tsx):
Props: Mock kategoridata (navn, beskrivelse, ikon, antal tråde/posts, seneste aktivitet).
Viser data pænt. Gør kortet klikbart (ingen logik endnu).
F2.6.3: Vis Liste af Tråde for en "Valgt" Kategori (Statisk/Mock Data):
Under kategorilisten (eller på en separat side app/forum/[categoryId]/page.tsx - besluttes nu), vis en Shadcn Table.
Opret ForumThreadRow komponent (components/features/forum/ForumThreadRow.tsx):
Props: Mock trådata (titel, forfatter, antal svar, visninger, seneste svar-tidspunkt).
Viser data i tabelrække. Titel er et link (ingen navigation endnu).
F2.7: [ ] Identificer & Genopbyg Genbrugelige UI-Elementer fra Eksisterende Projekt
F2.7.1: Analyse af Gammelt HTML/CSS:
Gennemgå det gamle projekt for gennemgående UI-mønstre (specifikke knap-designs, kort-layouts, informationsbokse, etc.), der ikke direkte dækkes af Shadcn, men som ønskes bibeholdt/moderniseret.
F2.7.2: Implementer som Custom Komponenter:
Byg disse elementer som nye React/Tailwind komponenter.
Placer dem i apps/frontend/src/components/common/ (for generiske) eller components/features/... (hvis feature-specifikke).
Overvej om nogle er så generiske, at de kunne blive custom Shadcn-komponenter ved at følge deres mønster (bygge ovenpå Radix, CLI-integration), eller blot rene React-komponenter.
F2.8: [ ] (Stærkt Anbefalet) Opsæt Storybook (i apps/frontend/)
F2.8.1: Initialiser Storybook:
Kør npx storybook@latest init i apps/frontend/.
Følg opsætningsvejledningen. Sørg for korrekt konfiguration ift. Next.js, Tailwind, TypeScript.
F2.8.2: Opret Stories for Nøglekomponenter:
Start med at oprette stories for de nye genbrugelige komponenter fra F2.7.
Opret stories for udvalgte Shadcn-komponenter som de er konfigureret/brugt i projektet.
Opret stories for feature-specifikke komponenter som LiveMatchRow, PortfolioHoldingRow.
Rationale: Isoleret udvikling, visuel test, dokumentation af UI-komponentbiblioteket, nemmere UI-review.
Fase 3: Frontend Data Integration & Firebase Autentificering (apps/frontend/)
Mål: At bringe de statiske UI-komponenter fra Fase 2 til live ved at:

Integrere med Firebase Authentication for login/signup.
Forbinde frontend til backend API'erne for at hente og vise rigtige data via TanStack Query.
Implementere formularlogik for brugerinteraktioner (f.eks. afgivelse af aktieordrer).
Status: Ikke påbegyndt.
F3.1: [ ] Opsæt TanStack Query (React Query) Provider & API Klient
F3.1.1: Opret QueryClient:
I apps/frontend/src/lib/react-query.ts (eller lignende), opret en QueryClient instans med globale standardindstillinger (f.eks. staleTime, gcTime).
F3.1.2: Opret Providers Komponent:
Opret apps/frontend/src/app/providers.tsx.
Denne komponent skal wrappe applikationen med <QueryClientProvider client={queryClient}>.
Inkluder også ReactQueryDevtools for udviklingsmiljøet.
F3.1.3: Wrap Applikationen:
Importer og brug Providers komponenten i apps/frontend/src/app/layout.tsx til at wrappe {children}.
F3.1.4: Opret API Klient (lib/apiClient.ts):
Opret en centraliseret funktion (eller klasse) til at foretage API-kald til Flask-backend.
Skal håndtere:
Tilføjelse af Content-Type: application/json og Accept: application/json headers.
Automatisk tilføjelse af Firebase ID token til Authorization: Bearer <token> headeren (se F3.2.5).
Grundlæggende fejlhåndtering (f.eks. parsing af JSON-fejl fra backend, håndtering af netværksfejl).
Returnere parsed JSON data eller kaste en struktureret fejl.
F3.2: [ ] Implementer Firebase Autentificering Flow
F3.2.1: Integrer Firebase SDK Auth Funktioner:
I Login/Signup siderne (app/(auth)/...), brug Firebase SDK funktioner fra firebase/auth (initialiseret i lib/firebase.ts):
signInWithEmailAndPassword (Login side).
createUserWithEmailAndPassword (Signup side).
signOut (til en "Log ud" knap i Header/Brugermenu).
Overvej sendPasswordResetEmail (for "Glemt Password" flow).
F3.2.2: Formularvalidering med React Hook Form & Zod:
Integrer react-hook-form og zod på Login/Signup formularerne for inputvalidering (f.eks. gyldig email, password styrke, match mellem password og confirm password, påkrævet invite code).
F3.2.3: Global Auth State med Zustand (store/authStore.ts):
Opret en Zustand store til at holde styr på:
user: firebase.User | null (Firebase user object).
isLoading: boolean (status for auth-processer).
error: string | null (auth-fejlmeddelelser).
localUserProfile: UserProfile | null (brugerens profil fra backend, se F3.2.7).
Brug onAuthStateChanged (fra firebase/auth) i en useEffect i en global layout-komponent (f.eks. DashboardLayout eller en specifik auth-lytter-komponent) til at lytte efter ændringer i brugerens auth-status.
Opdater Zustand store'en baseret på onAuthStateChanged events (login, logout).
Bemærkning: Firebase SDK håndterer typisk automatisk refresh af ID tokens.
F3.2.4: Gør Auth State Tilgængelig via Custom Hook (hooks/useAuth.ts):
Opret en custom hook useAuth der returnerer data fra authStore (f.eks. isAuthenticated, currentUser, isLoading).
F3.2.5: Send Firebase ID Token med API Kald:
I lib/apiClient.ts (fra F3.1.4), hent det aktuelle Firebase ID token (await firebase.auth().currentUser?.getIdToken()) og inkluder det i Authorization headeren for alle kald til Flask-backend.
F3.2.6: Sidebeskyttelse (Protected Routes):
Implementer en mekanisme til at beskytte sider, der kræver login (f.eks. Profil, Aktiedyst Dashboard).
Metode 1 (Client-side redirect): I de beskyttede siders komponenter, brug useAuth hook'en. Hvis brugeren ikke er logget ind og loading er færdig, redirect til /login (brug useRouter fra next/navigation). Vis evt. en loader imens.
Metode 2 (Next.js Middleware - middleware.ts i roden af app eller src): Kan bruges til at tjekke auth-status (f.eks. via en cookie sat af Firebase eller ved at validere token server-side via en auth-service) og redirecte før siden renderes. Dette kan være mere komplekst at sætte op med client-side Firebase Auth.
Metode 3 (Layout Check): I et layout, der gælder for beskyttede routes, tjek auth status og render enten children eller en "Unauthorized" besked / redirect.
Valg: Start med Metode 1 for simplicitet.
F3.2.7: Synkroniser/Hent Lokal Brugerprofil efter Firebase Login:
Efter succesfuld Firebase login/signup (og onAuthStateChanged har fyret):
Kald backend POST /api/v1/auth/register_or_sync_firebase_user for at sikre lokal brugerprofil er oprettet/synkroniseret. Denne returnerer nu ikke lokale JWTs.
Kald backend GET /api/v1/users/me/profile (med Firebase ID token) for at hente den fulde lokale brugerprofil.
Gem denne profil i authStore (se F3.2.3).
F3.3: [ ] Hent Data til Live Sports (med TanStack Query)
F3.3.1: Liste af Sportsgrene/Ligaer:
I app/live-sports/page.tsx (eller en underkomponent), brug useQuery til at hente data fra /api/v1/sports.
queryKey: f.eks. ['sports'].
queryFn: Kald til apiClient.get('/sports').
Brug de hentede data til at populere Tabs/dropdowns for sport/liga-valg (fra F2.4.2).
F3.3.2: Liste af Kampe:
Brug useQuery til at hente kamp-liste fra /api/v1/sports/{sportId}/matches (eller det nye /api/v1/matches?sportId=...&status=... hvis det er det nye mønster).
queryKey: Skal være dynamisk og inkludere filtre som sportId, leagueId, date, status. F.eks. ['matches', sportId, leagueId, date, status].
queryFn: Kald til apiClient med de korrekte query parametre.
Brug de hentede data til at populere LiveMatchRow komponenter i tabellen (fra F2.4.3).
F3.3.3: Loading & Error States:
Brug isLoading, isError, error fra useQuery resultatet.
Vis Shadcn Skeleton komponenter mens data hentes.
Vis en passende fejlmeddelelse (f.eks. fra error.message eller en generisk) hvis API-kald fejler.
F3.4: [ ] Hent Data & Implementer Interaktioner for Aktiedyst (med TanStack Query)
F3.4.1: Portefølje, Transaktioner, Markeder, Historik:
For app/aktiedyst/page.tsx og relaterede komponenter:
useQuery for /api/v1/aktiedyst/portfolio (queryKey: ['aktiedystPortfolio']).
useQuery for /api/v1/aktiedyst/transactions (queryKey: ['aktiedystTransactions', filters]).
useQuery for /api/v1/aktiedyst/markets (queryKey: ['aktiedystMarkets', filters]).
useQuery for /api/v1/aktiedyst/markets/{symbol}/history (f.eks. når en aktie vælges til grafen, queryKey: ['aktiedystMarketHistory', symbol, period]).
F3.4.2: Opdater StockChart Komponent:
StockChart.tsx (fra F2.5.4) skal nu acceptere data som prop og rendre den dynamisk.
F3.4.3: Implementer Handelsformular (Order Submission):
I "Handels-Widget" Dialog (fra F2.5.5):
Brug react-hook-form + zod for validering af ordre-input.
Brug useMutation (fra TanStack Query) til at sende ordren til POST /api/v1/aktiedyst/orders.
mutationFn: Kald til apiClient.post('/aktiedyst/orders', orderData).
onSuccess:
Vis succesnotifikation (se F3.6).
Invalider relevante queries for at genopfriske data (f.eks. queryClient.invalidateQueries({ queryKey: ['aktiedystPortfolio'] }), queryClient.invalidateQueries({ queryKey: ['aktiedystTransactions'] })).
Luk dialogen.
onError: Vis fejlnotifikation.
F3.5: [ ] Hent Data til Forum & Andre Sider (med TanStack Query)
F3.5.1: Forum Kategorier & Tråde:
I app/forum/page.tsx (eller relevante underkomponenter/sider):
useQuery for /api/v1/forum/categories.
useQuery for /api/v1/forum/categories/{categoryId}/threads (dynamisk queryKey).
Til Fase 5: useQuery for /api/v1/forum/threads/{threadId}/posts.
F3.5.2: Brugerprofil Data:
I app/profile/page.tsx: Brugerens data er allerede i authStore (hentet i F3.2.7). useQuery kan bruges her hvis der er profil-dele, der skal genhentes specifikt eller hvis data ikke skal være i global auth state. Ellers kan data tages direkte fra useAuth().localUserProfile.
For PUT /api/v1/users/me/profile, brug useMutation når brugeren opdaterer sin profil. Invalider profildata ved succes.
Overvejelse fra planen: "...eller direkte fra Firebase Firestore hvis dele er flyttet dertil." Dette er primært relevant for Fase 6. Indtil da hentes data fra Flask API'er.
F3.6: [ ] API Error Handling & Notifikationer
F3.6.1: Centraliseret Notifikationssystem:
Brug Sonner (Shadcn's anbefalede toast-bibliotek, installeret i Fase 0).
Wrap applikationen med Sonner's <Toaster /> komponent (typisk i layout.tsx eller providers.tsx).
F3.6.2: Vis Notifikationer:
I apiClient.ts eller direkte i useQuery/useMutation's onError callbacks: Kald toast.error('Fejlbesked').
I useMutation's onSuccess callbacks: Kald toast.success('Handlingen lykkedes!').
Vis informative fejlmeddelelser til brugeren, evt. baseret på fejltype eller statuskode fra backend.
Fase 4: Real-time Implementering (apps/frontend/ & apps/backend/)
Mål: At integrere live-opdateringer fra backend (Flask-SocketIO, og potentielt Firebase Realtime services) ind i frontend for en dynamisk og øjeblikkelig brugeroplevelse, især for sportsresultater og aktiekurser.
Status: Backend-forberedelse er lavet (F1.7). Frontend-integration er ikke påbegyndt.

F4.1: [ ] Etabler WebSocket Forbindelse til Flask-SocketIO (Frontend)
F4.1.1: Opret Custom Hook hooks/useSocket.ts:
Denne hook skal initialisere socket.io-client.
Håndter socket instansen (opret én gang, gem i ref eller state).
Initialiser socket med URL til Flask-backend (fra miljøvariabel NEXT_PUBLIC_SOCKET_URL).
F4.1.2: Socket.IO Autentificering:
Når brugeren er logget ind (Firebase auth state er klar):
Hent Firebase ID token.
Etabler Socket.IO forbindelse og send token'et som en query parameter (f.eks. query: { token: firebaseIdToken }) under connect-eventet, som backend forventer (F1.7.2).
Hook'en skal håndtere re-connects og sikre, at token er vedhæftet.
F4.1.3: Håndter Standard Socket Events:
Opsæt listeners for connect, disconnect, connect_error.
Log disse events for debugging.
Opdater evt. en global state (Zustand store, socketStore.ts?) med forbindelsesstatus.
F4.1.4: Gør Socket-instansen og Events Tilgængelig:
useSocket hook'en kan returnere socket-instansen.
Alternativt: Brug React Context til at give socket-instansen globalt.
Eller: useSocket kan eksponere funktioner til at abonnere (socket.on) og afsende (socket.emit) events.
F4.2: [ ] Live Sports Opdateringer (Frontend)
F4.2.1: Abonner på Specifikke Kamp-Events:
Når en bruger ser på en liste af live kampe eller en specifik kampdetalje-side:
Brug socket.emit('subscribe_to_match_scores', { match_ids: [...] }) for at joine relevante rooms på backend (f.eks. match_{matchId}). Backend skal håndtere dette (formodentlig refaktorering af handle_subscribe_to_live_scores til at tage en liste).
Sørg for at socket.emit('unsubscribe_from_match_scores', { match_ids: [...] }) kaldes når komponenten unmountes eller brugeren navigerer væk.
F4.2.2: Lyt til live_score_update Event:
Opsæt en listener socket.on('live_score_update', (data) => { ... }).
F4.2.3: Opdater UI med Nye Data:
Når live_score_update modtages:
Brug queryClient.setQueryData(['matches', ...], updatedMatchData) eller queryClient.setQueryData(['matchDetails', matchId], updatedMatchData) til at opdatere den relevante cache i TanStack Query.
Dette vil automatisk re-rendre de komponenter, der bruger disse query keys.
Undgå direkte state-manipulation, hvis data styres af TanStack Query.
F4.2.4: Visuelle Effekter (Framer Motion):
Overvej subtile animationer/fremhævninger når en score opdateres (f.eks. kortvarig baggrundsfarveændring på den opdaterede række/score).
F4.3: [ ] Aktiedyst Opdateringer (Frontend - Real-time priser hvis relevant)
F4.3.1: Abonner på Marked/Symbol Events:
Tilsvarende Live Sports: Når brugeren ser på markedslisten eller en specifik aktieside:
socket.emit('subscribe_to_market_data', { symbols: [...] }) (backend room: aktiedyst_market_{symbol}).
Husk unsubscribe.
F4.3.2: Lyt til stock_price_update Event:
Opsæt socket.on('stock_price_update', (data) => { ... }).
F4.3.3: Opdater UI med Nye Prisdata:
Brug queryClient.setQueryData til at opdatere cachen for markedslisten, porteføljen (hvis den viser realtidspriser), og den aktive aktiegraf.
F4.4: [ ] Real-time Notifikationer (Frontend)
F4.4.1: Backend Udsendelse (Flask/Socket.IO eller Firebase):
Backend (F1.7.1/F1.7.2) skal kunne udsende generiske notifikationsevents (f.eks. new_user_notification, new_forum_reply, order_filled_notification) til specifikke brugere (user_{firebaseUserId} room).
F4.4.2: Frontend Lytter efter Notifikationer:
I useSocket (eller en global komponent), lyt til et generelt notifikationsevent, f.eks. socket.on('user_notification', (notificationData) => { ... }).
F4.4.3: Vis Notifikationer:
Brug Sonner (toast-biblioteket) til at vise notifikationen for brugeren.
Overvej et notifikationscenter/ikon i headeren for ulæste notifikationer.
F4.5: [ ] Performance Optimering for Real-time (Frontend & Backend)
Frontend:
React.memo: Brug React.memo på komponenter, der modtager hyppige prop-opdateringer (som LiveMatchRow), for at undgå unødvendige re-renders, hvis props reelt ikke har ændret sig.
Selektiv Rendering: Sørg for at kun de dele af UI'en, der er påvirket af realtidsdata, re-renderes.
Effektiv State Management: Undgå at opdatere store dele af global state unødvendigt. TanStack Query's cache-opdateringer er generelt effektive.
Backend:
Send Kun Ændrede Data: Når en Socket.IO event udsendes, send kun de data, der reelt er ændret, for at minimere payload-størrelse.
Effektiv Room Management: Sørg for, at brugere kun er i de rooms, de har brug for.
Asynkron Event Udsendelse: Hvis event-generering er tidskrævende, overvej at køre det asynkront (f.eks. med Celery eller lignende), så det ikke blokerer hoved-request-tråden.
Generelt:
Test med mange samtidige forbindelser/events for at identificere flaskehalse.
Fase 5: Avancerede Features & UI/UX Polishing (apps/frontend/ & apps/backend/)
Mål: At implementere mere komplekse funktioner, der bygger ovenpå kernefunktionaliteten, samt at forfine den samlede brugeroplevelse med fokus på detaljer, animationer, responsivitet og tilgængelighed.
Status: Nogle backend-dele (Admin API) er noteret som ikke påbegyndt. Frontend er ikke påbegyndt.

F5.1: [ ] Backend: Udvikling af Admin API
Status fra projektplan (snippet): Ikke påbegyndt.
F5.1.1: Definition af Scope for Admin Funktionaliteter:
Hvilke aspekter af applikationen skal administratorer kunne styre? (Brugerstyring, content moderation i forum, sportsdata management, aktiedyst-konfigurationer etc.)
Udarbejd en liste over specifikke admin-actions.
F5.1.2: Design Admin API Endpoints:
Definer URL-struktur (f.eks. /api/v1/admin/...).
Specificer request/response JSON-strukturer for hver admin-action.
API'et skal være strengt beskyttet (kræver admin-rolle, verificeret via Firebase custom claims eller lokal DB-rolle).
F5.1.3: Implementer Admin API Endpoints i Flask (apps/backend/routes/api_admin.py):
Opret ny blueprint.
Implementer logik for hver admin-funktion, inkl. databaseinteraktioner.
Sørg for grundig logning af alle admin-actions.
F5.1.4: Test Admin API Grundigt.
Bemærkning: Selve Admin UI'et udvikles som en del af frontend (måske i en separat app/admin route group).
F5.2: [ ] Frontend: Avancerede Aktiedyst Features
F5.2.1: Udvidet StockChart Komponent:
Tilføj mulighed for at vælge forskellige graf-typer (linje, candlestick) i StockChart.tsx.
Implementer tekniske indikatorer (f.eks. Moving Averages, RSI - Recharts understøtter custom elementer).
Tilføj zoom/pan funktionalitet til grafen.
Kræver: Potentielt mere detaljerede data fra backend API eller client-side beregninger.
F5.2.2: Avancerede Ordretyper:
Udvid handels-widget/dialog (fra F2.5.5 og F3.4.3) til at understøtte "Limit" og "Stop" ordretyper.
Tilføj inputfelter for limit pris / stop pris.
Kræver: Backend POST /api/v1/aktiedyst/orders (F1.5.5) skal kunne håndtere disse ordretyper.
F5.2.3: Watchlist Funktionalitet:
Design UI for at brugere kan tilføje/fjerne aktier til/fra en personlig watchlist.
Vis watchlist et passende sted (f.eks. sidebar, separat fane på Aktiedyst dashboard).
Kræver:
Backend API endpoints til at håndtere watchlists (f.eks. GET /users/me/watchlist, POST /users/me/watchlist/{symbol}, DELETE /users/me/watchlist/{symbol}). Disse er nye og skal designes/implementeres.
DB-model for watchlists.
F5.3: [ ] Frontend: Avancerede Live Sports Features
F5.3.1: Detaljeret Kampvisningsside (app/live-sports/[matchId]/page.tsx):
Opret dynamisk route for individuelle kampe.
Hent detaljerede kampdata fra GET /api/v1/matches/{matchId} (backend F1.4).
Vis omfattende information: score, tid, events (mål, kort - med ikoner), lineups, statistik (boldbesiddelse, skud etc.), H2H (head-to-head), spillested.
UI-design inspireret af FlashScore/Bet365 detaljesider.
F5.3.2: Favoritmarkering af Kampe/Ligaer:
Tillad brugere at markere kampe eller ligaer som favoritter.
Vis favoritter prominent eller i en separat sektion.
Kræver:
Backend API endpoints til at håndtere favoritter (svarende til watchlist).
DB-model for brugerfavoritter (kampe/ligaer).
F5.4: [ ] Frontend & Backend: Forum Implementering (Fuld CRUD)
Backend status: GET/POST for posts er lavet. CRUD for tråde og posts er også lavet iflg. changelog.
Backend API: Fuld CRUD for Forum Tråde og Posts er implementeret (Se F1.6 og CHANGELOG for Maj 19: Forum API CRUD Operations Completed).
POST /api/v1/forum/categories/{categoryId}/threads (Opret Tråd)
PUT /api/v1/forum/threads/{threadId} (Opdater Tråd)
DELETE /api/v1/forum/threads/{threadId} (Slet Tråd)
POST /api/v1/forum/threads/{threadId}/posts (Opret Post - allerede lavet i Fase 1)
PUT /api/v1/forum/threads/{threadId}/posts/{postId} (Opdater Post)
DELETE /api/v1/forum/threads/{threadId}/posts/{postId} (Slet Post)
Frontend Integration:
F5.4.1: Opret Ny Tråd Side/Modal:
UI med formular (titel, brødtekst - evt. Markdown editor).
Brug useMutation til POST /api/v1/forum/categories/{categoryId}/threads.
Invalider relevante trådliste-queries ved succes.
F5.4.2: Skriv Svar/Post (i Tråd-visning):
UI med formular for brødtekst i bunden af post-listen.
Brug useMutation til POST /api/v1/forum/threads/{threadId}/posts.
Invalider/opdater post-listen ved succes.
F5.4.3: Redigering/Sletning af Tråde/Posts (hvis tilladt for brugeren):
Tilføj UI-elementer (f.eks. dropdown-menu per post/tråd) for rediger/slet.
Vis kun for ejer eller moderator.
Brug useMutation for PUT/DELETE kaldene.
Invalider/opdater lister ved succes.
Overvejelse: Skal forumdata (specielt posts) flyttes til Firebase RTDB/Firestore for bedre realtidsoplevelse (se Fase 6)? Hvis ja, skal disse useMutation-kald ændres til at skrive direkte til Firebase.
F5.5: [ ] Animationer & Overgange (Framer Motion & evt. Anime.js)
F5.5.1: Identificer Steder for Forbedret UX med Animation:
Sideovergange (subtile fades eller slides).
Modal-animationer (åbning/lukning af dialogs).
Hover-effekter på interaktive elementer.
Animerede loaders/skeletons for en mere flydende oplevelse.
Listeelementer, der animeres ind (f.eks. nye forum-posts).
F5.5.2: Implementer med Framer Motion:
Brug motion komponenter, animate prop, variants, whileHover, AnimatePresence.
F5.5.3: Vurder Behov for Anime.js:
Hvis der er meget specifikke, komplekse sekventielle eller timeline-baserede animationer, som er svære at opnå elegant med Framer Motion, overvej at bruge Anime.js til disse isolerede tilfælde. (Som originalt noteret: dette er "efter behov").
F5.6: [ ] Responsivt Design Finpudsning
F5.6.1: Grundig Test på Forskellige Skærmstørrelser:
Mobil (små, mellem, store).
Tablet (portræt, landskab).
Desktop (forskellige bredder).
F5.6.2: Juster Tailwind Breakpoints & Utility Klasser:
Brug Tailwind's responsive prefixes (sm:, md:, lg:, xl:) til at justere layout, størrelser, synlighed etc.
Sørg for at interaktive elementer er lette at bruge på touch-skærme.
Test font-størrelser og læsbarhed.
F5.7: [ ] Tilgængelighed (a11y) Review & Forbedringer
F5.7.1: Semantisk HTML:
Sørg for korrekt brug af HTML5 elementer (<nav>, <main>, <article>, <aside>, etc.).
F5.7.2: Tastaturnavigation:
Test at hele applikationen kan navigeres og interageres med KUN ved brug af tastatur.
Sørg for synlige :focus outlines (Tailwind tilbyder focus-visible).
F5.7.3: ARIA-Attributter:
Brug ARIA-attributter hvor nødvendigt for at forbedre semantikken for skærmlæsere (Shadcn/ui komponenter baseret på Radix UI er generelt gode her, men custom komponenter skal tjekkes).
F.eks. aria-label, aria-describedby, role.
F5.7.4: Test med a11y Værktøjer:
Brug browserudvidelser som axe DevTools, Lighthouse, eller WAVE.
F5.7.5: Farvekontrast: Sørg for tilstrækkelig kontrast mellem tekst og baggrund.
F5.8: [ ] Dark Mode (Valgfrit, men anbefalet for moderne UX)
F5.8.1: Implementer Tema-skift med next-themes:
Installer next-themes.
Wrap applikationen med ThemeProvider (fra next-themes).
Opret en UI-knap/switch til at skifte mellem 'light', 'dark', 'system' temaer.
F5.8.2: Brug Tailwind's dark: Variant:
I tailwind.config.js, aktiver darkMode: 'class'.
Brug dark: prefix for at style komponenter forskelligt i dark mode (f.eks. bg-white dark:bg-gray-800).
Sørg for at alle komponenter, inkl. Shadcn og custom, respekterer dark mode.
Fase 6: Yderligere Firebase Integration (Udvidelsesmuligheder)
Mål: At udnytte Firebase's økosystem yderligere for at forbedre specifikke funktionaliteter, øge skalerbarheden eller forenkle udviklingsprocesser for visse features.
Status: Ikke påbegyndt.

F6.1: [ ] Firestore/Realtime Database (RTDB) for Specifikke Features
Rationale: Firebase databaser (især RTDB for ultra-low latency, Firestore for komplekse queries/skalering) er gode til features, der kræver intens realtidsinteraktion eller ikke passer godt ind i den relationelle model.
F6.1.1: Overvej Feature Kandidater:
Chat-funktionalitet: RTDB er klassisk for chat-beskeder.
Realtids Forum-kommentarer/visninger: I stedet for kun Socket.IO push, kan nye kommentarer skrives direkte til RTDB/Firestore og lyttes på af klienter.
Komplekse Brugerindstillinger: Ting der ikke er simple key-value pairs.
Activity Feeds: "X har svaret på din tråd", "Y har købt Z aktie".
Notifikationssystem (data-del): Selve notifikationsdataene kan ligge i Firestore, mens Socket.IO bruges til at "puffe" klienten om en ny notifikation.
F6.1.2: Implementer en Valgt Feature med Firebase DB:
Vælg én af ovenstående (eller en anden) og implementer den.
Dette indebærer:
Frontend skriver/læser direkte til/fra Firebase DB (brug Firebase JS SDK).
Frontend lytter til realtidsopdateringer fra Firebase DB.
F6.1.3: Opsæt Firebase Sikkerhedsregler:
Definer og implementer robuste sikkerhedsregler for den valgte Firebase database (RTDB eller Firestore) for at sikre, at brugere kun kan læse/skrive de data, de har tilladelse til.
Test reglerne grundigt med Firebase Simulatoren.
F6.2: [ ] Firebase Storage for Filuploads
F6.2.1: Identificer Anvendelsesområder:
Bruger-uploadede profilbilleder (avatars).
Vedhæftede filer i forum-posts (billeder, dokumenter).
F6.2.2: Frontend Integration:
Brug Firebase JS SDK (firebase/storage) til at håndtere filuploads fra klienten.
Vis upload progress.
Håndter fejl.
F6.2.3: Backend Integration (hvis nødvendigt):
Gem referencen (URL eller path) til den uploadede fil i din primære Flask-database (f.eks. avatar_url på User modellen).
Valider uploads server-side, hvis muligt/nødvendigt (f.eks. via Firebase Functions).
F6.2.4: Opsæt Firebase Storage Sikkerhedsregler:
Definer regler for hvem der må uploade, hvilke filtyper/størrelser, og hvem der må læse filer.
F6.3: [ ] Firebase Functions (Cloud Functions)
Rationale: Serverless backend-logik, der kan trigges af Firebase-events (f.eks. DB-skrivning, Storage-upload) eller HTTP-requests. Kan skrives i Node.js, Python, etc.
F6.3.1: Identificer Brugsscenarier:
Billedbehandling: Når et profilbillede uploades til Storage, kan en Function automatisk resizes/komprimere det.
Sende Notifikationer: Når en vigtig post oprettes i Firestore (f.eks. et nyt forum-svar til en fulgt tråd), kan en Function sende en push-notifikation eller email.
Dataintegritet/Sanitering: Køre logik efter data er skrevet til DB.
Webhook Handlers: Håndtere indgående webhooks fra tredjeparts services.
Periodiske Opgaver: Planlagte funktioner (cron jobs) f.eks. til oprydning eller generering af rapporter.
F6.3.2: Implementer en Valgt Firebase Function:
Vælg et scenarie, skriv Function-koden (vælg sprog, f.eks. Node.js for tæt JavaScript økosystem-integration eller Python hvis logikken deles med backend).
Deploy Function'en til Firebase.
Test grundigt.
F6.4: [ ] Firebase Hosting for Next.js Frontend (Vurdering)
Status: Vercel er primær overvejelse for Next.js.
F6.4.1: Evaluer Fordele/Ulemper ved Firebase Hosting vs. Vercel:
Vercel Fordele: Bygget af skaberne af Next.js, optimal performance, excellent DX, serverless functions, image optimization, analytics, nem integration med GitHub.
Firebase Hosting Fordele: Meget tæt integration med andre Firebase services, global CDN, nem opsætning hvis man allerede er i Firebase økosystemet. Kan være billigere for simple sites.
F6.4.2: Beslutning & Eventuel Migration:
Baseret på evaluering, tag en endelig beslutning. Vercel er sandsynligvis stadig det stærkeste valg for et komplekst Next.js projekt, medmindre der er meget tung afhængighed af Firebase Functions til at rendere sider (hvilket Next.js typisk håndterer selv via Server Components/Route Handlers).
Fase 7: Testning & Deployment
Mål: At sikre applikationens kvalitet, stabilitet og performance gennem omfattende testning, samt at opsætte en automatiseret og pålidelig deployment pipeline for både frontend og backend.
Status: Basis test framework for frontend er opsat (F0.8). Backend-tests og CI/CD er ikke formelt specificeret/påbegyndt.

F7.1: [ ] Unit & Integration Tests
Frontend (apps/frontend/) - (Fortsættelse af F0.8):
Komponenttests (Jest & RTL): Skriv tests for alle UI-komponenter (især custom og feature-specifikke), der verificerer rendering baseret på props, brugerinteraktioner, og state-ændringer.
Hook Tests (Jest & RTL): Test custom React Hooks isoleret.
State Management Tests (Jest): Test Zustand stores (actions, selectors).
API Kald Mocking: Brug msw (Mock Service Worker) eller Jest's mocking-funktioner til at mocke API-kald og Firebase SDK-interaktioner.
Coverage Mål: Sæt et mål for testdækning (f.eks. >70-80%) og følg op.
Backend (apps/backend/) - (Skal opsættes):
F7.1.1: Opsæt PyTest Framework:
Installer PyTest og relevante plugins (f.eks. pytest-flask, pytest-cov).
Konfigurer pytest.ini eller pyproject.toml.
Route Tests: Test hver API endpoint for korrekte svar (statuskoder, JSON-struktur) baseret på forskellige inputs og auth-status. Brug Flask test client.
Logik Tests: Test forretningslogik i service-lag/utility-funktioner isoleret.
Database Interaktion Tests: Test databaseoperationer. Overvej test-database og fixtures for at sikre rene testtilstande.
Coverage Mål: Sæt mål for testdækning.
F7.2: [ ] End-to-End (E2E) Tests (apps/frontend/)
F7.2.1: Vælg og Opsæt E2E Værktøj:
Planen nævner Playwright (foretrukket) eller Cypress. Træf endeligt valg.
Installer og konfigurer værktøjet i apps/frontend/ eller monorepo-roden.
F7.2.2: Definer Kritiske Bruger-Flows:
Eksempler:
Bruger-registrering og login via Firebase.
Se sportskampe og navigere til en kampdetalje-side.
Købe/sælge en aktie i Aktiedyst.
Oprette en ny tråd og et svar i forum.
Opdatere brugerprofil.
F7.2.3: Skriv E2E Tests for Disse Flows:
Brug Page Object Model (POM) for vedligeholdelige tests.
Sørg for at tests er robuste overfor mindre UI-ændringer.
F7.3: [ ] Manuel Test & QA (Quality Assurance)
F7.3.1: Udarbejd Testplan/Checkliste for Manuel Test:
Dæk alle features og bruger-flows.
Inkluder test-scenarier for edge cases og fejlhåndtering.
F7.3.2: Gennemfør Test på Forskellige Browsere:
Chrome, Firefox, Safari, Edge (seneste versioner).
F7.3.3: Gennemfør Test på Forskellige Enheder/Skærmstørrelser:
Desktop, tablet, mobil (fysiske enheder og emulatorer/simulatorer).
F7.3.4: User Acceptance Testing (UAT):
Hvis muligt, få feedback fra potentielle brugere (eller teammedlemmer, der ikke har udviklet featuren).
F7.4: [ ] Performance Optimering
Frontend:
Bundle Analyse: Brug next-build-analyzer til at identificere store chunks i JavaScript-bundle.
Billedoptimering: Brug next/image konsekvent for optimerede billeder.
Dynamisk Import: Brug next/dynamic for komponenter, der ikke er nødvendige ved initial load (f.eks. store diagrambiblioteker, modals).
Code Splitting: Next.js håndterer meget af dette, men vær opmærksom.
React DevTools Profiler: Identificer performance flaskehalse i React-komponenter.
Listevirtualisering: For meget lange lister (f.eks. forum-posts, transaktioner), overvej biblioteker som react-window eller TanStack Virtual.
Memoization: Korrekt brug af React.memo, useMemo, useCallback.
Lighthouse / WebPageTest: Kør performance-tests regelmæssigt.
Backend:
Database Query Optimering: Analyser langsomme DB-forespørgsler (brug EXPLAIN). Optimer indekser. Undgå N+1 problemer.
Caching Strategier:
Implementer caching for data der ikke ændres ofte (f.eks. API-responses med Flask-Caching, eller Redis).
Overvej client-side caching (TanStack Query gør meget, men HTTP caching headers kan også hjælpe).
Load Testing: Brug værktøjer som k6, Locust, eller Apache JMeter til at teste backend API'ers performance under pres.
F7.5: [ ] Opsæt CI/CD Pipeline (Continuous Integration/Continuous Deployment)
F7.5.1: Vælg CI/CD Platform:
GitHub Actions er foreslået og passer godt til GitHub repositories.
F7.5.2: Konfigurer Workflows for Monorepo:
Separate Workflows: Opret separate workflows for frontend (apps/frontend) og backend (apps/backend).
Path Filtering: Workflows skal kun trigges, hvis der er ændringer i de relevante mapper (paths filter i GitHub Actions).
Frontend Workflow:
Checkout kode.
Opsæt Node.js.
Installer afhængigheder (npm ci).
Kør linting.
Kør unit/integration tests.
Kør E2E tests (evt. mod en staging/preview deployment).
Byg Next.js applikation (npm run build).
Deploy til Vercel (eller Firebase Hosting) for main branch pushes (produktion) og PRs (preview deployments).
Backend Workflow:
Checkout kode.
Opsæt Python.
Installer afhængigheder (pip install -r requirements.txt).
Kør linting.
Kør unit/integration tests (kræver evt. DB-service i CI-miljø).
Byg Docker image.
Push Docker image til et container registry (f.eks. Docker Hub, Google Container Registry, AWS ECR).
Deploy Docker image til valgt cloud platform (Cloud Run, App Runner) for main branch pushes.
F7.5.3: Håndter Hemmeligheder/Miljøvariabler i CI/CD:
Brug platformens (f.eks. GitHub Actions Secrets) indbyggede funktioner til sikker opbevaring af API-nøgler, database-credentials, Firebase service account.
F7.6: [ ] Konfigurer Miljøvariabler for Deployment Miljøer
Brug .env.local (i .gitignore) til lokal frontend udvikling.
Brug .env (i .gitignore) til lokal backend udvikling.
Produktion & Staging Miljøer:
Konfigurer miljøvariabler direkte i UI'en for hosting platformene:
Vercel (for frontend: NEXT_PUBLIC_ og server-side).
Firebase (for Functions, Hosting config).
Cloud Provider (Google Cloud Run, AWS App Runner) for backend container.
Sørg for at adskille NEXT_PUBLIC_ prefixede variabler (tilgængelige i browser) fra rene server-side variabler for Next.js.
Fase 8: Launch & Vedligeholdelse
Mål: At lancere den moderniserede Fattecentralen-applikation succesfuldt til brugerne og etablere robuste processer for løbende drift, overvågning og fremtidig forbedring.
Status: Ikke påbegyndt.

F8.1: [ ] Endelig Deployment til Produktion
F8.1.1: Pre-Launch Checklist:
Alle tests (unit, integration, E2E, manuel) er bestået.
Alle kritiske fejl er rettet.
Performance er acceptabel.
Sikkerhedsgennemgang er foretaget.
Produktionsmiljøvariabler er sat korrekt.
Database (produktion) er klar og evt. migreret/seeded.
DNS-ændringer (hvis relevant) er planlagt.
Rollback-plan er klar, hvis noget går galt.
F8.1.2: Udfør Produktionsdeployment:
Trigger CI/CD pipeline for main branch.
Monitorer deployment processen.
F8.1.3: Post-Launch Smoke Test:
Verificer kernefunktionaliteter i produktionsmiljøet manuelt.
F8.2: [ ] Monitorering & Logging
F8.2.1: Fejl-tracking:
Værktøj: Sentry er foreslået (godt valg for både frontend og backend).
Opsætning: Integrer Sentry SDK i frontend (Next.js) og backend (Flask).
Konfigurer source maps for bedre stack traces.
Opsæt alarmer for nye/hyppige fejl.
F8.2.2: Performance & Analytics:
Frontend:
Vercel Analytics (hvis Vercel bruges) - giver Core Web Vitals, trafik.
Google Analytics 4 (for brugeradfærd, custom events, funnels).
Backend:
Logging fra cloud provider (CloudWatch, Google Cloud Logging).
APM (Application Performance Monitoring) værktøj (f.eks. Sentry APM, Datadog, New Relic) hvis dybere performance-indsigt er nødvendig.
Firebase:
Firebase Performance Monitoring (hvis relevant, især for Firebase-tunge dele).
Firebase Analytics (for mobil-fokuserede metrics, hvis app'en udvides).
F8.2.3: Backend Logging:
Sørg for struktureret og tilstrækkelig logging i Flask-applikationen (requests, errors, vigtige events).
Send logs til en centraliseret log-management service (f.eks. den der følger med cloud provideren).
F8.3: [ ] Indsaml Feedback fra Brugere
F8.3.1: Etabler Feedback Kanaler:
In-app feedback formular.
Dedikeret email-adresse.
Forum-tråd specifikt for feedback.
Overvej værktøjer som Hotjar (heatmaps, session recordings, surveys) for dybere indsigt i brugeradfærd.
F8.3.2: Analyser Feedback Systematisk:
Log og kategoriser indkommen feedback.
Brug det som input til fremtidig udvikling.
F8.4: [ ] Iterér & Forbedr (Kontinuerlig Udvikling)
F8.4.1: Vedligehold Backlog:
Brug et issue tracking system (f.eks. GitHub Issues, Jira, Trello).
Prioriter nye features, forbedringer og bug fixes.
F8.4.2: Planlæg Sprints/Iterationer:
Arbejd i korte, fokuserede udviklingscyklusser.
F8.4.3: Regelmæssig Opdatering af Afhængigheder:
Brug værktøjer som npm outdated / pip list --outdated og Dependabot (GitHub) til at holde styr på og opdatere biblioteker for at lukke sikkerhedshuller og få nye features.
Test grundigt efter opdateringer.
F8.4.4: Dokumentation:
Hold denne projektplan (eller et lignende dokument) opdateret med status og ændringer.
Opdater API-dokumentation og in-code kommentarer løbende.
Tips til Brug af Planen & Kreativ Udfoldelse (Repeteret fra original - stadig relevant):

Iterativ Tilgang: Hver fase (og hver underopgave) kan og bør opdeles i endnu mindre, håndterbare bidder. Markér fremskridt løbende.
Fleksibilitet: Verden ændrer sig. Vær åben for at justere planen undervejs baseret på nye indsigter, teknologiske ændringer, eller feedback.
Eksperimenter: Med UI/UX (Shadcn/Tailwind), animationer (Framer Motion/Anime.js) for at matche Bet365/Nordnet-inspirationen og skabe en unik Fattecentralen-følelse.
HTML Transformation: En systematisk tilgang er nøglen. Bryd de gamle HTML-sider ned komponent for komponent. Start med de ydre layouts og arbejd dig indad. Overfør CSS-stilarter til Tailwind-klasser. Omskriv JavaScript-logik til React-hooks og event handlers.
Valg af Værktøjer: De valgte værktøjer er stærke, men hvis der opstår et specifikt behov, hvor et alternativt værktøj er markant bedre, vær åben for at revurdere.
AI som Sparringspartner: Bliv ved med at bruge mig (eller andre AI-værktøjer) til kodeeksempler, arkitekturdiskussioner, fejlfinding, eller til at brainstorme løsninger.
Dette dækker hele planen med den ønskede detaljeringsgrad. Det er blevet en meget omfattende plan, men det skulle give et solidt og detaljeret fundament for projektet. Husk, at dette er et levende dokument – opdater det, efterhånden som projektet skrider frem, og nye beslutninger træffes. Held og lykke!





----->
Version 4;

Fantastisk! Det er en god ide at forfine planen yderligere. En velstruktureret og detaljeret plan er guld værd, især i et projekt af denne størrelse. Jeg vil tage udgangspunkt i din nuværende plan (med dens [X] og [/] statusser) og forsøge at forbedre den i henhold til dine ønsker.

Målet er:

Mere håndterbare opgaver: Bryde større punkter ned i mindre, konkrete trin.
Større detaljegrad: Tilføje flere specifikationer og forventninger til hvert trin.
Bedre bemærkninger: Udførligere noter om hvorfor, potentielle udfordringer, tips, osv.
Klarere organisation og struktur: Sikre et logisk flow, konsistent formatering og god læsbarhed.
Lad os starte fra toppen og arbejde os nedad. Jeg vil forsøge at integrere relevant information fra din CHANGELOG.md hvor det giver mening for at afspejle den nuværende status og de beslutninger, der allerede er truffet.

Her er det første udkast til en forbedret version af de indledende sektioner og Fase 0. Jeg vil tilføje opgave-ID'er (fx F0.1) for nemmere reference.

Fattecentralen Projekt - Komplet Moderniseringsplan (Revideret & Detaljeret)

Overordnet Vision:
At transformere det nuværende Fattecentralen-projekt (HTML, JavaScript, Python, CSS) til en topmoderne, højtydende, skalerbar og engagerende webapplikation. Frontend moderniseres til en Single Page Application (SPA) bygget med Next.js, React, og TypeScript, med UI/UX inspiration fra førende platforme som Bet365/FlashScore (for Sport) og Nordnet/TradingView (for Aktiedyst). Backend, baseret på Python/Flask, bibeholdes for sin kerneforretningslogik men udvides, optimeres og integreres dybt med Firebase, især for autentificering, og potentielt for realtidsdata og andre skalerbare cloud-services. Hele projektet struktureres som et monorepo for optimal udviklingseffektivitet.

Overordnet Arkitektur Filosofi:

Monorepo (fattecentralen-monorepo):
Rationale: Centraliseret versionsstyring, nemmere deling af kode/typer (især mellem frontend og backend, hvor relevant, f.eks. via packages/), og forenklede build/deploy processer.
Struktur: apps/frontend, apps/backend, packages/ (for delt kode, f.eks. UI-komponenter, type-definitioner, fælles utility-funktioner).
Frontend (Next.js - apps/frontend):
Ansvar: Håndtering af al brugerinteraktion, datavisualisering, og klient-side logik.
Teknologi: Next.js App Router (for optimeret routing og server-side rendering), Server Components (for performance og SEO), Client Components (for interaktivitet).
Fokus: Systematisk omdannelse af eksisterende HTML-sider til genbrugelige, velstrukturerede React-komponenter med TypeScript for typesikkerhed.
Backend (Python/Flask - apps/backend):
Ansvar: Primært som en "headless" API-leverandør for Next.js frontend. Håndterer kerneforretningslogik (sportsdata, aktiedyst-mekanismer), databaseinteraktion (med den eksisterende primære database), og udsendelse af real-time events via WebSockets (Flask-SocketIO).
API Lag (RESTful - udstillet af Flask):
Design: Klare, konsistente, og veldokumenterede RESTful API'er.
Kommunikation: Next.js frontend kommunikerer med backend via standard fetch API eller dedikerede datahentningsbiblioteker som TanStack Query.
Specifikationer: JSON-strukturer for requests/responses vil blive defineret og vedligeholdt (som set i de senere sektioner af denne plan).
Autentificering (Firebase Authentication):
Primær mekanisme: Firebase vil håndtere brugeroprettelse, login (email/password, sociale logins), password reset, og token-udstedelse (ID Tokens).
Integration: Firebase ID tokens valideres af Flask-backend for at autentificere API-anmodninger. Lokal brugerdatabase synkroniseres med Firebase UIDs.
Overvejelse (fra Changelog & oprindelig plan): Lokal Flask JWT-generering er ved at blive udfaset til fordel for udelukkende at stole på Firebase ID Tokens for API-kald fra frontend. Dette strømliner autentificeringen. (Status: Arbejde på dette er i gang, traditionelle flows bibeholdes midlertidigt).
Real-time Kommunikation (Flask-SocketIO & evt. Firebase Realtime Services):
Primær mekanisme (Backend): Flask-SocketIO (apps/backend/sockets.py) bibeholdes og optimeres for live-opdateringer (sportsresultater, aktiekurser). Klare event-navne og datastrukturer, samt brug af rooms for målrettede events.
Klient-side: socket.io-client i frontend.
Sekundær/Suppl. (Firebase): Firebase Realtime Database eller Firestore kan overvejes til specifikke realtidsfeatures som chat, notifikationer, eller data der har gavn af Firebase's skalerbarhed og økosystem (f.eks. brug af Firebase Functions trigget af databaseændringer).
Styling (Tailwind CSS & Shadcn/ui):
Metode: Utility-first CSS med Tailwind CSS for hurtig og konsistent UI-udvikling.
Komponentbase: Shadcn/ui bruges som fundament for smukke, tilgængelige, og let tilpasselige UI-komponenter. Komponenter installeres/kopieres direkte ind i projektet for fuld kontrol.
Database:
Primær Database (Flask-tilknyttet): Den eksisterende relationelle database (formodentlig SQLite/PostgreSQL via SQLAlchemy) forbliver kernen for sportsdata, aktiedyst-transaktioner, forumdata, etc. Databasemigreringer håndteres via Alembic/Flask-Migrate.
Sekundær/Suppl. Database (Firebase): Firebase Firestore eller Realtime Database kan anvendes til nye funktioner eller datatyper, der passer godt til en NoSQL-model (f.eks. udvidede brugerprofil-attributter, notifikationssystem, realtids chat logs, etc.). Sikkerhedsregler i Firebase vil være essentielle.
Løbende Opgaver (Gennemgående for alle faser):
Fejlhåndtering: Robust fejlhåndtering på både frontend og backend.
Sikkerhed: Kontinuerlig fokus på sikkerhedsforbedringer (input validering, output encoding, dependency scanning, sikre API-designs, Firebase sikkerhedsregler).
Testning: Omfattende teststrategi (unit, integration, E2E).
Dokumentation: Opdatering af denne projektplan, API-dokumentation (f.eks. via Swagger/OpenAPI for backend), og in-code kommentarer.
Performance Optimering: Både frontend (load-tider, rendering) og backend (API svartider, databaseforespørgsler).
Teknologi Stack (Udvalgte Værktøjer - Detaljeret):
Bemærkning: Dette er en udvidet liste baseret på projektplanen. Specifikke valg kan justeres undervejs.

Monorepo Management:
npm workspaces (initielt valgt for sin simplicitet).
Overvej senere: Nx eller Turborepo (hvis projektets kompleksitet vokser betydeligt og der er behov for mere avanceret caching, build-orkestrering).
Frontend (apps/frontend):
Framework: Next.js (med App Router).
UI Bibliotek: React.
Sprog: TypeScript.
Styling: Tailwind CSS.
Komponenter: Shadcn/ui (baseret på Radix UI primitives).
Client State Management: Zustand (valgt for sin simplicitet og lette API).
Alternativ overvejet: Jotai.
Server State Management: TanStack Query (React Query v5) (for datahentning, caching, synkronisering med backend API).
Formularer: React Hook Form (for performance og fleksibilitet) med Zod (for skema-baseret validering).
Animation: Framer Motion (primært, for UI-animationer og overgange).
Overvej Anime.js: Til specifikke, komplekse, eller sekventielle animationer hvor Framer Motion evt. kommer til kort (som noteret i planen).
Diagrammer/Grafer: Recharts (valgt).
Alternativ overvejet: Nivo.
Real-time (Klient): Socket.IO Client.
Backend (apps/backend):
Sprog: Python.
Framework: Flask.
API Udvikling: Flask-RESTful (eller lignende, f.eks. Flask-Smorest for OpenAPI-generering – vurderes ved behov).
Real-time (Server): Flask-SocketIO.
ORM: SQLAlchemy.
Database Migration: Flask-Migrate (med Alembic).
Autentificering (Lokal - under udfasning): Flask-JWT-Extended (primært for eksisterende flows, udfases gradvist).
Firebase Services:
Firebase Authentication (Email/Password, Google Sign-In).
Firebase Admin SDK (Python, til backend-integration).
Firebase SDK (JavaScript, til frontend-integration).
Firebase Realtime Database (valgt til visse realtidsfunktioner).
Alternativ overvejet: Firestore.
Firebase Storage (for filuploads - planlagt for Fase 6).
Firebase Functions (for serverless logik - planlagt for Fase 6).
Testing:
Frontend Unit/Integration: Jest & React Testing Library.
Backend Unit/Integration: PyTest.
End-to-End (E2E): Playwright (foretrukket for moderne web features og stærk auto-wait).
Alternativ overvejet: Cypress.
Linting & Formatting:
Frontend: ESLint, Prettier (med prettier-plugin-tailwindcss).
Backend: (Formodentlig Flake8, Black, isort – specificer og opsæt hvis ikke allerede gjort).
Deployment:
Frontend: Vercel (stærkt anbefalet for Next.js).
Alternativ: Firebase Hosting.
Backend: Docker-container på en cloud platform (f.eks. Google Cloud Run, AWS App Runner, AWS ECS).
CI/CD: GitHub Actions (eller lignende, f.eks. GitLab CI, Jenkins).
Fase 0: Monorepo & Grundlæggende Frontend Setup
Mål: At etablere en solid monorepo-struktur, initialisere et funktionelt Next.js-projekt med essentiel konfiguration, tooling, grundlæggende layout, og indledende Firebase-integration.
Status: Stort set fuldført, enkelte åbne punkter eller forfinelser.

F0.1: [X] Etabler Monorepo Struktur
Opret en rodmappe: fattecentralen-monorepo/.
Initialiser package.json i roden for npm workspaces.
Note: npm init -y anvendt. Workspaces konfigureret til apps/* og evt. packages/*.
Opret apps/ mappe.
Flyt eksisterende Flask-backend-kode (tidligere app/) til apps/backend/.
Note: Dette er kritisk for at adskille backend logik.
Opret apps/frontend/ for det nye Next.js-projekt.
F0.1.1: Opret packages/ mappe (Valgfrit senere, men forbered)
Note: Selvom det er markeret som "Valgfrit senere", er det godt at have strukturen klar. Overvej at oprette den nu, selvom den er tom, for at signalere intentionen om delt kode.
Eksempel packages/types: For delte TypeScript interfaces mellem frontend og backend.
Eksempel packages/ui-core: For helt generiske UI-komponenter, der ikke er Shadcn, hvis behovet opstår.
Eksempel packages/utils: For fælles hjælpefunktioner.
F0.2: [X] Initialiser Next.js Projekt (i apps/frontend/)
Kør npx create-next-app@latest . --typescript --tailwind --eslint --app (indenfor apps/frontend/).
Bekræft at src/ directory er oprettet og anvendt (standard med --app).
Note: src/ blev oprettet som standard under initialisering.
F0.3: [X] Installer Basis Frontend Afhængigheder (i apps/frontend/)
Primære afhængigheder installeret:
@tanstack/react-query (datahentning)
zustand (client state management)
react-hook-form (formularer)
zod (validering)
framer-motion (animation)
socket.io-client (real-time kommunikation)
recharts (diagrammer)
firebase (Firebase SDK)
Note: Valg af zustand og recharts bekræftet.
Udviklingsafhængigheder installeret:
@tanstack/eslint-plugin-query (ESLint regler for React Query)
@testing-library/react, @testing-library/jest-dom (test-værktøjer)
jest, jest-environment-jsdom, @types/jest (test-runner og typer)
prettier-plugin-tailwindcss (Prettier plugin for Tailwind klasser)
F0.4: [X] Opsæt Shadcn/ui (i apps/frontend/)
Kør npx shadcn-ui@latest init (eller den korrekte shadcn@latest init kommando).
Note: npx shadcn@latest init anvendt, 'Slate' valgt som basefarve. --legacy-peer-deps blev brugt (formodentlig for React 19 kompatibilitet – dokumenter hvorfor hvis specifikt).
Nødvendige komponenter installeret (eksempler):
button, card, input, label, table, tabs, dialog, skeleton, badge, avatar, dropdown-menu.
sonner (installeret i stedet for toast, da toast er deprecated i Shadcn).
F0.4.1: Dokumenter valgte Shadcn/ui konfigurationer:
Noter den valgte basefarve, CSS-variabler prefix, etc., i en README for apps/frontend eller i denne plan for reference.
F0.5: [X] Konfigurer Linting & Formatting (i apps/frontend/ og roden)
Opsæt ESLint (.eslintrc.json eller eslint.config.mjs) og Prettier (.prettierrc.js med prettier-plugin-tailwindcss) i apps/frontend/.
Note: ESLint konfigureret som eslint.config.mjs (Next.js standard). .prettierrc.js oprettet i apps/frontend.
Oprettet global Prettier-konfiguration i monorepo-roden (fattecentralen-monorepo/.prettierrc.js).
Note: Frontend-specifik Prettier-config i apps/frontend/.prettierrc.js bibeholdes indtil videre. Overvej konsolidering/arv for at undgå konflikter. En rod-konfiguration bør være den primære, og workspace-specifikke kun for afvigelser.
F0.5.1: Opsæt Linting & Formatting for Backend (i apps/backend/)
Vælg og konfigurer Python linters/formatters (f.eks. Flake8, Black, isort).
Integrer med VS Code og eventuelle pre-commit hooks.
F0.6: [X] Etabler Grundlæggende Frontend Mappestruktur (i apps/frontend/src/)
app/: Next.js App Router standard (sider, layouts, route handlers).
components/: Genbrugelige React-komponenter.
components/ui/: Shadcn-baserede komponenter (autogenereret af Shadcn CLI).
components/layout/: Komponenter relateret til sidens overordnede layout (Header, Sidebar, Footer, DashboardLayout).
components/features/: Komponenter specifikke for en feature (f.eks. AktiedystOrderForm, LiveSportsMatchCard).
Overvej components/common/ for meget generiske, små, ikke-Shadcn UI-elementer.
lib/: Hjælpefunktioner, konstanter, SDK-opsætning.
lib/utils.ts: Generelle utilities (autogenereret af Shadcn, kan udvides).
lib/firebase.ts: Firebase SDK initialisering og konfiguration (client-side).
lib/apiClient.ts: Wrapper for fetch til API-kald (tilføjelse af headers, error handling). Skal oprettes i Fase 3.
hooks/: Custom React Hooks (f.eks. useAuth, useSocket).
store/: Zustand stores (f.eks. authStore.ts, uiStore.ts).
styles/: Globale styles udover Tailwind.
globals.css: (Primært for Tailwind base styles og globale CSS variabler).
types/: Globale TypeScript interfaces/types for frontend.
Bemærkning: Overvej at flytte delte typer til packages/types senere for adgang fra både frontend og backend (hvis backend også bruger TS, eller hvis typerne er for API-kontrakter).
F0.7: [X] Implementer Grundlæggende Layout (i apps/frontend/src/)
Oprettet components/layout/DashboardLayout.tsx.
Indhold: Wrapper for sider, der skal have Header, Sidebar/Navbar, Footer, og et main content area for {children}.
Anvendt DashboardLayout i den globale app/layout.tsx.
Note: Titel og beskrivelse i layout.tsx er opdateret.
F0.7.1: Opsæt Navigationselementer (Statisk Grundstruktur)
Implementer Header-komponent med plads til logo, brugermenu (statisk for nu).
Implementer Sidebar/Navbar-komponent med statiske links til hovedsektioner (Live Sports, Aktiedyst, Forum, Profil).
Implementer Footer-komponent (statisk indhold).
Bemærkning: Dette handler om den visuelle struktur; dynamisk navigation og logik kommer senere.
F0.8: [X] Opsæt Basis Test Framework (i apps/frontend/)
Konfigurer Jest (jest.config.js, jest.setup.js).
Skrevet en simpel komponenttest for DashboardLayout.tsx for at verificere opsætningen.
Note: @testing-library/jest-dom tilføjet til tsconfig.json (types) for at løse typefejl.
F0.8.1: Skriv yderligere basistests
En test for en simpel utility-funktion i lib/utils.ts.
En test for en custom hook (når den første oprettes).
F0.9: [X] Firebase Projekt Setup & SDK Integration
Oprettet et nyt Firebase-projekt i Firebase Console.
Note: Bruger har bekræftet. Firebase Hosting setup blev sprunget over under web app registrering (da Vercel overvejes til frontend).
Aktiveret Firebase Authentication (Email/Password er bekræftet aktiveret; Google Sign-In bør også aktiveres for at matche planen).
Aktiveret Firebase Realtime Database.
Note: Bruger har bekræftet. Overvej Firestore, hvis der er behov for mere komplekse queries eller datastrukturering, men RTDB er fin til simple realtidsdata.
Firebase config-objekt hentet og gemt sikkert i apps/frontend/.env.local (via NEXT_PUBLIC_ prefixede miljøvariabler).
Initialiseret Firebase SDK i apps/frontend/src/lib/firebase.ts.
Indhold: Kode til at initialisere Firebase app'en med konfigurationen fra miljøvariabler. Eksponer Firebase services som auth, db.
Dette er de første sektioner. Hvordan ser denne detaljeringsgrad og struktur ud indtil videre? Er der noget, du ønsker justeret, før jeg fortsætter med Fase 1 (Backend API Klargøring)?
