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
