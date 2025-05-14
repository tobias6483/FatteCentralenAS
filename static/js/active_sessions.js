// static/js/active_sessions.js (Version Utils Update)

// Sørg for utils.js er loaded før denne fil!

document.addEventListener("DOMContentLoaded", () => {
    console.log("Active sessions script loaded (Utils Update).");

    // --- Dependency Check (window.utils) ---
    if (typeof window.utils === 'undefined' ||
        !window.utils.getData ||
        !window.utils.toggleButtonLoading ||
        !window.utils.showToast ||
        !window.utils.formatDateTime ||
        !window.utils.escapeHtml ||
        !window.utils.showTableLoading || // Antager denne er flyttet til utils
        !window.utils.initializeTooltips) { // Antager denne er i utils og kan håndtere gen-init
        console.error("[ActiveSessions.js] CRITICAL: window.utils object or required functions (getData, toggleButtonLoading, showToast, formatDateTime, escapeHtml, showTableLoading, initializeTooltips) missing!");
        const errorContainer = document.getElementById('sessionsError') || document.getElementById('sessionsTableBody') || document.body;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i> Kritisk sidefejl: Nødvendige JavaScript-funktioner mangler. Sessionslisten kan ikke vises.';
        if (errorContainer) {
            // Prøv at vise i error container, ellers i table body, ellers øverst
             if (errorContainer.id === 'sessionsTableBody') {
                 errorContainer.innerHTML = `<tr><td colspan="5">${errorDiv.outerHTML}</td></tr>`; // Vis i tabel hvis det er det eneste sted
             } else {
                 errorContainer.innerHTML = ''; // Ryd evt. gammelt indhold
                 errorContainer.appendChild(errorDiv);
                 errorContainer.style.display = 'block';
             }
        }
        // Stop yderligere script kørsel
        return;
    } else {
         console.log("[ActiveSessions.js] window.utils object and required functions verified.");
    }

    // --- Socket.IO (Beholdes hvis relevant, bruger nu utils.showToast) ---
    try {
        const socket = io(); // Forbind til serveren
        socket.on('connect', () => {
            console.log("Socket.IO connected for active sessions page.");
            socket.emit("join", { room: "global_session_list" }); // Juster rum navn efter behov
        });
        socket.on('disconnect', () => {
             console.log("Socket.IO disconnected.");
         });
        socket.on('connect_error', (err) => {
            console.error('Socket.IO connection error:', err);
            window.utils.showToast("Kunne ikke forbinde til real-time opdateringer.", "warning"); // Brug utils.showToast
        });
        // --- Eksempler på real-time listeners ---
        // socket.on('session_update', (data) => {
        //     console.log('Socket.IO received session_update:', data);
        //     refreshSessions(); // Kald opdateringsfunktionen
        // });
        // socket.on('new_session', (data) => {
        //     console.log('Socket.IO received new_session:', data);
        //     window.utils.showToast(`Ny session '${data.session_name || 'Unavngivet'}' oprettet!`, 'info');
        //     refreshSessions();
        // });
        // socket.on('session_removed', (data) => {
        //      console.log('Socket.IO received session_removed:', data);
        //      window.utils.showToast(`Session (ID: ...${data.session_id.slice(-4)}) er fjernet.`, 'info');
        //      refreshSessions();
        // });

    } catch (e) {
         console.error("Socket.IO could not be initialized. Is the library loaded?", e);
         window.utils.showToast("Fejl ved initialisering af real-time funktioner.", "danger"); // Brug utils.showToast
    }


    // --- DOM Element Referencer ---
    const refreshBtn = document.getElementById("refresh_sessions_btn");
    const tableBody = document.getElementById('sessionsTableBody'); // Korrekt ID fra HTML
    const errorContainer = document.getElementById('sessionsError');

    // --- Lokal escapeHtml FJERNES - Bruger utils.escapeHtml ---
    // const escapeHtml = ...; // FJERNES

    // --- Funktion til at Hente og Vise Sessions ---
    async function refreshSessions() {
         console.log("Refreshing active sessions list...");

        if (!refreshBtn || !tableBody || !errorContainer) {
             console.error("Essential elements for active sessions not found in DOM.");
             return; // Stop hvis essentielle elementer mangler
         }

        // BRUG GLOBALE HELPERS FRA window.utils
        window.utils.toggleButtonLoading(refreshBtn, true);
        // Antager 5 kolonner: Navn, ID, Oprettet, Spillere, Deltag
        window.utils.showTableLoading(tableBody, true, 5, 'Henter sessions...'); // Brug utils.showTableLoading
         errorContainer.style.display = 'none'; // Skjul tidligere fejl

        try {
             // --- BRUG utils.getData TIL AT HENTE DATA ---
             // Korrekt endpoint: /api/sessions/active (juster hvis nødvendigt)
             const data = await window.utils.getData("/sessions/active_sessions"); // GET request via utils
             console.log("Received data:", data);

             // Tjek formatet af data fra API'et (lidt mere robust)
             let sessionList = [];
             if (Array.isArray(data)) {
                 sessionList = data;
             } else if (data && Array.isArray(data.sessions)) { // Standard nøgle?
                 sessionList = data.sessions;
             } else if (data && Array.isArray(data.active_sessions)) { // Alternativ nøgle
                sessionList = data.active_sessions;
             } else {
                 console.warn("Received unexpected data format for active sessions:", data);
                 throw new Error("Uventet dataformat modtaget fra server.");
             }

             renderSessionsTable(sessionList); // Kald render-funktionen (som nu bruger utils)
             // Opdater tabel state EFTER rendering
             window.utils.showTableLoading(tableBody, false, 5, '...', 'Ingen aktive sessioner fundet.'); // Brug utils.showTableLoading

         } catch (error) {
            console.error("Error fetching or rendering active sessions:", error);
            // Brug error.message fra utils.getData
            const errorMessage = error.message || 'Ukendt serverfejl';
            errorContainer.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>Fejl: ${window.utils.escapeHtml(errorMessage)}. <button type="button" class="btn-close float-end" data-bs-dismiss="alert" aria-label="Close"></button>`;
            errorContainer.style.display = 'block';
            // Opdater tabel state til fejl
            window.utils.showTableLoading(tableBody, false, 5, '...', 'Fejl ved hentning af data.'); // Brug utils.showTableLoading
            // Brug global showToast
             window.utils.showToast(`Fejl ved hentning af aktive sessions: ${errorMessage}`, "danger");
        } finally {
             // BRUG GLOBAL HELPER FRA window.utils
             window.utils.toggleButtonLoading(refreshBtn, false);
        }
    }

    // --- Funktion til at Bygge Tabel Rækker ---
    const renderSessionsTable = (sessions) => {
        if (!tableBody) return;

        // Ryd KUN eksisterende data-rækker
        tableBody.querySelectorAll('tr:not(.table-loading-row):not(.table-no-data-row)').forEach(row => row.remove());

        if (!sessions || sessions.length === 0) {
            console.log("No sessions data to render.");
            // utils.showTableLoading håndterer visning af "no data" row
            return;
        }

        sessions.forEach(session => {
            const tr = tableBody.insertRow(-1);
            tr.dataset.sessionId = session.session_id; // Gem ID hvis det skal bruges

            // Brug utils.escapeHtml og utils.formatDateTime
            const isCoupon = session.is_coupon === true; // Check the flag from backend
            const numSelections = session.num_selections ?? 0;
            let sessionNameDisplay;
            if (isCoupon) {
                // Format name for coupons
                sessionNameDisplay = `<i class="bi bi-ticket-detailed me-1" title="Kupon"></i> ${window.utils.escapeHtml(session.session_name ?? `Kupon (${numSelections} valg)`)}`;
            } else {
                // Standard name display
                sessionNameDisplay = window.utils.escapeHtml(session.session_name ?? "Unavngivet");
            }
            
            const sessionId = session.session_id ?? "-";
            const sessionIdShort = window.utils.escapeHtml(sessionId.substring(0, 8));
            const createdAt = window.utils.formatDateTime(session.created_at, 'da-DK', { dateStyle: 'short', timeStyle: 'short' }) ?? "-";
            const playersCount = session.players_count ?? 0;
            // Use session detail page URL instead of direct join
            const detailUrl = `/sessions/details/${encodeURIComponent(sessionId)}`;

            tr.innerHTML = `
                 <td>${sessionNameDisplay}</td>
                 <td><span class="badge bg-secondary font-monospace user-select-all" title="${window.utils.escapeHtml(sessionId)}">${sessionIdShort}</span></td>
                 <td>${createdAt}</td>
                 <td class="text-center">${playersCount}</td>
                 <td class="text-center">
                     <a href="${detailUrl}" class="btn btn-primary btn-sm" data-bs-toggle="tooltip" data-bs-placement="top" title="Se detaljer for: ${window.utils.escapeHtml(session.session_name ?? 'session')}">
                         <i class="bi bi-eye-fill"></i> {# Changed icon to 'view' #}
                     </a>
                 </td>
             `;
         });
         // Gen-initialiser tooltips for de nye knapper via utils
         window.utils.initializeTooltips(tableBody);
     };


     // --- Lokal reinitializeTooltips FJERNES - Bruger utils.initializeTooltips ---
     // function reinitializeTooltips(...) { ... } // FJERNES

     // --- Event Listener og Initial Load ---
    if (refreshBtn) {
         refreshBtn.addEventListener('click', refreshSessions);
     } else {
         console.warn("Refresh button (#refresh_sessions_btn) not found.");
     }

     // Kald funktionen for at hente data når siden loader
     refreshSessions();

    // --- Gør refresh funktionen tilgængelig for Socket.IO hvis nødvendigt ---
    // window.refreshActiveSessions = refreshSessions; // Overvej om det er nødvendigt

    console.log("Active sessions script initialization complete.");

}); // End DOMContentLoaded
