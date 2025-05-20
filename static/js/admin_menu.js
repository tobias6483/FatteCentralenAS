// static/js/admin_menu.js - OPdateret til at bruge window.utils og implementere forbedringspunkter

// Sørg for at utils.js er loaded FØR denne fil i din HTML template!
// F.eks.:
// <script src="{{ url_for('static', filename='js/utils.js') }}" defer></script>
// <script src="{{ url_for('static', filename='js/admin_menu.js') }}" defer></script>


// ---------- DOMContentLoaded Start ----------
document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // GLOBALE HJÆLPERE FRA utils.js (FORVENTES AT VÆRE DEFINERET)
    // Funktioner som forventes at være i window.utils:
    // - utils.showToast(message, type)
    // - utils.toggleButtonLoading(buttonElement, isLoading, loadingText)
    // - utils.showTableLoading(tbodyElement, isLoading, colSpan, loadingText)
    // - utils.getCsrfToken() // Måske brugt internt af utils.postData
    // - utils.postData(url, payload, method = 'POST') // SKAL UNDERSTØTTE 'PUT', 'DELETE'
    // - utils.getData(url) // *** NY FORVENTNING *** Til GET requests
    // - utils.initializeTooltips(parentElement = document.body) // *** NY FORVENTNING *** Erstatter lokale
    // - utils.formatDateTime(isoString, options = { dateStyle: 'short', timeStyle: 'short' }) // *** NY FORVENTNING ***
    // - utils.formatCurrency(amount, currency = 'DKK') // *** NY FORVENTNING ***
    // =========================================================================
    console.log("Admin Panel JS Loaded. Checking for window.utils...");

    // ----- Tjek for nødvendigt utils objekt og funktioner -----
    const utils = window.utils;
    let essentialUtilsMissing = false;
    if (!utils) {
        console.error("!! KRITISK FEJL !! 'window.utils' objekt mangler globalt.");
        essentialUtilsMissing = true;
    } else {
        // Opdateret liste med nødvendige funktioner
        const requiredUtils = [
            'showToast',
            'toggleButtonLoading',
            'showTableLoading',
            'postData',
            'getData', // Tilføjet
            'initializeTooltips', // Tilføjet
            'formatDateTime', // Tilføjet
            'formatCurrency' // Tilføjet
        ];
        requiredUtils.forEach(funcName => {
            if (typeof utils[funcName] !== 'function') {
                console.error(`!! KRITISK FEJL !! 'utils.${funcName}' funktion mangler.`);
                essentialUtilsMissing = true;
            }
        });
    }

    // =================================================
    // Lokale hjælpefunktioner (kun brugt i denne fil)
    // =================================================

    /**
     * Viser inline feedback besked i et specifikt DIV element.
     * (Beholdes lokalt da den er specifik for admin UI's feedback divs)
     */
    function showFeedback(elementId, message, type = 'info') {
        const feedbackDiv = document.getElementById(elementId);
        if (feedbackDiv) {
            const existingAlert = feedbackDiv.querySelector('.alert');
            if (existingAlert) {
                try {
                    const alertInstance = bootstrap.Alert.getOrCreateInstance(existingAlert);
                    if (alertInstance) alertInstance.dispose();
                } catch(e) { console.warn("Minor issue disposing existing feedback alert:", e); }
                finally { feedbackDiv.innerHTML = ''; }
            }
            if (!message) return;

            const alertClass = `alert-${type === 'error' ? 'danger' : type}`;
            const iconClass = type === 'success' ? 'bi-check-circle-fill' : type === 'danger' || type === 'error' ? 'bi-exclamation-triangle-fill' : type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-info-circle-fill';
            const newAlert = document.createElement('div');
            newAlert.className = `alert ${alertClass} alert-dismissible fade show small p-2 mt-2 mb-0`;
            newAlert.setAttribute('role', 'alert');
            newAlert.innerHTML = `<i class="bi ${iconClass} me-2"></i> ${message}<button type="button" class="btn-close btn-sm p-2" data-bs-dismiss="alert" aria-label="Close"></button>`;
            feedbackDiv.appendChild(newAlert);
            setTimeout(() => {
                if (newAlert && newAlert.isConnected && bootstrap?.Alert) { // Check for bootstrap presence
                    try { bootstrap.Alert.getOrCreateInstance(newAlert)?.close(); }
                    catch (e) { if (newAlert.isConnected) feedbackDiv.removeChild(newAlert); }
                } else if (newAlert && newAlert.isConnected) { feedbackDiv.removeChild(newAlert); }
            }, 7000);
        } else {
            console.warn(`Feedback element #${elementId} not found. Using global utils.showToast as fallback.`);
            // Tjekker om utils OG showToast findes før kald (allerede tjekket i starten)
            if (utils && typeof utils.showToast === 'function') {
                utils.showToast(message, type);
            } else {
                console.error("utils.showToast function not found. Cannot display fallback message.");
            }
        }
    }

    /**
     * Fylder en <select> dropdown med options.
     * (Beholdes lokalt da det er specifik UI logik for admin forms)
     */
    function populateSelect(selectElement, options, includeDefault = true, defaultText = "Vælg...", enable = true) {
        if (!selectElement) { console.error("populateSelect: selectElement is null."); return; }
        const wasDisabled = selectElement.disabled;
        selectElement.innerHTML = '';
        selectElement.disabled = true;
        if (includeDefault) {
            const defaultOption = new Option(defaultText, "");
            defaultOption.disabled = true; defaultOption.selected = true;
            selectElement.add(defaultOption);
        }
        if (Array.isArray(options)) {
            options.forEach(option => {
                let value, text;
                if (typeof option === 'object' && option !== null) {
                    value = option.value ?? option.id ?? option.username ?? option;
                    text = option.text ?? option.name ?? option.id ?? value;
                } else { value = text = option; }
                 if(value !== undefined && text !== undefined) { selectElement.add(new Option(text, value)); }
                 else { console.warn("populateSelect: Skipping option.", option); }
            });
            if(options.length > 0 && includeDefault) {
                const defaultOpt = selectElement.querySelector('option[value=""]');
                if (defaultOpt) defaultOpt.selected = false;
            }
            selectElement.disabled = !enable || options.length === 0;
        } else {
            console.warn("populateSelect: options not an array.", options);
            selectElement.disabled = true;
        }
        if ( (selectElement.disabled !== wasDisabled) || (Array.isArray(options) && options.length > 0)) {
            selectElement.dispatchEvent(new Event('change'));
        }
    }

    // --- Tooltip funktioner (FJERNEDE LOKALE VERSIONER) ---
    // Bruger nu utils.initializeTooltips()
    // =================================================

    // --- Element References ---
    // (Ingen ændringer her)
    const sessionsTableBody = document.getElementById("sessionsTableBody");
    const refreshSessionsBtn = document.getElementById("refresh_sessions_btn");
    const sessionsFeedback = document.getElementById('sessions_msg');
    const editSessionModalEl = document.getElementById('editSessionModal');
    const saveSessionChangesBtn = document.getElementById("save_session_changes_btn");
    const usersTableBody = document.getElementById("usersTableBody");
    const deleteUserSelect = document.getElementById('delete_user_select');
    const balanceUpdateUserSelect = document.getElementById('balance_update_user_select');
    const refreshUsersBtn = document.getElementById("refresh_users_btn");
    const usersTableFeedback = document.getElementById('users_table_msg');
    const deleteUserConfirmModalEl = document.getElementById('deleteUserConfirmModal');
    const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');
    const deleteUserTriggerBtn = document.getElementById('delete_user_trigger_btn');
    const deleteUserActionMsg = document.getElementById('delete_user_action_msg');
    const editUserModalEl = document.getElementById('editUserModal');
    const saveUserChangesBtn = document.getElementById('saveUserChangesBtn');
    const updateBalanceForm = document.getElementById('updateBalanceForm');
    const updateBalanceMsg = document.getElementById('update_balance_msg');
    const generateInviteBtn = document.getElementById('generate_invite_btn');
    const copyInviteCodeBtn = document.getElementById('copyInviteCodeBtn');
    const newInviteCodeDisplay = document.getElementById('new_invite_code_display');
    const generateInviteMsg = document.getElementById('generate_invite_msg');
    const invitesTableBody = document.getElementById('invitesTableBody');
    const refreshInvitesBtn = document.getElementById('refresh_invites_btn');
    const invitesTableFeedback = document.getElementById('invites_table_msg');
    const clearCacheBtn = document.getElementById('clear_cache_btn'); // In Maintenance tab
    const maintenanceActionMsg = document.getElementById('maintenance_action_msg'); // Feedback for Maintenance tab actions
    const reindexSearchBtn = document.getElementById('reindex_search_btn'); // In Maintenance tab
    const runCleanupBtn = document.getElementById('run_cleanup_btn'); // In Maintenance tab
    const clearCacheDetailedBtn = document.getElementById('clear_cache_btn_detailed'); // In Cache Mgmt tab
    const cacheMgmtMsgDetailed = document.getElementById('cache_mgmt_msg_detailed'); // Feedback for Cache Mgmt tab
    const maintenanceModeForm = document.getElementById('maintenanceModeForm');
    const maintenanceToggle = document.getElementById('maintenance_mode_toggle');
    const maintenanceMessageInput = document.getElementById('maintenance_message');
    const applyMaintenanceBtn = document.getElementById('apply_maintenance_btn');
    const maintenanceModeMsg = document.getElementById('maintenance_mode_msg');
    const broadcastForm = document.getElementById('broadcastForm');
    const broadcastMessageInput = document.getElementById('broadcast_message');
    const sendBroadcastBtn = document.getElementById('send_broadcast_btn');
    const broadcastMsg = document.getElementById('broadcast_msg');

    // System Settings Tab Elements
    const settingsTabButton = document.getElementById('settings-tab');
    const systemSettingsForm = document.getElementById('systemSettingsForm');
    const saveSettingsBtn = document.getElementById('save_settings_btn');
    const settingsFeedbackMsg = document.getElementById('settings_msg');
    const settingApiKeyInput = document.getElementById('setting_api_key');
    const settingMaxPlayersInput = document.getElementById('setting_max_players');
    const settingMinBetInput = document.getElementById('setting_min_bet');
    const settingMaxBetInput = document.getElementById('setting_max_bet');
    const settingRegistrationEnabledSwitch = document.getElementById('setting_registration_enabled');
    const settingWelcomeMessageTextarea = document.getElementById('setting_welcome_message');
    const settingSessionTimeoutInput = document.getElementById('setting_session_timeout');
    const settingsPanePlaceholderAlert = document.querySelector('#settingsPane .alert.alert-info');

    // Audit Logs Tab Elements
    const logsTabButton = document.getElementById('logs-tab');
    const logsTableBody = document.getElementById('logsTableBody');
    const refreshLogsBtn = document.getElementById('refresh_logs_btn');
    const logFilterInput = document.getElementById('logFilterInput'); // Filter functionality not implemented yet
    const logsFeedbackMsg = document.getElementById('logs_msg');
    const logCountDisplay = document.getElementById('log_count_display');
    const logsTablePlaceholderRow = logsTableBody?.querySelector('.table-placeholder-row');

    // Scheduled Tasks Tab Elements
    const tasksTabButton = document.getElementById('tasks-tab');
    const scheduledTasksTableBody = document.getElementById('scheduledTasksTableBody');
    const refreshTasksBtn = document.getElementById('refresh_tasks_btn');
    const tasksTableFeedback = document.getElementById('tasks_table_msg'); // Feedback div in footer
    const tasksCountDisplay = document.getElementById('tasks_count_display'); // Span in footer


    // Password Reset Requests Tab Elements
    const passwordResetsTabButton = document.getElementById('password-reset-tab'); // Corrected ID
    const passwordRequestsTableBody = document.getElementById('passwordRequestsTableBody');
    const refreshPasswordRequestsBtn = document.getElementById('refresh_password_requests_btn');
    const passwordRequestsTableFeedback = document.getElementById('password_requests_table_msg');
    const passwordRequestsCountDisplay = document.getElementById('password_requests_count_display');

    // --- Global State / Cache ---
    let sessionsData = {};
    let usersCache = {};
    let invitesCache = [];
    let selectedSessionID = null;
    let passwordResetRequestsCache = []; // Cache for password requests

    // --- Bootstrap Instance Cache ---
    const editSessionModalInstance = editSessionModalEl ? bootstrap.Modal.getOrCreateInstance(editSessionModalEl) : null;
    const deleteUserModalInstance = deleteUserConfirmModalEl ? bootstrap.Modal.getOrCreateInstance(deleteUserConfirmModalEl) : null;
    const editUserModalInstance = editUserModalEl ? bootstrap.Modal.getOrCreateInstance(editUserModalEl) : null;

    // ----- STOP INITIALIZATION if utils are missing -----
    if (essentialUtilsMissing) {
        console.error("Aborting Admin Panel initialization due to missing essential utils functions.");
        // Vis fejl på siden
        const feedbackElements = [sessionsFeedback, usersTableFeedback, invitesTableFeedback, maintenanceActionMsg, maintenanceModeMsg, broadcastMsg, generateInviteMsg, updateBalanceMsg, deleteUserActionMsg];
        feedbackElements.forEach(el => {
            if (el) showFeedback(el.id, "Kritisk sidefejl: Nødvendige scripts (utils.js) mangler eller er ufuldstændige. Kontakt administrator.", "danger");
        });
        // Deaktiver knapper for at forhindre fejl
        const allButtons = document.querySelectorAll('.admin-panel-container button');
        allButtons.forEach(btn => btn.disabled = true);
        return; // Stop further execution
    }
    // ===================================
    // 1) SESSIONS MANAGEMENT
    // ===================================
    async function fetchSessionsTableData() {
        if (!sessionsTableBody || !refreshSessionsBtn || !sessionsFeedback) {
            console.error("Session elements not found for fetchSessionsTableData."); return;
        }
        utils.toggleButtonLoading(refreshSessionsBtn, true, "Opdaterer...");
        utils.showTableLoading(sessionsTableBody, true, 8, 'Henter sessioner...');
        showFeedback(sessionsFeedback.id, '', 'info');

        try {
            // *** OPDATERET: Brug utils.getData ***
            const data = await utils.getData("/admin/api/all_sessions");
            // Fejlhåndtering håndteres nu typisk af utils.getData, som kaster en fejl ved !response.ok

            sessionsData = data.sessions || {};
            const sessionsArr = Object.entries(sessionsData)
                .map(([id, sess]) => ({ ...sess, session_id: id }))
                .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

            sessionsTableBody.innerHTML = '';
            if (sessionsArr.length === 0) {
                utils.showTableLoading(sessionsTableBody, false, 8, 'Ingen aktive sessioner fundet.');
            } else {
                sessionsArr.forEach(sess => {
                    const tr = sessionsTableBody.insertRow();
                    tr.dataset.sessionId = sess.session_id;
                    // *** OPDATERET: Brug utils.formatDateTime ***
                    const formattedDate = utils.formatDateTime(sess.created_at); // Bruger standard options
                    const playerCount = sess.players ? Object.keys(sess.players).length : 0;
                    const betCount = sess.bets ? Object.keys(sess.bets).length : 0;
                    const isActive = sess.is_active !== false;
                    const sessionStatusBadge = isActive ? '<span class="badge bg-success-subtle text-success-emphasis">Aktiv</span>' : '<span class="badge bg-secondary-subtle text-secondary-emphasis">Afsluttet</span>';
                    tr.innerHTML = `
                        <td><small class="font-monospace text-muted user-select-all">${sess.session_id?.substring(0, 8) || 'N/A'}</small></td>
                        <td><small>${formattedDate}</small></td>
                        <td class="text-wrap">${sess.game_mode || 'Ukendt'}</td>
                        <td><span class="badge bg-info-subtle text-info-emphasis user-select-all font-monospace">${sess.admin_code || '-'}</span></td>
                        <td class="text-center">${playerCount}</td>
                        <td class="text-center">${betCount}</td>
                        <td class="text-center">${sessionStatusBadge}</td>
                        <td class="text-center text-nowrap">
                            <button class="btn btn-sm btn-outline-info edit-session-btn" data-bs-toggle="tooltip" data-bs-placement="top" title="Rediger Session (Funktion Ustabil)" data-session-id="${sess.session_id}" aria-label="Rediger session ${sess.session_id?.substring(0, 8)}"><i class="bi bi-pencil-square"></i></button>
                            <button class="btn btn-sm btn-outline-danger delete-session-btn" data-bs-toggle="tooltip" data-bs-placement="top" title="Slet Session (Funktion Ustabil)" data-session-id="${sess.session_id}" aria-label="Slet session ${sess.session_id?.substring(0, 8)}"><i class="bi bi-trash"></i></button>
                        </td>`;
                });
                utils.showTableLoading(sessionsTableBody, false, 8);
                // *** OPDATERET: Brug utils.initializeTooltips på det relevante element ***
                utils.initializeTooltips(sessionsTableBody);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
            // Antager at error.message indeholder relevant info fra utils.getData eller fetch
            const errorMessage = error.message || 'Ukendt fejl ved hentning af sessioner.';
            showFeedback(sessionsFeedback.id, errorMessage, "danger");
            utils.showTableLoading(sessionsTableBody, false, 8, `Fejl: ${errorMessage.substring(0,100)}`);
        } finally {
            utils.toggleButtonLoading(refreshSessionsBtn, false);
        }
    }

    if (refreshSessionsBtn) { refreshSessionsBtn.addEventListener("click", fetchSessionsTableData); }

    function openEditSessionModal(sessionId) {
        if (!editSessionModalInstance || !sessionId || !sessionsData[sessionId]) {
            console.error("Cannot open edit session modal.", { sessionId, hasModal: !!editSessionModalInstance, hasSessionData: !!sessionsData[sessionId] });
            utils.showToast("Fejl: Kan ikke åbne redigeringsvindue.", "danger");
            return;
        }
        selectedSessionID = sessionId;
        const sess = sessionsData[sessionId];
        const modalIdEl = editSessionModalEl?.querySelector('#editSessionModalSessionId');
        const gameModeInput = editSessionModalEl?.querySelector("#edit_session_game_mode");
        const adminCodeInput = editSessionModalEl?.querySelector("#edit_session_admin_code");
        const clearBetsCheckbox = editSessionModalEl?.querySelector("#edit_session_clear_bets");
        const outcomesContainer = editSessionModalEl?.querySelector("#edit_outcomes_container");
        const feedbackArea = editSessionModalEl?.querySelector("#edit_session_feedback_msg");
        if (!outcomesContainer || !feedbackArea || !modalIdEl || !gameModeInput || !adminCodeInput || !clearBetsCheckbox) {
             console.error("Essential elements missing in edit session modal!"); return;
        }
        modalIdEl.textContent = sessionId.substring(0, 8) + '...';
        gameModeInput.value = sess.game_mode || '';
        adminCodeInput.value = sess.admin_code || '';
        clearBetsCheckbox.checked = false;
        feedbackArea.innerHTML = '';
        outcomesContainer.innerHTML = '<div class="text-center text-muted py-3 outcomes-loading-indicator"><div class="spinner-border spinner-border-sm me-2" role="status"></div><span class="loading-text">Indlæser udfald...</span></div>';
        if (sess.outcomes && Array.isArray(sess.outcomes) && sess.outcomes.length > 0) {
            outcomesContainer.innerHTML = '';
            sess.outcomes.forEach((outcome, idx) => {
                const div = document.createElement("div");
                div.className = "mb-3 pb-2 border-bottom border-secondary-subtle outcome-entry"; div.dataset.originalIndex = idx;
                div.innerHTML = `
                    <label class="form-label small fw-bold mb-1 d-block">Udfald ${idx + 1}</label>
                    <div class="input-group input-group-sm mb-1">
                        <span class="input-group-text" style="width: 75px;">Navn</span>
                        <input type="text" class="form-control form-control-sm outcome-name" value="${outcome.name || ''}" placeholder="Udfaldets navn" aria-label="Udfald ${idx+1} navn" required>
                        <div class="invalid-feedback">Navn må ikke være tomt.</div>
                    </div>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="width: 75px;">Odds</span>
                         <input type="number" step="0.01" min="1.0" class="form-control form-control-sm outcome-odds" value="${Number(outcome.odds || 1.0).toFixed(2)}" placeholder=">= 1.0" aria-label="Udfald ${idx+1} odds" required>
                         <div class="invalid-feedback">Odds skal være et tal >= 1.0.</div>
                    </div>`;
                outcomesContainer.appendChild(div);
            });
        } else { outcomesContainer.innerHTML = '<p class="text-muted small fst-italic my-3">Ingen redigerbare udfald.</p>'; }
        editSessionModalInstance.show();
    }

    if (sessionsTableBody) {
        sessionsTableBody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-session-btn');
            const deleteBtn = e.target.closest('.delete-session-btn');
            if (editBtn) { e.stopPropagation(); openEditSessionModal(editBtn.dataset.sessionId); }
            else if (deleteBtn) { e.stopPropagation(); confirmAndDeleteSession(deleteBtn.dataset.sessionId); }
        });
    }

    if (saveSessionChangesBtn && editSessionModalInstance && editSessionModalEl) {
        saveSessionChangesBtn.addEventListener("click", async () => {
            if (!selectedSessionID) { console.warn("No session ID stored."); return; }
            const feedbackArea = editSessionModalEl.querySelector("#edit_session_feedback_msg");
            const outcomesContainer = editSessionModalEl.querySelector("#edit_outcomes_container");
            const clearBetsCheckbox = editSessionModalEl.querySelector("#edit_session_clear_bets");
            if (!feedbackArea || !outcomesContainer) {
                console.error("Essential save elements missing.");
                utils.showToast("Kritisk UI Fejl ved gem session.", "danger");
                return;
            }

            utils.toggleButtonLoading(saveSessionChangesBtn, true, "Gemmer...");
            feedbackArea.innerHTML = ''; // Brug showFeedback? Nej, denne er fin til inline.

            let updatedOutcomes = []; let validationPassed = true;
            outcomesContainer.querySelectorAll('.outcome-entry').forEach(entry => {
                 const nameInput = entry.querySelector('.outcome-name');
                 const oddsInput = entry.querySelector('.outcome-odds');
                 if (nameInput && oddsInput) {
                     const name = nameInput.value.trim(); const odds = parseFloat(oddsInput.value);
                     nameInput.classList.toggle('is-invalid', !name);
                     oddsInput.classList.toggle('is-invalid', isNaN(odds) || odds < 1.0);
                     if (!name || isNaN(odds) || odds < 1.0) { validationPassed = false; }
                     else { updatedOutcomes.push({ name: name, odds: odds }); }
                 }
             });

             if (!validationPassed) {
                 showFeedback(feedbackArea.id, "Ret venligst fejl i udfald.", "warning");
                 utils.toggleButtonLoading(saveSessionChangesBtn, false);
                 return;
             }
            const clearBets = clearBetsCheckbox?.checked || false;
            const payload = { outcomes: updatedOutcomes, clear_bets: clearBets };

            try {
                 // Korrekt brug af utils.putData
                 const result = await utils.putData(`/admin/sessions/${selectedSessionID}`, payload);
                 console.log("Session update success:", result);
                 utils.showToast(result.message || `Session ${selectedSessionID.substring(0,8)}... opdateret!`, "success");
                 editSessionModalInstance.hide();
                 await fetchSessionsTableData(); // Vent på data er hentet før loading fjernes
             } catch (error) {
                 console.error(`Error updating session ${selectedSessionID}:`, error);
                 showFeedback(feedbackArea.id, `Fejl: ${error.message || 'Ukendt serverfejl ved gem.'}`, "danger");
             } finally {
                utils.toggleButtonLoading(saveSessionChangesBtn, false);
             }
        });
    }

    async function confirmAndDeleteSession(sessionId) {
        if (!sessionId) return;
        if (!confirm(`ADVARSEL: Sletning er ustabil!\n\nSikker på at slette session ${sessionId.substring(0,8)}...?`)) return;
        const deleteBtn = sessionsTableBody?.querySelector(`.delete-session-btn[data-session-id="${sessionId}"]`);
        if (deleteBtn) { utils.toggleButtonLoading(deleteBtn, true); }
        else { utils.showToast(`Forsøger at slette session ${sessionId.substring(0,8)}...`, "info"); }

        try {
            // Korrekt brug af utils.deleteData
            const result = await utils.deleteData(`/admin/sessions/${sessionId}`);
            utils.showToast(result.message || `Session ${sessionId.substring(0,8)}... slettet!`, 'success');
            await fetchSessionsTableData(); // Vent på opdatering før loading fjernes implicit
        } catch (error) {
             console.error(`Error deleting session ${sessionId}:`, error);
             utils.showToast(`Fejl ved sletning: ${error.message || 'Ukendt fejl'}`, 'danger');
             if (deleteBtn) { utils.toggleButtonLoading(deleteBtn, false); } // Stop manuelt ved fejl
        }
        // Ved succes stoppes loading via fetchSessionsTableData() -> finally block
    }

    // ===================================
    // 2) USERS MANAGEMENT
    // ===================================
    async function fetchUsersTableData() {
        if (!usersTableBody || !refreshUsersBtn || !usersTableFeedback || !deleteUserSelect || !balanceUpdateUserSelect || !deleteUserTriggerBtn) {
            console.error("User management elements not found for fetchUsersTableData."); return;
        }
        utils.toggleButtonLoading(refreshUsersBtn, true, "Opdaterer...");
        utils.showTableLoading(usersTableBody, true, 9, 'Henter brugere...');
        showFeedback(usersTableFeedback.id, '', 'info');
        populateSelect(deleteUserSelect, [], true, 'Indlæser...', false);
        populateSelect(balanceUpdateUserSelect, [], true, 'Indlæser...', false);
        deleteUserTriggerBtn.disabled = true;
        const balanceForm = document.getElementById('updateBalanceForm');
        if (balanceForm) { balanceForm.querySelectorAll('button[data-action]').forEach(btn => btn.disabled = true); }

        try {
            // *** OPDATERET: Brug utils.getData ***
            const data = await utils.getData("/admin/users");
            const usersList = data.users || [];
            usersCache = {}; usersList.forEach(u => { if (u?.id) usersCache[String(u.id).toLowerCase()] = u; });
            console.debug(`Fetched ${usersList.length} users.`);

            usersTableBody.innerHTML = '';
            if (usersList.length === 0) {
                 utils.showTableLoading(usersTableBody, false, 9, 'Ingen brugere fundet.');
                 populateSelect(deleteUserSelect, [], true, 'Ingen brugere', false);
                 populateSelect(balanceUpdateUserSelect, [], true, 'Ingen brugere', false);
            } else {
                 usersList.sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
                 const userOptions = usersList.map(u => ({ value: u.id, text: u.id }));
                 populateSelect(deleteUserSelect, userOptions, true, 'Vælg bruger...', true);
                 populateSelect(balanceUpdateUserSelect, userOptions, true, 'Vælg bruger...', true);
                 deleteUserSelect.value = ''; balanceUpdateUserSelect.value = '';
                 deleteUserTriggerBtn.disabled = true;
                 if (balanceForm) { balanceForm.querySelectorAll('button[data-action]').forEach(btn => btn.disabled = true); }

                 // Lokale rendering helpers (kan beholdes, men bruger utils til formatering)
                 const createCell = (content = '-', className = '', isMonospace = false, allowHTML = false) => { const td = document.createElement('td'); td.className = `align-middle ${className}`; if (isMonospace) td.classList.add('font-monospace'); if (allowHTML) td.innerHTML = content; else td.textContent = content; return td; };
                 // FJERNEDE LOKAL formatDateTime
                 const createUserLinkAndAvatar = (user) => { const cell = document.createElement('td'); cell.className = 'align-middle'; const img = document.createElement('img'); img.src = user.avatar_url || '/static/avatars/default_avatar.png'; img.alt = `Avatar for ${user.id}`; img.className = 'rounded-circle me-2 border border-secondary'; img.style.cssText = 'width:28px; height:28px; object-fit:cover; vertical-align:middle;'; img.onerror = function() { this.src = '/static/avatars/default_avatar.png'; this.onerror=null; }; cell.appendChild(img); const link = document.createElement('a'); link.href = `/profile/${user.id}`; link.className = 'text-info fw-bold'; link.textContent = utils.capitalizeFirstLetter(user.id || 'N/A'); cell.appendChild(link); return cell; }; // Capitalized username
                 const createBadgeCell = (text, typeClass, centered = true) => { const badge = `<span class="badge bg-${typeClass}-subtle text-${typeClass}-emphasis">${text}</span>`; return createCell(badge, centered ? 'text-center' : '', false, true); };

                 usersList.forEach(user => {
                    if (!user?.id) { console.warn("Skipping user due to missing ID:", user); return; }
                    const tr = usersTableBody.insertRow(); tr.dataset.userId = user.id;
                    tr.appendChild(createCell(user.uid !== null && user.uid !== undefined ? user.uid : '-', 'small text-muted')); // UID
                    tr.appendChild(createUserLinkAndAvatar(user)); // User
                    tr.appendChild(createCell(user.email || '-')); // Email
                    // *** OPDATERET: Brug utils.formatCurrency ***
                    const formattedBalance = utils.formatCurrency(user.balance); // Antager den returnerer formateret string
                    tr.appendChild(createCell(formattedBalance, 'text-end', true)); // Balance
                    tr.appendChild(createBadgeCell(user.role === 'admin' ? 'Admin' : 'Bruger', user.role === 'admin' ? 'danger' : 'secondary')); // Role
                    // *** OPDATERET: Brug utils.formatDateTime ***
                    tr.appendChild(createCell(utils.formatDateTime(user.registration_date, { dateStyle: 'short' }), 'small')); // Created
                    tr.appendChild(createCell(utils.formatDateTime(user.last_login), 'small')); // Last Active
                    tr.appendChild(createBadgeCell(user.is_active === false ? 'Inaktiv' : 'Aktiv', user.is_active === false ? 'warning' : 'success')); // Status
                    const actionsCell = createCell('', 'text-center text-nowrap', false, true);
                    actionsCell.innerHTML = `<button class="btn btn-sm btn-outline-info edit-user-btn me-1" data-user-id="${user.id}" data-bs-toggle="tooltip" title="Rediger Bruger"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-outline-danger delete-user-table-btn" data-user-id="${user.id}" data-user-name="${utils.escapeHtml(user.id)}" data-bs-toggle="tooltip" title="Slet Bruger"><i class="bi bi-person-x-fill"></i></button>`; // Escaped username in data attribute
                    tr.appendChild(actionsCell); // Actions
                 });
                 utils.showTableLoading(usersTableBody, false, 9);
                 // *** OPDATERET: Brug utils.initializeTooltips ***
                 utils.initializeTooltips(usersTableBody);
            }
        } catch (error) {
            console.error("Fejl ved hentning/rendering af brugere:", error);
            const errorMessage = error.message || 'Ukendt fejl ved hentning af brugere.';
            showFeedback(usersTableFeedback.id, errorMessage, "danger");
            utils.showTableLoading(usersTableBody, false, 9, `Fejl: ${errorMessage.substring(0,100)}`);
            populateSelect(deleteUserSelect, [], true, 'Fejl ved load', false);
            populateSelect(balanceUpdateUserSelect, [], true, 'Fejl ved load', false);
            deleteUserTriggerBtn.disabled = true;
            if (balanceForm) { balanceForm.querySelectorAll('button[data-action]').forEach(btn => btn.disabled = true); }
        } finally {
            utils.toggleButtonLoading(refreshUsersBtn, false);
        }
    }
    if (refreshUsersBtn) { refreshUsersBtn.addEventListener("click", fetchUsersTableData); }

    function openEditUserModal(userId) {
        if (!editUserModalInstance || !userId) {
            console.error("Kan ikke åbne Rediger Bruger modal.", { hasModal: !!editUserModalInstance, userId });
            utils.showToast("Fejl: Kunne ikke åbne redigeringsvinduet.", "danger");
            return;
        }
        const user = usersCache[String(userId).toLowerCase()];
        if (!user) {
            console.error(`Bruger '${userId}' ikke fundet i cache.`);
            utils.showToast(`Fejl: Kunne ikke finde data for '${userId}'.`, "danger");
            return;
        }
        const modalElement = editUserModalEl; if (!modalElement) return;
        const modalForm = modalElement.querySelector('#editUserForm');
        const modalUsernameSpan = modalElement.querySelector('#editUserModalUsername');
        const hiddenUsernameInput = modalElement.querySelector('#edit_user_username');
        const emailInput = modalElement.querySelector('#edit_user_email');
        const roleSelect = modalElement.querySelector('#edit_user_role');
        const aboutMeTextarea = modalElement.querySelector('#edit_user_about_me');
        const feedbackMsgDiv = modalElement.querySelector('#edit_user_feedback_msg');
        if (!modalForm || !modalUsernameSpan || !hiddenUsernameInput || !emailInput || !roleSelect || !aboutMeTextarea || !feedbackMsgDiv) {
             console.error("CRITICAL ERROR: Essential elements missing inside Edit User modal!");
             utils.showToast("UI fejl: Kan ikke indlæse redigeringsfelter.", "danger");
             return;
        }
        feedbackMsgDiv.innerHTML = ''; feedbackMsgDiv.className = 'feedback-message alert d-none';
        modalForm.classList.remove('was-validated');
        modalForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        try {
            modalUsernameSpan.textContent = user.id || 'Ukendt'; hiddenUsernameInput.value = user.id || '';
            emailInput.value = user.email || ''; roleSelect.value = user.role || 'user';
            aboutMeTextarea.value = user.about_me || '';
        } catch (error) {
             console.error("Fejl ved udfyldning af modal:", error, user);
             showFeedback(feedbackMsgDiv.id, "Fejl ved indlæsning af data i form.", "danger");
             return;
         }
        editUserModalInstance.show();
    }

    if (saveUserChangesBtn && editUserModalInstance && editUserModalEl) {
        saveUserChangesBtn.addEventListener('click', async function() {
            const modalElement = editUserModalEl;
            const modalForm = modalElement.querySelector('#editUserForm');
            const hiddenUsernameInput = modalElement.querySelector('#edit_user_username');
            const emailInput = modalElement.querySelector('#edit_user_email');
            const roleSelect = modalElement.querySelector('#edit_user_role');
            const aboutMeTextarea = modalElement.querySelector('#edit_user_about_me');
            const feedbackMsgDiv = modalElement.querySelector('#edit_user_feedback_msg');
            if (!modalForm || !hiddenUsernameInput || !emailInput || !roleSelect || !aboutMeTextarea || !feedbackMsgDiv) {
                 console.error("CRITICAL ERROR on Save: Cannot find form elements!");
                 utils.showToast("UI Fejl: Kan ikke læse ændringer.", "danger");
                 return;
             }
            const username = hiddenUsernameInput.value; const email = emailInput.value.trim();
            const role = roleSelect.value; const aboutMe = aboutMeTextarea.value.trim();
            if (!username) { showFeedback(feedbackMsgDiv.id, 'Kritisk fejl: Bruger ID mangler.', 'danger'); return; }

            const payload = { email: email, role: role, about_me: aboutMe };
            utils.toggleButtonLoading(saveUserChangesBtn, true, "Gemmer...");
            feedbackMsgDiv.innerHTML = ''; feedbackMsgDiv.className = 'feedback-message alert d-none';
            modalForm.classList.remove('was-validated');
            modalForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

            try {
                // Korrekt brug af utils.putData
                const result = await utils.putData(`/admin/users/${username}`, payload);
                showFeedback(feedbackMsgDiv.id, result.message || 'Bruger gemt!', 'success');
                utils.showToast(`Bruger ${username} blev opdateret.`, 'success');
                const cacheKey = String(username).toLowerCase();
                if (result?.user) { usersCache[cacheKey] = { ...usersCache[cacheKey], ...result.user }; }
                else { if (usersCache[cacheKey]) { usersCache[cacheKey].email = email; usersCache[cacheKey].role = role; usersCache[cacheKey].about_me = aboutMe; } }
                setTimeout(() => { if (editUserModalInstance) editUserModalInstance.hide(); }, 1500);
                await fetchUsersTableData(); // Vent på opdatering
            } catch (error) {
                console.error(`Fejl ved opdatering af bruger ${username}:`, error);
                let errorMessage = error.message || 'Ukendt serverfejl.'; let errorDetails = null;
                // Tjek for struktur med valideringsfejl (kan variere baseret på backend)
                if (error.responseJson && error.responseJson.details && typeof error.responseJson.details === 'object') {
                    errorDetails = error.responseJson.details;
                    errorMessage = "Valideringsfejl.";
                    let detailMessages = [];
                    Object.entries(errorDetails).forEach(([field, msg]) => {
                        let inputElement = modalForm.querySelector(`[name="${field}"]`) || modalForm.querySelector(`#edit_user_${field}`);
                        // Eksempel på at mappe backend-felter til frontend-felter
                        if (field === 'about_me' && !inputElement) inputElement = aboutMeTextarea;
                        detailMessages.push(`${field}: ${msg}`);
                        if (inputElement) {
                            inputElement.classList.add('is-invalid');
                            // Tilføj feedback under feltet hvis muligt
                            let feedbackElement = inputElement.nextElementSibling;
                            if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
                                feedbackElement.textContent = msg;
                            }
                        }
                    });
                    errorMessage = detailMessages.join('; ');
                    modalForm.classList.add('was-validated'); // Viser generel valideringsstil
                } else if (error.error) { // Simpel fejlbesked fra server
                    errorMessage = error.error;
                }
                showFeedback(feedbackMsgDiv.id, `Fejl: ${errorMessage}`, 'danger');
            } finally {
                utils.toggleButtonLoading(saveUserChangesBtn, false);
            }
        });
        console.log("SAVE USER CHANGES listener added successfully.");
    } else { console.error("Could NOT add 'Save User Changes' listener (check element IDs and modal instances)."); }

    if (usersTableBody) {
        usersTableBody.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-user-table-btn');
            const editBtn = e.target.closest('.edit-user-btn');
            if (deleteBtn) { e.stopPropagation(); openDeleteUserModal(deleteBtn.dataset.userId, deleteBtn.dataset.userName); }
            else if (editBtn) { e.stopPropagation(); openEditUserModal(editBtn.dataset.userId); }
       });
    }

    function openDeleteUserModal(userId, userName) {
         if (!deleteUserModalInstance || !userId || !deleteUserConfirmModalEl) {
             console.error("Delete User Modal Instance, element or userId missing.");
             utils.showToast(`Fejl: Kan ikke åbne slette-vindue for '${userId || 'ukendt'}'.`, "danger");
             return;
         }
        const modalUserIdInput = deleteUserConfirmModalEl.querySelector('#userToDeleteId');
        const modalUserNameSpan = deleteUserConfirmModalEl.querySelector('#userToDeleteName');
        const modalFeedbackArea = deleteUserConfirmModalEl.querySelector('.modal-body .feedback-area');
        if (!modalUserIdInput || !modalUserNameSpan) { console.error("Cannot find elements inside delete modal!"); return; }
        modalUserIdInput.value = userId; modalUserNameSpan.textContent = utils.capitalizeFirstLetter(userName || userId); // Capitalized display
        if (modalFeedbackArea) modalFeedbackArea.innerHTML = ''; // Ryd gammel feedback
        deleteUserModalInstance.show();
    }

    if(deleteUserTriggerBtn && deleteUserSelect && deleteUserActionMsg){
       deleteUserTriggerBtn.addEventListener('click', function() {
           const userId = deleteUserSelect.value;
           if (!userId) { showFeedback(deleteUserActionMsg.id, 'Vælg en bruger.', 'warning'); return; }
           const selectedOption = deleteUserSelect.options[deleteUserSelect.selectedIndex];
           openDeleteUserModal(userId, selectedOption.text);
       });
       deleteUserSelect.addEventListener('change', function() { deleteUserTriggerBtn.disabled = !this.value; });
       deleteUserTriggerBtn.disabled = !deleteUserSelect.value; // Initial state
    }

    if (confirmDeleteUserBtn && deleteUserModalInstance && deleteUserConfirmModalEl) {
       confirmDeleteUserBtn.addEventListener('click', async function() {
           const modalUserIdInput = deleteUserConfirmModalEl.querySelector('#userToDeleteId');
           const modalFeedbackArea = deleteUserConfirmModalEl.querySelector('.modal-body .feedback-area');
           const userId = modalUserIdInput?.value;
           if (!userId || !modalFeedbackArea) {
               console.error("Required elements missing in delete modal on confirm.");
               utils.showToast("UI Fejl ved sletning.", "danger");
               return;
           }
           utils.toggleButtonLoading(this, true, 'Sletter...');
           showFeedback(deleteUserActionMsg.id, '', 'info'); // Ryd feedback i hovedsektion
           modalFeedbackArea.innerHTML = ''; // Ryd modal feedback

           try {
               // Korrekt brug af utils.deleteData
               const data = await utils.deleteData(`/admin/users/${userId}`);
               showFeedback(deleteUserActionMsg.id, data.message || `Bruger ${userId} slettet.`, 'success');
               utils.showToast(`Bruger ${userId} slettet.`, 'success');
                deleteUserModalInstance.hide();
                await fetchUsersTableData(); // Vent på opdatering
            } catch (error) {
                console.error(`Error deleting user ${userId}:`, error);
                const errorMsg = `Fejl ved sletning: ${error.message || 'Ukendt serverfejl'}`;
                // Vis fejl inde i modalen
                modalFeedbackArea.innerHTML = `<div class="alert alert-danger alert-dismissible fade show small p-2 mt-2 mb-0" role="alert"><i class="bi bi-exclamation-triangle-fill me-2"></i> ${errorMsg}<button type="button" class="btn-close btn-sm p-2" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
                utils.showToast(`Sletning af ${userId} fejlede.`, 'danger');
           } finally {
                utils.toggleButtonLoading(this, false);
           }
       });
    }

    if (updateBalanceForm && balanceUpdateUserSelect && updateBalanceMsg) {
        balanceUpdateUserSelect.addEventListener('change', function() {
            const disableButtons = !this.value;
            updateBalanceForm.querySelectorAll('button[data-action]').forEach(btn => btn.disabled = disableButtons);
        });
        updateBalanceForm.addEventListener('submit', async function(event) {
            event.preventDefault(); event.stopPropagation();
            const form = this;
            const amountInput = document.getElementById('balance_amount');
            const reasonInput = document.getElementById('balance_reason');

            // Simpel client-side validering først
            if (!form.checkValidity() || !balanceUpdateUserSelect.value || !amountInput || !reasonInput) {
                 form.classList.add('was-validated');
                 showFeedback(updateBalanceMsg.id, 'Udfyld venligst bruger, beløb (> 0) og årsag.', 'warning');
                 // Sørg for at individuelle felter også viser fejl hvis browser understøtter det
                 if (amountInput && (!amountInput.value || parseFloat(amountInput.value) <= 0)) amountInput.classList.add('is-invalid'); else amountInput?.classList.remove('is-invalid');
                 if (reasonInput && !reasonInput.value.trim()) reasonInput.classList.add('is-invalid'); else reasonInput?.classList.remove('is-invalid');
                 if (!balanceUpdateUserSelect.value) balanceUpdateUserSelect.classList.add('is-invalid'); else balanceUpdateUserSelect.classList.remove('is-invalid');
                 return;
            }
            form.classList.remove('was-validated');
            ['is-invalid'].forEach(cls => { // Ryd manuel 'is-invalid'
                amountInput?.classList.remove(cls);
                reasonInput?.classList.remove(cls);
                balanceUpdateUserSelect?.classList.remove(cls);
            });

            const submitButton = event.submitter; if (!submitButton || !submitButton.dataset.action) { console.error("Balance Submit Error: No action found on submitter."); showFeedback(updateBalanceMsg.id, 'Ukendt handling.', 'danger'); return; }

            const action = submitButton.dataset.action; const userId = balanceUpdateUserSelect.value;
            const amount = parseFloat(amountInput.value); const reason = reasonInput.value.trim();

            // Dobbelt-tjek validering, især amount
            if (isNaN(amount) || amount <= 0) {
                amountInput.classList.add('is-invalid');
                showFeedback(updateBalanceMsg.id, 'Beløb skal være et positivt tal.', 'warning');
                return;
            }

            const loadingTextMap = {'add': 'Tilføjer...', 'remove': 'Fjerner...', 'set': 'Sætter...'};
            utils.toggleButtonLoading(submitButton, true, loadingTextMap[action] || 'Justerer...');
            showFeedback(updateBalanceMsg.id, '', 'info');

            try {
                const payload = { amount: amount, operation: action, reason: reason };
                // Korrekt brug af utils.postData
                const data = await utils.postData(`/admin/users/${userId}/balance`, payload, 'POST');
                // *** OPDATERET: Brug utils.formatCurrency ***
                const newBalanceFormatted = data.new_balance !== undefined ? utils.formatCurrency(data.new_balance) : '(ukendt)';
                showFeedback(updateBalanceMsg.id, `${data.message || 'Balance opdateret.'} Ny balance: ${newBalanceFormatted}`, 'success');
                utils.showToast(`Balance justeret for ${userId}.`, 'success');
                form.reset(); form.classList.remove('was-validated');
                balanceUpdateUserSelect.value = ''; updateBalanceForm.querySelectorAll('button[data-action]').forEach(btn => btn.disabled = true);
                await fetchUsersTableData(); // Opdater tabel
            } catch (error) {
                console.error(`Balance update error for ${userId}:`, error);
                showFeedback(updateBalanceMsg.id, `Fejl: ${error.message || 'Ukendt serverfejl.'}`, 'danger');
                utils.showToast(`Fejl ved justering af balance for ${userId}.`, 'danger');
            } finally {
                utils.toggleButtonLoading(submitButton, false);
            }
        });
        // Sæt initial state for knapper baseret på select
        updateBalanceForm.querySelectorAll('button[data-action]').forEach(btn => btn.disabled = !balanceUpdateUserSelect?.value);
    }

    // ===================================
    // 3) INVITE CODES
    // ===================================
    async function fetchInvitesTableData() {
        if (!invitesTableBody || !refreshInvitesBtn || !invitesTableFeedback) {
            console.error("Invite code elements not found."); return;
        }
        utils.toggleButtonLoading(refreshInvitesBtn, true, "Opdaterer...");
        utils.showTableLoading(invitesTableBody, true, 5, 'Henter invite koder...');
        showFeedback(invitesTableFeedback.id, '', 'info');

        try {
            // *** OPDATERET: Brug utils.getData ***
            const data = await utils.getData("/admin/invites");
            invitesCache = data.invites || [];
            console.debug(`Fetched ${invitesCache.length} invites.`);

            invitesTableBody.innerHTML = '';
            if (invitesCache.length === 0) {
                utils.showTableLoading(invitesTableBody, false, 5, 'Ingen aktive invite koder fundet.');
            } else {
                invitesCache.forEach(invite => {
                    if (!invite || typeof invite !== 'object' || !invite.code) { console.warn("Skipping invalid invite:", invite); return; }
                    const tr = invitesTableBody.insertRow();
                    // *** OPDATERET: Brug utils.formatDateTime ***
                    const createdAt = utils.formatDateTime(invite.created_at);
                    const createdByRaw = invite.created_by || 'System/Ukendt';
                    const createdBy = utils.capitalizeFirstLetter(String(createdByRaw)); // Capitalized & Ensured string
                    const isUsed = invite.used === true;
                    let used_by_info = '';
                    if (isUsed && invite.used_by) {
                        let used_by_display_text = '';
                        if (typeof invite.used_by === 'string') {
                            used_by_display_text = utils.capitalizeFirstLetter(invite.used_by);
                        } else {
                            // If invite.used_by is truthy but not a string (e.g., a number), convert it.
                            used_by_display_text = String(invite.used_by);
                        }
                        used_by_info = `af ${used_by_display_text}`;

                        if (invite.used_at) {
                            // *** OPDATERET: Brug utils.formatDateTime (kun dato) ***
                            used_by_info += ` (${utils.formatDateTime(invite.used_at, { dateStyle: 'short', timeStyle: undefined }) || 'ukendt dato'})`;
                        }
                    }
                    const usedBadgeHTML = isUsed ? `<span class="badge bg-success-subtle text-success-emphasis" title="Brugt ${used_by_info.trim()}">${used_by_info ? used_by_info.trim() : 'Brugt'}</span>` : '<span class="badge bg-secondary-subtle text-secondary-emphasis">Ikke Brugt</span>';
                    const deleteButtonHTML = `<button class="btn btn-sm btn-outline-danger delete-invite-btn" data-invite-code="${invite.code}" data-bs-toggle="tooltip" title="${isUsed ? 'Kode brugt' : 'Slet kode'}" ${isUsed ? 'disabled' : ''}><i class="bi bi-trash"></i></button>`;
                    tr.innerHTML = `
                        <td class="font-monospace user-select-all align-middle">${invite.code}</td>
                        <td class="align-middle">${createdBy}</td>
                        <td class="align-middle"><small>${createdAt}</small></td>
                        <td class="text-center align-middle">${usedBadgeHTML}</td>
                        <td class="text-center align-middle">${deleteButtonHTML}</td>`;
                });
                utils.showTableLoading(invitesTableBody, false, 5);
                // *** OPDATERET: Brug utils.initializeTooltips ***
                utils.initializeTooltips(invitesTableBody);
            }
        } catch (error) {
             console.error("Error fetching or rendering invites:", error);
             const errorMessage = error.message || 'Ukendt fejl ved hentning af invite koder.';
             showFeedback(invitesTableFeedback.id, errorMessage, "danger");
             utils.showTableLoading(invitesTableBody, false, 5, `Fejl: ${errorMessage.substring(0, 100)}`);
             invitesCache = [];
        } finally {
             if (refreshInvitesBtn) { utils.toggleButtonLoading(refreshInvitesBtn, false); }
        }
    }
    if (refreshInvitesBtn) { refreshInvitesBtn.addEventListener('click', fetchInvitesTableData); }

    if (invitesTableBody && invitesTableFeedback) {
         invitesTableBody.addEventListener('click', async (e) => {
             const deleteBtn = e.target.closest('.delete-invite-btn');
             if (deleteBtn && !deleteBtn.disabled) {
                 e.stopPropagation();
                 const inviteCode = deleteBtn.dataset.inviteCode;
                 if (!inviteCode) { console.warn("Invite code missing from button data attribute."); utils.showToast("Fejl: Kode mangler.", "warning"); return; }
                 if (confirm(`Sikker på at slette ubrugt invite kode:\n\n${inviteCode}\n\nKan ikke fortrydes.`)) {
                     utils.toggleButtonLoading(deleteBtn, true);
                     showFeedback(invitesTableFeedback.id, '', 'info');
                     try {
                        // Ensure utils.postData is called with 'DELETE' method
                        // Use utils.deleteData instead of postData for DELETE method
                        const result = await utils.deleteData(`/admin/invites/${inviteCode}`);
                        utils.showToast(result.message || `Kode ${inviteCode} slettet.`, 'success');
                        await fetchInvitesTableData(); // Vent på genindlæsning
                     } catch (error) {
                        console.error(`Error deleting invite ${inviteCode}:`, error);
                        const errorMsg = `Fejl ved sletning: ${error.message || 'Ukendt serverfejl.'}`;
                        showFeedback(invitesTableFeedback.id, errorMsg, 'danger');
                        utils.showToast(`Kunne ikke slette kode ${inviteCode}.`, 'danger');
                        utils.toggleButtonLoading(deleteBtn, false); // Manuelt stop ved fejl
                     }
                     // Ved succes stoppes loading implicit via fetchInvitesTableData
                 } else {
                     console.debug(`Deletion cancelled for ${inviteCode}.`);
                     utils.showToast('Sletning annulleret.', 'info');
                 }
             }
         });
    }

    if (generateInviteBtn && generateInviteMsg && newInviteCodeDisplay) {
        generateInviteBtn.addEventListener('click', async function() {
            utils.toggleButtonLoading(this, true, "Genererer...");
            showFeedback(generateInviteMsg.id, '', 'info');
            newInviteCodeDisplay.value = 'Vent venligst...';
            if (copyInviteCodeBtn) copyInviteCodeBtn.disabled = true;
            try {
                // Korrekt brug af utils.postData
                const data = await utils.postData("/admin/generate_invite_code", {});
                if (data.invite_code) {
                   newInviteCodeDisplay.value = data.invite_code;
                   showFeedback(generateInviteMsg.id, data.message || `Ny kode '${data.invite_code}' genereret!`, 'success');
                   utils.showToast('Ny invite kode klar!', 'success');
                   if (copyInviteCodeBtn) copyInviteCodeBtn.disabled = false;
                   await fetchInvitesTableData(); // Opdater tabel
               } else { throw new Error(data.error || data.message || "Server returnerede ikke en gyldig kode."); }
            } catch(error) {
                console.error("Error generating invite code:", error);
                showFeedback(generateInviteMsg.id, `Fejl: ${error.message}`, 'danger');
                utils.showToast('Kunne ikke generere invite kode.', 'danger');
                newInviteCodeDisplay.value = '';
                if (copyInviteCodeBtn) copyInviteCodeBtn.disabled = true;
            } finally {
                utils.toggleButtonLoading(this, false);
            }
        });
    }

    if (copyInviteCodeBtn && newInviteCodeDisplay && generateInviteMsg) {
        copyInviteCodeBtn.addEventListener('click', function() {
            const codeToCopy = newInviteCodeDisplay.value;
            if (codeToCopy && codeToCopy !== 'Vent venligst...') {
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    utils.showToast('Kode kopieret!', 'info');
                    const originalIconHTML = '<i class="bi bi-clipboard"></i>'; this.innerHTML = '<i class="bi bi-check-lg"></i>';
                    this.classList.replace('btn-outline-secondary', 'btn-success');
                    setTimeout(() => { this.innerHTML = originalIconHTML; this.classList.replace('btn-success', 'btn-outline-secondary'); }, 2000);
                }).catch(err => {
                     console.error('Clipboard write failed:', err);
                     showFeedback(generateInviteMsg.id, 'Automatisk kopiering fejlede. Kopier venligst manuelt.', 'warning');
                     utils.showToast('Kunne ikke kopiere koden automatisk.', 'warning');
                 });
            }
        });
        // Initial state
        copyInviteCodeBtn.disabled = !newInviteCodeDisplay.value || newInviteCodeDisplay.value === 'Vent venligst...';
    }

    // =========================================================================
    // 4) MAINTENANCE & CACHE ACTIONS
    // =========================================================================

    // Generic function to handle cache clearing for both buttons
    async function handleClearCache(buttonElement, feedbackElementId) {
        if (!buttonElement || !feedbackElementId || !utils) return;
        if (!confirm("Sikker på at rydde Redis session cache? Alle aktive brugersessioner vil blive afsluttet.")) return;

        utils.toggleButtonLoading(buttonElement, true, "Rydder...");
        showFeedback(feedbackElementId, '', 'info'); // Clear feedback in the specific area

        try {
            // Use the new correct endpoint
            const data = await utils.postData("/admin/api/clear_cache", {}, 'POST');
            showFeedback(feedbackElementId, data.message || "Cache ryddet!", "success");
            utils.showToast("Redis session cache ryddet.", "success");
        } catch(error) {
            console.error("Error clearing cache:", error);
            showFeedback(feedbackElementId, `Fejl: ${error.message || 'Ukendt serverfejl.'}`, "danger");
            utils.showToast("Fejl ved rydning af cache.", "danger");
        } finally {
            utils.toggleButtonLoading(buttonElement, false);
        }
    }

    // Attach listener to the button in the Maintenance tab
    if (clearCacheBtn && maintenanceActionMsg) {
        clearCacheBtn.addEventListener('click', function() {
            handleClearCache(this, maintenanceActionMsg.id);
        });
    }

    // Attach listener to the button in the Cache Mgmt tab
    if (clearCacheDetailedBtn && cacheMgmtMsgDetailed) {
        clearCacheDetailedBtn.addEventListener('click', function() {
            handleClearCache(this, cacheMgmtMsgDetailed.id);
        });
    }

    // Re-index Search Button Handler
    if (reindexSearchBtn && maintenanceActionMsg && utils) {
        reindexSearchBtn.addEventListener('click', async function() {
            if (!confirm("Er du sikker på, at du vil genopbygge søgeindekset for forum posts? Dette kan tage et øjeblik.")) return;

            utils.toggleButtonLoading(this, true, "Indekserer...");
            showFeedback(maintenanceActionMsg.id, '', 'info'); // Use the general maintenance feedback area

            try {
                const data = await utils.postData("/admin/api/reindex_search", {}, 'POST');
                showFeedback(maintenanceActionMsg.id, data.message || "Søgeindeks genopbygget!", "success");
                utils.showToast("Søgeindeks for forum er blevet opdateret.", "success");
                // Enable the button again as it's no longer a placeholder
                this.disabled = false;
                this.removeAttribute('title');
            } catch(error) {
                console.error("Error re-indexing search:", error);
                showFeedback(maintenanceActionMsg.id, `Fejl: ${error.message || 'Ukendt serverfejl ved genindeksering.'}`, "danger");
                utils.showToast("Fejl ved genopbygning af søgeindeks.", "danger");
            } finally {
                utils.toggleButtonLoading(this, false);
            }
        });
        // Initially enable the button as it's now functional
        reindexSearchBtn.disabled = false;
        reindexSearchBtn.removeAttribute('title');
    }

    // Run Cleanup Job Button Handler
    if (runCleanupBtn && maintenanceActionMsg && utils) {
        runCleanupBtn.addEventListener('click', async function() {
            if (!confirm("Er du sikker på, at du vil køre oprydningsjobbet?\nDette vil deaktivere udløbne/brugte invite koder og slette gamle, slettede private beskeder.")) return;

            utils.toggleButtonLoading(this, true, "Rydder op...");
            showFeedback(maintenanceActionMsg.id, '', 'info'); // Use the general maintenance feedback area

            try {
                const data = await utils.postData("/admin/api/run_cleanup_job", {}, 'POST');
                let detailsMsg = '';
                if (data.details) {
                    detailsMsg = ` (Invites deaktiveret: ${data.details.invites_deactivated || 0}, Beskeder slettet: ${data.details.messages_deleted || 0})`;
                }
                showFeedback(maintenanceActionMsg.id, (data.message || "Oprydning fuldført!") + detailsMsg, "success");
                utils.showToast("Oprydningsjob fuldført.", "success");
                // Enable the button again as it's no longer a placeholder
                this.disabled = false;
                this.removeAttribute('title');
            } catch(error) {
                console.error("Error running cleanup job:", error);
                showFeedback(maintenanceActionMsg.id, `Fejl: ${error.message || 'Ukendt serverfejl under oprydning.'}`, "danger");
                utils.showToast("Fejl under oprydningsjob.", "danger");
            } finally {
                utils.toggleButtonLoading(this, false);
            }
        });
        // Initially enable the button as it's now functional
        runCleanupBtn.disabled = false;
        runCleanupBtn.removeAttribute('title');
    }

// Check Server Health Button Handler
    const checkServerHealthBtn = document.getElementById('check_server_health_btn'); // Assuming this ID exists
    const serverHealthResultDiv = document.getElementById('server_health_result'); // Assuming a div for detailed results

    if (checkServerHealthBtn && maintenanceActionMsg && utils) {
        checkServerHealthBtn.addEventListener('click', async function() {
            utils.toggleButtonLoading(this, true, "Kontrollerer...");
            showFeedback(maintenanceActionMsg.id, '', 'info'); // Clear general feedback
            if (serverHealthResultDiv) serverHealthResultDiv.innerHTML = '<div class="text-center text-muted py-2"><div class="spinner-border spinner-border-sm me-2" role="status"></div><span>Henter status...</span></div>';


            try {
                const data = await utils.getData("/admin/check_server_health");
                let resultHtml = `<h6 class="mt-2 mb-1">Server Status: <span class="fw-bold text-${data.overall_status === 'ok' ? 'success' : (data.overall_status === 'warning' ? 'warning' : 'danger')}">${data.overall_status.toUpperCase()}</span></h6>`;
                resultHtml += '<ul class="list-group list-group-flush small">';

                for (const [service, details] of Object.entries(data.checks)) {
                    let statusClass = 'text-success';
                    let iconClass = 'bi-check-circle-fill';
                    if (details.status === 'error') {
                        statusClass = 'text-danger';
                        iconClass = 'bi-x-octagon-fill';
                    } else if (details.status === 'warning') {
                        statusClass = 'text-warning';
                        iconClass = 'bi-exclamation-triangle-fill';
                    }
                    const serviceName = service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    resultHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-1">
                            <span><i class="bi ${iconClass} me-2 ${statusClass}"></i>${serviceName}:</span>
                            <span class="fw-semibold ${statusClass}">${details.message}</span>
                        </li>`;
                }
                resultHtml += '</ul>';

                if (serverHealthResultDiv) {
                    serverHealthResultDiv.innerHTML = resultHtml;
                    showFeedback(maintenanceActionMsg.id, `Helbredstjek ${data.overall_status === 'ok' ? 'fuldført' : 'fuldført med bemærkninger'}.`, data.overall_status === 'error' ? 'danger' : (data.overall_status === 'warning' ? 'warning' : 'success'));
                } else {
                    // Fallback if dedicated result div is not there, show simplified in general feedback
                    showFeedback(maintenanceActionMsg.id, `Server Status: ${data.overall_status.toUpperCase()}. Detaljer i konsol.`, data.overall_status === 'error' ? 'danger' : (data.overall_status === 'warning' ? 'warning' : 'success'));
                    console.log("Server Health Details:", data.checks);
                }
                utils.showToast("Server helbredstjek udført.", data.overall_status === 'error' ? 'danger' : (data.overall_status === 'warning' ? 'warning' : 'success'));

            } catch (error) {
                console.error("Error checking server health:", error);
                const errorMsg = `Fejl: ${error.message || 'Ukendt serverfejl ved helbredstjek.'}`;
                showFeedback(maintenanceActionMsg.id, errorMsg, "danger");
                if (serverHealthResultDiv) serverHealthResultDiv.innerHTML = `<div class="alert alert-danger small p-2">${errorMsg}</div>`;
                utils.showToast("Fejl ved helbredstjek.", "danger");
            } finally {
                utils.toggleButtonLoading(this, false);
            }
        });
        // Enable the button if it was previously disabled as a placeholder
        checkServerHealthBtn.disabled = false;
        checkServerHealthBtn.removeAttribute('title');
    } else {
        if (!checkServerHealthBtn) console.warn("Admin Panel: 'check_server_health_btn' not found.");
        if (!serverHealthResultDiv) console.warn("Admin Panel: 'server_health_result' div not found for detailed health status.");
    }

    // Maintenance Mode Form Handler (remains largely the same)
    if (maintenanceModeForm && maintenanceToggle && maintenanceMessageInput && applyMaintenanceBtn && maintenanceModeMsg) {
        maintenanceToggle.addEventListener('change', function() {
            maintenanceMessageInput.disabled = !this.checked;
            if (!this.checked) {
                maintenanceMessageInput.value = ''; // Ryd besked når deaktiveret
                maintenanceMessageInput.required = false; // Fjern required hvis den var sat
            } else {
                maintenanceMessageInput.required = true; // Gør besked påkrævet når aktiveret
            }
            maintenanceMessageInput.dispatchEvent(new Event('input')); // Trigger evt. validation UI
        });

        maintenanceModeForm.addEventListener('submit', async function(event) {
            event.preventDefault(); event.stopPropagation();

            // Manuel validering af besked hvis toggle er checked
            if (maintenanceToggle.checked && !maintenanceMessageInput.value.trim()) {
                maintenanceMessageInput.classList.add('is-invalid');
                showFeedback(maintenanceModeMsg.id, 'Besked er påkrævet når vedligehold er aktivt.', 'warning');
                return;
            }
            maintenanceMessageInput.classList.remove('is-invalid'); // Ryd fejl hvis den er ok

            utils.toggleButtonLoading(applyMaintenanceBtn, true, "Anvender...");
            showFeedback(maintenanceModeMsg.id, '', 'info');
            const isEnabled = maintenanceToggle.checked; const message = maintenanceMessageInput.value.trim();
            try {
                const payload = { maintenance_mode: isEnabled, notification_message: message };
                // Korrekt brug af utils.postData
                const data = await utils.postData("/admin/apply_maintenance", payload, 'POST');
                showFeedback(maintenanceModeMsg.id, data.message || "Vedligehold opdateret.", "success");
                utils.showToast(`Vedligehold ${isEnabled ? 'aktiveret' : 'deaktiveret'}.`, "success");
            } catch (error) {
                 console.error("Error clearing cache:", error);
                 showFeedback(maintenanceActionMsg.id, `Fejl: ${error.message || 'Ukendt serverfejl.'}`, "danger");
                 utils.showToast("Fejl ved rydning af cache.", "danger");
             } finally {
                 utils.toggleButtonLoading(this, false);
             }
        });
    }

    if (maintenanceModeForm && maintenanceToggle && maintenanceMessageInput && applyMaintenanceBtn && maintenanceModeMsg) {
         maintenanceToggle.addEventListener('change', function() {
            maintenanceMessageInput.disabled = !this.checked;
            if (!this.checked) {
                maintenanceMessageInput.value = ''; // Ryd besked når deaktiveret
                maintenanceMessageInput.required = false; // Fjern required hvis den var sat
            } else {
                maintenanceMessageInput.required = true; // Gør besked påkrævet når aktiveret
            }
            maintenanceMessageInput.dispatchEvent(new Event('input')); // Trigger evt. validation UI
        });

         maintenanceModeForm.addEventListener('submit', async function(event) {
             event.preventDefault(); event.stopPropagation();

             // Manuel validering af besked hvis toggle er checked
             if (maintenanceToggle.checked && !maintenanceMessageInput.value.trim()) {
                 maintenanceMessageInput.classList.add('is-invalid');
                 showFeedback(maintenanceModeMsg.id, 'Besked er påkrævet når vedligehold er aktivt.', 'warning');
                 return;
             }
             maintenanceMessageInput.classList.remove('is-invalid'); // Ryd fejl hvis den er ok

             utils.toggleButtonLoading(applyMaintenanceBtn, true, "Anvender...");
             showFeedback(maintenanceModeMsg.id, '', 'info');
             const isEnabled = maintenanceToggle.checked; const message = maintenanceMessageInput.value.trim();
             try {
                 const payload = { maintenance_mode: isEnabled, notification_message: message };
                 // Korrekt brug af utils.postData
                 const data = await utils.postData("/admin/apply_maintenance", payload, 'POST');
                 showFeedback(maintenanceModeMsg.id, data.message || "Vedligehold opdateret.", "success");
                 utils.showToast(`Vedligehold ${isEnabled ? 'aktiveret' : 'deaktiveret'}.`, "success");
             } catch (error) {
                 console.error("Error applying maintenance:", error);
                 showFeedback(maintenanceModeMsg.id, `Fejl: ${error.message || 'Ukendt serverfejl.'}`, "danger");
                 utils.showToast("Fejl ved opdatering af vedligehold.", "danger");
             } finally {
                 utils.toggleButtonLoading(applyMaintenanceBtn, false);
             }
         });
         // Sæt initial state
         maintenanceMessageInput.disabled = !maintenanceToggle.checked;
         maintenanceMessageInput.required = maintenanceToggle.checked;
    }

    if (broadcastForm && broadcastMessageInput && sendBroadcastBtn && broadcastMsg) {
        broadcastForm.addEventListener('submit', async function(event) {
            event.preventDefault(); event.stopPropagation();
            const message = broadcastMessageInput.value.trim();
            if (!message) {
                broadcastMessageInput.classList.add('is-invalid');
                showFeedback(broadcastMsg.id, "Besked må ikke være tom.", "warning");
                return;
            }
            broadcastMessageInput.classList.remove('is-invalid');
            utils.toggleButtonLoading(sendBroadcastBtn, true, "Sender...");
            showFeedback(broadcastMsg.id, '', 'info');
            try {
                 // Call the actual backend endpoint
                 const data = await utils.postData("/admin/broadcast", { message: message });
                 showFeedback(broadcastMsg.id, data.message || "Broadcast sendt!", "success");
                 utils.showToast("Broadcast besked sendt.", "success");
                 broadcastMessageInput.value = ''; broadcastMessageInput.classList.remove('is-invalid');
             } catch (error) {
                 console.error("Error sending broadcast:", error);
                 showFeedback(broadcastMsg.id, `Fejl: ${error.message || 'Ukendt serverfejl.'}`, "danger");
                 utils.showToast("Kunne ikke sende broadcast.", "danger");
             } finally {
                 utils.toggleButtonLoading(sendBroadcastBtn, false);
             }
        });
    }

    // ===================================
    // 5) SYSTEM SETTINGS
    // ===================================
    const systemSettingFields = [
        settingApiKeyInput, settingMaxPlayersInput, settingMinBetInput,
        settingMaxBetInput, settingRegistrationEnabledSwitch,
        settingWelcomeMessageTextarea, settingSessionTimeoutInput
    ];

    async function loadAndPopulateSystemSettings() {
        if (!systemSettingsForm || !utils || typeof utils.getData !== 'function') {
            console.error("System settings form or utils.getData not available.");
            if (settingsFeedbackMsg) showFeedback(settingsFeedbackMsg.id, "Fejl: Kan ikke indlæse indstillingsformular.", "danger");
            return;
        }
        utils.toggleButtonLoading(saveSettingsBtn, true, "Indlæser...");
        if (settingsFeedbackMsg) showFeedback(settingsFeedbackMsg.id, "", "info"); // Clear previous
        systemSettingFields.forEach(field => { if (field) field.disabled = true; });

        try {
            const settings = await utils.getData("/admin/api/system_settings");

            if (settingApiKeyInput) settingApiKeyInput.value = settings.sports_api_key || "";
            if (settingMaxPlayersInput) settingMaxPlayersInput.value = settings.max_players_per_session || "";
            if (settingMinBetInput) settingMinBetInput.value = settings.min_bet_amount || "";
            if (settingMaxBetInput) settingMaxBetInput.value = settings.max_bet_amount || "";
            if (settingRegistrationEnabledSwitch) settingRegistrationEnabledSwitch.checked = settings.registration_enabled === true;
            if (settingWelcomeMessageTextarea) settingWelcomeMessageTextarea.value = settings.welcome_message_new_users || "";
            if (settingSessionTimeoutInput) settingSessionTimeoutInput.value = settings.session_timeout_minutes || "";

            // Enable fields and remove placeholder titles
            systemSettingFields.forEach(field => {
                if (field) {
                    field.disabled = false;
                    field.removeAttribute('title'); // Remove "Funktion ikke implementeret"
                }
            });
            if (saveSettingsBtn) {
                saveSettingsBtn.disabled = false;
                saveSettingsBtn.removeAttribute('title');
            }
            if (settingsPanePlaceholderAlert) {
                settingsPanePlaceholderAlert.style.display = 'none'; // Hide the placeholder alert
            }
            if (settingsFeedbackMsg) showFeedback(settingsFeedbackMsg.id, "Indstillinger indlæst.", "success");
            setTimeout(() => { if (settingsFeedbackMsg) showFeedback(settingsFeedbackMsg.id, "", "info"); }, 3000);


        } catch (error) {
            console.error("Error loading system settings:", error);
            if (settingsFeedbackMsg) showFeedback(settingsFeedbackMsg.id, `Fejl ved indlæsning af indstillinger: ${error.message || 'Ukendt serverfejl.'}`, "danger");
            // Keep fields disabled on error
        } finally {
            if (saveSettingsBtn) utils.toggleButtonLoading(saveSettingsBtn, false); // Stop loading on save button
        }
    }

    if (systemSettingsForm && saveSettingsBtn && settingsFeedbackMsg && utils) {
        systemSettingsForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            event.stopPropagation();

            utils.toggleButtonLoading(saveSettingsBtn, true, "Gemmer...");
            showFeedback(settingsFeedbackMsg.id, "", "info"); // Clear previous

            const payload = {
                sports_api_key: settingApiKeyInput?.value.trim() || "",
                max_players_per_session: settingMaxPlayersInput ? parseInt(settingMaxPlayersInput.value, 10) : null,
                min_bet_amount: settingMinBetInput ? parseFloat(settingMinBetInput.value) : null,
                max_bet_amount: settingMaxBetInput ? parseFloat(settingMaxBetInput.value) : null,
                registration_enabled: settingRegistrationEnabledSwitch ? settingRegistrationEnabledSwitch.checked : false,
                welcome_message_new_users: settingWelcomeMessageTextarea?.value.trim() || "",
                session_timeout_minutes: settingSessionTimeoutInput ? parseInt(settingSessionTimeoutInput.value, 10) : null
            };

            // Basic client-side validation (more comprehensive validation is on backend)
            let clientErrors = [];
            if (payload.max_players_per_session !== null && (isNaN(payload.max_players_per_session) || payload.max_players_per_session < 1)) {
                clientErrors.push("Max spillere skal være et tal større end 0.");
                settingMaxPlayersInput?.classList.add('is-invalid');
            } else { settingMaxPlayersInput?.classList.remove('is-invalid'); }

            if (payload.min_bet_amount !== null && (isNaN(payload.min_bet_amount) || payload.min_bet_amount <= 0)) {
                clientErrors.push("Min bet skal være et positivt tal.");
                settingMinBetInput?.classList.add('is-invalid');
            } else { settingMinBetInput?.classList.remove('is-invalid'); }

            if (payload.max_bet_amount !== null && (isNaN(payload.max_bet_amount) || payload.max_bet_amount <= 0)) {
                clientErrors.push("Max bet skal være et positivt tal.");
                settingMaxBetInput?.classList.add('is-invalid');
            } else { settingMaxBetInput?.classList.remove('is-invalid'); }

            if (payload.max_bet_amount !== null && payload.min_bet_amount !== null && payload.max_bet_amount < payload.min_bet_amount) {
                clientErrors.push("Max bet kan ikke være mindre end min bet.");
                settingMaxBetInput?.classList.add('is-invalid');
            }


            if (payload.session_timeout_minutes !== null && (isNaN(payload.session_timeout_minutes) || payload.session_timeout_minutes < 1)) {
                clientErrors.push("Session timeout skal være et tal større end 0 minutter.");
                settingSessionTimeoutInput?.classList.add('is-invalid');
            } else { settingSessionTimeoutInput?.classList.remove('is-invalid'); }

            if (clientErrors.length > 0) {
                showFeedback(settingsFeedbackMsg.id, `Valideringsfejl: ${clientErrors.join(' ')}`, "warning");
                utils.toggleButtonLoading(saveSettingsBtn, false);
                return;
            }
            systemSettingsForm.classList.remove('was-validated');


            try {
                const result = await utils.postData("/admin/api/system_settings", payload, 'POST');
                showFeedback(settingsFeedbackMsg.id, result.message || "Indstillinger gemt!", "success");
                utils.showToast("Systemindstillinger er blevet opdateret.", "success");
                // Optionally, re-populate form with potentially cleaned/validated data from server
                if (result.settings) {
                    if (settingApiKeyInput) settingApiKeyInput.value = result.settings.sports_api_key || "";
                    if (settingMaxPlayersInput) settingMaxPlayersInput.value = result.settings.max_players_per_session || "";
                    if (settingMinBetInput) settingMinBetInput.value = result.settings.min_bet_amount || "";
                    if (settingMaxBetInput) settingMaxBetInput.value = result.settings.max_bet_amount || "";
                    if (settingRegistrationEnabledSwitch) settingRegistrationEnabledSwitch.checked = result.settings.registration_enabled === true;
                    if (settingWelcomeMessageTextarea) settingWelcomeMessageTextarea.value = result.settings.welcome_message_new_users || "";
                    if (settingSessionTimeoutInput) settingSessionTimeoutInput.value = result.settings.session_timeout_minutes || "";
                }

            } catch (error) {
                console.error("Error saving system settings:", error);
                let errorMessage = error.message || 'Ukendt serverfejl.';
                if (error.responseJson && error.responseJson.details && typeof error.responseJson.details === 'object') {
                    let detailMessages = [];
                    Object.entries(error.responseJson.details).forEach(([key, msg]) => {
                        detailMessages.push(`${key}: ${msg}`);
                        // Try to find corresponding input and mark as invalid
                        const inputIdMap = { // Map backend keys to form input IDs if different
                            'sports_api_key': 'setting_api_key',
                            'max_players_per_session': 'setting_max_players',
                            'min_bet_amount': 'setting_min_bet',
                            'max_bet_amount': 'setting_max_bet',
                            'registration_enabled': 'setting_registration_enabled',
                            'welcome_message_new_users': 'setting_welcome_message',
                            'session_timeout_minutes': 'setting_session_timeout'
                        };
                        const inputElement = document.getElementById(inputIdMap[key] || `setting_${key}`);
                        if (inputElement) inputElement.classList.add('is-invalid');
                    });
                    errorMessage = `Valideringsfejl: ${detailMessages.join('; ')}`;
                    systemSettingsForm.classList.add('was-validated');
                }
                showFeedback(settingsFeedbackMsg.id, `Fejl ved lagring: ${errorMessage}`, "danger");
                utils.showToast("Kunne ikke gemme systemindstillinger.", "danger");
            } finally {
                utils.toggleButtonLoading(saveSettingsBtn, false);
            }
        });
    }

    if (settingsTabButton && utils) {
        settingsTabButton.addEventListener('shown.bs.tab', function (event) {
            console.log("System Settings tab shown, loading settings...");
            loadAndPopulateSystemSettings();
        });
        // If the settings tab might be active on page load, trigger initial load
        if (settingsTabButton.classList.contains('active')) {
            loadAndPopulateSystemSettings();
        }
    }

    // ===================================
    // 6) AUDIT LOGS
    // ===================================
    async function fetchAndDisplayAuditLogs() {
        if (!logsTableBody || !refreshLogsBtn || !logsFeedbackMsg || !logFilterInput || !logCountDisplay || !utils) {
            console.error("Audit log elements or utils not found.");
            return;
        }
        utils.toggleButtonLoading(refreshLogsBtn, true, "Opdaterer...");
        utils.showTableLoading(logsTableBody, true, 5, 'Henter audit logs...'); // 5 columns
        showFeedback(logsFeedbackMsg.id, '', 'info');
        logCountDisplay.textContent = ''; // Clear count

        try {
            const data = await utils.getData("/admin/api/audit_logs?limit=200"); // Fetch last 200 logs
            const logs = data.logs || [];

            logsTableBody.innerHTML = ''; // Clear previous content including placeholder

            if (logs.length === 0) {
                utils.showTableLoading(logsTableBody, false, 5, 'Ingen audit log entries fundet.');
            } else {
                logs.forEach(logEntry => {
                    const tr = logsTableBody.insertRow();
                    const formattedTimestamp = utils.formatDateTime(logEntry.timestamp, { dateStyle: 'medium', timeStyle: 'medium' });
                    let detailsStr = '-';
                    if (logEntry.details && Object.keys(logEntry.details).length > 0) {
                        // Simple JSON string representation for details
                        try {
                            detailsStr = JSON.stringify(logEntry.details);
                            // Optional: Make it prettier or truncate if too long
                            if (detailsStr.length > 150) {
                                detailsStr = detailsStr.substring(0, 147) + '...';
                            }
                        } catch { detailsStr = '[Ugyldige detaljer]'; }
                    }

                    tr.innerHTML = `
                        <td class="align-middle"><small>${formattedTimestamp || 'Ukendt tid'}</small></td>
                        <td class="align-middle font-monospace">${logEntry.action || 'Ukendt'}</td>
                        <td class="align-middle">${logEntry.admin_user || 'Ukendt'}</td>
                        <td class="align-middle">${logEntry.target_resource || '-'}</td>
                        <td class="align-middle small text-muted" title="${JSON.stringify(logEntry.details)}">
                            <pre class="m-0 p-0 bg-transparent border-0" style="white-space: pre-wrap; word-break: break-all;">${detailsStr}</pre>
                        </td>
                    `;
                });
                utils.showTableLoading(logsTableBody, false, 5); // Hide loading row
                logCountDisplay.textContent = `${logs.length} entries vist.`;
            }

            // Enable controls now that it's functional
            refreshLogsBtn.disabled = false;
            refreshLogsBtn.removeAttribute('title');
            logFilterInput.disabled = false; // Filter logic still needs implementation
            logFilterInput.removeAttribute('title');
            if (logsTablePlaceholderRow) logsTablePlaceholderRow.style.display = 'none'; // Ensure placeholder is hidden


        } catch (error) {
            console.error("Error fetching audit logs:", error);
            const errorMessage = error.message || 'Ukendt fejl ved hentning af audit logs.';
            showFeedback(logsFeedbackMsg.id, errorMessage, "danger");
            utils.showTableLoading(logsTableBody, false, 5, `Fejl: ${errorMessage.substring(0, 100)}`);
            logCountDisplay.textContent = 'Fejl ved indlæsning.';
            // Keep controls disabled on error? Or enable refresh? Enable refresh.
            refreshLogsBtn.disabled = false;
            refreshLogsBtn.removeAttribute('title');
            logFilterInput.disabled = true; // Keep filter disabled on error
        } finally {
            utils.toggleButtonLoading(refreshLogsBtn, false);
        }
    }

    if (logsTabButton && utils) {
        logsTabButton.addEventListener('shown.bs.tab', function (event) {
            console.log("Audit Logs tab shown, loading logs...");
            fetchAndDisplayAuditLogs();
        });
        // If the logs tab might be active on page load, trigger initial load
        if (logsTabButton.classList.contains('active')) {
            fetchAndDisplayAuditLogs();
        }
    }

    if (refreshLogsBtn && utils) {
        refreshLogsBtn.addEventListener('click', fetchAndDisplayAuditLogs);
    }


    // ===================================
    // 7) SCHEDULED TASKS (APScheduler Jobs)
    // ===================================
    async function fetchAndDisplayScheduledTasks() {
        if (!scheduledTasksTableBody || !refreshTasksBtn || !tasksTableFeedback || !tasksCountDisplay || !utils) {
            console.error("Scheduled tasks elements or utils not found.");
            return;
        }
        utils.toggleButtonLoading(refreshTasksBtn, true, "Opdaterer...");
        // Colspan should match the number of columns in the tasks table (6)
        utils.showTableLoading(scheduledTasksTableBody, true, 6, 'Henter planlagte tasks...');
        showFeedback(tasksTableFeedback.id, '', 'info'); // Clear footer feedback
        tasksCountDisplay.textContent = ''; // Clear count

        try {
            const data = await utils.getData("/admin/api/scheduled_tasks");
            const tasks = data.tasks || [];

            scheduledTasksTableBody.innerHTML = ''; // Clear previous content

            if (tasks.length === 0) {
                utils.showTableLoading(scheduledTasksTableBody, false, 6, 'Ingen planlagte tasks fundet.');
                tasksCountDisplay.textContent = '0 tasks fundet.';
            } else {
                tasks.forEach(task => {
                    const tr = scheduledTasksTableBody.insertRow();
                    const nextRun = task.next_run_time ? utils.formatDateTime(task.next_run_time, { dateStyle: 'medium', timeStyle: 'medium' }) : 'N/A';
                    const pendingBadge = task.pending ? '<span class="badge bg-warning-subtle text-warning-emphasis">Ja</span>' : '<span class="badge bg-secondary-subtle text-secondary-emphasis">Nej</span>';
                    // Add actions later if needed (e.g., pause, resume, run now)
                    // const actionsHtml = `<button class="btn btn-sm btn-outline-secondary" disabled title="Handlinger ikke implementeret"><i class="bi bi-gear"></i></button>`;

                    tr.innerHTML = `
                        <td class="align-middle font-monospace">${task.id || 'N/A'}</td>
                        <td class="align-middle">${task.name || 'N/A'}</td>
                        <td class="align-middle small">${task.func_ref || 'N/A'}</td>
                        <td class="align-middle">${task.trigger || 'N/A'}</td>
                        <td class="align-middle">${nextRun}</td>
                        <td class="align-middle text-center">${pendingBadge}</td>
                        {# <td class="align-middle text-center">${actionsHtml}</td> #}
                    `;
                });
                utils.showTableLoading(scheduledTasksTableBody, false, 6); // Hide loading row
                tasksCountDisplay.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'} fundet.`;
                // Initialize tooltips if actions with tooltips are added later
                // utils.initializeTooltips(scheduledTasksTableBody);
            }
             // Enable refresh button now that it's functional
             refreshTasksBtn.disabled = false;
             refreshTasksBtn.removeAttribute('title'); // Remove placeholder title if any

        } catch (error) {
            console.error("Error fetching scheduled tasks:", error);
            const errorMessage = error.message || 'Ukendt fejl ved hentning af tasks.';
            showFeedback(tasksTableFeedback.id, errorMessage, "danger");
            utils.showTableLoading(scheduledTasksTableBody, false, 6, `Fejl: ${errorMessage.substring(0, 100)}`);
            tasksCountDisplay.textContent = 'Fejl ved indlæsning.';
            // Enable refresh button even on error
            refreshTasksBtn.disabled = false;
            refreshTasksBtn.removeAttribute('title');
        } finally {
            utils.toggleButtonLoading(refreshTasksBtn, false);
        }
    }

    if (tasksTabButton && utils) {
        tasksTabButton.addEventListener('shown.bs.tab', function (event) {
            console.log("Scheduled Tasks tab shown, loading tasks...");
            fetchAndDisplayScheduledTasks();
        });
        // If the tasks tab might be active on page load, trigger initial load
        if (tasksTabButton.classList.contains('active')) {
            fetchAndDisplayScheduledTasks();
        }
    }

    if (refreshTasksBtn && utils) {
        refreshTasksBtn.addEventListener('click', fetchAndDisplayScheduledTasks);
    }


    // ===================================
    // Initialisering
// ===================================
    // 8) SECURITY TAB (Failed Logins)
    // ===================================
    const securityTabButton = document.getElementById('security-tab');
    const failedLoginsTableBody = document.getElementById('failedLoginsTableBody');
    const refreshFailedLoginsBtn = document.getElementById('refresh_failed_logins_btn');
    const failedLoginsTableFeedback = document.getElementById('failed_logins_table_msg');
    const failedLoginsCountDisplay = document.getElementById('failed_logins_count_display');

    async function fetchAndDisplayFailedLogins() {
        if (!failedLoginsTableBody || !refreshFailedLoginsBtn || !failedLoginsTableFeedback || !failedLoginsCountDisplay || !utils) {
            console.error("Failed logins elements or utils not found.");
            return;
        }
        utils.toggleButtonLoading(refreshFailedLoginsBtn, true, "Opdaterer...");
        utils.showTableLoading(failedLoginsTableBody, true, 4, 'Henter login forsøg...'); // 4 columns
        showFeedback(failedLoginsTableFeedback.id, '', 'info');
        failedLoginsCountDisplay.textContent = '';

        try {
            const data = await utils.getData("/admin/api/failed_logins?limit=100"); // Fetch last 100
            const attempts = data.failed_logins || [];

            failedLoginsTableBody.innerHTML = ''; // Clear previous content

            if (attempts.length === 0) {
                utils.showTableLoading(failedLoginsTableBody, false, 4, 'Ingen mislykkede login forsøg fundet.');
                failedLoginsCountDisplay.textContent = '0 entries fundet.';
            } else {
                attempts.forEach(attempt => {
                    const tr = failedLoginsTableBody.insertRow();
                    const formattedTimestamp = utils.formatDateTime(attempt.timestamp, { dateStyle: 'medium', timeStyle: 'medium' });
                    const userAgentShort = attempt.user_agent ? attempt.user_agent.substring(0, 80) + (attempt.user_agent.length > 80 ? '...' : '') : '-';

                    tr.innerHTML = `
                        <td class="align-middle"><small>${formattedTimestamp || 'Ukendt tid'}</small></td>
                        <td class="align-middle font-monospace">${attempt.ip_address || '-'}</td>
                        <td class="align-middle">${attempt.username_attempt || '-'}</td>
                        <td class="align-middle text-muted" title="${utils.escapeHtml(attempt.user_agent || '')}">${userAgentShort}</td>
                    `;
                });
                utils.showTableLoading(failedLoginsTableBody, false, 4); // Hide loading row
                failedLoginsCountDisplay.textContent = `${attempts.length} entries vist.`;
            }
             // Enable refresh button
             refreshFailedLoginsBtn.disabled = false;

        } catch (error) {
            console.error("Error fetching failed logins:", error);
            const errorMessage = error.message || 'Ukendt fejl ved hentning af login forsøg.';
            showFeedback(failedLoginsTableFeedback.id, errorMessage, "danger");
            utils.showTableLoading(failedLoginsTableBody, false, 4, `Fejl: ${errorMessage.substring(0, 100)}`);
            failedLoginsCountDisplay.textContent = 'Fejl ved indlæsning.';
             // Enable refresh button even on error
             refreshFailedLoginsBtn.disabled = false;
        } finally {
            utils.toggleButtonLoading(refreshFailedLoginsBtn, false);
        }
    }

    if (securityTabButton && utils) {
        securityTabButton.addEventListener('shown.bs.tab', function (event) {
            console.log("Security tab shown, loading failed logins...");
            fetchAndDisplayFailedLogins();
        });
        // If the security tab might be active on page load, trigger initial load
        if (securityTabButton.classList.contains('active')) {
            fetchAndDisplayFailedLogins();
        }
    }

    if (refreshFailedLoginsBtn && utils) {
        refreshFailedLoginsBtn.addEventListener('click', fetchAndDisplayFailedLogins);
    }

    // ===================================
    // 10) PASSWORD RESET REQUESTS
    // ===================================
    async function fetchAndDisplayPasswordResetRequests() {
        if (!passwordRequestsTableBody || !refreshPasswordRequestsBtn || !passwordRequestsTableFeedback || !passwordRequestsCountDisplay || !utils) {
            console.error("Password reset request elements or utils not found.");
            if (passwordRequestsTableFeedback) showFeedback(passwordRequestsTableFeedback.id, "UI Fejl: Nødvendige elementer for password reset mangler.", "danger");
            return;
        }
        utils.toggleButtonLoading(refreshPasswordRequestsBtn, true, "Opdaterer...");
        utils.showTableLoading(passwordRequestsTableBody, true, 6, 'Henter password reset anmodninger...'); // 6 columns
        showFeedback(passwordRequestsTableFeedback.id, '', 'info');
        passwordRequestsCountDisplay.textContent = '';

        try {
            const data = await utils.getData("/admin/api/password_reset_requests");
            passwordResetRequestsCache = data.requests || []; // Store fetched data in cache
            passwordRequestsTableBody.requestsData = passwordResetRequestsCache; // Attach to tbody for handler access

            passwordRequestsTableBody.innerHTML = ''; // Clear previous content

            if (passwordResetRequestsCache.length === 0) {
                utils.showTableLoading(passwordRequestsTableBody, false, 6, 'Ingen afventende password reset anmodninger fundet.');
                passwordRequestsCountDisplay.textContent = '0 anmodninger fundet.';
            } else {
                passwordResetRequestsCache.forEach(req => {
                    const tr = passwordRequestsTableBody.insertRow();
                    tr.dataset.requestId = req.request_id; // Use request_id from data
                    const formattedTimestamp = utils.formatDateTime(req.requested_at, { dateStyle: 'medium', timeStyle: 'short' });

                    // Determine status text and badge based on completion and local generation flag
                    let statusText = "Afventer Handling";
                    let statusBadgeClass = "bg-warning-subtle text-warning-emphasis";
                    let statusIcon = "bi-hourglass-split"; // Default icon

                    if (req.is_completed) {
                        statusText = "Fuldført";
                        statusBadgeClass = "bg-success-subtle text-success-emphasis";
                        statusIcon = "bi-check-circle-fill";
                    } else if (req.link_generated_locally) { // Check our local flag (set after successful link generation)
                        statusText = "Afventer Bruger";
                        statusBadgeClass = "bg-info-subtle text-info-emphasis";
                        statusIcon = "bi-person-check";
                    }
                    const statusBadge = `<span class="badge ${statusBadgeClass}"><i class="bi ${statusIcon} me-1"></i>${statusText}</span>`;

                    // Placeholder for token display - might be sensitive
                    const tokenDisplay = req.token ? `${req.token.substring(0, 8)}...` : 'N/A';

                    tr.innerHTML = `
                        <td class="align-middle small font-monospace">${req.request_id}</td>
                        <td class="align-middle">${utils.escapeHtml(req.user_id)}</td>
                        <td class="align-middle">${utils.escapeHtml(utils.capitalizeFirstLetter(req.username))}</td> {# Capitalized #}
                        <td class="align-middle small">${formattedTimestamp}</td>
                        <td class="align-middle text-center status-cell">${statusBadge}</td>
                        <td class="text-center align-middle text-nowrap">
                            <button class="btn btn-sm btn-outline-primary generate-reset-link-btn me-1" data-request-id="${req.request_id}" data-user-id="${utils.escapeHtml(req.username)}" data-bs-toggle="tooltip" title="Generer Nyt Reset Link" ${req.is_completed || req.link_generated_locally ? 'disabled' : ''}><i class="bi bi-link-45deg"></i> Link</button>
                            <button class="btn btn-sm btn-outline-danger reject-reset-request-btn" data-request-id="${req.request_id}" data-bs-toggle="tooltip" title="Afvis Anmodning (ikke implementeret)" ${req.is_completed ? 'disabled' : ''}><i class="bi bi-x-circle"></i> Afvis</button>
                        </td>
                    `;
                });
                console.log("[Admin][PasswordReset] Generated table body HTML:", passwordRequestsTableBody.innerHTML); // <-- ADDED LOG
                utils.showTableLoading(passwordRequestsTableBody, false, 6);
                passwordRequestsCountDisplay.textContent = `${passwordResetRequestsCache.length} anmodning${passwordResetRequestsCache.length === 1 ? '' : 'er'} vist.`;

                // --- ADD EVENT LISTENER HERE (AFTER content is added) ---
                if (passwordRequestsTableBody && !passwordRequestsTableBody.dataset.listenerAttached) {
                    console.log("[Admin][PasswordReset] Attaching click listener to passwordRequestsTableBody."); // <-- ADDED LOG
                    passwordRequestsTableBody.addEventListener('click', handlePasswordResetTableClick);
                    passwordRequestsTableBody.dataset.listenerAttached = 'true'; // Mark as attached
                }
                // ---------------------------------------------------------

utils.initializeTooltips(passwordRequestsTableBody); // Initialize tooltips AFTER attaching listener
            }
            refreshPasswordRequestsBtn.disabled = false;
        } catch (error) {
            console.error("Error fetching password reset requests:", error);
            const errorMessage = error.message || 'Ukendt fejl ved hentning af password reset anmodninger.';
            showFeedback(passwordRequestsTableFeedback.id, errorMessage, "danger");
            utils.showTableLoading(passwordRequestsTableBody, false, 6, `Fejl: ${errorMessage.substring(0, 100)}`);
            passwordRequestsCountDisplay.textContent = 'Fejl ved indlæsning.';
            refreshPasswordRequestsBtn.disabled = false;
        } finally {
            utils.toggleButtonLoading(refreshPasswordRequestsBtn, false);
        }
    }

    if (passwordResetsTabButton && utils) {
        console.log("[Admin][PasswordReset] Setting up 'shown.bs.tab' listener for passwordResetsTabButton.");
        passwordResetsTabButton.addEventListener('shown.bs.tab', async function (event) {
            console.log("Password Resets tab shown, loading requests...");
            await fetchAndDisplayPasswordResetRequests(); // Wait for content to load

            // --- Explicitly manage active/show classes ---
            const targetPaneSelector = passwordResetsTabButton.dataset.bsTarget;
            if (targetPaneSelector) {
                const targetPane = document.querySelector(targetPaneSelector);
                if (targetPane) {
                    // Deactivate all other tab panes in the same container
                    const tabContentContainer = targetPane.parentElement;
                    if (tabContentContainer) {
                        tabContentContainer.querySelectorAll('.tab-pane').forEach(pane => {
                            pane.classList.remove('active', 'show');
                        });
                    }
                    // Activate the target pane
                    targetPane.classList.add('active', 'show');
                    console.log(`[Admin][PasswordReset] Explicitly set ${targetPaneSelector} to active and show.`);
                } else {
                    console.error(`[Admin][PasswordReset] Target pane ${targetPaneSelector} not found for explicit activation.`);
                }
            }
            // ---------------------------------------------
        });
        if (passwordResetsTabButton.classList.contains('active')) {
            fetchAndDisplayPasswordResetRequests();
        }
    }

    if (refreshPasswordRequestsBtn && utils) {
        refreshPasswordRequestsBtn.addEventListener('click', fetchAndDisplayPasswordResetRequests);
    }

    // --- Moved Event Listener Logic into its own function ---
    async function handlePasswordResetTableClick(e) {
        const generateBtn = e.target.closest('.generate-reset-link-btn');
        const rejectBtn = e.target.closest('.reject-reset-request-btn'); // Changed from completeBtn

        if (generateBtn && !generateBtn.disabled) {
            e.stopPropagation();
            const requestId = generateBtn.dataset.requestId;
            console.log(`[Admin][PasswordReset] Generate button clicked for request ID: ${requestId}`); // <-- ADDED LOG
            if (!requestId) {
                console.error("[Admin][PasswordReset] Request ID is missing from button data!"); // <-- ADDED LOG
                utils.showToast("Fejl: Kunne ikke finde anmodnings-ID.", "danger");
                return;
            }
            // const userId = generateBtn.dataset.userId; // userId is available if needed for logs, but API uses requestId

            utils.toggleButtonLoading(generateBtn, true, "Genererer...");
            showFeedback(passwordRequestsTableFeedback.id, '', 'info'); // Clear main feedback
            console.log(`[Admin][PasswordReset] Attempting to generate link for request ID: ${requestId}...`); // <-- ADDED LOG

            try {
               console.log("[Admin][PasswordReset] Prompting for expiry hours..."); // <-- ADDED LOG
               const expiryHoursInput = prompt("Indtast linkets gyldighed i timer (f.eks. 1, 2, 24). Standard er 1 time.", "1");
               console.log(`[Admin][PasswordReset] Expiry hours input: ${expiryHoursInput}`); // <-- ADDED LOG
               let payload = {};
               if (expiryHoursInput !== null) { // User didn't cancel prompt
                   const expiryHours = parseInt(expiryHoursInput, 10);
                   if (!isNaN(expiryHours) && expiryHours > 0 && expiryHours <= 72) { // Basic validation
                       payload.expires_in_hours = expiryHours;
                   } else if (expiryHoursInput.trim() !== "") { // If user entered something invalid but didn't cancel
                       utils.showToast(`Ugyldig værdi for timer ('${expiryHoursInput}'). Bruger standard.`, 'warning');
                   }
               }

               console.log(`[Admin][PasswordReset] Sending POST request to /admin/api/password_reset_requests/${requestId}/generate_link with payload:`, payload); // <-- ADDED LOG
               const result = await utils.postData(`/admin/api/password_reset_requests/${requestId}/generate_link`, payload);
               console.log("[Admin][PasswordReset] API call successful. Response:", result); // <-- ADDED LOG

               if (!result || !result.reset_link) { // <-- ADDED CHECK
                   console.error("[Admin][PasswordReset] API success, but 'reset_link' missing in response:", result);
                   throw new Error("Server returnerede ikke et gyldigt reset link.");
               }

               utils.showToast(result.message || 'Nyt reset link genereret!', 'success');

                // Display the link in an alert box for easy copying
                console.log("[Admin][PasswordReset] Showing alert with link..."); // <-- ADDED LOG
                alert(`Password Reset Link:\n\n${result.reset_link}\n\nKopier venligst dette link.`);
                console.log("[Admin][PasswordReset] Alert shown. Generated Reset Link:", result.reset_link); // Keep console log
                utils.showToast(`Link genereret og vist i popup.`, 'success', 5000); // Update toast message

                // Update UI after successful link generation
                const row = generateBtn.closest('tr');
                if (row) {
                    const statusCell = row.querySelector('.status-cell');
                    if (statusCell) {
                        // Update status badge to "Afventer Bruger"
                        statusCell.innerHTML = `<span class="badge bg-info-subtle text-info-emphasis"><i class="bi bi-person-check me-1"></i>Afventer Bruger</span>`;
                    }
                    // Visually change the button to indicate action taken
                    generateBtn.classList.remove('btn-outline-primary');
                    generateBtn.classList.add('btn-primary'); // Make it solid primary
                    generateBtn.disabled = true; // Disable after use
                    generateBtn.innerHTML = '<i class="bi bi-check-lg"></i> Link Sendt';
                    generateBtn.setAttribute('title', 'Link er blevet genereret.');

                    // Mark the request as having a link generated locally in our JS data
                    // This helps keep the UI consistent until the next full refresh
                    const requests = passwordRequestsTableBody.requestsData || []; // Assuming data is stored on tbody
                    const requestData = requests.find(r => r.request_id === requestId);
                     if(requestData) {
                         requestData.link_generated_locally = true;
                         console.debug(`Marked request ${requestId} as link_generated_locally=true`);
                     } else {
                         console.warn(`Could not find request data for ${requestId} to mark link_generated_locally.`);
                     }

                    utils.initializeTooltips(generateBtn.closest('td')); // Re-init tooltip for the updated button
                }
               // Consider a full refresh if status/expiry changes are important to show immediately
               // await fetchAndDisplayPasswordResetRequests();

            } catch (err) {
                console.error(`[Admin][PasswordReset] Error generating reset link for request ${requestId}:`, err); // <-- UPDATED LOG
                const errorMsg = err.message || 'Ukendt serverfejl ved generering af link.';
                showFeedback(passwordRequestsTableFeedback.id, errorMsg, 'danger');
                utils.showToast(`Fejl: ${errorMsg}`, 'danger');
            } finally {
                console.log(`[Admin][PasswordReset] Finally block reached for request ${requestId}.`); // <-- ADDED LOG
                // Ensure button loading state is removed ONLY if it exists and wasn't disabled by success handler
                if (document.body.contains(generateBtn) && !generateBtn.disabled) {
                     utils.toggleButtonLoading(generateBtn, false);
                     console.log(`[Admin][PasswordReset] Loading state removed from button.`); // <-- ADDED LOG
                } else if (document.body.contains(generateBtn) && generateBtn.disabled) {
                     console.log(`[Admin][PasswordReset] Button already disabled (likely by success handler), not toggling loading state.`); // <-- ADDED LOG
                }
            }

        } else if (rejectBtn && !rejectBtn.disabled) { // Changed from completeBtn to rejectBtn
            e.stopPropagation();
            const requestId = rejectBtn.dataset.requestId;
            if (confirm(`Er du sikker på, du vil afvise password reset anmodning #${requestId}? Denne handling kan ikke fortrydes.`)) {
                 utils.toggleButtonLoading(rejectBtn, true, "Afviser...");
                 showFeedback(passwordRequestsTableFeedback.id, '', 'info');
                 try {
                     const result = await utils.deleteData(`/admin/api/password_reset_requests/${requestId}`);
                     utils.showToast(result.message || `Anmodning #${requestId} afvist.`, 'success');

                     // Update UI: Remove row or mark as rejected visually
                     const row = rejectBtn.closest('tr');
                     if (row) {
                         row.classList.add('table-danger', 'text-decoration-line-through', 'opacity-50');
                         row.querySelectorAll('button').forEach(btn => btn.disabled = true);
                         const statusCell = row.querySelector('.status-cell');
                         if(statusCell) statusCell.innerHTML = `<span class="badge bg-danger-subtle text-danger-emphasis"><i class="bi bi-x-octagon-fill me-1"></i>Afvist</span>`;
                         utils.initializeTooltips(row); // Re-init tooltips for the row
                     }
                     // Or, for a full refresh:
                     // await fetchAndDisplayPasswordResetRequests();
                 } catch (err) {
                     console.error(`Error rejecting password reset request ${requestId}:`, err);
                     const errorMsg = err.message || 'Ukendt serverfejl ved afvisning.';
                     showFeedback(passwordRequestsTableFeedback.id, errorMsg, 'danger');
                     utils.showToast(`Fejl: ${errorMsg}`, 'danger');
                 } finally {
                     // Ensure loading state is removed even if row manipulation failed
                     if (document.body.contains(rejectBtn)) {
                        utils.toggleButtonLoading(rejectBtn, false);
                     }
                 }
            }
        }
    }
    // ---------------------------------------------------------

    // ===================================
    async function initialLoad() {
        // Tjek om utils eksisterer FØR load fortsætter (allerede gjort, men dobbeltcheck)
        if (essentialUtilsMissing) {
             console.warn("Skipping initial data load due to missing utils functions.");
             return;
         }
        console.log("Admin Panel: Initialising data loads...");
        try {
            // Kald brugerdata først, da andre sektioner kan afhænge af brugerlisten (f.eks. dropdowns)
            await fetchUsersTableData();

            // Kald derefter de andre sektioner parallelt
            const results = await Promise.allSettled([
                fetchSessionsTableData(),
                fetchInvitesTableData(),
                // Potentially add fetchAndDisplayPasswordResetRequests() here if it should load initially
                // without waiting for tab click, but usually it's better to load on tab activation.
            ]);

            console.debug("Parallel initial load results:", results);
            results.forEach((result, index) => {
                if(result.status === 'rejected') {
                    const sectionName = ['Sessions', 'Invites', /* 'PasswordResets' */][index] || `Section ${index + 1}`;
                    console.error(`Initial load for ${sectionName} failed:`, result.reason);
                    // Vis evt. en generel fejl, hvis en sektion fejler ved load
                    utils.showToast(`Kunne ikke indlæse data for ${sectionName}. Prøv at genopfriske.`, "warning");
                }
            });

            // Initialiser tooltips for hele siden efter alt indhold er (forsøgt) loaded
            // *** OPDATERET: Brug utils.initializeTooltips ***
            utils.initializeTooltips();
            console.log("Global tooltips initialized via utils.initializeTooltips().");

        } catch (error) {
             // Denne catch fanger primært fejl fra den FØRSTE await (fetchUsersTableData)
             console.error("CRITICAL ERROR during initial user data load:", error);
             utils.showToast("Kritisk fejl: Kunne ikke indlæse essentielle brugerdata.", "danger");
             // Vis fejl på siden også
             if(usersTableFeedback) showFeedback(usersTableFeedback.id, `Kritisk fejl ved indlæsning af brugere: ${error.message}`, "danger");
        } finally {
            console.log("Admin Panel: Initialisation sequence complete.");
            // Skjul evt. en global loading spinner her, hvis der var en
        }
    }

    initialLoad(); // Kør initial load



// --- Gamle kommentarer/placeholders ---
// Ingen behov for at gentage globale helpers her, de er defineret og tjekket øverst.
// Strukturen for nye admin funktioner er demonstreret i de eksisterende (f.eks. Clear Cache, Maintenance).



// Add event listeners for other buttons (Save Settings, Clear Cache etc.) following a similar pattern:
// 1. Get button element by ID
// 2. Add 'click' event listener
// 3. Prevent default action if it's inside a form
// 4. Show loading state (toggleButtonLoading)
// 5. Clear old feedback (showFeedback)
// 6. Get data from relevant input fields
// 7. Perform validation if necessary
// 8. Make async API call (fetch) inside try...catch...finally
// 9. Handle success: Show success feedback, maybe clear form/update UI
// 10. Handle error: Show error feedback
// 11. In finally: Hide loading state


// Load initial essential data if needed (e.g., System Settings values)
// loadSystemSettings(); // function to fetch settings and populate form fields


// =========================================================================
// GLOBALE HJÆLPERE FRA utils.js (FORVENTES AT VÆRE DEFINERET)
// Funktioner som forventes globale:
// - showToast(message, type)
// - toggleButtonLoading(buttonElement, isLoading, loadingText)
// - showTableLoading(tbodyElement, isLoading, colSpan, loadingText)
// - getCsrfToken()
// - postData(url, payload)


// =========================================================================
// 4...N) ANDRE ADMIN FUNKTIONER (Clear Cache, System Settings, etc.)
// =========================================================================
// Følg samme mønster:
// 1. Hent element referencer (knapper, forms, feedback divs).
// 2. Tilføj event listeners ('click', 'submit').
// 3. I handler:
//    - Brug evt. preventDefault() for forms.
//    - Valider input om nødvendigt.
//    - Brug toggleButtonLoading(), ryd feedback div.
//    - Kald relevant API endpoint (fetch, postData). Husk CSRF for POST/DELETE/PUT.
//    - Håndter success (vis feedback/toast, opdater UI, reset form).
//    - Håndter error (vis feedback/toast).
//    - Brug finally til at fjerne loading state.

// --- Password Complexity Settings ---
    const passwordComplexityForm = document.getElementById('passwordComplexityForm');
    const savePasswordComplexityBtn = document.getElementById('save_password_complexity_btn');
    const passwordComplexityMsg = document.getElementById('password_complexity_msg');
    const pwMinLengthInput = document.getElementById('setting_password_min_length');
    const pwRequireUpperInput = document.getElementById('setting_password_require_uppercase');
    const pwRequireLowerInput = document.getElementById('setting_password_require_lowercase');
    const pwRequireNumberInput = document.getElementById('setting_password_require_number');
    const pwRequireSymbolInput = document.getElementById('setting_password_require_symbol');
    const passwordComplexityFields = [pwMinLengthInput, pwRequireUpperInput, pwRequireLowerInput, pwRequireNumberInput, pwRequireSymbolInput];

    async function loadPasswordComplexitySettings() {
        if (!passwordComplexityForm || !utils || typeof utils.getData !== 'function') {
            console.error("Password complexity form or utils.getData not available.");
            if (passwordComplexityMsg) showFeedback(passwordComplexityMsg.id, "Fejl: Kan ikke indlæse password regler.", "danger");
            return;
        }
        // Use the save button for loading state indication
        if (savePasswordComplexityBtn) utils.toggleButtonLoading(savePasswordComplexityBtn, true, "Indlæser...");
        if (passwordComplexityMsg) showFeedback(passwordComplexityMsg.id, "", "info");
        passwordComplexityFields.forEach(field => { if (field) field.disabled = true; });

        try {
            // Fetch ALL system settings, as complexity rules are part of it
            const settings = await utils.getData("/admin/api/system_settings");

            if (pwMinLengthInput) pwMinLengthInput.value = settings.password_min_length ?? 8; // Use default from data_access if missing
            if (pwRequireUpperInput) pwRequireUpperInput.checked = settings.password_require_uppercase === true;
            if (pwRequireLowerInput) pwRequireLowerInput.checked = settings.password_require_lowercase === true;
            if (pwRequireNumberInput) pwRequireNumberInput.checked = settings.password_require_number === true;
            if (pwRequireSymbolInput) pwRequireSymbolInput.checked = settings.password_require_symbol === true;

            passwordComplexityFields.forEach(field => { if (field) field.disabled = false; });
            if (savePasswordComplexityBtn) savePasswordComplexityBtn.disabled = false;

        } catch (error) {
            console.error("Error loading password complexity settings:", error);
            if (passwordComplexityMsg) showFeedback(passwordComplexityMsg.id, `Fejl ved indlæsning: ${error.message || 'Ukendt serverfejl.'}`, "danger");
            // Keep fields disabled on error
        } finally {
            if (savePasswordComplexityBtn) utils.toggleButtonLoading(savePasswordComplexityBtn, false);
        }
    }

    if (savePasswordComplexityBtn && passwordComplexityForm && passwordComplexityMsg && utils) {
        savePasswordComplexityBtn.addEventListener('click', async function() {
            utils.toggleButtonLoading(this, true, "Gemmer...");
            showFeedback(passwordComplexityMsg.id, "", "info");

            const payload = {
                password_min_length: pwMinLengthInput ? parseInt(pwMinLengthInput.value, 10) : null,
                password_require_uppercase: pwRequireUpperInput ? pwRequireUpperInput.checked : false,
                password_require_lowercase: pwRequireLowerInput ? pwRequireLowerInput.checked : false,
                password_require_number: pwRequireNumberInput ? pwRequireNumberInput.checked : false,
                password_require_symbol: pwRequireSymbolInput ? pwRequireSymbolInput.checked : false
            };

            // Basic client-side validation
            let clientErrors = [];
            if (payload.password_min_length === null || isNaN(payload.password_min_length) || payload.password_min_length < 6 || payload.password_min_length > 128) {
                clientErrors.push("Minimum længde skal være et tal mellem 6 og 128.");
                if (pwMinLengthInput) pwMinLengthInput.classList.add('is-invalid');
            } else {
                if (pwMinLengthInput) pwMinLengthInput.classList.remove('is-invalid');
            }


}); // Close addEventListener call
} // Add missing closing brace for the 'if (savePasswordComplexityBtn && ...)' block
}); // --- End DOMContentLoaded ---
