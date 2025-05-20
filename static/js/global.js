// static/js/global.js (Version Utils Update)

document.addEventListener('DOMContentLoaded', () => {
    console.log("[global.js] DOMContentLoaded event fired (Utils Update).");

    // --- Read data attributes from body ---
    const bodyElement = document.body;
    if (bodyElement) {
        try {
            // Read isAdmin (expecting 'true' or 'false' string from tojson)
            const isAdminAttr = bodyElement.getAttribute('data-is-admin');
            window.isAdmin = JSON.parse(isAdminAttr || 'false'); // Parse JSON string to boolean

            // Read userBalance (expecting a number string)
            const balanceAttr = bodyElement.getAttribute('data-user-balance');
            window.userBalance = parseFloat(balanceAttr || '0.0'); // Parse string to float

            console.log(`[global.js] Read from body data: isAdmin=${window.isAdmin}, userBalance=${window.userBalance}`);
        } catch (e) {
            console.error("[global.js] Error reading or parsing data attributes from body:", e);
            // Keep the default values set in base.html's inline script
            window.isAdmin = window.isAdmin || false;
            window.userBalance = window.userBalance || 0.0;
        }
    } else {
        console.error("[global.js] Could not find document.body to read data attributes.");
    }

    // --- Dependency Check (window.utils) ---
    // Tjekker for funktioner brugt af updateCommonUserDataUI
    if (typeof window.utils === 'undefined' ||
        !window.utils.getData ||
        !window.utils.formatCurrency ||
        !window.utils.escapeHtml) { // escapeHtml er god at have
        console.error("[global.js] CRITICAL: window.utils object or required functions (getData, formatCurrency, escapeHtml) missing!");
        // Vis en mindre påtrængende fejl, da det "kun" er UI opdatering, ikke kernefunktionalitet
        const body = document.body;
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.bottom = '10px';
        errorDiv.style.right = '10px';
        errorDiv.style.zIndex = '2000';
        errorDiv.className = 'alert alert-warning alert-sm mb-0 p-2 small'; // Lille advarsel
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i> UI opdateringsfejl.';
        if (body) {
            body.appendChild(errorDiv);
            // Fjern den efter et par sekunder
            setTimeout(() => errorDiv.remove(), 5000);
        }
        // Lad scriptet fortsætte, siden kan stadig fungere.
    } else {
        console.log("[global.js] window.utils object and required functions verified.");
        // Kald funktionen for at hente og opdatere data ved side load, KUN hvis utils er OK
        updateCommonUserDataUI();

        // Overvej om periodisk opdatering er nødvendig (kun hvis utils er OK)
        // const refreshInterval = 60000; // F.eks. hvert minut
        // setInterval(updateCommonUserDataUI, refreshInterval);
        // console.log(`[global.js] Automatic UI refresh scheduled every ${refreshInterval / 1000} seconds.`);
    }

    // --- Fjernet Global Fetch Override ---
    // Den udkommenterede fetch override kode er fjernet,
    // da utils.js (getData, postData etc.) nu håndterer API kald og CSRF.

}); // End DOMContentLoaded


/**
 * Funktion til at opdatere fælles UI elementer (sidebar, topbar) med FRISK data fra API.
 * Bruges til at modvirke stale session data for balance osv.
 * Nu afhængig af window.utils.
 */
const updateCommonUserDataUI = async () => {
    // Tjek om brugeren er logget ind (global variabel)
    if (!window.currentUser) {
        // console.log("[updateCommonUserDataUI] User not logged in, skipping UI data refresh.");
        return;
    }

    // Tjek om nødvendige utils funktioner er til stede (igen, for en sikkerheds skyld)
    if (typeof window.utils?.getData !== 'function' || typeof window.utils?.formatCurrency !== 'function') {
         console.error("[updateCommonUserDataUI] Missing required utils functions (getData, formatCurrency). Aborting update.");
         return;
    }

    console.log(`[updateCommonUserDataUI] Attempting refresh using utils.getData for user: ${window.currentUser}`);

    try {
        // --- Brug utils.getData til at hente stats ---
        const freshData = await window.utils.getData(`/api/user/stats/${window.currentUser}`);
        console.log("[updateCommonUserDataUI] Fresh data received:", freshData);

        // --- Opdater DOM elementer (MED tjek om de findes og brug af utils) ---

        // 1. Sidebar Balance
        const sidebarBalanceElement = document.querySelector('.sidebar-balance');
        if (sidebarBalanceElement) {
            if (freshData.balance !== undefined) {
                // Brug utils.formatCurrency
                sidebarBalanceElement.innerHTML = `<i class="bi bi-wallet2 me-1"></i> ${window.utils.formatCurrency(freshData.balance)}`;
                // console.log("[updateCommonUserDataUI] Sidebar balance updated.");
            } else {
                 console.warn("[updateCommonUserDataUI] Sidebar balance element found, but balance missing in API response.");
            }
        } else {
            // console.warn("[updateCommonUserDataUI] Sidebar balance element (.sidebar-balance) not found.");
        }

        // 2. Sidebar Brugerinfo (UID, Inviteret af)
        const sidebarUidSpan = document.getElementById('sidebarUid');
        if (sidebarUidSpan && freshData.uid !== undefined) {
            // UID er typisk sikkert, men escape for en sikkerheds skyld
            sidebarUidSpan.textContent = window.utils.escapeHtml ? window.utils.escapeHtml(freshData.uid) : freshData.uid;
            // console.log("[updateCommonUserDataUI] Sidebar UID updated.");
        }

        const sidebarInvitedBySpan = document.getElementById('sidebarInvitedBy');
        if (sidebarInvitedBySpan && freshData.invited_by !== undefined) {
            const invitedByText = freshData.invited_by || 'N/A';
            sidebarInvitedBySpan.textContent = window.utils.escapeHtml ? window.utils.escapeHtml(invitedByText) : invitedByText;
            // console.log("[updateCommonUserDataUI] Sidebar InvitedBy updated.");
        }

        // 3. Sidebar & Topbar Avatar
        const newAvatarUrl = freshData.avatar_url; // Hent fra API
        if (newAvatarUrl) {
            // Escape URL for en sikkerheds skyld, selvom det sjældent er nødvendigt for src
            const safeAvatarUrl = window.utils.escapeHtml ? window.utils.escapeHtml(newAvatarUrl) : newAvatarUrl;
            const sidebarAvatarImg = document.querySelector('.sidebar-avatar');
            if (sidebarAvatarImg) {
                sidebarAvatarImg.src = safeAvatarUrl;
                // console.log("[updateCommonUserDataUI] Sidebar avatar updated.");
            }

            const topbarAvatarImg = document.getElementById('topbarAvatarImg');
            if (topbarAvatarImg) {
                topbarAvatarImg.src = safeAvatarUrl;
                // console.log("[updateCommonUserDataUI] Topbar avatar updated.");
            }
        } else {
             // console.warn("[updateCommonUserDataUI] Avatar URL missing in API response.");
        }

        // 4. Topbar Brugernavn
         const apiUsername = freshData.username;
         const topbarUsernameSpan = document.getElementById('topbarUsernameSpan');
         if (topbarUsernameSpan && apiUsername) {
              const safeUsername = window.utils.escapeHtml ? window.utils.escapeHtml(apiUsername) : apiUsername;
              // Simple title case (lokal logik er ok her)
             topbarUsernameSpan.textContent = safeUsername.charAt(0).toUpperCase() + safeUsername.slice(1).toLowerCase();
             // console.log("[updateCommonUserDataUI] Topbar username updated.");
         }


        // console.log("[updateCommonUserDataUI] Common UI elements updated successfully.");

    } catch (error) {
        // Fejl håndteres nu af utils.getData, som typisk kaster en Error med en .message
        console.error("[updateCommonUserDataUI] Error fetching or processing fresh user data:", error.message || error);
        // Vis evt. en subtil fejl via toast?
        // window.utils.showToast("Kunne ikke opdatere brugerinfo.", "warning", 3000);
    }
};

    // --- Notification Dropdown Logic ---
    const notificationDropdownContainer = document.getElementById('notificationDropdownContainer');
    const notificationDropdownToggle = document.getElementById('notificationDropdownToggle');
    const notificationDropdownList = document.getElementById('notificationDropdownList');
    const notificationUnreadCount = document.getElementById('notificationUnreadCount');
    const notificationLoadingItem = document.getElementById('notificationLoadingItem');
    const notificationNoDataItem = document.getElementById('notificationNoDataItem');
    const socket = window.globalSocket; // Use the global socket

    function renderNotificationItem(notification) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.classList.add('dropdown-item', 'notification-item');
        if (!notification.is_read) {
            a.classList.add('unread');
        }
        a.href = notification.link || '#';
        // Store ID for marking as read later if needed
        a.dataset.notificationId = notification.id;

        let iconHtml = '';
        if (notification.icon) {
            iconHtml = `<i class="${window.utils.escapeHtml(notification.icon)} me-2"></i> `;
        }

        a.innerHTML = `${iconHtml}${window.utils.escapeHtml(notification.message)}
                       <small class="d-block text-muted mt-1">${window.utils.formatDateTime(notification.created_at, true)}</small>`;

        // If there's a link and it's not just '#', open in current tab
        if (notification.link && notification.link !== '#') {
            a.addEventListener('click', (e) => {
                // Optionally mark as read before navigating
                // markNotificationAsRead(notification.id);
                // No e.preventDefault() to allow navigation
            });
        } else {
            a.addEventListener('click', (e) => e.preventDefault()); // Prevent action if no real link
        }

        li.appendChild(a);
        return li;
    }

    async function fetchAndDisplayNotifications() {
        if (!window.currentUser || !notificationDropdownList || !notificationLoadingItem || !notificationNoDataItem || !notificationUnreadCount) {
            if (notificationDropdownContainer) notificationDropdownContainer.style.display = 'none'; // Hide if no user
            return;
        }
        if (notificationDropdownContainer) notificationDropdownContainer.style.display = 'block'; // Show if user

        notificationLoadingItem.style.display = 'block';
        notificationNoDataItem.style.display = 'none';
        // Clear old notifications except loading/no-data
        notificationDropdownList.querySelectorAll('li:not(#notificationLoadingItem):not(#notificationNoDataItem):not(.dropdown-header):not(.dropdown-divider)').forEach(item => item.remove());

        let unreadCount = 0;

        try {
            const data = await window.utils.getData('/api/notifications?limit=7'); // Fetch recent 7
            notificationLoadingItem.style.display = 'none';

            if (data && data.notifications && data.notifications.length > 0) {
                data.notifications.forEach(notif => {
                    const item = renderNotificationItem(notif);
                    // Insert after the header and divider, before the "See All" link
                    const seeAllLinkItem = notificationDropdownList.querySelector('li:last-child');
                    if (seeAllLinkItem && seeAllLinkItem.previousElementSibling && seeAllLinkItem.previousElementSibling.classList.contains('dropdown-divider')) {
                        notificationDropdownList.insertBefore(item, seeAllLinkItem.previousElementSibling);
                    } else { // Fallback if structure is unexpected
                        notificationDropdownList.appendChild(item);
                    }
                    if (!notif.is_read) {
                        unreadCount++;
                    }
                });
            } else {
                notificationNoDataItem.style.display = 'block';
            }

            updateUnreadCount(data.unread_total || unreadCount); // Use total from API if available

        } catch (error) {
            console.error("Error fetching notifications:", error);
            notificationLoadingItem.style.display = 'none';
            notificationNoDataItem.textContent = 'Fejl ved hentning.';
            notificationNoDataItem.style.display = 'block';
            updateUnreadCount(0);
        }
    }

    function updateUnreadCount(count) {
        if (!notificationUnreadCount) return;
        const numCount = parseInt(count, 10);
        if (numCount > 0) {
            notificationUnreadCount.textContent = numCount > 9 ? '9+' : numCount.toString();
            notificationUnreadCount.style.display = 'inline-block';
        } else {
            notificationUnreadCount.style.display = 'none';
        }
    }

    if (socket && notificationDropdownList) {
        socket.on('new_notification', (notification) => {
            console.log("New notification received via WebSocket:", notification);
            if (notificationLoadingItem) notificationLoadingItem.style.display = 'none';
            if (notificationNoDataItem) notificationNoDataItem.style.display = 'none';

            const newItem = renderNotificationItem(notification);
            // Insert after the header and divider
            const firstRealItem = notificationDropdownList.querySelector('li:not(.dropdown-header):not(.dropdown-divider)');
            if (firstRealItem) {
                 notificationDropdownList.insertBefore(newItem, firstRealItem);
            } else { // If list was empty (except headers/dividers)
                 const seeAllLinkItem = notificationDropdownList.querySelector('li:last-child');
                 if (seeAllLinkItem && seeAllLinkItem.previousElementSibling && seeAllLinkItem.previousElementSibling.classList.contains('dropdown-divider')) {
                    notificationDropdownList.insertBefore(newItem, seeAllLinkItem.previousElementSibling);
                 } else {
                    notificationDropdownList.appendChild(newItem);
                 }
            }

            // Update unread count
            const currentCount = parseInt(notificationUnreadCount.textContent || '0', 10);
            updateUnreadCount(currentCount + 1);
            window.utils.showToast(`Ny notifikation: ${notification.message.substring(0,30)}...`, 'info');
        });
    }

    if (notificationDropdownToggle) {
        notificationDropdownToggle.addEventListener('show.bs.dropdown', async () => {
            // Fetch fresh notifications when dropdown is opened
            await fetchAndDisplayNotifications();

            // Mark all as read when dropdown is opened if there are unread ones
            const currentUnread = parseInt(notificationUnreadCount.textContent || '0', 10);
            if (currentUnread > 0) {
                try {
                    await window.utils.postData('/api/notifications/mark_read', { all: true });
                    updateUnreadCount(0); // Visually update immediately
                    // Make items appear read
                    notificationDropdownList.querySelectorAll('.notification-item.unread').forEach(item => {
                        item.classList.remove('unread');
                    });
                } catch (error) {
                    console.error("Error marking notifications as read:", error);
                    // Don't show toast for this, as it's a background action
                }
            }
        });
    }

    // Initial fetch if user is logged in
    if (window.currentUser) {
        fetchAndDisplayNotifications();
    } else {
        if (notificationDropdownContainer) notificationDropdownContainer.style.display = 'none';
    }
    // --- End Notification Dropdown Logic ---

// Initialiseringskaldet er flyttet IND i DOMContentLoaded eventet og afhænger af utils checket.
