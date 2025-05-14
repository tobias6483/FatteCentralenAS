// static/js/app.js (Efter Refaktorering)

document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------------------
    // 1. Opret forbindelse til Socket.IO
    // -------------------------------------------------------------------------
    let socket = null;
    try {
        if (typeof io !== 'undefined') {
            socket = io();
            console.log("App.js: Socket.IO connection established.");
if (socket) {
                socket.on('admin_broadcast', function(data) {
                    console.log('Admin broadcast received:', data);
                    if (data && data.message && window.utils && typeof window.utils.showToast === 'function') {
                        // Determine toast type, e.g., 'info' or 'warning' based on data.sender or a fixed type
                        const toastType = 'info'; // Or make it configurable
                        window.utils.showToast(`Admin Broadcast: ${data.message}`, toastType, 10000); // Show for 10 seconds
                    }
                });
            }
        } else {
            console.warn("App.js: io() not found. Socket.IO not initialized.");
        }
    } catch (error) {
        console.error("App.js: Error initializing Socket.IO", error);
    }

    // Giv evt. adgang til socket globalt SIKKERT hvis andre moduler SKAL bruge den
    // Men det er BEDRE hvis session_details.js / aktiedyst.js også kalder io()
    // ELLER hvis man bruger et mere avanceret modul-system (import/export).
    // Simpel løsning:
    window.globalSocket = socket; // Andre scripts kan tjekke om window.globalSocket eksisterer.

    // -------------------------------------------------------------------------
    // 2. Globale variabler (fra base.html eller defaults)
    // -------------------------------------------------------------------------
    const currentUser = window.currentUser || "";
    const isAdmin = window.isAdmin || false;
    let userBalance = window.userBalance || 0;

    // -------------------------------------------------------------------------
    // 3. Avanceret modal (hvis brugt globalt)
    // -------------------------------------------------------------------------
    function showAdvancedModal(message, title = "Besked") {
       // ... (koden fra før, potentielt fjern hvis ikke brugt)
    }
    // Evt. eksportér den hvis nødvendigt (mindre ideelt globalt):
    // window.showAdvancedModal = showAdvancedModal;

    // -------------------------------------------------------------------------
    // 4. Update Sidebar (bruges globalt)
    // -------------------------------------------------------------------------
    const updateSidebar = (newBalance = null) => {
       // ... (koden fra før) ...
        if (newBalance !== null) {
             // Det er vigtigt at opdatere den globale `userBalance`, da `app.js` ejer den
             userBalance = newBalance;
             window.userBalance = newBalance; // Hold window scope synkroniseret
             console.log(`App.js: Sidebar updated via updateSidebar. New global balance: ${userBalance}`);
        }
       // ... (resten af UI opdateringskoden) ...
    };
    // Gør den globalt tilgængelig for fx renderPlayers i session_details.js
    window.updateGlobalSidebar = updateSidebar;


    // -------------------------------------------------------------------------
    // 5+ Alle specifikke Socket Listeners, Rendering og Feature-logik er nu FLYTTET
    //    til static/js/session_details.js og static/js/aktiedyst.js (og utils.js)
    // -------------------------------------------------------------------------


    // -------------------------------------------------------------------------
    // 11. INITIALISERING (Kun globale ting)
    // -------------------------------------------------------------------------
    try {
        console.log("App.js: Running global initializations.");

        // Kald for at sikre sidebar er korrekt ved *initial* load.
        // Senere opdateringer sker når `window.updateGlobalSidebar()` kaldes
        // fra f.eks. session_details.js -> renderPlayers.
        updateSidebar();

        // Initialiser andre globale ting fra utils.js hvis de findes
        if (typeof utils !== 'undefined' && utils.initializeTooltips) {
            utils.initializeTooltips();
            console.log("App.js: Tooltips initialized.");
        }
        // Andre globale listeners? F.eks. til logout knap, theme switcher...

     } catch (error) {
        console.error("Fejl under global initialisering i app.js:", error);
     }

    console.log("App.js Fully Loaded. Environment:", window.location.hostname);

}); // Slut på DOMContentLoaded
