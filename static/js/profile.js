// static/js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("[profile.js] DOMContentLoaded");

    // --- Set Progress Bar Width (Moved inside the main listener) ---
    const progressBar = document.getElementById('levelProgressBar');
    if (progressBar) {
        const percentage = progressBar.getAttribute('data-xp-percentage');
        if (percentage !== null && !isNaN(parseFloat(percentage))) {
            progressBar.style.width = `${parseFloat(percentage)}%`;
            console.log(`[profile.js] Set progress bar width to ${percentage}%`);
        } else {
            console.warn("[profile.js] Could not read or parse data-xp-percentage for progress bar.");
        }
    } else {
        // console.log("[profile.js] Progress bar element not found on this page.");
    }

    // === Konfiguration & Globale Data ===
    const profileCardElement = document.getElementById('profileInfoCard');
    if (!profileCardElement) {
        console.error("Profile card element (#profileInfoCard) not found. Script cannot run.");
        return; // Stop hvis basis element mangler
    }

    const profileUsername = profileCardElement.dataset.profileUsername;
    const isOwnProfile = profileCardElement.dataset.isOwnProfile === 'true'; // String 'true' til boolean
    const maxAvatarMb = profileCardElement.dataset.maxAvatarMb || 2; // Hent max MB
    const BETS_PER_PAGE = 15; // Antal bets pr. side

    console.log(`Profile.js Loaded. Viewing profile for: ${profileUsername}, Is Own: ${isOwnProfile}`);
    if (!profileUsername) {
        console.error("Profile username is missing from data-attributes. Cannot fetch user data.");
        // Overvej at vise en fejl til brugeren her
         if (typeof window.utils !== 'undefined' && window.utils.showToast) window.utils.showToast("Fejl: Brugerprofil information mangler.", "danger"); // Brug utils. hvis muligt her
         else console.log("Fejl: Brugerprofil information mangler."); // Fallback
    }

    // State for tab loading
    let betsLoaded = false;
    let recentLoaded = false;
    let statsLoaded = false; // Start som false for stats også
    let betsCurrentPage = 1;
    let betsHasMorePages = true;

    // === Dependency Check (window.utils) ===
    if (typeof window.utils === 'undefined' || !window.utils.showToast || !window.utils.getData || !window.utils.putData || !window.utils.toggleButtonLoading || !window.utils.formatCurrency || !window.utils.formatDateTime || !window.utils.getCsrfToken || !window.utils.escapeHtml || !window.utils.initializeTooltips) {
        console.error("[Profile.js] CRITICAL: window.utils object or required functions missing!");
        const errTarget = document.getElementById('profileInfoCard') || document.body;
        if (errTarget) errTarget.innerHTML = '<div class="alert alert-danger">Kritisk sidefejl: Nødvendige JavaScript Utilities mangler.</div>';
        return; // Stop script execution
    } else {
        console.log("[Profile.js] window.utils object and required functions verified.");
    }
    // Note: Vi bruger utils.X direkte i koden herunder, ingen destructuring for at matche ændringsanmodningerne.

    // === Element Referencer (med checks) ===
     const getElement = (id) => {
         const element = document.getElementById(id);
        if (!element) console.warn(`Element with ID #${id} not found.`);
         return element;
     };

    // --- Helper: Inline Feedback (specifikt til form/modal feedback divs) ---
    const showInlineFeedback = (feedbackDiv, message, type = 'info') => {
        if (!feedbackDiv) return;
        const alertClass = `alert-${type}`;
        // Ryd gamle alert-klasser før ny sættes
        feedbackDiv.className = 'feedback-area mt-2'; // Basis klasse (juster om nødvendigt)
        if (message) {
            // BRUG IKKE escapeHtml her, medmindre du specifikt vil vise HTML-tags som tekst
            feedbackDiv.textContent = message;
            feedbackDiv.classList.add('alert', alertClass); // Tilføj Bootstrap alert styling
            feedbackDiv.style.display = 'block';
        } else {
            feedbackDiv.textContent = ''; // Ryd tekst
            feedbackDiv.style.display = 'none'; // Skjul helt
        }
    };

    const profileAvatarImage = getElement('profileAvatarImage');
    const avatarFileIn = getElement('avatarFile');
    const submitAvatarBtn = getElement('submitAvatarBtn');
    const avatarFeedback = getElement('avatarFeedback');
    const avatarActionsDiv = getElement('avatarActions'); // Div omkring avatar knapper/input

    const editProfileModalEl = getElement('editProfileModal');
    const saveProfileBtn = getElement('saveProfileBtn');
    const profileEmailInput = getElement('profileEmailInput');
    const editProfileFeedbackDiv = getElement('editProfileFeedback');
    const displayEmailSpan = getElement('displayEmail');

    const editAboutModalEl = getElement('editAboutModal');
    const saveAboutBtn = getElement('saveAboutBtn');
    const aboutMeTextarea = getElement('aboutMeTextareaInput');
    const editAboutFeedbackDiv = getElement('editAboutFeedback');
    const aboutMeDisplay = getElement('aboutMeText');

    const refreshStatsBtn = getElement('refreshStatsBtn');
    const statsFeedbackDiv = getElement('statsFeedback');
    // const statsTableBody = document.querySelector('#statsPane table tbody'); // Tjekker ikke for denne for nu

    const filterBetsBtn = getElement('filterBetsBtn');
    const betStartDateInput = getElement('bet_start_date');
    const betEndDateInput = getElement('bet_end_date');
    const loadMoreBetsBtn = getElement('loadMoreBetsBtn');
    const betsTableBody = getElement('betsTableBody');
    const betsFeedbackDiv = getElement('betsFeedback');
    const betsLoadingRow = betsTableBody?.querySelector('.table-loading-row'); // OK at querySelector fra et fundet element
    const betsNoDataRow = betsTableBody?.querySelector('.table-no-data-row');

    const refreshRecentBtn = getElement('refreshRecentBtn');
    const recentActivityList = getElement('recentActivityList');
    const recentFeedbackDiv = getElement('recentFeedback');
    const recentLoadingIndicator = recentActivityList?.querySelector('.loading-indicator');
    const recentNoDataIndicator = recentActivityList?.querySelector('.no-data-indicator');


    // --- AVATAR UPLOAD Logic (med CSRF check) ---
    if (isOwnProfile && avatarFileIn && submitAvatarBtn && profileAvatarImage) {
         if (submitAvatarBtn) submitAvatarBtn.style.display = 'none'; // Skjul knap ved start

         avatarFileIn.addEventListener('change', () => {
             if (avatarFileIn.files.length > 0) {
                 if (submitAvatarBtn) submitAvatarBtn.style.display = 'block'; // Eller inline-block
                 if (avatarFeedback) {
                    avatarFeedback.textContent = `Valgt: ${avatarFileIn.files[0].name}`;
                    avatarFeedback.className = 'form-text text-muted small mt-1';
                 }
            } else {
                 if (submitAvatarBtn) submitAvatarBtn.style.display = 'none';
                 if (avatarFeedback) {
                    avatarFeedback.textContent = `Max ${maxAvatarMb}MB. JPG, PNG, GIF.`;
                 }
            }
         });

         submitAvatarBtn.addEventListener('click', async () => {
             if (!avatarFileIn.files || avatarFileIn.files.length === 0) return;

             const file = avatarFileIn.files[0];
             // Validering FØR fetch
             if (file.size > maxAvatarMb * 1024 * 1024) {
                showInlineFeedback(avatarFeedback, `Filen er for stor (max ${maxAvatarMb}MB).`, 'danger'); // Bruger LOKAL showInlineFeedback
                 return;
             }
             // TODO: Client-side filtype tjek kan tilføjes her

             const csrfToken = utils.getCsrfToken(); // <-- BRUG utils.
             if (!csrfToken) {
                 utils.showToast("Sikkerhedsfejl: Kunne ikke verificere handling.", "danger"); // <-- BRUG utils.
                 return;
             }

             utils.toggleButtonLoading(submitAvatarBtn, true); // <-- BRUG utils.
             showInlineFeedback(avatarFeedback, 'Uploader...', 'info'); // Bruger LOKAL showInlineFeedback

             const formData = new FormData();
             formData.append('avatarFile', file);

             try {
                // Brug specifik endpoint, INGEN utils.postData/putData da det er FormData
                const response = await fetch(`/upload_avatar`, {
                    method: 'POST',
                    body: formData,
                    headers: { 'X-CSRFToken': csrfToken } // Manuel CSRF her
                 });

                 const result = await response.json(); // Prøv altid at parse JSON
                if (!response.ok) {
                    // Prøv at få fejlbesked fra JSON, ellers brug status tekst
                     throw new Error(result.error || result.message || `Uploadfejl (Status: ${response.status})`);
                }

                 // Succes
                 const newAvatarUrlWithCacheBuster = result.new_avatar_url + '?t=' + Date.now();
                 if(profileAvatarImage) profileAvatarImage.src = newAvatarUrlWithCacheBuster; // Update main profile image

                 // Update topbar and sidebar avatars as well
                 const topbarAvatar = document.getElementById('topbarAvatarImg');
                 const sidebarAvatar = document.getElementById('sidebarAvatarImg');
                 if (topbarAvatar) topbarAvatar.src = newAvatarUrlWithCacheBuster;
                 if (sidebarAvatar) sidebarAvatar.src = newAvatarUrlWithCacheBuster;

                 if(avatarFeedback) avatarFeedback.textContent = 'Avatar opdateret!'; // Direkte tekst
                 if(submitAvatarBtn) submitAvatarBtn.style.display = 'none';
                 avatarFileIn.value = ''; // Nulstil input
                utils.showToast('Avatar opdateret!', 'success'); // <-- BRUG utils.

             } catch (error) {
                 console.error("Avatar upload error:", error);
                showInlineFeedback(avatarFeedback, `Fejl: ${error.message}`, 'danger'); // Bruger LOKAL showInlineFeedback
                 utils.showToast(`Uploadfejl: ${error.message}`, 'danger'); // <-- BRUG utils.
             } finally {
                 utils.toggleButtonLoading(submitAvatarBtn, false); // <-- BRUG utils.
             }
         });
     } else if (isOwnProfile) {
          console.warn("Could not find all necessary elements for avatar upload.");
     }


    // --- EDIT PROFILE Modal Logic (Email etc.) ---
    if (isOwnProfile && editProfileModalEl && saveProfileBtn && profileEmailInput && displayEmailSpan && typeof bootstrap !== 'undefined') {
         const modalInstance = bootstrap.Modal.getOrCreateInstance(editProfileModalEl);

         editProfileModalEl.addEventListener('show.bs.modal', () => {
            const currentEmail = displayEmailSpan ? displayEmailSpan.textContent.trim() : '';
            profileEmailInput.value = (currentEmail && currentEmail !== 'Skjult' && currentEmail !== 'Ikke angivet') ? currentEmail : '';
             showInlineFeedback(editProfileFeedbackDiv, '', 'info'); // Ryd feedback (LOKAL funktion)
         });

         saveProfileBtn.addEventListener('click', async () => {
            utils.toggleButtonLoading(saveProfileBtn, true); // <-- BRUG utils.
            showInlineFeedback(editProfileFeedbackDiv, '', 'info'); // Ryd feedback (LOKAL funktion)

            // Tjekker for putData nu, da vi bruger PUT
            if (!utils.putData) { // <-- BRUG utils.
                utils.showToast("Fejl: Gem-funktion er ikke konfigureret korrekt.", "danger"); // <-- BRUG utils.
                 utils.toggleButtonLoading(saveProfileBtn, false); // <-- BRUG utils.
                 return;
            }

            const newEmail = profileEmailInput.value.trim();
            // Basic email validation
            if (newEmail && !/\S+@\S+\.\S+/.test(newEmail)) {
                 showInlineFeedback(editProfileFeedbackDiv, 'Indtast venligst en gyldig email adresse.', 'warning'); // LOKAL funktion
                 utils.toggleButtonLoading(saveProfileBtn, false); // <-- BRUG utils.
                return;
            }

            try {
                const payload = { email: newEmail }; // Kan udvides med flere felter
                // Bruger utils.putData og sender IKKE 'PUT' som parameter
                const result = await utils.putData(`/api/profile/details`, payload); // <-- BRUG utils.putData

                // Opdater UI on success (bruger data fra API response)
                 if (displayEmailSpan && result.updated_data && result.updated_data.email !== undefined) {
                     displayEmailSpan.textContent = result.updated_data.email || 'Ikke angivet';
                 } else if (displayEmailSpan) {
                    // Fallback til det brugeren indtastede, hvis API ikke returnerer opdateret data
                     displayEmailSpan.textContent = newEmail || 'Ikke angivet';
                 }


                 modalInstance.hide();
                 utils.showToast(result?.message || 'Profil opdateret!', 'success'); // <-- BRUG utils.

            } catch (error) {
                 console.error("Error saving profile details:", error);
                 showInlineFeedback(editProfileFeedbackDiv, `Fejl: ${error.message}`, 'danger'); // LOKAL funktion
                 utils.showToast(`Gem profil fejlet: ${error.message}`, 'danger'); // <-- BRUG utils.
            } finally {
                utils.toggleButtonLoading(saveProfileBtn, false); // <-- BRUG utils.
            }
        });
    } else if (isOwnProfile) {
        console.warn("Could not find all elements or Bootstrap for editing profile details.");
    }


    // --- EDIT ABOUT ME Modal Logic ---
    if (isOwnProfile && editAboutModalEl && saveAboutBtn && aboutMeTextarea && aboutMeDisplay && typeof bootstrap !== 'undefined') {
         const modalInstance = bootstrap.Modal.getOrCreateInstance(editAboutModalEl);
         const defaultAboutPlaceholderHTML = `<span class="text-muted fst-italic">Brugeren har ikke tilføjet en beskrivelse endnu.</span>`;

         editAboutModalEl.addEventListener('show.bs.modal', () => {
            // Tjek om det nuværende indhold er placeholderen
            const isPlaceholder = aboutMeDisplay.querySelector('span.text-muted.fst-italic');
            // Få ren tekst - fjern <br> -> \n - trim
            const currentHTML = aboutMeDisplay.innerHTML || '';
            const currentText = isPlaceholder ? '' : currentHTML.replace(/<br\s*[\/]?>/gi, "\n").trim();
            aboutMeTextarea.value = currentText;
            showInlineFeedback(editAboutFeedbackDiv, '', 'info'); // Ryd feedback (LOKAL funktion)
         });

         saveAboutBtn.addEventListener('click', async () => {
            utils.toggleButtonLoading(saveAboutBtn, true); // <-- BRUG utils.
            showInlineFeedback(editAboutFeedbackDiv, '', 'info'); // Ryd feedback (LOKAL funktion)

             // Tjekker for putData
            if (!utils.putData) { // <-- BRUG utils.
                utils.showToast("Fejl: Gem-funktion er ikke konfigureret korrekt.", "danger"); // <-- BRUG utils.
                 utils.toggleButtonLoading(saveAboutBtn, false); // <-- BRUG utils.
                return;
            }

             const newText = aboutMeTextarea.value.trim(); // Hent ny tekst

             try {
                const payload = { about_me_text: newText }; // Nøgle som backend forventer
                // Bruger utils.putData og sender IKKE 'PUT' som parameter
                const result = await utils.putData(`/api/profile/about`, payload); // <-- BRUG utils.putData

                // Opdater display on success
                 if (aboutMeDisplay) {
                     aboutMeDisplay.innerHTML = result.new_text
                        ? result.new_text.replace(/\n/g, '<br>') // <-- FJERN escapeHTML, backend sanerer
                        : defaultAboutPlaceholderHTML;
                }

                modalInstance.hide();
                utils.showToast(result?.message || '"Om Mig" opdateret!', 'success'); // <-- BRUG utils.

             } catch (error) {
                 console.error("Error saving about me:", error);
                 showInlineFeedback(editAboutFeedbackDiv, `Fejl: ${error.message}`, 'danger'); // LOKAL funktion
                 utils.showToast(`Gem "Om Mig" fejlet: ${error.message}`, 'danger'); // <-- BRUG utils.
            } finally {
                utils.toggleButtonLoading(saveAboutBtn, false); // <-- BRUG utils.
             }
        });
    } else if (isOwnProfile) {
         console.warn("Could not find all elements or Bootstrap for editing about me.");
    }


    // --- AJAX: Fetch & Render Stats ---
     const fetchAndRenderStats = async () => {
        if (!profileUsername) {
             showInlineFeedback(statsFeedbackDiv, 'Kan ikke hente statistik: Brugerinformation mangler.', 'danger'); // LOKAL funktion
            return;
         }
         // Vi tjekker ikke for statsTableBody mere, stoler på ID'erne nedenfor

        console.log(`Fetching stats for ${profileUsername}...`);
        utils.toggleButtonLoading(refreshStatsBtn, true); // <-- BRUG utils.
        showInlineFeedback(statsFeedbackDiv, '', 'info'); // Ryd feedback (LOKAL funktion)

        try {
            // Brug getData helper
             const stats = await utils.getData(`/api/user/stats/${profileUsername}`); // <-- BRUG utils.

             // Opdater DOM element for element med checks
             const updateStatElement = (id, value, formatter = null, className = '') => {
                const el = getElement(id);
                 if (el) {
                    // Brug formatter HVIS den er givet OG det er en funktion
                    el.innerHTML = (formatter && typeof formatter === 'function') ? formatter(value) : (value ?? '-');
                    // Anvend klassenavn hvis givet
                    if (className) {
                         // Bevar eksisterende grundlæggende klasser hvis muligt, tilføj/erstat specifikke
                         el.className = `stat-value ${className}`; // Juster basisklasse efter behov
                     } else if (el.classList.contains('stat-value')) {
                         // Gendan standard hvis ingen specifik klasse er givet
                         el.className = 'stat-value';
                     }
                }
            };

            // Brug utils.formatCurrency direkte
            updateStatElement('stat-balance', stats.balance, utils.formatCurrency);
            updateStatElement('stat-staked', stats.total_staked, utils.formatCurrency);
            updateStatElement('stat-won', stats.total_won, utils.formatCurrency);
            updateStatElement('stat-lost', stats.total_lost, utils.formatCurrency);
            updateStatElement('stat-winslosses', `${stats.wins ?? 0} / ${stats.losses ?? 0}`);

            // --- Update NEW stats elements ---
            updateStatElement('stat-total-bets', stats.total_bets_placed ?? 0); // Use the field name from backend context
            updateStatElement('stat-winrate', `${stats.win_rate ?? 0}%`); // Assuming win_rate is pre-calculated %
            updateStatElement('stat-largest-win', stats.largest_win, utils.formatCurrency); // Use field from API
            updateStatElement('stat-largest-loss', stats.largest_loss, utils.formatCurrency); // Use field from API
            const netValue = stats.net_profit ?? 0; // Use field from API
            updateStatElement('stat-net', netValue, utils.formatCurrency, netValue >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold');

             statsLoaded = true;
             utils.showToast('Statistik opdateret', 'info'); // <-- BRUG utils.

        } catch (error) {
            console.error("Error refreshing stats:", error);
            showInlineFeedback(statsFeedbackDiv, `Statistik Fejl: ${error.message}`, 'warning'); // LOKAL funktion
            utils.showToast(`Statistik fejl: ${error.message}`, 'warning'); // <-- BRUG utils.
        } finally {
             utils.toggleButtonLoading(refreshStatsBtn, false); // <-- BRUG utils.
        }
    };
     if (refreshStatsBtn) { refreshStatsBtn.addEventListener('click', fetchAndRenderStats); }


    // --- AJAX: Fetch & Render Bets History ---
     // Helper til tabel state (uændret)
     const setBetsTableState = (state) => { // state kan være 'loading', 'data', 'nodata', 'error'
         if (!betsTableBody) return;

         const hasDataRows = betsTableBody.querySelectorAll('tr:not(.table-loading-row):not(.table-no-data-row)').length > 0;

         if (betsLoadingRow) betsLoadingRow.style.display = (state === 'loading') ? 'table-row' : 'none';
        if (betsNoDataRow) betsNoDataRow.style.display = (state === 'nodata' && !hasDataRows) ? 'table-row' : 'none'; // Vis kun 'no data' hvis der *virkelig* ikke er data

        // Styr 'Load More' knappen
         if (loadMoreBetsBtn) {
            loadMoreBetsBtn.style.display = (state === 'data' && betsHasMorePages) ? 'block' : 'none';
         }
     };

     // Skab række (opdateret til at bruge utils)
    const createBetRow = (bet) => {
          const tr = document.createElement('tr');
          let resultBadge;
          let netAmount = 0;
          let netClass = 'text-muted';
          const stake = bet.stake ?? 0;
          const payoutIfWon = bet.payout ?? 0; // Antager ren gevinst

          if (bet.status?.toLowerCase() === 'afgjort') {
              if (bet.result?.toLowerCase() === 'won') {
                  resultBadge = '<span class="badge bg-success">Vundet</span>';
                  netAmount = payoutIfWon;
                  netClass = 'text-success';
              } else if (bet.result?.toLowerCase() === 'lost') {
                  resultBadge = '<span class="badge bg-danger">Tabt</span>';
                  netAmount = -stake;
                  netClass = 'text-danger';
              } else {
                 resultBadge = `<span class="badge bg-secondary">${bet.result || 'Uafgjort'}</span>`;
                 netAmount = 0;
              }
          } else {
             resultBadge = `<span class="badge bg-warning text-dark">${bet.status || 'Afventer'}</span>`;
             netAmount = null;
              netClass = '';
          }

          // Brug utils. for escaping og formatting
          tr.innerHTML = `
              <td>${utils.escapeHtml(bet.match_name || 'N/A')}</td>
              <td>${utils.escapeHtml(bet.outcome_name || 'N/A')}</td>
              <td class="text-end">${utils.formatCurrency(stake)}</td>
              <td>${utils.formatDateTime(bet.timestamp)}</td>
              <td class="text-center">${resultBadge}</td>
              <td class="text-end ${netClass}">${netAmount !== null ? utils.formatCurrency(netAmount) : '<span class="text-muted">-</span>'}</td>
          `;
          return tr;
      };


     // Hent og vis bets (opdateret til at bruge utils)
    const fetchAndRenderBets = async (page = 1, append = false) => {
         if (!profileUsername || !betsTableBody) return;

         utils.toggleButtonLoading(filterBetsBtn, true); // <-- BRUG utils.
         if (append && loadMoreBetsBtn) utils.toggleButtonLoading(loadMoreBetsBtn, true); // <-- BRUG utils.

         setBetsTableState('loading'); // Vis loading state
        showInlineFeedback(betsFeedbackDiv, '', 'info'); // Ryd feedback (LOKAL funktion)

        const startDate = betStartDateInput?.value;
        const endDate = betEndDateInput?.value;
         const params = new URLSearchParams({
             page: page.toString(),
             per_page: BETS_PER_PAGE.toString()
         });
         if (startDate) params.append('start_date', startDate);
         if (endDate) params.append('end_date', endDate);

         const apiUrl = `/api/user/${profileUsername}/bet_history?${params.toString()}`;
         console.log(`Fetching bets: ${apiUrl}`);

         try {
            // Brug getData helper
             const data = await utils.getData(apiUrl); // <-- BRUG utils.

            // Ryd gamle rækker hvis det er et nyt filter/første load
             if (!append) {
                betsTableBody.querySelectorAll('tr:not(.table-loading-row):not(.table-no-data-row)').forEach(row => row.remove());
            }

             if (data.bets && data.bets.length > 0) {
                data.bets.forEach(bet => betsTableBody.appendChild(createBetRow(bet))); // createBetRow bruger nu utils
                 betsCurrentPage = page;
                betsHasMorePages = data.pagination ? page < data.pagination.total_pages : false;
                 setBetsTableState('data');
            } else {
                betsHasMorePages = false;
                setBetsTableState('nodata');
                 if (!append) {
                     showInlineFeedback(betsFeedbackDiv, 'Ingen bets fundet for de valgte kriterier.', 'info'); // LOKAL
                 } else {
                     showInlineFeedback(betsFeedbackDiv, 'Ingen flere bets at vise.', 'info'); // LOKAL
                }
            }

         } catch (error) {
            console.error("Error fetching/rendering bets:", error);
            showInlineFeedback(betsFeedbackDiv, `Fejl: ${error.message}`, 'warning'); // LOKAL
             setBetsTableState('error');
            betsHasMorePages = false;
         } finally {
             utils.toggleButtonLoading(filterBetsBtn, false); // <-- BRUG utils.
             if (append && loadMoreBetsBtn) utils.toggleButtonLoading(loadMoreBetsBtn, false); // <-- BRUG utils.
         }
     };

     // Event Listeners for Bets Tab (uændret logik)
     if (filterBetsBtn) {
         filterBetsBtn.addEventListener('click', () => {
             betsCurrentPage = 1;
            fetchAndRenderBets(betsCurrentPage, false);
        });
     }
     if (loadMoreBetsBtn) {
         loadMoreBetsBtn.addEventListener('click', () => {
             if (betsHasMorePages) {
                fetchAndRenderBets(betsCurrentPage + 1, true);
             }
         });
     }


    // --- AJAX: Fetch & Render Recent Activity ---
    const renderRecentActivity = (activities) => {
         if (!recentActivityList) return;
         recentActivityList.innerHTML = ''; // Ryd altid først

         if (!activities || activities.length === 0) {
             recentActivityList.innerHTML = `<div class="list-group-item text-muted text-center small p-3 no-data-indicator">Ingen nylig aktivitet fundet.</div>`;
             return;
         }

         activities.forEach(act => {
             const icon = act.icon || 'fa-info-circle';
             const color = act.icon_color || 'text-muted';

             const div = document.createElement('div');
             div.className = 'list-group-item list-group-item-action list-group-item-dark p-2 border-bottom border-secondary';

             // Brug utils. for escaping og formatting direkte i template literal
             div.innerHTML = `
                 <div class="d-flex w-100 justify-content-between align-items-center">
                     <span class="me-2 small">
                         <i class="fas ${icon} fa-fw me-2 ${color}"></i>
                         ${utils.escapeHtml(act.description || 'Ukendt aktivitet')}
                     </span>
                     <small class="text-muted text-nowrap">${utils.formatDateTime(act.timestamp)}</small>
                 </div>
                 ${act.amount ? `<div class="ps-4 small ${act.type === 'win' ? 'text-success' : (act.type === 'loss' ? 'text-danger' : 'text-info')}">${act.type === 'win' ? '+' : (act.type === 'loss' ? '-' : '')} ${utils.formatCurrency(Math.abs(act.amount))}</div>` : ''}
            `;
            recentActivityList.appendChild(div);
        });
     };

     const fetchAndRenderRecent = async () => {
         if (!profileUsername || !recentActivityList) return;
         console.log(`Fetching recent activity for ${profileUsername}`);
         utils.toggleButtonLoading(refreshRecentBtn, true); // <-- BRUG utils.
        showInlineFeedback(recentFeedbackDiv, '', 'info'); // LOKAL
         recentActivityList.innerHTML = `<div class="list-group-item text-center loading-indicator"><span class="spinner-border spinner-border-sm"></span> Henter...</div>`;

         try {
             // Brug getData helper
             const data = await utils.getData(`/api/user/recent_activity/${profileUsername}`); // <-- BRUG utils.
             renderRecentActivity(data.activities); // renderRecentActivity bruger nu utils
             recentLoaded = true;
             utils.showToast('Aktivitetsliste opdateret.', 'info'); // <-- BRUG utils.

         } catch (error) {
            console.error("Error fetching/rendering recent activity:", error);
            recentActivityList.innerHTML = `<div class="list-group-item text-danger text-center small p-3 no-data-indicator">Kunne ikke hente aktivitet: ${error.message}</div>`;
            showInlineFeedback(recentFeedbackDiv, `Fejl: ${error.message}`, 'warning'); // LOKAL
            utils.showToast(`Aktivitetsfejl: ${error.message}`, 'warning'); // <-- BRUG utils.
         } finally {
             utils.toggleButtonLoading(refreshRecentBtn, false); // <-- BRUG utils.
         }
     };
    if (refreshRecentBtn) { refreshRecentBtn.addEventListener('click', fetchAndRenderRecent); }


    // --- TAB ACTIVATION Logic (uændret logik, men afhængige funktioner er opdateret) ---
     const handleTabActivation = (targetPaneId) => {
        console.log(`Activating tab: ${targetPaneId}`);
        switch (targetPaneId) {
             case 'statsPane':
                 if (!statsLoaded) fetchAndRenderStats(); // Bruger opdateret fetchAndRenderStats
                 break;
             case 'betsPane':
                 if (!betsLoaded) {
                    fetchAndRenderBets(1, false); // Bruger opdateret fetchAndRenderBets
                    betsLoaded = true;
                 }
                 break;
            case 'recentPane':
                 if (!recentLoaded) fetchAndRenderRecent(); // Bruger opdateret fetchAndRenderRecent
                 break;
        }
    };

    const profileTabs = document.querySelectorAll('#profileTab .nav-link[data-bs-toggle="tab"]');
    profileTabs.forEach(tab => {
         tab.addEventListener('shown.bs.tab', (event) => {
            const targetPaneId = event.target.getAttribute('data-bs-target')?.substring(1);
            if (targetPaneId) {
                handleTabActivation(targetPaneId);
             }
        });
     });

     // Aktiver data load for den initielt aktive tab (uændret)
    const initiallyActiveTab = document.querySelector('#profileTab .nav-link.active');
     if (initiallyActiveTab) {
         const initiallyActivePaneId = initiallyActiveTab.getAttribute('data-bs-target')?.substring(1);
        if (initiallyActivePaneId) {
             setTimeout(() => handleTabActivation(initiallyActivePaneId), 50);
        }
     }

    // --- Initialiser Bootstrap Tooltips via Utils ---
    utils.initializeTooltips(); // Kald den globale fra utils.js


}); // Close DOMContentLoaded listener
