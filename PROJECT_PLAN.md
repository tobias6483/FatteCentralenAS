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

79.1 | [X] Backend Miljø Opsætning:
79.2 |   [X] Genereret `requirements.txt` fra det oprindelige projektmiljø.
79.3 |   [X] Flyttet `requirements.txt` til `fattecentralen-monorepo/apps/backend/`.
79.4 |   [X] Oprettet et nyt virtuelt miljø (`.venv`) i `fattecentralen-monorepo/apps/backend/`.
79.5 |   [X] Installeret afhængigheder fra `requirements.txt` i det nye backend-miljø.
79.6 |   [X] Downloadet Firebase Admin SDK service account key og gemt sikkert. (Note: Gemt i `~/.firebase_keys/fattecentralenas-service-account.json`)
79.7 |   [X] Konfigureret environment variable for service account key path. (Note: `GOOGLE_APPLICATION_CREDENTIALS` sat i `apps/backend/.env`)
[ ] Flask-JWT-Extended & Firebase Auth Integration:
Flask-JWT-Extended er allerede delvist opsat. Nu skal fokus være på at validere JWTs udstedt af Firebase Authentication.
Implementer en funktion/decorator i Flask til at verificere Firebase ID tokens sendt i Authorization headeren fra frontend.
Opdater login_route, register_route, me_route til ikke selv at udstede JWTs, men i stedet forvente at frontend håndterer login/signup via Firebase, og derefter sender Firebase ID token til Flask. me_route vil validere dette token og returnere brugerdata fra din lokale database baseret på Firebase UID.
Sørg for at user_loader mm. i Flask-JWT-Extended fungerer med brugeridentiteter fra Firebase-tokens (f.eks. ved at slå brugeren op i din database via Firebase UID).
[ ] Database Review (Eksisterende apps/backend/):
Bekræft at nuværende databasemodeller (models.py) er tilstrækkelige for kernefunktionaliteter. Migrationer (Alembic/Flask-Migrate) skal være up-to-date.
[X] API Design - Live Sports (Detaljeret Definition):
GET /api/v1/sports: Liste af sportsgrene/ligaer.
GET /api/v1/sports/{sportId}/matches?status=[live|upcoming|finished]&date=YYYY-MM-DD: Liste af kampe.
GET /api/v1/matches/{matchId}: Detaljer for én kamp. (Endpoint refactored, blueprint `matches_api_bp` created in [`apps/backend/routes/api_sports.py`](fattecentralen-monorepo/apps/backend/routes/api_sports.py) and registered in [`apps/backend/__init__.py`](fattecentralen-monorepo/apps/backend/__init__.py))
Definer JSON request/response strukturer for hver.
[X] API Design - Aktiedyst (Detaljeret Definition): (Initial scaffolding with placeholder endpoints and mock data complete in [`apps/backend/routes/api_aktiedyst.py`](fattecentralen-monorepo/apps/backend/routes/api_aktiedyst.py). Blueprint `aktiedyst_api_bp` registered in [`apps/backend/__init__.py`](fattecentralen-monorepo/apps/backend/__init__.py))
  [X] GET /api/v1/aktiedyst/portfolio: Brugerens portefølje (kræver Firebase Auth). (Placeholder implemented)
  [X] GET /api/v1/aktiedyst/transactions: Brugerens transaktionshistorik (kræver Firebase Auth). (Placeholder implemented)
  [X] GET /api/v1/aktiedyst/markets: Liste over handlebare aktier/symboler. (Placeholder implemented)
  [X] GET /api/v1/aktiedyst/markets/{symbol}/history?period=[1d|7d|1m|...]: Kursdata. (Placeholder implemented)
  [X] POST /api/v1/aktiedyst/orders: Placer en ordre (kræver Firebase Auth). (Placeholder implemented)
Definer JSON request/response strukturer for hver.
[ ] API Design - Forum & Andre Features (Detaljeret Definition):
Forum: GET /api/v1/forum/categories, GET /api/v1/forum/categories/{catId}/threads, GET /api/v1/forum/threads/{threadId}/posts, POST /api/v1/forum/threads/{threadId}/posts (kræver Firebase Auth for POST).
Brugerprofil: GET /api/v1/users/me/profile (baseret på Firebase Auth), PUT /api/v1/users/me/profile.
Definer JSON request/response strukturer for hver. Overvej om dele af forum/profil data kan flyttes til Firebase Firestore for nemmere realtid og skalerbarhed.
[~] Implementer/Opdater API Endpoints i Flask: (Initial placeholders for Aktiedyst and refactoring for Sports Match API done)
  Skriv/opdater Flask routes i [`apps/backend/routes/`](fattecentralen-monorepo/apps/backend/routes/) for at matche de designede endpoints. (Aktiedyst placeholders created in [`api_aktiedyst.py`](fattecentralen-monorepo/apps/backend/routes/api_aktiedyst.py), Sports match endpoint refactored in [`api_sports.py`](fattecentralen-monorepo/apps/backend/routes/api_sports.py))
Brug SQLAlchemy til databaseinteraktion.
Implementer serialisering og korrekt HTTP statuskode/fejlhåndtering.
Sikre endpoints med den nye Firebase Auth token validering.
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