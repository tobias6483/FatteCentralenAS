// static/js/messages.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("[Messages.js] Initializing...");

    // --- Dependency Check ---
    if (typeof window.utils === 'undefined' || !window.utils.getData || !window.utils.escapeHtml) {
        console.error("[Messages.js] CRITICAL: window.utils object or required functions missing!");
        // Optionally display an error to the user
        return;
    }

    // --- Recipient Search Functionality (for compose_message.html) ---
    const searchInput = document.getElementById('recipientSearchInput');
    const resultsContainer = document.getElementById('recipientSearchResults');
    const hiddenRecipientInput = document.getElementById('recipient_username'); // The actual form input
    let searchTimeout;

    if (searchInput && resultsContainer && hiddenRecipientInput) {
        console.log("[Messages.js] Initializing recipient search.");

        // Pre-fill search input if hidden input has a value (e.g., from reply)
        if (hiddenRecipientInput.value) {
            searchInput.value = hiddenRecipientInput.value;
        }

        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';

            if (query.length < 2) {
                return;
            }

            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `<div class="list-group-item text-muted small"><div class="spinner-border spinner-border-sm me-1" role="status"></div> Søger...</div>`;

            searchTimeout = setTimeout(async () => {
                try {
                    const apiUrl = `/messages/api/search_recipients?q=${encodeURIComponent(query)}&limit=5`;
                    const users = await window.utils.getData(apiUrl); // Use utils

                    resultsContainer.innerHTML = ''; // Clear "Søger..."
                    if (users && users.length > 0) {
                        users.forEach(user => {
                            const item = document.createElement('a');
                            item.href = '#';
                            item.className = 'list-group-item list-group-item-action d-flex align-items-center search-result-item';
                            item.dataset.username = user.username;

                            const avatarUrl = user.avatar_url || '/static/avatars/default_avatar.png';
                            const escapedUsername = window.utils.escapeHtml(user.username);

                            item.innerHTML = `
                                <img src="${avatarUrl}" alt="${escapedUsername}" class="rounded-circle me-2" width="30" height="30">
                                <span>${escapedUsername}</span>
                            `;
                            item.addEventListener('click', function (e) {
                                e.preventDefault();
                                const selectedUsername = this.dataset.username;
                                searchInput.value = selectedUsername;
                                hiddenRecipientInput.value = selectedUsername; // Update hidden input
                                resultsContainer.innerHTML = '';
                                resultsContainer.style.display = 'none';
                            });
                            resultsContainer.appendChild(item);
                        });
                    } else {
                        resultsContainer.innerHTML = '<div class="list-group-item text-muted small">Ingen brugere fundet.</div>';
                    }
                } catch (error) {
                    console.error('Error fetching recipients:', error);
                    resultsContainer.innerHTML = `<div class="list-group-item text-danger small">Fejl ved søgning: ${window.utils.escapeHtml(error.message || 'Ukendt fejl')}</div>`;
                }
            }, 350); // Debounce
        });

        // Hide results when clicking outside
        document.addEventListener('click', function(event) {
            if (!searchInput.contains(event.target) && !resultsContainer.contains(event.target)) {
                resultsContainer.style.display = 'none';
            }
        });
    } else {
         // Only log warning if we expect the elements (i.e., on compose page)
         if (document.querySelector('.compose-message-card')) {
            console.warn("[Messages.js] Recipient search elements not found on compose page.");
         }
    }

    // --- Contacts Header Functionality (for inbox.html / sent.html) ---
    const contactsHeaderContainer = document.getElementById('contactsHeaderContainer');

    async function loadContactsHeader() {
        if (!contactsHeaderContainer) return; // Only run if the container exists

        console.log("[Messages.js] Loading contacts header data...");
        contactsHeaderContainer.innerHTML = `<div class="text-muted small fst-italic"><div class="spinner-border spinner-border-sm me-1" role="status"></div> Indlæser aktive brugere...</div>`; // Loading state

        try {
            const apiUrl = `/messages/api/contacts_status?limit=15`; // Fetch more contacts
            const contacts = await window.utils.getData(apiUrl);

            contactsHeaderContainer.innerHTML = ''; // Clear loading state

            if (contacts && contacts.length > 0) {
                contacts.forEach(contact => {
                    const contactLink = document.createElement('a');
                    contactLink.href = `/profile?username=${encodeURIComponent(contact.username)}`; // Link to profile
                    contactLink.className = 'contact-avatar-link position-relative';
                    contactLink.title = window.utils.escapeHtml(contact.username);

                    const avatarUrl = contact.avatar_url || '/static/avatars/default_avatar.png';
                    const escapedUsername = window.utils.escapeHtml(contact.username);

                    contactLink.innerHTML = `
                        <img src="${avatarUrl}" alt="${escapedUsername}" class="rounded-circle" width="40" height="40">
                        ${contact.is_online ? '<span class="online-indicator-dot position-absolute bottom-0 end-0 border border-light rounded-circle bg-success p-1" title="Online"></span>' : ''}
                    `;
                    contactsHeaderContainer.appendChild(contactLink);
                });
            } else {
                contactsHeaderContainer.innerHTML = `<div class="text-muted small fst-italic">Ingen aktive brugere fundet.</div>`;
            }
        } catch (error) {
            console.error('Error fetching contacts status:', error);
            contactsHeaderContainer.innerHTML = `<div class="text-danger small fst-italic"><i class="bi bi-exclamation-triangle-fill me-1"></i> Fejl</div>`;
        }
    }

    // Load contacts header if the container exists on the current page
    if (contactsHeaderContainer) {
        loadContactsHeader();
    }

    // --- User Search Functionality (for messages/inbox.html and messages/sent.html) ---
    const messagesViewSearchInput = document.getElementById('messagesViewUserSearchInput');
    const messagesViewResultsContainer = document.getElementById('messagesViewUserSearchResults');
    let messagesViewSearchTimeout;

    if (messagesViewSearchInput && messagesViewResultsContainer) {
        console.log("[Messages.js] Initializing messages view user search.");

        messagesViewSearchInput.addEventListener('input', function () {
            clearTimeout(messagesViewSearchTimeout);
            const query = this.value.trim();
            messagesViewResultsContainer.innerHTML = '';
            messagesViewResultsContainer.style.display = 'none';

            if (query.length < 2) {
                return;
            }

            messagesViewResultsContainer.style.display = 'block';
            messagesViewResultsContainer.innerHTML = `<div class="list-group-item text-muted small"><div class="spinner-border spinner-border-sm me-1" role="status"></div> Søger...</div>`;

            messagesViewSearchTimeout = setTimeout(async () => {
                try {
                    const apiUrl = `/messages/api/search_recipients?q=${encodeURIComponent(query)}&limit=5`;
                    const users = await window.utils.getData(apiUrl);

                    messagesViewResultsContainer.innerHTML = ''; // Clear "Søger..."
                    if (users && users.length > 0) {
                        users.forEach(user => {
                            const item = document.createElement('a');
                            // Construct URL for composing message to this user
                            item.href = `/messages/compose/${encodeURIComponent(user.username)}`;
                            item.className = 'list-group-item list-group-item-action d-flex align-items-center search-result-item';
                            // No dataset needed as href handles the action

                            const avatarUrl = user.avatar_url || '/static/avatars/default_avatar.png';
                            const escapedUsername = window.utils.escapeHtml(user.username);

                            item.innerHTML = `
                                <img src="${avatarUrl}" alt="${escapedUsername}" class="rounded-circle me-2" width="30" height="30">
                                <span>${escapedUsername}</span>
                            `;
                            // No click listener needed to update hidden input, direct navigation via href
                            messagesViewResultsContainer.appendChild(item);
                        });
                    } else {
                        messagesViewResultsContainer.innerHTML = '<div class="list-group-item text-muted small">Ingen brugere fundet.</div>';
                    }
                } catch (error) {
                    console.error('Error fetching users for messages view search:', error);
                    messagesViewResultsContainer.innerHTML = `<div class="list-group-item text-danger small">Fejl ved søgning: ${window.utils.escapeHtml(error.message || 'Ukendt fejl')}</div>`;
                }
            }, 350); // Debounce
        });

        // Hide results when clicking outside
        document.addEventListener('click', function(event) {
            if (messagesViewSearchInput && messagesViewResultsContainer && !messagesViewSearchInput.contains(event.target) && !messagesViewResultsContainer.contains(event.target)) {
                messagesViewResultsContainer.style.display = 'none';
            }
        });
    } else {
        // Only log warning if we expect the elements (i.e., on inbox/sent page)
        if (document.querySelector('.messages-container')) { // A common class for these pages
            // Check if the specific input is missing, as it might be intentional on some views not to have it.
            if (!messagesViewSearchInput) {
                 console.log("[Messages.js] Messages view user search input not found (messagesViewUserSearchInput). This might be intentional.");
            }
        }
    }

    console.log("[Messages.js] Initialization complete.");
});