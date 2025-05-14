// static/js/leaderboard.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Leaderboard] DOMContentLoaded");

    // --- Dependency Check ---
    if (typeof window.utils === 'undefined' || !window.utils.getData || !window.utils.formatCurrency || !window.utils.escapeHtml || !window.utils.toggleButtonLoading) {
        console.error("[Leaderboard] CRITICAL: window.utils object or required functions (getData, formatCurrency, escapeHtml, toggleButtonLoading) missing!");
        const errContainer = document.querySelector('.leaderboard-main-card .card-body') || document.body;
        if (errContainer) errContainer.innerHTML = '<div class="alert alert-danger m-3">Kritisk sidefejl: Nødvendige JavaScript Utilities mangler.</div>';
        return;
    }
    const utils = window.utils; // Alias for convenience
    console.log("[Leaderboard] Utils object and functions verified.");

    // --- DOM References ---
    const getElement = (id) => {
        const element = document.getElementById(id);
        if (!element) console.warn(`[Leaderboard] Element with ID #${id} not found.`);
        return element;
    };

    const tableBody = getElement('leaderboardTableBody');
    const loadingRow = getElement('loadingRow');
    const noDataRow = getElement('noDataRow');
    const refreshBtn = getElement('refreshLeaderboardBtn');
    const lastUpdatedSpan = getElement('lastUpdatedTimestamp');
    const errorAlert = getElement('leaderboardError');
    const errorAlertMsg = errorAlert?.querySelector('.specific-error-message');
    const sortButtons = document.querySelectorAll('#leaderboardSortControls .sort-btn');
    const sortableHeaders = document.querySelectorAll('.sortable-header');

    // --- State ---
    let isLoading = false;
    let currentSort = 'balance'; // Default sort

    // --- Functions ---

    /** Displays error messages */
    function showError(message) {
        if (errorAlert && errorAlertMsg) {
            errorAlertMsg.textContent = message || 'Ukendt fejl.';
            errorAlert.style.display = 'block';
            // Ensure alert is dismissible (Bootstrap might handle this automatically if class 'show' is added)
            if (!errorAlert.classList.contains('show')) {
                 errorAlert.classList.add('show');
            }
        } else {
            utils.showToast(`Leaderboard Fejl: ${message}`, 'danger'); // Fallback
        }
    }

    /** Hides the error alert */
    function hideError() {
        if (errorAlert) {
            errorAlert.style.display = 'none';
            errorAlert.classList.remove('show');
        }
    }

    /** Renders the leaderboard table */
    function renderLeaderboard(data) {
        if (!tableBody) return;

        // Clear existing data rows (keep loading/no-data rows)
        tableBody.querySelectorAll('tr:not(#loadingRow):not(#noDataRow)').forEach(row => row.remove());

        if (!data || data.length === 0) {
            if (loadingRow) loadingRow.style.display = 'none';
            if (noDataRow) noDataRow.style.display = 'table-row';
            console.log("[Leaderboard] No data received or empty array.");
            return;
        }

        data.forEach(user => {
            const tr = document.createElement('tr');
            tr.classList.add(`rank-${user.rank}`); // Add rank class

            // Medal logic
            let medalHtml = '';
            if (user.rank === 1) medalHtml = '<i class="bi bi-medal-fill medal-gold" title="Guld"></i>';
            else if (user.rank === 2) medalHtml = '<i class="bi bi-medal-fill medal-silver" title="Sølv"></i>';
            else if (user.rank === 3) medalHtml = '<i class="bi bi-medal-fill medal-bronze" title="Bronze"></i>';

            // Avatar logic (simplified, assuming utils.escapeHtml exists)
            const avatarSize = '32px'; // Slightly larger for leaderboard
            const avatarImg = user.avatar_url
                ? `<img src="${utils.escapeHtml(user.avatar_url)}" alt="${utils.escapeHtml(user.username)}'s avatar" class="leaderboard-avatar rounded-circle" style="width:${avatarSize}; height:${avatarSize}; object-fit:cover;">`
                : `<i class="bi bi-person-circle" style="font-size: ${avatarSize}; vertical-align: middle;"></i>`;

            // Determine profit class
            let profitClass = '';
            if (user.net_profit > 0) profitClass = 'text-success';
            else if (user.net_profit < 0) profitClass = 'text-danger';

            tr.innerHTML = `
                <td class="text-center rank-col">${user.rank}</td>
                <td class="text-center medal-col">${medalHtml}</td>
                <td class="user-col">
                    <a href="${utils.escapeHtml(user.profile_url || '#')}" class="text-decoration-none link-light d-flex align-items-center">
                        ${avatarImg}
                        <span class="ms-2">${utils.escapeHtml(utils.capitalizeFirstLetter(user.username))}</span>
                    </a>
                </td>
                <td class="text-end balance-col">${utils.formatCurrency(user.balance)}</td>
                <td class="text-center wins-col">${user.wins ?? 0} / ${user.losses ?? 0}</td>
                <td class="text-center winrate-col">${user.win_rate ?? 0.0}%</td>
                <td class="text-end profit-col ${profitClass}">${utils.formatCurrency(user.net_profit ?? 0)}</td>
            `;
            tableBody.appendChild(tr);
        });

        if (loadingRow) loadingRow.style.display = 'none';
        if (noDataRow) noDataRow.style.display = 'none';

        // Update timestamp
        if (lastUpdatedSpan) {
            lastUpdatedSpan.textContent = new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
        }

        // Update active sort button/header indicator
        updateSortIndicators();
    }

    /** Fetches leaderboard data from the API */
    async function loadLeaderboardData() {
        if (isLoading) return; // Prevent multiple simultaneous loads
        isLoading = true;
        hideError();
        if (loadingRow) loadingRow.style.display = 'table-row';
        if (noDataRow) noDataRow.style.display = 'none';
        // Clear existing rows when loading new sort/refresh
        tableBody.querySelectorAll('tr:not(#loadingRow):not(#noDataRow)').forEach(row => row.remove());
        if (refreshBtn) utils.toggleButtonLoading(refreshBtn, true);

        try {
            // Pass currentSort to the API
            const apiUrl = `/api/leaderboard?sort_by=${currentSort}`;
            console.log(`[Leaderboard] Fetching data from: ${apiUrl}`);
            const response = await utils.getData(apiUrl); // Expecting { leaderboard: [], sorted_by: '...' }
            
            if (response && response.leaderboard) {
                 currentSort = response.sorted_by || currentSort; // Update sort state if API confirms it
                 renderLeaderboard(response.leaderboard);
            } else {
                 console.error("[Leaderboard] Invalid API response structure:", response);
                 showError("Uventet svarformat fra serveren.");
                 renderLeaderboard([]); // Render empty state
            }
        } catch (error) {
            console.error("[Leaderboard] Error loading data:", error);
            showError(error.message || 'Kunne ikke hente leaderboard data.');
            renderLeaderboard([]); // Render empty state on error
        } finally {
            isLoading = false;
            if (refreshBtn) utils.toggleButtonLoading(refreshBtn, false);
            if (loadingRow) loadingRow.style.display = 'none'; // Ensure loading is hidden even on error
        }
    }

    // --- Event Listeners ---
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadLeaderboardData);
    }

    sortButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sortBy = button.dataset.sort;
            if (sortBy && sortBy !== currentSort) {
                console.log(`[Leaderboard] Sort criteria changed to: ${sortBy}`);
                currentSort = sortBy;
                loadLeaderboardData(); // Reload data with new sort
            }
        });
    });
    // --- End Event Listeners ---

    /** Updates visual indicators for the active sort button and table header */
    function updateSortIndicators() {
        // Update buttons
        sortButtons.forEach(button => {
            if (button.dataset.sort === currentSort) {
            button.classList.add('active');
            button.classList.remove('btn-outline-secondary');
            button.classList.add('btn-primary');
        } else {
            button.classList.remove('active');
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline-secondary');
        }
    });

    // Update table headers (optional: add sort direction icon)
    sortableHeaders.forEach(header => {
        const sortIcon = header.querySelector('.sort-icon');
        if (header.dataset.sort === currentSort) {
            header.classList.add('active-sort');
            if (sortIcon) sortIcon.className = 'sort-icon bi bi-arrow-down'; // Indicate descending sort
        } else {
            header.classList.remove('active-sort');
             if (sortIcon) sortIcon.className = 'sort-icon bi'; // Reset icon
        }
    });
    } // End updateSortIndicators

    // --- Initial Load ---
    console.log("[Leaderboard] Performing initial data load...");
    loadLeaderboardData();

}); // End DOMContentLoaded
