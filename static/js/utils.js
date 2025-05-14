// static/js/utils.js
console.log("utils.js loading...");

/**
 * @fileoverview
 * Centralized utility functions for the frontend JavaScript code.
 * Exposes functions under the global `window.utils` object.
 * Purpose: Reduce redundancy, standardize common tasks (API calls, UI feedback, formatting),
 * and improve maintainability.
 *
 * Dependencies:
 * - Bootstrap 5+ JavaScript (required for: showToast, toggleButtonLoading spinner, initializeTooltips)
 * - A mechanism to provide CSRF token (meta tag `csrf-token`, hidden input `csrf_token`, or `window.csrfToken` global variable).
 */
window.utils = (() => {
    'use strict'; // Enforce stricter parsing and error handling

    // ============================================
    // --- Global CSRF Token Management ---
    // ============================================
    let _csrfTokenCache = null;

    /**
     * Retrieves the CSRF token from standard locations (cache, meta tag, hidden input, window variable).
     * Prioritizes cache, then meta, then input, then window var.
     * Does NOT actively fetch here, only retrieves existing value.
     * @returns {string|null} CSRF token string or null if not found.
     */
    function getCsrfToken() {
        if (_csrfTokenCache) {
            // console.debug("[Utils.CSRF] Token retrieved from cache.");
            return _csrfTokenCache;
        }

        // 1. Try meta tag
        const tokenMeta = document.querySelector('meta[name="csrf-token"]');
        if (tokenMeta && tokenMeta.content && tokenMeta.content.trim()) {
            _csrfTokenCache = tokenMeta.content.trim();
            console.log("[Utils.CSRF] Token retrieved from meta tag and cached.");
            return _csrfTokenCache;
        }

        // 2. Try hidden input field (common with Flask-WTF)
        const tokenInput = document.querySelector('input[type="hidden"][name="csrf_token"]');
        if (tokenInput && tokenInput.value && tokenInput.value.trim()) {
            _csrfTokenCache = tokenInput.value.trim();
            console.log("[Utils.CSRF] Token retrieved from hidden input and cached.");
            return _csrfTokenCache;
        }

        // 3. Try window global variable (less common, but possible)
        if (window.csrfToken && typeof window.csrfToken === 'string' && window.csrfToken.trim()) {
             _csrfTokenCache = window.csrfToken.trim();
             console.log("[Utils.CSRF] Token retrieved from window.csrfToken and cached.");
             return _csrfTokenCache;
        }

        console.warn("[Utils.CSRF] Could not find CSRF token in standard locations (meta, input, window). Fetch might be required.");
        return null;
    }

    /**
     * Fetches a fresh CSRF token from the backend endpoint ('/auth/csrf_token').
     * Updates the internal cache and potentially window.csrfToken.
     * Recommended for use before sensitive operations if token might be stale.
     * @param {boolean} [force=false] - If true, forces a fetch even if a token exists in cache.
     * @returns {Promise<string|null>} Resolves with the fresh token string or null on failure.
     * @throws {Error} If fetching or processing fails.
     */
    async function fetchFreshCsrfToken(force = false) {
        if (!force && _csrfTokenCache) {
            return _csrfTokenCache;
        }
        console.debug("[Utils.CSRF] Attempting to fetch fresh CSRF token...");
        try {
            // Use the core fetchData to potentially leverage its error handling,
            // but simplify options as CSRF isn't needed *for* this fetch.
            const response = await fetch('/auth/csrf_token', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                let errMsg = `Failed to fetch CSRF token (Status: ${response.status})`;
                try {
                    const errJson = await response.json();
                    errMsg = errJson.error || errJson.message || errMsg;
                } catch (e) { /* Ignore if error response is not JSON */ }
                throw new Error(errMsg);
            }

            const data = await response.json();
            if (data && data.csrf_token) {
                 const newToken = data.csrf_token;
                 console.log("[Utils.CSRF] Successfully fetched fresh token.");
                _csrfTokenCache = newToken;
                // Optionally update window var if it exists, to keep things synced
                if (typeof window.csrfToken !== 'undefined') {
                    window.csrfToken = newToken;
                }
                return newToken;
            }
            throw new Error("Invalid JSON response format for CSRF token.");
        } catch (error) {
            console.error("[Utils.CSRF] Fetch/Process Error:", error);
            // Rethrow with a user-friendlier message (as per spec example)
            throw new Error(`Kunne ikke hente opdateret sikkerhedstoken: ${error.message}`);
        }
    }

    // ============================================
    // --- Core FETCH API Handling ---
    // ============================================

    /**
     * Central fetch function with automatic CSRF handling for protected methods,
     * JSON parsing, and detailed error reporting. This is the core of API interactions.
     * @param {string} url - The API endpoint URL.
     * @param {object} [options={}] - Standard Fetch API options (method, headers, body, etc.).
     * @param {boolean|null} [addCsrf=null] - Explicitly control CSRF: null=auto-detect based on method, true=always add, false=never add.
     * @param {boolean} [refreshCsrf=true] - Attempt to fetch a fresh CSRF token for methods that require it. Set to false to only use existing token.
     * @returns {Promise<any>} A Promise resolving with the parsed response body (JSON object, text string, or null for 204).
     * @throws {Error} A custom Error object upon failure. The error will have:
     *   - `message`: User-friendly error message (potentially from server JSON).
     *   - `status`: (number|undefined) The HTTP status code.
     *   - `responseJson`: (object|null) The parsed JSON error response from the server, if available.
     *   - `responseText`: (string) The raw text error response from the server.
     *   - `response`: (Response|undefined) The raw Fetch Response object.
     *   - `data`: (object) A standardized data object, often mirroring `responseJson` or containing { error: message, status: status }.
     *   - `isNetworkError`: (boolean|undefined) True if the error appears to be network-related (e.g., "Failed to fetch").
     */
    async function fetchData(url, options = {}, addCsrf = null, refreshCsrf = true) {
        const method = (options.method || 'GET').toUpperCase();
        const headers = new Headers(options.headers || {}); // Use Headers object for easier manipulation

        // Default Accept header if not provided
        if (!headers.has('Accept')) {
            headers.set('Accept', 'application/json, text/plain, */*');
        }

        // Determine if CSRF token is needed
        const requiresCsrf = addCsrf === null
            ? !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)
            : addCsrf;

        let body = options.body;

        // Handle CSRF Token for relevant methods
        if (requiresCsrf) {
            console.debug(`[Utils.Fetch] CSRF required for ${method} ${url}. Refresh attempt: ${refreshCsrf}`);
            let csrfToken = null;
            try {
                if (refreshCsrf) {
                    // Fetch fresh token for protected methods by default
                    csrfToken = await fetchFreshCsrfToken(true); // Force fetch
                } else {
                    csrfToken = getCsrfToken(); // Use existing if refresh is false
                    if (!csrfToken) {
                         console.warn("[Utils.Fetch] CSRF needed, but no token found and refresh is disabled. Trying one last fetch...");
                         csrfToken = await fetchFreshCsrfToken(true); // Try fetching as last resort
                     }
                }

                if (!csrfToken) {
                    throw new Error("Kunne ikke hente eller finde påkrævet sikkerhedstoken."); // User-friendly message
                }

                // Add token if not already present in headers
                if (!headers.has('X-CSRFToken') && !headers.has('X-CSRF-Token')) {
                    headers.set('X-CSRFToken', csrfToken); // Standard Flask-WTF header name
                    console.debug("[Utils.Fetch] Added X-CSRFToken header.");
                } else {
                    console.warn("[Utils.Fetch] CSRF header already present in provided options, fetched token not used to override.");
                }
            } catch (tokenError) {
                console.error(`[Utils.Fetch] CRITICAL: CSRF token handling failed for ${method} ${url}:`, tokenError);
                // Ensure thrown error is user-friendly
                const error = new Error(`Sikkerhedstoken problem: ${tokenError.message}`);
                error.isCsrfError = true; // Add flag for potential specific handling
                throw error;
            }
        }

        // Stringify body if it's a plain object and set Content-Type for relevant methods
        if (body && typeof body === 'object' && !(body instanceof Blob) && !(body instanceof FormData) && !(body instanceof URLSearchParams) && !(body instanceof ArrayBuffer)) {
            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                try {
                    body = JSON.stringify(body);
                    if (!headers.has('Content-Type')) {
                         headers.set('Content-Type', 'application/json');
                         console.debug("[Utils.Fetch] Body stringified, Content-Type set to application/json.");
                     }
                 } catch (e) {
                     console.error("[Utils.Fetch] Failed to stringify body:", e);
                     throw new Error("Intern data formateringsfejl."); // User-friendly message
                 }
            } else {
                // Body typically ignored by browsers for GET/HEAD, but clear it just in case
                body = undefined;
            }
         }

        const fetchOptions = { ...options, method, headers, body };
        console.debug(`[Utils.Fetch] Sending: ${method} ${url}`, { headers: Object.fromEntries(headers.entries()), hasBody: !!fetchOptions.body }); // Log headers safely

        try {
            const response = await fetch(url, fetchOptions);
            console.debug(`[Utils.Fetch] Received: ${method} ${url}, Status: ${response.status}`);

            // Handle Non-OK responses (>= 400)
            if (!response.ok) {
                let errorMsg = `Serverfejl (${response.status} ${response.statusText})`; // Default message
                let responseJson = null;
                let responseText = "";
                try {
                    // Try to read response body for more details
                    responseText = await response.text();
                    const contentType = response.headers.get("content-type") || "";
                     if (contentType.includes("application/json") && responseText) {
                         try {
                            responseJson = JSON.parse(responseText);
                            // Use server-provided error message if available
                            errorMsg = responseJson.error || responseJson.message || (typeof responseJson === 'string' ? responseJson : errorMsg);
                         } catch (parseError) {
                             console.warn(`[Utils.Fetch] Non-OK response has Content-Type JSON but failed to parse body: ${parseError}. Raw text: ${responseText.substring(0, 200)}`);
                             errorMsg = `Server fejl (${response.status}): Ugyldigt JSON fejlformat.`;
                         }
                    } else if (responseText) {
                        // Use text response directly if not JSON (or if JSON parsing failed)
                        errorMsg = responseText.substring(0, 200); // Limit length
                     }
                     console.error(`[Utils.Fetch] Non-OK Response (${response.status}, ${contentType}) from ${url}:`, responseText.substring(0, 500));
                } catch (e) {
                    console.error("[Utils.Fetch] Failed reading/parsing error response body:", e);
                    errorMsg = `Server fejl (${response.status}): Kunne ikke læse fejl detaljer.`;
                }

                 // Create a detailed error object as specified
                 const error = new Error(errorMsg); // Use the best message we found
                error.status = response.status;
                error.responseJson = responseJson; // Parsed JSON error body (or null)
                error.responseText = responseText; // Raw text error body
                 error.response = response; // The raw Response object
                // Standardized 'data' property for easier access in catch blocks
                error.data = responseJson || { error: errorMsg, status: response.status, responseText: responseText };
                 throw error; // Throw the enhanced error object
            }

            // Handle OK responses (2xx)
            if (response.status === 204 || response.headers.get('Content-Length') === '0') {
                return null; // No Content
            }

             const contentTypeSuccess = response.headers.get("content-type") || "";
             if (contentTypeSuccess.includes("application/json")) {
                 try {
                     return await response.json();
                 } catch (e) {
                     console.error(`[Utils.Fetch] OK response (${response.status}) has Content-Type JSON but failed to parse:`, e);
                     // Throw an error consistent with the non-OK format
                     const error = new Error(`Server fejl: Ugyldigt JSON svar (Status: ${response.status}).`);
                     error.status = response.status; // Include status even on success parse error
                     error.response = response;
                     error.data = { error: error.message, status: response.status };
                     throw error;
                 }
            } else {
                // Handle non-JSON success responses as text
                try {
                    return await response.text();
                } catch (e) {
                    console.error(`[Utils.Fetch] OK response (${response.status}) could not be read as text:`, e);
                    const error = new Error(`Server fejl: Kunne ikke læse tekst svar (Status: ${response.status}).`);
                    error.status = response.status;
                    error.response = response;
                    error.data = { error: error.message, status: response.status };
                    throw error;
                }
            }

        } catch (error) {
             // Catch network errors (TypeError) and re-throw consistently
             if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('Load failed'))) {
                 console.error(`[Utils.Fetch] Network Error: ${method} ${url}`, error);
                 const networkError = new Error(`Netværksfejl (${method} ${url}). Tjek din internetforbindelse.`);
                networkError.isNetworkError = true;
                 networkError.data = { error: networkError.message, isNetworkError: true };
                 throw networkError;
            }

            // Ensure errors caught (including CSRF, JSON parse errors, etc.) have the standard properties
            if (!error.data) {
                error.data = { error: error.message, status: error.status || 0 };
            }
            if (error.status === undefined) { // e.g., CSRF error before fetch
                 error.status = 0; // Indicate non-HTTP error origin
            }

             console.error(`[Utils.Fetch] Final Caught Error: ${method} ${url}, Status: ${error.status}, Msg:`, error.message, error);
            throw error; // Re-throw the processed error
        }
    }

    // ============================================
    // --- API Function Wrappers ---
    // ============================================

    /**
     * Performs an asynchronous GET request.
     * @param {string} url - The API endpoint.
     * @param {object} [options={}] - Additional Fetch options (e.g., headers).
     * @returns {Promise<object>} A promise resolving with the parsed JSON response.
     * @throws {Error} Enhanced error object on failure (see `fetchData`).
     */
    function getData(url, options = {}) {
        // For GET requests that are expected to return JSON, explicitly set Accept header.
        const getOptions = { ...options, method: 'GET' };
        if (!getOptions.headers) {
            getOptions.headers = {};
        }
        if (!getOptions.headers['Accept']) {
            getOptions.headers['Accept'] = 'application/json';
        }
        // CSRF is typically not needed for GET, so explicitly set addCsrf=false
        return fetchData(url, getOptions, false);
    }

    /**
     * Performs an asynchronous POST request with JSON payload.
     * Automatically handles CSRF token refresh and inclusion.
     * @param {string} url - The API endpoint.
     * @param {object | null} [payload={}] - The JavaScript object to send as JSON body. Can be null.
     * @param {object} [options={}] - Additional Fetch options (e.g., custom headers).
     * @returns {Promise<object>} A promise resolving with the parsed JSON response.
     * @throws {Error} Enhanced error object on failure (see `fetchData`).
     */
    function postData(url, payload = {}, options = {}) {
        // Uses fetchData defaults: method='POST', refreshCsrf=true
        return fetchData(url, { ...options, method: 'POST', body: payload });
    }

    /**
     * Performs an asynchronous PUT request with JSON payload.
     * Automatically handles CSRF token refresh and inclusion.
     * @param {string} url - The API endpoint.
     * @param {object | null} [payload={}] - The JavaScript object to send as JSON body. Can be null.
     * @param {object} [options={}] - Additional Fetch options.
     * @returns {Promise<object>} A promise resolving with the parsed JSON response.
     * @throws {Error} Enhanced error object on failure (see `fetchData`).
     */
    function putData(url, payload = {}, options = {}) {
        // Uses fetchData defaults: method='PUT', refreshCsrf=true
        return fetchData(url, { ...options, method: 'PUT', body: payload });
    }

    /**
     * Performs an asynchronous DELETE request.
     * Automatically handles CSRF token refresh and inclusion.
     * @param {string} url - The API endpoint.
     * @param {object | null} [payload=null] - Optional body for DELETE, typically null.
     * @param {object} [options={}] - Additional Fetch options.
     * @returns {Promise<object | null>} A promise resolving with the parsed JSON response (or null if 204).
     * @throws {Error} Enhanced error object on failure (see `fetchData`).
     */
    function deleteData(url, payload = null, options = {}) {
         // Allow body for DELETE if provided, otherwise default behavior (no body)
         const fetchOptions = payload !== null ? { ...options, method: 'DELETE', body: payload } : { ...options, method: 'DELETE' };
        // Uses fetchData defaults: refreshCsrf=true
        return fetchData(url, fetchOptions);
    }


    // ============================================
    // --- UI / Feedback Functions ---
    // ============================================

    /**
     * Displays a Bootstrap Toast notification.
     * Requires a container element with class `.toast-container` in the HTML (e.g., in base.html).
     * Requires Bootstrap 5+ JS to be loaded.
     * @param {string} message - The message text to display. HTML will be escaped.
     * @param {'info'|'success'|'warning'|'danger'|'primary'|'secondary'|'light'|'dark'} [type='info'] - The type of toast, determining its appearance (maps to Bootstrap bg-* classes).
     * @param {number} [duration=3000] - How long the toast should be visible in milliseconds. Set to 0 for a persistent toast that requires manual closing.
     */
    function showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.querySelector('.toast-container'); // Standard BS5 container class
        if (!toastContainer) {
            console.error("[Utils.UI] Toast container element (.toast-container) not found in the DOM.");
            // Fallback: alert the message so it's not lost
            alert(`(${type.toUpperCase()}) ${message}`);
            return;
        }

        // Check if Bootstrap Toast component is available
        if (typeof bootstrap === 'undefined' || typeof bootstrap.Toast !== 'function') {
            console.warn("[Utils.UI] Bootstrap Toast JS component not available. Cannot show toast.");
            // Fallback: alert the message
             alert(`(${type.toUpperCase()}) ${message}`);
            return;
        }

        // Sanitize type to prevent unexpected classes
        const validTypes = ['info', 'success', 'warning', 'danger', 'primary', 'secondary', 'light', 'dark'];
        const safeType = validTypes.includes(type) ? type : 'info';

        const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const bgClass = `bg-${safeType}`;
        // Determine text color based on background for contrast (Bootstrap 5 standard pairs)
        const textClass = ['warning', 'light', 'info'].includes(safeType) ? 'text-dark' : 'text-white';
        // Adjust close button color for contrast
        const closeButtonClass = ['warning', 'light', 'info'].includes(safeType) ? '' : 'btn-close-white';

        // Create toast HTML dynamically, ensuring message is escaped
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center ${textClass} ${bgClass} border-0 fade" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${duration > 0 ? duration : 5000}" data-bs-autohide="${duration > 0}">
                <div class="d-flex">
                    <div class="toast-body">${escapeHtml(message)}</div>
                    <button type="button" class="btn-close ${closeButtonClass} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>`;

        // Insert into container
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        const toastElement = document.getElementById(toastId);
        if (!toastElement) {
            console.error("[Utils.UI] Failed to find newly created toast element by ID:", toastId);
            return;
        }

        try {
            // Create Bootstrap Toast instance
            const toastOptions = {
                autohide: duration > 0,
                delay: duration > 0 ? duration : 5000 // BS requires a delay even if autohide is false, 5000 is default
            };
            const bootstrapToast = new bootstrap.Toast(toastElement, toastOptions);

            // Add event listener to remove the element from DOM after it's hidden
            toastElement.addEventListener('hidden.bs.toast', () => {
                // Optional: double check instance exists before dispose? Usually not needed here.
                // const instance = bootstrap.Toast.getInstance(toastElement);
                // if (instance) { instance.dispose(); }
                toastElement.remove();
                console.debug(`[Utils.UI] Toast #${toastId} hidden and removed.`);
            }, { once: true }); // Use once: true for automatic listener removal

            // Show the toast
            bootstrapToast.show();
            console.debug(`[Utils.UI] Showing toast #${toastId} (Type: ${safeType}, Duration: ${duration})`);

        } catch (e) {
            console.error("[Utils.UI] Error initializing or showing Bootstrap Toast:", e);
            // Clean up the element if showing failed
            toastElement.remove();
             alert(`(${type.toUpperCase()}) ${message}`); // Fallback
        }
    }

    /**
     * Displays flash messages received from the server (e.g., via API response).
     * Assumes flashes are structured as an array. Each item can be:
     * - An array: `[message, category]` (e.g., Flask's `get_flashed_messages(with_categories=True)`)
     * - An object: `{ message: "...", category: "..." }`
     * Calls `utils.showToast` for each flash message.
     * @param {Array<Array<string>|object> | null | undefined} flashesArray - The array of flash messages.
     */
    function displayFlashes(flashesArray) {
        if (!Array.isArray(flashesArray) || flashesArray.length === 0) {
            return; // Nothing to display
        }

        if (typeof showToast !== 'function') {
            console.warn("[Utils.UI] utils.showToast function is not available. Cannot display flashes.");
            return;
        }

        console.debug("[Utils.UI] Processing flash messages:", flashesArray);

        flashesArray.forEach((flash, index) => {
            let message = '';
            let category = 'info'; // Default category

            if (Array.isArray(flash) && flash.length >= 1) {
                // Handle [message, category] or [message] format
                message = flash[0];
                category = flash[1] || 'info'; // Use 'info' if category is missing
            } else if (typeof flash === 'object' && flash !== null && flash.hasOwnProperty('message')) {
                // Handle { message: "...", category: "..." } format
                message = flash.message;
                category = flash.category || 'info';
            } else if (typeof flash === 'string') {
                 // Handle simple array of strings
                 message = flash;
                 category = 'info';
             } else {
                 console.warn(`[Utils.UI] Skipping flash item at index ${index} due to unrecognized format:`, flash);
                 return; // Skip this item
             }

            // Map common Flask categories to Bootstrap types if needed
             let toastType = (category || 'info').toLowerCase();
             if (toastType === 'error') toastType = 'danger'; // Map 'error' to 'danger'
             else if (toastType === 'message') toastType = 'info'; // Map 'message' to 'info'

            // Ensure message is a string before showing
             if (typeof message !== 'string') {
                 console.warn(`[Utils.UI] Flash message at index ${index} is not a string:`, message);
                 message = String(message); // Attempt to convert to string
             }

            if (message) {
                showToast(message, toastType);
            }
        });
    }


    /**
     * Toggles the visual loading state of a button element.
     * Disables the button, shows a spinner and optional loading text,
     * and restores the original state when loading is finished.
     * Requires Bootstrap 5+ CSS/JS for the spinner styling.
     * Recommendation: Use a structure like `<button><span class="btn-text">Save</span></button>`
     * for more reliable text restoration, especially if the button contains icons.
     * @param {HTMLElement} buttonElement - The button element (<button> or <input type="button/submit">).
     * @param {boolean} isLoading - `true` to show loading state, `false` to restore normal state.
     * @param {string | null} [loadingText='Gemmer...'] - Text to display next to the spinner while loading. If null, only spinner is shown.
     */
    function toggleButtonLoading(buttonElement, isLoading, loadingText = 'Gemmer...') {
        // Check for a valid button element
        if (
            !buttonElement ||
            typeof buttonElement.disabled === 'undefined' ||
            (buttonElement.tagName !== 'INPUT' && typeof buttonElement.innerHTML === 'undefined') ||
            (buttonElement.tagName === 'INPUT' && typeof buttonElement.value === 'undefined')
        ) {
            console.warn("[Utils.UI] toggleButtonLoading: Invalid buttonElement provided.", buttonElement);
            return;
        }

        const IS_LOADING_CLASS = 'is-loading'; // Class to mark loading state
        const ORIGINAL_TEXT_ATTR = 'data-original-text'; // Attribute to store original text
        const ORIGINAL_HTML_ATTR = 'data-original-html'; // Attribute to store original inner HTML (more robust)
        const SPINNER_SELECTOR = '.spinner-border'; // Selector for the spinner element

        if (isLoading) {
            if (buttonElement.classList.contains(IS_LOADING_CLASS)) return; // Already loading

            // Store original content
            if (buttonElement.tagName !== 'INPUT' && !buttonElement.hasAttribute(ORIGINAL_HTML_ATTR)) {
                 buttonElement.setAttribute(ORIGINAL_HTML_ATTR, buttonElement.innerHTML);
            }
            if (buttonElement.tagName === 'INPUT' && !buttonElement.hasAttribute(ORIGINAL_TEXT_ATTR)) {
                buttonElement.setAttribute(ORIGINAL_TEXT_ATTR, buttonElement.value);
            }

            const spinnerHtml = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;

            if (buttonElement.tagName === 'INPUT') {
                 buttonElement.value = loadingText || '';
            } else {
                 buttonElement.innerHTML = `${spinnerHtml} ${loadingText ? escapeHtml(loadingText) : ''}`;
             }

            buttonElement.disabled = true;
            buttonElement.classList.add(IS_LOADING_CLASS);
            console.debug("[Utils.UI] Button loading started:", buttonElement);

        } else {
            if (!buttonElement.classList.contains(IS_LOADING_CLASS)) return; // Not loading

            const originalHtml = buttonElement.getAttribute(ORIGINAL_HTML_ATTR);
            if (originalHtml !== null) {
                 if (buttonElement.tagName !== 'INPUT') {
                     buttonElement.innerHTML = originalHtml;
                 }
                 buttonElement.removeAttribute(ORIGINAL_HTML_ATTR);
            }

            const originalText = buttonElement.getAttribute(ORIGINAL_TEXT_ATTR);
            if (originalText !== null && buttonElement.tagName === 'INPUT') {
                buttonElement.value = originalText;
                buttonElement.removeAttribute(ORIGINAL_TEXT_ATTR);
            }

            // Fallback if original content attributes were somehow lost and it's not an INPUT
            if (buttonElement.tagName !== 'INPUT') {
                const spinnerElement = buttonElement.querySelector(SPINNER_SELECTOR);
                if (spinnerElement && originalHtml === null) { // Check originalHtml to avoid removing content if it was restored
                    spinnerElement.remove();
                    if (buttonElement.textContent.trim() === (loadingText || '').trim()) {
                       buttonElement.textContent = 'Button'; // Generic fallback, or use dataset.originalText if available
                    }
                }
            }

            buttonElement.disabled = false;
            buttonElement.classList.remove(IS_LOADING_CLASS);
            console.debug("[Utils.UI] Button loading stopped:", buttonElement);
        }
    }


    /**
     * Shows or hides a loading indicator or a "no data" message within a table body (<tbody>).
     * Manages dedicated rows for these states.
     * @param {HTMLElement} tbodyElement - The <tbody> element to manage.
     * @param {boolean} isLoading - `true` to show the loading indicator, `false` to potentially show "no data" or regular rows.
     * @param {number} colSpan - The number of columns the table has (for the indicator row's `colspan`).
     * @param {string} [loadingText='Indlæser data...'] - Text displayed with the loading spinner.
     * @param {string} [noDataText='Ingen data fundet.'] - Text displayed when `isLoading` is false and no data rows are present.
     */
    function showTableLoading(tbodyElement, isLoading, colSpan = 1, loadingText = 'Indlæser data...', noDataText = 'Ingen data fundet.') {
        if (!(tbodyElement instanceof HTMLTableSectionElement && tbodyElement.tagName === 'TBODY')) {
            console.warn("[Utils.UI] showTableLoading: Invalid tbodyElement provided.", tbodyElement);
            return;
        }

        const LOADING_ROW_CLASS = 'table-loading-row';
        const NO_DATA_ROW_CLASS = 'table-no-data-row';
        const DATA_ROW_SELECTOR = `tr:not(.${LOADING_ROW_CLASS}):not(.${NO_DATA_ROW_CLASS})`; // Selector for actual data rows

        colSpan = parseInt(colSpan, 10);
        if (isNaN(colSpan) || colSpan < 1) {
            colSpan = 1;
            console.warn("[Utils.UI] showTableLoading: Invalid colSpan, defaulting to 1.");
        }

        // Ensure indicator rows exist or create them if needed
        let loadingRow = tbodyElement.querySelector(`tr.${LOADING_ROW_CLASS}`);
        if (!loadingRow) {
            const loadingHtml = `
                <tr class="${LOADING_ROW_CLASS}" style="display: none;">
                    <td colspan="${colSpan}" class="text-center p-4">
                        <div class="spinner-border spinner-border-sm text-secondary me-2" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span class="loading-text fst-italic text-muted">${escapeHtml(loadingText)}</span>
                    </td>
                </tr>`;
            tbodyElement.insertAdjacentHTML('afterbegin', loadingHtml); // Add at the top
            loadingRow = tbodyElement.querySelector(`tr.${LOADING_ROW_CLASS}`);
        } else {
            // Update text if row already exists
            const loadingTextElement = loadingRow.querySelector('.loading-text');
            if (loadingTextElement) loadingTextElement.textContent = loadingText;
             // Ensure colspan is correct if called multiple times with different values
             const td = loadingRow.querySelector('td');
             if (td) td.colSpan = colSpan;
        }

        let noDataRow = tbodyElement.querySelector(`tr.${NO_DATA_ROW_CLASS}`);
        if (!noDataRow) {
            const noDataHtml = `
                <tr class="${NO_DATA_ROW_CLASS}" style="display: none;">
                    <td colspan="${colSpan}" class="text-center text-muted p-4 fst-italic">
                        <span class="no-data-text">${escapeHtml(noDataText)}</span>
                    </td>
                </tr>`;
            tbodyElement.insertAdjacentHTML('beforeend', noDataHtml); // Add at the bottom
            noDataRow = tbodyElement.querySelector(`tr.${NO_DATA_ROW_CLASS}`);
        } else {
            // Update text if row already exists
            const noDataTextElement = noDataRow.querySelector('.no-data-text');
            if (noDataTextElement) noDataTextElement.textContent = noDataText;
            // Ensure colspan is correct
             const td = noDataRow.querySelector('td');
             if (td) td.colSpan = colSpan;
        }

        // --- Logic for showing/hiding rows ---

        // Hide all potential data rows initially
        const dataRows = tbodyElement.querySelectorAll(DATA_ROW_SELECTOR);
        dataRows.forEach(row => row.style.display = 'none');

        if (isLoading) {
            // Show loading row, hide no-data row
            if (loadingRow) loadingRow.style.display = ''; // Default display (table-row)
            if (noDataRow) noDataRow.style.display = 'none';
            console.debug("[Utils.UI] Table loading shown.");
        } else {
            // Hide loading row
            if (loadingRow) loadingRow.style.display = 'none';

            // Show all actual data rows (they might be filtered/hidden by other logic later)
            dataRows.forEach(row => row.style.display = '');

            // Check if any data rows are actually present in the DOM *after* potential filtering elsewhere
            // Note: This checks existence, not visibility after external filtering.
            const hasDataRows = tbodyElement.querySelector(DATA_ROW_SELECTOR) !== null;

            // Show "no data" row ONLY if there are no data rows
            if (noDataRow) {
                noDataRow.style.display = hasDataRows ? 'none' : '';
            }
            console.debug(`[Utils.UI] Table loading hidden. ${hasDataRows ? 'Data rows present.' : 'No data rows found.'}`);
        }
    }


    // ============================================
    // --- FORMATTING FUNCTIONS ---
    // ============================================

    /**
     * Formats a numerical value as a currency string using Intl.NumberFormat.
     * @param {number | string | null | undefined} value - The number or numeric string to format.
     * @param {string} [currency='DKK'] - The ISO 4217 currency code (e.g., 'USD', 'EUR').
     * @param {string} [locale='da-DK'] - The locale string for formatting conventions (e.g., 'en-US').
     * @param {object} [options={}] - Additional options for Intl.NumberFormat (e.g., { minimumFractionDigits: 2 }).
     * @returns {string} The formatted currency string (e.g., "1.234,56 kr.") or a fallback string ('-') for invalid input.
     */
    function formatCurrency(value, currency = 'DKK', locale = 'da-DK', options = {}) {
        const number = Number(value); // Attempt to convert input to number

        // Handle invalid inputs gracefully
        if (value === null || value === undefined || value === '' || isNaN(number)) {
            // Return a simple, non-breaking fallback as per spec suggestion "N/A" or similar
            return '-'; // Simple dash is often visually cleaner than "N/A"
        }

        try {
            // Combine default currency style with provided options
            const formatOptions = {
                style: 'currency',
                currency: currency,
                ...options // Merge custom options, allowing overrides
            };
            return new Intl.NumberFormat(locale, formatOptions).format(number);
        } catch (e) {
            console.error(`[Utils.Format] Error formatting currency (Value: ${value}, Currency: ${currency}, Locale: ${locale}):`, e);
            // Return a fallback indicating an error, possibly including the raw value
            return `${number.toFixed(2)} ${currency}* (format error)`;
        }
    }

    /**
     * Formats a date/time input into a human-readable string based on locale and options.
     * Handles Date objects, ISO 8601 strings, and numeric timestamps.
     * @param {string | number | Date | null | undefined} dateInput - The date/time value. ISO strings are recommended.
     * @param {string} [locale='da-DK'] - The locale string (e.g., 'en-GB', 'de-DE').
     * @param {object} [options={ dateStyle: 'short', timeStyle: 'short' }] - Options for Intl.DateTimeFormat
     *        (e.g., { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).
     * @returns {string} The formatted date/time string or a fallback string ('Ukendt tid') for invalid input.
     */
    function formatDateTime(dateInput, locale = 'da-DK', options = { dateStyle: 'short', timeStyle: 'short' }) {
        const fallback = 'Ukendt tid'; // Fallback string as per spec

        if (dateInput === null || dateInput === undefined || dateInput === '') {
            return fallback;
        }

        let date;
        try {
            // Attempt to create a Date object from various input types
             if (dateInput instanceof Date) {
                date = dateInput;
            } else if (typeof dateInput === 'number') {
                // Assume it's a UNIX timestamp (milliseconds since epoch)
                date = new Date(dateInput);
            } else if (typeof dateInput === 'string') {
                // Try parsing the string. Robustness depends on browser implementation,
                // but should handle ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ) well.
                // Replace space with 'T' for broader compatibility if needed.
                date = new Date(dateInput.replace(' ', 'T'));
            } else {
                throw new Error("Invalid input type");
            }

            // Check if the created Date object is valid
            if (isNaN(date.getTime())) {
                throw new Error("Invalid Date object created");
            }

            // Format using Intl.DateTimeFormat
            return new Intl.DateTimeFormat(locale, options).format(date);

        } catch (e) {
            console.warn(`[Utils.Format] Could not parse or format date/time (Input: ${dateInput}, Locale: ${locale}):`, e);
            return fallback;
        }
    }


    // ============================================
    // --- HTML / String Helpers ---
    // ============================================

    /**
     * Escapes special HTML characters in a string to prevent XSS attacks when the string
     * is inserted into the DOM using methods like `innerHTML`.
     * **It's generally safer to use `textContent` or DOM manipulation methods instead of `innerHTML` whenever possible.**
     * @param {string | null | undefined} unsafeString - The string potentially containing HTML characters.
     * @returns {string} The escaped string, safe for embedding in HTML content. Returns an empty string if input is not a string.
     */
    function escapeHtml(unsafeString) {
      // Return empty string for null, undefined, or non-string types
      if (typeof unsafeString !== 'string') {
        return '';
      }

      // Replace critical HTML characters with their corresponding entities.
      // The order matters: '&' must be replaced first.
      return unsafeString
        .replace(/&/g, '&amp;')   // & → &amp;Ampersand
        .replace(/</g, '&lt;')    // < → &lt; Less than
        .replace(/>/g, '&gt;')    // > → &gt; Greater than
        .replace(/"/g, '&quot;')  // " → &quot; Double quote
        .replace(/'/g, '&#39;');  // ' → &#39; Single quote
    }

    // ============================================
    // --- UI Initializers ---
    // ============================================

    /**
     * Initializes or re-initializes Bootstrap Tooltips within a specified scope.
     * Automatically disposes of any existing tooltips on the elements first
     * to prevent conflicts, making it safe to call multiple times (e.g., after adding dynamic content).
     * Requires Bootstrap 5+ JS Tooltip component to be loaded.
     * @param {HTMLElement | Document} [parentElement=document.body] - The DOM element to search within for tooltips.
     *        Defaults to `document.body`. Use a more specific element for better performance on dynamic updates.
     */
    function initializeTooltips(parentElement = document.body) {
        // Check if Bootstrap Tooltip is available
        if (typeof bootstrap === 'undefined' || typeof bootstrap.Tooltip !== 'function') {
            console.warn("[Utils.UI] Bootstrap Tooltip JS component not available. Cannot initialize tooltips.");
            return;
        }

        if (!(parentElement instanceof Element || parentElement instanceof Document)) {
             console.warn("[Utils.UI] initializeTooltips: Invalid parentElement provided. Must be an HTMLElement or Document.", parentElement);
             return;
        }

        // Find all elements with the tooltip trigger attribute within the specified scope
        const tooltipTriggerList = parentElement.querySelectorAll('[data-bs-toggle="tooltip"]');

        if (tooltipTriggerList.length === 0) {
            // console.debug("[Utils.UI] No tooltip triggers found within the specified scope:", parentElement === document.body ? 'document.body' : parentElement);
            return;
        }

        console.debug(`[Utils.UI] Found ${tooltipTriggerList.length} tooltip triggers. Initializing... Scope:`, parentElement === document.body ? 'document.body' : parentElement);

        // Initialize each tooltip
        const initializedTooltips = [];
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            try {
                // Get existing instance if it exists
                const existingTooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
                if (existingTooltip) {
                    // Dispose of the old instance before creating a new one
                     console.debug("[Utils.UI] Disposing existing tooltip instance on:", tooltipTriggerEl);
                    existingTooltip.dispose();
                }
                // Create a new tooltip instance
                initializedTooltips.push(new bootstrap.Tooltip(tooltipTriggerEl));
            } catch (e) {
                console.error("[Utils.UI] Error initializing tooltip on element:", tooltipTriggerEl, e);
            }
        });

        if (initializedTooltips.length > 0) {
            console.log(`[Utils.UI] Successfully initialized/re-initialized ${initializedTooltips.length} tooltips.`);
        }

        // Return the array of initialized tooltip instances (optional, might be useful)
        // return initializedTooltips;
    }

    // ============================================
    // --- Local Time Conversion ---
    // ============================================

    /**
     * Finds elements with class 'local-datetime' and converts the UTC ISO string
     * from their 'data-utc-datetime' attribute to the user's local time display.
     */
    function convertUtcToLocal() {
        const datetimeElements = document.querySelectorAll('.local-datetime');
        // console.log(`[utils.js] Found ${datetimeElements.length} elements for local time conversion.`);

        datetimeElements.forEach(el => {
            const utcDateString = el.dataset.utcDatetime;
            if (utcDateString) {
                try {
                    const dateObj = new Date(utcDateString);
                    // Check if the date is valid before formatting
                    if (!isNaN(dateObj.getTime())) {
                        // Format using user's locale settings for date and time
                        const localString = dateObj.toLocaleString(undefined, { // undefined uses browser default locale
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit', // Removed second: '2-digit' for brevity
                            // timeZoneName: 'short' // Optional: include timezone abbreviation
                        });
                        // Update both textContent for display and title for hover/accessibility
                        el.textContent = localString;
                        el.setAttribute('title', localString);
                    } else {
                        console.warn(`[utils.js] Invalid date parsed from data-utc-datetime: ${utcDateString}`);
                        // Keep the fallback text (relative time) and default title if parsing fails
                    }
                } catch (e) {
                    console.error(`[utils.js] Error converting date string ${utcDateString}:`, e);
                    // Keep the fallback text on error
                }
            } else {
                 // console.warn("[utils.js] Element with class 'local-datetime' is missing 'data-utc-datetime' attribute.");
            }
        });
    }


    // ============================================
    // --- HTML / String Helpers (Continued) ---
    // ============================================

    /**
     * Capitalizes the first letter of a string.
     * @param {string} string - The input string.
     * @returns {string} The string with the first letter capitalized.
     */
    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // ============================================
    // --- EXPORT PUBLIC FUNCTIONS ---
    // ============================================
    // Expose functions to the global `window.utils` object
    return {
        // CSRF & Fetch API
        getCsrfToken,
        fetchFreshCsrfToken,
        fetchData, // Expose core fetch if needed, otherwise rely on wrappers
        getData,
        postData,
        putData,
        deleteData,

        // UI Feedback & State
        showToast,
        displayFlashes,
        toggleButtonLoading,
        showTableLoading,

        // Formatters
        formatCurrency,
        formatDateTime,

        // Helpers
        escapeHtml,
        capitalizeFirstLetter, // Added here

        // Initializers
        initializeTooltips,
        convertUtcToLocal // Expose the new function
    };

})(); // Immediately Invoked Function Expression (IIFE) to create the utils object

// --- Script Loaded Confirmation ---
// Ensure this runs *after* the IIFE has assigned window.utils
if (window.utils) {
    console.log("utils.js loaded successfully and `window.utils` object is available.");
     // Optional: Immediately initialize tooltips on the whole document at load time
     // document.addEventListener('DOMContentLoaded', () => window.utils.initializeTooltips());

     // --- Call time conversion after DOM is loaded ---
     // Use DOMContentLoaded to ensure elements are available
     if (document.readyState === 'loading') {
         document.addEventListener('DOMContentLoaded', window.utils.convertUtcToLocal);
     } else {
         // DOMContentLoaded has already fired
         window.utils.convertUtcToLocal();
     }

} else {
    console.error("utils.js loaded, but `window.utils` object FAILED to initialize!");
}

// External definition and assignment of capitalizeFirstLetter removed.
