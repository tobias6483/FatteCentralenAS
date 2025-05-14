// static/js/settings.js (Version Utils Update - Modificeret for Disable Form)
document.addEventListener("DOMContentLoaded", () => {
    console.log("Settings page script loaded (Utils Update).");

    // --- Check if helper functions from window.utils are available ---
    if (typeof window.utils === 'undefined' ||
        !window.utils.postData ||
        !window.utils.getData || // Checked even if not used currently
        !window.utils.showToast ||
        !window.utils.toggleButtonLoading) {
        console.error("[Settings.js] CRITICAL: window.utils object or required functions (postData, getData, showToast, toggleButtonLoading) missing!");
        // Show a prominent error to the user
        const errorContainer = document.querySelector('.container') || document.body; // Find a place to show the error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i> Kritisk sidefejl: Nødvendige JavaScript-funktioner mangler. Indstillinger kan ikke håndteres korrekt.';
        if (errorContainer) {
            errorContainer.insertBefore(errorDiv, errorContainer.firstChild);
        }
        // Optionally disable buttons or stop script execution
        document.querySelectorAll('button').forEach(btn => btn.disabled = true);
        return; // Stop script execution
    } else {
         console.log("[Settings.js] window.utils object and required functions verified.");
    }

    // --- DOM Element References ---
    const setup2faBtn = document.getElementById("setup2faBtn");
    const setupQrSection = document.getElementById("setupQrSection");
    const qrImage = document.getElementById("qrImage");
    const setupStartFeedbackDiv = document.getElementById('setupStartFeedback');

    const verify2faForm = document.getElementById("verify2faForm");
    const verify2faCodeInput = document.getElementById("verify2faCodeInput");
    const verify2faBtn = document.getElementById("verify2faBtn");
    const verifyFeedbackDiv = document.getElementById('verifyFeedback');

    const generateBackupCodesBtn = document.getElementById("generateBackupCodesBtn");
    const backupCodesSection = document.getElementById("backupCodesSection");
    const backupCodesList = document.getElementById("backupCodesList");
    const backupCodesFeedbackDiv = document.getElementById('backupCodesFeedback');

    // ===== START ÆNDRING: Referencer for Disable 2FA Form =====
    const disable2faForm = document.getElementById('disable2faForm'); // NY REFERENCE TIL FORM
    const disable2faBtn = document.getElementById('disable2faBtn'); // BEHOLD til button state
    const disable2faPasswordInput = document.getElementById('disable2faPassword'); // BEHOLD til værdi/fokus
    const disableFeedbackDiv = document.getElementById('disableFeedback'); // BEHOLD til feedback
    // ===== SLUT ÆNDRING =====


    // --- Local Helper Functions (Kept local as they are specific UI manipulators) ---

    /**
     * Displays feedback messages using Bootstrap alert styling.
     * Kept local for specific inline feedback.
     * @param {HTMLElement|null} feedbackElement The container element for the feedback.
     * @param {string} message The message to display.
     * @param {string} [type='danger'] 'success', 'danger', 'warning', 'info'.
     */
    const showFeedback = (feedbackElement, message, type = 'danger') => {
        if (feedbackElement) {
            if (!message) { // Clear feedback if message is empty
                feedbackElement.innerHTML = '';
                feedbackElement.classList.add('d-none'); // Ensure it's hidden
                return;
            }
            const alertClass = `alert-${type}`;
            const iconClass = type === 'success' ? 'bi-check-circle-fill' : type === 'warning' ? 'bi-exclamation-triangle-fill' : type === 'info' ? 'bi-info-circle-fill' : 'bi-x-octagon-fill';
            // Use utils.escapeHtml for the message to prevent XSS if message comes from untrusted source (though less likely here)
            const safeMessage = window.utils.escapeHtml ? window.utils.escapeHtml(message) : message;
            feedbackElement.innerHTML = `
                <div class="alert ${alertClass} alert-dismissible fade show small d-flex align-items-center mt-2 mb-0" role="alert" >
                    <i class="bi ${iconClass} flex-shrink-0 me-2"></i>
                    <div class="flex-grow-1">${safeMessage}</div>
                    <button type="button" class="btn-close btn-sm" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`;
            feedbackElement.classList.remove('d-none'); // Make sure it's visible
        } else {
            console.warn("Feedback element not found for message:", message);
        }
    };

    /**
     * Toggles the visibility of a section using CSS classes. Remains local.
     * @param {HTMLElement|null} sectionElement The section element.
     * @param {boolean} isVisible Whether the section should be visible.
     */
    const toggleSectionVisibility = (sectionElement, isVisible) => {
        if (sectionElement) {
            // Prefer using d-none for Bootstrap compatibility
            sectionElement.classList.toggle('d-none', !isVisible);
            sectionElement.classList.toggle('is-visible', isVisible); // Keep custom class if needed for transitions etc.
        }
    };

    // --- Event Listener for "Start Opsætning af 2FA" (uændret) ---
    if (setup2faBtn) {
        setup2faBtn.addEventListener("click", async () => {
            console.log("Initiating 2FA setup...");
            window.utils.toggleButtonLoading(setup2faBtn, true, 'Starter...'); // Use util function
            showFeedback(setupStartFeedbackDiv, '', 'info'); // Use local feedback
            toggleSectionVisibility(setupQrSection, false); // Use local visibility toggle

            try {
                 // Direct fetch needed for blob response (QR code), utils.getData is typically for JSON/text.
                const response = await fetch("/auth/setup_2fa");
                 if (!response.ok) {
                    let errorMsg = `Fejl (${response.status})`;
                     try {
                        const errorData = await response.json();
                        errorMsg = errorData.error || errorData.message || errorMsg; // Try to get backend message
                     } catch (parseError) {
                         errorMsg = `Fejl ved start af 2FA setup (${response.status}): ${response.statusText}`;
                     }
                    throw new Error(errorMsg);
                }

                const blob = await response.blob();
                const imgUrl = URL.createObjectURL(blob);

                if (qrImage) qrImage.src = imgUrl;
                if (verify2faCodeInput) verify2faCodeInput.value = '';
                toggleSectionVisibility(setupQrSection, true); // Use local visibility toggle
                console.log("QR code displayed for 2FA setup.");

            } catch (err) {
                console.error("Fejl ved start af 2FA opsætning:", err);
                showFeedback(setupStartFeedbackDiv, err.message, 'danger'); // Use local feedback
                toggleSectionVisibility(setupQrSection, false); // Use local visibility toggle
            } finally {
                window.utils.toggleButtonLoading(setup2faBtn, false); // Use util function
            }
        });
    } else {
        console.log("Setup 2FA button not found.");
    }

    // --- Event Listener for "Bekræft & Aktiver 2FA" Form (uændret) ---
    if (verify2faForm) {
        verify2faForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!verify2faCodeInput || !verify2faBtn) return;

            const code = verify2faCodeInput.value.trim();
            showFeedback(verifyFeedbackDiv, '', 'info'); // Use local feedback

            if (!/^[0-9]{6}$/.test(code)) {
                showFeedback(verifyFeedbackDiv, 'Indtast venligst en gyldig 6-cifret kode.', 'warning'); // Use local feedback
                verify2faCodeInput.focus();
                return;
            }

            console.log(`Verifying 2FA code: ${code.substring(0, 3)}...`);
            window.utils.toggleButtonLoading(verify2faBtn, true, 'Bekræfter...'); // Use util function

            try {
                // Use utils.postData
                const data = await window.utils.postData("/auth/verify_2fa", { code });

                console.log("2FA Verification successful:", data);
                window.utils.showToast('2FA er nu aktiveret! Siden genindlæses.', 'success'); // Use Toast helper

                // Backup codes might be returned, log them for now before reload
                 if (data.backup_codes && backupCodesList) {
                    console.log("Received Backup Codes:", data.backup_codes);
                 }

                // Disable button and input while reloading
                 window.utils.toggleButtonLoading(verify2faBtn, true, 'Aktiveret!');
                 verify2faCodeInput.disabled = true;

                setTimeout(() => {
                    window.location.reload();
                }, 2500); // Delay for toast

            } catch (err) {
                console.error("Fejl ved verifikation af 2FA:", err);
                // Use err.message provided by utils.postData/getData standardized error handling
                showFeedback(verifyFeedbackDiv, `Fejl: ${err.message || 'Kunne ikke verificere kode.'}`, 'danger'); // Use local feedback
                window.utils.toggleButtonLoading(verify2faBtn, false); // Use util function
                verify2faCodeInput.select();
            }
            // No 'finally' needed, page reloads on success.
        });
    } else {
        console.log("Verify 2FA form not found.");
    }

    // --- Event Listener for "Generer Nye Backup Koder" (uændret) ---
    if (generateBackupCodesBtn) {
        generateBackupCodesBtn.addEventListener("click", async () => {
            console.log("Requesting new backup codes...");
             window.utils.toggleButtonLoading(generateBackupCodesBtn, true, 'Genererer...'); // Use util function
             showFeedback(backupCodesFeedbackDiv, '', 'info'); // Use local feedback
            toggleSectionVisibility(backupCodesSection, false); // Use local visibility toggle

            try {
                // Use utils.postData
                const data = await window.utils.postData("/auth/settings/generate-backup-codes");

                console.log("New backup codes received:", data);

                if (backupCodesList) backupCodesList.innerHTML = ''; // Clear previous codes

                if (data.backup_codes && data.backup_codes.length > 0 && backupCodesList) {
                    data.backup_codes.forEach(code => {
                        const li = document.createElement("li");
                         li.className = 'list-group-item list-group-item-light py-1 px-2';
                         // Codes themselves are sensitive, maybe don't escape if backend ensures they are safe chars?
                         // Or use utils.escapeHtml if unsure.
                         li.innerHTML = `<code class="user-select-all font-monospace">${window.utils.escapeHtml ? window.utils.escapeHtml(code) : code}</code>`;
                        backupCodesList.appendChild(li);
                    });
                    toggleSectionVisibility(backupCodesSection, true); // Use local visibility toggle
                    // Use success type for feedback message
                    showFeedback(backupCodesFeedbackDiv, data.message || 'Nye backup koder genereret. Opbevar dem et sikkert sted!', 'success'); // Use local feedback
                } else {
                    showFeedback(backupCodesFeedbackDiv, data.message || 'Ingen backup koder modtaget.', 'warning'); // Use local feedback
                    toggleSectionVisibility(backupCodesSection, false); // Keep hidden if no codes
                }

            } catch (err) {
                console.error("Fejl ved generering af backup koder:", err);
                showFeedback(backupCodesFeedbackDiv, `Fejl: ${err.message || 'Kunne ikke generere backup koder.'}`, 'danger'); // Use local feedback
                toggleSectionVisibility(backupCodesSection, false); // Keep hidden on error
            } finally {
                 window.utils.toggleButtonLoading(generateBackupCodesBtn, false); // Use util function
            }
        });
    } else {
        console.log("Generate backup codes button not found.");
    }


    // ===== START ÆNDRING: Event Listener for "Deaktiver 2FA" Form =====
    if (disable2faForm) { // Lyt på formen nu
        disable2faForm.addEventListener("submit", async (event) => { // Lyt på 'submit'
            event.preventDefault(); // **VIGTIGT: Stop standard form submission**
            console.log("Attempting to disable 2FA via form submission...");

            if (!disable2faPasswordInput || !disable2faBtn || !disableFeedbackDiv) { // Tjek alle nødvendige elementer
                console.error("Required elements for 2FA disable not found!");
                // Vis en generel fejl, da vi ikke kan placere den specifikt
                window.utils.showToast('Intern fejl: Nødvendige elementer til deaktivering mangler.', 'danger');
                return;
            }

            const passwordValue = disable2faPasswordInput.value;
            showFeedback(disableFeedbackDiv, '', 'info'); // Ryd tidligere feedback (lokal)

            if (!passwordValue) {
                showFeedback(disableFeedbackDiv, 'Indtast venligst din nuværende adgangskode for at bekræfte.', 'warning'); // Brug lokal feedback
                disable2faPasswordInput.focus();
                return;
            }

            const isConfirmed = window.confirm("Er du sikker på, at du vil deaktivere Two-Factor Authentication?\nDin konto vil være mindre sikker.");
            if (!isConfirmed) {
                console.log("2FA deactivation cancelled by user.");
                return;
            }

            console.log("User confirmed. Proceeding with 2FA deactivation call...");
            // Brug stadig 'disable2faBtn' til at vise loading state PÅ knappen
            window.utils.toggleButtonLoading(disable2faBtn, true, 'Deaktiverer...'); // Brug util funktion

            try {
                // Brug utils.postData
                const data = await window.utils.postData("/auth/settings/disable-2fa", {
                    password: passwordValue
                });

                console.log("Disable 2FA successful:", data);
                window.utils.showToast(data.message || "2FA er deaktiveret succesfuldt! Siden genindlæses.", 'success'); // Brug Toast helper

                // Opdater UI mens vi venter på reload
                window.utils.toggleButtonLoading(disable2faBtn, true, 'Deaktiveret!'); // Brug util funktion
                disable2faPasswordInput.disabled = true;


                setTimeout(() => {
                    window.location.reload();
                }, 2500); // Forsinkelse for toast

            } catch (err) {
                console.error("Fejl ved deaktivering af 2FA:", err);
                showFeedback(disableFeedbackDiv, `Fejl: ${err.message || 'Kunne ikke deaktivere 2FA.'}`, 'danger'); // Brug lokal feedback
                // Genaktiver knap ved fejl
                window.utils.toggleButtonLoading(disable2faBtn, false); // Brug util funktion
                disable2faPasswordInput.focus();
                disable2faPasswordInput.select();
            }
            // Ingen 'finally' nødvendig pga. reload ved succes
        });
    } else {
        // Opdateret log besked
        console.log("Disable 2FA form not found (This is normal if 2FA is not enabled).");
    }
    // ===== SLUT ÆNDRING =====


    // Placeholder for other settings forms initialization
    console.log("Settings page script initialization complete.");

}); // End DOMContentLoaded

 // TODO: Add event listeners for other settings forms (change password, email preferences, etc.)
    // Example:
    // const passwordForm = document.getElementById('changePasswordForm');
    // if (passwordForm) {
    //    passwordForm.addEventListener('submit', handleChangePassword);
    // }

 // End DOMContentLoaded
