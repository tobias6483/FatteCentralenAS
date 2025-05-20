// static/js/session_details.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("Session Details script loaded.");

    // --- DEPENDENCIES CHECK (Fra utils.js og app.js) ---
    if (typeof utils === 'undefined' || !utils.escapeHtml || !utils.showToast || !utils.toggleButtonLoading || !utils.formatCurrency || !utils.formatDateTime) { // Added formatCurrency/DateTime check for robustness
        console.error("Utils.js not loaded or missing required functions (escapeHtml, showToast, toggleButtonLoading, formatCurrency, formatDateTime). Session details page might malfunction.");
        // Vis en fejl til brugeren?
        const body = document.querySelector('body');
        if(body) body.insertAdjacentHTML('afterbegin', '<div class="alert alert-danger m-3">Kritisk fejl: Nødvendige hjælpefunktioner mangler. Siden fungerer muligvis ikke korrekt.</div>');
        // return; // Vælg om scriptet skal stoppe helt
    }
    if (!window.globalSocket) {
        console.error("Global socket instance (window.globalSocket) not found from app.js. Realtime updates disabled.");
        // Vis fejl - det håndteres dog også nedenfor ved socket initialisering
    }
     if (typeof window.updateGlobalSidebar !== 'function') {
         console.error("Global sidebar update function (window.updateGlobalSidebar) not found from app.js.");
     }

    // --- Hent Dynamiske Værdier ---
    const sessionContainer = document.getElementById("sessionDetailsContainer");
    const sessionId = sessionContainer ? sessionContainer.dataset.sessionId : null;
    const currentUser = window.currentUser || null;

    if (!sessionId) {
        console.error("Session ID could not be found in the DOM (missing data-session-id attribute on #sessionDetailsContainer?). Script cannot function.");
        // Use utils.showToast for critical error display if available
        if (typeof utils !== 'undefined' && utils.showToast) {
            utils.showToast("Kritisk fejl: Session ID mangler. Siden kan ikke fungere.", 'danger', 0); // 0 for persistent
        } else {
            // Fallback if utils not loaded yet
            const body = document.querySelector('body');
            if(body) body.insertAdjacentHTML('afterbegin', '<div class="alert alert-danger m-3">Kritisk fejl: Session ID mangler.</div>');
        }
        return; // Stop scriptet hvis ID mangler
    }
     console.log(`Session Details Init: Session ID=${sessionId}, User=${currentUser}`);


    // --- DOM Element References ---
    const outcomesTbody = document.getElementById("outcomes_tbody");
    const playersTbody = document.getElementById("players_tbody");
    const betsTbody = document.getElementById("bets_tbody");
    const totalPotSpan = document.getElementById("total_pot_span");
    const placeBetForm = document.getElementById('placeBetForm');
    const outcomeSelect = document.getElementById("betOutcomeSelect");
    const stakeInput = document.getElementById("betStake");
    const placeBetBtn = placeBetForm ? placeBetForm.querySelector('button[type="submit"]') : null;
    const feedbackDiv = document.getElementById('sessionDetailFeedback'); // Generelt feedback område

    // Elements for the new Coupon Bet Form
    const placeCouponBetForm = document.getElementById('placeCouponBetForm');
    const couponStakeInput = document.getElementById('couponBetStake');
    const placeCouponBetBtn = placeCouponBetForm ? placeCouponBetForm.querySelector('button[type="submit"]') : null;
    const couponFeedbackDiv = document.getElementById('placeCouponBetFeedback');

    // Besked elementer for tomme lister (valgfrit, men godt for UX)
    const noOutcomesMsg = document.getElementById("no_outcomes_msg");
    const noPlayersMsg = document.getElementById("no_players_msg");
    const noBetsMsg = document.getElementById("no_bets_msg");
    const copyInviteBtn = document.getElementById("copyInviteLinkBtn");

    // Chat elements
    const chatMessagesArea = document.getElementById("chatMessagesArea");
    const chatMessageInput = document.getElementById("chatMessageInput");
    const sendChatMessageBtn = document.getElementById("sendChatMessageBtn");

    // --- Socket.IO Setup & Listeners ---
    const socket = window.globalSocket; // Brug den globale socket fra app.js

    if (socket) {
        try {
            console.log("Session Details: Using global socket instance.");

            // Join det specifikke rum for denne session
            socket.emit("join_room", { room: `session_${sessionId}` });
            console.log(`Session Details: Emitted 'join_room' for room: session_${sessionId}`);

            // === MASTER LISTENER: Lyt efter den generelle opdatering ===
            socket.on("session_update", (data) => {
                 console.log("Socket event received (session_update):", data);

                // Sikkerhedstjek: Ignorer data, hvis det ikke er for denne session
                if (data.session_id && data.session_id !== sessionId) {
                    console.warn(`Received update for wrong session ID (${data.session_id}), expected ${sessionId}. Ignoring.`);
                    return;
                 }
                // Opdater UI-komponenter baseret på de data, vi modtog
                 if (data.outcomes !== undefined) renderOutcomes(data.outcomes); // data.outcomes kan være []
                if (data.players !== undefined) renderPlayers(data.players);   // data.players kan være {}
                 if (data.bets !== undefined) renderBetLog(data.bets);       // data.bets kan være []
                // Andre opdateringer? F.eks. session status, titel, timer...
                 // if (data.status) { document.getElementById('sessionStatusSpan').textContent = data.status; }
             });

            // === Specifikke Listeners (Primært til Notifikationer/Toasts) ===
             // Disse opdaterer IKKE nødvendigvis UI direkte (det gør session_update),
             // men viser beskeder til brugeren.
            socket.on("bet_placed", (data) => {
                console.log("Socket event received (bet_placed):", data);
                if (data.session_id && data.session_id !== sessionId) return; // Check session ID

                 // Vis KUN toast hvis det er relevant (f.eks. ikke for egne bets hvis ACK håndterer det)
                 // eller hvis serveren sender en specifik besked
                if (data.message && data.username !== currentUser) { // Vis kun hvis det er en andens bet ELLER der er en specifik server-besked
                    utils.showToast(data.message, data.success ? 'info' : 'warning'); // Brug 'info' for andres bets
                 }
                 // UI opdatering sker via 'session_update', som serveren BØR sende efter et bet.
             });

            socket.on("bet_finished", (data) => {
                 console.log("Socket event received (bet_finished):", data);
                if (data.session_id && data.session_id !== sessionId) return; // Check session ID

                // Annoncér resultatet med en toast
                // Serveren bør sende en klar besked
                 if (data.message) {
                     utils.showToast(data.message, data.success ? 'success' : 'info');
                 } else { // Fallback besked
                    const sessionName = data.session_name || 'Spillet';
                    if (data.winner_info && data.winner_info.username === currentUser) {
                        // **** RETTET HER ****
                        utils.showToast(`Tillykke! Du vandt ${utils.formatCurrency ? utils.formatCurrency(data.winner_info.payout || 0) : (data.winner_info.payout || 0).toFixed(2) + ' DKK'} på udfaldet '${utils.escapeHtml(data.winner_info.outcome_name)}' i '${utils.escapeHtml(sessionName)}'!`, 'success');
                    } else {
                        utils.showToast(`${utils.escapeHtml(sessionName)} er afsluttet.`, 'info');
                    }
                 }
                 // UI opdatering (f.eks. visning af vinder, disable bet form) sker via 'session_update'.
            });

            socket.on('connect_error', (err) => {
                 console.error('Session Details Socket connection error:', err);
                showErrorFeedback(`Kunne ikke forbinde til real-time serveren: ${err.message}`);
            });

            socket.on('disconnect', (reason) => {
                console.warn(`Session Details Socket disconnected: ${reason}`);
                showErrorFeedback('Forbindelsen til real-time serveren blev afbrudt. Prøver at genoprette...', 'warning');
                // Socket.IO forsøger selv at genoprette forbindelsen.
             });

        } catch (e) {
            console.error("Failed to initialize Socket.IO listeners for session details:", e);
            showErrorFeedback("Fejl ved opsætning af real-time opdateringer.");
        }
    } else {
        console.error("Socket instance is missing. Real-time updates are disabled.");
        showErrorFeedback("Real-time serverforbindelse mangler. Siden vil ikke opdatere automatisk.");
    }


    // -------------------------------------------------------------------------
    // 7. RENDERING AF SESSION/BETTING DATA (HELPER FUNKTIONER - Fra gl. app.js)
    //    Opdateret til at bruge specifikke tbody ID'er og utils.js
    // -------------------------------------------------------------------------

    function renderOutcomes(outcomes) {
        if (!outcomesTbody) {
            console.warn("Outcomes table body ('outcomes_tbody') not found.");
            return;
        }
        let html = "";
        let totalPot = 0;
        const validOutcomes = Array.isArray(outcomes) ? outcomes.filter(o => o && typeof o === 'object') : [];

        if (validOutcomes.length === 0) {
            outcomesTbody.innerHTML = ''; // Ryd
             if (noOutcomesMsg) noOutcomesMsg.style.display = 'table-row'; // Vis besked (skal være table-row for tbody)
        } else {
            if (noOutcomesMsg) noOutcomesMsg.style.display = 'none'; // Skjul besked
            validOutcomes.forEach(o => {
                 const nameDisplay = utils.escapeHtml(o.name || "Ukendt Udfald");
                 const oddsDisplay = (o.odds != null) ? parseFloat(o.odds).toFixed(2) : "N/A";
                const potValue = (o.pot != null) ? parseFloat(o.pot) : 0;
                // Display pot per outcome without currency symbol for table cleanliness
                const potDisplay = potValue.toFixed(2);
                totalPot += potValue; // Tæl sammen til total pot

                html += `
                  <tr>
                    <td>${nameDisplay}</td>
                    <td class="text-end">${oddsDisplay}</td>
                    <td class="text-end">${potDisplay} DKK</td> {# Explicitly add DKK here for clarity #}
                  </tr>
                `;
            });
            outcomesTbody.innerHTML = html;

            // Opdater <select>
             if (outcomeSelect) updateOutcomeSelect(validOutcomes);
        }

        // Opdater total pot span med utils.formatCurrency
         if (totalPotSpan) {
             // **** RETTET HER ****
             const formattedPot = typeof utils !== 'undefined' && utils.formatCurrency ? utils.formatCurrency(totalPot) : totalPot.toFixed(2) + " DKK";
             totalPotSpan.textContent = formattedPot;
         }
     }

     function updateOutcomeSelect(outcomes) {
         if (!outcomeSelect) return;
         // Bevar nuværende værdi for at undgå reset under skrivning
         const currentValue = outcomeSelect.value;

         // Ryd kun options udover den første (disabled)
        while (outcomeSelect.options.length > 1) {
            outcomeSelect.remove(1);
         }

        outcomes.forEach((o, idx) => {
            if (!o || typeof o !== 'object' || !o.name) return; // Spring ugyldige over

             const name = utils.escapeHtml(o.name);
             const odds = (typeof o.odds === 'number' && !isNaN(o.odds)) ? o.odds.toFixed(2) : 'N/A';
             // Format pot using utils.formatCurrency for the select text for consistency
             const potDisplay = typeof utils !== 'undefined' && utils.formatCurrency ? utils.formatCurrency(o.pot ?? 0) : (o.pot ?? 0).toFixed(2) + ' DKK';

             const opt = document.createElement("option");
             // BRUG OUTCOME ID som value, hvis det findes, ellers fald tilbage på navn eller index. SERVEREN SKAL VIDE DETTE.
             opt.value = o.id ?? o.name ?? idx; // Prioriter ID, så navn, så index som fallback
             opt.textContent = `${name} (Odds: ${odds}, Pot: ${potDisplay})`; // Use formatted pot
            outcomeSelect.appendChild(opt);
        });

         // Prøv at gendanne valgt værdi
         if (currentValue) {
            // Ensure the value still exists before setting it
            const exists = Array.from(outcomeSelect.options).some(opt => opt.value === currentValue);
            if (exists) {
                outcomeSelect.value = currentValue;
            }
         }
         // If the old value no longer exists, it will default to the first (placeholder) option.
    }

    function renderPlayers(playersMap) {
        if (!playersTbody) {
            console.warn("Players table body ('players_tbody') not found.");
            return;
        }
        let html = "";
        let foundCurrentUser = false;
        let currentUserNewBalance = null;
        const playerUsernames = playersMap ? Object.keys(playersMap) : [];

        if (!playersMap || typeof playersMap !== 'object' || playerUsernames.length === 0) {
             playersTbody.innerHTML = ''; // Ryd
             if (noPlayersMsg) noPlayersMsg.style.display = 'table-row'; // Vis besked
        } else {
             if (noPlayersMsg) noPlayersMsg.style.display = 'none'; // Skjul besked
             playerUsernames.forEach(username => {
                 const playerData = playersMap[username];
                 if (!playerData || typeof playerData !== 'object' || typeof playerData.balance !== 'number') {
                    console.warn("RenderPlayers: Skipping invalid player data:", username, playerData);
                     return; // Skip invalid player entry
                 }

                 // Use utils.formatCurrency for balance display
                 const balanceDisplay = typeof utils !== 'undefined' && utils.formatCurrency ? utils.formatCurrency(playerData.balance) : playerData.balance.toFixed(2) + ' DKK';
                 const avatarUrl = utils.escapeHtml(playerData.avatar_url || '');
                const profileUrl = `/profile/${encodeURIComponent(username)}`;
                const usernameDisplay = utils.escapeHtml(username);
                // Use utils.formatCurrency for bet_sum display
                const betSumDisplay = (playerData.bet_sum !== undefined && typeof utils !== 'undefined' && utils.formatCurrency)
                                     ? utils.formatCurrency(playerData.bet_sum)
                                     : (playerData.bet_sum !== undefined ? parseFloat(playerData.bet_sum).toFixed(2) + " DKK" : "N/A");

                html += `
                   <tr class="text-center align-middle">
                     <td>
                        <a href="${profileUrl}" class="d-inline-flex align-items-center text-decoration-none link-light">
                         ${avatarUrl ? `<img src="${avatarUrl}" alt="${usernameDisplay}'s avatar" class="me-2 rounded-circle" style="width: 28px; height: 28px; object-fit: cover;" onerror="this.src='/static/avatars/default_avatar.png'; this.onerror=null;">` // Fallback inline
                                       : '<i class="bi bi-person-circle me-2" style="font-size: 28px;"></i>' /* Default icon */ }
                         ${utils.capitalizeFirstLetter(usernameDisplay)} {# Capitalize #}
                       </a>
                     </td>
                     <td>${balanceDisplay}</td> {# Use formatted balance #}
                     <td>${betSumDisplay}</td> {# Use formatted bet sum #}
                   </tr>
                `;

                 // Tjek om det er den nuværende bruger for at opdatere sidebar
                 if (username === currentUser) {
                     foundCurrentUser = true;
                     currentUserNewBalance = playerData.balance;
                 }
            });
            playersTbody.innerHTML = html;

            // Opdater global sidebar HVIS den nuværende brugers balance ændrede sig
            if (foundCurrentUser && currentUserNewBalance !== null && typeof window.updateGlobalSidebar === 'function') {
                // Optional: Check if balance actually changed compared to a stored global value
                // if (typeof window.userBalance === 'undefined' || currentUserNewBalance !== window.userBalance) {
                    console.log(`RenderPlayers: Updating global sidebar for ${currentUser}. New balance: ${currentUserNewBalance}`);
                    window.updateGlobalSidebar(currentUserNewBalance); // Kald global funktion fra app.js
                    // window.userBalance = currentUserNewBalance; // Update the global variable if used for comparison
                // }
             }
         }
    }

    function renderBetLog(bets) {
        if (!betsTbody) {
            console.warn("Bets table body ('bets_tbody') not found.");
            return;
        }
        let html = "";
        const validBets = Array.isArray(bets) ? bets.filter(b => b && typeof b === 'object') : [];

        if (validBets.length === 0) {
             betsTbody.innerHTML = ''; // Ryd
             if (noBetsMsg) noBetsMsg.style.display = 'table-row'; // Vis besked
        } else {
            if (noBetsMsg) noBetsMsg.style.display = 'none'; // Skjul besked
             // Vis seneste bets øverst ved at vende arrayet før iteration
             validBets.slice().reverse().forEach(bet => {
                const user = utils.escapeHtml(bet.user || 'Ukendt Bruger');
                const outcomeName = utils.escapeHtml(bet.outcome_name || 'Ukendt Udfald');
                // Use utils.formatCurrency for stake display
                 const stakeDisplay = (typeof bet.stake === 'number' && !isNaN(bet.stake) && typeof utils !== 'undefined' && utils.formatCurrency)
                                      ? utils.formatCurrency(bet.stake)
                                      : (typeof bet.stake === 'number' ? bet.stake.toFixed(2) + ' DKK' : '?');
                // Brug formatDateTime fra utils.js hvis muligt
                 const timestamp = (typeof utils !== 'undefined' && utils.formatDateTime) ? utils.formatDateTime(bet.timestamp) : (bet.timestamp || 'Ukendt tid');

                // Fremhæv brugerens egne bets
                const rowClass = user === currentUser ? 'table-info' : ''; // Bootstrap class for highlight

                html += `
                   <tr class="${rowClass} text-center">
                       <td>${user}</td>
                      <td>${outcomeName}</td>
                       <td>${stakeDisplay}</td> {# Use formatted stake #}
                      <td>${timestamp}</td>
                   </tr>
                 `;
             });
             betsTbody.innerHTML = html;
         }
    }


    // -------------------------------------------------------------------------
    // 8. FORM SUBMISSION (PLACE BET)
    // -------------------------------------------------------------------------

    function placeBetHandler(event) {
        event.preventDefault(); // Stop normal submit

         if (!socket || !socket.connected) {
             showErrorFeedback("Ingen forbindelse til server. Kan ikke placere bet.", 'danger');
             return;
         }
        if (!currentUser) {
             showErrorFeedback("Du skal være logget ind for at placere et bet.", 'warning');
             return;
         }
        if (!outcomeSelect || !stakeInput || !placeBetBtn) {
            console.error("Cannot place bet: Missing form elements (select, input, or button).");
             showErrorFeedback("Fejl: Bet-formular elementer mangler.", 'danger');
             return;
        }

        const outcomeValue = outcomeSelect.value; // Value (fx outcome_id, navn eller index)
         const stake = parseFloat(stakeInput.value.replace(',', '.')); // Håndter komma som decimaltegn

        // === Client-side Validering ===
         if (!outcomeValue || outcomeValue === "") { // Antager at default value er ""
            showErrorFeedback("Vælg venligst et udfald at satse på.", 'warning');
             outcomeSelect.focus();
            return;
        }
        if (isNaN(stake) || stake <= 0) {
            showErrorFeedback("Indtast venligst en gyldig positiv indsats.", 'warning');
            stakeInput.focus();
            stakeInput.select();
            return;
        }
        // Optional: Client-side balance check (relies on accurate global balance)
        // if (typeof window.userBalance !== 'undefined' && stake > window.userBalance) {
        //    showErrorFeedback(`Du har ikke nok penge (${utils.formatCurrency ? utils.formatCurrency(window.userBalance) : window.userBalance.toFixed(2)+' DKK'}) til at placere dette bet.`, 'warning');
        //    return;
        // }

        console.log(`Placing bet: User=${currentUser}, Session=${sessionId}, OutcomeValue=${outcomeValue}, Stake=${stake}`);
        if (utils.toggleButtonLoading) utils.toggleButtonLoading(placeBetBtn, true); // Vis loading
        showErrorFeedback('', 'clear'); // Ryd tidligere fejl

        let ackTimeout; // Declare timeout variable

        // === Send bet via Socket.IO med Acknowledgement ===
        socket.emit("place_bet", {
            session_id: sessionId,
            username: currentUser, // Send brugernavn (server validerer)
            outcome: outcomeValue, // Send den valgte VALUE fra select (server skal tolke dette)
            stake: stake
        }, (ack) => { // Serveren SKAL kalde denne callback
            clearTimeout(ackTimeout); // Clear the timeout because we got a response
            if (utils.toggleButtonLoading) utils.toggleButtonLoading(placeBetBtn, false); // Skjul loading

            if (ack && ack.success) {
                 console.log("Bet placed successfully (acknowledged by server). Server message:", ack.message);
                 if (ack.message) utils.showToast(ack.message, 'success');
                 // stakeInput.value = ''; // Nulstil felt KUN hvis AKK er succes.
                 outcomeSelect.value = ''; // Nulstil valg
                 stakeInput.value = '';    // Nulstil indsats

                 // Trigger en UI update? Nej, vent på den 'session_update', som serveren bør sende.
             } else {
                 // Fejl anerkendt af server ELLER manglende succes flag
                 const errorMessage = ack?.error || "Der opstod en ukendt fejl ved placering af bet.";
                 console.error("Bet placement failed (server acknowledgement):", errorMessage);
                 showErrorFeedback(errorMessage, 'danger'); // Vis fejl i feedback div
             }
         });

         // Simpel timeout for at håndtere hvis server ALDRIG svarer (ingen ack)
         ackTimeout = setTimeout(() => {
             // Check if the button is still in loading state (meaning ACK was not received)
             if (placeBetBtn && placeBetBtn.disabled) {
                 console.error("Bet placement acknowledgement timed out.");
                 if (utils.toggleButtonLoading) utils.toggleButtonLoading(placeBetBtn, false); // Ensure button is re-enabled
                showErrorFeedback("Timeout: Serveren svarede ikke på bet-anmodningen.", 'danger');
             }
         }, 10000); // 10 sekunders timeout
     }

    // Tilføj listener til formen
    if (placeBetForm) {
         placeBetForm.addEventListener('submit', placeBetHandler);
     } else {
         console.warn("Place bet form ('#placeBetForm') not found. Betting disabled.");
     } // End of placeBetForm listener attachment

    // --- Helper til at vise fejl/feedback (specifikt for denne side) ---
    // Modified to accept an optional target feedback div
    function showErrorFeedback(message, type = 'danger', targetDiv = feedbackDiv) {
        if (type === 'clear' && targetDiv) { // Check targetDiv for clear as well
            targetDiv.innerHTML = '';
            targetDiv.className = 'feedback-area mt-2'; // Nulstil klasser
            targetDiv.style.display = 'none'; // Ensure it's hidden when cleared
            return;
        }
        if (targetDiv) {
            // Basic sanitization of type to prevent class injection if needed
            const safeType = ['danger', 'warning', 'info', 'success'].includes(type) ? type : 'secondary';
            targetDiv.className = `alert alert-${safeType} mt-2`; // Use Bootstrap alert classes
            targetDiv.innerHTML = utils.escapeHtml(message); // Ensure to escape!
            targetDiv.style.display = message ? 'block' : 'none';
        } else {
            // Fallback to toast if the specific targetDiv is missing
            if (message && typeof utils !== 'undefined' && utils.showToast) {
                utils.showToast(message, type);
            } else if (message) { // Absolute fallback
                console.error("Feedback (targetDiv missing for message):", message);
            }
        }
    } // End of showErrorFeedback function

    // -------------------------------------------------------------------------
    // 9. FORM SUBMISSION (COUPON BET)
    // -------------------------------------------------------------------------
    function placeCouponBetHandler(event) {
        event.preventDefault();
        if (!socket || !socket.connected) {
            showErrorFeedback("Ingen forbindelse til server. Kan ikke placere kupon bet.", 'danger', couponFeedbackDiv);
            return;
        }
        if (!currentUser) {
            showErrorFeedback("Du skal være logget ind for at placere et kupon bet.", 'warning', couponFeedbackDiv);
            return;
        }
        if (!couponStakeInput || !placeCouponBetBtn) {
            console.error("Cannot place coupon bet: Missing form elements.");
            showErrorFeedback("Fejl: Kupon bet-formular elementer mangler.", 'danger', couponFeedbackDiv);
            return;
        }

        const stake = parseFloat(couponStakeInput.value.replace(',', '.'));

        if (isNaN(stake) || stake <= 0) {
            showErrorFeedback("Indtast venligst en gyldig positiv indsats for kuponen.", 'warning', couponFeedbackDiv);
            couponStakeInput.focus();
            couponStakeInput.select();
            return;
        }

        console.log(`Placing COUPON bet: User=${currentUser}, Session=${sessionId}, Stake=${stake}`);
        if (utils.toggleButtonLoading) utils.toggleButtonLoading(placeCouponBetBtn, true, "Placerer...");
        showErrorFeedback('', 'clear', couponFeedbackDiv); // Ryd tidligere fejl for coupon form

        let ackTimeout;

        socket.emit("place_bet", { // Using the same event, backend will differentiate
            session_id: sessionId,
            username: currentUser,
            stake: stake,
            is_coupon_bet: true // Add this flag
        }, (ack) => {
            clearTimeout(ackTimeout);
            if (utils.toggleButtonLoading) utils.toggleButtonLoading(placeCouponBetBtn, false);

            if (ack && ack.success) {
                console.log("Coupon bet placed successfully (acknowledged). Server message:", ack.message);
                if (ack.message) utils.showToast(ack.message, 'success');
                couponStakeInput.value = ''; // Clear stake input
                // UI update via 'session_update'
            } else {
                const errorMessage = ack?.error || "Ukendt fejl ved placering af kupon bet.";
                console.error("Coupon bet placement failed (server acknowledgement):", errorMessage);
                showErrorFeedback(errorMessage, 'danger', couponFeedbackDiv);
            }
        });

        ackTimeout = setTimeout(() => {
            if (placeCouponBetBtn && placeCouponBetBtn.disabled) {
                console.error("Coupon bet placement acknowledgement timed out.");
                if (utils.toggleButtonLoading) utils.toggleButtonLoading(placeCouponBetBtn, false);
                showErrorFeedback("Timeout: Serveren svarede ikke på kupon bet-anmodningen.", 'danger', couponFeedbackDiv);
            }
        }, 10000);
    } // End of placeCouponBetHandler

    // Tilføj listener til KUPOPN formen HVIS den findes
    if (placeCouponBetForm) {
        placeCouponBetForm.addEventListener('submit', placeCouponBetHandler);
    } else {
        // This is expected if it's not a coupon session, so no warning needed unless debugging
        // console.log("Place coupon bet form ('#placeCouponBetForm') not found. This is normal for non-coupon sessions.");
    } // End of placeCouponBetForm listener attachment

// --- Listener for final coupon settlement event from server ---
    if (socket) {
        socket.on("coupon_settled", (data) => {
            console.log("Socket event received (coupon_settled):", data);
            if (data.session_id && data.session_id !== sessionId) {
                console.warn(`Received coupon_settled for wrong session ID (${data.session_id}). Ignoring.`);
                return;
            }

            let message = `Kuponen er afgjort! Resultat: ${data.overall_result ? data.overall_result.toUpperCase() : 'Ukendt'}.`;
            let messageType = 'info';

            if (data.overall_result === 'won' && data.payouts && data.payouts.length > 0) {
                const userPayout = data.payouts.find(p => p.user === currentUser); // Check if current user won
                if (userPayout) {
                    message = `TILLYKKE! Din kupon vandt! Gevinst: ${utils.formatCurrency ? utils.formatCurrency(userPayout.payout) : userPayout.payout.toFixed(2) + ' DKK'}.`;
                    messageType = 'success';
                } else {
                     message = `Kuponen blev vundet! Tjek detaljer for gevinster.`;
                     messageType = 'success';
                }
            } else if (data.overall_result === 'lost') {
                message = `Desværre, din kupon tabte. Bedre held næste gang!`;
                messageType = 'warning';
            }

            // Display a prominent message, perhaps using the main feedbackDiv
            showErrorFeedback(message, messageType, feedbackDiv); // Use the main feedback div for this important message

            // The session_update event (which should also be triggered by backend) will refresh leg statuses.
            // We might want to disable betting forms or show a "Settled" banner.
            if (placeBetForm) placeBetForm.style.display = 'none';
            if (placeCouponBetForm) placeCouponBetForm.style.display = 'none';
            // Add a "Settled" banner or update session status display
            const sessionStatusSpan = document.getElementById('sessionStatusSpan'); // Assuming such an element exists or will be added
            if(sessionStatusSpan) sessionStatusSpan.innerHTML = `<span class="badge bg-info">Afgjort: ${data.overall_result ? data.overall_result.toUpperCase() : ''}</span>`;

        });
    }
    // --- Initialisering ved Page Load ---
    console.log("Session Details: Performing initial setup/renders.");
    // Render initielle data hvis server ikke allerede gjorde det via Jinja?
    // Typisk unødvendigt hvis siden serveres med data.
    // Eksempel:
    // if (!outcomesTbody?.children.length) { // Hvis tabel er tom ved load
    //     renderOutcomes(window.initialSessionData?.outcomes || []);
    // }
    // if (!playersTbody?.children.length) {
    //     renderPlayers(window.initialSessionData?.players || {});
    // }
    // if (!betsTbody?.children.length) {
    //     renderBetLog(window.initialSessionData?.bets || []);
    // }

    // Kald updateOutcomeSelect én gang ved start for at populere select box
    // hvis der er startdata (antag data er sendt med fra server/Jinja via en global var?)
    if (typeof initialSessionData !== 'undefined' && initialSessionData.outcomes) {
        console.log("Populating outcome select from initial data.");
        updateOutcomeSelect(initialSessionData.outcomes);
    }

    // --- Listener for Copy Invite Link Button ---
    if (copyInviteBtn) {
        copyInviteBtn.addEventListener('click', async () => {
            const inviteCode = copyInviteBtn.dataset.inviteCode;
            if (!inviteCode) {
                utils.showToast("Kunne ikke finde invite kode.", "danger");
                return;
            }
            // Construct the full URL
            const inviteUrl = `${window.location.origin}/sessions/join/invite/${inviteCode}`;

            try {
                await navigator.clipboard.writeText(inviteUrl);
                utils.showToast("Invite link kopieret til udklipsholder!", "success");

                // Optional: Change button text/icon temporarily
                const originalIcon = copyInviteBtn.innerHTML;
                copyInviteBtn.innerHTML = '<i class="bi bi-check-lg"></i>';
                setTimeout(() => {
                    copyInviteBtn.innerHTML = originalIcon;
                }, 2000);

            } catch (err) {
                console.error('Failed to copy invite link: ', err);
                utils.showToast("Kunne ikke kopiere link. Prøv manuelt.", "warning");
            }
        });
    } else {
        // Only log if we expect it to be there (e.g., based on session_data)
        // console.log("Copy invite button not found (might be expected).");
    }
// --- Chat Functionality ---
    function sendChatMessage() {
        if (!chatMessageInput || !socket || !socket.connected) {
            if (utils && utils.showToast) utils.showToast("Kan ikke sende besked. Forbindelsesproblem?", "warning");
            return;
        }
        const messageText = chatMessageInput.value.trim();
        if (messageText === "") return;

        socket.emit("send_session_message", {
            session_id: sessionId,
            message_text: messageText
        });
        // console.log(`Sent chat message: ${messageText} to session ${sessionId}`);
        chatMessageInput.value = ""; // Clear input
        chatMessageInput.focus();
    }

    if (sendChatMessageBtn && chatMessageInput) { // Ensure both exist before adding listeners
        sendChatMessageBtn.addEventListener("click", sendChatMessage);
        chatMessageInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter" && !event.shiftKey) { // Send on Enter, allow Shift+Enter for newline
                event.preventDefault(); // Prevent default form submission if it's in a form
                sendChatMessage();
            }
        });
    } else {
         console.warn("Chat input or send button not found. Chat sending disabled.");
    }

    function displayChatMessage(msgData) {
        if (!chatMessagesArea || !msgData || !utils || typeof utils.escapeHtml !== 'function') {
             console.warn("Cannot display chat message: Missing area, data, or escapeHtml util.");
             return;
        }

        // Remove initial "Velkommen til chatten!" message if it's still there
        const welcomeMsg = chatMessagesArea.querySelector('p.text-muted.small.text-center');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message', 'mb-2', 'p-2', 'rounded');

        const isOwnMessage = msgData.user_id === String(currentUser); // Compare as strings if needed

        if (isOwnMessage) {
            msgDiv.classList.add('bg-primary', 'text-white', 'ms-auto');
            msgDiv.style.maxWidth = '75%';
            msgDiv.style.textAlign = 'right';
        } else {
            msgDiv.classList.add('bg-light', 'text-dark', 'me-auto');
            msgDiv.style.maxWidth = '75%';
        }

        const avatarSize = '24px';
        const avatarHtml = msgData.avatar_url
            ? `<img src="${utils.escapeHtml(msgData.avatar_url)}" alt="${utils.escapeHtml(msgData.username)}'s avatar" class="rounded-circle me-2" style="width:${avatarSize}; height:${avatarSize}; object-fit:cover; vertical-align: middle;">`
            : `<i class="bi bi-person-circle me-2" style="font-size: ${avatarSize}; vertical-align: middle;"></i>`;

        const timestamp = msgData.timestamp ? new Date(msgData.timestamp).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : '';

        let messageHeaderHtml = '';
        let badgeHtml = '';

        if (msgData.badges && Array.isArray(msgData.badges)) {
            msgData.badges.forEach(iconClass => {
                if (iconClass && typeof iconClass === 'string') { // Basic validation
                    badgeHtml += `<i class="${utils.escapeHtml(iconClass)} ms-1" title="Badge"></i>`; // Add title for accessibility
                }
            });
        }

        if (!isOwnMessage) { // Only show header for other users' messages
             messageHeaderHtml = `
                <small class="d-block text-muted" style="font-size: 0.75em;">
                    ${avatarHtml}
                    <strong>${utils.escapeHtml(utils.capitalizeFirstLetter(msgData.username))}</strong> {# Capitalize #}
                    ${badgeHtml} {# Insert badge icons here #}
                    <span class="float-end">${timestamp}</span>
                </small>`;
        } else { // For own messages, just a timestamp aligned right (and badges if desired)
            messageHeaderHtml = `<small class="d-block text-muted" style="font-size: 0.75em; text-align: right;">${badgeHtml} ${timestamp}</small>`;
        }

        // Ensure message text is treated as text, not HTML
        const messageTextDiv = document.createElement('div');
        messageTextDiv.classList.add('message-text');
        messageTextDiv.style.wordWrap = 'break-word';
        if (isOwnMessage) {
             messageTextDiv.style.textAlign = 'right';
        }
        messageTextDiv.textContent = msgData.text; // Use textContent to prevent XSS

        // Assemble the message structure safely
        msgDiv.innerHTML = messageHeaderHtml; // Header HTML is considered safe here
        msgDiv.appendChild(messageTextDiv); // Append the text content safely

        chatMessagesArea.appendChild(msgDiv);
        // Scroll only if the user isn't scrolled up looking at history
        const isScrolledToBottom = chatMessagesArea.scrollHeight - chatMessagesArea.clientHeight <= chatMessagesArea.scrollTop + 1; // +1 for tolerance
        if(isScrolledToBottom) {
            chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
        }
    }

    if (socket && chatMessagesArea) { // Ensure socket and chat area exist
        socket.on("new_session_message", (msgData) => {
            // console.log("Received new_session_message:", msgData);
            displayChatMessage(msgData);
        });
         console.log("Chat message listener ('new_session_message') attached.");
    } else {
         console.warn("Socket or chat message area not found. Chat receiving disabled.");
    }

}); // End DOMContentLoaded
// Removed extra commented out lines and ensured DOMContentLoaded is the last closing brace.
