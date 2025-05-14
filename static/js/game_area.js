// static/js/game_area.js (Version Utils Update)

// Sørg for utils.js og socket.io library er loaded før denne fil.

document.addEventListener("DOMContentLoaded", () => {
    console.log("Game Area JS Loaded (Utils Update). Dependencies: utils.js, socket.io");

    // --- Dependency Check (window.utils) ---
    if (typeof window.utils === 'undefined' ||
        !window.utils.showToast ||
        !window.utils.postData ||
        !window.utils.toggleButtonLoading ||
        !window.utils.escapeHtml) { // escapeHtml er god at have til fremtiden
        console.error("[GameArea.js] CRITICAL: window.utils object or required functions (showToast, postData, toggleButtonLoading, escapeHtml) missing!");
        const container = document.getElementById('createGameForm') || document.body;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i> Kritisk sidefejl: Nødvendige JavaScript-funktioner mangler. Spiloprettelse er deaktiveret.';
        if (container) {
             container.insertBefore(errorDiv, container.firstChild);
        }
        // Deaktiver opret-knap
        const createBtn = document.getElementById('createGameBtn');
        if(createBtn) createBtn.disabled = true;
        // Overvej at deaktivere hele formen
        // const form = document.getElementById('createGameForm');
        // if (form) form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
        return; // Stop script execution
    } else {
         console.log("[GameArea.js] window.utils object and required functions verified.");
    }

    // --- Globale Variable & Socket Setup ---
    const currentUser = window.currentUser || "Guest";
    let socket;
    try {
        socket = io();
        socket.on('connect', () => {
             console.log("Socket.IO connected for Game Area.");
        });
         socket.on('connect_error', (err) => {
            console.error("Game Area Socket.IO connection error:", err);
            window.utils.showToast("Kunne ikke forbinde til real-time server.", "warning"); // Use utils.showToast
         });
         // Tilføj flere listeners her hvis nødvendigt (f.eks. bekræftelse på join)
         // socket.on('room_joined', (data) => {
         //    window.utils.showToast(`Joined session room: ${data.room}`, 'info');
         // });
         // socket.on('join_error', (data) => {
         //    window.utils.showToast(`Could not join room ${data.room}: ${data.error}`, 'warning');
         // });
    } catch(e) {
        console.error("Socket.IO failed to initialize.", e);
        window.utils.showToast("Real-time funktionalitet er muligvis utilgængelig.", "danger"); // Use utils.showToast
    }


    // --- DOM Element Referencer ---
    const gameModeSelect = document.getElementById('gameModeSelect');
    const allOutcomeSections = document.querySelectorAll('.outcome-section');
    const createGameForm = document.getElementById('createGameForm');
    const createGameBtn = document.getElementById('createGameBtn'); // This button now triggers the modal
    const feedbackDiv = document.getElementById('createGameFeedback'); // Feedback for the main form

    // --- Modal Element References ---
    const sessionSettingsModalEl = document.getElementById('sessionSettingsModal');
    const sessionSettingsForm = document.getElementById('sessionSettingsForm'); // Form inside modal
    const modalSessionNameInput = document.getElementById('modalSessionName');
    const modalMaxPlayersInput = document.getElementById('modalMaxPlayers');
    const modalIsPrivateCheckbox = document.getElementById('modalIsPrivate');
    const modalPasswordGroup = document.getElementById('modalPasswordGroup');
    const modalSessionPasswordInput = document.getElementById('modalSessionPassword');
    const modalCreateBtn = document.getElementById('modalCreateBtn'); // Create button inside modal
    const modalCancelBtn = document.getElementById('modalCancelBtn'); // Cancel button inside modal
    const modalFeedbackDiv = document.getElementById('modalSettingsFeedback'); // Feedback inside modal

    // --- Modal Instance ---
    let sessionSettingsModalInstance = null;
    if (sessionSettingsModalEl && typeof bootstrap !== 'undefined') {
        sessionSettingsModalInstance = bootstrap.Modal.getOrCreateInstance(sessionSettingsModalEl);
    } else {
        console.error("Session Settings Modal element or Bootstrap not found!");
        // Disable create button if modal cannot be shown
        if(createGameBtn) createGameBtn.disabled = true;
    }

    // --- Temporary storage for game data before modal submission ---
    let pendingGameData = null;


    // --- Lokal UI Logik (Beholdes lokalt - specifik for denne form) ---

    // Viser/skjuler sektioner baseret på valg og opdaterer 'required'
    function toggleOutcomeSections() {
        if (!gameModeSelect || allOutcomeSections.length === 0) {
            console.warn("Game mode select or outcome sections not found.");
            return;
        }
        const selectedMode = gameModeSelect.value;
        console.log("Game mode changed to:", selectedMode);
        allOutcomeSections.forEach(section => {
             const isActive = section.dataset.gameMode === selectedMode;
             // Brug d-none for kompatibilitet med Bootstrap hiding/showing
             section.classList.toggle('d-none', !isActive);
             section.classList.toggle('active', isActive); // Behold 'active' for CSS/JS logik

            setRequiredAttributes(section, isActive); // Opdater required baseret på synlighed
        });
    }

    // Sætter/fjerner required baseret på sektionens aktivitet
    function setRequiredAttributes(sectionElement, isRequired) {
        const inputs = sectionElement.querySelectorAll('input[data-was-required], select[data-was-required], input[required], select[required]');
        const drawNameInput = sectionElement.querySelector('input[name="fictive_draw_name"]'); // Mere robust selector
        const drawOddsInput = sectionElement.querySelector('input[name="fictive_draw_odds"]');

        inputs.forEach(input => {
            // Husk original 'required' state hvis den ikke allerede er husket
            if (!input.hasAttribute('data-was-required') && input.required) {
                input.setAttribute('data-was-required', 'true');
            }

            // Speciel logik for draw odds
            if (input === drawOddsInput && drawNameInput) {
                const requiresDrawOdds = isRequired && drawNameInput.value.trim() !== '';
                input.required = requiresDrawOdds;
            } else {
                // Standard logik: Sæt required hvis sektionen er aktiv OG input originalt var required
                const wasRequired = input.getAttribute('data-was-required') === 'true';
                input.required = isRequired && wasRequired;
            }
             // Fjern 'is-invalid' hvis feltet ikke længere er required og aktivt
             if (!input.required && sectionElement.classList.contains('active')) {
                 input.classList.remove('is-invalid');
             }
        });

        // Tilføj listener for draw name input dynamisk
        if (drawNameInput && drawOddsInput) {
            drawNameInput.removeEventListener('input', handleDrawNameInput); // Fjern gammel
            drawNameInput.addEventListener('input', handleDrawNameInput);
        }
    }
    // Handler for draw name input - defineres én gang
    function handleDrawNameInput() {
        const drawNameInput = this;
        const sectionElement = drawNameInput.closest('.outcome-section');
        const drawOddsInput = sectionElement?.querySelector('input[name="fictive_draw_odds"]');
        if (sectionElement?.classList.contains('active') && drawOddsInput) {
            const requiresDrawOdds = drawNameInput.value.trim() !== '';
            drawOddsInput.required = requiresDrawOdds;
            console.log(`Draw Name changed, Draw Odds required = ${requiresDrawOdds}`);
            // Valider odds feltet igen hvis navnet fjernes, men det var markeret ugyldigt
             if (!requiresDrawOdds) {
                drawOddsInput.classList.remove('is-invalid'); // Fjern evt. fejlstate
            }
        }
    }

    // --- Lokal Feedback Funktion (Kan bruges til BÅDE main form og modal) ---
    const showFeedback = (feedbackElement, message, type = 'danger') => {
        if (!feedbackElement) {
            console.warn("showFeedback called with no feedbackElement");
            return;
        }
        if (!message) {
            feedbackElement.innerHTML = '';
            feedbackElement.classList.add('d-none');
            return;
        }
        const alertClass = `alert-${type}`;
        const iconClass = type === 'success' ? 'bi-check-circle-fill' : type === 'warning' ? 'bi-exclamation-triangle-fill' : type === 'info' ? 'bi-info-circle-fill' : 'bi-x-octagon-fill';
        // Escape message just in case, using utils.escapeHtml if available
        const safeMessage = window.utils.escapeHtml ? window.utils.escapeHtml(message) : message;
        feedbackElement.innerHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show small d-flex align-items-center mt-2 mb-0" role="alert" >
                <i class="bi ${iconClass} flex-shrink-0 me-2"></i>
                <div class="flex-grow-1">${safeMessage}</div>
                <button type="button" class="btn-close btn-sm" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        feedbackElement.classList.remove('d-none');
    };


    // --- Form Submission & API Kald (Bruger nu utils) ---

    if (createGameBtn) {
        // --- Event Listener for the MAIN Create Button (triggers modal) ---
        createGameBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Stop normal submit
            showFeedback(feedbackDiv, '', 'info'); // Clear main form feedback
            pendingGameData = null; // Clear any previous pending data

            const activeSection = document.querySelector('.outcome-section.active');
             if (!createGameForm || !activeSection || !gameModeSelect) {
                 window.utils.showToast("Fejl: Nødvendige elementer for spiloprettelse mangler.", "danger"); // Use utils
                 window.utils.toggleButtonLoading(createGameBtn, false); // Use utils
                 return;
             }

            // --- 1. Validate the main form first ---
            let isMainFormValid = true;
            // Ryd tidligere .is-invalid on active section
            activeSection.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            // Find alle synlige inputs/selects i den aktive sektion der er required
            const activeRequiredInputs = activeSection.querySelectorAll('input:required, select:required');
            activeRequiredInputs.forEach(input => {
                if (!input.checkValidity()) {
                    isMainFormValid = false;
                    input.classList.add('is-invalid');
                    input.addEventListener('input', () => input.classList.remove('is-invalid'), { once: true });
                }
            });

            if (!isMainFormValid) {
                window.utils.showToast('Udfyld venligst spillets detaljer korrekt først.', 'warning'); // Use utils
                // Find det første ugyldige felt og fokuser på det for bedre UX
                const firstInvalid = activeSection.querySelector('.is-invalid');
                if (firstInvalid) firstInvalid.focus();
                return; // Stop if main form is invalid
            }

            // --- 2. Gather data from the main form ---
            const gameMode = gameModeSelect.value;
            const collectedGameData = {
                game_mode: gameMode,
                session_name: "", // Will be set in the modal
                outcomes: []
            };

            try {
                let suggestedSessionName = "";
                if (gameMode === 'yesno') {
                    // Robust selector - find session name if it exists, else default
                    const sessionNameInput = activeSection.querySelector('input[name="yesno_session_name"]');
                    suggestedSessionName = sessionNameInput?.value.trim() || "Ja/Nej Spil";
                    const outcome1Name = activeSection.querySelector('input[name="yesno_outcome1_name"]').value.trim() || "Ja";
                    const outcome1Odds = parseFloat(activeSection.querySelector('input[name="yesno_outcome1_odds"]').value);
                    const outcome2Name = activeSection.querySelector('input[name="yesno_outcome2_name"]').value.trim() || "Nej";
                    const outcome2Odds = parseFloat(activeSection.querySelector('input[name="yesno_outcome2_odds"]').value);
                    if (isNaN(outcome1Odds) || isNaN(outcome2Odds) || outcome1Odds < 1.01 || outcome2Odds < 1.01) {
                        throw new Error("Ugyldige odds angivet for Ja/Nej (skal være >= 1.01).");
                    }
                    collectedGameData.outcomes = [ { name: outcome1Name, odds: outcome1Odds }, { name: outcome2Name, odds: outcome2Odds } ];
                } else if (gameMode === 'fictional_sport') {
                    suggestedSessionName = activeSection.querySelector('input[name="fictive_event_name"]').value.trim() || "Fiktiv Sport";
                    const team1Name = activeSection.querySelector('input[name="fictive_team1_name"]').value.trim() || "Hold 1";
                    const team1Odds = parseFloat(activeSection.querySelector('input[name="fictive_team1_odds"]').value);
                    const team2Name = activeSection.querySelector('input[name="fictive_team2_name"]').value.trim() || "Hold 2";
                    const team2Odds = parseFloat(activeSection.querySelector('input[name="fictive_team2_odds"]').value);
                    const drawName = activeSection.querySelector('input[name="fictive_draw_name"]').value.trim();
                    const drawOddsInput = activeSection.querySelector('input[name="fictive_draw_odds"]');
                    const drawOdds = drawOddsInput ? parseFloat(drawOddsInput.value) : NaN;

                    if (isNaN(team1Odds) || isNaN(team2Odds) || team1Odds < 1.01 || team2Odds < 1.01) { throw new Error("Ugyldige odds angivet for hold (skal være >= 1.01)."); }
                    collectedGameData.outcomes = [ { name: team1Name, odds: team1Odds }, { name: team2Name, odds: team2Odds } ];
                    if (drawName) {
                        if (isNaN(drawOdds) || drawOdds < 1.01) { throw new Error("Ugyldige odds angivet for uafgjort (skal være >= 1.01)."); }
                        collectedGameData.outcomes.push({ name: drawName, odds: drawOdds });
                    }
                } else {
                    throw new Error("Ukendt spiltype valgt.");
                }

                // --- 3. Store collected data and show modal ---
                pendingGameData = collectedGameData; // Store data for modal submission
                console.log("Main form valid. Pending game data:", pendingGameData);

                // Pre-fill modal fields
                if (modalSessionNameInput) modalSessionNameInput.value = suggestedSessionName;
                if (modalMaxPlayersInput) modalMaxPlayersInput.value = 0; // Default
                if (modalIsPrivateCheckbox) modalIsPrivateCheckbox.checked = false;
                if (modalSessionPasswordInput) modalSessionPasswordInput.value = '';
                if (modalPasswordGroup) modalPasswordGroup.style.display = 'none'; // Hide password initially
                showFeedback(modalFeedbackDiv, '', 'info'); // Clear modal feedback

                // Show the modal
                if (sessionSettingsModalInstance) {
                    sessionSettingsModalInstance.show();
                } else {
                     window.utils.showToast("Fejl: Kunne ikke åbne indstillingsdialogen.", "danger");
                }

            } catch (error) {
                 // Show validation errors from data gathering
                 window.utils.showToast(`Fejl i spildata: ${error.message}`, "warning");
                 showFeedback(feedbackDiv, `Fejl: ${error.message}`, 'warning'); // Show in main form feedback
            }
        }); // End of createGameBtn listener

        // --- Event Listener for MODAL Create Button ---
        if (modalCreateBtn && sessionSettingsModalInstance) {
            modalCreateBtn.addEventListener('click', async () => {
                if (!pendingGameData) {
                    showFeedback(modalFeedbackDiv, "Fejl: Manglende spildata. Prøv igen.", "danger");
                    window.utils.showToast("Intern fejl: Manglende spildata.", "danger");
                    return;
                }

                window.utils.toggleButtonLoading(modalCreateBtn, true, "Opretter...");
                showFeedback(modalFeedbackDiv, '', 'info'); // Clear modal feedback

                // Gather settings from modal
                const sessionName = modalSessionNameInput?.value.trim() || pendingGameData.session_name || "Unavngivet Session";
                const maxPlayers = parseInt(modalMaxPlayersInput?.value || '0', 10);
                const isPrivate = modalIsPrivateCheckbox?.checked || false;
                const sessionPassword = modalSessionPasswordInput?.value; // Get password regardless of checkbox for now

                // Basic modal validation
                if (!sessionName) {
                    showFeedback(modalFeedbackDiv, "Session navn må ikke være tomt.", "warning");
                    window.utils.toggleButtonLoading(modalCreateBtn, false);
                    modalSessionNameInput?.focus();
                    return;
                }
                if (isPrivate && !sessionPassword) {
                    showFeedback(modalFeedbackDiv, "Kodeord skal angives for privat session.", "warning");
                    window.utils.toggleButtonLoading(modalCreateBtn, false);
                    modalSessionPasswordInput?.focus();
                    return;
                }

                // Combine main form data with modal settings
                const finalPayload = {
                    ...pendingGameData, // Includes game_mode, outcomes
                    session_name: sessionName,
                    max_players: isNaN(maxPlayers) ? 0 : maxPlayers, // Ensure it's a number
                    is_private: isPrivate,
                    session_password: isPrivate ? sessionPassword : null // Only send password if private
                };

                console.log("Submitting final data from modal:", finalPayload);

                try {
                    // ---- CALL API VIA utils.postData ----
                    const result = await window.utils.postData("/sessions/create_session", finalPayload);
                    console.log("Create session result:", result);

                    // Hide modal on success
                    sessionSettingsModalInstance.hide();

                    // Show success toast
                    const sessionNameEscaped = window.utils.escapeHtml(result.session_name || finalPayload.session_name);
                    const sessionIdEscaped = window.utils.escapeHtml(result.session_id);
                    window.utils.showToast(`Session '${sessionNameEscaped}' oprettet! ID: ${sessionIdEscaped}`, "success", 7000);

                    // Join room via Socket.IO
                    if (socket && result.session_id && currentUser) {
                        const roomName = "session_" + result.session_id;
                        console.log(`Emitting join_room for ${roomName}`);
                        socket.emit("join_room", { room: roomName, player_name: currentUser });
                    }

                    // Reset the main form and UI state
                    createGameForm.reset();
                    document.querySelectorAll('.outcome-section.active .is-invalid').forEach(el => el.classList.remove('is-invalid'));
                    toggleOutcomeSections();
                    showFeedback(feedbackDiv, '', 'info'); // Clear main form feedback
                    pendingGameData = null; // Clear pending data

                } catch (error) {
                    console.error("Error creating game session from modal:", error);
                    // Show error in modal feedback
                    showFeedback(modalFeedbackDiv, `Fejl: ${error.message || 'Ukendt serverfejl'}`, "danger");
                    // Show global toast
                    window.utils.showToast(`Fejl ved oprettelse: ${error.message || 'Ukendt fejl'}`, "danger");
                } finally {
                    // Stop loading state on modal button
                    window.utils.toggleButtonLoading(modalCreateBtn, false);
                }
            });
        } // End of modalCreateBtn listener

        // --- Event Listener for Private Checkbox ---
        if (modalIsPrivateCheckbox && modalPasswordGroup) {
            modalIsPrivateCheckbox.addEventListener('change', () => {
                modalPasswordGroup.style.display = modalIsPrivateCheckbox.checked ? 'block' : 'none';
                if (modalIsPrivateCheckbox.checked && modalSessionPasswordInput) {
                    modalSessionPasswordInput.required = true; // Make password required if private
                } else if (modalSessionPasswordInput) {
                    modalSessionPasswordInput.required = false;
                    modalSessionPasswordInput.value = ''; // Clear password if made public
                    modalSessionPasswordInput.classList.remove('is-invalid'); // Clear validation state
                }
            });
        }

    } else {
        console.warn("Create game button not found.");
    }


     // --- Initialisering ---
     if (gameModeSelect) {
         gameModeSelect.addEventListener('change', toggleOutcomeSections);
         // Initial kald for at sætte den korrekte sektion ved pageload
        toggleOutcomeSections();
     } else {
          console.warn("Game mode select element not found.");
          // Deaktiver opret-knap hvis select mangler
          if(createGameBtn) createGameBtn.disabled = true;
     }

    console.log("Game Area script initialization complete.");

}); // End DOMContentLoaded
