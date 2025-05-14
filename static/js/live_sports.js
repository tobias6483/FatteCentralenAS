// static/js/live_sports.js - OPdateret til at bruge window.utils og implementere forbedringspunkter
// Inkluderer nu modal flow for session creation

document.addEventListener("DOMContentLoaded", () => {
    console.log("[LS Log][Init] ---> DOMContentLoaded event fired. Script start.");

    // ----- Globale Variabler / State -----
    console.log("[LS Log][Init] Deklarerer globale variabler (window.globalSportsData, autoRefreshIntervalId, etc.)");
    window.globalSportsData = []; // Holds the raw event data from the API
    let currentCouponSelections = []; // Holds items selected for the current coupon
    let autoRefreshIntervalId = null;
    let catalogOffcanvasInstance = null;
    const REFRESH_INTERVAL_MS = 30000; // 30 sekunder
    let initialLoadCompleted = false; // Flag for at vide hvornår siden er "klar"
    let sessionSettingsModalInstance = null; // For the new modal
    let pendingSessionPayload = null; // To store data before modal confirmation

    // ----- Tjek for nødvendigt utils objekt og funktioner -----
    console.log("[LS Log][Init] Tjekker for globalt 'utils' objekt og nødvendige funktioner.");
    const utils = window.utils; // Få fat i utils objektet
    let essentialUtilsMissing = false;
    if (!utils) {
        console.error("[LS Log][Init] !! KRITISK FEJL !! 'window.utils' objekt mangler globalt.");
        essentialUtilsMissing = true;
    } else {
        // Nødvendige funktioner for denne fil
        const requiredUtils = [
            'postData',
            'getData',
            'showToast',
            'toggleButtonLoading',
            'escapeHtml'
        ];
        requiredUtils.forEach(funcName => {
            if (typeof utils[funcName] !== 'function') {
                if (funcName === 'escapeHtml') {
                    console.warn(`[LS Log][Init] Funktion 'utils.${funcName}' mangler. HTML escaping vil blive sprunget over.`);
                    utils.escapeHtml = (unsafe) => unsafe || '';
                } else {
                    console.error(`[LS Log][Init] !! KRITISK FEJL !! 'utils.${funcName}' funktion mangler.`);
                    essentialUtilsMissing = true;
                }
            }
        });

        if (typeof utils.showToast !== 'function') {
            console.warn("[LS Log][Init] 'utils.showToast' funktion mangler. Toast-beskeder vil ikke blive vist.");
            utils.showToast = (msg, type = 'info') => {
                console.warn(`[LS Log][Fallback] [Toast Fallback (${type})]: ${msg}`);
            };
        }
    }

    // ----- Element Referencer -----
    console.log("[LS Log][Init] Henter DOM element referencer...");
    const dataContainer = document.getElementById("sports_data_container");
    const dataLoadingDiv = document.getElementById('sportsDataLoading');
    const dataErrorDiv = document.getElementById('sportsDataError');
    const eventsListDiv = document.getElementById('sports_events_list');
    const noDataMessage = document.getElementById('noDataMessage');
    const refreshBtn = document.getElementById('refresh_sports_btn');
    const applyFilterBtn = document.getElementById('apply_filter_btn');
    const autoRefreshCheckbox = document.getElementById('auto_refresh_checkbox');
    const sportSelect = document.getElementById('filter_sport_select');
    const regionSelect = document.getElementById('filter_region_select');
    const marketSelect = document.getElementById('filter_markets_select');
    const showCatalogBtn = document.getElementById('show_sports_catalog_btn');
    const catalogOffcanvasElement = document.getElementById('sports_catalog_container');
    const catalogListDiv = document.getElementById('sports_catalog_list');
    const catalogLoadingDiv = document.getElementById('catalogLoading');
    const catalogErrorDiv = document.getElementById('catalogError');
    const catalogEmptyMsg = document.getElementById('catalogEmptyMessage');
    const retryFetchBtn = dataErrorDiv?.querySelector('.retry-fetch-link');
    const retryCatalogLink = catalogErrorDiv?.querySelector('#retry_catalog_link');

    // --- Modal Element References ---
    const sessionSettingsModalEl = document.getElementById('sessionSettingsModal');
    const sessionSettingsForm = document.getElementById('sessionSettingsForm');
    const modalSessionNameInput = document.getElementById('modalSessionName');
    const modalMaxPlayersInput = document.getElementById('modalMaxPlayers');
    const modalIsPrivateCheckbox = document.getElementById('modalIsPrivate');
    const modalPasswordGroup = document.getElementById('modalPasswordGroup');
    const modalSessionPasswordInput = document.getElementById('modalSessionPassword');
    const modalCreateBtn = document.getElementById('modalCreateBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalFeedbackDiv = document.getElementById('modalSettingsFeedback');

    console.log("[LS Log][Init] DOM referencer hentet.");
    console.log(`[LS Log][Init] Retry Fetch Data knap fundet? ${!!retryFetchBtn}`);
    console.log(`[LS Log][Init] Retry Katalog knap fundet? ${!!retryCatalogLink}`);
    console.log(`[LS Log][Init] Session Settings Modal fundet? ${!!sessionSettingsModalEl}`);


    // ----- Kritisk Element Tjek -----
    console.log("[LS Log][Init] Starter kritisk element tjek...");
    const requiredElements = { dataContainer, dataLoadingDiv, dataErrorDiv, eventsListDiv, noDataMessage, refreshBtn, applyFilterBtn, autoRefreshCheckbox, sportSelect, regionSelect, marketSelect, showCatalogBtn, catalogOffcanvasElement, catalogListDiv, catalogLoadingDiv, catalogErrorDiv, catalogEmptyMsg };
    const missingElements = Object.entries(requiredElements).filter(([, el]) => !el).map(([key]) => key);

    if (missingElements.length > 0 || essentialUtilsMissing) {
        const missingElementMsg = missingElements.length > 0 ? `Nødvendige HTML elementer mangler: ${missingElements.join(', ')}. ` : '';
        const missingUtilsMsg = essentialUtilsMissing ? "Nødvendige 'utils' funktioner mangler (se konsol). " : '';
        const fullErrorMsg = `Fejl i sideopsætning eller grundlæggende scripts. ${missingElementMsg}${missingUtilsMsg}Scriptet kan ikke køre korrekt.`;

        console.error(`[LS Log][Init] !! ${fullErrorMsg}`);
         if (dataContainer) {
             console.log("[LS Log][Init] Forsøger at vise fejl i UI.");
             if(dataLoadingDiv) dataLoadingDiv.style.display = 'none';
             if(dataErrorDiv) dataErrorDiv.style.display = 'flex'; // Vis fejl
             if(eventsListDiv) eventsListDiv.style.display = 'none';
             if(noDataMessage) noDataMessage.style.display = 'none';
             const heading = dataErrorDiv?.querySelector('.alert-heading');
             const paragraph = dataErrorDiv?.querySelector('p');
             if(heading) heading.textContent = 'Fejl i sideopsætning';
             if(paragraph) paragraph.textContent = `${missingElementMsg}${missingUtilsMsg} Tjek HTML ('live_sports.html') og konsollen.`;
             if(retryFetchBtn) retryFetchBtn.style.display = 'none';
         } else {
              console.error("[LS Log][Init] Kan ikke vise fejl i UI, da 'dataContainer' også mangler.");
         }
         if (!catalogOffcanvasElement) {
            console.error("[LS Log][Init] Sportskatalog container mangler.");
         }
        console.log("[LS Log][Init] <<<--- Script afsluttes pga. manglende elementer eller utils-funktioner.");
        return; // Stop script
    }
    console.log("[LS Log][Init] Kritisk element og utils tjek OK.");

    // ----- Initialiser Bootstrap Offcanvas -----
    if (catalogOffcanvasElement && window.bootstrap && window.bootstrap.Offcanvas) {
        console.log("[LS Log][Init] Forsøger at initialisere Bootstrap Offcanvas...");
        try {
            catalogOffcanvasInstance = new bootstrap.Offcanvas(catalogOffcanvasElement);
             console.log("[LS Log][Init] Bootstrap Offcanvas initialiseret OK.");
        } catch (e) {
             console.error("[LS Log][Init] Fejl ved initialisering af Bootstrap Offcanvas:", e);
        }
    } else {
        console.warn("[LS Log][Init] Bootstrap Offcanvas JS ikke fundet eller container mangler. Katalog vil muligvis ikke fungere.");
    }

    // ----- Initialiser Bootstrap Modal -----
    if (sessionSettingsModalEl && window.bootstrap && window.bootstrap.Modal) {
        console.log("[LS Log][Init] Forsøger at initialisere Bootstrap Modal for Session Settings...");
        try {
            sessionSettingsModalInstance = new bootstrap.Modal(sessionSettingsModalEl);
            console.log("[LS Log][Init] Bootstrap Modal initialiseret OK.");
        } catch (e) {
            console.error("[LS Log][Init] Fejl ved initialisering af Bootstrap Modal:", e);
        }
    } else {
        console.error("[LS Log][Init] !! FEJL !! Session Settings Modal element eller Bootstrap JS mangler. Session oprettelse vil fejle.");
        // Disable relevant buttons if modal is missing
        // This might need delegation if buttons are added dynamically
    }

    // Socket.IO instance (assuming it's globally available from app.js)
    const socket = window.globalSocket;
    if (!socket) {
        console.warn("[LS Log][Init] Global socket instance (window.globalSocket) not found. Real-time score updates will be disabled.");
        if(autoRefreshCheckbox) {
            autoRefreshCheckbox.checked = false;
            autoRefreshCheckbox.disabled = true;
            autoRefreshCheckbox.parentElement.title = "Real-time forbindelse mangler.";
        }
    } else {
        console.log("[LS Log][Init] Global socket instance found.");
    }

    // =======================================================================
    // ===== LOKALE FUNKTIONSDEFINITIONER ====================================
    // =======================================================================
    console.log("[LS Log][Init] Definerer lokale funktioner...");

    /** Opdaterer UI for Hoveddata */
    function updateUIState(isLoading, hasError = false, errorMessage = null, hasData = false) {
        console.log(`[LS Log][updateUIState] ---> Kaldt med: isLoading=${isLoading}, hasError=${hasError}, hasData=${hasData}`);
        if (!dataContainer || !dataLoadingDiv || !dataErrorDiv || !eventsListDiv || !noDataMessage) {
            console.error("[LS Log][updateUIState] !! Fejl: Mangler nødvendige UI-elementer for opdatering.");
            return;
        }

        const showError = hasError && !isLoading;
        const showLoading = isLoading;
        const showNoData = !isLoading && !hasError && !hasData;
        const showList = !isLoading && !hasError && hasData;

        dataContainer.classList.toggle('is-loading', showLoading);
        dataContainer.classList.toggle('has-error', showError);

        if (dataLoadingDiv) {
            dataLoadingDiv.classList.toggle('d-flex', showLoading);
            dataLoadingDiv.classList.toggle('d-none', !showLoading);
        }

        if (dataErrorDiv) {
            dataErrorDiv.classList.toggle('d-flex', showError);
            dataErrorDiv.classList.toggle('d-none', !showError);
            if (showError) {
                const paragraph = dataErrorDiv.querySelector('p');
                if (paragraph) {
                    paragraph.textContent = `${errorMessage || 'Ukendt fejl'}. Tjek evt. konsollen (F12).`;
                    console.log(`[LS Log][updateUIState] Fejlbesked sat: ${paragraph.textContent}`);
                }
                if (retryFetchBtn) retryFetchBtn.style.display = 'inline-block';
                else console.warn("[LS Log][updateUIState] retryFetchBtn ikke fundet i dataErrorDiv!");
            } else {
                 if (retryFetchBtn) retryFetchBtn.style.display = 'none';
            }
        }

        if (noDataMessage) {
            noDataMessage.classList.toggle('d-block', showNoData);
            noDataMessage.classList.toggle('d-none', !showNoData);
        }

        if (eventsListDiv) {
            eventsListDiv.classList.toggle('d-block', showList);
            eventsListDiv.classList.toggle('d-none', !showList);
            console.log(`[LS Log][updateUIState] eventsListDiv display controlled via classes. ShouldShow: ${showList}`);
        }

        const buttonsToManage = [refreshBtn, applyFilterBtn, showCatalogBtn].filter(Boolean);
        buttonsToManage.forEach(btn => {
            const btnId = btn.id || 'ukendt-knap';
            let shouldBeDisabled = isLoading || btn.classList.contains('is-permanently-disabled');
            if (btn === showCatalogBtn && catalogOffcanvasElement?.classList.contains('is-loading-catalog')) {
                shouldBeDisabled = true;
            }
            if (btn === applyFilterBtn && (!sportSelect || !sportSelect.value)) {
                shouldBeDisabled = true;
            }

            btn.disabled = shouldBeDisabled;
            btn.classList.toggle('is-loading', isLoading && btn === refreshBtn);
            const btnIcon = btn.querySelector('.btn-icon');
            const btnSpinner = btn.querySelector('.spinner-border');
            if (isLoading && btn === refreshBtn) {
                if (btnIcon) btnIcon.style.display = 'none';
                if (btnSpinner) btnSpinner.style.display = 'inline-block';
            } else {
                if (btnIcon) btnIcon.style.display = 'inline-block';
                if (btnSpinner) btnSpinner.style.display = 'none';
            }
        });

        console.log(`[LS Log][updateUIState] <--- Afsluttet.`);
    }

    /** Opdaterer UI for Sportskataloget */
    function updateCatalogUIState(isLoading, hasError = false, hasData = true) {
        console.log(`[LS Log][updateCatalogUIState] ---> Kaldt med: isLoading=${isLoading}, hasError=${hasError}, hasData=${hasData}`);
        if (!catalogOffcanvasElement || !catalogLoadingDiv || !catalogErrorDiv || !catalogEmptyMsg || !catalogListDiv) {
            console.error("[LS Log][updateCatalogUIState] !! Mangler nødvendige UI-elementer. Afbryder.");
             if (showCatalogBtn) {
                 showCatalogBtn.disabled = true;
                 showCatalogBtn.classList.add('is-permanently-disabled');
                 showCatalogBtn.title = "Sportskatalog er ikke tilgængeligt (UI-fejl).";
             }
            return;
        }

        catalogOffcanvasElement.classList.toggle('is-loading-catalog', isLoading);
        catalogOffcanvasElement.classList.toggle('has-error-catalog', hasError && !isLoading);
        catalogOffcanvasElement.classList.toggle('has-data-catalog', hasData && !isLoading && !hasError);
        catalogOffcanvasElement.classList.toggle('is-empty-catalog', !hasData && !isLoading && !hasError);

        catalogLoadingDiv.style.display = isLoading ? 'block' : 'none';
        catalogErrorDiv.style.display = hasError && !isLoading ? 'block' : 'none';
        const shouldShowEmpty = !isLoading && !hasError && !hasData;
        catalogEmptyMsg.style.display = shouldShowEmpty ? 'block' : 'none';
        catalogListDiv.style.display = hasData && !isLoading && !hasError ? 'block' : 'none';

        if (retryCatalogLink) {
            retryCatalogLink.style.display = hasError && !isLoading ? 'inline-block' : 'none';
        }

        console.log("[LS Log][updateCatalogUIState] Synkroniserer hovedsidens knapper...");
        const mainIsLoading = dataContainer?.classList.contains('is-loading') ?? false;
        const mainHasError = dataContainer?.classList.contains('has-error') ?? false;
        const mainHasData = (eventsListDiv?.style.display === 'block' && eventsListDiv.children.length > 0) || false;
        const mainErrorMessage = mainHasError ? dataErrorDiv?.querySelector('p')?.textContent : null;
        updateUIState(mainIsLoading, mainHasError, mainErrorMessage, mainHasData);

        console.log("[LS Log][updateCatalogUIState] <--- Afsluttet.");
    }

    /** Formaterer ISO dato/tid string til dansk format (LOKAL VERSION) */
    function formatDateTime(isoString) {
        if (!isoString) return 'Ukendt tid';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return `Ugyldig dato: ${isoString}`;
            const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
            const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
            return `${date.toLocaleDateString('da-DK', dateOptions)}, ${date.toLocaleTimeString('da-DK', timeOptions)}`;
        } catch (e) {
            console.error("[LS Log][formatDateTime] Fejl under formatering:", e, "Input:", isoString);
            return isoString;
        }
    }

     /** Klassificerer et event (LOKAL funktion) */
     function classifyEvent(event) {
         const eventIdForLog = event?.id || 'ukendt';
          if (!event) { console.warn(`[LS Log][classifyEvent][${eventIdForLog}] Mangler event objekt.`); return "ended"; }
          if (event.completed === true) return "ended";
          if (!event.commence_time) { console.warn(`[LS Log][classifyEvent][${eventIdForLog}] Mangler commence_time.`); return "ended"; }
          try {
              const start = new Date(event.commence_time);
              if (isNaN(start.getTime())) { console.warn(`[LS Log][classifyEvent][${eventIdForLog}] Ugyldig commence_time.`); return "ended"; }
              const now = new Date();
              const DEFAULT_DURATION_HOURS = 4;
              const durationMs = DEFAULT_DURATION_HOURS * 60 * 60 * 1000;
              const estimatedEnd = new Date(start.getTime() + durationMs);
              if (now >= start && now <= estimatedEnd) return "live";
              if (start > now) return "upcoming";
              return "ended";
          } catch (e) {
              console.error(`[LS Log][classifyEvent][${eventIdForLog}] Fejl under tidsberegning:`, e);
              return "ended";
          }
      }

      /** Sorterer events (LOKAL funktion) */
     function sortEvents(events) {
        console.log(`[LS Log][sortEvents] Sorterer ${Array.isArray(events) ? events.length : 'ikke-array'} events.`);
        if (!Array.isArray(events)) { console.warn("[LS Log][sortEvents] Input var ikke et array."); return []; }

        return events.sort((a, b) => {
            const validA = a && typeof a === 'object' && a.id;
            const validB = b && typeof b === 'object' && b.id;
            if (!validA || !validB) return !validA ? 1 : -1;

            const classA = classifyEvent(a);
            const classB = classifyEvent(b);
            const classPriority = { live: 0, upcoming: 1, ended: 2 };

            if (classPriority[classA] !== classPriority[classB]) {
                return classPriority[classA] - classPriority[classB];
            }

            let timeA = NaN, timeB = NaN;
            try { timeA = new Date(a.commence_time).getTime(); if (isNaN(timeA)) timeA = Infinity; }
            catch { timeA = Infinity; }
            try { timeB = new Date(b.commence_time).getTime(); if (isNaN(timeB)) timeB = Infinity; }
            catch { timeB = Infinity; }

            return (classA === "ended") ? (timeB - timeA) : (timeA - timeB);
        });
     }

     /** Renders the current coupon selections into the coupon display area */
     function renderCouponDisplay() {
         console.log("[LS Log][renderCouponDisplay] Updating coupon display with selections:", currentCouponSelections);
         const couponArea = document.getElementById('coupon_display_area');
         if (couponArea) {
             let html = '<h4 class="mb-3">Min Kupon</h4>';
             if (currentCouponSelections.length === 0) {
                 html += '<p><i>Vælg odds fra listen for at tilføje til din kupon.</i></p>';
             } else {
                 html += '<ul class="list-group mb-3">';
                 let totalOdds = 1;
                 currentCouponSelections.forEach(sel => {
                     html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                                 <div>
                                     <small class="d-block text-muted">${utils.escapeHtml(sel.matchName)}</small>
                                     <strong>${utils.escapeHtml(sel.outcomeName)}</strong> @ ${sel.odds.toFixed(2)}
                                 </div>
                                 <button class="btn btn-sm btn-outline-danger remove-from-coupon-btn"
                                         data-event-id="${utils.escapeHtml(sel.eventId)}"
                                         data-outcome-name="${utils.escapeHtml(sel.outcomeName)}"
                                         title="Fjern valg">
                                     <i class="bi bi-x-lg"></i>
                                 </button>
                              </li>`;
                     totalOdds *= sel.odds;
                 });
                 html += '</ul>';
                 html += `<p class="fw-bold">Samlet Odds: <span class="float-end">${totalOdds.toFixed(2)}</span></p>`;
                 html += '<div class="d-grid gap-2"><button id="create_coupon_session_btn" class="btn btn-primary btn-lg">Opret Kupon Session</button></div>';
                 if (currentCouponSelections.length > 0) {
                     html += '<div class="d-grid gap-2 mt-2"><button id="clear_coupon_btn" class="btn btn-outline-secondary btn-sm">Ryd Kupon</button></div>';
                 }
             }
             couponArea.innerHTML = html;
         }
     }

     /** Handles INITIATION of coupon-based session creation (shows modal) */
     function initiateCouponSessionCreation() {
         console.log("[LS Log][initiateCouponSessionCreation] Initiating coupon session creation with selections:", currentCouponSelections);
         if (currentCouponSelections.length === 0) {
             utils.showToast("Din kupon er tom. Vælg nogle odds først.", "warning");
             return;
         }

         // --- 1. Prepare initial payload (without settings) ---
         pendingSessionPayload = {
             game_mode: "live_sport_coupon",
             selections: currentCouponSelections,
             // session_name will be set in modal
         };
         const suggestedName = `Min Kupon (${currentCouponSelections.length} valg)`;

         // --- 2. Show Modal ---
         showSessionSettingsModal(suggestedName);
     }

     /** Handles the actual API call after modal confirmation for ANY session type */
     async function submitSessionCreation() {
         console.log("[LS Log][submitSessionCreation] Submitting session creation with pending data:", pendingSessionPayload);
         if (!pendingSessionPayload) {
             showModalFeedback("Fejl: Manglende sessionsdata. Prøv igen.", "danger");
             utils.showToast("Intern fejl: Manglende sessionsdata.", "danger");
             return;
         }

         utils.toggleButtonLoading(modalCreateBtn, true, "Opretter...");
         showModalFeedback('', 'info'); // Clear modal feedback

         // Gather settings from modal
         const sessionName = modalSessionNameInput?.value.trim() || pendingSessionPayload.session_name || "Unavngivet Session";
         const maxPlayers = parseInt(modalMaxPlayersInput?.value || '0', 10);
         const isPrivate = modalIsPrivateCheckbox?.checked || false;
         const sessionPassword = modalSessionPasswordInput?.value;

         // Basic modal validation
         if (!sessionName) {
             showModalFeedback("Session navn må ikke være tomt.", "warning");
             utils.toggleButtonLoading(modalCreateBtn, false);
             modalSessionNameInput?.focus();
             return;
         }
         if (isPrivate && !sessionPassword) {
             showModalFeedback("Kodeord skal angives for privat session.", "warning");
             utils.toggleButtonLoading(modalCreateBtn, false);
             modalSessionPasswordInput?.focus();
             return;
         }

         // Combine main form data with modal settings
         const finalPayload = {
             ...pendingSessionPayload, // Includes game_mode, outcomes/selections, event_id (if applicable)
             session_name: sessionName,
             max_players: isNaN(maxPlayers) ? 0 : maxPlayers,
             is_private: isPrivate,
             session_password: isPrivate ? sessionPassword : null
         };

         console.log("Submitting final data from modal:", finalPayload);

         try {
             const responseData = await utils.postData("/sessions/create_session", finalPayload);

             if (responseData && responseData.success === true && responseData.session_id) {
                 // Hide modal on success
                 if (sessionSettingsModalInstance) sessionSettingsModalInstance.hide();

                 utils.showToast(`Session '${utils.escapeHtml(responseData.session_name || finalPayload.session_name)}' oprettet! ID: ${responseData.session_id}`, "success", 5000);

                 // If it was a coupon session, clear the coupon UI
                 if (finalPayload.game_mode === 'live_sport_coupon') {
                     currentCouponSelections = [];
                     renderCouponDisplay();
                     // De-select all odds buttons
                     document.querySelectorAll('.odds-select-btn.btn-success').forEach(btn => {
                         btn.classList.remove('btn-success');
                         btn.classList.add('btn-outline-light');
                     });
                 } else {
                     // If it was a single event session, update the button state
                     const originalButton = document.querySelector(`.create-session-btn[data-event-id="${finalPayload.event_id}"]`);
                     if (originalButton) {
                         originalButton.classList.remove('btn-primary');
                         originalButton.classList.add('btn-success', 'disabled');
                         originalButton.innerHTML = '<i class="bi bi-check-lg me-1"></i> Oprettet';
                         originalButton.title = `Session ${utils.escapeHtml(responseData.session_id)} er oprettet`;
                         originalButton.disabled = true;
                     }
                 }

                 // Redirect to the new session detail page
                 // setTimeout(() => {
                 // Optional: Redirect immediately or after a delay
                 // setTimeout(() => {
                 //     window.location.href = `/sessions/details/${responseData.session_id}`;
                 // }, 1500);

             } else {
                 // Determine the error message if success is not explicitly true
                 let errorMessage = "Ukendt fejl ved oprettelse af session."; // Default
                 if (responseData && responseData.error) {
                     errorMessage = responseData.error; // Use specific error from backend if available
                 } else if (responseData && responseData.message) {
                     // Sometimes errors might be in 'message' instead of 'error'
                     errorMessage = responseData.message;
                 } else if (!responseData) {
                     errorMessage = "Intet svar modtaget fra serveren.";
                 }
                 // Throw error to be caught by the outer catch block
                 throw new Error(errorMessage);
             }
         } catch (err) {
             console.error("!! Fejl i submitSessionCreation:", err);
             showModalFeedback(`Fejl: ${utils.escapeHtml(err.message) || 'Kunne ikke oprette session.'}`, "danger");
             utils.showToast(`Fejl: ${utils.escapeHtml(err.message) || 'Kunne ikke oprette session.'}`, "danger");
         } finally {
             utils.toggleButtonLoading(modalCreateBtn, false);
             pendingSessionPayload = null; // Clear pending data after attempt
         }
     }

     /** Helper to show feedback inside the modal */
     function showModalFeedback(message, type = 'danger') {
         if (!modalFeedbackDiv) return;
         if (!message) {
             modalFeedbackDiv.innerHTML = '';
             modalFeedbackDiv.classList.add('d-none');
             return;
         }
         const alertClass = `alert-${type}`;
         const iconClass = type === 'success' ? 'bi-check-circle-fill' : type === 'warning' ? 'bi-exclamation-triangle-fill' : type === 'info' ? 'bi-info-circle-fill' : 'bi-x-octagon-fill';
         const safeMessage = utils.escapeHtml ? utils.escapeHtml(message) : message;
         modalFeedbackDiv.innerHTML = `
             <div class="alert ${alertClass} alert-dismissible fade show small d-flex align-items-center mt-2 mb-0 py-1 px-2" role="alert" >
                 <i class="bi ${iconClass} flex-shrink-0 me-2"></i>
                 <div class="flex-grow-1">${safeMessage}</div>
                 <button type="button" class="btn-close btn-sm py-1" data-bs-dismiss="alert" aria-label="Close"></button>
             </div>`;
         modalFeedbackDiv.classList.remove('d-none');
     }

     /** Helper to show the session settings modal */
     function showSessionSettingsModal(suggestedName = "Ny Session") {
         if (!sessionSettingsModalInstance) {
             utils.showToast("Fejl: Indstillingsdialogen er ikke klar.", "danger");
             return;
         }
         // Pre-fill modal fields
         if (modalSessionNameInput) modalSessionNameInput.value = suggestedName;
         if (modalMaxPlayersInput) modalMaxPlayersInput.value = 0; // Default
         if (modalIsPrivateCheckbox) modalIsPrivateCheckbox.checked = false;
         if (modalSessionPasswordInput) modalSessionPasswordInput.value = '';
         if (modalPasswordGroup) modalPasswordGroup.style.display = 'none'; // Hide password initially
         showModalFeedback('', 'info'); // Clear modal feedback

         sessionSettingsModalInstance.show();
     }

     /** Renderer sportsdata (liste af events for EN sport) modtaget fra backend */
     function renderSportsData(eventsList) { // Parameter renamed
         console.log(`[LS Log][renderSportsData] ---> Starter rendering. Input type: ${typeof eventsList}, Er Array: ${Array.isArray(eventsList)}, Længde: ${Array.isArray(eventsList) ? eventsList.length : 'N/A'}`);
        if (!eventsListDiv) { console.error("[LS Log][renderSportsData] !! FEJL: eventsListDiv findes ikke. Afbryder."); return; }

        const hasActualData = Array.isArray(eventsList) && eventsList.length > 0;

        if (!hasActualData) {
            console.log("[LS Log][renderSportsData] Ingen events modtaget i listen. Viser 'Ingen data' besked.");
            eventsListDiv.innerHTML = '';
            updateUIState(false, false, null, false);
            return;
        }
        console.log(`[LS Log][renderSportsData] Har data for ${eventsList.length} events. Starter rendering.`);

        const sportTitle = eventsList[0]?.sport_title || sportSelect?.options[sportSelect.selectedIndex]?.text || eventsList[0]?.sport_key || "Ukendt Sport";
        const eventsInSport = sortEvents(eventsList);
        console.log(`[LS Log][renderSportsData] Sorteret ${eventsInSport.length} events for ${sportTitle}.`);

        let finalHtml = "";
        let processingErrorOccurred = false;
        try {
            if (eventsInSport.length > 0) {
                finalHtml += `<h4 class="sports-group-title mt-4 mb-3">${utils.escapeHtml(sportTitle)}</h4>`;
                finalHtml += `<div class="table-responsive sports-table-card mb-4">
                    <table class="table table-dark table-borderless table-sm align-middle mb-0 live-sports-data-table">
                        <thead>
                                <tr>
                                    <th scope="col">Kamp</th>
                                    <th scope="col">Starttid</th>
                                    <th scope="col" class="text-center">Odds (H2H)</th>
                                    <th scope="col">Status / Score</th>
                                    <th scope="col" class="text-center">Handlinger</th>
                                </tr>
                            </thead>
                            <tbody>`;

                    eventsInSport.forEach((event) => {
                        let rowHtml = '';
                        try {
                            const homeTeam = event.home_team || "Hjemme";
                            const awayTeam = event.away_team || "Ude";
                            const matchName = `${homeTeam} vs ${awayTeam}`;
                            const escapedMatchName = utils.escapeHtml(matchName);
                            const startTime = formatDateTime(event.commence_time);
                            const eventId = event.id;
                            const currentSportKey = event.sport_key;
                            const classification = classifyEvent(event);
                            const isEnded = classification === 'ended';
                            const isLive = classification === 'live';
                            const isUpcoming = classification === 'upcoming';
                            const scoreCellId = `scoreCell-${currentSportKey}-${eventId}`;

                            let oddsInfo = `<span class="odds-missing text-muted"><small>Odds N/A</small></span>`;
                            let parsedOdds = {};
                            let bookmaker = event.bookmakers?.find(b => b.key === 'unibet' && b.markets?.some(m => m.key === 'h2h'));
                            if (!bookmaker) {
                                bookmaker = event.bookmakers?.find(b => b.markets?.some(m => m.key === 'h2h'));
                            }
                            const h2hMarket = bookmaker?.markets?.find(m => m.key === 'h2h');

                            if (h2hMarket?.outcomes?.length >= 2) {
                                const validOutcomes = h2hMarket.outcomes
                                    .filter(o => o?.name && typeof o.price === 'number' && !isNaN(o.price))
                                    .sort((a, b) => {
                                         if (a.name === homeTeam) return -1; if (b.name === homeTeam) return 1;
                                         if (a.name === awayTeam) return 1; if (b.name === awayTeam) return -1;
                                         return 0;
                                    });

                                if (validOutcomes.length >= 2) {
                                    oddsInfo = '<div class="odds-container btn-group btn-group-sm d-flex justify-content-center gap-1" role="group">';
                                    validOutcomes.forEach(outcome => {
                                        const nameShort = outcome.name === homeTeam ? '1' : (outcome.name === awayTeam ? '2' : 'X');
                                        const price = parseFloat(outcome.price.toFixed(2));
                                        const escapedOutcomeName = utils.escapeHtml(outcome.name);
                                        const isSelected = currentCouponSelections.some(sel => sel.eventId === eventId && sel.outcomeName === outcome.name);

                                        oddsInfo += `<button type="button"
                                                             class="btn ${isSelected ? 'btn-success' : 'btn-outline-light'} odds-select-btn"
                                                             title="Vælg ${escapedOutcomeName} @ ${price}"
                                                             data-event-id="${utils.escapeHtml(eventId)}"
                                                             data-sport-key="${utils.escapeHtml(currentSportKey)}"
                                                             data-match-name="${escapedMatchName}"
                                                             data-outcome-name="${escapedOutcomeName}"
                                                             data-outcome-odds="${price}">
                                                         <span class="odds-label d-block small">${nameShort}</span>
                                                         <span class="odds-price fw-bold">${price}</span>
                                                     </button>`;
                                        parsedOdds[outcome.name] = { name: outcome.name, odds: price };
                                    });
                                    oddsInfo += '</div>';
                                }
                            }
                            event.parsedOdds = parsedOdds;

                            let scoreCellContent = '';
                            let rowClass = `event-${classification}`;
                            if (isEnded) {
                                scoreCellContent = `<span class="text-muted fw-bold"><i class="bi bi-flag-fill me-1"></i> Slut</span>`;
                                rowClass += ' event-ended-estimated';
                            } else if (isLive) {
                                scoreCellContent = `<span class="text-warning"><span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Henter score...</span>`;
                            } else {
                                scoreCellContent = `<span class="text-info"><i class="bi bi-clock me-1"></i> Planlagt</span>`;
                            }

                            const escapedEventId = utils.escapeHtml(eventId);
                            rowHtml = `
                                <tr data-event-id="${escapedEventId}" data-sport-key="${utils.escapeHtml(currentSportKey)}" class="${rowClass}" title="Event ID: ${escapedEventId}">
                                    <td class="event-teams"><strong>${escapedMatchName}</strong></td>
                                    <td class="event-time">${startTime}</td>
                                    <td class="event-odds">${oddsInfo}</td>
                                    <td class="event-score" id="${scoreCellId}">${scoreCellContent}</td>
                                    <td class="event-actions text-center">
                                        <div class="btn-group btn-group-sm" role="group">
                                            <button type="button" class="btn btn-sm btn-outline-light view-live-results-btn sports-action-btn" data-event-id="${escapedEventId}" title="Vis Live Resultater for ${escapedMatchName}" ${isUpcoming ? 'disabled' : ''}>
                                                  <i class="bi bi-clipboard-data me-1 btn-icon"></i><span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span> Vis Liveresultater
                                            </button>
                                            <button type="button" class="btn btn-sm btn-primary create-session-btn sports-action-btn" data-event-id="${escapedEventId}" title="Opret session for ${escapedMatchName}" ${isEnded ? 'disabled' : ''}>
                                                <i class="bi bi-plus-circle me-1 btn-icon"></i><span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span> Opret
                                            </button>
                                        </div>
                                    </td>
                                </tr>`;
                         } catch (eEvent) {
                             console.error(`[LS Log][renderSportsData] !! FEJL ved behandling af ENKELT event ${event?.id}:`, eEvent);
                             processingErrorOccurred = true;
                             rowHtml = `<tr class="table-danger"><td colspan="5">Fejl ved behandling af event ID ${event?.id || 'ukendt'}. Se konsol.</td></tr>`;
                         }
                         finalHtml += rowHtml;
                     });
                     finalHtml += `</tbody></table></div>`;
                 } else {
                     console.log(`[LS Log][renderSportsData] Sport ${sportTitle}: Ingen events at vise efter sortering.`);
                 }
        } catch (eOuterLoop) {
             console.error("[LS Log][renderSportsData] !! YDRE FEJL !! Under HTML generering (loop over sportsgrene):", eOuterLoop);
             updateUIState(false, true, "Fejl under visning af sportsdata.", false);
             processingErrorOccurred = true;
        }
        console.log(`[LS Log][renderSportsData] HTML generering færdig. Opstod der fejl? ${processingErrorOccurred}`);

        if (processingErrorOccurred) {
             console.error("[LS Log][renderSportsData] Fejl opstod under behandling. HTML indsættes ikke.");
             return;
         }

         try {
             console.log("[LS Log][renderSportsData] Sætter innerHTML for eventsListDiv...");
             eventsListDiv.innerHTML = finalHtml;
             console.log("[LS Log][renderSportsData] innerHTML sat OK. Opdaterer UI state til SUCCESS.");
             updateUIState(false, false, null, true);
         } catch (eInnerHtml) {
             console.error("[LS Log][renderSportsData] !! FEJL !! ved sætning af innerHTML:", eInnerHtml);
             updateUIState(false, true, "Kritisk fejl ved visning af data.", false);
             throw eInnerHtml;
         }

        // --- Subscribe to Live Scores via WebSocket ---
        if (socket && socket.connected) {
            const eventIdsToSubscribe = [];
            document.querySelectorAll('#sports_events_list tr[data-event-id]').forEach(row => {
                if (!row.classList.contains('event-ended-final')) {
                    const eventId = row.dataset.eventId;
                    if (eventId) {
                        eventIdsToSubscribe.push(eventId);
                    }
                }
            });

            if (eventIdsToSubscribe.length > 0) {
                console.log(`[LS Log][renderSportsData] Subscribing to live scores for ${eventIdsToSubscribe.length} events via WebSocket:`, eventIdsToSubscribe);
                socket.emit('subscribe_to_live_scores', { event_ids: eventIdsToSubscribe });
            } else {
                console.log("[LS Log][renderSportsData] No live/upcoming events found to subscribe to for scores.");
            }
        } else {
             console.warn("[LS Log][renderSportsData] Socket not connected, cannot subscribe to live scores.");
        }
        // --- End WebSocket Subscription ---

         console.log("[LS Log][renderSportsData] <--- Afsluttet (Success).");
    } // Slut renderSportsData

    /** Henter og viser score fra DIT backend endpoint */
    async function fetchAndShowScore(sportKey, eventId) {
        const scoreCell = document.getElementById(`scoreCell-${sportKey}-${eventId}`);
        const tableRow = scoreCell?.closest('tr');
        if (!scoreCell || !tableRow || tableRow.classList.contains('event-ended-final')) return;
        if (scoreCell.querySelector('.spinner-border') || scoreCell.querySelector('.bi-exclamation-triangle, .bi-wifi-off')) return;

         if (!scoreCell.textContent?.includes('Slut')) {
             scoreCell.innerHTML = `<span class="text-muted fst-italic"><small><span class="spinner-border spinner-border-sm text-secondary me-1" role="status" aria-hidden="true"></span>Henter...</small></span>`;
         }

        try {
            const scoreApiUrl = `/api/live_score/${sportKey}/${eventId}`;
            const data = await utils.getData(scoreApiUrl);

            let scoreHtml;
            let newRowClass = tableRow.className;

             if (data.error) {
                 console.warn(`Score API error for ${sportKey}/${eventId}: ${data.error}`);
                 scoreHtml = `<span class="text-danger" title="Score API Fejl: ${utils.escapeHtml(data.error)}"><i class="bi bi-exclamation-triangle"></i> Fejl</span>`;
                 newRowClass = newRowClass.replace(/event-\w+/g, '').trim() + ' event-error';
                 tableRow.querySelectorAll('button.sports-action-btn').forEach(btn => { btn.disabled = true; });
             } else {
                 const isFinal = data.completed === true || data.status?.toLowerCase() === 'ended' || data.status?.toLowerCase() === 'final';
                 const isLiveNow = !isFinal && (data.status?.toLowerCase() === 'in progress' || data.status?.toLowerCase() === 'live' || data.status?.toLowerCase() === 'in_progress');
                 const isHalfTime = !isFinal && !isLiveNow && (data.status?.toLowerCase() === 'halftime' || data.status?.toLowerCase() === 'ht');

                 if (isFinal) {
                     const finalScore = data.score ? `(${utils.escapeHtml(data.score)})` : '(Ukendt score)';
                     scoreHtml = `<span class="text-muted fw-bold"><i class="bi bi-flag-fill me-1"></i> Slut ${finalScore}</span>`;
                     newRowClass = newRowClass.replace(/event-\w+/g, '').trim() + ' event-ended event-ended-final';
                     tableRow.querySelectorAll('button.sports-action-btn').forEach(btn => { btn.disabled = true; });
                 } else if (isLiveNow) {
                     const timeInfo = data.minute ? `<small class="text-muted fst-italic ms-1">(${utils.escapeHtml(data.minute)}')</small>` : '';
                     const liveIndicator = `<span class="live-dot me-1" title="Live"></span>`;
                     scoreHtml = `<span class="text-danger fw-bold">${liveIndicator} ${utils.escapeHtml(data.score) || '-:-'} ${timeInfo}</span>`;
                     newRowClass = newRowClass.replace(/event-\w+/g, '').trim() + ' event-live event-live-processed';
                     tableRow.querySelector('.view-live-results-btn')?.removeAttribute('disabled');
                     tableRow.querySelector('.create-session-btn')?.removeAttribute('disabled');
                  } else if (isHalfTime) {
                     const halfTimeScore = data.score ? `(${utils.escapeHtml(data.score)})` : '';
                     scoreHtml = `<span class="text-warning fw-bold"><i class="bi bi-pause-circle me-1"></i> Pause ${halfTimeScore}</span>`;
                     newRowClass = newRowClass.replace(/event-\w+/g, '').trim() + ' event-live event-halftime-processed';
                     tableRow.querySelector('.view-live-results-btn')?.removeAttribute('disabled');
                     tableRow.querySelector('.create-session-btn')?.removeAttribute('disabled');
                  } else { // Upcoming
                     scoreHtml = `<span class="text-info"><i class="bi bi-clock me-1"></i> Planlagt</span>`;
                     newRowClass = newRowClass.replace(/event-\w+/g, '').trim() + ' event-upcoming event-upcoming-processed';
                     tableRow.querySelector('.view-live-results-btn')?.setAttribute('disabled', 'true');
                     tableRow.querySelector('.create-session-btn')?.removeAttribute('disabled');
                  }
              }

             if (document.body.contains(scoreCell)) { scoreCell.innerHTML = scoreHtml; }
             if (document.body.contains(tableRow)) { tableRow.className = newRowClass.trim(); }

        } catch (err) {
            console.error(`[LS Log][fetchAndShowScore] FEJL for ${eventId}:`, err);
             if (document.body.contains(scoreCell)) {
                 const errorTitle = err.message || "Netværks- eller API-fejl";
                 scoreCell.innerHTML = `<span class="text-danger" title="${utils.escapeHtml(errorTitle)}"><i class="bi bi-wifi-off"></i> Fejl</span>`;
             }
             if(document.body.contains(tableRow)) {
                  let newRowClass = tableRow.className.replace(/event-\w+/g, '').trim();
                  newRowClass += ' event-error';
                  tableRow.className = newRowClass.trim();
                  tableRow.querySelectorAll('button.sports-action-btn').forEach(btn => { btn.disabled = true; });
             }
        }
    }

    /** Placeholder for at vise live resultater (LOKAL funktion) */
    function viewLiveResults(buttonElement, eventId) {
        console.log(`[LS Log][viewLiveResults] Placeholder aktiveret for ${eventId}.`);
         if (!buttonElement) { console.warn("viewLiveResults kaldt uden buttonElement"); return; }
         const originalHtml = buttonElement.innerHTML;
         buttonElement.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Åbner...`;
         buttonElement.disabled = true;

         const eventData = window.globalSportsData?.find(ev => ev?.id === eventId);
         const row = buttonElement.closest('tr');
         const scoreCell = row?.querySelector('.event-score');
         const scoreText = scoreCell?.textContent || 'Score ikke fundet';

         try {
             let message = `Detaljer for Event ID: ${eventId}\n`;
             if (eventData) {
                 message += `Kamp: ${eventData.home_team || '?'} vs ${eventData.away_team || '?'}\n`;
                 message += `Sport: ${eventData.sport_title || eventData.sport_key}\n`;
                 message += `Start: ${formatDateTime(eventData.commence_time)}\n`;
             }
             message += `Aktuel Status/Score: ${scoreText}\n\n`;
             message += `(Implementer modal eller sidevisning her)`;
             alert(message); // Simpel alert for nu
         } catch(eAlert) { console.warn("Alert fejlede i viewLiveResults", eAlert); }

         setTimeout(() => {
             try {
                  if (document.body.contains(buttonElement) && document.body.contains(row)) {
                     buttonElement.innerHTML = `<i class="bi bi-clipboard-data me-1 btn-icon"></i> Vis Liveresultater`;
                     if (!row.classList.contains('event-ended-final')) {
                         buttonElement.disabled = false;
                     } else {
                         console.log(`[ViewLive][${eventId}] Knap forbliver disabled, kampen er slut.`);
                     }
                  }
             } catch (eTimeout) { console.error("Fejl i viewLiveResults timeout", eTimeout); }
         }, 1000);
    }

    /** Handles INITIATION of single event session creation (shows modal) */
    function initiateSingleEventSessionCreation(buttonElement, eventId) {
        console.log(`[LS Log][initiateSingleEventSessionCreation] ---> Starter for event ID: ${eventId}`);
        if (!buttonElement || !eventId) { console.warn("[LS Log][initiateSingleEventSessionCreation] Kaldt uden buttonElement eller eventId."); return; }
        if (!sessionSettingsModalInstance) {
            utils.showToast("Fejl: Indstillingsdialogen er ikke klar.", "danger");
            return;
        }

        try {
            const event = window.globalSportsData?.find(ev => ev?.id === eventId);
            if (!event) throw new Error("Kampdata ikke fundet lokalt. Prøv at opdatere siden.");

             // Odds håndtering (forbliver den samme logik)
             let outcomesForSession = event.parsedOdds ? Object.values(event.parsedOdds) : [];
             if (!Array.isArray(outcomesForSession) || outcomesForSession.length < 2 || !outcomesForSession.every(o => o?.name && typeof o.odds === 'number' && o.odds >= 1.0)) {
                  console.warn(`Manglende/ugyldige parsed odds for ${eventId}. Forsøger fallback eller genererer dummy.`);
                  let fallbackOdds = [];
                  const bookmaker = event.bookmakers?.find(b => b.key === 'unibet') ?? event.bookmakers?.[0];
                  const h2hMarket = bookmaker?.markets?.find(m => m.key === 'h2h');
                  if (h2hMarket?.outcomes?.length >= 2) {
                      fallbackOdds = h2hMarket.outcomes
                         .filter(o => o?.name && typeof o.price === 'number' && !isNaN(o.price))
                         .map(o => ({ name: o.name, odds: parseFloat(o.price.toFixed(2)) }));
                  }
                  if (fallbackOdds.length >= 2) {
                      console.log("Anvender fallback odds fra rå API data.");
                      outcomesForSession = fallbackOdds;
                  } else {
                      console.warn("Ingen gyldige odds fundet, genererer DUMMY odds.");
                      const home = event.home_team || "Hold 1";
                      const away = event.away_team || "Hold 2";
                      outcomesForSession = [{ name: home, odds: 1.90 }, { name: away, odds: 1.90 }];
                      const sportKeyLower = event.sport_key?.toLowerCase() || "";
                      if (['soccer', 'football', 'icehockey', 'aussierules'].some(s => sportKeyLower.includes(s))) {
                          outcomesForSession = [{ name: home, odds: 2.1 }, { name: "Uafgjort", odds: 3.4 }, { name: away, odds: 2.9 }];
                      }
                  }
                  if (!event.parsedOdds || Object.keys(event.parsedOdds).length === 0) {
                      event.parsedOdds = outcomesForSession.reduce((acc, curr) => { acc[curr.name] = curr; return acc; }, {});
                  }
             }
             if (!Array.isArray(outcomesForSession) || outcomesForSession.length < 2) throw new Error("Kunne ikke bestemme gyldige odds for session.");

             // --- 1. Prepare initial payload (without settings) ---
             pendingSessionPayload = {
                 game_mode: "live_sport",
                 event_id: event.id,
                 // session_name will be set in modal
                 // Outcomes are not needed here, backend fetches based on event_id
             };
             const suggestedName = `${event.home_team || 'Kamp'} vs ${event.away_team || ''}`;

             // --- 2. Show Modal ---
             showSessionSettingsModal(suggestedName);

         } catch (err) {
             console.error(`!! Fejl i initiateSingleEventSessionCreation for ${eventId}:`, err);
             utils.showToast(`Fejl: ${utils.escapeHtml(err.message) || 'Kunne ikke starte oprettelse.'}`, "danger");
         }
    } // Slut initiateSingleEventSessionCreation

    /** Asynkront henter sportskataloget via utils.getData */
    async function loadSportsCatalog() {
        console.log("[LS Log][loadSportsCatalog] ---> Starter katalog hentning.");
        if (!utils || typeof utils.getData !== 'function') {
            console.error("[LS Log][loadSportsCatalog] AFBRUDT: 'utils.getData' mangler.");
            throw new Error("Intern fejl: utils.getData mangler.");
        }

        updateCatalogUIState(true);
        try {
            const catalogData = await utils.getData("/api/sports_catalog");

            if (!Array.isArray(catalogData)) {
                let errorMsg = "Uventet dataformat modtaget for katalog.";
                if (catalogData && typeof catalogData === 'object' && catalogData.error) { errorMsg = `Fejl fra server: ${catalogData.error}`; }
                else if (catalogData && typeof catalogData === 'object' && catalogData.message) { errorMsg = `Fejl fra server: ${catalogData.message}`; }
                throw new Error(errorMsg);
            }

            console.log(`[LS Log][loadSportsCatalog] Modtog ${catalogData.length} sportsgrene fra backend.`);
            const defaultSport = displaySportsCatalog(catalogData);
            updateCatalogUIState(false, false, catalogData.length > 0);

            return true;

        } catch (error) {
            console.error("[LS Log][loadSportsCatalog] !! FEJL !! under hentning:", error);
            if (catalogErrorDiv) {
                const errorPara = catalogErrorDiv.querySelector('p') || catalogErrorDiv;
                errorPara.textContent = `Fejl: ${error.message || 'Kunne ikke hente sportskatalog.'}`;
                 if(retryCatalogLink) {
                     retryCatalogLink.style.display = 'inline-block';
                      if (!retryCatalogLink.dataset.listenerAttached) {
                         retryCatalogLink.addEventListener('click', handleRetryCatalogClick);
                         retryCatalogLink.dataset.listenerAttached = 'true';
                     }
                 }
            }
            updateCatalogUIState(false, true);
             if(sportSelect) {
                 sportSelect.innerHTML = '';
                 sportSelect.add(new Option("Fejl ved hentning", "", true, true));
                 sportSelect.disabled = true;
             }
            throw error;
        }
    }

    // Håndterer retry for katalog (LOKAL funktion)
    function handleRetryCatalogClick(e) {
        e.preventDefault();
        console.log("[LS Log][Event][Catalog] Retry katalog link klikket.");
        if(retryCatalogLink) retryCatalogLink.style.display = 'none';
        loadSportsCatalog().catch(err => { console.error("Retry af katalog fejlede også:", err); });
    }

    /** Viser sportskatalog & Opdaterer filter (LOKAL funktion) */
    function displaySportsCatalog(catalog) {
        console.log(`[LS Log][displaySportsCatalog] Starter. Modtog ${Array.isArray(catalog) ? catalog.length : 'N/A'} sportsgrene.`);
         if (!catalogListDiv || !sportSelect || !catalogEmptyMsg) {
              console.error("[LS Log][displaySportsCatalog] Kritiske UI elementer mangler.");
              return null;
         }

        catalogListDiv.innerHTML = '';
        const currentSportFilterValue = sportSelect.value;
        sportSelect.innerHTML = '';
        sportSelect.disabled = true;

        const isValidCatalog = Array.isArray(catalog) && catalog.length > 0;
        if (!isValidCatalog) {
            console.warn("[LS Log][displaySportsCatalog] Katalog data er tom eller ugyldig.");
            updateCatalogUIState(false, false, false);
            catalogEmptyMsg.textContent = "Ingen aktive sportsgrene fundet.";
            sportSelect.add(new Option("Ingen sportsgrene fundet", "", true, true));
            sportSelect.disabled = true;
            return null;
        }
        console.log("[LS Log][displaySportsCatalog] Katalog data OK. Starter UI opdatering...");

        let groups = catalog.reduce((acc, sport) => {
             if (!sport || typeof sport !== 'object' || !sport.key || !sport.title) {
                  console.warn("Ugyldigt sport-objekt i katalog:", sport); return acc;
             }
             const group = sport.group || "Øvrige";
             if (!acc[group]) acc[group] = [];
             acc[group].push({ key: sport.key, title: sport.title });
             return acc;
        }, {});

        let firstAvailableSportKey = null;
        try {
            const sortedGroupNames = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'da'));
            sportSelect.add(new Option("--- Vælg en Sport ---", "", true, true));
            sortedGroupNames.forEach(groupName => {
                 const optgroup = document.createElement('optgroup');
                 optgroup.label = groupName;
                 groups[groupName].sort((a, b) => a.title.localeCompare(b.title, 'da'))
                                .forEach((sport) => {
                                     if (firstAvailableSportKey === null) firstAvailableSportKey = sport.key;
                                     const option = new Option(sport.title, sport.key);
                                     optgroup.appendChild(option);
                                 });
                 sportSelect.appendChild(optgroup);
            });
        } catch(eDropdown) {
            console.error("[LS Log][displaySportsCatalog] FEJL ved opdatering af filter dropdown:", eDropdown);
            sportSelect.innerHTML = '';
            sportSelect.add(new Option("Fejl i filter", "", true, true));
            sportSelect.disabled = true;
            return null;
        }

        let finalSelectedSportKey = null;
        try {
            const availableSportKeys = Array.from(sportSelect.options).map(opt => opt.value).filter(Boolean);
            if (currentSportFilterValue && availableSportKeys.includes(currentSportFilterValue)) {
                 sportSelect.value = currentSportFilterValue;
                 finalSelectedSportKey = currentSportFilterValue;
                 console.log(`[LS Log][displaySportsCatalog] Gendannede sport: ${finalSelectedSportKey}`);
             } else if (firstAvailableSportKey) {
                 sportSelect.value = firstAvailableSportKey;
                 finalSelectedSportKey = firstAvailableSportKey;
                 console.log(`[LS Log][displaySportsCatalog] Sat default sport: ${finalSelectedSportKey}`);
             } else {
                 sportSelect.value = "";
                 finalSelectedSportKey = null;
                 console.warn("[LS Log][displaySportsCatalog] Kunne ikke sætte default sport.");
             }
        } catch (eSetVal) {
             console.error("[LS Log][displaySportsCatalog] Fejl ved sætning af valg", eSetVal);
             sportSelect.value = "";
             finalSelectedSportKey = null;
        } finally {
             if (!sportSelect.disabled || sportSelect.options.length > 1) { sportSelect.disabled = false; }
             console.log(`[LS Log][displaySportsCatalog] Filter dropdown opdateret. Valgt: '${finalSelectedSportKey || 'Ingen'}'.`);
        }

        console.log("[LS Log][displaySportsCatalog] Bygger liste i offcanvas...");
        try {
            const sortedGroupNamesOffcanvas = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'da'));
            sortedGroupNamesOffcanvas.forEach(groupName => {
                const groupHeader = document.createElement('h6');
                groupHeader.className = 'text-muted px-3 pt-3 pb-1 mb-0 text-uppercase small';
                groupHeader.textContent = groupName;
                catalogListDiv.appendChild(groupHeader);
                const groupList = document.createElement('div');
                groupList.className = 'list-group list-group-flush';
                groups[groupName].forEach(sport => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    const isActive = sport.key === finalSelectedSportKey;
                    button.className = `list-group-item list-group-item-action list-group-item-dark ${isActive ? 'active' : ''}`;
                    button.textContent = sport.title;
                    button.dataset.sportKey = sport.key;
                    button.setAttribute('aria-current', isActive ? 'true' : 'false');
                    button.addEventListener('click', () => {
                         console.log(`[LS Log][Event][Catalog] Klik på sport: ${sport.title} (${sport.key})`);
                         if (sportSelect) sportSelect.value = sport.key;
                         if (catalogOffcanvasInstance) catalogOffcanvasInstance.hide();
                         if (autoRefreshCheckbox?.checked) {
                             autoRefreshCheckbox.checked = false;
                             autoRefreshCheckbox.dispatchEvent(new Event('change'));
                             console.log("...Auto-refresh slået fra.");
                         }
                         loadSportsData();
                     });
                    groupList.appendChild(button);
                });
                catalogListDiv.appendChild(groupList);
            });
        } catch (eOffcanvas) {
             console.error("[LS Log][displaySportsCatalog] Fejl ved bygning af liste i offcanvas:", eOffcanvas);
             catalogListDiv.innerHTML = '<div class="alert alert-warning m-3">Kunne ikke vise sportskataloget.</div>';
        }

        return finalSelectedSportKey;
    } // Slut displaySportsCatalog

    /** Henter hoved sportsdata via utils.getData */
    async function loadSportsData() {
        console.log("[LS Log][loadSportsData] ==================================================");
        console.log("[LS Log][loadSportsData] ---> loadSportsData kaldt ======================");
        if (!utils || typeof utils.getData !== 'function') {
            console.error("[LS Log][loadSportsData] AFBRUDT: 'utils.getData' mangler.");
            updateUIState(false, true, "Intern fejl: getData mangler.", false);
            return;
        }

        const sportKey = sportSelect?.value;
        const region = regionSelect?.value || "eu";
        const markets = marketSelect?.value || "h2h";

        if (!sportKey) {
            console.warn("[LS Log][loadSportsData] Ingen sport valgt i filteret. Afbryder hentning.");
            updateUIState(false, true, "Vælg venligst en sport fra filteret.", false);
            if(retryFetchBtn) retryFetchBtn.style.display = 'none'; // Hide retry if it's just a missing selection
            return;
        }

        console.log(`[LS Log][loadSportsData] Fetching odds for sport: ${sportKey}, region: ${region}, markets: ${markets}`);
        updateUIState(true, false, null, false); // Show loading state

        try {
            const apiUrl = `/api/odds?sport=${encodeURIComponent(sportKey)}&regions=${encodeURIComponent(region)}&markets=${encodeURIComponent(markets)}`;
            console.log(`[LS Log][loadSportsData] Kalder backend API via utils: ${apiUrl}`);

            const data = await utils.getData(apiUrl);
            console.log(`[LS Log][loadSportsData] Svar modtaget. Type: ${typeof data}, Er Array: ${Array.isArray(data)}`);

            if (!Array.isArray(data)) {
                 if (data && typeof data === 'object' && (data.error || data.message)) {
                     throw new Error(`API fejl fra server: ${data.error || data.message}`);
                 }
                 throw new Error("Uventet dataformat modtaget fra server (forventede liste).");
            }

            window.globalSportsData = data;
            renderSportsData(data);

            console.log(`[LS Log][loadSportsData] <--- loadSportsData SUCCES for ${sportKey}. Events: ${data.length}`);

        } catch (error) {
             console.error(`[LS Log][loadSportsData] !! FEJL !! for ${sportKey}:`, error);
             if (error instanceof Error && error.stack) { console.error("Stack Trace:\n", error.stack); }
             window.globalSportsData = [];
             updateUIState(false, true, error.message || 'Ukendt fejl ved hentning af odds.', false);
             console.log(`[LS Log][loadSportsData] <<<--- loadSportsData FAILED for ${sportKey}`);
        } finally {
             initialLoadCompleted = true;
             console.log(`[LS Log][loadSportsData] initialLoadCompleted sat til: ${initialLoadCompleted}`);
             console.log("[LS Log][loadSportsData] ==================================================\n");
         }
    }

    /** Opsætter alle event listeners (LOKAL funktion) */
    function setupEventListeners() {
        console.log("[LS Log][setupEventListeners] ---> Starter opsætning...");

        if (applyFilterBtn) {
            applyFilterBtn.disabled = !sportSelect?.value;
            applyFilterBtn.title = sportSelect?.value ? "Anvend valgte filtre" : "Vælg en sport først";

            applyFilterBtn.addEventListener('click', () => {
                console.log("[LS Log][Event] Apply Filter klikket.");
                if (autoRefreshCheckbox?.checked) {
                    autoRefreshCheckbox.checked = false;
                    autoRefreshCheckbox.dispatchEvent(new Event('change'));
                    console.log("...Auto-refresh slået fra pga. filterændring.");
                }
                loadSportsData();
            });
            console.log("[LS Log][setupEventListeners] Apply Filter knap event listener sat op.");

            if (sportSelect) {
                sportSelect.addEventListener('change', () => {
                    applyFilterBtn.disabled = !sportSelect.value;
                    applyFilterBtn.title = sportSelect.value ? "Anvend valgte filtre" : "Vælg en sport først";
                });
            }
        } else { console.warn("Apply filter knap mangler."); }

        if (refreshBtn) {
             refreshBtn.addEventListener('click', () => {
                  console.log("[LS Log][Event] Opdater Nu klikket.");
                  loadSportsData();
             });
         } else { console.warn("Refresh knap mangler."); }

        if (autoRefreshCheckbox) {
             autoRefreshCheckbox.addEventListener('change', (event) => {
                  const isEnabled = event.target.checked;
                  console.log(`[LS Log][Event] Auto refresh ændret til: ${isEnabled}`);
                   if (isEnabled && autoRefreshIntervalId === null) {
                       console.log(`...Starter auto-refresh interval (${REFRESH_INTERVAL_MS}ms)`);
                       autoRefreshIntervalId = setInterval(() => {
                           console.log("[LS Log][Interval] Auto-refresh trigger...");
                           if (sportSelect?.value) {
                               loadSportsData();
                           } else {
                                console.log("[LS Log][Interval] ...Skipped: Ingen sport valgt.");
                            }
                        }, REFRESH_INTERVAL_MS);
                       if (!initialLoadCompleted && sportSelect?.value) {
                           console.log("...Kører initial load da auto-refresh blev slået til.");
                           loadSportsData();
                        }
                   } else if (!isEnabled && autoRefreshIntervalId !== null) {
                       clearInterval(autoRefreshIntervalId);
                       autoRefreshIntervalId = null;
                       console.log("...Auto-refresh stoppet.");
                    }
             });
         } else { console.warn("Auto refresh checkbox mangler."); }

         if (showCatalogBtn && catalogOffcanvasElement && catalogOffcanvasInstance) {
              showCatalogBtn.addEventListener('click', () => {
                   console.log("[LS Log][Event] Vis Katalog klikket.");
                   catalogOffcanvasInstance.show();
               });
              catalogOffcanvasElement.addEventListener('show.bs.offcanvas', () => {
                  console.log("[LS Log][Event][Catalog] 'show.bs.offcanvas' event");
                  const listIsEmpty = !catalogListDiv?.querySelector('button.list-group-item-action');
                  const hadError = catalogOffcanvasElement.classList.contains('has-error-catalog');
                  const isLoading = catalogOffcanvasElement.classList.contains('is-loading-catalog');
                   if ((listIsEmpty && !isLoading) || hadError) {
                        console.log("...Katalog er tomt eller havde fejl, genindlæser...");
                         if(catalogErrorDiv) catalogErrorDiv.style.display = 'none';
                         if(catalogEmptyMsg) catalogEmptyMsg.style.display = 'none';
                         if(retryCatalogLink) retryCatalogLink.style.display = 'none';
                        loadSportsCatalog().catch(err => console.error("Fejl ved auto-genindlæsning af katalog:", err));
                    } else if (!isLoading) {
                        console.log("...Opdaterer 'active' state i katalog.");
                        try {
                            const currentFilterKey = sportSelect?.value;
                            catalogListDiv.querySelectorAll('button.list-group-item-action').forEach(btn => {
                                const isActive = btn.dataset.sportKey === currentFilterKey;
                                btn.classList.toggle('active', isActive);
                                btn.setAttribute('aria-current', isActive ? 'true' : 'false');
                            });
                        } catch(eUpdateActive) { console.error("Fejl ved opdatering af aktivt element i katalog", eUpdateActive); }
                    }
              });
              catalogOffcanvasElement.addEventListener('hide.bs.offcanvas', () => {
                   catalogOffcanvasElement.classList.remove('has-error-catalog');
              });
           } else {
                console.warn("Katalog knap/element/instance mangler.");
                if(showCatalogBtn) {
                    showCatalogBtn.disabled = true;
                    showCatalogBtn.title = "Katalog utilgængeligt (opsætningsfejl)";
                }
            }

           if (retryFetchBtn) {
                retryFetchBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log("[LS Log][Event] Retry Hoveddata link klikket.");
                    if(dataErrorDiv) dataErrorDiv.style.display = 'none';
                    if(retryFetchBtn) retryFetchBtn.style.display = 'none';
                    loadSportsData();
                });
           } else { console.warn("Retry Hoveddata knap mangler."); }

         if (eventsListDiv) {
             eventsListDiv.addEventListener('click', (e) => {
                  const targetButton = e.target.closest('button.view-live-results-btn, button.create-session-btn, button.odds-select-btn');
                  if (!targetButton || targetButton.disabled || targetButton.classList.contains('disabled') || targetButton.classList.contains('is-loading')) return;

                  const eventId = targetButton.dataset.eventId;
                  if (!eventId && !targetButton.classList.contains('odds-select-btn')) {
                     console.warn("Action knap (ikke odds) mangler data-event-id."); return;
                  }

                  e.preventDefault();
                  e.stopPropagation();

                  if (targetButton.classList.contains('create-session-btn')) {
                       console.log(`[LS Log][Event][Table] Opret Session (enkelt) klikket for ${eventId}`);
                       initiateSingleEventSessionCreation(targetButton, eventId); // Initiate modal flow
                   } else if (targetButton.classList.contains('view-live-results-btn')) {
                        console.log(`[LS Log][Event][Table] Vis Detaljer klikket for ${eventId}`);
                        viewLiveResults(targetButton, eventId);
                   } else if (targetButton.classList.contains('odds-select-btn')) {
                         const selectionDetails = {
                             eventId: targetButton.dataset.eventId,
                             sportKey: targetButton.dataset.sportKey,
                             matchName: targetButton.dataset.matchName,
                             outcomeName: targetButton.dataset.outcomeName,
                             odds: parseFloat(targetButton.dataset.outcomeOdds)
                         };
                         console.log(`[LS Log][Event][Table] Odds valgt:`, selectionDetails);

                         // Toggle selection
                         const existingSelectionIndex = currentCouponSelections.findIndex(
                             sel => sel.eventId === selectionDetails.eventId && sel.outcomeName === selectionDetails.outcomeName
                         );

                         if (existingSelectionIndex > -1) { // Already selected, so remove
                             currentCouponSelections.splice(existingSelectionIndex, 1);
                             targetButton.classList.remove('btn-success');
                             targetButton.classList.add('btn-outline-light');
                         } else {
                             // Check if another outcome from the same event is already selected
                             const sameEventSelectionIndex = currentCouponSelections.findIndex(sel => sel.eventId === selectionDetails.eventId);
                             if (sameEventSelectionIndex > -1) {
                                 utils.showToast("Du kan kun vælge ét udfald pr. kamp til en kupon.", "warning");
                             } else {
                                 currentCouponSelections.push(selectionDetails);
                                 targetButton.classList.add('btn-success');
                                 targetButton.classList.remove('btn-outline-light');
                             }
                         }
                         renderCouponDisplay(); // Update the visual coupon
                   }
               });
              console.log("[LS Log][setupEventListeners] Event delegering for tabel actions (inkl. odds valg) er sat op.");
         } else { console.error("Kan ikke sætte tabel action listeners, eventsListDiv mangler."); }

         console.log("[LS Log][setupEventListeners] <--- Opsætning færdig.");

        // Add event listeners for coupon area
        const couponDisplayAreaContainer = document.getElementById('sports_data_container'); // Or a more specific static parent
        if (couponDisplayAreaContainer) {
            couponDisplayAreaContainer.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;

                if (target.id === 'create_coupon_session_btn') {
                    console.log("[LS Log][Event][Coupon] Opret Kupon Session klikket.");
                    initiateCouponSessionCreation(); // Initiate modal flow for coupon
                } else if (target.id === 'clear_coupon_btn') {
                    console.log("[LS Log][Event][Coupon] Ryd Kupon klikket.");
                    currentCouponSelections = [];
                    renderCouponDisplay();
                    // Also de-select all odds buttons in the main list
                    document.querySelectorAll('.odds-select-btn.btn-success').forEach(btn => {
                        btn.classList.remove('btn-success');
                        btn.classList.add('btn-outline-light');
                    });
                } else if (target.classList.contains('remove-from-coupon-btn')) {
                    const eventIdToRemove = target.dataset.eventId;
                    const outcomeNameToRemove = target.dataset.outcomeName;
// --- WebSocket Listener for Live Score Updates ---
    if (socket) {
        socket.on('live_score_update', (data) => {
            console.log('[LS Log][WebSocket] Received live_score_update:', data);
            if (data && data.event_id && data.sport_key) {
                const scoreCell = document.getElementById(`scoreCell-${data.sport_key}-${data.event_id}`);
                const tableRow = scoreCell?.closest('tr');
                if (scoreCell && tableRow) {
                    console.log(`...Updating score for event ${data.event_id}`);
                    let scoreHtml;
                    let newRowClass = tableRow.className; // Start with current classes

                    const isFinal = data.completed === true || data.status?.toLowerCase() === 'ended' || data.status?.toLowerCase() === 'final';
                    const isLiveNow = !isFinal && (data.status?.toLowerCase() === 'in progress' || data.status?.toLowerCase() === 'live' || data.status?.toLowerCase() === 'in_progress');
                    const isHalfTime = !isFinal && !isLiveNow && (data.status?.toLowerCase() === 'halftime' || data.status?.toLowerCase() === 'ht');

                    if (isFinal) {
                        const finalScore = data.score ? `(${utils.escapeHtml(data.score)})` : '(Ukendt score)';
                        scoreHtml = `<span class="text-muted fw-bold"><i class="bi bi-flag-fill me-1"></i> Slut ${finalScore}</span>`;
                        newRowClass = newRowClass.replace(/event-\w+/g, '').trim() + ' event-ended event-ended-final'; // Mark as final
                        tableRow.querySelectorAll('button.sports-action-btn').forEach(btn => { btn.disabled = true; }); // Disable buttons
                    } else if (isLiveNow) {
                        const timeInfo = data.minute ? `<small class="text-muted fst-italic ms-1">(${utils.escapeHtml(data.minute)}')</small>` : '';
                        const liveIndicator = `<span class="live-dot me-1" title="Live"></span>`;
                        scoreHtml = `<span class="text-danger fw-bold">${liveIndicator} ${utils.escapeHtml(data.score) || '-:-'} ${timeInfo}</span>`;
                        newRowClass = newRowClass.replace(/event-\w+/g, '').trim() + ' event-live event-live-processed';
                        tableRow.querySelector('.view-live-results-btn')?.removeAttribute('disabled');
                        tableRow.querySelector('.create-session-btn')?.removeAttribute('disabled');
                    } else if (isHalfTime) {
                        const halfTimeScore = data.score ? `(${utils.escapeHtml(data.score)})` : '';
                        scoreHtml = `<span class="text-warning fw-bold"><i class="bi bi-pause-circle me-1"></i> Pause ${halfTimeScore}</span>`;
                        newRowClass = newRowClass.replace(/event-\w+/g, '').trim() + ' event-live event-halftime-processed';
                        tableRow.querySelector('.view-live-results-btn')?.removeAttribute('disabled');
                        tableRow.querySelector('.create-session-btn')?.removeAttribute('disabled');
                    } else { // Assume upcoming or unknown status from update
                        scoreHtml = `<span class="text-info"><i class="bi bi-clock me-1"></i> Planlagt</span>`;
                        newRowClass = newRowClass.replace(/event-\w+/g, '').trim() + ' event-upcoming event-upcoming-processed';
                        tableRow.querySelector('.view-live-results-btn')?.setAttribute('disabled', 'true');
                        tableRow.querySelector('.create-session-btn')?.removeAttribute('disabled');
                    }
                    scoreCell.innerHTML = scoreHtml;
                    tableRow.className = newRowClass.trim(); // Update row class
                } else {
                    // console.debug(`...Score cell or row not found for event ${data.event_id} (might not be visible).`);
                }
            } else {
                console.warn('[LS Log][WebSocket] Received invalid live_score_update data:', data);
            }
        });

        // Handle potential connection errors or status messages from socket
        socket.on('connect_error', (err) => {
            console.error('[LS Log][WebSocket] Connection Error:', err);
            utils.showToast("Real-time forbindelse fejlet.", "danger");
        });
        socket.on('disconnect', (reason) => {
            console.warn('[LS Log][WebSocket] Disconnected:', reason);
            utils.showToast("Real-time forbindelse afbrudt.", "warning");
        });
         socket.on('connect', () => {
             console.log('[LS Log][WebSocket] Reconnected successfully.');
             utils.showToast("Real-time forbindelse genoprettet.", "success");
             // Re-subscribe if needed (e.g., if page was reloaded or connection lost for a while)
             // This might require fetching visible event IDs again.
             // For simplicity, we might rely on the next data refresh to trigger subscription.
         });

    }
    // --- End WebSocket Listener ---
                    console.log(`[LS Log][Event][Coupon] Fjern fra kupon: ${eventIdToRemove} - ${outcomeNameToRemove}`);
                    currentCouponSelections = currentCouponSelections.filter(
                        sel => !(sel.eventId === eventIdToRemove && sel.outcomeName === outcomeNameToRemove)
                    );
                    renderCouponDisplay();
                    // Also de-select the corresponding odds button in the main list
                    const oddsButton = document.querySelector(`.odds-select-btn[data-event-id="${eventIdToRemove}"][data-outcome-name="${outcomeNameToRemove}"]`);
                    if (oddsButton) {
                        oddsButton.classList.remove('btn-success');
                        oddsButton.classList.add('btn-outline-light');
                    }
                }
            });
        }


    } // Slut setupEventListeners

    // =======================================================================
    // ===== MODAL EVENT LISTENERS ===========================================
    // =======================================================================
    // Listener for the final create button inside the modal
    if (modalCreateBtn) {
        modalCreateBtn.addEventListener('click', submitSessionCreation);
    } else {
        console.error("Modal Create Button not found!");
    }

    // Listener for the private checkbox to toggle password field
    if (modalIsPrivateCheckbox && modalPasswordGroup) {
        modalIsPrivateCheckbox.addEventListener('change', () => {
            modalPasswordGroup.style.display = modalIsPrivateCheckbox.checked ? 'block' : 'none';
            if (modalIsPrivateCheckbox.checked && modalSessionPasswordInput) {
                modalSessionPasswordInput.required = true;
            } else if (modalSessionPasswordInput) {
                modalSessionPasswordInput.required = false;
                modalSessionPasswordInput.value = '';
                modalSessionPasswordInput.classList.remove('is-invalid');
            }
        });
    } else {
         console.warn("Modal private checkbox or password group not found.");
    }

    // =======================================================================
    // ===== SIDENS INITIALISERING ===========================================
    // =======================================================================
    console.log("[LS Log][Init] >>> Starter sidens initialiseringssekvens <<<");

    if (missingElements.length === 0 && !essentialUtilsMissing) {
         console.log("[LS Log][Init] Forudsætninger OK (Elementer og essentielle utils funktioner fundet).");
         console.log("[LS Log][Init] Opsætter event listeners...");
         setupEventListeners();

         console.log("[LS Log][Init] Initialiserer kupon display (tom).");
         renderCouponDisplay(); // Initial call to set up the coupon area (even if empty)

         console.log("[LS Log][Init] Starter indlæsning af sportskatalog...");
         loadSportsCatalog()
             .then((catalogLoadedSuccessfully) => {
                 console.log("[LS Log][Init] loadSportsCatalog promise resolved. Teknisk succes:", catalogLoadedSuccessfully);
                 if (catalogLoadedSuccessfully) {
                     const selectedSport = sportSelect?.value;
                     if (selectedSport) {
                         console.log(`[LS Log][Init] Katalog loadet. Valgt sport: '${selectedSport}'. Kalder loadSportsData...`);
                         initialLoadCompleted = false;
                         loadSportsData();
                     } else {
                         console.warn("[LS Log][Init] Katalog loadet, men ingen sport valgt/tilgængelig.");
                         updateUIState(false, true, "Vælg venligst en sport fra filteret ovenfor.", false);
                         if(retryFetchBtn) retryFetchBtn.style.display = 'none';
                     }
                 } else {
                     console.error("[LS Log][Init] Katalog loadede ikke teknisk succesfuldt (promise resolved falsy).");
                     if (!eventsListDiv || !eventsListDiv.innerHTML.trim()) {
                        updateUIState(false, true, "Startfejl: Problem med initialisering af sportskatalog.", false);
                     }
                 }
             })
             .catch(error => {
                 console.error("[LS Log][Init] !! FEJL FANGT (outer catch) under loadSportsCatalog:", error);
             })
             .finally(() => {
                  console.log("[LS Log][Init] Initialiseringssekvens forsøgt afsluttet.");
             });

     } else {
         console.error("[LS Log][Init] !! Initialisering AFBRUDT tidligere pga. manglende elementer eller utils funktioner.");
     }
     console.log("[LS Log][Init] <<<--- Hele scriptets top-level eksekvering er FÆRDIG --->>>");

}); // Slut på DOMContentLoaded
