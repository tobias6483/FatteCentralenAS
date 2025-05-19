Absolut! Her er den samlede, detaljerede og forfinede projektplan for "Fattecentralen", der fusionerer alle input og tilføjer yderligere detaljer og kreative ideer, klar til at blive kopieret ind i Dillinger.io.

```markdown
# Fattecentralen Projekt - Komplet Moderniseringsplan (Fusioneret & Detaljeret)

## Overordnet Vision:
At transformere det nuværende Fattecentralen-projekt (HTML, JavaScript, Python, CSS) til en topmoderne, højtydende, skalerbar og engagerende webapplikation. Frontend moderniseres til en Single Page Application (SPA) bygget med Next.js, React, og TypeScript, med UI/UX inspiration fra førende platforme som Bet365/FlashScore (for Sport) og Nordnet/TradingView (for Aktiedyst). Backend, baseret på Python/Flask, bibeholdes for sin kerneforretningslogik men udvides, optimeres og integreres dybt med Firebase, især for autentificering, og potentielt for realtidsdata og andre skalerbare cloud-services. Hele projektet struktureres som et monorepo for optimal udviklingseffektivitet og samarbejde.

## Overordnet Arkitektur Filosofi:

### Monorepo (`fattecentralen-monorepo`):
*   **Rationale:** Centraliseret versionsstyring, nemmere deling af kode/typer (især mellem frontend og backend via `packages/`), forenklede build/deploy processer, og forbedret samarbejde på tværs af projektdele.
*   **Struktur:**
    *   `apps/frontend`: Next.js applikationen.
    *   `apps/backend`: Python/Flask API'et.
    *   `packages/`: For delt kode:
        *   `packages/types`: Delte TypeScript interfaces/typer for API-kontrakter og fælles datamodeller.
        *   `packages/ui-core`: (Valgfrit) Generiske UI-komponenter, der ikke er Shadcn, hvis behovet opstår.
        *   `packages/utils`: Fælles hjælpefunktioner (f.eks. formatering, validering), der kan bruges af både frontend og backend (hvis skrevet i JS/TS og relevant).

### Frontend (Next.js - `apps/frontend`):
*   **Ansvar:** Håndtering af al brugerinteraktion, datavisualisering, klient-side logik, og levering af en rig, dynamisk brugeroplevelse.
*   **Teknologi:**
    *   Next.js App Router: For optimeret routing, server-side rendering (SSR), static site generation (SSG), og inkrementel statisk regenerering (ISR) hvor relevant.
    *   React Server Components (RSC): For forbedret performance, reduceret client-side JavaScript, og direkte datahentning på serveren.
    *   Client Components: For interaktivitet, event handlers, og brug af browser-specifikke API'er.
*   **Fokus:** Systematisk omdannelse af eksisterende HTML-sider og -templates til genbrugelige, velstrukturerede, testbare og typesikre React-komponenter med TypeScript. Der lægges vægt på at skabe en ægte SPA-følelse med flydende overgange og dynamisk indholdslæsning.

### Backend (Python/Flask - `apps/backend`):
*   **Ansvar:** Primært som en "headless" API-leverandør for Next.js frontend. Håndterer kerneforretningslogik (sportsdata-aggregering og -behandling, aktiedyst-mekanismer, forum-logik), databaseinteraktion med den primære database, og udsendelse af real-time events via WebSockets.
*   **Optimering:** Eksisterende Python-kode gennemgås for optimeringsmuligheder, refaktorering til bedre modularitet og forberedelse til skalerbarhed.

### API Lag (RESTful - udstillet af Flask):
*   **Design:** Klare, konsistente, versionerede (`/api/v1/...`) og veldokumenterede RESTful API'er.
*   **Kommunikation:** Next.js frontend kommunikerer med backend via standard `fetch` API, wrappet i en `apiClient` for centraliseret håndtering af headers (inkl. auth tokens) og fejl. Datahentning på klienten orkestreres af TanStack Query.
*   **Specifikationer:** Detaljerede JSON-strukturer for requests/responses defineres og vedligeholdes (se Fase 1). Overvej brug af OpenAPI/Swagger for API-dokumentation og -testning.

### Autentificering (Firebase Authentication):
*   **Primær Mekanisme:** Firebase håndterer brugeroprettelse, login (E-mail/Password, Google Sign-In, potentielt andre sociale logins), password reset, MFA (Multi-Factor Authentication) hvis ønsket, og sikker udstedelse af ID Tokens (JWTs).
*   **Integration:**
    *   Frontend bruger Firebase JS SDK til alle auth-operationer.
    *   Firebase ID tokens sendes med hver API-anmodning til Flask-backend.
    *   Flask-backend validerer Firebase ID tokens vha. Firebase Admin SDK for at autentificere og autorisere API-anmodninger.
    *   Lokal brugerdatabase (`User` model i Flask) synkroniseres med Firebase UIDs. `firebase_uid` bliver den primære nøgle til at linke brugere på tværs af systemerne.
*   **Status (Lokal JWT Udfasning):** Lokal Flask JWT-generering (Flask-JWT-Extended) er under udfasning. Målet er, at frontend *udelukkende* stoler på Firebase ID Tokens. Eksisterende traditionelle login-flows på backend (hvis nogen tilgås direkte) vil blive fjernet eller omdirigeret til Firebase-baseret login. (Status: Arbejde på dette er i gang, ref. CHANGELOG).

### Real-time Kommunikation (Flask-SocketIO & evt. Firebase Realtime Services):
*   **Primær Mekanisme (Backend):** Flask-SocketIO (`apps/backend/sockets.py`) bibeholdes og optimeres for live-opdateringer (sportsresultater, aktiekurser, notifikationer).
    *   Klare event-navne og standardiserede datastrukturer.
    *   Brug af Socket.IO rooms for målrettede events (f.eks. `match_{matchId}`, `user_{firebaseUserId}`).
    *   Socket.IO forbindelser autentificeres vha. Firebase ID token sendt under handshake.
*   **Klient-side:** `socket.io-client` i frontend, administreret via en custom hook (`useSocket`).
*   **Sekundær/Suppl. (Firebase):** Firebase Realtime Database eller Firestore kan overvejes for specifikke realtidsfeatures:
    *   Chat-funktionalitet.
    *   Samtidig redigering (hvis relevant).
    *   Meget dynamiske activity feeds.
    *   Features, der har gavn af Firebase's skalerbarhed og tætte integration med Firebase Functions (f.eks. serverless funktioner trigget af databaseændringer).

### Styling (Tailwind CSS & Shadcn/ui):
*   **Metode:** Utility-first CSS med Tailwind CSS for hurtig, konsistent og responsiv UI-udvikling.
*   **Komponentbase:** Shadcn/ui anvendes som fundament for smukke, tilgængelige og let tilpasselige UI-komponenter. Komponenter installeres/kopieres direkte ind i projektet for fuld kontrol og tilpasning.
*   **Tema:** Understøttelse af Dark Mode vil blive implementeret.

### Database:
*   **Primær Database (Flask-tilknyttet):** Den eksisterende relationelle database (formodentlig SQLite for udvikling, PostgreSQL for produktion, via SQLAlchemy) forbliver kernen for struktureret data: sportsresultater, kampinformation, aktiedyst-transaktioner, porteføljer, forum-indhold (kategorier, tråde, posts), brugerprofiler (udover Firebase auth data). Databasemigreringer håndteres via Alembic/Flask-Migrate.
*   **Sekundær/Suppl. Database (Firebase):** Firebase Firestore eller Realtime Database kan anvendes for:
    *   Nye funktioner, der passer godt til en NoSQL-model.
    *   Data, der kræver meget lav latency realtids synkronisering på tværs af mange klienter (f.eks. live chat logs, simple notifikations-flags).
    *   Udvidede, mindre strukturerede brugerprofil-attributter eller -præferencer.
    *   Sikkerhedsregler i Firebase vil være essentielle for at beskytte disse data.

### Løbende Opgaver (Gennemgående for alle faser):
*   **Fejlhåndtering:** Robust og brugervenlig fejlhåndtering på både frontend (f.eks. via toasts, inline beskeder) og backend (standardiserede API fejl-responses). Centraliseret fejl-logging (f.eks. Sentry).
*   **Sikkerhed:** Kontinuerlig fokus på sikkerhed: input validering (Zod, backend validering), output encoding, beskyttelse mod OWASP Top 10 sårbarheder, dependency scanning, sikre API-designs, stærke Firebase sikkerhedsregler.
*   **Testning:** Omfattende teststrategi: Unit tests, integration tests, E2E tests. Mål for testdækning.
*   **Dokumentation:** Levende projektplan (dette dokument), API-dokumentation (f.eks. OpenAPI/Swagger for backend), in-code kommentarer, Storybook for UI-komponenter.
*   **Performance Optimering:** Proaktiv og reaktiv optimering af frontend (load-tider, Core Web Vitals, rendering performance) og backend (API svartider, databaseforespørgsler, ressourceforbrug).
*   **Tilgængelighed (a11y):** Udvikling med fokus på WCAG-standarder for at sikre, at applikationen er brugbar for alle.

## Teknologi Stack (Udvalgte Værktøjer - Detaljeret):

*   **Monorepo Management:**
    *   **Primær:** npm workspaces (initielt valgt for sin simplicitet).
    *   **Overvej Senere:** Nx eller Turborepo (hvis projektets kompleksitet og behov for avanceret caching, build-orkestrering, og task-afhængigheder vokser betydeligt).
*   **Frontend (`apps/frontend`):**
    *   **Framework:** Next.js (med App Router).
    *   **UI Bibliotek:** React.
    *   **Sprog:** TypeScript.
    *   **Styling:** Tailwind CSS.
    *   **UI Komponenter:** Shadcn/ui (bygger på Radix UI primitives for tilgængelighed og funktionalitet).
    *   **Client State Management:** Zustand (valgt for sin simplicitet, lette API, og gode performance).
        *   *Alternativ overvejet:* Jotai.
    *   **Server State Management / Data Hentning:** TanStack Query (React Query v5) (for API datahentning, caching, optimisitiske opdateringer, og synkronisering med backend).
    *   **Formularer:** React Hook Form (for performance, fleksibilitet, og nem integration med validering).
    *   **Validering (Formular & Data):** Zod (for skema-baseret validering, fungerer perfekt med TypeScript).
    *   **Animation:**
        *   **Primær:** Framer Motion (for UI-animationer, sideovergange, gestus-animationer).
        *   **Sekundær/Specialiseret:** Anime.js (for specifikke, komplekse, eller sekventielle animationer, f.eks. detaljerede SVG-animationer eller avancerede tidslinjebaserede effekter, hvor Framer Motion evt. kommer til kort eller bliver for verbose).
    *   **Diagrammer/Grafer:** Recharts (valgt for sin fleksibilitet og React-venlige API).
        *   *Alternativ overvejet:* Nivo.
    *   **Real-time (Klient):** Socket.IO Client.
    *   **Internationalisering (i18n):** (Ikke specificeret før, men god at overveje) `next-international`, `react-i18next` med `i18next`.
*   **Backend (`apps/backend`):**
    *   **Sprog:** Python (seneste stabile version).
    *   **Framework:** Flask.
    *   **API Udvikling:** Flask-RESTful (eller lignende, f.eks. Flask-Smorest for automatisk OpenAPI-generering – vurderes ved behov).
    *   **Real-time (Server):** Flask-SocketIO.
    *   **ORM:** SQLAlchemy.
    *   **Database Migration:** Flask-Migrate (wrapper om Alembic).
    *   **Autentificering (Lokal - under udfasning):** Flask-JWT-Extended.
    *   **Task Queues (Asynkrone Opgaver):** (Ikke specificeret før, men overvej) Celery med Redis/RabbitMQ for baggrundsjobs (f.eks. databehandling, afsendelse af emails).
*   **Firebase Services:**
    *   Firebase Authentication (Email/Password, Google Sign-In, evt. andre OAuth providers).
    *   Firebase Admin SDK (Python, til backend-integration).
    *   Firebase SDK (JavaScript, til frontend-integration).
    *   Firebase Realtime Database (valgt til visse realtidsfunktioner).
        *   *Alternativ overvejet:* Firestore (kan bruges parallelt for andre features).
    *   Firebase Storage (for filuploads som profilbilleder, forum-vedhæftninger - planlagt for Fase 6).
    *   Firebase Functions (Cloud Functions for Firebase) (for serverless logik, event-drevne tasks - planlagt for Fase 6).
    *   Firebase Hosting (som alternativ til Vercel, eller til specifikke statiske dele/mikro-frontends).
*   **Testing:**
    *   **Frontend Unit/Integration:** Jest & React Testing Library (RTL).
    *   **Frontend E2E:** Playwright (foretrukket for moderne web features, auto-wait, multi-browser).
        *   *Alternativ overvejet:* Cypress.
    *   **Backend Unit/Integration:** PyTest (med plugins som `pytest-flask`, `pytest-cov`).
    *   **Mocking (Frontend):** `msw` (Mock Service Worker) for API mocking i tests og udvikling.
*   **Linting & Formatting:**
    *   **Frontend:** ESLint, Prettier (med `prettier-plugin-tailwindcss`).
    *   **Backend:** Flake8 (linting), Black (formattering), isort (import-sortering).
    *   **Generelt:** `pre-commit` hooks til at køre linters/formatters før commits.
*   **Deployment:**
    *   **Frontend:** Vercel (stærkt anbefalet for Next.js pga. performance, DX, og integrationer).
    *   **Backend:** Docker-container på en administreret cloud platform:
        *   Google Cloud Run (god til serverless containere).
        *   AWS App Runner eller AWS ECS (Elastic Container Service) med Fargate.
    *   **Database (Produktion):** Managed PostgreSQL service (f.eks. Google Cloud SQL, AWS RDS, Supabase).
*   **CI/CD (Continuous Integration/Continuous Deployment):**
    *   GitHub Actions (tæt integration med GitHub repos).
    *   *Alternativer:* GitLab CI, Jenkins, CircleCI.
*   **Overvågning & Logging:**
    *   **Fejl-tracking:** Sentry (for både frontend og backend).
    *   **Analytics:** Vercel Analytics, Google Analytics 4.
    *   **Performance Monitoring (APM):** Sentry APM, Datadog, New Relic (for backend).
    *   **Log Management:** Platform-specifikke løsninger (Google Cloud Logging, AWS CloudWatch Logs) eller en dedikeret service.
*   **Dokumentation:**
    *   **API:** OpenAPI/Swagger (kan genereres med Flask-Smorest).
    *   **UI Komponenter:** Storybook.
    *   **Projektplan:** Dette Markdown-dokument.

---

## Fase 0: Monorepo & Grundlæggende Frontend Setup
**Mål:** At etablere en solid monorepo-struktur, initialisere et funktionelt Next.js-projekt med essentiel konfiguration, tooling, grundlæggende layout, og indledende Firebase-integration.
**Status:** Stort set fuldført, enkelte åbne punkter eller forfinelser.

### F0.1: `[X]` Etabler Monorepo Struktur
*   **F0.1.1:** `[X]` Opret en rodmappe: `fattecentralen-monorepo/`.
*   **F0.1.2:** `[X]` Initialiser `package.json` i roden for npm workspaces.
    *   *Note:* `npm init -y` anvendt. Workspaces konfigureret til `apps/*` og `packages/*`.
*   **F0.1.3:** `[X]` Opret `apps/` mappe.
*   **F0.1.4:** `[X]` Flyt eksisterende Flask-backend-kode (tidligere `app/`) til `apps/backend/`.
    *   *Note:* Dette er kritisk for at adskille backend logik og forberede for monorepo-struktur.
*   **F0.1.5:** `[X]` Opret `apps/frontend/` for det nye Next.js-projekt.
*   **F0.1.6:** `[ ]` Opret `packages/` mappe.
    *   *Note:* Selvom det er markeret som "Valgfrit senere" i oprindelig plan, oprettes strukturen nu for at signalere intentionen om delt kode. Kan indeholde:
        *   `packages/types`: For delte TypeScript interfaces/typer.
        *   `packages/ui-core`: For helt generiske UI-komponenter (ikke Shadcn).
        *   `packages/utils`: For fælles hjælpefunktioner.

### F0.2: `[X]` Initialiser Next.js Projekt (i `apps/frontend/`)
*   **F0.2.1:** `[X]` Kør `npx create-next-app@latest . --typescript --tailwind --eslint --app` (indenfor `apps/frontend/`).
*   **F0.2.2:** `[X]` Bekræft at `src/` directory er oprettet og anvendt (standard med `--app`).
    *   *Note:* `src/` blev oprettet som standard under initialisering.

### F0.3: `[X]` Installer Basis Frontend Afhængigheder (i `apps/frontend/`)
*   **F0.3.1:** `[X]` Primære afhængigheder installeret:
    *   `@tanstack/react-query` (datahentning)
    *   `zustand` (client state management)
    *   `react-hook-form` (formularer)
    *   `zod` (validering)
    *   `framer-motion` (animation)
    *   `socket.io-client` (real-time kommunikation)
    *   `recharts` (diagrammer)
    *   `firebase` (Firebase SDK)
    *   *Note:* Valg af `zustand` og `recharts` bekræftet.
*   **F0.3.2:** `[X]` Udviklingsafhængigheder installeret:
    *   `@tanstack/eslint-plugin-query` (ESLint regler for React Query)
    *   `@testing-library/react`, `@testing-library/jest-dom` (test-værktøjer)
    *   `jest`, `jest-environment-jsdom`, `@types/jest` (test-runner og typer)
    *   `prettier-plugin-tailwindcss` (Prettier plugin for Tailwind klasser)
    *   `msw` (Mock Service Worker - for API mocking i tests/udvikling - tilføj hvis ikke allerede gjort, stærkt anbefalet).

### F0.4: `[X]` Opsæt Shadcn/ui (i `apps/frontend/`)
*   **F0.4.1:** `[X]` Kør `npx shadcn-ui@latest init` (eller den korrekte `npx shadcn@latest init` kommando).
    *   *Note:* `npx shadcn@latest init` anvendt, 'Slate' valgt som basefarve. `--legacy-peer-deps` blev brugt (formodentlig for React 19 kompatibilitet – dokumenter hvorfor hvis specifikt, ellers fjern flag hvis ikke nødvendigt).
*   **F0.4.2:** `[X]` Nødvendige komponenter installeret (eksempler, udvid efter behov):
    *   `button`, `card`, `input`, `label`, `table`, `tabs`, `dialog`, `skeleton`, `badge`, `avatar`, `dropdown-menu`, `select`, `textarea`, `radio-group`, `checkbox`, `tooltip`, `popover`, `accordion`.
    *   `sonner` (installeret i stedet for `toast`, da `toast` er deprecated i Shadcn).
*   **F0.4.3:** `[ ]` Dokumenter valgte Shadcn/ui konfigurationer (f.eks. basefarve, CSS-variabler prefix, `tailwind.config.js` opsætning) i en `README.md` for `apps/frontend` eller her i planen for reference.

### F0.5: `[X]` Konfigurer Linting & Formatting
*   **Frontend (`apps/frontend/`):**
    *   **F0.5.1:** `[X]` Opsæt ESLint (`eslint.config.mjs` eller `.eslintrc.json`) og Prettier (`.prettierrc.js` med `prettier-plugin-tailwindcss`).
        *   *Note:* ESLint konfigureret som `eslint.config.mjs` (Next.js standard). `.prettierrc.js` oprettet i `apps/frontend`.
    *   **F0.5.2:** `[X]` Oprettet global Prettier-konfiguration i monorepo-roden (`fattecentralen-monorepo/.prettierrc.js`).
        *   *Note:* Frontend-specifik Prettier-config i `apps/frontend/.prettierrc.js` bibeholdes indtil videre. Overvej konsolidering/arv for at undgå konflikter. En rod-konfiguration bør være den primære, og workspace-specifikke kun for afvigelser eller slet den lokale hvis den er identisk.
*   **Backend (`apps/backend/`):**
    *   **F0.5.3:** `[ ]` Vælg og konfigurer Python linters/formatters:
        *   Anbefaling: `Flake8` (linting), `Black` (kompromisløs formattering), `isort` (import-sortering).
        *   Konfigurer i `pyproject.toml` eller relevante config-filer.
    *   **F0.5.4:** `[ ]` Integrer med VS Code (via Python extension settings) og opsæt `pre-commit` hooks for automatisk linting/formattering.

### F0.6: `[X]` Etabler Grundlæggende Frontend Mappestruktur (i `apps/frontend/src/`)
*   **`app/`**: Next.js App Router standard (sider, layouts, route handlers, API routes for Next.js backend).
*   **`components/`**: Genbrugelige React-komponenter.
    *   `components/ui/`: Shadcn-baserede komponenter (autogenereret af Shadcn CLI).
    *   `components/layout/`: Komponenter relateret til sidens overordnede layout (f.eks. `Header.tsx`, `Sidebar.tsx`, `Footer.tsx`, `DashboardLayout.tsx`).
    *   `components/features/`: Komponenter specifikke for en feature (f.eks. `aktiedyst/OrderForm.tsx`, `sports/MatchCard.tsx`).
    *   `components/common/`: Meget generiske, små, ikke-Shadcn UI-elementer eller sammensatte komponenter (f.eks. `Logo.tsx`, `UserAvatarWithName.tsx`).
*   **`lib/`**: Hjælpefunktioner, konstanter, SDK-opsætning.
    *   `lib/utils.ts`: Generelle utilities (autogenereret af Shadcn, kan udvides).
    *   `lib/firebase.ts`: Firebase SDK initialisering og konfiguration (client-side).
    *   `lib/apiClient.ts`: Wrapper for `fetch` til backend API-kald (tilføjelse af headers, error handling). *Skal oprettes/defineres nærmere i Fase 3.*
    *   `lib/constants.ts`: Globale konstanter for frontend.
    *   `lib/react-query.ts`: Opsætning af TanStack Query `QueryClient`. *Skal oprettes i Fase 3.*
*   **`hooks/`**: Custom React Hooks (f.eks. `useAuth.ts`, `useSocket.ts`, `useDebounce.ts`).
*   **`store/`**: Zustand stores (f.eks. `authStore.ts` for brugerens auth state, `uiStore.ts` for UI-relateret global state som sidebar-status).
*   **`styles/`**: Globale styles udover Tailwind.
    *   `globals.css`: Primært for Tailwind base styles, globale CSS variabler, og evt. globale custom styles.
*   **`types/`**: Globale TypeScript interfaces/types for frontend.
    *   *Bemærkning:* Overvej at flytte delte typer (især API-kontrakter) til `packages/types` senere for adgang fra både frontend og backend.

### F0.7: `[X]` Implementer Grundlæggende Layout (i `apps/frontend/src/`)
*   **F0.7.1:** `[X]` Oprettet `components/layout/DashboardLayout.tsx`.
    *   **Indhold:** Wrapper for sider, der skal have en konsistent struktur (Header, Sidebar/Navbar, Footer) og et `main` content area for `{children}`.
*   **F0.7.2:** `[X]` Anvendt `DashboardLayout` i den globale `app/layout.tsx` eller i specifikke route groups.
    *   *Note:* Titel og beskrivelse i `app/layout.tsx` er opdateret.
*   **F0.7.3:** `[ ]` Opsæt Statisk Grundstruktur for Navigationselementer i `DashboardLayout`:
    *   Implementer `Header.tsx` med plads til logo, søgefelt (statisk), notifikationsikon (statisk), og brugermenu (statisk "Login" knap).
    *   Implementer `Sidebar.tsx` (eller `Navbar.tsx`) med statiske links/ikoner til hovedsektioner (f.eks. Live Sports, Aktiedyst, Forum, Profil). Design for at være kollapsbar.
    *   Implementer `Footer.tsx` med statisk indhold (f.eks. copyright, links).
    *   *Bemærkning:* Dette handler om den visuelle struktur og placering af elementer; dynamisk indhold og logik kommer senere.

### F0.8: `[X]` Opsæt Basis Test Framework (i `apps/frontend/`)
*   **F0.8.1:** `[X]` Konfigurer Jest (`jest.config.js`, `jest.setup.js`).
*   **F0.8.2:** `[X]` Skrevet en simpel komponenttest for `DashboardLayout.tsx` for at verificere opsætningen.
    *   *Note:* `@testing-library/jest-dom` tilføjet til `tsconfig.json` (types) for at løse typefejl.
*   **F0.8.3:** `[ ]` Skriv yderligere basistests for at sikre robusthed af testmiljøet:
    *   En test for en simpel utility-funktion i `lib/utils.ts`.
    *   En test for en grundlæggende custom hook (når den første oprettes, f.eks. en simpel `useToggle`).
    *   Konfigurer Jest til at generere coverage reports.

### F0.9: `[X]` Firebase Projekt Setup & SDK Integration
*   **F0.9.1:** `[X]` Oprettet et nyt Firebase-projekt i Firebase Console.
    *   *Note:* Bruger har bekræftet. Firebase Hosting setup blev sprunget over under web app registrering, da Vercel primært overvejes til frontend.
*   **F0.9.2:** `[X]` Aktiveret Firebase Authentication.
    *   Valgte login-metoder: E-mail/Password (bekræftet aktiveret).
    *   `[ ]` Aktiver Google Sign-In for at matche planen og tilbyde en nemmere login-mulighed.
    *   Overvej andre OAuth providers (f.eks. GitHub, Facebook) senere baseret på brugerbehov.
*   **F0.9.3:** `[X]` Aktiveret Firebase Realtime Database.
    *   *Note:* Bruger har bekræftet. Overvej Firestore parallelt eller som alternativ, hvis der er behov for mere komplekse queries, stærkere datastrukturering, eller skaleringsfordele for specifikke features. RTDB er fin til simple realtidsdata og hurtig prototyping.
*   **F0.9.4:** `[X]` Firebase config-objekt hentet og gemt sikkert i `apps/frontend/.env.local` (via `NEXT_PUBLIC_` prefixede miljøvariabler).
*   **F0.9.5:** `[X]` Initialiseret Firebase SDK i `apps/frontend/src/lib/firebase.ts`.
    *   **Indhold:** Kode til at initialisere Firebase app'en med konfigurationen fra miljøvariabler. Eksponer Firebase services (som `getAuth`, `getDatabase`) for nem import i resten af applikationen.

---

## Fase 1: Backend API Klargøring & Grundlæggende Autentificering (Python/Flask `apps/backend/`)
**Mål:** At sikre at backend'en eksponerer de nødvendige, robuste og sikre API'er for kernefunktionaliteterne, integrerer fuldt ud med Firebase Authentication for brugerstyring, og at real-time setup via Flask-SocketIO er optimeret og klar til brug.
**Status:** Overvejende fuldført for User Profile og Forum API. Sports & Aktiedyst API'er er påbegyndt med scaffolding og definitioner. Socket.IO forberedelse er også fuldført.

### Generelle Bemærkninger og Status for Fase 1 (Baseret på projektplan og CHANGELOG):
*   `[X]` **Fuldført Indledende API'er:**
    *   **User Profile API:** `GET` og `PUT` for `/api/v1/users/me/profile` er fuldt implementeret (`api_user_profile.py`) og registreret. Beskyttet med Firebase Auth.
    *   **Forum API:** Fuld CRUD for tråde og posts er implementeret (`forum.py`) og registreret. Endpoints er beskyttet hvor relevant (f.eks. POST/PUT/DELETE) med Firebase Auth. Pylance-fejl rettet.
    *   *Reference: CHANGELOG Maj 19 (Core User Profile API, Forum API CRUD, Forum API Dev Initial Stages).*
*   `[/]` **Lokal Flask JWTs vs. Firebase ID Tokens:**
    *   **Strategi:** Gradvis udfasning af lokal Flask JWT-generering. Målet er at frontend udelukkende bruger Firebase ID tokens.
    *   **Nuværende Status (fra CHANGELOG Maj 19 - Pylance and Backend Firebase Auth):**
        *   `/api/v1/auth/me` bruger nu `@firebase_token_required`.
        *   `/api/v1/auth/register` er repurposet til `register_or_sync_firebase_user` og bruger `@firebase_token_required`. Genererer ikke længere lokale JWTs.
        *   `POST /api/v1/auth/link-firebase` er tilføjet for at linke eksisterende lokale konti til Firebase.
        *   Traditionelle login-flows (`/auth/login` på backend) giver beskeder om at linke/bruge Firebase.
    *   **Konklusion:** Signifikant fremskridt er gjort, men fuld udfasning kræver måske yderligere review/tilpasning af alle ældre, lokale JWT-afhængige dele, hvis de stadig er tilgængelige.
*   `[X]` **Løbende Opgaver:**
    *   Fejlhåndtering, sikkerhedsforbedringer, databasemigreringer (som set med `firebase_uid` tilføjelse), og testning er kontinuerlige processer, der allerede er adresseret i det udførte arbejde.

### F1.1: `[X]` Backend Miljø & Firebase Admin SDK Opsætning
*   **Python Virtuelt Miljø:**
    *   **F1.1.1:** `[X]` Genereret `requirements.txt` fra oprindeligt miljø.
    *   **F1.1.2:** `[X]` Flyttet `requirements.txt` til `apps/backend/`.
    *   **F1.1.3:** `[X]` Oprettet et nyt virtuelt miljø (`.venv`) i `apps/backend/`.
        *   *Anbefaling:* Brug `python -m venv .venv --copies` (eller `virtualenv .venv --copies`) for potentielt bedre Pylance/Pyright integration på nogle systemer.
    *   **F1.1.4:** `[X]` Installeret afhængigheder fra `requirements.txt` i det nye backend-miljø.
    *   *Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Authentication - venv recreation with --copies), CHANGELOG Maj 18 (Build/Environment Fixes - venv).*
*   **Firebase Admin SDK:**
    *   **F1.1.5:** `[X]` Downloadet Firebase Admin SDK service account key (`fattecentralenas-service-account.json`) og gemt sikkert uden for repository (f.eks. `~/.firebase_keys/` eller i en password manager, hentet dynamisk til CI/CD).
    *   **F1.1.6:** `[X]` Konfigureret `GOOGLE_APPLICATION_CREDENTIALS` miljøvariabel i `apps/backend/.env` (som er i `.gitignore`) til at pege på service account key filen.
    *   **F1.1.7:** `[X]` Verificeret at Firebase Admin SDK initialiseres korrekt i `apps/backend/__init__.py`.
    *   *Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Auth), CHANGELOG Maj 18 (Firebase Admin SDK Integration).*
*   **VS Code & Pylance/Pyright Konfiguration:**
    *   **F1.1.8:** `[X]` Korrekt konfigureret `python.defaultInterpreterPath` i `.vscode/settings.json` (workspace settings) til at pege på `.venv/bin/python`.
    *   **F1.1.9:** `[X]` Korrekt konfigureret `pyproject.toml` for Pyright (hvis brugt direkte) med `tool.pyright.venvPath` og `tool.pyright.venv`.
    *   *Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Auth - løsning af `firebase_admin` import issue).*

### F1.2: `[X]` Flask-JWT-Extended & Firebase Auth Integration
*   **Mål:** Centralisere API-autentificering omkring Firebase ID tokens.
*   **F1.2.1:** `[X]` Implementeret `@firebase_token_required` decorator (`apps/backend/utils/auth_utils.py` eller lignende) til at verificere Firebase ID tokens.
    *   **Detaljer:** Decorator skal:
        *   Hente token fra `Authorization: Bearer <token>` header.
        *   Verificere token mod Firebase Admin SDK (`auth.verify_id_token(token)`).
        *   Håndtere fejl (manglende token, ugyldigt/udløbet token) med passende HTTP 401/403 svar.
        *   Gøre decoded token (eller mindst `firebase_uid`) tilgængelig for route handleren, f.eks. via `flask.g` eller som et argument.
*   **Refaktorerede Nøgle API Endpoints:**
    *   **F1.2.2:** `[X]` `/api/v1/auth/me`: Beskyttet med `@firebase_token_required`. Henter brugerdata fra lokal DB baseret på `firebase_uid` fra valideret token.
    *   **F1.2.3:** `[X]` `/api/v1/auth/register` (nu `register_or_sync_firebase_user`):
        *   Beskyttet med `@firebase_token_required`.
        *   Logik: Tjekker om `firebase_uid` fra token allerede eksisterer i lokal DB.
            *   Hvis ja: Opdater evt. `last_login`, returner brugerinfo.
            *   Hvis nej: Opret ny lokal brugerprofil, linket til `firebase_uid`. Kræver `invite_code` (hvis det er en regel for nye profiler).
        *   Genererer *ikke* længere lokale JWTs for dette flow.
*   **Lokal DB User model (`apps/backend/models.py`):**
    *   **F1.2.4:** `[X]` Opdateret til at håndtere `firebase_uid` (String, unique, indexed, nullable=False hvis alle brugere skal have det).
    *   **F1.2.5:** `[X]` `password_hash` er nu `nullable=True` (for brugere der kun logger ind via Firebase).
    *   *Reference: CHANGELOG Maj 19 (Pylance and Backend Firebase Auth), CHANGELOG Maj 18 (User Model Enhancements).*
*   **Lokal Konti Linking:**
    *   **F1.2.6:** `[X]` `POST /api/v1/auth/link-firebase` endpoint implementeret.
        *   **Logik:** Kræver traditionel login (session/lokal JWT) for at identificere den lokale konto, og et Firebase ID token for at linke. Opdaterer den lokale brugers `firebase_uid`.
*   **Strategi for eksisterende lokale JWTs:**
    *   **F1.2.7:** `[/]` Nuværende status: Fokus er på Firebase ID token validering for API-kald. Ældre, session-baserede login flows (server-renderede HTML-sider fra Flask) og JWTs genereret derfra er endnu ikke fuldt fjernet, men brugere guides mod Firebase login på den nye frontend.
    *   **F1.2.8:** `[ ]` Plan for fuld udfasning af lokal JWT-generering og -validering:
        *   Identificer alle resterende endpoints/flows, der stadig genererer eller stoler på lokale JWTs (udover `link-firebase`).
        *   Definer hvordan disse skal migreres til kun at bruge Firebase ID tokens, eller fjernes hvis de er forældede.
        *   Opdater frontend (Fase 3) til *udelukkende* at sende Firebase ID token til alle beskyttede API-kald.

### F1.3: `[X]` Database Review & Migrationer (`apps/backend/models.py`, `migrations/`)
*   **Bruger Model (`User`):**
    *   **F1.3.1:** `[X]` Tilføjet `firebase_uid` (String, unique, nullable=False (efter overgang), indexed=True).
    *   **F1.3.2:** `[X]` `password_hash` sat til `nullable=True`.
    *   **F1.3.3:** `[X]` Tilføjet `__init__(self, **kwargs)` for nemmere instansiering og for at løse Pylance-fejl relateret til dynamiske attributter.
    *   *Reference: CHANGELOG Maj 18 & 19.*
*   **Forum Modeller (`ForumCategory`, `ForumThread`, `ForumPost`):**
    *   **F1.3.4:** `[X]` Gennemgået og anvendt for Forum API CRUD. Nødvendige relationer (f.eks. `ForeignKey`, `relationship`) og felter (f.eks. `title`, `body`, `created_at`, `author_id`) er på plads.
    *   **F1.3.5:** `[X]` `ForumPost` model fik `__init__` for Pylance-fejl-løsning.
    *   *Reference: CHANGELOG Maj 19 (Forum API CRUD, Pylance Fixes).*
*   **Alembic/Flask-Migrate:**
    *   **F1.3.6:** `[X]` Migrationer er genereret og anvendt for `User` model ændringer (`firebase_uid`, `password_hash` nullability).
    *   **F1.3.7:** `[X]` Sikret at `PYTHONPATH` og `venv` er korrekt sat op for `flask db` kommandoer.
    *   *Reference: CHANGELOG Maj 18.*
*   **F1.3.8:** `[ ]` Database Review for Sports & Aktiedyst Modeller:
    *   Gennemgå eksisterende databasemodeller for Sports (kampe, ligaer, hold etc.) og Aktiedyst (porteføljer, transaktioner, aktier etc.).
    *   Identificer eventuelle manglende felter/relationer for at understøtte de "Proposed New Endpoints" (se F1.4 & F1.5).
    *   Udfør nødvendige modelændringer (f.eks. i `apps/backend/models/sports_models.py`, `apps/backend/models/aktiedyst_models.py`).
    *   Generer og anvend nye Alembic-migrationer.

### F1.4: `[/]` API Design & Implementering - Live Sports
*   **Mål:** Sikre omfattende og robust API-dækning for alle live sports-relaterede data.
*   **Status (fra projektplan & Changelog):**
    *   Eksisterende endpoints (formodentlig):
        *   `GET /api/v1/sports`: Liste af sportsgrene/ligaer.
        *   `GET /api/v1/sports/{sportId}/matches`: Liste af kampe.
    *   `GET /api/v1/matches/{matchId}`: Detaljer for én kamp.
        *   *Note: Endpoint refactored. Ny blueprint `matches_api_bp` oprettet. (Changelog Maj 19 - Focused API Dev Sprint & Live Sports & Aktiedyst API Scaffolding).*
    *   Grundlæggende JSON request/response strukturer er defineret for ovenstående.
*   **JSON API Strukturer (Baseret på Version 1):**
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
                "icon_svg_name": "football-icon", // Consider full URL or a way to map this on frontend
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
            *   `sportId` (string, required): The ID of the sport (e.g., "football").
        *   Query Parameters:
            *   `status` (string, optional): `live`, `upcoming`, `finished`, `scheduled`. Default: `upcoming`.
            *   `date` (string, optional, format: `YYYY-MM-DD`): Filter matches for a specific date.
            *   `leagueId` (string, optional): Filter matches for a specific league within the sport.
            *   `page` (integer, optional, default: 1): Page number for pagination.
            *   `per_page` (integer, optional, default: 20): Number of matches per page.
        *   Response: `200 OK`
            ```json
            {
              "sport": { // Contextual information about the request
                "id": "football",
                "name": "Football"
              },
              "filters": { // Reflects the applied filters
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
                    "logo_url": "/static/logos/premier_league.png" // Consider serving logos via CDN or frontend assets
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
                  "status": "live", // e.g., "scheduled", "live", "ht", "ft", "postponed", "cancelled"
                  "minute": 65, // Current minute if live
                  "score": {
                    "home": 1,
                    "away": 0,
                    "period": "2H" // e.g., "1H", "2H", "ET", "P" (Penalties)
                  },
                  "venue": {
                    "id": "venue_1",
                    "name": "Stadium X",
                    "city": "City Y"
                  }
                }
                // ... other matches
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
            *   `matchId` (string, required): The ID of the match.
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
                "home": 2, "away": 1, "winner": "home", // "home", "away", "draw"
                "period": "FT",
                "half_time_score": { "home": 1, "away": 0 },
                "full_time_score": { "home": 2, "away": 1 },
                "extra_time_score": null, // if applicable
                "penalties_score": null // if applicable
              },
              "venue": { "id": "venue_1", "name": "Stadium X", "city": "City Y", "capacity": 50000 },
              "referee": { "id": "ref_007", "name": "John Doe", "nationality": "English" },
              "lineups": { // Could be null if not available
                "home_team_formation": "4-3-3",
                "away_team_formation": "4-4-2",
                "home_team_starters": [{ "player_id": "p1", "player_name": "Player One", "jersey_number": 10, "position": "Forward" /* e.g. G, D, M, F */ }],
                "away_team_starters": [{ "player_id": "p101", "player_name": "Player One Oh One", "jersey_number": 7, "position": "Midfielder" }],
                "home_team_substitutes": [{ "player_id": "p2", "player_name": "Player Two", "jersey_number": 15, "position": "Defender" }],
                "away_team_substitutes": [{ "player_id": "p102", "player_name": "Player One Oh Two", "jersey_number": 18, "position": "Forward" }]
              },
              "events": [ // Sorted by time/minute
                { "id": "event_1", "type": "goal", "minute": 25, "extra_minute": null, "team_id": "team_A", "player_id": "p1", "player_name": "Player One", "assist_player_id": "p_assist", "assist_player_name": "Assist P.", "detail": "Left foot shot", "score_at_event": { "home": 1, "away": 0 } },
                { "id": "event_2", "type": "card", "minute": 30, "extra_minute": null, "team_id": "team_B", "player_id": "p101", "player_name": "Player One Oh One", "detail": "Yellow Card - Unsporting behavior" /* "Yellow", "Red", "YellowRed" */ }
              ],
              "statistics": { // Could be null if not available, split by home/away
                "home_team": { "possession_percentage": 60, "shots_total": 15, "shots_on_target": 7, "corners": 8, "fouls_committed": 10, "offsides": 2, "yellow_cards": 1, "red_cards": 0 },
                "away_team": { "possession_percentage": 40, "shots_total": 8, "shots_on_target": 3, "corners": 3, "fouls_committed": 12, "offsides": 3, "yellow_cards": 2, "red_cards": 0 }
              },
              "head_to_head_summary": { // Summary of previous encounters
                "last_5_matches": [{ "match_id": "h2h_1", "date": "2024-10-10", "home_team_id": "team_A", "home_team_name": "Team A", "away_team_id": "team_B", "away_team_name": "Team B", "home_team_score": 1, "away_team_score": 1, "winner": "draw" }],
                "overall_stats": { "total_matches": 10, "team_a_wins": 5, "team_b_wins": 3, "draws": 2 }
              },
              "betting_odds": { // Optional, if providing odds data
                 "pre_match": [{"bookmaker_id": "bm1", "bookmaker_name": "Bookie One", "market_name": "Match Winner", "last_updated_utc": "2025-05-20T18:00:00Z", "odds": [{"outcome": "Home", "value": 1.8}, {"outcome": "Draw", "value": 3.5}, {"outcome": "Away", "value": 4.0}]}],
                 "live": [{"bookmaker_id": "bm1", "bookmaker_name": "Bookie One", "market_name": "Next Goal", "last_updated_utc": "2025-05-20T19:30:00Z", "odds": [{"outcome": "Home", "value": 2.1}, {"outcome": "No Goal", "value": 5.0}, {"outcome": "Away", "value": 3.2}]}]
              }
            }
            ```
    ```
*   **Implementering af "Proposed New Endpoints" (Disse er `[ ]`):**
    ```markdown
    #### Proposed New Endpoints for Comprehensive Live Sports API Coverage:

    **4. `GET /api/v1/sports/{sportId}/leagues`**
        *   Description: Retrieves a list of leagues for a specific sport.
        *   Path Parameters: `sportId` (string, required)
        *   Query Parameters: `country_code` (string, optional), `page` (int, opt, default: 1), `per_page` (int, opt, default: 20)
        *   Response: `200 OK`
            ```json
            {
              "sport": { "id": "football", "name": "Football" },
              "leagues": [
                { "id": "premier-league", "name": "Premier League", "country_code": "GB", "country_name": "United Kingdom", "logo_url": "/static/logos/premier_league.png", "current_season_id": "season_2024_2025", "type": "League" /* "League", "Cup" */ }
              ],
              "pagination": { "current_page": 1, "per_page": 20, "total_items": 1, "total_pages": 1 }
            }
            ```

    **5. `GET /api/v1/leagues/{leagueId}`**
        *   Description: Retrieves details for a specific league.
        *   Path Parameters: `leagueId` (string, required)
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
        *   Description: Retrieves the standings (table) for a specific league and season.
        *   Path Parameters: `leagueId` (string, required)
        *   Query Parameters: `seasonId` (string, optional, defaults to current season)
        *   Response: `200 OK`
            ```json
            {
              "league": { "id": "premier-league", "name": "Premier League" },
              "season": { "id": "season_2024_2025", "name": "2024/2025" },
              "standings": [ // Array for multiple groups/tables if applicable (e.g. conferences)
                {
                  "group_name": "Overall", // Or e.g. "Group A", "Eastern Conference"
                  "table": [
                    { "rank": 1, "team": { "id": "team_A", "name": "Team A", "logo_url": "/static/logos/team_a.png" }, "played": 10, "wins": 8, "draws": 1, "losses": 1, "goals_for": 25, "goals_against": 5, "goal_difference": 20, "points": 25, "form": "WWLWD" /* Last 5 matches W, D, L */, "description": "Champions League Spot" /* Optional description for rank */ }
                    // ... other teams
                  ]
                }
              ]
            }
            ```

    **7. `GET /api/v1/leagues/{leagueId}/teams`**
        *   Description: Retrieves teams participating in a specific league and season.
        *   Path Parameters: `leagueId` (string, required)
        *   Query Parameters: `seasonId` (string, optional), `page` (int, opt, default: 1), `per_page` (int, opt, default: 20)
        *   Response: `200 OK`
            ```json
            {
              "league": { "id": "premier-league", "name": "Premier League" },
              "season": { "id": "season_2024_2025", "name": "2024/2025" },
              "teams": [
                { "id": "team_A", "name": "Team A", "short_name": "TMA", "country": "England", "logo_url": "/static/logos/team_a.png", "venue_name": "Stadium X" }
              ],
              "pagination": { "current_page": 1, "per_page": 20, "total_items": 20, "total_pages": 1 }
            }
            ```

    **8. `GET /api/v1/teams/{teamId}`**
        *   Description: Retrieves details for a specific team.
        *   Path Parameters: `teamId` (string, required)
        *   Response: `200 OK`
            ```json
            {
              "id": "team_A", "name": "Team A", "short_name": "TMA", "country": "England", "founded_year": 1900, "logo_url": "/static/logos/team_a.png",
              "venue": { "id": "venue_1", "name": "Stadium X", "city": "City Y", "capacity": 50000 },
              "current_leagues": [ { "id": "premier-league", "name": "Premier League", "season_id": "season_2024_2025" } ],
              "coach": { "id": "coach_1", "name": "Coach Name", "nationality": "Spanish" },
              "squad": [ // Optional: current squad list
                {"player_id": "p1", "player_name": "Player One", "jersey_number": 10, "position": "Forward", "nationality": "Brazilian"}
              ]
            }
            ```

    **9. `GET /api/v1/teams/{teamId}/matches`**
        *   Description: Retrieves past and upcoming matches for a specific team.
        *   Path Parameters: `teamId` (string, required)
        *   Query Parameters: `status` (string, optional: `upcoming`, `finished`), `seasonId` (string, optional), `limit` (int, opt, default: 10 for upcoming, 10 for finished), `page` (int, opt), `per_page` (int, opt)
        *   Response: `200 OK`
            ```json
            {
              "team": { "id": "team_A", "name": "Team A" },
              "filters": { "status": "upcoming", "seasonId": "season_2024_2025" },
              "matches": [ // Similar structure to match object in GET /api/v1/sports/{sportId}/matches
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
    *Player-specific endpoints like `/api/v1/players/{playerId}` and `/api/v1/players/{playerId}/stats` can be considered for a future iteration if detailed player information and statistics become a core requirement.*
    ```
*   **Implementeringsopgaver for Live Sports API (Fortsættelse af V2/V3/V4):**
    *   **F1.4.1:** `[ ]` Implementer `GET /api/v1/sports/{sportId}/leagues`.
    *   **F1.4.2:** `[ ]` Implementer `GET /api/v1/leagues/{leagueId}`.
    *   **F1.4.3:** `[ ]` Implementer `GET /api/v1/leagues/{leagueId}/standings`.
    *   **F1.4.4:** `[ ]` Implementer `GET /api/v1/leagues/{leagueId}/teams`.
    *   **F1.4.5:** `[ ]` Implementer `GET /api/v1/teams/{teamId}`.
    *   **F1.4.6:** `[ ]` Implementer `GET /api/v1/teams/{teamId}/matches`.
    *   **F1.4.7:** `[ ]` **Fælles opgaver for Live Sports API implementering:**
        *   Opret/opdater relevante SQLAlchemy-modeller for ligaer, hold, stillinger, spillere etc. (ref F1.3.8).
        *   Implementer routes og logik i `apps/backend/routes/api_sports.py` (eller dedikerede blueprints som `leagues_api_bp`, `teams_api_bp`).
        *   Brug SQLAlchemy til alle databaseinteraktioner.
        *   Implementer grundig inputvalidering for path/query parametre (f.eks. med Marshmallow eller Pydantic).
        *   Standardiseret fejlhåndtering og HTTP statuskoder.
        *   Overvej caching strategier for data der ikke ændres hyppigt (f.eks. liste af sportsgrene, ligadetaljer). Brug Flask-Caching eller lignende.
        *   Skriv unit/integration tests (PyTest) for hvert nyt endpoint.
        *   Sørg for, at alle endpoints returnerer data i de definerede JSON-strukturer.

### F1.5: `[/]` API Design & Implementering - Aktiedyst
*   **Mål:** Sikre omfattende API-dækning for Aktiedyst-funktionalitet.
*   **Status (fra projektplan & Changelog):**
    *   Placeholders (mock data) implementeret for primære endpoints.
    *   Blueprint `aktiedyst_api_bp` oprettet og registreret.
    *   *Reference: Changelog Maj 19 - Focused API Dev Sprint & Live Sports & Aktiedyst API Scaffolding.*
*   **JSON API Strukturer (Baseret på Version 1):**
    ```markdown
    ### Aktiedyst API JSON Structures:

    **1. `GET /api/v1/aktiedyst/portfolio`**
        *   Description: Retrieves the current user's stock portfolio. Requires Firebase Authentication.
        *   Response: `200 OK`
            ```json
            {
              "user_uid": "firebase_auth_user_uid", // From authenticated user
              "portfolio_value_dkk": 12550.75, // Assuming DKK currency
              "cash_balance_dkk": 1550.25,
              "total_investment_dkk": 11000.50,
              "overall_pnl_dkk": 1550.25, // Profit and Loss
              "overall_pnl_percentage": 14.09,
              "holdings": [
                {
                  "symbol": "AAPL", // Stock symbol
                  "company_name": "Apple Inc.",
                  "quantity": 10,
                  "average_buy_price_dkk": 1500.00, // Price per share in DKK
                  "current_price_dkk": 1755.00, // Current market price per share in DKK
                  "market_value_dkk": 17550.00,
                  "pnl_dkk": 2550.00,
                  "pnl_percentage": 17.00,
                  "logo_url": "/static/logos/aapl.png", // Or from a financial data provider
                  "exchange": "NASDAQ"
                }
                // ... other holdings
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
                  "type": "buy", // "buy" or "sell"
                  "quantity": 10,
                  "price_per_share_dkk": 1500.00,
                  "total_amount_dkk": 15000.00, // quantity * price_per_share + fees (if any)
                  "fees_dkk": 29.00, // Optional transaction fee
                  "timestamp_utc": "2025-05-10T14:30:00Z",
                  "status": "completed" // "pending", "completed", "failed"
                }
                // ... other transactions
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
            *   `exchange` (string, optional): Filter by exchange (e.g., "NASDAQ", "NYSE", "OMXCPH").
        *   Response: `200 OK`
            ```json
            {
              "markets": [
                {
                  "symbol": "AAPL",
                  "company_name": "Apple Inc.",
                  "current_price_dkk": 1755.00,
                  "change_today_value_dkk": 12.50,
                  "change_today_percentage": 0.72,
                  "market_cap_dkk": 1.8E13, // Example, ensure correct conversion
                  "sector": "Technology",
                  "industry": "Consumer Electronics",
                  "exchange": "NASDAQ",
                  "logo_url": "/static/logos/aapl.png",
                  "currency": "USD" // Original currency of the stock price, for reference
                },
                {
                  "symbol": "NOVO-B.CO", // Example CPH stock
                  "company_name": "Novo Nordisk A/S",
                  "current_price_dkk": 850.70,
                  "change_today_value_dkk": -5.00,
                  "change_today_percentage": -0.58,
                  "market_cap_dkk": 2.5E12,
                  "sector": "Healthcare",
                  "industry": "Pharmaceuticals",
                  "exchange": "OMXCPH",
                  "logo_url": "/static/logos/novo.png",
                  "currency": "DKK"
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
            *   `symbol` (string, required): The stock symbol (e.g., "AAPL", "NOVO-B.CO").
        *   Query Parameters:
            *   `period` (string, optional): `1d`, `5d`, `1m`, `3m`, `6m`, `1y`, `ytd`, `max`. Default: `1m`.
            *   `interval` (string, optional): `1min`, `5min`, `15min`, `1h`, `1d`, `1wk`, `1mo`. Default depends on period.
        *   Response: `200 OK`
            ```json
            {
              "symbol": "AAPL",
              "company_name": "Apple Inc.",
              "period": "1m",
              "interval": "1d",
              "currency": "DKK", // Prices converted to DKK
              "history": [ // Candlestick data (OHLC) + volume
                { "timestamp_utc": "2025-04-20T00:00:00Z", "open": 1650.00, "high": 1665.00, "low": 1640.00, "close": 1657.50, "volume": 12000000 },
                { "timestamp_utc": "2025-04-21T00:00:00Z", "open": 1658.00, "high": 1672.00, "low": 1655.00, "close": 1669.00, "volume": 15000000 }
              ],
              "previous_close_dkk": 1645.00
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
              "quantity": 10, // Number of shares
              "limit_price_dkk": null, // Required if order_type is "limit", price per share in DKK
              "stop_price_dkk": null   // Required if order_type is "stop", price per share in DKK
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
        *   Response: `400 Bad Request` (for validation errors, insufficient funds, market closed, etc.)
            ```json
            {
              "error_code": "INSUFFICIENT_FUNDS", // e.g. INSUFFICIENT_FUNDS, MARKET_CLOSED, INVALID_SYMBOL, INVALID_QUANTITY
              "message": "Insufficient funds to place this order."
            }
            ```
    ```
*   **Implementering af "Proposed New Endpoints" og fuld logik (Disse er `[ ]`):**
    ```markdown
    #### Proposed New Endpoints for Comprehensive Aktiedyst API Coverage:

    **6. `GET /api/v1/aktiedyst/markets/{symbol}`**
        *   Description: Retrieves detailed information for a specific stock symbol, including company info, news, and key stats.
        *   Path Parameters: `symbol` (string, required)
        *   Response: `200 OK`
            ```json
            {
              "symbol": "AAPL",
              "company_name": "Apple Inc.",
              "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
              "sector": "Technology",
              "industry": "Consumer Electronics",
              "exchange": "NASDAQ",
              "website_url": "https://www.apple.com",
              "logo_url": "/static/logos/aapl.png",
              "currency": "DKK", // All monetary values in DKK
              "current_price_info": {
                "price": 1755.00,
                "change_value": 12.50,
                "change_percentage": 0.72,
                "day_high": 1760.00,
                "day_low": 1745.00,
                "volume": 25000000,
                "previous_close": 1742.50,
                "market_open": "15:30", // Market open time in local exchange time
                "market_close": "22:00", // Market close time in local exchange time
                "timestamp_utc": "2025-05-20T11:15:00Z"
              },
              "key_stats": {
                "market_cap": 1.8E13,
                "pe_ratio": 28.5, // Price-to-Earnings
                "eps": 61.50, // Earnings Per Share (DKK)
                "dividend_yield_percentage": 0.55,
                "52_week_high": 1900.00,
                "52_week_low": 1400.00
              },
              "news": [ // Recent news articles related to the stock
                { "id": "news_1", "title": "Apple Announces New Product Line", "source": "Tech News Daily", "url": "https://example.com/news1", "published_at_utc": "2025-05-19T08:00:00Z", "sentiment": "positive" /* Optional: positive, neutral, negative */ }
              ],
              "analyst_ratings": { // Aggregated analyst ratings
                "buy_percentage": 60,
                "hold_percentage": 30,
                "sell_percentage": 10,
                "recommendation_summary": "Strong Buy" // e.g., Strong Buy, Buy, Hold, Sell, Strong Sell
              }
            }
            ```

    **7. `GET /api/v1/aktiedyst/orders`**
        *   Description: Retrieves a list of the current user's orders (open, filled, cancelled). Requires Firebase Authentication.
        *   Query Parameters:
            *   `status` (string, optional): `open` (includes `pending_execution`, `partially_filled`), `filled`, `cancelled`, `rejected`.
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
                  "company_name": "Apple Inc.",
                  "type": "buy",
                  "order_type": "limit",
                  "quantity_ordered": 10,
                  "quantity_filled": 0,
                  "limit_price_dkk": 1700.00,
                  "status": "open", // "open", "partially_filled", "filled", "cancelled", "rejected", "expired"
                  "created_at_utc": "2025-05-20T11:00:00Z",
                  "updated_at_utc": "2025-05-20T11:00:00Z"
                }
              ],
              "pagination": { "current_page": 1, "per_page": 20, "total_items": 1, "total_pages": 1 }
            }
            ```

    **8. `GET /api/v1/aktiedyst/orders/{orderId}`**
        *   Description: Retrieves details for a specific order. Requires Firebase Authentication & user must own the order.
        *   Path Parameters: `orderId` (string, required)
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
              "average_fill_price_dkk": 1695.00, // If partially or fully filled
              "limit_price_dkk": 1700.00,
              "stop_price_dkk": null,
              "status": "partially_filled",
              "created_at_utc": "2025-05-20T11:00:00Z",
              "updated_at_utc": "2025-05-20T12:30:00Z",
              "fills": [ // Details of each fill execution for the order
                { "fill_id": "fill_abc", "quantity": 5, "price_dkk": 1695.00, "timestamp_utc": "2025-05-20T12:30:00Z", "fee_dkk": 14.50 }
              ],
              "reason_if_rejected_or_cancelled": null // Message if applicable
            }
            ```

    **9. `DELETE /api/v1/aktiedyst/orders/{orderId}`** (Cancel Order)
        *   Description: Cancels an open (or partially filled) order. Requires Firebase Authentication & user must own the order.
        *   Path Parameters: `orderId` (string, required)
        *   Response: `200 OK`
            ```json
            {
              "order_id": "order_789",
              "status": "cancelled",
              "message": "Order successfully cancelled."
            }
            ```
        *   Response: `404 Not Found` (if order doesn't exist or isn't cancellable by status).
        *   Response: `403 Forbidden` (if user doesn't own the order or not allowed to cancel).

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
                  "user": { "username": "StockWizard", "avatar_url": "/static/avatars/stockwizard.png" /* or from Firebase profile */, "user_id_public": "public_user_id_abc" /* A public, non-firebase UID if needed */},
                  "portfolio_value_dkk": 185000.00,
                  "pnl_percentage_period": 22.50, // PNL for the selected period
                  "joined_at_utc": "2025-01-10T00:00:00Z"
                }
                // ... other users
              ],
              "pagination": { "current_page": 1, "per_page": 20, "total_items": 50, "total_pages": 3 },
              "last_updated_utc": "2025-05-20T00:00:00Z" // When the leaderboard was last calculated
            }
            ```
    ```
*   **Implementeringsopgaver for Aktiedyst API (Fortsættelse af V2/V3/V4):**
    *   **F1.5.1:** `[ ]` Fuldfør `GET /api/v1/aktiedyst/portfolio` (logik, DB-interaktion, beregninger).
    *   **F1.5.2:** `[ ]` Fuldfør `GET /api/v1/aktiedyst/transactions` (logik, DB-interaktion, filtrering).
    *   **F1.5.3:** `[ ]` Fuldfør `GET /api/v1/aktiedyst/markets` (logik, integration med datakilde for markedsdata, filtrering).
    *   **F1.5.4:** `[ ]` Fuldfør `GET /api/v1/aktiedyst/markets/{symbol}/history` (logik, integration med datakilde for historiske data).
    *   **F1.5.5:** `[ ]` Fuldfør `POST /api/v1/aktiedyst/orders` (logik for ordrebehandling, validering, DB-opdatering, fondstjek).
    *   **F1.5.6:** `[ ]` Implementer `GET /api/v1/aktiedyst/markets/{symbol}`.
    *   **F1.5.7:** `[ ]` Implementer `GET /api/v1/aktiedyst/orders` (liste).
    *   **F1.5.8:** `[ ]` Implementer `GET /api/v1/aktiedyst/orders/{orderId}` (detalje).
    *   **F1.5.9:** `[ ]` Implementer `DELETE /api/v1/aktiedyst/orders/{orderId}`.
    *   **F1.5.10:** `[ ]` Implementer `GET /api/v1/aktiedyst/leaderboard`.
    *   **F1.5.11:** `[ ]` **Fælles opgaver for Aktiedyst API implementering:**
        *   Definér/opdater nødvendige SQLAlchemy-modeller for Aktiedyst (`Portfolio`, `Holding`, `Transaction`, `Order`, `TradableAsset` etc.) (ref F1.3.8).
        *   Implementer routes og logik i `apps/backend/routes/api_aktiedyst.py`.
        *   Brug SQLAlchemy til alle databaseinteraktioner.
        *   Implementer grundig inputvalidering (f.eks. med Marshmallow/Pydantic) og robust fejlhåndtering.
        *   Sikre alle bruger-specifikke endpoints med `@firebase_token_required`.
        *   Planlæg og implementer integration med eksterne datakilder for markedsdata (real-time og historisk), hvis det ikke findes i egen DB (f.eks. Financial Modeling Prep, Alpha Vantage, IEX Cloud - vær opmærksom på API-limits og omkostninger).
        *   Skriv unit/integration tests (PyTest) for hvert endpoint og forretningslogik.
        *   Sørg for, at alle endpoints returnerer data i de definerede JSON-strukturer.

### F1.6: `[X]` API Design & Implementering - Forum & Brugerprofil
*   **Status:** Fuldført (ifølge V2/V3/V4 og CHANGELOG).
*   **JSON API Strukturer (Baseret på Version 1):**
    ```markdown
    ### Forum API JSON Structures:

    **1.  `GET /api/v1/forum/categories`**
        *   Description: Retrieves a list of all forum categories.
        *   Response: `200 OK`
            ```json
            [
              {
                "id": 1, // Integer ID from DB
                "name": "General Discussion",
                "slug": "general-discussion", // URL-friendly slug
                "description": "Talk about anything and everything.",
                "icon_bootstrap_class": "bi-chat-dots", // Or material icon name, or SVG name
                "thread_count": 15,
                "post_count": 120,
                "last_activity": { // Info about the latest post in this category
                  "thread_id": 101,
                  "thread_title": "Welcome to the new forum!",
                  "last_post_at_utc": "2025-05-20T10:00:00Z",
                  "last_post_by_username": "admin_user",
                  "last_post_by_user_id": "some_user_id_public"
                }
              }
              // ... other categories
            ]
            ```

    **2.  `GET /api/v1/forum/categories/{categoryIdOrSlug}/threads`**
        *   Description: Retrieves a list of threads within a specific category. Supports pagination.
        *   Path Parameters:
            *   `categoryIdOrSlug` (integer or string, required): The ID or slug of the forum category.
        *   Query Parameters:
            *   `page` (integer, optional, default: 1): Page number for pagination.
            *   `per_page` (integer, optional, default: 20): Number of threads per page.
            *   `sort_by` (string, optional): `last_activity` (default), `created_at`, `title`.
            *   `sort_order` (string, optional): `desc` (default), `asc`.
        *   Response: `200 OK`
            ```json
            {
              "category": { // Contextual info
                "id": 1,
                "name": "General Discussion",
                "slug": "general-discussion"
              },
              "threads": [
                {
                  "id": 101,
                  "title": "Welcome to the new forum!",
                  "slug": "welcome-to-the-new-forum",
                  "author": {
                     "user_id_public": "admin_user_public_id",
                     "username": "admin_user",
                     "avatar_url": "/static/avatars/admin.png"
                  },
                  "created_at_utc": "2025-05-19T12:00:00Z",
                  "updated_at_utc": "2025-05-20T10:00:00Z", // Last post time in thread
                  "post_count": 5,
                  "view_count": 250,
                  "is_sticky": true, // Pinned thread
                  "is_locked": false, // Thread closed for new replies
                  "last_post": { // Info about the last post in this thread
                    "id": 505,
                    "author": {
                        "user_id_public": "new_user_public_id",
                        "username": "new_user",
                        "avatar_url": "/static/avatars/new_user.png"
                    },
                    "created_at_utc": "2025-05-20T10:00:00Z"
                  },
                  "tags": ["announcement", "welcome"] // Optional tags
                }
                // ... other threads
              ],
              "pagination": {
                "current_page": 1,
                "per_page": 20,
                "total_items": 15,
                "total_pages": 1
              }
            }
            ```

    **3.  `GET /api/v1/forum/threads/{threadIdOrSlug}/posts`**
        *   Description: Retrieves posts within a specific thread. Supports pagination.
        *   Path Parameters:
            *   `threadIdOrSlug` (integer or string, required): The ID or slug of the forum thread.
        *   Query Parameters:
            *   `page` (integer, optional, default: 1): Page number for pagination.
            *   `per_page` (integer, optional, default: 15): Number of posts per page.
            *   `sort_order` (string, optional): `asc` (default, chronological), `desc`.
        *   Response: `200 OK`
            ```json
            {
              "thread": { // Contextual info
                "id": 101,
                "title": "Welcome to the new forum!",
                "slug": "welcome-to-the-new-forum",
                "category_id": 1,
                "category_name": "General Discussion",
                "is_locked": false
              },
              "posts": [
                {
                  "id": 501,
                  "author": {
                     "user_id_public": "admin_user_public_id",
                     "username": "admin_user",
                     "avatar_url": "/static/avatars/admin.png",
                     "role": "admin", // User role
                     "post_count": 150,
                     "join_date_utc": "2024-01-01T10:00:00Z"
                  },
                  "body_markdown": "Hello everyone! This is the **first** post.", // Raw markdown content
                  "body_html": "<p>Hello everyone! This is the <strong>first</strong> post.</p>", // Server-sanitized HTML
                  "created_at_utc": "2025-05-19T12:00:00Z",
                  "updated_at_utc": "2025-05-19T12:05:00Z", // If edited
                  "last_edited_by_username": "admin_user", // If edited
                  "reactions": [ // Optional: simple reactions
                    {"type": "like", "count": 10, "users_reacted_preview": ["userA", "userB"]}
                  ],
                  "is_original_post": true // To distinguish OP from replies
                }
                // ... other posts
              ],
              "pagination": {
                "current_page": 1,
                "per_page": 15,
                "total_items": 5,
                "total_pages": 1
              }
            }
            ```

    **4.  `POST /api/v1/forum/threads/{threadIdOrSlug}/posts`**
        *   Description: Creates a new post in a specific thread. Requires Firebase Authentication.
        *   Path Parameters: `threadIdOrSlug` (integer or string, required)
        *   Request Body (Authenticated):
            ```json
            {
              "body_markdown": "This is my reply to the thread. Supports **Markdown**!"
              // "reply_to_post_id": 123 // Optional, if replying to a specific post
            }
            ```
        *   Response: `201 Created`
            ```json
            { // Returns the newly created post object, similar to GET posts
              "id": 506,
              "author": { "user_id_public": "auth_user_public_id", "username": "current_authenticated_user", "avatar_url": "..." },
              "body_markdown": "This is my reply to the thread. Supports **Markdown**!",
              "body_html": "<p>This is my reply to the thread. Supports <strong>Markdown</strong>!</p>",
              "created_at_utc": "2025-05-20T14:30:00Z",
              "thread_id": 101,
              "is_original_post": false
            }
            ```
        *   *Note: Additional Forum CRUD endpoints (Create Thread, Update Thread/Post, Delete Thread/Post) will be defined in Fase 5.*

    ### User Profile API JSON Structures:

    **1.  `GET /api/v1/users/me/profile`**
        *   Description: Retrieves the profile of the currently authenticated user. Requires Firebase Authentication.
        *   Response (Authenticated): `200 OK`
            ```json
            {
              "user_id_internal_db": "internal_db_user_id_123", // Internal DB primary key for the user
              "firebase_uid": "firebase_auth_user_uid",
              "username": "current_user",
              "email": "user@example.com", // From Firebase Auth, can be updated via Firebase
              "email_verified": true, // From Firebase Auth
              "role": "user", // "user", "moderator", "admin" - managed by backend
              "balance_dkk": 100.50, // From Aktiedyst or a general site balance
              "registration_date_utc": "2025-01-15T09:30:00Z",
              "last_login_utc": "2025-05-20T12:00:00Z",
              "avatar_url": "/static/avatars/current_user_avatar.png", // Can be default, or from Firebase Storage
              "about_me": "Loves coding and sports!",
              "level": 5, // Gamification/XP level
              "xp_points": 1250,
              "xp_needed_for_next_level": 1500,
              "forum_post_count": 42,
              "aktiedyst_rank": 15, // Optional, if ranked
              "user_settings": { // User-configurable settings
                "display_theme": "dark", // "light", "dark", "system"
                "notifications_enabled_global": true,
                "email_notifications": {
                    "forum_replies": true,
                    "aktiedyst_alerts": false
                }
              },
              "privacy_settings": {
                "profile_public": true,
                "show_aktiedyst_portfolio_publicly": false,
                "show_online_status": true
              }
            }
            ```

    **2.  `PUT /api/v1/users/me/profile`**
        *   Description: Updates editable parts of the currently authenticated user's profile. Requires Firebase Authentication.
        *   Request Body (Authenticated - only include fields to be updated):
            ```json
            {
              "username": "new_username_if_change_allowed", // Username change policy needs to be defined
              "avatar_url": "/new_avatar_from_storage.png",
              "about_me": "Updated about me section. Still loves coding and now also enjoys hiking!",
              "user_settings": {
                "display_theme": "light",
                "notifications_enabled_global": false,
                "email_notifications": {
                    "aktiedyst_alerts": true
                }
              },
              "privacy_settings": {
                "show_aktiedyst_portfolio_publicly": true
              }
            }
            ```
        *   Response: `200 OK` (returns the updated profile object, similar to GET)
            ```json
            {
              // ... (updated profile data as in GET /api/v1/users/me/profile) ...
              "message": "Profile updated successfully."
            }
            ```
        *   Response: `400 Bad Request` (for validation errors, e.g. username taken)
            ```json
            {
                "error_code": "USERNAME_TAKEN",
                "message": "The chosen username is already in use."
            }
            ```
    ```
*   **Implementering:**
    *   **F1.6.1:** `[X]` Forum API (GET kategorier, GET tråde i kategori, GET posts i tråd, POST post i tråd) er implementeret i `apps/backend/routes/forum.py`. Beskyttet med Firebase Auth hvor relevant.
    *   **F1.6.2:** `[X]` Brugerprofil API (`GET` & `PUT` for `/api/v1/users/me/profile`) er implementeret i `apps/backend/routes/api_user_profile.py`. Beskyttet med Firebase Auth.
    *   *Reference: CHANGELOG Maj 19 (Forum API CRUD Operations Completed, Core User Profile API Implementation).*
    *   *Bemærkning til planen: "Overvej om dele af forum/profil data kan flyttes til Firebase Firestore..." - dette er en Fase 6 overvejelse. For nu er det implementeret i Flask/SQLAlchemy.*

### F1.7: `[X]` Real-time (Socket.IO) Forberedelse i Flask (`apps/backend/sockets.py`)
*   **Status:** Forberedelse fuldført.
*   **F1.7.1:** `[X]` Gennemgået eksisterende Flask-SocketIO setup i `apps/backend/sockets.py`.
*   **Firebase Auth Integration for Socket.IO:**
    *   **F1.7.2:** `[X]` Socket.IO `on_connect` handler modificeret til at verificere Firebase ID token.
        *   Klienten sender token som en query parameter (f.eks. `?token=<FirebaseIdToken>`) eller i `auth` payload ved connect.
        *   Backend verificerer token med Firebase Admin SDK. Forbindelser uden gyldigt token afvises.
        *   Gem `firebase_uid` på `flask_socketio.request.sid` eller i en session-map for senere brug.
    *   *Reference: CHANGELOG Maj 19 (Socket.IO Enhancements).*
*   **Event Navne & Datastrukturer:**
    *   **F1.7.3:** `[X]` Defineret klare event-navne: `live_score_update`, `stock_price_update`.
    *   **F1.7.4:** `[ ]` Definer `new_user_notification` event og datastruktur (hvis ikke allerede gjort). Eksempel:
        *   Event: `user_notification`
        *   Data: `{ type: 'new_forum_reply', message: 'UserX replied to your thread Y', link: '/forum/threads/Y/last', timestamp_utc: '...' }`
    *   **F1.7.5:** `[X]` Standardiserede datastrukturer for `live_score_update` og `stock_price_update` (bør matche relevante dele af API-responses for konsistens).
*   **Socket.IO Rooms:**
    *   **F1.7.6:** `[X]` Strategi for room-navne:
        *   `match_{matchId}` (for live sportsresultater for en specifik kamp).
        *   `aktiedyst_market_{symbol}` (for realtids kursopdateringer for et specifikt symbol).
        *   `user_{firebaseUserId}` (for bruger-specifikke notifikationer og events).
    *   **F1.7.7:** `[X]` `handle_subscribe_to_live_scores` (eller lignende event handler på backend) refaktoreret til at bruge `join_room(f'match_{matchId}')`.
    *   *Reference: CHANGELOG Maj 19 (Socket.IO Enhancements).*
*   **Implementering af Event Udsendelse:**
    *   **F1.7.8:** `[ ]` Dette er mere end "forberedelse". Når backend-logikken (f.eks. i services eller efter API-kald der ændrer data) for sport, aktiedyst, forum, etc., opdaterer data, skal de relevante Socket.IO events udsendes til de korrekte rooms eller brugere.
        *   Eksempel: Når en ny forum post oprettes, find relevante brugere at notificere og emit `user_notification` til deres `user_{firebaseUserId}` rooms.
        *   Dette vil ske løbende som funktionerne implementeres/opdateres i F1.4, F1.5, F5.

---

## Fase 2: Core Frontend Features - UI Transformation & Statiske Komponenter (`apps/frontend/`)
**Mål:** At omdanne de vigtigste dele af den eksisterende HTML/CSS/JS (inklusive eventuelle "templates") til en moderne, responsiv Next.js/React SPA-struktur med TypeScript og Tailwind CSS. Fokus i denne fase er på at bygge den **statiske struktur og udseende** af UI-komponenter og sider ved brug af **mock data**. Design skal inspireres af Bet365/FlashScore (Sport) og Nordnet/TradingView (Aktiedyst), samtidig med at der skabes en unik "Fattecentralen" identitet.
**Status:** Ikke påbegyndt.

### F2.1: `[ ]` Identificer Nøgle-HTML Sider/Sektioner og Templates til Transformation
*   **F2.1.1:** `[ ]` **Analyser eksisterende HTML/CSS/JS projekt og templates:**
    *   Gennemgå alle eksisterende sider, sektioner og eventuelle design-templates.
    *   Identificer de 5-7 vigtigste/mest komplekse brugerflader, der skal transformeres først.
    *   **Prioriteringsliste (forslag baseret på planen):**
        1.  Login/Signup sider/modals.
        2.  Live Sports Oversigt (inkl. liste af sportsgrene, ligaer, kampe).
        3.  Aktiedyst Dashboard (inkl. portfolio-oversigt, markedsliste, basal graf).
        4.  Forum Oversigt (kategoriliste, trådliste for en kategori).
        5.  Brugerprofil Side (visning af info, faner for indstillinger/historik).
    *   Dokumenter URL-struktur (hvis relevant fra gammelt site) og kernefunktionalitet for hver valgt side/sektion.
*   **F2.1.2:** `[ ]` **Analyser eksisterende templates for genbrugelige mønstre:**
    *   Udover hele sider, kig efter gentagne UI-mønstre i templates (f.eks. specifikke kort-layouts, listeelementer, datavisningsformater).
    *   Planlæg hvordan disse mønstre kan omdannes til genbrugelige React-komponenter (se F2.7). Dette er nøglen til en effektiv SPA-udvikling.
*   **F2.1.3:** `[ ]` **JavaScript Biblioteksanalyse (f.eks. `anime.js` fra eksisterende projekt):**
    *   For hvert eksisterende JS-bibliotek (hvis nogen genbruges eller inspirerer):
        *   Identificer præcis hvor og hvordan det bruges.
        *   Vurder om funktionaliteten kan genskabes mere elegant/effektivt med Framer Motion (foretrukket for React-integration) eller via standard React/Tailwind/CSS.
        *   Hvis `anime.js` (eller andet) stadig er nødvendigt for unik, kompleks animation, planlæg hvordan det integreres i React-komponenter (f.eks. via `useEffect` og `refs`, se Fase 5).

### F2.2: `[ ]` Login/Signup Side (`app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, evt. `app/(auth)/reset-password/page.tsx`)
*   **F2.2.1:** `[ ]` **Opret Next.js Routes (App Router):**
    *   Brug Next.js Route Groups `(auth)` for at gruppere auth-relaterede sider uden at påvirke URL-stien (f.eks. `/login`, `/signup`).
    *   Opret `app/(auth)/login/page.tsx`.
    *   Opret `app/(auth)/signup/page.tsx`.
    *   Opret `app/(auth)/reset-password/page.tsx`.
    *   Opret `app/(auth)/layout.tsx` hvis der er et specifikt, simpelt layout for auth-sider (f.eks. centreret indhold på en minimalistisk baggrund).
*   **F2.2.2:** `[ ]` **Design UI med Shadcn/ui og Tailwind CSS (Statisk):**
    *   **Login side:**
        *   Shadcn `Card` som container.
        *   `CardHeader` med titel (f.eks. "Log Ind på Fattecentralen").
        *   `CardContent` med `Input` for e-mail/brugernavn, `Input` for password (type="password").
        *   `CardFooter` med `Button` (type="submit", "Log Ind"), link til signup-siden, link til "Glemt password?"-siden.
        *   Overvej plads til social login knapper (f.eks. "Log ind med Google") - design dem statisk.
    *   **Signup side:**
        *   Shadcn `Card` som container.
        *   `CardHeader` med titel (f.eks. "Opret Konto").
        *   `CardContent` med `Input` for brugernavn, e-mail, password, confirm password, `Input` for invite code (hvis relevant).
        *   `CardFooter` med `Button` (type="submit", "Opret Konto"), link til login-siden.
    *   **Reset Password side:**
        *   Shadcn `Card` med `Input` for e-mail, `Button` for "Send Nulstillingslink".
*   **F2.2.3:** `[ ]` **Klargør til Firebase Autentificering (UI-del):**
    *   Design UI med tanke på, at Firebase SDK vil håndtere selve auth-logikken i Fase 3.
    *   Overvej plads til inline fejlmeddelelser (f.eks. "Ugyldig e-mail/password", "Bruger findes ikke").
    *   Planen peger mod custom UI, der kalder Firebase SDK funktioner, fremfor at bruge pre-built FirebaseUI biblioteker, for fuld kontrol over look-and-feel.

### F2.3: `[ ]` Brugerprofil Side (`app/profile/page.tsx` eller `app/(dashboard)/profile/page.tsx`)
*   **F2.3.1:** `[ ]` **Opret Route og Grundlæggende Sidestruktur:**
    *   Opret `app/(dashboard)/profile/page.tsx` (antager at profilsiden er en del af et overordnet dashboard layout).
    *   Brug `DashboardLayout` (fra Fase 0).
*   **F2.3.2:** `[ ]` **Vis Brugerinformation (Statisk/Mock Data):**
    *   Øverste sektion med:
        *   Shadcn `Avatar` for profilbillede (med fallback-ikon).
        *   Brugernavn, e-mail (mock data).
        *   Shadcn `Badge` for rolle (f.eks. "Bruger", "Admin").
    *   En `Card` eller custom `DescriptionList` komponent til at vise mock-data:
        *   Saldo (fra Aktiedyst).
        *   Registreringsdato.
        *   Level, XP, Forum post count (gamification elementer).
*   **F2.3.3:** `[ ]` **Design Sektioner med Faner (Statisk/Mock Data):**
    *   Brug Shadcn `Tabs` for navigation mellem profilsektioner:
        *   **Tab "Profil":** `Textarea` for "Om Mig", `Input` for hjemmeside/sociale links (alle med mock data). Knap for "Gem Ændringer" (statisk).
        *   **Tab "Indstillinger":**
            *   Underfaner eller sektioner for "Generelt" (f.eks. `Select` for tema: Light/Dark/System), "Notifikationer" (`Checkbox` grupper for e-mail/site notifikationer), "Privatliv" (`Switch` for profilens offentlige synlighed, visning af aktivitet).
        *   **Tab "Aktiedyst Historik":** Tom Shadcn `Table` med kolonneoverskrifter for transaktioner (Symbol, Type, Antal, Pris, Dato). Vis "Ingen transaktioner fundet" besked.
        *   **Tab "Forum Aktivitet":** Tom liste eller `Table` for seneste tråde/posts. Vis "Ingen aktivitet fundet" besked.

### F2.4: `[ ]` Live Sports - Oversigt Side (`app/(dashboard)/live-sports/page.tsx`)
*   **UI Inspiration:** Bet365/FlashScore (data-tæt, klar struktur, nem navigation, live-indikatorer).
*   **F2.4.1:** `[ ]` **Opret Route og Grundlæggende Sidestruktur:**
    *   Opret `app/(dashboard)/live-sports/page.tsx`.
    *   Brug `DashboardLayout`.
*   **F2.4.2:** `[ ]` **Sport/Liga Navigation (Statisk/Mock Data):**
    *   **Sportsvælger:** Vandret liste af sport-ikoner/navne (f.eks. Fodbold, Basketball, Tennis) som Shadcn `Tabs` eller en custom `SegmentedControl`. "Fodbold" er valgt som default (mock).
    *   **Ligavælger:** Under valgt sport, vis en lodret menu eller dropdown (Shadcn `Select` eller `Accordion`) med ligaer for den valgte sport (mock data, f.eks. "Premier League", "Champions League"). "Premier League" er valgt.
*   **F2.4.3:** `[ ]` **Kamp-liste Visning (Statisk/Mock Data):**
    *   Brug Shadcn `Table` til at vise en liste af kampe for den "valgte" sport/liga.
    *   Opret genbrugelig `LiveMatchRow.tsx` komponent (`components/features/sports/LiveMatchRow.tsx`):
        *   **Props (Mock Data):** `match: { homeTeam: { name, logoUrl }, awayTeam: { name, logoUrl }, score: { home, away }, time: "65'", status: "live", startTime: "20:00", leagueName, matchId }`.
        *   **Viser:** Hjemmehold (logo, navn), Score (f.eks. "2 - 1"), Udehold (navn, logo), Kamp-tid/status (f.eks. "65'", "HT", "FT", "14:00 CET").
        *   Brug Shadcn `Badge` for status (f.eks. "LIVE", "FT", "UPCOMING").
        *   Inkluder en lille live-indikator (blinkende prik) hvis `status === "live"`.
        *   Gør rækken klikbar (ingen navigation endnu, men forbered med `cursor-pointer`).
    *   Inkluder flere mock `LiveMatchRow` komponenter i tabellen.
*   **F2.4.4:** `[ ]` **Filter/Sorterings-UI (Statisk):**
    *   Design UI-elementer over kamp-listen:
        *   Datovælger (f.eks. Shadcn `DatePicker` eller simple "I dag", "I morgen" knapper).
        *   Filter for kampstatus (Shadcn `Select` eller `RadioGroup` for "Alle", "Live", "Kommende", "Færdige").
        *   (Valgfrit) Sorteringsmulighed (f.eks. efter tid, liga - Shadcn `Button` med ikon).
    *   *Bemærkning: Funktionalitet implementeres i Fase 3.*

### F2.5: `[ ]` Aktiedyst - Dashboard Side (`app/(dashboard)/aktiedyst/page.tsx`)
*   **UI Inspiration:** Nordnet/TradingView (overskueligt, finansielt dashboard-look, nøgletal, grafer).
*   **F2.5.1:** `[ ]` **Opret Route og Grundlæggende Sidestruktur:**
    *   Opret `app/(dashboard)/aktiedyst/page.tsx`.
    *   Brug `DashboardLayout`.
*   **F2.5.2:** `[ ]` **Vis Nøgletal (Statisk/Mock Data):**
    *   En række af 3-4 Shadcn `Card` komponenter øverst (eller i en grid):
        *   "Porteføljeværdi": Stor skrift med mock DKK værdi.
        *   "Cash Balance": Mock DKK værdi.
        *   "Dagens Afkast": Mock DKK værdi og procent (grøn/rød farve).
        *   "Samlet Afkast": Mock DKK værdi og procent.
*   **F2.5.3:** `[ ]` **Vis Portefølje (Statisk/Mock Data):**
    *   Brug Shadcn `Table` til at vise brugerens (mock) aktiebeholdning.
    *   Opret genbrugelig `PortfolioHoldingRow.tsx` komponent (`components/features/aktiedyst/PortfolioHoldingRow.tsx`):
        *   **Props (Mock Data):** `holding: { symbol, companyName, quantity, avgBuyPrice, currentPrice, marketValue, pnlValue, pnlPercent, logoUrl }`.
        *   **Viser:** Symbol, Firmanavn, Antal, Gns. Købspris, Nuværende Pris, Markedsværdi, Afkast (DKK og %).
        *   Afkast farves grønt/rødt.
    *   Inkluder flere mock `PortfolioHoldingRow` komponenter.
*   **F2.5.4:** `[ ]` **Statisk Aktiegraf Komponent (`components/features/aktiedyst/StockChart.tsx`):**
    *   Opret komponenten.
    *   Brug Recharts til at vise en simpel linjegraf med mock historiske kursdata for en fiktiv aktie (f.eks. de sidste 30 dage).
    *   Inkluder en titel for grafen (f.eks. "AAPL Kursudvikling - Seneste Måned").
    *   Akselabels for tid og pris.
*   **F2.5.5:** `[ ]` **Design "Handels-Widget" (Statisk):**
    *   En sektion på siden eller en Shadcn `Button` "Handl" / "Ny Ordre".
    *   Hvis knap: Ved klik (ingen logik endnu), skal den vise en Shadcn `Dialog` (modal).
    *   **Dialog Indhold (Statisk):**
        *   Titel: "Placer Ordre".
        *   `Input` for "Symbol" (med placeholder "f.eks. AAPL").
        *   Shadcn `RadioGroup` eller `Tabs` for "Køb" / "Salg".
        *   `Input` for "Antal".
        *   Shadcn `Select` for "Ordretype" (med "Markedsordre" som default, "Limitordre" som option).
        *   (Skjult indtil "Limitordre" vælges) `Input` for "Limitpris".
        *   Vis estimeret totalpris (mock).
        *   `Button` for "Placer Ordre" (statisk).

### F2.6: `[ ]` Forum - Oversigt Side (`app/(dashboard)/forum/page.tsx`)
*   **F2.6.1:** `[ ]` **Opret Route og Grundlæggende Sidestruktur:**
    *   Opret `app/(dashboard)/forum/page.tsx` (oversigt over kategorier).
    *   Opret dynamisk route `app/(dashboard)/forum/[categoryIdOrSlug]/page.tsx` (viser tråde i en kategori).
    *   Opret dynamisk route `app/(dashboard)/forum/threads/[threadIdOrSlug]/page.tsx` (viser posts i en tråd).
    *   Brug `DashboardLayout`.
*   **F2.6.2:** `[ ]` **Vis Forum-kategorier (Statisk/Mock Data) på `forum/page.tsx`:**
    *   Brug en liste/grid af Shadcn `Card` komponenter eller en custom listestruktur.
    *   Opret `ForumCategoryCard.tsx` komponent (`components/features/forum/ForumCategoryCard.tsx`):
        *   **Props (Mock Data):** `category: { id, name, slug, description, icon, threadCount, postCount, lastActivity: { threadTitle, lastPostBy, lastPostAt } }`.
        *   **Viser:** Kategoriens navn, beskrivelse, ikon, antal tråde/posts, info om seneste aktivitet.
        *   Gør kortet klikbart (link til `forum/[categoryIdOrSlug]`, ingen navigation endnu).
    *   Vis 2-3 mock kategorier.
*   **F2.6.3:** `[ ]` **Vis Liste af Tråde for en "Valgt" Kategori (Statisk/Mock Data) på `forum/[categoryIdOrSlug]/page.tsx`:**
    *   Vis kategoriens navn som overskrift. Knap "Ny Tråd" (statisk).
    *   Brug Shadcn `Table` til at vise tråde.
    *   Opret `ForumThreadRow.tsx` komponent (`components/features/forum/ForumThreadRow.tsx`):
        *   **Props (Mock Data):** `thread: { id, title, slug, author: { username, avatarUrl }, postCount, viewCount, lastPost: { byUser, atTime }, isSticky, isLocked }`.
        *   **Viser:** Trådtitel (link til `forum/threads/[threadIdOrSlug]`), forfatter, antal svar/visninger, tidspunkt for seneste svar.
        *   Indikatorer for sticky/locked.
    *   Vis flere mock tråde.
*   **F2.6.4:** `[ ]` **Vis Liste af Posts for en "Valgt" Tråd (Statisk/Mock Data) på `forum/threads/[threadIdOrSlug]/page.tsx`:**
    *   Vis trådens titel som overskrift. Knap "Svar på Tråd" (statisk, typisk i bunden).
    *   Liste af posts. Hver post vises i en `PostCard.tsx` komponent (`components/features/forum/PostCard.tsx`):
        *   **Props (Mock Data):** `post: { id, author: { username, avatarUrl, role, postCount, joinDate }, bodyHtml, createdAt, updatedAt, reactions }`.
        *   **Viser:** Forfatterinfo (avatar, brugernavn, rolle, mm.), postens indhold (mock HTML), tidspunkt, evt. rediger/slet knapper (statisk), reaktions-UI (statisk).
    *   Vis et par mock posts.

### F2.7: `[ ]` Identificer & Genopbyg Genbrugelige UI-Elementer fra Eksisterende Projekt
*   **F2.7.1:** `[ ]` **Analyse af Gammelt HTML/CSS/Templates:**
    *   Gennemgå det gamle projekt og de eksisterende templates systematisk for gennemgående UI-mønstre, der ikke direkte dækkes af standard Shadcn-komponenter, men som ønskes bibeholdt/moderniseret. Dette kan være specifikke knap-designs, kort-layouts, informationsbokse, footers, headers, etc.
*   **F2.7.2:** `[ ]` **Implementer som Custom React/Tailwind Komponenter:**
    *   Byg disse elementer som nye, isolerede React-komponenter med Tailwind CSS for styling.
    *   Fokuser på genbrugelighed og props-baseret konfiguration.
    *   Placer dem i:
        *   `apps/frontend/src/components/common/` (for meget generiske elementer).
        *   `apps/frontend/src/components/features/...` (hvis de er genbrugelige indenfor en specifik feature).
    *   Overvej om nogle er så generiske og fundamentale, at de kunne blive custom Shadcn-lignende komponenter (bygge ovenpå Radix UI, følge deres mønster). For de fleste vil rene React/Tailwind komponenter være tilstrækkeligt.

### F2.8: `[ ]` (Stærkt Anbefalet) Opsæt Storybook (i `apps/frontend/`)
*   **F2.8.1:** `[ ]` **Initialiser Storybook:**
    *   Kør `npx storybook@latest init` i `apps/frontend/`.
    *   Følg opsætningsvejledningen. Sørg for korrekt konfiguration ift. Next.js (især App Router), Tailwind CSS, TypeScript, og path aliases.
*   **F2.8.2:** `[ ]` **Opret Stories for Nøglekomponenter:**
    *   Start med at oprette stories (.stories.tsx) for de nye genbrugelige komponenter fra F2.7.
    *   Opret stories for udvalgte, tilpassede Shadcn-komponenter som de er konfigureret/brugt i projektet (f.eks. en `Button` med specifikke varianter).
    *   Opret stories for feature-specifikke komponenter som `LiveMatchRow.tsx`, `PortfolioHoldingRow.tsx`, `ForumCategoryCard.tsx`.
    *   Vis forskellige states af komponenterne (f.eks. loading, error, med forskellige data).
*   *Rationale: Isoleret udvikling, visuel regressionstest, interaktiv dokumentation af UI-komponentbiblioteket, nemmere UI-review og samarbejde.*

---

## Fase 3: Frontend Data Integration & Firebase Autentificering (`apps/frontend/`)
**Mål:** At bringe de statiske UI-komponenter fra Fase 2 til live ved at:
- Integrere med Firebase Authentication for login/signup/session management.
- Forbinde frontend til backend API'erne (defineret i Fase 1) for at hente og vise rigtige data ved hjælp af TanStack Query.
- Implementere formularlogik for brugerinteraktioner (f.eks. afgivelse af aktieordrer, opdatering af profil).
**Status:** Ikke påbegyndt.

### F3.1: `[ ]` Opsæt TanStack Query (React Query) Provider & API Klient
*   **F3.1.1:** `[ ]` **Opret QueryClient Konfiguration (`lib/react-query.ts`):**
    *   Opret en `QueryClient` instans.
    *   Definer globale standardindstillinger:
        *   `defaultOptions: { queries: { staleTime: 1000 * 60 * 5, /* 5 minutter */ gcTime: 1000 * 60 * 30, /* 30 minutter */ refetchOnWindowFocus: true, retry: 1 /* Antal genforsøg ved fejl */ } }`. Juster disse tider baseret på applikationens natur.
*   **F3.1.2:** `[ ]` **Opret Global Providers Komponent (`app/providers.tsx`):**
    *   Denne client component skal wrappe applikationen.
    *   Inkluder `<QueryClientProvider client={queryClient}>`.
    *   Inkluder `<ReactQueryDevtools initialIsOpen={false} />` for udviklingsmiljøet.
*   **F3.1.3:** `[ ]` **Wrap Applikationen i `app/layout.tsx`:**
    *   Importer og brug `Providers` komponenten til at wrappe `{children}`.
*   **F3.1.4:** `[ ]` **Opret API Klient (`lib/apiClient.ts`):**
    *   Opret en centraliseret funktion (eller klasse/objekt med metoder) til at foretage API-kald til Flask-backend.
    *   Skal håndtere:
        *   Base URL for API'et (fra miljøvariabel `NEXT_PUBLIC_API_BASE_URL`).
        *   Standard headers som `Content-Type: application/json` og `Accept: application/json`.
        *   Automatisk tilføjelse af Firebase ID token til `Authorization: Bearer <token>` headeren (se F3.2.5).
        *   Standardiseret fejlhåndtering:
            *   Parse JSON-fejlrespons fra backend.
            *   Kaste en struktureret fejl (f.eks. en custom `ApiError` klasse med `status` og `message`), som TanStack Query kan håndtere.
        *   Eksempel på en GET funktion: `async function apiClientGet<T>(endpoint: string): Promise<T> { ... }`.

### F3.2: `[ ]` Implementer Firebase Autentificering Flow
*   **F3.2.1:** `[ ]` **Integrer Firebase SDK Auth Funktioner i UI-komponenter:**
    *   I Login/Signup/Reset Password siderne (`app/(auth)/...`):
        *   Brug Firebase SDK funktioner fra `firebase/auth` (initialiseret i `lib/firebase.ts`).
        *   `signInWithEmailAndPassword` (Login side).
        *   `createUserWithEmailAndPassword` (Signup side).
        *   `sendPasswordResetEmail` (Reset Password side).
        *   `signOut` (til en "Log ud" knap i Header/Brugermenu).
        *   `GoogleAuthProvider` og `signInWithPopup` (for Google login knap).
*   **F3.2.2:** `[ ]` **Formularhåndtering og Validering:**
    *   Integrer `react-hook-form` og `zod` på Login/Signup/Reset Password formularerne for inputvalidering (f.eks. gyldig email, password styrke, match mellem password og confirm password, påkrævet invite code).
    *   Vis valideringsfejl til brugeren.
    *   Håndter `onSubmit` med de relevante Firebase auth funktioner.
*   **F3.2.3:** `[ ]` **Global Auth State med Zustand (`store/authStore.ts`):**
    *   Opret en Zustand store til at holde styr på:
        *   `user: firebase.User | null` (Firebase user object).
        *   `firebaseIdToken: string | null` (Firebase ID token).
        *   `isLoading: boolean` (status for auth-processer, f.eks. initial tjek).
        *   `error: string | null` (auth-fejlmeddelelser).
        *   `localUserProfile: UserProfile | null` (brugerens detaljerede profil fra backend, se F3.2.7).
    *   Brug `onAuthStateChanged` (fra `firebase/auth`) i en `useEffect` i en global komponent (f.eks. i `Providers.tsx` eller en dedikeret `AuthListener.tsx` komponent, der wrappes i `layout.tsx`):
        *   Når auth state ændres (login/logout):
            *   Opdater `user` i store'en.
            *   Hvis bruger logger ind, hent Firebase ID token (`user.getIdToken()`) og gem det i store'en.
            *   Hvis bruger logger ud, nulstil `user`, `firebaseIdToken`, og `localUserProfile`.
        *   Sæt `isLoading` til `false` efter den initiale auth state er bestemt.
    *   *Bemærkning: Firebase SDK håndterer automatisk refresh af ID tokens i baggrunden.*
*   **F3.2.4:** `[ ]` **Custom Hook `hooks/useAuth.ts`:**
    *   Opret en custom hook `useAuth` der returnerer data og actions fra `authStore` (f.eks. `isAuthenticated: boolean`, `currentUser: firebase.User | null`, `token: string | null`, `profile: UserProfile | null`, `isLoadingAuth: boolean`, `loginWithEmail: (...) => Promise<void>`, `logout: () => Promise<void>`, etc.).
*   **F3.2.5:** `[ ]` **Send Firebase ID Token med API Kald i `lib/apiClient.ts`:**
    *   Modificer `apiClient` (fra F3.1.4) så den:
        *   Henter det aktuelle Firebase ID token fra `authStore` (eller direkte via `firebase.auth().currentUser?.getIdToken(true)` hvis nødvendigt at force refresh).
        *   Inkluderer token'et i `Authorization: Bearer <token>` headeren for alle kald til beskyttede Flask-backend endpoints.
        *   Håndter tilfælde hvor token ikke er tilgængeligt (bruger er ikke logget ind).
*   **F3.2.6:** `[ ]` **Sidebeskyttelse (Protected Routes):**
    *   Implementer en mekanisme til at beskytte sider/routes, der kræver login (f.eks. Profil, Aktiedyst Dashboard).
    *   **Anbefalet Metode (Client-side med Layout/Wrapper):**
        *   Opret en `ProtectedRoute.tsx` wrapper-komponent.
        *   Denne komponent bruger `useAuth` hook'en.
        *   Hvis `isLoadingAuth` er `true`, vis en global loader (f.eks. fuldskærms spinner).
        *   Hvis `!isAuthenticated` og `!isLoadingAuth`, redirect til `/login` (brug `useRouter` fra `next/navigation`).
        *   Hvis `isAuthenticated`, render `{children}`.
        *   Anvend denne wrapper i layouts for beskyttede rute-grupper eller på individuelle sider.
    *   *Alternativ (Next.js Middleware): Kan overvejes for mere server-side kontrol, men kan være mere komplekst at synkronisere med client-side Firebase auth state.*
*   **F3.2.7:** `[ ]` **Synkroniser/Hent Lokal Brugerprofil efter Firebase Login:**
    *   Efter succesfuld Firebase login/signup (og `onAuthStateChanged` har opdateret `authStore`):
        *   **Sync/Register med Backend:** Kald backend `POST /api/v1/auth/register_or_sync_firebase_user`. Dette sikrer, at en lokal brugerprofil er oprettet/synkroniseret med `firebase_uid`. Frontend sender Firebase ID token.
        *   **Hent Lokal Profil:** Efter succesfuld sync, kald backend `GET /api/v1/users/me/profile` (med Firebase ID token) for at hente den fulde lokale brugerprofil.
        *   Gem denne profil i `authStore.localUserProfile`.
    *   Denne logik kan placeres i en `useEffect` i `AuthListener.tsx` eller kaldes manuelt efter login-funktionerne.

### F3.3: `[ ]` Hent Data til Live Sports (med TanStack Query)
*   **F3.3.1:** `[ ]` **Liste af Sportsgrene (`/api/v1/sports`):**
    *   I `app/(dashboard)/live-sports/page.tsx` (eller en underkomponent for sportsvælgeren):
        *   Brug `useQuery` fra TanStack Query.
        *   `queryKey`: `['sportsList']`.
        *   `queryFn`: `() => apiClientGet<Sport[]>('/sports')` (hvor `Sport` er en TypeScript type).
        *   Brug de hentede data til at populere Tabs/dropdowns for sport/liga-valg (fra F2.4.2).
*   **F3.3.2:** `[ ]` **Liste af Ligaer pr. Sport (`/api/v1/sports/{sportId}/leagues`):**
    *   Når en sport vælges:
        *   `queryKey`: `['leagues', sportId]`.
        *   `queryFn`: `() => apiClientGet<League[]>(`/sports/${sportId}/leagues`)`.
        *   Brug data til at populere liga-vælgeren.
*   **F3.3.3:** `[ ]` **Liste af Kampe (`/api/v1/sports/{sportId}/matches` eller `/api/v1/matches?params...`):**
    *   Når sport, liga, dato, status filtre ændres:
        *   `queryKey`: Dynamisk, f.eks. `['matches', { sportId, leagueId, date, status }]`.
        *   `queryFn`: Kald til `apiClientGet` med de korrekte query parametre.
        *   Brug de hentede data til at populere `LiveMatchRow` komponenter i tabellen (fra F2.4.3).
*   **F3.3.4:** `[ ]` **Håndter Loading & Error States:**
    *   Brug `isLoading`, `isFetching`, `isError`, `error` fra `useQuery` resultatet.
    *   Vis Shadcn `Skeleton` komponenter (eller lignende) for tabeller/lister mens data hentes.
    *   Vis en passende fejlmeddelelse (f.eks. fra `error.message` eller en generisk "Kunne ikke hente data") hvis API-kald fejler.

### F3.4: `[ ]` Hent Data & Implementer Interaktioner for Aktiedyst (med TanStack Query)
*   For `app/(dashboard)/aktiedyst/page.tsx` og relaterede komponenter:
    *   **F3.4.1:** `[ ]` **Portefølje (`/api/v1/aktiedyst/portfolio`):**
        *   `queryKey: ['aktiedystPortfolio']`.
        *   `queryFn: () => apiClientGet<Portfolio>('/aktiedyst/portfolio')`.
        *   Brug data til nøgletal (F2.5.2) og porteføljetabel (F2.5.3).
    *   **F3.4.2:** `[ ]` **Transaktioner (`/api/v1/aktiedyst/transactions`):**
        *   `queryKey: ['aktiedystTransactions', { page, perPage, type, symbol }]` (dynamisk baseret på filtre).
        *   `queryFn: () => apiClientGet<PaginatedResponse<Transaction>>('/aktiedyst/transactions?params...')`.
        *   Brug på profilens transaktionshistorik-fane (F2.3.3).
    *   **F3.4.3:** `[ ]` **Markeder/Aktier (`/api/v1/aktiedyst/markets`):**
        *   `queryKey: ['aktiedystMarkets', { page, perPage, search, sector, exchange }]`.
        *   `queryFn: () => apiClientGet<PaginatedResponse<MarketStock>>('/aktiedyst/markets?params...')`.
        *   Bruges til en "Find Aktier" side/sektion.
    *   **F3.4.4:** `[ ]` **Aktiehistorik (`/api/v1/aktiedyst/markets/{symbol}/history`):**
        *   Når en aktie vælges til grafen:
        *   `queryKey: ['aktiedystMarketHistory', symbol, { period, interval }]`.
        *   `queryFn: () => apiClientGet<StockHistory>(`/aktiedyst/markets/${symbol}/history?params...`)`.
        *   Opdater `StockChart.tsx` (fra F2.5.4) til at acceptere og rendre disse data dynamisk.
*   **F3.4.5:** `[ ]` **Implementer Handelsformular (Order Submission):**
    *   I "Handels-Widget" Dialog (fra F2.5.5):
        *   Brug `react-hook-form` + `zod` for validering af ordre-input (symbol, type, antal, limitpris hvis relevant).
        *   Brug `useMutation` (fra TanStack Query) til at sende ordren til `POST /api/v1/aktiedyst/orders`.
        *   `mutationFn: (orderData: OrderRequest) => apiClientPost('/aktiedyst/orders', orderData)`.
        *   `onSuccess`:
            *   Vis succesnotifikation (Sonner toast, se F3.6).
            *   Invalider relevante queries for at genopfriske data:
                *   `queryClient.invalidateQueries({ queryKey: ['aktiedystPortfolio'] })`.
                *   `queryClient.invalidateQueries({ queryKey: ['aktiedystTransactions'] })`.
                *   (Evt. opdater cash balance i `authStore.localUserProfile` eller invalider profildata).
            *   Luk dialogen og/eller reset formularen.
        *   `onError: (error: ApiError)`: Vis fejlnotifikation (f.eks. "Utilstrækkelige midler", "Marked lukket").

### F3.5: `[ ]` Hent Data til Forum & Andre Sider (med TanStack Query)
*   **F3.5.1:** `[ ]` **Forum Kategorier (`/api/v1/forum/categories`):**
    *   På `app/(dashboard)/forum/page.tsx`.
    *   `queryKey: ['forumCategories']`.
    *   `queryFn: () => apiClientGet<ForumCategory[]>('/forum/categories')`.
*   **F3.5.2:** `[ ]` **Tråde i Kategori (`/api/v1/forum/categories/{categoryIdOrSlug}/threads`):**
    *   På `app/(dashboard)/forum/[categoryIdOrSlug]/page.tsx`.
    *   `queryKey: ['forumThreads', categoryIdOrSlug, { page, perPage, sortBy, sortOrder }]`.
    *   `queryFn: ...`.
*   **F3.5.3:** `[ ]` **Posts i Tråd (`/api/v1/forum/threads/{threadIdOrSlug}/posts`):**
    *   På `app/(dashboard)/forum/threads/[threadIdOrSlug]/page.tsx`.
    *   `queryKey: ['forumPosts', threadIdOrSlug, { page, perPage, sortOrder }]`.
    *   `queryFn: ...`.
*   **F3.5.4:** `[ ]` **Brugerprofil Data Opdatering:**
    *   I `app/(dashboard)/profile/page.tsx` (F2.3.3):
        *   Brugerens data hentes initielt via `authStore` (F3.2.7).
        *   For `PUT /api/v1/users/me/profile` (når bruger gemmer ændringer):
            *   Brug `useMutation`.
            *   `mutationFn: (profileUpdateData: UpdateProfileRequest) => apiClientPut('/users/me/profile', profileUpdateData)`.
            *   `onSuccess`: Opdater `authStore.localUserProfile` med den returnerede profil, vis succesnotifikation.
            *   `onError`: Vis fejlnotifikation.
*   *Overvejelse fra planen: "...eller direkte fra Firebase Firestore hvis dele er flyttet dertil." Dette er primært relevant for Fase 6. Indtil da hentes data fra Flask API'er.*

### F3.6: `[ ]` API Error Handling & Notifikationer (Globalt)
*   **F3.6.1:** `[ ]` **Centraliseret Notifikationssystem med Sonner:**
    *   Sørg for at Sonner's `<Toaster />` komponent er inkluderet i den globale layout (f.eks. i `app/providers.tsx` eller `app/layout.tsx`).
    *   Konfigurer position og stil for toasts.
*   **F3.6.2:** `[ ]` **Vis Notifikationer for API Interaktioner:**
    *   I `apiClient.ts`: Overvej en global `onError` handler, der kan vise en generisk fejl-toast, hvis fejlen ikke håndteres specifikt af `useQuery`/`useMutation`.
    *   I `useQuery` `onError` callbacks: Kald `toast.error('Fejl: Kunne ikke hente [data type]. Prøv igen senere.')`.
    *   I `useMutation` `onSuccess` callbacks: Kald `toast.success('[Handling] lykkedes!')`.
    *   I `useMutation` `onError` callbacks: Kald `toast.error(error.message || 'Noget gik galt.')`.
    *   Gør fejlmeddelelser informative og handlingsorienterede hvor muligt.

---

## Fase 4: Real-time Implementering (`apps/frontend/` & `apps/backend/`)
**Mål:** At integrere live-opdateringer fra backend (Flask-SocketIO, og potentielt Firebase Realtime services) ind i frontend for en dynamisk og øjeblikkelig brugeroplevelse, især for sportsresultater, aktiekurser og notifikationer.
**Status:** Backend-forberedelse er lavet (F1.7). Frontend-integration er ikke påbegyndt.

### F4.1: `[ ]` Etabler WebSocket Forbindelse til Flask-SocketIO (Frontend)
*   **F4.1.1:** `[ ]` **Opret Custom Hook `hooks/useSocket.ts`:**
    *   Denne hook skal initialisere og administrere `socket.io-client` instansen.
    *   Brug `useEffect` til at oprette forbindelse når komponenten mounter (eller når bruger er logget ind) og rydde op (disconnect) ved unmount.
    *   Gem socket-instansen i en `useRef` for at undgå at den genoprettes ved hver re-render.
    *   Initialiser socket med URL til Flask-backend (fra miljøvariabel `NEXT_PUBLIC_SOCKET_URL`).
*   **F4.1.2:** `[ ]` **Socket.IO Autentificering med Firebase ID Token:**
    *   I `useSocket` hook'en:
        *   Før `socket.connect()` kaldes, hent det aktuelle Firebase ID token (fra `useAuth()` hook'en, F3.2.4).
        *   Send token'et som en query parameter (f.eks. `query: { token: firebaseIdToken }`) eller i `auth` optionen i `io()` konstruktøren, som backend forventer (F1.7.2).
        *   Håndter scenariet hvor token ikke er tilgængeligt (bruger ikke logget ind) - undlad at forbinde, eller forbind uden auth hvis visse public events er tilladt.
        *   Hook'en skal håndtere re-connects og sikre, at et frisk token er vedhæftet, hvis muligt (Socket.IO client har `auth` option, der kan være en funktion).
*   **F4.1.3:** `[ ]` **Håndter Standard Socket Events i `useSocket`:**
    *   Opsæt listeners for `connect`, `disconnect`, `connect_error`.
    *   Log disse events for debugging (kun i udvikling).
    *   Opdater evt. en global Zustand store (`socketStore.ts`?) med forbindelsesstatus (`connected: boolean`, `error: string | null`).
*   **F4.1.4:** `[ ]` **Gør Socket-instansen og Event Abstraktioner Tilgængelig:**
    *   `useSocket` hook'en kan returnere:
        *   Selve socket-instansen (for direkte brug, men med forsigtighed).
        *   Funktioner til at abonnere (`on(eventName, callback)`) og afmelde (`off(eventName, callback)`).
        *   Funktioner til at udsende events (`emit(eventName, data)`).
        *   Forbindelsesstatus.
    *   Brug hook'en i de komponenter/sider, der har brug for realtidsdata. Overvej en global context hvis socket-instansen skal være bredt tilgængelig, men en hook er ofte mere fleksibel.

### F4.2: `[ ]` Live Sports Opdateringer (Frontend)
*   **F4.2.1:** `[ ]` **Abonner på Specifikke Kamp-Events (`subscribe_to_match_scores`):**
    *   Når en bruger ser på en liste af live kampe eller en specifik kampdetalje-side, der viser live data:
        *   I den relevante komponent, brug `useSocket` hook'en.
        *   `useEffect` til at `socket.emit('subscribe_to_match_scores', { match_ids: ['id1', 'id2', ...] })` for de synlige/relevante kampe.
        *   Backend skal håndtere dette ved at joine klienten til de korrekte `match_{matchId}` rooms.
        *   Sørg for at `socket.emit('unsubscribe_from_match_scores', { match_ids: [...] })` kaldes når komponenten unmountes eller `match_ids` ændres.
*   **F4.2.2:** `[ ]` **Lyt til `live_score_update` Event:**
    *   Opsæt en listener: `socket.on('live_score_update', (updatedMatchData) => { ... })`.
*   **F4.2.3:** `[ ]` **Opdater UI med Nye Data via TanStack Query:**
    *   Når `live_score_update` modtages for en kamp:
        *   Brug `queryClient.setQueryData(['matches', filters], (oldData) => { /* find og opdater den specifikke kamp i listen */ })`.
        *   For en detaljeside: `queryClient.setQueryData(['matchDetails', matchId], (oldData) => ({ ...oldData, ...updatedMatchData }))`.
        *   Dette vil automatisk re-rendre de komponenter, der bruger disse query keys.
        *   Undgå direkte state-manipulation i komponenterne, hvis data primært styres af TanStack Query.
*   **F4.2.4:** `[ ]` **Visuelle Effekter for Opdateringer (Framer Motion):**
    *   Overvej subtile animationer/fremhævninger når en score, tid, eller status opdateres i `LiveMatchRow.tsx` (f.eks. kortvarig baggrundsfarve-flash, tal der "tæller op/ned").

### F4.3: `[ ]` Aktiedyst Opdateringer (Frontend - Real-time priser hvis relevant)
*   **F4.3.1:** `[ ]` **Abonner på Marked/Symbol Events (`subscribe_to_market_data`):**
    *   Tilsvarende Live Sports: Når brugeren ser på markedslisten, sin portefølje, eller en specifik aktieside:
        *   `socket.emit('subscribe_to_market_data', { symbols: ['AAPL', 'MSFT', ...] })`.
        *   Backend joiner klienten til `aktiedyst_market_{symbol}` rooms.
        *   Husk `unsubscribe_from_market_data`.
*   **F4.3.2:** `[ ]` **Lyt til `stock_price_update` Event:**
    *   Opsæt `socket.on('stock_price_update', (priceUpdateData: { symbol: string, current_price_dkk: number, change_today_percentage: number, ... }) => { ... })`.
*   **F4.3.3:** `[ ]` **Opdater UI med Nye Prisdata via TanStack Query:**
    *   Brug `queryClient.setQueryData` til at opdatere cachen for:
        *   Markedslisten (`['aktiedystMarkets', filters]`).
        *   Porteføljen (`['aktiedystPortfolio']` - opdater `current_price_dkk` og genberegn `market_value_dkk`, `pnl_dkk` for den pågældende holding).
        *   Den aktive aktiegraf (`['aktiedystMarketHistory', symbol, params]` - tilføj nyt datapunkt hvis intervallet er fint nok, ellers invalider for re-fetch).

### F4.4: `[ ]` Real-time Notifikationer (Frontend)
*   **F4.4.1:** `[ ]` **Backend Udsendelse (Flask/Socket.IO eller Firebase Cloud Messaging):**
    *   Backend (F1.7.4/F1.7.8) skal kunne udsende generiske notifikationsevents (f.eks. `user_notification`) til specifikke brugere (via `user_{firebaseUserId}` room på Socket.IO).
    *   Typer af notifikationer: Ny forum-besvarelse på fulgt tråd, aktieordre udfyldt, ny besked i chat, admin-besked.
    *   *Alternativ/Supplement:* Firebase Cloud Messaging (FCM) for push-notifikationer (web/mobil), hvis det bliver et krav.
*   **F4.4.2:** `[ ]` **Frontend Lytter efter Notifikationer:**
    *   I `useSocket` (eller en global komponent der bruger hook'en), lyt til `socket.on('user_notification', (notificationData: UserNotification) => { ... })`.
*   **F4.4.3:** `[ ]` **Vis Notifikationer:**
    *   Brug Sonner (`toast.info(notificationData.message)`) til at vise en øjeblikkelig notifikation.
    *   Overvej et notifikationscenter/ikon i Header'en:
        *   En lille `Badge` med antal ulæste notifikationer.
        *   En `DropdownMenu` eller `Popover` der viser en liste af seneste notifikationer.
        *   Data til notifikationscenteret kan enten pushes via socket og gemmes i en Zustand store, eller hentes via et API endpoint (`/api/v1/users/me/notifications`).

### F4.5: `[ ]` Performance Optimering for Real-time (Frontend & Backend)
*   **Frontend:**
    *   **`React.memo`:** Brug `React.memo` på komponenter, der modtager hyppige prop-opdateringer fra realtidsdata (som `LiveMatchRow`, `PortfolioHoldingRow`), for at undgå unødvendige re-renders, hvis props reelt ikke har ændret sig dybt. Sørg for korrekt `areEqual` funktion hvis props er komplekse objekter.
    *   **Selektiv Rendering & Minimale Opdateringer:** Sørg for at kun de dele af UI'en, der er direkte påvirket af realtidsdata, re-renderes. Undgå at opdatere store dele af global state unødvendigt. TanStack Query's cache-opdateringer er generelt effektive, men vær opmærksom på hvordan data struktureres og opdateres i cachen.
    *   **Debouncing/Throttling:** For meget hyppige events (f.eks. musebevægelser for interaktive grafer, hvis det implementeres), overvej debouncing eller throttling af event handlers.
*   **Backend (Flask-SocketIO):**
    *   **Send Kun Ændrede Data (Delta Updates):** Når en Socket.IO event udsendes, send kun de data, der reelt er ændret, i stedet for hele objektet, for at minimere payload-størrelse.
    *   **Effektiv Room Management:** Sørg for, at brugere kun er i de rooms, de aktivt har brug for. Ryd op i room-medlemskaber når de ikke længere er nødvendige.
    *   **Asynkron Event Udsendelse:** Hvis generering af data til en Socket.IO event er tidskrævende (f.eks. kræver DB-kald), overvej at køre det asynkront (f.eks. med Celery der så sender beskeden til Socket.IO processen via en message queue som Redis), så det ikke blokerer hoved-request-tråden eller Socket.IO event loop.
*   **Generelt:**
    *   Test med mange samtidige forbindelser/events (load testing for Socket.IO) for at identificere flaskehalse.
    *   Monitorer netværkstrafik (WebSocket frames) for at sikre, at data-payloads er rimelige.

---

## Fase 5: Avancerede Features & UI/UX Polishing (`apps/frontend/` & `apps/backend/`)
**Mål:** At implementere mere komplekse funktioner, der bygger ovenpå kernefunktionaliteten, samt at forfine den samlede brugeroplevelse med fokus på detaljer, animationer, responsivitet, tilgængelighed, og potentielle kreative udvidelser.
**Status:** Nogle backend-dele (Admin API) er noteret som ikke påbegyndt. Frontend er ikke påbegyndt for disse.

### F5.1: `[ ]` Backend: Udvikling af Admin API & Frontend: Admin Interface
*   **Status fra projektplan (snippet):** Ikke påbegyndt.
*   **Backend (`apps/backend/routes/api_admin.py`):**
    *   **F5.1.1:** `[ ]` **Definition af Scope for Admin Funktionaliteter:**
        *   Brugerstyring (se/deaktiver brugere, rediger roller, se audit logs).
        *   Content Moderation i Forum (rediger/slet posts/threads, ban brugere fra forum).
        *   Sportsdata Management (manuel oprettelse/redigering af kampe/resultater, hvis ekstern API fejler eller til specielle events).
        *   Aktiedyst Konfigurationer (administrer handlebare aktier, juster spilparametre).
        *   Se systemlogs, applikationsstatistikker.
    *   **F5.1.2:** `[ ]` **Design Admin API Endpoints:**
        *   Definer URL-struktur (f.eks. `/api/v1/admin/...`).
        *   Specificer request/response JSON-strukturer for hver admin-action.
        *   API'et skal være strengt beskyttet: Kræver admin-rolle. Denne rolle kan verificeres via Firebase custom claims (sat på brugerens token) eller en lokal DB-rolle tjekket efter Firebase token validering.
    *   **F5.1.3:** `[ ]` **Implementer Admin API Endpoints i Flask:**
        *   Opret ny blueprint `admin_api_bp`.
        *   Implementer logik for hver admin-funktion, inkl. databaseinteraktioner.
        *   Sørg for grundig logning af alle admin-actions (hvem gjorde hvad, hvornår).
    *   **F5.1.4:** `[ ]` **Test Admin API Grundigt** (både funktionalitet og sikkerhed).
*   **Frontend (`apps/frontend/app/(admin)/...`):**
    *   **F5.1.5:** `[ ]` **Opret Admin Interface Route Group:** `app/(admin)/dashboard/page.tsx` etc. Beskyttet så kun admins har adgang.
    *   **F5.1.6:** `[ ]` **Design og Implementer Admin UI-Komponenter:** Brug Shadcn/ui og TanStack Query/Mutation til at interagere med Admin API'et. Fokus på funktionalitet og klarhed frem for avanceret design i første omgang.

### F5.2: `[ ]` Frontend & Backend: Avancerede Aktiedyst Features
*   **Frontend (`StockChart.tsx` og handels-widget):**
    *   **F5.2.1:** `[ ]` **Udvidet StockChart Komponent:**
        *   Tilføj mulighed for at vælge forskellige graf-typer (linje, candlestick, område) i `StockChart.tsx`.
        *   Implementer simple tekniske indikatorer (f.eks. Moving Averages (SMA, EMA), RSI - Recharts understøtter custom elementer, eller overvej et mere specialiseret chart-bibliotek som TradingView Lightweight Charts hvis Recharts bliver for begrænset).
        *   Tilføj zoom/pan funktionalitet til grafen.
        *   Mulighed for at sammenligne med indeks eller anden aktie.
        *   *Kræver: Potentielt mere detaljerede data fra backend API eller client-side beregninger.*
    *   **F5.2.2:** `[ ]` **Avancerede Ordretyper:**
        *   Udvid handels-widget/dialog (fra F2.5.5 og F3.4.5) til at understøtte "Limit" og "Stop" (Stop-Loss) ordretyper.
        *   Tilføj inputfelter for limit pris / stop pris.
        *   Tilføj "Time in force" option (f.eks. Day, GTC - Good 'Til Cancelled).
        *   *Kræver: Backend `POST /api/v1/aktiedyst/orders` (F1.5.5) skal kunne håndtere og processere disse ordretyper korrekt.*
*   **Backend & Frontend:**
    *   **F5.2.3:** `[ ]` **Watchlist Funktionalitet:**
        *   **Backend API:**
            *   `GET /api/v1/aktiedyst/watchlist` (Hent brugerens watchlist).
            *   `POST /api/v1/aktiedyst/watchlist` (Body: `{ "symbol": "AAPL" }` - Tilføj symbol).
            *   `DELETE /api/v1/aktiedyst/watchlist/{symbol}` (Fjern symbol).
            *   Alle beskyttet med Firebase Auth.
        *   **Backend DB:** Ny model for `UserWatchlistItems`.
        *   **Frontend UI:**
            *   Design UI for at brugere kan se, tilføje, og fjerne aktier fra en personlig watchlist.
            *   Vis watchlist et passende sted (f.eks. sidebar, separat fane på Aktiedyst dashboard) med realtids kursopdateringer.
            *   Brug TanStack Query/Mutation til at interagere med watchlist API'et.

### F5.3: `[ ]` Frontend & Backend: Avancerede Live Sports Features
*   **Frontend (`app/(dashboard)/live-sports/[matchId]/page.tsx`):**
    *   **F5.3.1:** `[ ]` **Detaljeret Kampvisningsside:**
        *   Opret dynamisk route for individuelle kampe.
        *   Hent detaljerede kampdata fra `GET /api/v1/matches/{matchId}` (backend F1.4).
        *   Vis omfattende information:
            *   Score, tid, status (live-opdateret via Socket.IO F4.2).
            *   Events (mål, kort - med ikoner og tidsstempler).
            *   Lineups (hvis tilgængeligt).
            *   Statistik (boldbesiddelse, skud på mål, hjørnespark etc. - live-opdateret hvis muligt).
            *   H2H (head-to-head) data.
            *   Spillested info.
            *   (Valgfrit) Betting odds fra API (hvis inkluderet).
        *   UI-design inspireret af FlashScore/Bet365 detaljesider, med faner for "Oversigt", "Statistik", "Lineups", "H2H".
*   **Backend & Frontend:**
    *   **F5.3.2:** `[ ]` **Favoritmarkering af Kampe/Ligaer/Hold:**
        *   **Backend API:** Endpoints til at håndtere brugerfavoritter (svarende til watchlist for aktier).
            *   `GET /api/v1/users/me/favorites?type=[match|league|team]`
            *   `POST /api/v1/users/me/favorites` (Body: `{ "type": "match", "item_id": "match_123" }`)
            *   `DELETE /api/v1/users/me/favorites/{favoriteId}`
        *   **Backend DB:** Ny model for `UserFavorites`.
        *   **Frontend UI:**
            *   Tillad brugere at markere kampe, ligaer eller hold som favoritter (f.eks. stjerne-ikon).
            *   Vis favoritter prominent (f.eks. en "Mine Favoritter" sektion på sportsforsiden) eller i en personaliseret oversigt.

### F5.4: `[ ]` Frontend & Backend: Forum Implementering (Fuld CRUD)
*   **Backend API (Udvidelse af F1.6):**
    *   Sørg for at følgende er fuldt implementeret og testet (V1/V2/V3/V4 nævner CRUD er lavet, men specificer her for fuldstændighed):
        *   `POST /api/v1/forum/categories/{categoryIdOrSlug}/threads` (Opret Tråd).
        *   `PUT /api/v1/forum/threads/{threadIdOrSlug}` (Opdater Tråd - titel, sticky, locked. Kun forfatter/moderator).
        *   `DELETE /api/v1/forum/threads/{threadIdOrSlug}` (Slet Tråd - Kun forfatter/moderator).
        *   `PUT /api/v1/forum/posts/{postId}` (Opdater Post - body. Kun forfatter/moderator).
        *   `DELETE /api/v1/forum/posts/{postId}` (Slet Post - Kun forfatter/moderator).
        *   Alle relevante endpoints skal være beskyttet og tjekke forfatter-ejerskab eller moderator/admin-rettigheder.
*   **Frontend Integration:**
    *   **F5.4.1:** `[ ]` **Opret Ny Tråd Side/Modal:**
        *   UI med formular (Shadcn `Input` for titel, `Textarea` for brødtekst - overvej en simpel Markdown editor som `react-markdown` eller en mere avanceret som `Milkdown` / `TipTap` for WYSIWYG-lignende oplevelse).
        *   Brug `useMutation` til `POST /api/v1/forum/categories/{categoryIdOrSlug}/threads`.
        *   Ved succes: Invalider relevante trådliste-queries, naviger til den nye tråd.
    *   **F5.4.2:** `[ ]` **Skriv Svar/Post (i Tråd-visning):**
        *   UI med formular for brødtekst (med Markdown editor) i bunden af post-listen eller via "Svar"-knap.
        *   Brug `useMutation` til `POST /api/v1/forum/threads/{threadIdOrSlug}/posts`.
        *   Ved succes: Invalider/opdater post-listen (TanStack Query kan automatisk tilføje den nye post til cachen baseret på respons).
    *   **F5.4.3:** `[ ]` **Redigering/Sletning af Tråde/Posts:**
        *   Tilføj UI-elementer (f.eks. dropdown-menu per post/tråd) for "Rediger" / "Slet".
        *   Vis kun for ejer eller moderator/admin.
        *   Redigering åbner en modal/inline editor med postens/trådens nuværende indhold.
        *   Brug `useMutation` for PUT/DELETE kaldene.
        *   Ved succes: Invalider/opdater lister, vis notifikation.
    *   *Overvejelse (Fase 6): Skal forum-posts (især nye) også skrives til Firebase RTDB/Firestore for øjeblikkelig visning for andre brugere, udover Socket.IO push? Dette kan give en mere robust realtidsoplevelse.*

### F5.5: `[ ]` Animationer & Overgange (Framer Motion & evt. Anime.js)
*   **F5.5.1:** `[ ]` **Identificer Steder for Forbedret UX med Animation:**
    *   Sideovergange (subtile fades, slides, eller mere kreative overgange mellem hovedsektioner).
    *   Modal-animationer (glidende/skalerende åbning/lukning af `Dialog` komponenter).
    *   Hover-effekter på interaktive elementer (knapper, kort, links).
    *   Animerede loaders/skeletons for en mere flydende og engagerende loading-oplevelse.
    *   Listeelementer, der animeres ind ved load eller når nye data tilføjes (f.eks. nye forum-posts, nye kampe).
    *   Animation af diagrammer/grafer (f.eks. når data opdateres i `StockChart`).
*   **F5.5.2:** `[ ]` **Implementer med Framer Motion:**
    *   Brug `motion` komponenter (`motion.div`, `motion.button`, etc.).
    *   Brug `animate` prop, `variants`, `whileHover`, `whileTap`, `layout` prop for animerede layout-ændringer.
    *   Brug `AnimatePresence` for enter/exit animationer af komponenter.
*   **F5.5.3:** `[ ]` **Vurder Behov for Anime.js (eller lignende imperative biblioteker som GSAP):**
    *   Hvis der er meget specifikke, komplekse sekventielle eller timeline-baserede animationer, som er svære eller ineffektive at opnå elegant med Framer Motion's deklarative API.
    *   Eksempler: Komplekse SVG-path animationer, karakteranimationer, avancerede intro-sekvenser, eller hvis der er behov for meget finkornet kontrol over animations-timing og -easing på tværs af flere uafhængige elementer.
    *   *Som originalt noteret: dette er "efter behov" og bør reserveres til specielle tilfælde.*

### F5.6: `[ ]` Responsivt Design Finpudsning
*   **F5.6.1:** `[ ]` **Grundig Test på Forskellige Skærmstørrelser og Enheder:**
    *   Mobil (små: ~320px, mellem: ~375px, store: ~425px).
    *   Tablet (portræt: ~768px, landskab: ~1024px).
    *   Desktop (forskellige bredder op til store skærme).
    *   Brug browser devtools, fysiske enheder, og evt. services som BrowserStack.
*   **F5.6.2:** `[ ]` **Juster Tailwind Breakpoints & Utility Klasser:**
    *   Brug Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) konsekvent for at justere layout (grids, flexbox), størrelser, typografi, synlighed etc.
    *   Sørg for, at interaktive elementer (knapper, links, inputfelter) er lette at trykke på (tilstrækkelig størrelse og afstand) på touch-skærme.
    *   Test læsbarhed af tekst og visuel hierarki på alle skærmstørrelser.
    *   Overvej "mobile-first" tilgang til styling.

### F5.7: `[ ]` Tilgængelighed (a11y) Review & Forbedringer
*   **F5.7.1:** `[ ]` **Semantisk HTML:**
    *   Gennemgå applikationen for korrekt brug af HTML5 elementer (`<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`, `<header>`, `<button>`, etc.).
    *   Sørg for, at `<h1>`-`<h6>` bruges korrekt for sidehierarki.
*   **F5.7.2:** `[ ]` **Tastaturnavigation:**
    *   Test at hele applikationen kan navigeres og interageres med KUN ved brug af tastatur (Tab, Shift+Tab, Enter, Space, Escape, piletaster).
    *   Sørg for synlige og klare `:focus` outlines for alle interaktive elementer (Tailwind's `focus-visible:` utility er nyttig).
*   **F5.7.3:** `[ ]` **ARIA-Attributter:**
    *   Brug ARIA-attributter hvor nødvendigt for at forbedre semantikken for skærmlæsere, især for custom interaktive komponenter.
    *   Shadcn/ui komponenter (baseret på Radix UI) er generelt gode her, men tjek custom implementeringer.
    *   F.eks. `aria-label` for ikon-knapper, `aria-describedby` for inputfelter med fejlmeddelelser, `role` for custom widgets, `aria-live` for dynamiske opdateringer.
*   **F5.7.4:** `[ ]` **Test med a11y Værktøjer:**
    *   Brug browserudvidelser som axe DevTools, Lighthouse (har a11y audit), eller WAVE.
    *   Test med en skærmlæser (f.eks. NVDA, VoiceOver, JAWS).
*   **F5.7.5:** `[ ]` **Farvekontrast:**
    *   Sørg for tilstrækkelig kontrast mellem tekst og baggrundsfarver (WCAG AA minimum 4.5:1 for normal tekst, 3:1 for stor tekst). Brug kontrast-check værktøjer.
*   **F5.7.6:** `[ ]` **Alternativ Tekst for Billeder:**
    *   Sørg for, at alle `<img>` tags har meningsfulde `alt` attributter (eller `alt=""` for rent dekorative billeder).

### F5.8: `[ ]` Dark Mode Implementering
*   **F5.8.1:** `[ ]` **Implementer Tema-skift med `next-themes`:**
    *   Installer `next-themes` (`npm install next-themes`).
    *   Wrap applikationen med `ThemeProvider` fra `next-themes` i `app/providers.tsx`. Sæt `attribute="class"` og `defaultTheme="system"`.
    *   Opret en UI-knap/switch (f.eks. i Header eller brugerindstillinger) til at skifte mellem 'light', 'dark', 'system' temaer (brug `useTheme` hook fra `next-themes`).
*   **F5.8.2:** `[ ]` **Brug Tailwind's `dark:` Variant:**
    *   I `tailwind.config.js`, sørg for at `darkMode: 'class'` er aktiveret.
    *   Gennemgå alle komponenter (Shadcn og custom) og anvend `dark:` prefix for at style dem korrekt i dark mode (f.eks. `bg-white dark:bg-gray-900`, `text-gray-800 dark:text-gray-200`).
    *   Test farvekontrast grundigt i både light og dark mode.
    *   Shadcn/ui komponenter bør respektere dark mode out-of-the-box, men custom farver og komponenter skal tilpasses.

### F5.9: `[ ]` (Valgfrit/Kreativt) Udforsk 3D Visualiseringer
*   **Rationale:** Tilføjelse af 3D-elementer kan markant forbedre brugerengagement og differentiere platformen, især inden for data-tunge områder som aktieanalyse eller unikke sportspræsentationer.
*   **F5.9.1:** `[ ]` **Identificer Potentielle Anvendelsesområder:**
    *   **Aktiedyst:** 3D-grafer for kursudvikling, porteføljesammensætning, eller markedsdata. Interaktive 3D-modeller af virksomhedslogoer eller produkter.
    *   **Sport:** 3D-repræsentation af stadioner, boldbaner med heatmaps, eller animerede repræsentationer af nøgle-events i en kamp.
    *   **Gamification:** 3D-avatarer, badges, eller trofæer.
*   **F5.9.2:** `[ ]` **Vurder Teknologier:**
    *   **React Three Fiber (`@react-three/fiber`):** En populær React renderer for Three.js, der gør det nemt at integrere 3D-scener i React-applikationer.
    *   **Three.js:** Et kraftfuldt WebGL-bibliotek for 3D-grafik.
    *   **Spline, Vectary:** Designværktøjer, der kan eksportere 3D-scener til web.
*   **F5.9.3:** `[ ]` **Prototyping:**
    *   Start med en lille, isoleret prototype for at vurdere kompleksitet, performance og brugeroplevelsesværdi.
    *   Fokuser på performance, da 3D-grafik kan være ressourcekrævende. Optimer modeller og brug teknikker som "lazy loading".
*   *Bemærkning: Dette er en avanceret feature og bør kun påbegyndes, hvis kernefunktionaliteten er solid, og der er klare fordele ved 3D-integration.*

---

## Fase 6: Yderligere Firebase Integration (Udvidelsesmuligheder)
**Mål:** At udnytte Firebase's økosystem yderligere for at forbedre specifikke funktionaliteter, øge skalerbarheden eller forenkle udviklingsprocesser for visse features, der passer godt til Firebase's styrker.
**Status:** Ikke påbegyndt.

### F6.1: `[ ]` Firestore/Realtime Database (RTDB) for Specifikke Features
*   **Rationale:** Firebase databaser (især RTDB for ultra-low latency og simpel datastruktur, Firestore for komplekse queries/større skalerbarhed og rigere datamodellering) er gode til features, der kræver intens realtidsinteraktion eller ikke passer optimalt ind i den relationelle model i den primære SQL-database.
*   **F6.1.1:** `[ ]` **Overvej Feature Kandidater:**
    *   **Live Chat-funktionalitet:** RTDB eller Firestore er klassisk for chat-beskeder (lav latency, mange små skrivninger/læsninger).
    *   **Realtids Forum-kommentarer/visninger (supplement til Socket.IO):** Nye kommentarer kan skrives direkte til RTDB/Firestore og lyttes på af klienter for endnu mere robust realtid, især hvis Socket.IO forbindelsen kortvarigt tabes. Kan også bruges til "X ser denne tråd lige nu".
    *   **Avancerede Brugerindstillinger/Præferencer:** For komplekse, nestede indstillinger der ikke er simple key-value pairs, kan Firestore være en god løsning.
    *   **Activity Feeds/Notifikationslog:** "X har svaret på din tråd", "Y har købt Z aktie". Firestore kan lagre disse hændelser, og Firebase Functions kan processere dem.
    *   **Kollaborative funktioner:** F.eks. hvis flere brugere skal kunne redigere et dokument/en plan samtidigt (kræver omhyggelig data-modellering).
*   **F6.1.2:** `[ ]` **Implementer en Valgt Feature med Firebase DB:**
    *   Vælg én af ovenstående (eller en anden passende) og implementer den.
    *   Dette indebærer:
        *   Design af datastruktur i Firestore/RTDB.
        *   Frontend skriver/læser direkte til/fra Firebase DB (brug Firebase JS SDK: `getFirestore`, `onSnapshot`, `setDoc`, `addDoc` etc.).
        *   Frontend lytter til realtidsopdateringer fra Firebase DB for den valgte feature.
*   **F6.1.3:** `[ ]` **Opsæt Firebase Sikkerhedsregler:**
    *   Definer og implementer robuste sikkerhedsregler (`firestore.rules` eller `database.rules.json`) for den valgte Firebase database for at sikre, at brugere kun kan læse/skrive de data, de har tilladelse til.
    *   Regler skal være specifikke og følge "least privilege" princippet.
    *   Test reglerne grundigt med Firebase Emulator Suite (Firestore/RTDB emulator).

### F6.2: `[ ]` Firebase Storage for Filuploads
*   **F6.2.1:** `[ ]` **Identificer Anvendelsesområder:**
    *   Bruger-uploadede profilbilleder (avatars).
    *   Vedhæftede filer i forum-posts (billeder, evt. små dokumenter - definer tilladte filtyper og størrelser).
    *   Billeder/logoer til sports-ligaer/hold eller aktie-selskaber (hvis de administreres internt).
*   **F6.2.2:** `[ ]` **Frontend Integration:**
    *   Brug Firebase JS SDK (`firebase/storage`: `ref`, `uploadBytesResumable`, `getDownloadURL`) til at håndtere filuploads fra klienten.
    *   Implementer UI for filvalg (`<input type="file">`), vis upload progress (brug `on('state_changed', ...)` fra `uploadBytesResumable`).
    *   Håndter fejl under upload (f.eks. forkert filtype, for stor fil, netværksfejl).
    *   Vis preview af billeder før/efter upload.
*   **F6.2.3:** `[ ]` **Backend Integration (Reference Lagring):**
    *   Efter succesfuld upload til Firebase Storage, gem referencen (download URL eller path i Storage) i din primære Flask-database (f.eks. `avatar_storage_path` på `User` modellen, `attachment_url` på `ForumPost` modellen).
    *   Frontend sender denne URL/path til et backend API endpoint for at opdatere den relevante model.
*   **F6.2.4:** `[ ]` **Opsæt Firebase Storage Sikkerhedsregler (`storage.rules`):**
    *   Definer regler for hvem der må uploade (f.eks. kun autentificerede brugere), til hvilke paths, hvilke filtyper (`request.resource.contentType`), og størrelser (`request.resource.size`).
    *   Definer regler for hvem der må læse filer (f.eks. ofte er filer offentligt læsbare, hvis URL'en er kendt, men upload er begrænset).
    *   Test reglerne med Firebase Emulator Suite (Storage emulator).

### F6.3: `[ ]` Firebase Functions (Cloud Functions for Firebase)
*   **Rationale:** Serverless backend-logik, der kan trigges af Firebase-events (f.eks. Firestore/RTDB-skrivning, Storage-upload, Auth-events) eller HTTP-requests. Kan skrives i Node.js (anbefalet for tæt JS økosystem-integration), Python, Go, etc.
*   **F6.3.1:** `[ ]` **Identificer Brugsscenarier:**
    *   **Billedbehandling (efter upload til Storage):** Når et profilbillede uploades, kan en Function automatisk resize det til forskellige størrelser, komprimere det, eller generere thumbnails.
    *   **Sende Notifikationer:** Når en vigtig post oprettes i Firestore (f.eks. et nyt forum-svar til en fulgt tråd), kan en Function sende en push-notifikation (via FCM), email, eller en Socket.IO besked via backend.
    *   **Dataintegritet/Sanitering/Aggregering:** Udføre logik efter data er skrevet til DB (f.eks. opdatere tællere, denormalisere data for hurtigere læsning).
    *   **Webhook Handlers:** Håndtere indgående webhooks fra tredjeparts services (f.eks. betalingsgateways, sportsdata providers).
    *   **Periodiske Opgaver (Scheduled Functions):** Køre planlagte funktioner (cron jobs) f.eks. til oprydning af gamle data, generering af daglige/ugentlige rapporter, opdatering af leaderboard.
    *   **Kompleks servertung logik relateret til Firebase Auth events:** F.eks. udføre handlinger ved brugeroprettelse eller -sletning.
*   **F6.3.2:** `[ ]` **Implementer en Valgt Firebase Function:**
    *   Vælg et scenarie, skriv Function-koden i `functions/` mappen (typisk Node.js/TypeScript).
    *   Definer trigger (f.eks. `functions.storage.object().onFinalize(...)`, `functions.firestore.document(...).onCreate(...)`, `functions.https.onCall(...)`).
    *   Deploy Function'en til Firebase (`firebase deploy --only functions`).
    *   Test grundigt, både lokalt med Firebase Emulator Suite (Functions emulator) og i skyen.
    *   Håndter fejl og logning i Functions.

### F6.4: `[ ]` Firebase Hosting for Next.js Frontend (Vurdering & Evt. Implementering)
*   **Status:** Vercel er primær overvejelse for Next.js frontend deployment.
*   **F6.4.1:** `[ ]` **Evaluer Fordele/Ulemper ved Firebase Hosting vs. Vercel for Next.js:**
    *   **Vercel Fordele:**
        *   Bygget af skaberne af Next.js, dyb integration og optimal performance for Next.js features (SSR, ISR, Edge Functions, Image Optimization).
        *   Excellent Developer Experience (DX), nem Git-integration, automatiske preview deployments.
        *   Global Edge Network.
        *   Indbygget Analytics.
    *   **Firebase Hosting Fordele:**
        *   Meget tæt integration med andre Firebase services (Functions, Firestore, Auth), hvilket kan simplificere visse arkitekturer.
        *   Global CDN. Nem opsætning hvis man allerede er dybt i Firebase økosystemet.
        *   Kan være omkostningseffektiv for simple sites eller sites der primært bruger Firebase backend.
        *   Understøtter Next.js (via experimental web frameworks support eller Cloud Functions for SSR).
*   **F6.4.2:** `[ ]` **Beslutning & Eventuel Implementering/Migration:**
    *   Baseret på evaluering og projektets specifikke behov, tag en endelig beslutning.
    *   **Anbefaling:** For et komplekst Next.js projekt som Fattecentralen, er **Vercel sandsynligvis stadig det stærkeste valg** pga. den specialiserede Next.js support og performanceoptimeringer.
    *   Hvis Firebase Hosting vælges:
        *   Konfigurer `firebase.json` for hosting og Next.js integration (enten via Cloud Functions for SSR eller nyere "web frameworks" support).
        *   Opsæt CI/CD pipeline (F7.5) til at deploye til Firebase Hosting.
    *   Firebase Hosting kan dog stadig være relevant for at hoste specifikke statiske dele af applikationen, eller hvis der laves mikro-frontends, der er tæt knyttet til Firebase services.

---

## Fase 7: Testning & Deployment
**Mål:** At sikre applikationens kvalitet, stabilitet og performance gennem omfattende testning, samt at opsætte en automatiseret og pålidelig deployment pipeline for både frontend og backend.
**Status:** Basis test framework for frontend er opsat (F0.8). Backend-tests og CI/CD er ikke formelt specificeret/påbegyndt.

### F7.1: `[ ]` Unit & Integration Tests
*   **Frontend (`apps/frontend/`) - (Fortsættelse af F0.8):**
    *   **F7.1.1:** `[ ]` **Komponenttests (Jest & React Testing Library):**
        *   Skriv tests for alle UI-komponenter (især custom og feature-specifikke som `LiveMatchRow`, `PortfolioHoldingRow`, `ForumCategoryCard`).
        *   Verificer rendering baseret på forskellige props, brugerinteraktioner (klik, input), og state-ændringer.
        *   Test tilgængelighedsattributter.
    *   **F7.1.2:** `[ ]` **Hook Tests (Jest & RTL `renderHook`):** Test custom React Hooks isoleret. Mock deres afhængigheder.
    *   **F7.1.3:** `[ ]` **State Management Tests (Jest & Zustand test utilities):** Test Zustand stores (actions, selectors, initial state).
    *   **F7.1.4:** `[ ]` **API Kald Mocking:** Brug `msw` (Mock Service Worker) til at mocke API-kald (Flask backend) og Firebase SDK-interaktioner under tests. Dette giver mere realistiske tests end simpel Jest `fn().mockResolvedValue()`.
    *   **F7.1.5:** `[ ]` **Coverage Mål:** Sæt et ambitiøst, men realistisk mål for testdækning (f.eks. >80% for kritiske moduler) og følg op med `jest --coverage`.
*   **Backend (`apps/backend/`) - (Skal opsættes):**
    *   **F7.1.6:** `[ ]` **Opsæt PyTest Framework:**
        *   Installer PyTest og relevante plugins (f.eks. `pytest-flask` for test client, `pytest-cov` for coverage, `pytest-mock` for mocking).
        *   Konfigurer `pytest.ini` eller `pyproject.toml` (f.eks. for at specificere test-mappe, markører).
        *   Opret `conftest.py` for fixtures (f.eks. app context, test client, database setup/teardown).
    *   **F7.1.7:** `[ ]` **Route/Controller Tests:** Test hver API endpoint:
        *   Korrekte svar (statuskoder, JSON-struktur) baseret på forskellige inputs (gyldige, ugyldige).
        *   Autentificering og autorisationslogik (med mockede Firebase tokens).
        *   Brug Flask test client (`client.get()`, `client.post()`, etc.).
    *   **F7.1.8:** `[ ]` **Service/Logik Tests:** Test forretningslogik i service-lag/utility-funktioner isoleret. Mock databasekald og eksterne afhængigheder.
    *   **F7.1.9:** `[ ]` **Database Interaktion Tests:** Test databaseoperationer (CRUD).
        *   Overvej en separat test-database (SQLite in-memory er hurtigt, men test mod en DB magen til produktion (PostgreSQL) er bedre for integrationstests).
        *   Brug fixtures til at oprette testdata og sikre rene testtilstande for hver test.
    *   **F7.1.10:** `[ ]` **Socket.IO Event Tests:** Test at korrekte Socket.IO events udsendes med korrekt data under forskellige scenarier. Kræver `Flask-SocketIO` test client.
    *   **F7.1.11:** `[ ]` **Coverage Mål:** Sæt mål for testdækning (f.eks. >80%) og følg op med `pytest --cov`.

### F7.2: `[ ]` End-to-End (E2E) Tests (`apps/frontend/` eller monorepo-rod)
*   **F7.2.1:** `[ ]` **Vælg og Opsæt E2E Værktøj:**
    *   Planen nævner Playwright (foretrukket) eller Cypress. Bekræft valg (Playwright anbefales for moderne features).
    *   Installer og konfigurer værktøjet i `apps/frontend/` eller i monorepo-roden for at kunne teste interaktioner der spænder over flere apps (hvis relevant i fremtiden).
*   **F7.2.2:** `[ ]` **Definer Kritiske Bruger-Flows (Test Cases):**
    *   **Eksempler:**
        1.  Bruger-registrering (via Firebase) -> Login -> Opdater profil -> Logout.
        2.  Login -> Naviger til Live Sports -> Vælg sport/liga -> Se kampdetaljer (mocked live update).
        3.  Login -> Naviger til Aktiedyst -> Se portefølje -> Placer en (mock) markedsordre -> Se opdateret portefølje/transaktionshistorik.
        4.  Login -> Naviger til Forum -> Opret ny tråd -> Skriv et svar i tråden.
        5.  Anonym bruger forsøger at tilgå beskyttet side -> Bliver redirected til login.
*   **F7.2.3:** `[ ]` **Skriv E2E Tests for Disse Flows:**
    *   Brug Page Object Model (POM) for at skabe mere vedligeholdelige og læsbare tests.
    *   Sørg for at tests er robuste overfor mindre UI-ændringer (brug data-attributter som `data-testid` til at vælge elementer).
    *   E2E tests køres typisk mod en kørende applikation (lokal dev server, staging miljø).

### F7.3: `[ ]` Manuel Test & QA (Quality Assurance)
*   **F7.3.1:** `[ ]` **Udarbejd Testplan/Checkliste for Manuel Test:**
    *   Dæk alle features, bruger-flows, og UI-elementer.
    *   Inkluder test-scenarier for edge cases, fejlhåndtering, og usædvanlig brugerinput.
    *   Test for visuel konsistens og UX-flow.
*   **F7.3.2:** `[ ]` **Gennemfør Test på Forskellige Browsere:**
    *   Seneste versioner af Chrome, Firefox, Safari, Edge.
*   **F7.3.3:** `[ ]` **Gennemfør Test på Forskellige Enheder/Skærmstørrelser:**
    *   Desktop, tablet (portræt/landskab), mobil (iOS/Android). Brug fysiske enheder og emulatorer/simulatorer.
*   **F7.3.4:** `[ ]` **User Acceptance Testing (UAT):**
    *   Hvis muligt, involver en lille gruppe "beta-testere" (eller teammedlemmer, der ikke har udviklet featuren) til at gennemgå applikationen og give feedback før launch.

### F7.4: `[ ]` Performance Optimering & Analyse
*   **Frontend (`apps/frontend/`):**
    *   **F7.4.1:** `[ ]` **Bundle Analyse:** Brug `next-build-analyzer` (eller `webpack-bundle-analyzer`) til at identificere store chunks i JavaScript-bundle. Optimer import statements, overvej code splitting.
    *   **F7.4.2:** `[ ]` **Billedoptimering:** Brug Next.js's `<Image>` komponent konsekvent for automatisk optimering (størrelse, format, lazy loading).
    *   **F7.4.3:** `[ ]` **Dynamisk Import:** Brug `next/dynamic` for komponenter, der ikke er nødvendige ved initial side-load (f.eks. store diagrambiblioteker, modals der ikke vises med det samme, admin-sektioner).
    *   **F7.4.4:** `[ ]` **React DevTools Profiler:** Identificer performance flaskehalse i React-komponenter (unødvendige re-renders, langsomme render-tider). Optimer med `React.memo`, `useMemo`, `useCallback`.
    *   **F7.4.5:** `[ ]` **Listevirtualisering:** For meget lange lister (f.eks. forum-posts, transaktioner, markedsdata), overvej biblioteker som `TanStack Virtual` (`@tanstack/react-virtual`) for at rendre kun de synlige elementer.
    *   **F7.4.6:** `[ ]` **Core Web Vitals:** Monitorer og optimer for Lighthouse scores og Core Web Vitals (LCP, FID/INP, CLS) ved hjælp af Vercel Analytics eller PageSpeed Insights.
    *   **F7.4.7:** `[ ]` **Caching:** Udnyt browser-caching og Next.js's data caching strategier (for Server Components, Route Handlers).
*   **Backend (`apps/backend/`):**
    *   **F7.4.8:** `[ ]` **Database Query Optimering:** Analyser langsomme DB-forespørgsler (brug `EXPLAIN` i SQL). Optimer indekser, undgå N+1 problemer (brug SQLAlchemy's `joinedload` / `selectinload`).
    *   **F7.4.9:** `[ ]` **Caching Strategier:**
        *   Implementer caching for data der ikke ændres ofte (f.eks. API-responses med Flask-Caching, eller en ekstern cache som Redis).
        *   Overvej caching af ofte brugte beregninger.
    *   **F7.4.10:** `[ ]` **Load Testing:** Brug værktøjer som k6, Locust, eller Apache JMeter til at teste backend API'ers performance og skalerbarhed under pres. Identificer flaskehalse.
    *   **F7.4.11:** `[ ]` **Asynkrone Opgaver:** For tidskrævende operationer, der ikke behøver at blokere HTTP-requesten (f.eks. afsendelse af e-mails, kompleks databehandling), brug en task queue som Celery.

### F7.5: `[ ]` Opsæt CI/CD Pipeline (Continuous Integration/Continuous Deployment)
*   **F7.5.1:** `[ ]` **Vælg CI/CD Platform:**
    *   GitHub Actions er foreslået og passer godt til GitHub repositories.
*   **F7.5.2:** `[ ]` **Konfigurer Workflows for Monorepo (`.github/workflows/`):**
    *   **Separate Workflows:** Opret separate YAML workflow-filer for frontend (`frontend-ci-cd.yml`) og backend (`backend-ci-cd.yml`).
    *   **Path Filtering:** Konfigurer workflows til kun at trigges, hvis der er ændringer i de relevante mapper (`paths:` filter i GitHub Actions), for at spare ressourcer.
    *   **Frontend Workflow (udløses på push/PR til `main` og `develop` branches for `apps/frontend/**`):**
        1.  Checkout kode.
        2.  Opsæt Node.js (brug en matrix for at teste mod flere versioner hvis nødvendigt).
        3.  Cache `node_modules` for hurtigere builds.
        4.  Installer afhængigheder (`npm ci` - brug `ci` for deterministiske builds).
        5.  Kør linting (`npm run lint`).
        6.  Kør unit/integration tests (`npm test -- --coverage`). Upload coverage report (f.eks. til Codecov).
        7.  Byg Next.js applikation (`npm run build`).
        8.  (Valgfrit, på PRs) Kør E2E tests mod en preview deployment (Vercel laver automatisk preview deployments).
        9.  Deploy til Vercel (Vercel's GitHub integration håndterer dette automatisk for `main` branch pushes (produktion) og PRs (preview deployments)).
    *   **Backend Workflow (udløses på push/PR til `main` og `develop` branches for `apps/backend/**`):**
        1.  Checkout kode.
        2.  Opsæt Python (brug en matrix for versioner hvis nødvendigt).
        3.  Cache `pip` dependencies.
        4.  Installer afhængigheder (`pip install -r apps/backend/requirements.txt`).
        5.  Kør linting (Flake8, Black, isort).
        6.  Kør unit/integration tests (`pytest apps/backend/tests --cov`). Upload coverage report.
        7.  Byg Docker image (fra `apps/backend/Dockerfile`).
        8.  Push Docker image til et container registry (f.eks. Docker Hub, Google Container Registry (GCR), AWS Elastic Container Registry (ECR)).
        9.  Deploy Docker image til valgt cloud platform (Google Cloud Run, AWS App Runner) for `main` branch pushes (produktion). Overvej "staging" deployment for `develop` branch.
*   **F7.5.3:** `[ ]` **Håndter Hemmeligheder/Miljøvariabler i CI/CD:**
    *   Brug platformens (f.eks. GitHub Actions Secrets) indbyggede funktioner til sikker opbevaring og injektion af API-nøgler, database-credentials, Firebase service account JSON (base64 encoded), etc. Undgå at hardcode hemmeligheder.

### F7.6: `[ ]` Konfigurer Miljøvariabler for Deployment Miljøer
*   **Lokal Udvikling:**
    *   Frontend: Brug `.env.local` (i `.gitignore`) i `apps/frontend/`.
    *   Backend: Brug `.env` (i `.gitignore`) i `apps/backend/`.
*   **Produktion & Staging Miljøer:**
    *   **F7.6.1:** `[ ]` Konfigurer miljøvariabler direkte i UI'en/indstillingerne for hosting platformene:
        *   **Vercel (Frontend):** For `NEXT_PUBLIC_` (browser-tilgængelige) og server-side variabler. Separate variable-sæt for Produktion, Preview, og Development environments i Vercel.
        *   **Firebase (Functions, Hosting config):** `firebase functions:config:set service.key="value"` og deploy.
        *   **Cloud Provider (Google Cloud Run, AWS App Runner) for Backend Container:** Via platformens servicekonfiguration.
    *   **F7.6.2:** `[ ]` Sørg for at adskille `NEXT_PUBLIC_` prefixede variabler (tilgængelige i browser) fra rene server-side variabler for Next.js.
    *   **F7.6.3:** `[ ]` Dokumenter nødvendige miljøvariabler og deres formål i en `README.md` eller et `.env.example` fil for hvert projekt (`apps/frontend`, `apps/backend`).

---

## Fase 8: Launch & Vedligeholdelse
**Mål:** At lancere den moderniserede Fattecentralen-applikation succesfuldt til brugerne og etablere robuste processer for løbende drift, overvågning, feedback-håndtering og fremtidig forbedring.
**Status:** Ikke påbegyndt.

### F8.1: `[ ]` Endelig Deployment til Produktion
*   **F8.1.1:** `[ ]` **Pre-Launch Checklist:**
    *   Alle tests (unit, integration, E2E, manuel QA) er bestået for release-kandidaten.
    *   Alle kritiske og high-priority fejl er rettet.
    *   Performance er acceptabel (Lighthouse scores, API svartider).
    *   Sikkerhedsgennemgang er foretaget (gennemgå OWASP Top 10, Firebase regler, API sikkerhed).
    *   Produktionsmiljøvariabler er sat korrekt og verificeret.
    *   Produktionsdatabase er klar, migreret til seneste skema, og evt. seeded med nødvendige startdata.
    *   DNS-ændringer (hvis domænet skifter eller er nyt) er planlagt med minimal nedetid.
    *   Rollback-plan er klar: Hvordan rulles tilbage til forrige version, hvis launch fejler katastrofalt? (Vercel og de fleste container platforme har nem rollback).
    *   Kommunikationsplan (til brugere/stakeholders) er klar.
    *   Overvågning og logging (F8.2) er opsat for produktionsmiljøet.
*   **F8.1.2:** `[ ]` **Udfør Produktionsdeployment:**
    *   Trigger CI/CD pipeline for `main` branch (eller den specifikke release branch/tag).
    *   Monitorer deployment processen nøje.
*   **F8.1.3:** `[ ]` **Post-Launch Smoke Test & Verifikation:**
    *   Verificer kernefunktionaliteter i produktionsmiljøet manuelt umiddelbart efter deployment.
    *   Tjek for fejl i Sentry og serverlogs.

### F8.2: `[ ]` Monitorering & Logging
*   **F8.2.1:** `[ ]` **Fejl-tracking Opsætning:**
    *   **Værktøj:** Sentry (bekræftet valg).
    *   **Opsætning:**
        *   Integrer Sentry SDK i frontend (Next.js) med korrekt release tracking og source maps for meningsfulde stack traces.
        *   Integrer Sentry SDK i backend (Flask) med relevant kontekst (brugerinfo, request data).
        *   Konfigurer alarmer i Sentry for nye fejl, stigning i fejlrate, eller specifikke kritiske fejl.
*   **F8.2.2:** `[ ]` **Performance & Analytics Opsætning:**
    *   **Frontend:**
        *   Vercel Analytics (hvis Vercel bruges) - giver Core Web Vitals, trafikdata, Next.js specifik performance.
        *   Google Analytics 4 (eller et privacy-fokuseret alternativ som Plausible/Fathom) for brugeradfærd, custom events, funnels, konverteringssporing.
    *   **Backend:**
        *   Logging fra cloud provider (Google Cloud Logging, AWS CloudWatch Logs).
        *   Application Performance Monitoring (APM): Sentry APM er en god start. Overvej mere dedikerede APM-værktøjer (Datadog, New Relic) hvis dybere performance-indsigt og -analyse er nødvendig for backend.
    *   **Firebase:**
        *   Firebase Performance Monitoring (især for Firebase Functions og interaktioner med Firebase services).
        *   Firebase Analytics (kan give yderligere brugerindsigt, især hvis der er tæt integration med Firebase features).
*   **F8.2.3:** `[ ]` **Struktureret Backend Logging:**
    *   Sørg for, at Flask-applikationen logger struktureret (f.eks. JSON-format) og tilstrækkeligt: indkommende requests, udgående kald, fejl, vigtige forretningsevents, sikkerhedsrelaterede hændelser.
    *   Send logs til en centraliseret log-management service (f.eks. den der følger med cloud provideren, eller ELK stack/Loki).
    *   Opsæt alarmer baseret på log-mønstre (f.eks. for mange 5xx fejl).

### F8.3: `[ ]` Indsaml Feedback fra Brugere
*   **F8.3.1:** `[ ]` **Etabler Feedback Kanaler:**
    *   **In-app feedback formular:** En simpel måde for brugere at indsende feedback direkte fra applikationen (kan sende til en email, et API endpoint der gemmer det i DB, eller et værktøj som Trello/Jira).
    *   **Dedikeret email-adresse:** F.eks. `feedback@fattecentralen.dk`.
    *   **Forum-tråd:** En officiel tråd i forummet specifikt for feedback og bug reports.
    *   **(Valgfrit) User Experience Værktøjer:** Overvej værktøjer som Hotjar (heatmaps, session recordings, surveys) eller Microsoft Clarity for dybere indsigt i brugeradfærd og identificering af pain points.
*   **F8.3.2:** `[ ]` **Analyser Feedback Systematisk:**
    *   Log og kategoriser indkommen feedback (bugs, feature requests, UX-problemer).
    *   Prioriter feedback og brug det som input til backloggen for fremtidig udvikling (F8.4.1).

### F8.4: `[ ]` Iterér & Forbedr (Kontinuerlig Udvikling)
*   **F8.4.1:** `[ ]` **Vedligehold Backlog (Agil Tilgang):**
    *   Brug et issue tracking system (f.eks. GitHub Issues, Jira, Trello, Linear).
    *   Opret user stories, tasks, og bugs.
    *   Prioriter backloggen regelmæssigt baseret på forretningsværdi, brugerfeedback, og teknisk gæld.
*   **F8.4.2:** `[ ]` **Planlæg Sprints/Iterationer:**
    *   Arbejd i korte, fokuserede udviklingscyklusser (f.eks. 1-2 ugers sprints).
    *   Afhold sprint planning, daily stand-ups (hvis team), sprint review, og retrospective for at forbedre processen.
*   **F8.4.3:** `[ ]` **Regelmæssig Opdatering af Afhængigheder:**
    *   Brug værktøjer som `npm outdated` / `pip list --outdated` og GitHub's Dependabot til at holde styr på og opdatere biblioteker (både frontend og backend).
    *   Planlæg tid til at håndtere disse opdateringer regelmæssigt for at lukke sikkerhedshuller og få nye features/bugfixes.
    *   Test grundigt efter større afhængighedsopdateringer.
*   **F8.4.4:** `[ ]` **Vedligehold Dokumentation:**
    *   Hold denne projektplan (eller et lignende levende dokument) opdateret med status, ændringer, og nye beslutninger.
    *   Opdater API-dokumentation (OpenAPI/Swagger) og in-code kommentarer løbende.
    *   Opdater Storybook for UI-komponenter.
*   **F8.4.5:** `[ ]` **Regelmæssige Sikkerheds- og Performance Reviews:**
    *   Planlæg periodiske gennemgange af sikkerhedsaspekter og performance-benchmarks for at sikre, at applikationen forbliver robust og hurtig.

---

## Afsluttende Tips til Brug af Planen & Kreativ Udfoldelse (Repeteret & Udvidet):

*   **Iterativ Tilgang:** Denne plan er omfattende. Bryd hver fase og hver underopgave ned i endnu mindre, håndterbare bidder (f.eks. daglige eller ugentlige mål). Markér fremskridt løbende – det er motiverende!
*   **Fleksibilitet & Agilitet:** Verden ændrer sig, og det samme gør softwareprojekter. Vær åben for at justere planen undervejs baseret på nye indsigter, teknologiske ændringer, brugerfeedback, eller ændrede forretningsprioriteter. Denne plan er en guide, ikke et rigidt fængsel.
*   **Eksperimenter Kreativt:**
    *   **UI/UX:** Med Shadcn/Tailwind kan du skabe et unikt look. Lad dig inspirere af Bet365/Nordnet, men find Fattecentralens egen visuelle identitet. Vær ikke bange for at prøve forskellige layouts, farveskemaer (især med Dark Mode), og interaktionsmønstre.
    *   **Animationer:** Brug Framer Motion og evt. Anime.js til at skabe en levende og engagerende brugeroplevelse. Subtile animationer kan gøre en stor forskel for, hvordan applikationen føles.
    *   **Data Visualisering:** For Aktiedyst og Sportsstatistik, tænk ud over standardgrafer. Hvordan kan data præsenteres på en mere intuitiv og fængende måde (måske med inspiration fra F5.9 om 3D)?
*   **HTML Transformation (Fase 2):** En systematisk tilgang er nøglen.
    *   **Komponentidentifikation:** Bryd de gamle HTML-sider og -templates ned. Identificer genkendelige, gentagne elementer – disse er kandidater til React-komponenter.
    *   **Struktur Først:** Start med de ydre layouts (Header, Sidebar, Footer, sidestruktur) og arbejd dig indad mod mere specifikke komponenter.
    *   **Styling Overførsel:** Oversæt eksisterende CSS-stilarter til Tailwind utility-klasser. Dette kan være tidskrævende, men resulterer i mere vedligeholdelig styling.
    *   **Logik Omskrivning:** Gammel JavaScript-logik skal omskrives til React (hooks, event handlers, state management).
*   **Valg af Værktøjer:** De valgte værktøjer er stærke og moderne. Men hvis der opstår et specifikt behov, hvor et alternativt værktøj er markant bedre egnet, vær åben for at revurdere og evt. introducere det.
*   **AI som Sparringspartner:** Bliv ved med at bruge AI-værktøjer (som mig!) til:
    *   Kodeeksempler og debugging.
    *   Diskussion af arkitekturvalg for specifikke features.
    *   Brainstorming af løsninger på komplekse problemer.
    *   Generering af testcases eller dokumentationsudkast.
*   **Prioritering:** Ikke alt kan gøres på én gang. Brug MoSCoW-princippet (Must have, Should have, Could have, Won't have) for features indenfor hver fase for at styre scope, især hvis tidsrammen er stram.
*   **Fejr Milepæle:** Anerkend og fejr når større dele af planen er fuldført. Det holder motivationen oppe!

Dette er blevet en meget omfattende og detaljeret projektplan. Den skulle give et solidt og klart fundament for moderniseringen af Fattecentralen. Husk, at dette er et levende dokument – opdater det, efterhånden som projektet skrider frem, og nye beslutninger træffes. Held og lykke med projektet – det bliver spændende!
```