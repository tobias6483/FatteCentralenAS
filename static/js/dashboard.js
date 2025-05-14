// static/js/dashboard.js (Version 3.2 - Utils Update)

document.addEventListener('DOMContentLoaded', () => {
    // DEBUG-linje bevaret:
    console.log('>>> DEBUG: window.currentUser er:', window.currentUser);
    console.log("[Dashboard] V3.2 Initializing (Utils Update): DOM ready.");

    // ========================================================================
    // D E P E N D E N C Y   C H E C K (window.utils)
    // ========================================================================
    if (typeof window.utils === 'undefined' ||
        !window.utils.getData ||
        !window.utils.formatCurrency ||
        !window.utils.formatDateTime ||
        !window.utils.showToast || // Selvom ikke brugt i denne version, god at have tjekket
        !window.utils.escapeHtml) { // Selvom ikke brugt i denne version, god at have tjekket
        console.error("[Dashboard.js] CRITICAL: window.utils object or required functions (getData, formatCurrency, formatDateTime, showToast, escapeHtml) missing!");
        const errTarget = document.getElementById('dashboardErrorDisplay') || document.body;
        if (errTarget) {
            // Prøv at vise en fejl i et dedikeret område, ellers i body
            let targetElement = document.getElementById('dashboardErrorDisplay');
            if (!targetElement) {
                 targetElement = document.createElement('div');
                 targetElement.className = 'alert alert-danger m-3';
                 document.body.prepend(targetElement); // Prepend to body if specific target not found
             }
             targetElement.innerHTML = 'Kritisk sidefejl: Nødvendige JavaScript Utilities mangler. Dashboard kan ikke initialiseres korrekt.';
             targetElement.style.display = 'block'; // Sørg for den er synlig
        }
        return; // Stop script execution
    } else {
        console.log("[Dashboard.js] window.utils object and required functions verified.");
    }
    // Funktioner bruges nu direkte via utils.X

    // ========================================================================
    // LOKALE FALLBACKS FJERNES - Bruges ikke længere
    // ========================================================================
    // const formatCurrencyJS = ... FJERNES ...
    // const formatDateTimeJS = ... FJERNES ...

    // ========================================================================
    // A P I   I N T E R A C T I O N S   &   D A T A   L O A D E R S (OPDATERET)
    // ========================================================================

    /**
     * Generisk funktion til at hente og vise data i en liste.
     * Bruger nu utils.getData.
     */
    async function loadDataList(apiUrl, listElementId, placeholderId, renderItemFunction, noDataMessage = "Ingen data fundet.") {
        const listContainer = document.getElementById(listElementId);
        const placeholder = document.getElementById(placeholderId);
        if (!listContainer) {
            console.error(`[Dashboard] List container element not found: #${listElementId}`);
            return;
        }

        listContainer.innerHTML = ''; // Ryd tidligere indhold
        if (placeholder) {
            placeholder.style.display = 'flex';
            // Hvis placeholderen IKKE er inde i listContainer, tilføj den midlertidigt
            if (placeholder.parentNode !== listContainer) {
                 listContainer.appendChild(placeholder);
            }
            placeholder.innerHTML = '<div class="spinner-border spinner-border-sm text-secondary" role="status"><span class="visually-hidden">Loading...</span></div><span class="ms-2 fst-italic text-muted">Henter data...</span>';
        } else {
             // Fallback hvis der ikke er en specifik placeholder
             listContainer.innerHTML = `<li class="list-group-item text-muted text-center fst-italic">Henter data...</li>`;
        }

        try {
            console.log(`[Dashboard] Fetching list data using utils.getData from: ${apiUrl}`);
            // Brug utils.getData
            const data = await window.utils.getData(apiUrl);
            console.log(`[Dashboard] Data received for ${listElementId}:`, data);

            // Fjern placeholder FØR data indsættes
            const currentPlaceholder = document.getElementById(placeholderId); // Find den igen for en sikkerheds skyld
            if (currentPlaceholder) {
                currentPlaceholder.remove(); // Fjern placeholder helt
             }
             listContainer.innerHTML = ''; // Ryd igen for at fjerne evt. fallback 'Henter...'

            let items = [];
             // Find den relevante array i responsen (lidt mere robust tjek)
             if (Array.isArray(data)) {
                 items = data;
            } else if (typeof data === 'object' && data !== null) {
                 // Common array keys, prioriteret
                 const potentialKeys = ['activities', 'posts', 'sessions', 'invites', 'results', 'items', 'data'];
                 const arrayKey = potentialKeys.find(key => Array.isArray(data[key]));
                if (arrayKey) {
                    items = data[arrayKey];
                 } else {
                    console.warn(`[Dashboard] Data for ${listElementId} is object, but no standard array key found.`, data);
                    // Prøv at se om selve objektet er iterable, selvom det ikke er et array
                    if (typeof data[Symbol.iterator] === 'function') items = [...data]; // Mindre sandsynligt for JSON
                 }
             }

            if (items.length > 0) {
                items.forEach(item => {
                     const li = renderItemFunction(item); // Render-funktion kaldes stadig
                     if (li instanceof HTMLElement) {
                         listContainer.appendChild(li);
                     } else if (li){
                         console.warn("[Dashboard] renderItemFunction did not return an HTMLElement for item:", item);
                         listContainer.insertAdjacentHTML('beforeend', `<li class="list-group-item text-warning">Render fejl</li>`);
                     }
                 });
             } else {
                 listContainer.innerHTML = `<li class="list-group-item text-muted text-center fst-italic">${noDataMessage}</li>`;
             }

        } catch (error) {
             console.error(`[Dashboard] Fejl i loadDataList for ${apiUrl} using utils.getData:`, error);
             // Brug error.message fra utils.getData's typiske fejlstruktur
             listContainer.innerHTML = `<li class="list-group-item text-danger text-center fst-italic"><i class="fas fa-exclamation-triangle me-1"></i> Fejl: ${error.message || 'Ukendt fejl'}</li>`;
             // Vis evt. en toast også?
             // window.utils.showToast(`Kunne ikke hente data for ${listElementId}: ${error.message}`, 'warning');
        } finally {
             // Skjul den eksterne placeholder hvis den findes og ikke blev fjernet
            if (placeholder && placeholder.parentNode !== listContainer) {
                 placeholder.style.display = 'none';
             }
        }
    }

    /**
     * Henter de samlede dashboard-statistikker for en bruger fra API'et.
     * Bruger nu utils.getData.
     */
     async function fetchDashboardStats(username) {
         if (!username) {
            console.warn("[Dashboard] fetchDashboardStats: Username missing.");
            return null;
         }
         console.log(`[Dashboard] Fetching core stats using utils.getData for user: ${username}...`);
         try {
             // Brug utils.getData - Tilføj cache-busting parameter
            const apiUrl = `/api/user/stats/${username}?_=${new Date().getTime()}`;
            const statsData = await window.utils.getData(apiUrl);
             console.log(`[Dashboard] Core stats data received from ${apiUrl}:`, statsData);
            return statsData;
        } catch (error) {
             console.error("[Dashboard] FATAL: Error fetching dashboard stats using utils.getData:", error);
             const errorDisplay = document.getElementById('dashboardErrorDisplay');
             if (errorDisplay) {
                 errorDisplay.textContent = `Kunne ikke hente nøgletal: ${error.message || 'Ukendt fejl'}`;
                errorDisplay.style.display = 'block';
             } else {
                 const balanceSpan = document.getElementById('dashboardBalance');
                 if (balanceSpan) balanceSpan.innerHTML = `<span class="text-warning small" title="${error.message || 'Ukendt fejl'}"><i class="fas fa-exclamation-triangle"></i> Fejl</span>`;
             }
             // Overvej at vise en toast her også
             window.utils.showToast(`Fejl ved hentning af statistik: ${error.message || 'Ukendt fejl'}`, 'danger');
            return null;
         }
     }

    // ========================================================================
    // U I   U P D A T E R S (OPDATERET til at bruge utils.* direkte)
    // ========================================================================

    /**
     * Opdaterer de forskellige statistik-kort og profilinfo på dashboardet.
     * Bruger nu utils.formatCurrency og utils.formatDateTime direkte.
     */
     function updateDashboardUI(statsData) {
         if (!statsData) {
             console.warn("[Dashboard] updateDashboardUI called with no data. Skipping update.");
             return;
         }
        console.log("[Dashboard] Updating dashboard UI elements...");

        const setText = (elementId, value, formatter) => {
             const element = document.getElementById(elementId);
            if (element) {
                 // Hvis en utils-formatter er givet, brug den, ellers brug værdien eller '-'
                 element.textContent = formatter && typeof window.utils[formatter] === 'function'
                    ? window.utils[formatter](value)
                     : (value ?? '-');
             } else {
                 console.warn(`[Dashboard] UI Element not found: #${elementId}`);
            }
        };

        // Specifik funktion til valuta for klarhed og klasse-håndtering
        const setCurrencyUI = (elementId, value) => {
            const element = document.getElementById(elementId);
            if (element) {
                 element.textContent = window.utils.formatCurrency(value ?? 0); // Brug utils.formatCurrency
                 // Special håndtering for Net Difference farve
                 if (elementId === 'dashboardNetDiff' && typeof value === 'number') {
                     element.className = value >= 0 ? 'text-success' : 'text-danger';
                 }
             } else {
                 console.warn(`[Dashboard] UI Element not found: #${elementId}`);
            }
         };

        setCurrencyUI('dashboardBalance', statsData.balance);
         setText('dashboardTotalWins', statsData.wins);
         setText('dashboardTotalLosses', statsData.losses);

        const profileAvatar = document.querySelector('.profile-card .avatar-circle');
        if (profileAvatar) {
            // Antager avatar_url er sikker, ellers brug utils.escapeHtml hvis nødvendigt for alt-tekst
            profileAvatar.src = statsData.avatar_url || window.DEFAULT_AVATAR_URL; // Use only the configured default
            profileAvatar.alt = `${statsData.username || 'Bruger'}s avatar`;
         } else { console.warn("[Dashboard] Profile card avatar (.profile-card .avatar-circle) not found."); }

        // Ensure Title Case for display name
        setText('dashboardProfileName', statsData.username, (name) => name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : 'Bruger');

        // --- Explicitly update Email, Rank, and Last Login ---
        console.log(`[Dashboard DEBUG] Updating UI with Email: ${statsData.email}, Rank: ${statsData.rank}, LastLoginRelative: ${statsData.last_login_relative}, LastLoginISO: ${statsData.last_login}`);

        const emailElem = document.getElementById('dashboardProfileEmail');
        if (emailElem) {
            emailElem.textContent = statsData.email || 'Ikke angivet'; // Use fresh email
            console.log(`[Dashboard DEBUG] Updated Email to: ${emailElem.textContent}`);
        } else { console.warn("[Dashboard] UI Element not found: #dashboardProfileEmail"); }

        const rankElem = document.getElementById('dashboardProfileRank');
        if (rankElem) {
            rankElem.textContent = statsData.rank || 'N/A'; // Use fresh rank
            // Update badge class based on rank
            let rank_bg_class = 'bg-secondary';
            if (statsData.rank === 'System Admin') rank_bg_class = 'bg-danger';
            else if (statsData.rank === 'Grundlægger') rank_bg_class = 'bg-primary';
            // Add other rank checks if necessary
            rankElem.className = `badge ${rank_bg_class} rank-badge`; // Reset classes and apply new one
            console.log(`[Dashboard DEBUG] Updated Rank to: ${rankElem.textContent}`);
        } else { console.warn("[Dashboard] UI Element not found: #dashboardProfileRank"); }

        const lastLoginElem = document.getElementById('dashboardProfileLastLogin');
        if (lastLoginElem) {
            if (statsData.last_login && statsData.last_login_relative) {
                // Set text content to the relative time string from the API
                lastLoginElem.textContent = statsData.last_login_relative;
                // Set title attribute to the absolute local time
                try {
                    const dateObj = new Date(statsData.last_login); // Use the ISO string
                    if (!isNaN(dateObj.getTime())) {
                        const localString = dateObj.toLocaleString(undefined, {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                        });
                        lastLoginElem.title = localString; // Set title to local time
                    } else {
                        lastLoginElem.title = 'Ugyldig dato modtaget';
                    }
                } catch (e) {
                    console.error("Error formatting last_login title in dashboard.js", e);
                    lastLoginElem.title = statsData.last_login || 'Formateringsfejl'; // Fallback title
                }
                console.log(`[Dashboard DEBUG] Updated LastLogin text to: ${lastLoginElem.textContent}, title to: ${lastLoginElem.title}`);
            } else {
                // Handle case where last_login is null/missing
                lastLoginElem.textContent = 'Aldrig set';
                lastLoginElem.title = '';
                console.log(`[Dashboard DEBUG] Set LastLogin to 'Aldrig set'`);
            }
        } else { console.warn("[Dashboard] UI Element not found: #dashboardProfileLastLogin"); }

        setCurrencyUI('dashboardLargestWin', statsData.largest_win);
        setCurrencyUI('dashboardLargestLoss', statsData.largest_loss);
        setCurrencyUI('dashboardNetDiff', statsData.net);
        setCurrencyUI('dashboardTotalStaked', statsData.total_staked);

         console.log("[Dashboard] Dashboard UI elements update cycle finished.");
     }

    /**
     * Nulstiller dashboard UI til standardværdier (uændret logik, men bruger opdateret updateDashboardUI).
     */
     function resetDashboardUI() {
        console.log("[Dashboard] Resetting dashboard UI to default/logged-out state.");
         ['recentActivityPlaceholder', 'forumPlaceholder', 'sessionsPlaceholder'].forEach(id => {
            const ph = document.getElementById(id);
            if (ph) {
                 ph.innerHTML = '<span class="text-muted small fst-italic">Data ikke tilgængelig.</span>';
                ph.style.display = 'flex';
                const list = document.getElementById(id.replace('Placeholder', 'List'));
                if(list) list.innerHTML = '';
             }
        });

        // Kalder opdateret funktion med nul-værdier
        updateDashboardUI({
             balance: 0, wins: 0, losses: 0, avatar_url: null, username: null, email: null,
             rank: null, last_login: null, largest_win: 0, largest_loss: 0, net: 0, total_staked: 0
        });

        // Kalder opdateret chart funktion (som nu også bruger utils)
        initializeBalanceChart([], []);
    }

    // ========================================================================
    // R E N D E R   F U N C T I O N S (OPDATERET til at bruge utils.* direkte)
    // ========================================================================

    /**
     * Laver et LI element for et aktivitetselement.
     * Bruger nu utils.formatDateTime og utils.formatCurrency.
     */
    function renderActivityItem(activity) {
        if (!activity || typeof activity !== 'object') return null;
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex align-items-center border-0 px-0 py-2 hover-highlight';
        // Brug utils.formatDateTime
        const formattedTime = window.utils.formatDateTime(activity.timestamp);

        let amountHtml = '';
        if (activity.amount != null && typeof activity.amount === 'number') {
            const sign = activity.type === 'win' ? '+' : (activity.type === 'loss' || activity.type === 'stake' ? '-' : '');
            const amountClass = activity.type === 'win' ? 'text-success fw-bold' : (activity.type === 'loss' ? 'text-danger fw-bold' : 'text-muted');
            // Brug utils.formatCurrency
            amountHtml = ` <span class="activity-amount ms-1 ${amountClass}">(${sign}${window.utils.formatCurrency(activity.amount)})</span>`;
        }

        const iconClass = activity.icon || 'bi-question-circle-fill';
        const iconColorClass = activity.iconColor || 'text-secondary';
        const colorName = iconColorClass.replace('text-', ''); // Til CSS var

        // Antager activity.description er sikker, ellers brug utils.escapeHtml
        li.innerHTML = `
            <i class="${iconClass} fs-4 me-2" style="width: 1.5em; text-align: center; flex-shrink: 0; color: var(--bs-${colorName}, var(--bs-secondary));"></i>
            <div class="flex-grow-1">
                 <span class="activity-description">${window.utils.escapeHtml(activity.description || 'Ukendt aktivitet')}</span>${amountHtml}
                 <small class="text-muted d-block mt-1" style="font-size: 0.8em;">
                     <i class="bi bi-clock me-1"></i> ${formattedTime}
                 </small>
            </div>
        `;
        return li;
    }

    /**
     * Laver et LI element for et seneste forum-indlæg.
     * Bruger nu utils.formatDateTime og utils.escapeHtml.
     */
    function renderLatestPostItem(post) {
        console.log("[Dashboard] renderLatestPostItem received post object:", post);
        if (!post || typeof post !== 'object') {
            console.warn("[Dashboard] renderLatestPostItem received invalid data:", post);
            return null;
        }

        // Brug utils.escapeHtml for alle tekst-strenge fra API'et
        const postTitle = window.utils.escapeHtml(post.thread_title || 'Unavngivet Tråd');
        const authorName = window.utils.escapeHtml(post.author_display_name || post.author_username || 'Ukendt forfatter');
        // Brug utils.formatDateTime
        const formattedTime = post.created_at_relative // Antag relativ tid er sikker HTML
            ? post.created_at_relative
            : window.utils.formatDateTime(post.created_at_iso, undefined, { dateStyle: 'short', timeStyle: 'short' });
        const authorAvatarUrl = post.author_avatar_url; // URL antages sikker for src
        const postUrl = post.thread_id ? `${window.location.origin}/forum/thread/${post.thread_id}/#post-${post.post_id}` : '#'; // URL antages sikker for href

        console.log(`[Dashboard] Rendering latest post item: Title='${postTitle}', Author='${authorName}', Time='${formattedTime}', URL='${postUrl}'`);

        const li = document.createElement('li');
        li.className = 'list-group-item d-flex align-items-start border-0 px-0 py-2 hover-highlight';

        let iconHTML;
        if (authorAvatarUrl) {
            // Brug utils.escapeHtml for alt-tekst
            iconHTML = `<img src="${authorAvatarUrl}" alt="${window.utils.escapeHtml(authorName)}'s avatar" class="rounded-circle me-2 flex-shrink-0" style="width: 32px; height: 32px; object-fit: cover;" title="${window.utils.escapeHtml(authorName)}">`;
        } else {
            const iconClass = 'bi-chat-square-dots-fill';
            const iconColorName = 'secondary';
            iconHTML = `<i class="${iconClass} fs-5 me-3 mt-1" style="width: 1.5em; text-align: center; flex-shrink: 0; color: var(--bs-${iconColorName}, var(--bs-secondary));"></i>`;
        }

        li.innerHTML = `
            ${iconHTML}
            <div class="flex-grow-1">
                <a href="${postUrl}" class="text-decoration-none link-body-emphasis fw-medium stretched-link" title="Gå til indlæg i tråden: ${postTitle}">
                    ${postTitle} <!-- Titel er allerede escaped -->
                </a>
                <small class="text-muted d-block mt-1" style="font-size: 0.8em;">
                    <i class="bi bi-person me-1"></i>${authorName} <!-- Navn er allerede escaped --> • <i class="bi bi-clock ms-2 me-1"></i>${formattedTime}
                </small>
            </div>
        `;
        return li;
    }

    /**
     * *** GAMMEL FUNKTION - IKKE AKTIVT BRUGT TIL SENESTE POSTS ***
     * Laver et LI element for et generisk forum-element.
     * Opdateret til at bruge utils.formatDateTime og utils.escapeHtml.
     */
    function renderForumItem(item) {
        // Denne funktion holdes opdateret, selvom den måske ikke bruges pt.
        if (!item) return null;
        const li = document.createElement('li');
        li.className = 'list-group-item border-0 px-0 py-2 d-flex align-items-center hover-highlight';

        let iconHTML = '';
        const iconIdentifier = item.icon || 'bi-chat-dots-fill'; // Ikon-klassenavn antages sikkert

        if (iconIdentifier === 'bi-chat-dots-fill') {
            console.log("[Dashboard] Rendering special forum icon (bi-chat-dots-fill) - (via renderForumItem)");
            const topOffset = '3px';
            const bubbleSVG = `<svg.../>`; // SVG antages sikker
            const dotsSVG = `<svg.../>`; // SVG antages sikker
            iconHTML = `<span class="list-icon-container fs-4 me-2" style="position: relative; display: inline-block; width: 1em; height: 1em; flex-shrink: 0;">${bubbleSVG}${dotsSVG}</span>`;
        } else {
            console.log(`[Dashboard] Rendering standard forum icon: ${iconIdentifier} - (via renderForumItem)`);
            const iconClass = iconIdentifier; // Antaget sikker
            const colorName = item.iconColor || 'secondary'; // Antaget sikker
            iconHTML = `<i class="bi ${iconClass} fs-4 me-2" style="color: var(--bs-${colorName}, var(--bs-secondary)); text-align: center; flex-shrink: 0;"></i>`;
        }

        // Brug utils.escapeHtml for text og utils.formatDateTime for timestamp
        const itemText = window.utils.escapeHtml(item.text || 'Forum opdatering...');
        const itemUrl = item.url; // URL antages sikker for href
        const formattedTime = window.utils.formatDateTime(item.timestamp);

        const contentHTML = `
            <div class="flex-grow-1">
                 ${itemText}
                ${itemUrl ? `<a href="${itemUrl}" class="stretched-link" target="_blank" rel="noopener noreferrer" title="Gå til indlæg"></a>` : ''}
                <small class="text-muted d-block mt-1" style="font-size: 0.8em;">
                     <i class="bi bi-clock me-1"></i> ${formattedTime}
                </small>
           </div>`;

        li.innerHTML = iconHTML + contentHTML;
        return li;
    }

    /**
     * Laver et LI element for et session/invite-element.
     * Bruger nu utils.escapeHtml.
     */
    function renderSessionItem(item) {
        if (!item) return null;
        const li = document.createElement('li');
        li.className = 'list-group-item border-0 px-0 py-2 d-flex align-items-center hover-highlight';
        let badgeOrButtonHtml = '';

        // Knap-ID'er (session/invite id) antages at være sikre for data-attributter
        if (item.type === 'session' && item.status === 'open' && item.id) { badgeOrButtonHtml = `<button class="btn btn-success btn-sm ms-auto join-session-btn" data-session-id="${item.id}" type="button" title="Deltag i session">Join</button>`; }
        else if (item.type === 'invite' && item.id) { badgeOrButtonHtml = `<button class="btn btn-info btn-sm ms-auto view-invite-btn" data-invite-id="${item.id}" type="button" title="Vis invitation">Vis</button>`; }
        else if (item.status) {
            // Brug utils.escapeHtml for status-tekst i badge
            badgeOrButtonHtml = `<span class="badge bg-secondary ms-auto">${window.utils.escapeHtml(item.status)}</span>`;
        }

        const iconClass = item.icon || 'bi-controller'; // Ikon-klasse antages sikker
        const iconColorClass = item.iconColor || 'text-info'; // Farveklasse antages sikker
        const colorName = iconColorClass.replace('text-', '');

        // Brug utils.escapeHtml for title og details
        const itemTitle = window.utils.escapeHtml(item.title || 'Ukendt session/invite');
        const itemDetails = item.details ? `<small class="text-muted d-block" style="font-size: 0.9em;">${window.utils.escapeHtml(item.details)}</small>` : '';

        li.innerHTML = `
            <i class="${iconClass} fs-4 me-2" style="width: 1.5em; text-align: center; flex-shrink: 0; color: var(--bs-${colorName}, var(--bs-info));"></i>
            <div class="flex-grow-1">
                 ${itemTitle}
                 ${itemDetails}
           </div>
           ${badgeOrButtonHtml}`;
        return li;
    }

    // ========================================================================
    // C H A R T   I N I T I A L I Z A T I O N (OPDATERET til at bruge utils.*)
    // ========================================================================

    let balanceChartInstance = null;

    /**
     * Initialiserer eller opdaterer balance-diagrammet med Chart.js.
     * Bruger nu utils.formatCurrency.
     */
    function initializeBalanceChart(chartLabels, chartData) {
        const ctx = document.getElementById('balanceChart');
        const placeholder = document.getElementById('chartPlaceholder');
        if (!ctx) {
            console.error("[Dashboard] Chart canvas element (#balanceChart) not found!");
            return;
        }
        if (typeof Chart === 'undefined') {
            console.error("[Dashboard] Chart.js library not found! Make sure it's loaded.");
            ctx.style.display = 'none';
             if (placeholder) {
                 placeholder.innerHTML = '<i class="fas fa-exclamation-triangle text-danger me-2"></i> Fejl: Diagram-bibliotek mangler.';
                 placeholder.style.display = 'flex';
             }
             return;
         }

         const isValidData = Array.isArray(chartLabels) && Array.isArray(chartData) &&
                             chartLabels.length > 0 && chartData.length > 0 &&
                             chartLabels.length === chartData.length;

        if (!isValidData) {
             console.warn("[Dashboard] Chart initialization skipped: Invalid or empty chart data provided.", { labels: chartLabels, data: chartData });
            ctx.style.display = 'none';
            if (placeholder) {
                 placeholder.innerHTML = '<i class="fas fa-chart-line me-2 text-muted"></i> Ingen balancehistorik tilgængelig.';
                 placeholder.style.display = 'flex';
             }
             if (balanceChartInstance) {
                 balanceChartInstance.destroy();
                 balanceChartInstance = null;
                 console.log("[Dashboard] Existing chart destroyed due to invalid data.");
             }
             return;
         }

        if (placeholder) placeholder.style.display = 'none';
        ctx.style.display = 'block';

         const chartOptions = { // Definer options her for at bruge utils i callbacks
             responsive: true, maintainAspectRatio: false,
             scales: {
                 y: { beginAtZero: false, ticks: { color: '#adb5bd', callback: (value) => typeof value === 'number' ? window.utils.formatCurrency(value) : value }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }, // Brug utils.formatCurrency
                 x: { ticks: { color: '#adb5bd', maxRotation: 0, autoSkip: true, maxTicksLimit: 7 }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
             },
             plugins: {
                 legend: { display: false },
                 tooltip: {
                     enabled: true, backgroundColor: 'rgba(0, 0, 0, 0.85)', titleColor: '#ffffff',
                     bodyColor: '#ffffff', padding: 10, cornerRadius: 4, displayColors: false,
                     callbacks: {
                         label: function(context) { let label = context.dataset.label || ''; if (label) { label += ': '; } if (context.parsed && typeof context.parsed.y === 'number') { label += window.utils.formatCurrency(context.parsed.y); } else { label += 'N/A'; } return label; }, // Brug utils.formatCurrency
                         title: function(context) { return context[0]?.label ? `Dato: ${context[0].label}` : ''; } // Dato-label antages ok
                     }
                 }
             },
             interaction: { intersect: false, mode: 'index' }
         };

         if (balanceChartInstance) {
            console.log("[Dashboard] Updating existing chart instance.");
            balanceChartInstance.data.labels = chartLabels;
            balanceChartInstance.data.datasets[0].data = chartData;
            // Sørg for at options også opdateres, hvis de kan ændre sig dynamisk (sjældent for callbacks)
            // balanceChartInstance.options = chartOptions; // Kan være nødvendigt i nogle Chart.js versioner
            balanceChartInstance.update();
        } else {
             console.log("[Dashboard] Initializing new Chart.js instance with data:", { labels: chartLabels.length, dataPoints: chartData.length });
             try {
                 balanceChartInstance = new Chart(ctx, {
                     type: 'line',
                     data: {
                         labels: chartLabels,
                         datasets: [{
                             label: 'Saldo', data: chartData,
                             borderColor: 'rgba(0, 204, 163, 1)', backgroundColor: 'rgba(0, 204, 163, 0.15)',
                             borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: 'rgba(0, 204, 163, 1)',
                             pointBorderColor: '#ffffff', pointRadius: 3, pointHoverRadius: 6,
                             pointHoverBackgroundColor: '#ffffff', pointHoverBorderColor: 'rgba(0, 204, 163, 1)',
                             pointHoverBorderWidth: 2
                         }]
                     },
                     options: chartOptions // Brug de definerede options
                 });
                console.log("[Dashboard] Chart.js initialization complete.");
            } catch(chartError) {
                console.error("[Dashboard] FATAL Error initializing Chart.js:", chartError);
                 ctx.style.display = 'none';
                 if (placeholder) {
                     placeholder.innerHTML = '<i class="fas fa-exclamation-triangle text-danger me-2"></i> Kunne ikke vise saldo-diagram.';
                     placeholder.style.display = 'flex';
                 }
                 balanceChartInstance = null;
             }
         }
    }

    // ========================================================================
    // A C T I O N   H A N D L E R S (Ingen utils-kald her endnu)
    // ========================================================================
    // (handleJoinSession og handleViewInvite er uændrede - kunne bruge utils.showToast/toggleButton)

    function handleJoinSession(sessionId) {
        console.log(`[Dashboard] ACTION: Attempting to join session: ${sessionId}`);
        // TODO: Implementer rigtig logik, f.eks. med utils.postData og utils.toggleButtonLoading
        window.utils.showToast(`Forsøger at joine session ${sessionId}... (Implementering mangler)`, 'info');
        // Eksempel:
        // const joinButton = document.querySelector(`.join-session-btn[data-session-id="${sessionId}"]`);
        // if (joinButton) window.utils.toggleButtonLoading(joinButton, true);
        // window.utils.postData(`/api/sessions/join/${sessionId}`)
        //  .then(response => { window.utils.showToast(response.message || 'Session joined!', 'success'); /* Redirect or update UI */ })
        //  .catch(error => window.utils.showToast(`Join fejlet: ${error.message}`, 'danger'))
        //  .finally(() => { if (joinButton) window.utils.toggleButtonLoading(joinButton, false); });
    }

    function handleViewInvite(inviteId) {
        console.log(`[Dashboard] ACTION: Attempting to view invite: ${inviteId}`);
        // TODO: Implementer rigtig logik, f.eks. modal eller redirect
        window.utils.showToast(`Viser invitation ${inviteId}... (Implementering mangler)`, 'info');
    }

    // ========================================================================
    // E V E N T   L I S T E N E R S (Uændret logik)
    // ========================================================================

    function setupEventListeners() {
        console.log("[Dashboard] Setting up event listeners...");
        const sessionsList = document.getElementById('sessionsInvitesList');
        if (sessionsList) {
            sessionsList.addEventListener('click', function(event) {
                const joinBtn = event.target.closest('.join-session-btn');
                const viewBtn = event.target.closest('.view-invite-btn');
                if (joinBtn && joinBtn.dataset.sessionId) {
                     event.preventDefault(); handleJoinSession(joinBtn.dataset.sessionId);
                 } else if (viewBtn && viewBtn.dataset.inviteId) {
                     event.preventDefault(); handleViewInvite(viewBtn.dataset.inviteId);
                }
             });
             console.log("[Dashboard] Event listener attached to #sessionsInvitesList.");
         } else {
             console.warn("[Dashboard] Could not find #sessionsInvitesList to attach event listener.");
        }
    }

    // ========================================================================
    // I N I T I A L I Z A T I O N   L O G I C (Bruger opdaterede funktioner)
    // ========================================================================

    async function initializeDashboard() {
        console.log("[Dashboard] Starting main initialization sequence (V3.2 Utils Update)...");
        const currentUsername = window.currentUser;

        if (currentUsername) {
             console.log(`[Dashboard] User identified: ${currentUsername}. Loading data...`);
             // fetchDashboardStats bruger nu utils.getData
             const statsData = await fetchDashboardStats(currentUsername);

             if (statsData) {
                // updateDashboardUI bruger nu utils.*
                updateDashboardUI(statsData);

                 // loadDataList bruger nu utils.getData og render-funktionerne bruger utils.*
                 loadDataList(`/api/user/recent_activity/${currentUsername}?limit=5`,
                             'recentActivityList',
                             'recentActivityPlaceholder',
                             renderActivityItem,
                             "Ingen nylig aktivitet fundet.");

                 console.log("[Dashboard] Initiating load for latest forum posts list.");
                 loadDataList('/forum/api/forum/latest?limit=3',
                              'latestForumPostsList',
                              'forumPlaceholder',
                              renderLatestPostItem, // Bruger utils.*
                              "Intet nyt fra forum.");

                 loadDataList('/api/sessions/open?limit=4',
                              'sessionsInvitesList',
                              'sessionsPlaceholder',
                              renderSessionItem, // Bruger utils.*
                              "Ingen åbne sessions eller invites.");

                 // initializeBalanceChart bruger nu utils.*
                 try {
                     const chartLabels = window.chartLabelsData || [];
                     const chartData = window.chartNumericData || [];
                     console.log("[Dashboard] Attempting to initialize chart with window data:", { labelCount: chartLabels.length, dataCount: chartData.length });
                     initializeBalanceChart(chartLabels, chartData);
                 } catch (e) {
                     console.error("[Dashboard] Error reading chart data from window object:", e);
                     initializeBalanceChart([], []);
                }

             } else {
                console.warn("[Dashboard] Core stats fetch failed. Resetting UI.");
                 resetDashboardUI(); // Bruger opdaterede funktioner
            }

        } else {
             console.warn("[Dashboard] No current user identified. Displaying logged-out state.");
             resetDashboardUI(); // Bruger opdaterede funktioner
        }

        // --- Opsæt Listeners (uændret logik) ---
        setupEventListeners();

        console.log("[Dashboard] Initialization sequence complete.");
    }

    // Kør initialiseringen!
    initializeDashboard();

}); // Slut på DOMContentLoaded
