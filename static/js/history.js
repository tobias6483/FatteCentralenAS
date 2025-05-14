// static/js/history.js (Version Utils Update)
document.addEventListener('DOMContentLoaded', () => {
    console.log("History page script loaded (Utils Update).");

    // --- Dependency Check (window.utils) ---
    // Tjekker for funktioner der bruges nu (showToast) og potentielt i fremtiden (AJAX)
    if (typeof window.utils === 'undefined' ||
        !window.utils.showToast ||
        !window.utils.getData || // For potential AJAX
        !window.utils.toggleButtonLoading || // For potential AJAX/refresh button
        !window.utils.formatDateTime || // For potential AJAX table rendering
        !window.utils.formatCurrency || // For potential AJAX table rendering
        !window.utils.escapeHtml || // For potential AJAX table rendering
        !window.utils.initializeTooltips) { // If AJAX adds tooltips
        console.error("[History.js] CRITICAL: window.utils object or required functions (showToast, getData, toggleButtonLoading, formatters, escapeHtml, initializeTooltips) missing!");
        // Vis en fejl - evt. øverst på siden
        const container = document.querySelector('.container') || document.body;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i> Kritisk sidefejl: Nødvendige JavaScript-funktioner mangler. Historik kan muligvis ikke vises eller opdateres korrekt.';
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
        // Overvej at deaktivere knapper eller stoppe
        const refreshBtn = document.getElementById('refreshHistoryBtn');
        if (refreshBtn) refreshBtn.disabled = true;
        return; // Stop scriptet hvis kritiske funktioner mangler
    } else {
         console.log("[History.js] window.utils object and required functions verified.");
    }


    // --- Element References ---
    const refreshBtn = document.getElementById('refreshHistoryBtn');
    const historyTabTriggers = document.querySelectorAll('#historyTab button[data-bs-toggle="tab"]');

    // --- Function Definitions ---

    // Funktion til at genindlæse historik-siden (bruges af refresh knap)
    function refreshHistoryPage() {
        // BRUG ALTID utils.showToast nu, da vi har tjekket for den
        window.utils.showToast("Opdaterer historik...", "info");

        // Vis loading state på knappen hvis den findes
        if (refreshBtn && window.utils.toggleButtonLoading) {
             window.utils.toggleButtonLoading(refreshBtn, true, 'Opdaterer...');
        }

        // Lille delay så toasten kan ses før reload
        setTimeout(() => {
            location.reload();
            // Knappen vil blive genaktiveret af side-reload, ingen grund til finally her
        }, 500); // 500ms delay
    }

    // --- Initialization & Event Listeners ---

    // Initialiser Bootstrap Tabs (uændret, Bootstrap håndterer dette)
    if (historyTabTriggers.length > 0 && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
        historyTabTriggers.forEach(triggerEl => {
            new bootstrap.Tab(triggerEl);
        });
        // Kommentarer om at huske/gendanne aktiv tab er bevaret uændret
        /* ... (localStorage logic for active tab remains commented) ... */
    } else {
        if (historyTabTriggers.length > 0) {
            console.warn("Bootstrap Tab component not found or initialized. History tabs might not work.");
             // Vis evt. en lille advarsel til brugeren vha. utils.showToast?
             // window.utils.showToast("Tab-funktionalitet er muligvis ikke tilgængelig.", "warning");
        }
    }

    // Tilføj event listener til Refresh-knappen
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshHistoryPage);
    } else {
        // console.log("Refresh history button (#refreshHistoryBtn) not found on this view.");
    }


    // --- (Potential Future AJAX Implementation - References updated to utils) ---
    // Udkommenteret kode er opdateret til at vise, hvordan utils ville blive brugt
    /*
    const filterForm = document.getElementById('historyFilterForm');
    const aggregatedCard = document.getElementById('aggregatedCard');
    const detailedCard = document.getElementById('detailedCard');

    // Funktion til at vise/skjule loading state (bruger nu utils)
    function showLoadingState(isLoading) {
        const submitBtn = filterForm ? filterForm.querySelector('button[type="submit"]') : null;
        if (submitBtn && window.utils.toggleButtonLoading) {
            window.utils.toggleButtonLoading(submitBtn, isLoading); // Brug utils til knap
        }
        // For kort/sektions-loading - antag en css-klasse eller en utils funktion
        if(aggregatedCard) aggregatedCard.classList.toggle('is-loading', isLoading);
        if(detailedCard) detailedCard.classList.toggle('is-loading', isLoading);
        // Eller hvis utils har en helper:
        // if (window.utils.toggleElementLoading) {
        //    if(aggregatedCard) window.utils.toggleElementLoading(aggregatedCard, isLoading);
        //    if(detailedCard) window.utils.toggleElementLoading(detailedCard, isLoading);
        // }
    }

    // Funktion til at opdatere tabel body (ville bruge utils formatters/escape)
    function updateTableBody(tbodyElement, rowsData) {
        if (!tbodyElement) return;
        tbodyElement.innerHTML = ''; // Ryd
        if (!rowsData || rowsData.length === 0) {
             // Brug evt. utils.showTableLoading til at vise 'no data'
             // tbodyElement.innerHTML = '<tr><td colspan="X">Ingen data fundet</td></tr>';
             return;
        }
        rowsData.forEach(row => {
             const tr = tbodyElement.insertRow();
             // Eksempel på brug af utils
             tr.innerHTML = `
                 <td>${window.utils.escapeHtml(row.someText)}</td>
                 <td>${window.utils.formatDateTime(row.timestamp)}</td>
                 <td>${window.utils.formatCurrency(row.amount)}</td>
                 <td>... andre kolonner ...</td>
             `;
        });
         // Geninitialiser tooltips hvis nye elementer blev tilføjet
         if (window.utils.initializeTooltips) {
             window.utils.initializeTooltips(tbodyElement);
         }
    }


    if (filterForm) {
         filterForm.addEventListener('submit', async (event) => {
           event.preventDefault();
            showLoadingState(true);

           const formData = new FormData(filterForm);
           const params = new URLSearchParams(formData).toString();
           const url = `/api/history?${params}`; // Dit fremtidige API endpoint

           try {
               // Brug utils.getData
               const data = await window.utils.getData(url);

               // Opdater dine tabel bodies baseret på data
               // updateTableBody(document.getElementById('aggregatedTableBody'), data.aggregated);
               // updateTableBody(document.getElementById('detailedTableBody'), data.detailed);

               window.history.pushState({path: `${filterForm.action}?${params}`}, '', `${filterForm.action}?${params}`);

           } catch (error) {
             console.error("Error fetching history via AJAX:", error);
              // Brug utils.showToast for fejl
              window.utils.showToast(`Fejl: ${error.message || 'Kunne ikke hente historik'}`, 'danger');
           } finally {
             showLoadingState(false);
           }
         });
    }
    */

    console.log("History page script initialization complete.");

}); // End DOMContentLoaded
