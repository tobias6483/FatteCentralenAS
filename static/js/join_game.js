// static/js/join_game.js (Version Utils Update)
document.addEventListener("DOMContentLoaded", () => {
    console.log("Join Game script loaded (Utils Update).");

    // --- Dependency Check (window.utils) ---
    if (typeof window.utils === 'undefined' ||
        !window.utils.showToast ||
        !window.utils.postData ||
        !window.utils.toggleButtonLoading ||
        !window.utils.escapeHtml) { // God at have tjekket for fremtiden
        console.error("[JoinGame.js] CRITICAL: window.utils object or required functions (showToast, postData, toggleButtonLoading, escapeHtml) missing!");
        const container = document.getElementById('joinGameForm') || document.body;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i> Kritisk sidefejl: Nødvendige JavaScript-funktioner mangler. Kan ikke tilmelde sig sessioner.';
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
        // Deaktiver formen
        const form = document.getElementById('joinGameForm');
        if (form) form.querySelectorAll('input, button').forEach(el => el.disabled = true);
        return; // Stop script execution
    } else {
         console.log("[JoinGame.js] window.utils object and required functions verified.");
    }

    // --- Globale Variabler & Socket Setup ---
    const currentUser = window.currentUser || "UkendtBruger";
    let socket;

    try {
        socket = io();
        console.log("Socket.IO connection initiated.");

        // Lyt efter beskeder når ANDRE spillere joiner
        socket.on("player_joined", (data) => {
            console.log("Socket event received: player_joined", data);
            // Escape navne og ID for sikkerhed
            const safePlayerName = window.utils.escapeHtml(data.player_name || 'Ukendt');
            const safeSessionName = window.utils.escapeHtml(data.session_name || data.session_id || 'Ukendt Session');
            const notification = `Spiller ${safePlayerName} tilmeldte sig ${safeSessionName}`;

            // Prøv at logge i liveBetLog, ellers vis toast
            const liveBetLog = document.getElementById("live_bet_log");
            if (liveBetLog) {
                const li = document.createElement("li");
                 li.className = 'list-group-item list-group-item-info list-group-item-sm p-1 small';
                li.textContent = notification; // Already escaped
                liveBetLog.prepend(li);
                while (liveBetLog.children.length > 10) {
                     liveBetLog.removeChild(liveBetLog.lastChild);
                }
            } else {
                 window.utils.showToast(notification, "info"); // Use utils.showToast
             }
         });

         // Håndter evt. connection errors
         socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
             window.utils.showToast('Kunne ikke forbinde til realtime server.', 'warning'); // Use utils.showToast
         });

         // Tilføj flere relevante listeners her...
         // socket.on('join_error', (data) => { ... });
         // socket.on('room_joined', (data) => { ... });

    } catch (e) {
         console.error("Failed to initialize Socket.IO:", e);
         window.utils.showToast('Realtime funktioner er utilgængelige.', 'danger'); // Use utils.showToast
    }


    // --- DOM Element References ---
    const joinForm = document.getElementById('joinGameForm');
    const sessionIdInput = document.getElementById('joinSessionIdInput');
    const sessionPasswordInput = document.getElementById('joinSessionPasswordInput'); // Added password input
    const joinBtn = document.getElementById('joinSessionBtn');
    const feedbackDiv = document.getElementById('joinSessionFeedback');

    // --- Lokal Feedback Funktion (Beholdes til inline form feedback) ---
    const showFeedback = (feedbackElement, message, type = 'danger') => {
        if (!feedbackElement) return;
        if (!message) {
            feedbackElement.innerHTML = '';
            feedbackElement.classList.add('d-none');
            return;
        }
        const alertClass = `alert-${type}`;
        const iconClass = type === 'success' ? 'bi-check-circle-fill' : type === 'warning' ? 'bi-exclamation-triangle-fill' : type === 'info' ? 'bi-info-circle-fill' : 'bi-x-octagon-fill';
        const safeMessage = window.utils.escapeHtml ? window.utils.escapeHtml(message) : message; // Escape using utils
        feedbackElement.innerHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show small d-flex align-items-center mt-2 mb-0" role="alert" >
                <i class="bi ${iconClass} flex-shrink-0 me-2"></i>
                <div class="flex-grow-1">${safeMessage}</div>
                <button type="button" class="btn-close btn-sm" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        feedbackElement.classList.remove('d-none');
    };


    // --- Håndter form submission (bruger utils) ---
    // Added sessionPasswordInput to the check
    if (joinForm && sessionIdInput && sessionPasswordInput && joinBtn && feedbackDiv) {
        joinForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            showFeedback(feedbackDiv, '', 'info'); // Ryd lokal feedback
            sessionIdInput.classList.remove('is-invalid'); // Ryd validering
            sessionPasswordInput.classList.remove('is-invalid'); // Ryd validering for password field too

            const sessionId = sessionIdInput.value.trim();
            const sessionPassword = sessionPasswordInput.value; // Get password (don't trim passwords)

            // Simpel klient-side validering
            if (!sessionId) {
                window.utils.showToast('Indtast venligst et Session ID.', 'warning'); // Use utils.showToast
                sessionIdInput.classList.add('is-invalid'); // Markér feltet
                sessionIdInput.focus();
                return;
            }

            console.log(`Attempting to join session: ${sessionId} as user: ${currentUser}`);
            window.utils.toggleButtonLoading(joinBtn, true); // Use utils

            try {
                 // --- Brug utils.postData ---
                 // ERSTAT MED KORREKT ENDPOINT HVIS NØDVENDIGT!
                const payload = {
                    session_id: sessionId,
                    player_name: currentUser // Send bruger med hvis backend forventer det
                };
                // Only include password in payload if it's not empty
                if (sessionPassword) {
                    payload.session_password = sessionPassword;
                }

                const data = await window.utils.postData("/sessions/join_session", payload);

                // --- Håndter Succes ---
                console.log("Successfully joined session:", data);
                 // Brug utils.showToast
                 const safeSessionId = window.utils.escapeHtml(sessionId);
                 // Format balance hvis muligt
                 const balanceFormatted = window.utils.formatCurrency ? window.utils.formatCurrency(data.balance ?? 0) : `kr ${data.balance ?? 'N/A'}`;
                 window.utils.showToast(`Du er nu med i session: ${safeSessionId}. Din saldo: ${balanceFormatted}`, "success", 5000); // Vis i 5 sek

                // Informer Socket.IO server om at joine rummet
                 if (socket) {
                    const roomName = `session_${sessionId}`;
                    socket.emit("join_room", { room: roomName, player_name: currentUser });
                    console.log(`Emitted 'join_room' for room: ${roomName}`);
                 } else {
                     console.warn("Socket not available, cannot emit 'join_room'.");
                 }

                 sessionIdInput.value = ""; // Ryd input felt
                 sessionPasswordInput.value = ""; // Ryd password felt
                 // Deaktiver knap mens vi venter på redirect
                 window.utils.toggleButtonLoading(joinBtn, true, 'Tilsluttet!');

                // Omdiriger efter en pause
                 setTimeout(() => {
                    window.location.href = "/sessions/active_sessions"; // Eller brug en route genereret af backend
                 }, 1500); // 1.5 sekunders delay

             } catch (error) {
                // --- Håndter Fejl ---
                console.error("Error joining session via submit:", error);
                 const errorMessage = error.message || 'Der opstod en ukendt fejl ved tilmelding.';
                 window.utils.showToast(errorMessage, 'danger'); // Use utils.showToast
                 showFeedback(feedbackDiv, errorMessage, 'danger'); // Vis også lokalt
                 // Mark the relevant field as invalid based on error message
                 if (errorMessage.toLowerCase().includes('kodeord')) {
                    sessionPasswordInput.classList.add('is-invalid');
                    sessionPasswordInput.focus();
                 } else {
                    sessionIdInput.classList.add('is-invalid'); // Markér feltet
                    sessionIdInput.select();
                 }
                 // Sørg for at loading state fjernes ved fejl
                 window.utils.toggleButtonLoading(joinBtn, false); // Use utils

             }
             // finally block er ikke nødvendig her, da success fører til redirect
         });
    } else {
        console.warn("Could not find necessary elements for Join Game form (joinGameForm, join_session_id, join_session_btn, join_session_msg).");
        // Deaktiver formen helt hvis elementer mangler?
        if (joinForm) joinForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
    }

    console.log("Join Game script initialization complete.");

}); // End DOMContentLoaded
