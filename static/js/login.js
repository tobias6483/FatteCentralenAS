// static/js/login.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("[login.js] DOMContentLoaded fired.");

    // --- Tjek utils.js ---
    if (typeof window.utils === 'undefined' ||
        typeof window.utils.toggleButtonLoading !== 'function' ||
        typeof window.utils.showToast !== 'function' ||
        typeof window.utils.postData !== 'function' ||
        typeof window.utils.displayFlashes !== 'function' ||
        typeof window.utils.escapeHtml !== 'function' || 
        typeof window.utils.getCsrfToken !== 'function') { 
        console.error("[login.js] CRITICAL: utils.js object or required functions missing!");
        const errorTarget = document.getElementById("loginMessage") || document.getElementById("loginForm") || document.body;
        if (errorTarget) {
            errorTarget.innerHTML = '<div class="alert alert-danger" role="alert">Kritisk sidefejl: Nødvendige JavaScript funktioner mangler. Prøv at genindlæse siden eller kontakt support.</div>';
        }
        document.querySelectorAll('button').forEach(btn => btn.disabled = true);
        return; 
    } else {
        console.log("[login.js] window.utils object and functions verified.");
    }

    // Alias til utils funktioner
    const { toggleButtonLoading, showToast, postData, displayFlashes, escapeHtml } = window.utils;

    // --- Element Referencer ---
    const getElement = (id) => document.getElementById(id);

    // Forms / Hovedsektioner (Nødvendige for showForm)
    const loginForm = getElement("loginForm");
    const twofaSectionContainer = getElement("twofaSectionContainer");
    const adminLoginForm = getElement("adminLoginForm");
    const registerForm = getElement("registerForm");
    const resetPasswordForm = getElement("resetPasswordForm"); // Added reset form

    const allFormsAndSections = { // Bruges af showForm
        login: loginForm,
        twofa: twofaSectionContainer,
        admin: adminLoginForm,
        register: registerForm,
        reset: resetPasswordForm, 
    };

    // Interne 2FA Sektioner
    const twofaOtpSection = getElement("twofaOtpSection");
    const backupCodeSection = getElement("backupCodeSection");

    // Login Form Elements
    const loginUsernameInput = getElement("username");
    const loginPasswordInput = getElement("password");
    const loginRememberCheckbox = getElement("remember");
    const loginButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    const loginMessageDiv = getElement("loginMessage");

    // 2FA OTP Elements
    const twofaCodeInput = getElement("twofaCode");
    const twofaVerifyBtn = getElement("twofaVerifyBtn");
    const twofaMessageDiv = getElement("twofaMessage");
    const cancelTwofaBtn = getElement("cancelTwofaBtn");
    const showBackupBtn = getElement("showBackupBtn");

    // 2FA Backup Elements
    const twofaBackupCodeInput = getElement("twofaBackupCode");
    const twofaVerifyBackupBtn = getElement("twofaVerifyBackupBtn");
    const twofaBackupMessageDiv = getElement("twofaBackupMessage");
    const showOtpBtn = getElement("showOtpBtn");
    const cancelBackupBtn = getElement("cancelBackupBtn");

    // Admin Form Elements
    const adminUsernameInput = getElement("adminUsername");
    const adminPasswordInput = getElement("adminPassword");
    const adminLoginButton = adminLoginForm ? adminLoginForm.querySelector('button[type="submit"]') : null;
    const adminLoginMessageDiv = getElement("adminLoginMessage");

    // Register Form Elements
    const regUsernameInput = getElement("regUsername");
    const regPasswordInput = getElement("regPassword");
    const regInviteCodeInput = getElement("regInviteCode");
    const registerButton = registerForm ? registerForm.querySelector('button[type="submit"]') : null;
    const registerMessageDiv = getElement("registerMessage");

    // Reset Password Form Elements
    const resetPasswordButton = resetPasswordForm ? resetPasswordForm.querySelector('button[type="submit"]') : null; 
    const resetPasswordMessageDiv = getElement("resetPasswordMessage"); 
    const backToLoginFromResetBtn = getElement("backToLoginFromResetBtn"); 

    // Globale Form Switching Buttons ( Bruges til at *kalde* showForm )
    const showRegisterBtn = getElement("showRegisterBtn");
    const showAdminLoginBtn = getElement("showAdminLoginBtn");
    const showUserLoginBtn = getElement("showUserLoginBtn"); // Fra Admin form
    const backToLoginBtn = getElement("backToLoginBtn"); // Fra Register form


    // --- Funktion til at vise Valideringsfejl ---
    const displayValidationErrors = (containerElement, errorData, generalMessageDiv) => {
        if (!containerElement) { console.warn("[displayValidationErrors] Container element missing."); return; }

        // 1. Ryd gamle fejl
        if (generalMessageDiv) generalMessageDiv.innerHTML = '';
        containerElement.querySelectorAll('.is-invalid').forEach(input => input.classList.remove('is-invalid'));
        containerElement.querySelectorAll('.invalid-feedback').forEach(div => { div.textContent = ''; div.style.display = 'none'; });

        // 2. Vis nye fejl
        if (errorData?.errors && typeof errorData.errors === 'object' && Object.keys(errorData.errors).length > 0) {
            console.log("[displayValidationErrors] Displaying field errors:", errorData.errors);
            let firstErrorField = null;
            for (const fieldName in errorData.errors) {
                // Try to find by name first, then by ID if name fails (for reset form fields)
                let input = containerElement.querySelector(`[name="${fieldName}"]`);
                if (!input && (fieldName === 'password' || fieldName === 'confirm_password')) {
                     input = containerElement.querySelector(`#${fieldName === 'password' ? 'resetPassword' : 'resetConfirmPassword'}`);
                }
                
                if (input) {
                    input.classList.add('is-invalid');
                    const feedbackDiv = input.parentElement?.querySelector('.invalid-feedback');
                    if (feedbackDiv) {
                         const errorMessage = Array.isArray(errorData.errors[fieldName])
                            ? errorData.errors[fieldName].join(' ') 
                            : String(errorData.errors[fieldName]);
                        feedbackDiv.textContent = errorMessage;
                        feedbackDiv.style.display = 'block';
                    }
                    if (!firstErrorField) firstErrorField = input;
                } else {
                    console.warn(`[displayValidationErrors] Input field [name="${fieldName}"] not found. Showing as general error.`);
                    const errorMessage = `${fieldName}: ${errorData.errors[fieldName]}`;
                    if (generalMessageDiv) {
                        generalMessageDiv.innerHTML += `<p class="text-danger mb-1">${escapeHtml(errorMessage)}</p>`;
                    } else {
                        showToast(errorMessage, 'danger');
                    }
                }
            }
            if (firstErrorField) setTimeout(() => { try { firstErrorField.focus(); } catch (e) {} }, 50);

        } else if (errorData?.error) {
            console.log("[displayValidationErrors] Displaying general error:", errorData.error);
            const generalErrorMessage = escapeHtml(String(errorData.error));
            if (generalMessageDiv) {
                generalMessageDiv.innerHTML = `<div class="alert alert-danger" role="alert">${generalErrorMessage}</div>`;
            } else {
                showToast(generalErrorMessage, "danger");
            }
        }

        if (errorData?.flashes) {
            displayFlashes(errorData.flashes);
        }
    };


    // --- Overordnet Funktion til at Skifte Mellem Hoved-Forms ---
    const effectiveShowForm = (formKey) => {
        console.log(`[login.js:effectiveShowForm] Switching view to key: ${formKey}`);

        if (!allFormsAndSections.hasOwnProperty(formKey) || !allFormsAndSections[formKey]) {
            console.error(`[login.js:effectiveShowForm] Invalid or missing form key: '${formKey}'. Defaulting to 'login'.`);
            formKey = 'login'; 
            if (!allFormsAndSections.login) {
                 console.error("[login.js:effectiveShowForm] FATAL: Login form element not found. Cannot display default.");
                 showToast("Sidefejl: Kunne ikke vise login formularen.", "danger", 10000);
                 return; 
            }
        }

        // 1. Ryd fejl/status fra ALLE feedback-områder
        [loginMessageDiv, twofaMessageDiv, twofaBackupMessageDiv, adminLoginMessageDiv, registerMessageDiv, resetPasswordMessageDiv] 
            .forEach(div => { if (div) div.innerHTML = ''; });

        // 2. Skjul alle hoved-sektioner og ryd '.is-invalid'
        Object.values(allFormsAndSections).forEach(element => {
            if (element) {
                element.classList.add('hidden');
                element.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
                element.querySelectorAll('.invalid-feedback').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
            }
        });

        // 3. Vis den korrekte sektion
        const targetElement = allFormsAndSections[formKey];
        if (targetElement) {
            targetElement.classList.remove('hidden');

            // 4. Specialhåndtering for 2FA
            if (formKey === 'twofa') {
                if (twofaOtpSection) twofaOtpSection.classList.remove('hidden'); else console.warn("2FA OTP Section not found");
                if (backupCodeSection) backupCodeSection.classList.add('hidden'); else console.warn("2FA Backup Section not found");
                const targetInput = twofaCodeInput;
                 if (targetInput) {
                     setTimeout(() => { try { targetInput.focus(); targetInput.value = ''; } catch (e) {} }, 50);
                 }
            } else if (formKey === 'login' && loginUsernameInput && loginUsernameInput.value) {
                const targetInput = loginPasswordInput;
                 if (targetInput) {
                     setTimeout(() => { try { targetInput.focus(); } catch (e) {} }, 50);
                 }
            }
            else {
                 // 5. Sæt fokus på det første synlige input i den viste form
                 const firstInput = targetElement.querySelector('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])');
                 if (firstInput) {
                     setTimeout(() => { try { firstInput.focus(); } catch (e) {} }, 50);
                 }
            }
        } else {
            console.error(`[login.js:effectiveShowForm] Target element for key '${formKey}' was unexpectedly null after check!`);
        }
    };

    // *** Gør showForm funktionen globalt tilgængelig ***
    window.showForm = effectiveShowForm;
    console.log("[login.js] window.showForm function is now globally available.");

    // --- Event Listeners for GLOBALE Form Switching Knapper ---
    if (showRegisterBtn) showRegisterBtn.addEventListener("click", () => window.showForm('register'));
    if (showAdminLoginBtn) showAdminLoginBtn.addEventListener("click", () => window.showForm('admin'));
    if (showUserLoginBtn) showUserLoginBtn.addEventListener("click", () => window.showForm('login')); 
    if (backToLoginBtn) backToLoginBtn.addEventListener("click", () => window.showForm('login')); 
    if (backToLoginFromResetBtn) backToLoginFromResetBtn.addEventListener("click", () => window.showForm('login')); 

    // --- Event Listeners for INTERNE 2FA Switching Knapper ---
    if (showBackupBtn && twofaOtpSection && backupCodeSection) {
        showBackupBtn.addEventListener('click', () => {
            console.log("[login.js] Showing backup code section.");
            twofaOtpSection.classList.add('hidden'); backupCodeSection.classList.remove('hidden');
            displayValidationErrors(twofaOtpSection, null, twofaMessageDiv);
            displayValidationErrors(backupCodeSection, null, twofaBackupMessageDiv);
            if (twofaBackupCodeInput) setTimeout(() => { try { twofaBackupCodeInput.focus(); twofaBackupCodeInput.value = ''; } catch(e){} }, 50);
        });
    }
    if (showOtpBtn && twofaOtpSection && backupCodeSection) {
        showOtpBtn.addEventListener('click', () => {
            console.log("[login.js] Showing OTP section.");
            backupCodeSection.classList.add('hidden'); twofaOtpSection.classList.remove('hidden');
            displayValidationErrors(twofaOtpSection, null, twofaMessageDiv);
            displayValidationErrors(backupCodeSection, null, twofaBackupMessageDiv);
            if (twofaCodeInput) setTimeout(() => { try { twofaCodeInput.focus(); twofaCodeInput.value = ''; } catch(e){} }, 50);
        });
    }
    if (cancelTwofaBtn) cancelTwofaBtn.addEventListener('click', () => window.showForm('login'));
    if (cancelBackupBtn) cancelBackupBtn.addEventListener('click', () => window.showForm('login'));

    // ================================================================
    // === FORM SUBMIT / KNAP HANDLERS ===
    // ================================================================

    // --- LOGIN ---
    if (loginForm && loginButton && loginMessageDiv && loginUsernameInput && loginPasswordInput) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            displayValidationErrors(loginForm, null, loginMessageDiv);
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value;
            const remember = loginRememberCheckbox?.checked ?? false;

            if (!username) return displayValidationErrors(loginForm, { errors: { username: "Brugernavn mangler." }}, loginMessageDiv);
            if (!password) return displayValidationErrors(loginForm, { errors: { password: "Adgangskode mangler." }}, loginMessageDiv);

            toggleButtonLoading(loginButton, true, 'Logger ind...');
            try {
                const data = await postData("/auth/login", { username, password, remember });
                if (data.twofa_required) {
                    showToast(data.message || "2FA kode påkrævet.", "info");
                    window.showForm('twofa'); 
                } else {
                    showToast(data.message || "Login succesfuldt!", "success");
                    if (data.flashes) displayFlashes(data.flashes);
                    setTimeout(() => { window.location.href = data.redirect_url || "/"; }, 800);
                }
            } catch (error) {
                console.error("[login.js] Login error:", error);
                displayValidationErrors(loginForm, error.data, loginMessageDiv);
            } finally {
                toggleButtonLoading(loginButton, false);
            }
        });
    } else { console.warn("[login.js] Login form or required elements missing."); }

    // --- 2FA (OTP) - Klik Event ---
    if (twofaVerifyBtn && twofaCodeInput && twofaOtpSection && twofaMessageDiv) {
        twofaVerifyBtn.addEventListener('click', async () => {
            displayValidationErrors(twofaOtpSection, null, twofaMessageDiv);
            const code = twofaCodeInput.value.trim();
            if (!code || !/^[0-9]{6}$/.test(code)) {
                 return displayValidationErrors(twofaOtpSection, { error: "Indtast venligst en 6-cifret kode." }, twofaMessageDiv);
            }

            toggleButtonLoading(twofaVerifyBtn, true, 'Bekræfter...');
            try {
                const data = await postData("/auth/verify_2fa_login", { code });
                showToast(data.message || "Login lykkedes!", "success");
                if (data.flashes) displayFlashes(data.flashes);
                setTimeout(() => { window.location.href = data.redirect_url || "/"; }, 800);
            } catch (error) {
                console.error("[login.js] 2FA OTP Verify error:", error);
                displayValidationErrors(twofaOtpSection, error.data, twofaMessageDiv);
                if (twofaCodeInput) twofaCodeInput.value = ''; 
                if (twofaCodeInput) setTimeout(() => { try { twofaCodeInput.focus(); } catch(e){} }, 50); 
            } finally {
                toggleButtonLoading(twofaVerifyBtn, false);
            }
        });
         twofaCodeInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') {
                 e.preventDefault(); 
                 twofaVerifyBtn.click(); 
             }
         });

    } else { console.warn("[login.js] 2FA OTP section or elements missing."); }

    // --- 2FA (BACKUP) - Klik Event ---
    if (twofaVerifyBackupBtn && twofaBackupCodeInput && backupCodeSection && twofaBackupMessageDiv) {
        twofaVerifyBackupBtn.addEventListener('click', async () => {
            displayValidationErrors(backupCodeSection, null, twofaBackupMessageDiv);
            const backupCode = twofaBackupCodeInput.value.trim();
            if (!backupCode) {
                return displayValidationErrors(backupCodeSection, { error: "Indtast venligst en backup kode." }, twofaBackupMessageDiv);
            }

            toggleButtonLoading(twofaVerifyBackupBtn, true, 'Bekræfter...');
            try {
                const data = await postData("/auth/verify_backup_code", { backup_code: backupCode });
                showToast(data.message || "Login lykkedes med backup kode!", "success");
                if (data.flashes) displayFlashes(data.flashes);
                setTimeout(() => { window.location.href = data.redirect_url || "/"; }, 800);
            } catch (error) {
                console.error("[login.js] 2FA Backup Verify error:", error);
                displayValidationErrors(backupCodeSection, error.data, twofaBackupMessageDiv);
                if (twofaBackupCodeInput) twofaBackupCodeInput.value = ''; 
                if (twofaBackupCodeInput) setTimeout(() => { try { twofaBackupCodeInput.focus(); } catch(e){} }, 50); 
            } finally {
                toggleButtonLoading(twofaVerifyBackupBtn, false);
            }
        });
         twofaBackupCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                twofaVerifyBackupBtn.click();
            }
        });
    } else { console.warn("[login.js] 2FA Backup section or elements missing."); }

    // --- ADMIN LOGIN ---
    if (adminLoginForm && adminLoginButton && adminUsernameInput && adminPasswordInput && adminLoginMessageDiv) {
        adminLoginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            displayValidationErrors(adminLoginForm, null, adminLoginMessageDiv);
            const username = adminUsernameInput.value.trim();
            const password = adminPasswordInput.value;

            if (!username) return displayValidationErrors(adminLoginForm, { errors: { username: "Admin brugernavn mangler." }}, adminLoginMessageDiv);
            if (!password) return displayValidationErrors(adminLoginForm, { errors: { password: "Admin password mangler." }}, adminLoginMessageDiv);

            toggleButtonLoading(adminLoginButton, true, 'Verificerer...');
            try {
                const data = await postData("/auth/admin_login", { username, password });
                showToast(data.message || "Admin login lykkedes!", "success");
                if (data.flashes) displayFlashes(data.flashes);
                setTimeout(() => { window.location.href = data.redirect_url || "/admin/menu"; }, 800);
            } catch (error) {
                console.error("[login.js] Admin login error:", error);
                displayValidationErrors(adminLoginForm, error.data, adminLoginMessageDiv);
            } finally {
                toggleButtonLoading(adminLoginButton, false);
            }
        });
    } else { console.warn("[login.js] Admin login form or elements missing."); }

    // --- REGISTER Form ---
    if (registerForm && registerButton && regUsernameInput && regPasswordInput && regInviteCodeInput && registerMessageDiv) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            displayValidationErrors(registerForm, null, registerMessageDiv);
            const username = regUsernameInput.value.trim();
            const password = regPasswordInput.value;
            const inviteCode = regInviteCodeInput.value.trim();

            let errors = {};
            if (!username) errors.username = 'Brugernavn påkrævet.';
            if (!password) errors.password = 'Password påkrævet.';
            if (!inviteCode) errors.invite_code = 'Invite Kode påkrævet.'; 

            if (Object.keys(errors).length > 0) {
                return displayValidationErrors(registerForm, { errors }, registerMessageDiv);
            }

            toggleButtonLoading(registerButton, true, 'Opretter...');
            try {
                const data = await postData("/auth/register", { username, password, invite_code: inviteCode });
                showToast(data.message || "Bruger oprettet! Du kan nu logge ind.", "success");
                if (data.flashes) displayFlashes(data.flashes);

                setTimeout(() => {
                    registerForm.reset();
                    window.showForm('login'); 
                }, 1500);
            } catch (error) {
                console.error("[login.js] Register error:", error);
                displayValidationErrors(registerForm, error.data, registerMessageDiv);
            } finally {
                toggleButtonLoading(registerButton, false);
            }
        });
    } else { console.warn("[login.js] Register form or elements missing (check IDs: regUsername, regPassword, regInviteCode)."); }

    // --- RESET PASSWORD Form ---
    if (resetPasswordForm && resetPasswordButton && resetPasswordMessageDiv) {
        resetPasswordForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            displayValidationErrors(resetPasswordForm, null, resetPasswordMessageDiv);
            
            const passwordInput = resetPasswordForm.querySelector('#resetPassword');
            const confirmPasswordInput = resetPasswordForm.querySelector('#resetConfirmPassword');

            // Use the correct field names from the form object passed by the route
            const password = passwordInput ? passwordInput.value : '';
            const confirm_password = confirmPasswordInput ? confirmPasswordInput.value : ''; // Match the form field name

            let errors = {};
            if (!password) errors.password = 'Ny adgangskode er påkrævet.';
            if (!confirm_password) errors.confirm_password = 'Bekræftelse af adgangskode er påkrævet.';
            if (password && confirm_password && password !== confirm_password) {
                errors.confirm_password = 'Adgangskoderne stemmer ikke overens.';
            }
            // Add more client-side validation for password complexity if desired, matching ResetPasswordForm validators

            if (Object.keys(errors).length > 0) {
                // Pass field names matching the form definition ('password', 'confirm_password')
                return displayValidationErrors(resetPasswordForm, { errors }, resetPasswordMessageDiv);
            }

            toggleButtonLoading(resetPasswordButton, true, 'Nulstiller...');
            try {
                const actionUrl = resetPasswordForm.getAttribute('action');
                // Send field names matching the form definition expected by the backend
                const data = await postData(actionUrl, { password: password, confirm_password: confirm_password }); 
                
                showToast(data.message || "Password nulstillet! Du kan nu logge ind.", "success");
                if (data.flashes) displayFlashes(data.flashes);

                setTimeout(() => {
                    resetPasswordForm.reset();
                    window.showForm('login'); 
                }, 1500);
            } catch (error) {
                console.error("[login.js] Reset Password error:", error);
                // Pass field names matching the form definition for error display
                displayValidationErrors(resetPasswordForm, error.data, resetPasswordMessageDiv); 
            } finally {
                toggleButtonLoading(resetPasswordButton, false);
            }
        });
    } else { console.warn("[login.js] Reset Password form or its elements missing."); }


    // ================================================================
    // === INITIAL FORM DISPLAY LOGIC ===
    // ================================================================

    try {
        console.log("[login.js] Determining initial form to display...");
        let initialFormKey = document.body.dataset.initialForm || 'login';
        console.log(`[login.js] Initial form from data-attribute: ${initialFormKey}`);

        const urlParams = new URLSearchParams(window.location.search);
        const actionParam = urlParams.get('action');
        if (actionParam === 'register' && allFormsAndSections.register) {
             console.log("[login.js] URL action=register detected. Overriding initial form.");
            initialFormKey = 'register';
        }

        if (!allFormsAndSections.hasOwnProperty(initialFormKey) || !allFormsAndSections[initialFormKey]) {
            console.warn(`[login.js] Determined initialFormKey '${initialFormKey}' is invalid or element not found. Falling back to 'login'.`);
            initialFormKey = 'login';
        }

        console.log(`[login.js] Calling window.showForm with initial key: ${initialFormKey}`);
        window.showForm(initialFormKey);

    } catch (error) {
        console.error("[login.js] Error during initial form setup:", error);
        if (window.showForm) {
            console.warn("[login.js] Falling back to showing login form due to error during initial setup.");
            window.showForm('login');
        } else {
            console.error("[login.js] CRITICAL: window.showForm not available for fallback initial display!");
             if (loginForm) loginForm.classList.remove('hidden'); 
             else showToast("Kritisk fejl under sideindlæsning.", "danger", 10000);
        }
    }

    console.log("[login.js] All event listeners and initial setup completed.");

}); // End DOMContentLoaded
