--SKABELON;

Skabelon til Introduktionsprompt for en Ny Fase (til GitHub Copilot):

Hej GitHub Copilot,

Vi overgår nu til **[FASE NUMMER]: [FASE NAVN]** for Fattecentralen-projektet.
(Valgfrit, hvis du har et opdateret dokument: "Jeg har opdateret projektplanen i `/sti/til/PROJECT_PLAN_OPDATERET.md`. Læs venligst den fulde plan igen, med særligt fokus på den nye fase, før vi fortsætter.")

**Kontekst & Forudsætninger:**
*   Du har fuld adgang til og kan læse filer i hele projektstrukturen:
    *   Gammelt projekt (rod - primært til reference nu): `/Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt`
    *   Monorepo (aktivt arbejdsområde): `/Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/fattecentralen-monorepo`
    *   Ny frontend-app: `fattecentralen-monorepo/apps/frontend/src/`
    *   Ny backend-app: `fattecentralen-monorepo/apps/backend/`
*   Vi har succesfuldt gennemført **Fase [Forrige Fase Numre]** (f.eks. Fase 0, 1 og 2). De statiske UI-komponenter og sider er nu på plads i `apps/frontend/src/`, og backend API'erne er (som minimum delvist) klar fra Fase 1.
*   (Valgfrit: Hvis der var et output fra forrige fase, f.eks. en transformationsplan): "Du kan referere til den transformationsplan/analyse, vi udarbejdede i starten af Fase [Forrige Fase Nummer]."

**Mål for [FASE NUMMER]: [FASE NAVN]:**
*   [OPSUMMER DET PRIMÆRE MÅL MED FASEN MED DINE EGNE ORD - f.eks. "Målet er at integrere data fra vores backend API'er ind i de statiske frontend-komponenter og implementere fuld Firebase-autentificering." eller "Nu skal vi bringe realtidsfunktionalitet til live ved at forbinde frontend med vores Flask-SocketIO backend og håndtere live opdateringer for sport og aktiedyst."]
*   Dette vil involvere arbejde i [SPECIFICER HVILKE DELE AF MONOREPO'ET – f.eks. primært `apps/frontend/src/` for Fase 3, men både `apps/frontend/src/` og `apps/backend/sockets.py` (eller `routes/` for nye API'er) for Fase 4].
*   Vi vil følge de detaljerede punkter i **projektplanens Fase [FASE NUMMER]-sektion** (f.eks. F3.0-F3.6 for Fase 3).

**Din Rolle i Fase [FASE NUMMER] (Autonom Implementator med Analytisk Tilgang):**
1.  **INITIEL FORSTÅELSE AF FASEN (hvis nødvendigt):**
    *   Hvis denne fase introducerer *helt nye koncepter eller teknologier* for projektet (f.eks. avanceret Firebase Storage integration i Fase 6), kan jeg bede dig starte med en kort analyse af projektplanens beskrivelse af disse for at sikre, vi er på linje.
2.  **IMPLEMENTERING BASERET PÅ PROJEKTPLANEN:**
    *   For hver større underopgave i Fase [FASE NUMMER], som jeg specificerer:
        *   **Læs og forstå de relevante dele af projektplanen for den pågældende underopgave.** Dette er din primære kilde til krav.
        *   **Træk på din viden om den eksisterende kodebase** (både i `apps/frontend/` og `apps/backend/` alt efter opgaven).
        *   **Implementer den nødvendige kode direkte.** Dette kan involvere at:
            *   Modificere eksisterende `.tsx`-komponenter (f.eks. tilføje datahentning, state management, event handlers).
            *   Oprette nye hooks (f.eks. `useAuth.ts`, `useSocket.ts`).
            *   Opsætte nye providers eller globale state stores (f.eks. Zustand, TanStack Query Client).
            *   Skrive/modificere Python-kode i `apps/backend/` (f.eks. for nye API-endpoints, Socket.IO event handlers, Admin API).
        *   **Følg teknologiske valg** fra projektplanen (TanStack Query, Zustand, Firebase SDK, Socket.IO Client/Server, etc.).
        *   **Integrer med eksisterende komponenter/logik** på en ren og vedligeholdelsesvenlig måde.
        *   **Sørg for robust fejlhåndtering** og brugerfeedback (f.eks. loading states, fejlmeddelelser, toasts med Sonner).
        *   **Skriv klare kommentarer** i koden hvor det er komplekst.

**Min Rolle (Strategisk Arkitekt, Dirigent & Kvalitetsvogter):**
1.  Jeg vil **introducere hver større underopgave/sektion af Fase [FASE NUMMER]** med en klar reference til projektplanen.
2.  Jeg vil **give specifikke input eller præciseringer**, hvis planen er tvetydig, eller hvis der er kreative/arkitektoniske valg, der skal træffes undervejs.
3.  Jeg vil **gennemgå og godkende den implementerede kode for hver større enhed grundigt.** Fokus er på funktionalitet, korrekthed, integration, performance (hvis relevant for fasen), og overholdelse af planen.
4.  Vi fortsætter med en **metodisk og kvalitetsfokuseret tilgang.**

---

**Fase [FASE NUMMER]: [FASE NAVN] - Startkommando:**

**FØRSTE SKRIDT FOR DENNE FASE:**
*   **(Hvis relevant, start her):** "Copilot, lad os starte med at sikre, vi har en fælles forståelse af [Nøglekoncept/Teknologi for denne fase, f.eks. 'TanStack Query opsætning og integration' for Fase 3, eller 'Socket.IO client-server arkitektur for realtidsdata' for Fase 4]. Læs venligst afsnit [relevant afsnit i Fase [X]] i projektplanen, og giv mig en kort opsummering af de centrale opgaver og teknologier, vi skal arbejde med for dette."
*   **(Ellers, gå direkte til første implementeringsopgave):** "Copilot, lad os starte med det første hovedpunkt i Fase [FASE NUMMER]: **[Navn på Første Hovedpunkt, f.eks. F3.1: Opsæt TanStack Query (React Query) Provider & API Klient]**. Læs venligst detaljerne for [F3.1] i projektplanen, og begynd med at implementere [Første Underpunkt, f.eks. F3.1.1 Opret QueryClient Konfiguration i `lib/react-query.ts`]."

Jeg ser frem til at bygge [Beskriv kort det spændende output af denne fase, f.eks. "en fuldt datadrevet frontend med brugerautentificering" eller "en dynamisk platform med live opdateringer"]!
Use code with caution.
Text
Nøgleelementer for at gøre dine fremtidige prompts "detaljerede, strukturerede, kloge, smarte, kreative osv.":

KLAR KONTEKST & REFERENCER:
Projektplan: Altid bed Copilot om at læse/referere til din PROJECT_PLAN_OPDATERET.md. Dette er jeres fælles "sandhedskilde". Nævn specifikt hvilken fase eller underafsnit, der er relevant for den aktuelle opgave.
Eksisterende Kode: Mind Copilot om at tage højde for kode, der allerede er implementeret i tidligere faser.
TYDELIGT FORMULERET MÅL FOR FASEN:
Start med en overordnet vision for, hvad I vil opnå i den specifikke fase. Gør det relaterbart og motiverende. Eksempel: "Nu skal vi vække vores statiske UI til live ved at forbinde den med rigtige data!"
DEFINEREDE ROLLER (DIN OG COPILOTS):
Gentag, hvad du forventer af Copilot (implementere, analysere, foreslå, trække på viden) og hvad din rolle er (styre, godkende, specificere, finjustere). Dette sætter rammerne for samarbejdet.
STRUKTURERET NEDBRYDNING AF FASEN:
Selvom Copilot implementerer, er det godt, hvis du stadig kan henvise til hovedpunkterne i din projektplan (f.eks. "Lad os tage fat på F3.2: Implementer Firebase Autentificering Flow"). Dette hjælper med at holde fokus.
Du kan så bede Copilot implementere hele F3.2, snarere end hvert under-underpunkt, hvis du stoler på dens evne til at følge planen for den sektion.
FOKUS PÅ NØGLETEKNOLOGIER & BEST PRACTICES:
Når du introducerer en fase, der involverer nye biblioteker (f.eks. TanStack Query, Socket.IO, Framer Motion), bed Copilot om at implementere i overensstemmelse med best practices for disse værktøjer (som skitseret i din plan).
FREMHÆV KVALITETSKRAV:
Nævn ting som robust fejlhåndtering, klare kommentarer, testbarhed (data-testid), performance-overvejelser (hvis relevant for fasen).
VÆR KREATIV I DIN BESKRIVELSE:
Brug ord, der inspirerer til kvalitet: "intelligent transformation", "elegant integration", "robust og skalerbar løsning", "intuitiv brugeroplevelse".
Referer til de designmål du har (Bet365, Nordnet).
ITERATIV GODKENDELSESPROCES:
Selvom Copilot laver "hele sider", skal du stadig insistere på at gennemgå og godkende hver større færdige enhed før I går videre. Dette forhindrer, at små fejl forplanter sig.
ÅBNING MED "BIG PICTURE" ANALYSE (HVIS NØDVENDIGT):
For faser, der er meget anderledes end de foregående (f.eks. Fase 5: Avancerede Features, eller Fase 6: Yderligere Firebase Integration), kan det være en god idé at starte med at bede Copilot opsummere sin forståelse af kravene til den specifikke fase fra projektplanen, før den kaster sig over implementering. Dette sikrer alignment.
MOTIVERENDE AFSLUTNING:
Afslut dit intro-prompt med en positiv forventning til, hvad I vil opnå.
















------>
Fase 2;


Hej GitHub Copilot,

Først læs hele; '/Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/PROJECT_PLAN_OPDATERET.md'

Dernæst;

Vi er klar til at accelerere **Fase 2: Core Frontend Features - UI Transformation & Statiske Komponenter** for Fattecentralen-projektet. Du har fuld adgang til og kan læse filer i hele projektstrukturen:
Gammelt projekt (rod): `/Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt`
Monorepo (vores primære arbejdsområde for ny frontend): `/Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/fattecentralen-monorepo`
Ny frontend-app (hvor der allerede findes grundlæggende layout-komponenter fra Fase 0): `fattecentralen-monorepo/apps/frontend/src/`

**Målet for Fase 2 er at transformere de eksisterende HTML-templates (fra rodmappens `templates/`) og JavaScript-filer (fra rodmappens `static/js/`) til en *statisk* Next.js frontend.** Vi anvender React, TypeScript, Shadcn/ui, og Tailwind CSS. **Fokus er udelukkende på at bygge den visuelle struktur og statiske komponenter, baseret på en *dyb forståelse* af både de gamle filer OG den eksisterende kode i den nye frontend-app, som du nu skal opbygge. Dynamisk logik og datahentning kommer senere.**

**Din Rolle (Autonom Analytiker & Implementator under Supervision):**
1.  **INITIEL DYBDEANALYSE & STRUKTURPLAN (én gang i starten af Fase 2):**
    *   **Din Opgave NU (Top Prioritet):**
        1.  **Scan og analyser grundigt ALLE HTML-filer** i rodmappens `templates/` (og dens undermapper).
        2.  **Scan og analyser grundigt ALLE JavaScript-filer** i rodmappens `static/js/`.
        3.  **Scan og analyser grundigt den EKSISTERENDE .tsx kode** i `fattecentralen-monorepo/apps/frontend/src/` (især i `components/layout/`, `app/layout.tsx`, og eventuelle common/UI-komponenter der allerede er oprettet i Fase 0). Forstå hvad der allerede er på plads.
        4.  *(Valgfrit, men anbefalet for kontekst)* Skim Python-route-filer i det gamle projekts backend-kode (nu i `apps/backend/`) for at forstå, hvordan templates blev brugt og hvilke data de forventede.
    *   **Mål med din samlede analyse:**
        *   Identificere de unikke sider/views fra de gamle HTML-templates.
        *   Forstå, hvordan det **eksisterende globale layout** i `apps/frontend/src/` (f.eks. `DashboardLayout.tsx`, `Header.tsx`, `Sidebar.tsx`) kan anvendes og evt. udbygges baseret på behovene fra de gamle templates (specielt `base.html`).
        *   Kortlægge, hvilke gamle JS-filer der er knyttet til hvilke gamle HTML-templates/features.
        *   Identificere genbrugelige UI-mønstre/komponenter fra de gamle templates, der **endnu ikke er implementeret** i den nye frontend.
        *   Notere centrale funktionaliteter og data, der præsenteres i de gamle templates.
        *   Identificere alle eksterne JS-biblioteker og CSS-afhængigheder fra det gamle system.
    *   **Output af analysen (Dit forslag til en transformationsplan for Fase 2):**
        Baseret på din *samlede* analyse (både af det gamle projekt OG den eksisterende nye frontend-kode), præsenter mig for en **struktureret plan for transformationen af HELE den resterende gamle frontend-UI til statiske Next.js sider og komponenter.** Dette skal inkludere:
        *   En liste over de **nye Next.js sider (routes i `apps/frontend/src/app/...`)**, der skal oprettes, og hvilke gamle HTML-templates de primært vil erstatte. Angiv, hvordan de skal integreres med det eksisterende `DashboardLayout.tsx` eller andre relevante layouts.
        *   En identifikation af, om det eksisterende `DashboardLayout.tsx`, `Header.tsx`, `Sidebar.tsx` osv. er tilstrækkelige, eller om de skal udvides med statisk funktionalitet/elementer baseret på `base.html`.
        *   En foreløbig liste over **nye, mindre, genbrugelige feature-specifikke eller common-komponenter**, som du har identificeret fra de gamle templates (og som ikke allerede findes i `apps/frontend/src/`), og hvor de skal placeres (f.eks. `MatchCard`, `ArticlePreview`, `InfoBox`).
        *   En vurdering af, hvilke gamle JS-funktioner der er rent UI-manipulation (som vi skal genskabe med React/CSS), og hvilke der peger mod data/API-kald (til Fase 3).
        *   Forslag til håndtering af de gamle CSS-stilarter (oversættelse til Tailwind).
        *   Denne plan skal være vores køreplan for Fase 2, og jeg vil godkende eller justere den, før vi går videre.

2.  **IMPLEMENTERING AF STATISK UI (Side-for-Side / Feature-for-Feature):**
    *   Når vi har aftalt transformationsplanen, vil jeg bede dig implementere **hele sider eller logiske grupperinger af komponenter ad gangen**.
    *   **Din Opgave (for hver implementeringsrunde):**
        *   Baseret på den aftalte transformationsplan og din dybdeanalyse af de relevante gamle filer (og under hensyntagen til allerede eksisterende komponenter i `apps/frontend/src/`): **Implementer den fulde, statiske Next.js version** af den angivne side/feature.
        *   Dette inkluderer: Oprettelse af `page.tsx`, eventuelle underordnede `layout.tsx`, og alle nødvendige *nye* genbrugelige UI-komponenter (`.tsx`-filer i `apps/frontend/src/components/...`). Genbrug eksisterende komponenter, hvor det er passende.
        *   Brug den valgte tech stack (Shadcn/ui, Tailwind CSS, React, TypeScript) og følg UI-inspiration fra projektplanen.
        *   Integrer passende mock-data og TypeScript-typer.
        *   Implementer `data-testid` attributter.

**Min Rolle (Strategisk Overblik, Godkendelse & Finjustering):**
1.  Jeg vil **evaluere og godkende din initiale dybdeanalyse og den deraf følgende transformationsplan.** Dette er fundamentet for resten af Fase 2.
2.  Jeg vil derefter **sætte dig i gang med at implementere større enheder ad gangen** (f.eks. "Okay, lad os nu transformere hele Auth-flowet: Login, Signup, Reset Password siderne" eller "Implementer nu den statiske Live Sports oversigtsside, inklusiv `LiveMatchRow` komponenten, og sørg for at den bruger vores eksisterende `DashboardLayout.tsx`").
3.  Jeg vil **gennemgå den implementerede kode for hver større enhed grundigt.** Fokus er på korrekthed, overensstemmelse med planen, kvalitet af transformationen, og god integration med eksisterende kode.
4.  Jeg giver feedback, anmoder om nødvendige justeringer, og giver **endelig godkendelse, før vi går videre til den næste store enhed.**
5.  Vi sikrer en **systematisk, men effektiv fremdrift.**

---

**Fase 2 - Startkommando:**

**FØRSTE OG VIGTIGSTE SKRIDT: DIN INITIELLE DYBDEANALYSE OG FORSLAG TIL TRANSFORMATIONSPLAN (REF. DIN ROLLE, PUNKT 1)**

*   **Din Opgave NU:**
    1.  Udfør den **dybdegående analyse** som beskrevet ovenfor:
        *   Gamle HTML-filer: `/Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/templates/` (og undermapper).
        *   Gamle JavaScript-filer: `/Users/tobias/Desktop/Fattecentralen/vs code exp/Fattecentralen Projekt/static/js/`.
        *   **Eksisterende ny frontend-kode:** `fattecentralen-monorepo/apps/frontend/src/` (specielt layouts, app-struktur, og fælles komponenter).
        *   Eventuel Python-kontekst for templatebrug.
    2.  Præsenter mig derefter for din **opsummerede analyse og dit forslag til en struktureret transformationsplan for Fase 2.** Planen skal tydeligt vise, hvordan de gamle elementer transformeres til nye Next.js sider og komponenter, *samt hvordan dette integreres med eller bygger videre på den kode, der allerede er lavet i `apps/frontend/src/`.*

Jeg afventer din **initiale dybdeanalyse og dit forslag til en overordnet transformationsplan for hele den statiske UI i Fase 2.** Når vi er enige om denne plan, vil jeg begynde at instruere dig i at implementere de aftalte sider/features.






----->
træls session;

Absolut! Det lyder som en klassisk omgang "yak shaving", hvor man ender med at løse en masse underliggende problemer, før man kan komme til den egentlige opgave. Jeg integrerer din debriefing i projektplanen.

Det er vigtigt at synliggøre disse uforudsete udfordringer, da de påvirker tidslinjen og ressourceallokeringen for Fase 2. Jeg vil tilføje et nyt afsnit i starten af Fase 2 for at dokumentere dette.

Her er den opdaterede Fase 2 plan:

```markdown
## Fase 2: Core Frontend Features - UI Transformation & Statiske Komponenter (`apps/frontend/`)
**Mål:** At omdanne de vigtigste dele af den eksisterende HTML/CSS/JS (inklusive alle relevante "templates" og tilhørende JavaScript-filer) til en moderne, responsiv Next.js/React SPA-struktur med TypeScript og Tailwind CSS. Fokus i denne fase er på at bygge den **statiske struktur og udseende** af UI-komponenter og sider ved brug af **mock data**. Design skal inspireres af Bet365/FlashScore (Sport) og Nordnet/TradingView (Aktiedyst), samtidig med at der skabes en unik "Fattecentralen" identitet.
**Status:** `[!]` **Påbegyndelse Blokeret/Forsinket.** Indledende forsøg på frontend-arbejde blev afbrudt af kritiske problemer med pre-commit hooks og linting-fejl i backend-kodebasen. Fokus er midlertidigt skiftet til at løse disse tekniske gældsposter for at muliggøre fremdrift. Størstedelen af de nedenstående frontend-opgaver er derfor endnu ikke reelt påbegyndt.

### F2.PRE: Håndtering af Blokerende Faktorer & Teknisk Gæld (Log fra Seneste Dev Session)
*   **Overordnet Udfordring:** Transformation til Next.js frontend blev hurtigt blokeret af fejl fra Git pre-commit hooks relateret til backend-kodekvalitet (`flake8`, `black`, `isort`) og type-fejl (`Pylance`). Dette nødvendiggjorde et midlertidigt skift i fokus.
*   **Specifikke Problemer og Løsninger (Opsummering):**
    *   **Next.js Opgradering:** Tidlige udfordringer med `next/link` krævede kørsel af `new-link` codemod.
    *   **Pre-commit Hooks Blokerer:**
        *   `trailing-whitespace`, `black`, `isort` modificerede mange backend-filer.
        *   `flake8` rapporterede et stort antal fejl (F811, F821, F841, E722, E402, F541 m.fl.) på tværs af `apps/backend/`.
        *   **Midlertidig Løsning:**
            *   `.gitignore` opdateret.
            *   Commits foretaget med `git commit --no-verify` for at omgå hooks.
            *   Python-specifikke hooks (`black`, `flake8`, `isort`) blev midlertidigt deaktiveret i `.pre-commit-config.yaml`, hvorefter `black` og `isort` blev genaktiveret. `flake8` er **pt. deaktiveret.**
    *   **Backend Linting & Type Fejl:**
        *   **`flake8` Fejl:** Mange fejl identificeret (se ovenfor); enkelte rettet (f.eks. F811 i `config.py`).
        *   **`Pylance` Type Fejl i `sockets.py`:** Problemer med `Awaitable` typer fra Redis client.
            *   **Midlertidig Løsning:** Eksplicit type hint (`redis.Redis`) tilføjet til `redis_client` i `extensions.py`. `type: ignore[arg-type]` kommentarer indsat i `sockets.py` for at undertrykke fejl.
*   **Nuværende Status (Teknisk Gæld):**
    *   Alle hidtidige ændringer (inkl. midlertidige fixes og auto-formateringer fra `black`/`isort`) er committet og pushet.
    *   **`flake8` hook er deaktiveret.** Andre hooks (black, isort, trailing-whitespace etc.) er aktive.
    *   Et betydeligt antal `flake8` fejl resterer i backend.
    *   Pylance type-fejl i `sockets.py` er midlertidigt undertrykt.
*   **Næste Skridt (Forudsætning for at Fortsætte F2):**
    1.  `[ ]` **Systematisk Løsning af `flake8` Fejl:**
        *   `[ ]` Genaktiver `flake8` hook'en.
        *   `[ ]` Kør `pre-commit run --all-files`.
        *   `[ ]` Gennemgå og ret `flake8` fejl for at forbedre backend-kodekvalitet.
    2.  `[ ]` **Robust Løsning af Type Fejl:**
        *   `[ ]` Undersøg og ret underliggende type-mismatches (specielt i `sockets.py`). Fjern `type: ignore` hvor muligt.
    3.  `[ ]` **Verificer Next.js App Opførsel:** Efter backend-stabilisering, grundig test af den basale Next.js applikation.
    4.  `[ ]` **Fortsæt Frontend Transformation (F2.0 og frem):** Når ovenstående er adresseret, kan fuldt fokus vende tilbage til den planlagte UI-transformation.

### F2.0: `[ ]` Forberedende Analyse af Eksisterende Assets (HTML Templates & JS Filer)
*   **F2.0.1:** `[ ]` **Kortlægning af Templates til Nye Next.js Routes/Komponenter:**
    *   Gennemgå systematisk hver fil i `templates/` mappen.
    *   For hver `.html` fil, bestem dens primære formål og hvordan den vil blive mappet til en Next.js side (`app/.../page.tsx`), layout (`app/.../layout.tsx`), eller en større genbrugelig komponent.
    *   Noter specielt `base.html` (og evt. `_macros.html`), da disse vil danne grundlag for det globale `app/layout.tsx` og genbrugelige layout-komponenter som `DashboardLayout.tsx` samt mindre, delte UI-elementer.
*   **F2.0.2:** `[ ]` **Kortlægning af JavaScript-filer til Ny Frontend Logik:**
    *   Gennemgå systematisk hver fil i `static/js/` mappen.
    *   For hver `.js` fil, analyser dens funktionalitet (DOM manipulation, event handlers, AJAX kald etc.).
    *   Planlæg hvordan denne logik vil blive genimplementeret i den nye Next.js/React frontend:
        *   **Client Components:** For interaktivitet og browser-specifik logik.
        *   **React Hooks:** For state management og sideeffekter (`useState`, `useEffect`, custom hooks).
        *   **State Management (Zustand):** For global state.
        *   **API Kald (TanStack Query):** Eksisterende AJAX-kald erstattes af TanStack Query hooks i Fase 3.
        *   **Event Handlers:** Direkte på React-elementer.
*   **F2.0.3:** `[ ]` **Identificer Afhængigheder og Eksterne Biblioteker (i gammel JS):**
    *   Noter eventuelle eksterne JavaScript-biblioteker (udover jQuery, hvis det bruges, f.eks. `anime.js`), der anvendes i de gamle `.js` filer.
    *   Vurder om disse stadig er nødvendige, eller om deres funktionalitet kan dækkes af moderne React-økosystem værktøjer (f.eks. erstattes date pickers med Shadcn-komponenter, animationer med Framer Motion).

### F2.1: `[ ]` Identificer og Prioriter Nøgle-Sider/Templates til Transformation
*   **F2.1.1:** `[ ]` **Udvidet Liste over Identificerede Nøgle Sider/Templates fra Eksisterende Projekt (baseret på screenshots og plan):**
    *   **Kerne Layout:**
        *   `templates/base.html` (Grundlag for `app/layout.tsx` og `DashboardLayout.tsx`)
        *   `templates/_macros.html` (Potentielle genbrugelige UI-elementer/komponenter)
    *   **Autentificering:**
        *   `templates/auth/login.html` (JS: `static/js/login.js`?)
        *   `templates/auth/request_reset.html`
        *   `templates/auth/reset_password_form.html`
    *   **Hoved Dashboard/Forside:**
        *   `templates/index.html` (JS: `static/js/dashboard.js`? eller `static/js/app.js`?) -> Din "Home / dashboard"
    *   **Live Sports:**
        *   `templates/live_sports.html` (JS: `static/js/live_sports.js`)
    *   **Aktiedyst:**
        *   `templates/aktiedyst.html` (JS: `static/js/aktiedyst.js`)
    *   **Forum:**
        *   `templates/forum/category.html`
        *   `templates/forum/create_thread.html` (JS: `static/js/forum_forms.js`?)
        *   `templates/forum/edit_post.html` (JS: `static/js/forum_forms.js`?)
        *   `templates/forum/thread.html` (JS: `static/js/forum_thread.js`?)
        *   `templates/forum/search_results.html` (Forum-specifik søgning)
    *   **Brugerprofil & Indstillinger:**
        *   `templates/profile.html` (JS: `static/js/profile.js`)
        *   `templates/settings.html` (JS: `static/js/settings.js`)
    *   **Admin Sektion:**
        *   `templates/admin/menu.html` (og andre under `admin/`) (JS: `static/js/admin_menu.js`?)
    *   **Gamification/Interaktion:**
        *   `templates/badges/*` (Hvis dette er en feature, der skal med)
        *   `templates/game_area.html` (JS: `static/js/game_area.js`?)
        *   `templates/join_game.html` (JS: `static/js/join_game.js`?)
        *   `templates/leaderboard.html` (JS: `static/js/leaderboard.js`)
    *   **Beskeder (Messaging System):**
        *   `templates/messages/compose_message.html`
        *   `templates/messages/inbox.html`
        *   `templates/messages/sent.html`
        *   `templates/messages/view_message.html` (JS: `static/js/messages.js`?)
    *   **Notifikationer:**
        *   `templates/notifications/index.html`
    *   **Diverse Sider:**
        *   `templates/history.html` (JS: `static/js/history.js`?)
        *   `templates/search_results.html` (Generel søgning)
        *   `templates/active_sessions.html` (JS: `static/js/active_sessions.js`?)
        *   `templates/session_detail.html` (JS: `static/js/session_details.js`?)
    *   **Fejlsider:**
        *   `templates/errors/404.html`, `429.html`, `500.html`, etc. (Next.js har standardhåndtering, men indhold kan genbruges).
    *   **Globale JS-filer:**
        *   `static/js/app.js` (Overordnet app-logik?)
        *   `static/js/global.js` (Fælles funktioner?)
        *   `static/js/utils.js` (Hjælpefunktioner?)
*   **F2.1.2:** `[ ]` **Prioriteringsliste for *Indledende* Transformation i Fase 2 (justeret):**
    *   Denne liste fokuserer på de mest centrale brugerflader for at få en MVP (Minimum Viable Product) af de nye sektioner op at køre med statisk UI. Andre sider fra F2.1.1 transformeres efterfølgende.
    1.  **Login/Signup sider/modals** (`templates/auth/*`)
    2.  **Home / Dashboard** (`templates/index.html`)
    3.  **Live Sports Oversigt** (`templates/live_sports.html`)
    4.  **Aktiedyst Dashboard** (`templates/aktiedyst.html`)
    5.  **Forum (Kategoriliste & Trådliste)** (`templates/forum/category.html`, dele af `templates/forum/thread.html` for listevisning)
    6.  **Brugerprofil Side (Basisvisning & Indstillinger)** (`templates/profile.html`, `templates/settings.html`)
    7.  **(Overvej) Leaderboard** (`templates/leaderboard.html`) - da det ofte er en engagerende feature.
*   **F2.1.3:** `[ ]` **Dokumenter URL-struktur og Kernefunktionalitet:**
    *   For hver side/template på prioriteringslisten, dokumenter den gamle URL (hvis relevant) og den forventede nye Next.js URL.
    *   Beskriv kort kernefunktionaliteten, der skal genskabes statisk i Fase 2.
*   **F2.1.4:** `[ ]` **JavaScript Biblioteksanalyse (fra F2.0.3) - Dybdegående:**
    *   For hvert identificeret eksternt JS-bibliotek (f.eks. `anime.js`):
        *   Identificer præcis hvor og hvordan det bruges i det gamle projekt.
        *   Vurder om funktionaliteten kan og bør genskabes med Framer Motion (foretrukket for React-integration), Shadcn/ui komponenter, standard React/Tailwind/CSS, eller om biblioteket (eller et moderne alternativ) skal installeres i Next.js projektet.
        *   Planlæg integrationen. For unik, kompleks animation (som evt. fra `anime.js`) kan dette betyde integration i React-komponenter via `useEffect` og `refs` (potentielt udskudt til Fase 5, hvis kompleksiteten er høj og ikke kritisk for MVP).

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
*   **F2.7.1:** `[ ]` **Analyse af Gammelt HTML/CSS/Templates & `_macros.html`:**
    *   Gennemgå det gamle projekt, specielt `_macros.html` og de eksisterende templates systematisk for gennemgående UI-mønstre (f.eks. specifikke kort-layouts, listeelementer, datavisningsformater), der ikke direkte dækkes af standard Shadcn-komponenter, men som ønskes bibeholdt/moderniseret.
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
```
