// static/js/aktiedyst.js

document.addEventListener("DOMContentLoaded", () => {
    console.log("Aktiedyst script loaded.");

    // --- DEPENDENCIES CHECK ---
    if (typeof utils === 'undefined' || !utils.escapeHtml || !utils.showToast || !utils.toggleButtonLoading || !utils.postData || !utils.getData || !utils.formatCurrency || !utils.formatDateTime || !utils.initializeTooltips) { // Added more checks
        console.error("Utils.js not loaded or missing required functions. Aktiedyst page might malfunction.");
        // Show error to user
         const body = document.querySelector('body');
         if(body) body.insertAdjacentHTML('afterbegin', '<div class="alert alert-danger m-3">Kritisk fejl: Nødvendige hjælpefunktioner mangler. Aktiedyst siden fungerer muligvis ikke korrekt.</div>');
        return; // Vigtige funktioner mangler
    }
    if (!window.globalSocket) {
        console.error("Global socket instance (window.globalSocket) not found from app.js. Realtime stock updates disabled.");
        // Vis fejl, socket check laves igen nedenfor.
    }
    if (typeof window.updateGlobalSidebar !== 'function') {
        console.error("Global sidebar update function (window.updateGlobalSidebar) not found from app.js.");
    }
    if (!window.currentUser) {
         console.warn("Current user (window.currentUser) not found. Some actions might be disabled.");
    }

    // --- CONSTANTS ---
    const INITIAL_BALANCE = 100000; // Eller hent fra server config/window scope hvis dynamisk
    const STOCK_UPDATE_INTERVAL_MS = 60000; // Opdater kurs hvert minut (juster efter behov)

    // --- ELEMENT REFERENCES (Kombineret fra begge kilder) ---
    // Søg/Info
    const assetSearchForm = document.getElementById('asset-search-form');
    const assetSymbolInput = document.getElementById('asset-symbol-input'); // Search input
    const searchButton = document.getElementById('search-button'); // Knap til søg
    const assetInfoDisplay = document.getElementById('asset-info-display'); // Container for info
    const assetNameSpan = document.getElementById('asset-name');
    const assetSymbolSpan = document.getElementById('asset-symbol');
    const assetPriceSpan = document.getElementById('asset-price'); // Vigtig for prisvisning og beregning
    const assetChangeSpan = document.getElementById('asset-change');
    const assetTimestampSpan = document.getElementById('asset-timestamp');

    // Køb Form (Brug ID fra gl. app.js - TJEK DIN HTML!)
    const buyForm = document.getElementById('buy-stock-form');
    const buyAssetSymbolInput = document.getElementById('buy-asset-symbol'); // Måske auto-udfyldt
    const buyAssetNameDisplay = document.getElementById('buy-asset-name-display'); // Til navn
    const buySharesInput = document.getElementById('buy-shares');
    const buyCostEstimateSpan = document.getElementById('buy-cost-estimate');
    const buySubmitBtn = buyForm ? buyForm.querySelector('button[type="submit"]') : null;

    // Sælg Form (Brug ID fra gl. app.js - TJEK DIN HTML!)
    const sellForm = document.getElementById('sell-stock-form');
    const sellAssetSymbolInput = document.getElementById('sell-asset-symbol'); // Måske auto-udfyldt
    const sellAssetNameDisplay = document.getElementById('sell-asset-name-display'); // Til navn
    const sellSharesInput = document.getElementById('sell-shares');
    const sellAvailableSharesSpan = document.getElementById('sell-available-shares'); // Viser antal tilgængeligt
    const sellSubmitBtn = sellForm ? sellForm.querySelector('button[type="submit"]') : null;

    // Portfolio/Balance Display
    const balanceDisplayEl = document.getElementById("display-balance");
    const portfolioValueDisplayEl = document.getElementById("display-portfolio-value");
    const profitLossDisplayEl = document.getElementById("display-profit-loss");

    // Beholdningstabel & Filter
    const holdingsTableBody = document.getElementById("detailed-holdings-body"); // BRUG DETTE ID
    const filterContainer = document.getElementById('detailed-holdings-filter');
    const filterAssetTypeButtons = filterContainer ? filterContainer.querySelectorAll('.btn-group button[data-filter]') : null;
    const filterPortfolioSelect = document.getElementById('portfolio-filter');
    const noResultsRow = document.getElementById('holdings-no-results-row'); // Række for "ingen resultater"

    // Portfolio Liste & Slet Modal
    const portfolioListContainer = document.getElementById('portfolio-list-container');
    const deletePortfolioModalEl = document.getElementById('deletePortfolioModal');
    const portfolioNameToDeleteSpan = document.getElementById('portfolioNameToDelete');
    const portfolioIdToDeleteInput = document.getElementById('portfolioIdToDelete');
    const confirmDeletePortfolioBtn = document.getElementById('confirmDeletePortfolioBtn');

    // --- STATE VARIABLES ---
    let stockUpdateIntervalId = null;
    let currentStockPrices = {}; // Gemmer de seneste kendte priser {SYMBOL: price}


    // --- HELPER FUNCTIONS (inkl. fra nye aktiedyst.js) ---
    // **** KORRIGERET HER ****
    const formatCurrency = (value) => {
        // Brug utils.formatCurrency hvis den findes, ellers brug en simpel fallback
        return typeof utils !== 'undefined' && utils.formatCurrency
               ? utils.formatCurrency(value)
               : (typeof value === 'number' && !isNaN(value) ? value.toFixed(2) + ' DKK' : 'N/A');
    };

    // --- CORE FUNCTIONS ---

    // Opdaterer visning af et enkelt søgeresultat/aktiv
     function updateAssetInfoDisplay(data) {
         if (!assetInfoDisplay) return;
         if (!data || !data.symbol) {
             assetInfoDisplay.style.display = 'none';
             console.warn("updateAssetInfoDisplay: Missing data or symbol.");
             return;
         }

        // Udfyld felter
         assetNameSpan.textContent = utils.escapeHtml(data.name || `${data.symbol.toUpperCase()} Company Name`);
         assetSymbolSpan.textContent = utils.escapeHtml(data.symbol.toUpperCase());
        const currentPrice = parseFloat(data.price);
         assetPriceSpan.textContent = isNaN(currentPrice) ? 'N/A' : currentPrice.toFixed(2); // Keep raw number here for calculation

         // Beregn/vis ændring
        const change = parseFloat(data.change);
         const changePercent = parseFloat(data.change_percent); // Antag server sender dette
         if (!isNaN(change) && !isNaN(changePercent)) {
             assetChangeSpan.textContent = `${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
             assetChangeSpan.className = change >= 0 ? 'text-success' : 'text-danger';
         } else {
            assetChangeSpan.textContent = '-';
            assetChangeSpan.className = 'text-muted';
         }

         // Tidsstempel
         assetTimestampSpan.textContent = data.timestamp ? utils.formatDateTime(data.timestamp) : 'N/A';

        assetInfoDisplay.style.display = 'block';

        // Opdater Køb/Sælg forms hvis de findes
        if (buyAssetSymbolInput) buyAssetSymbolInput.value = data.symbol.toUpperCase();
        if (buyAssetNameDisplay) buyAssetNameDisplay.textContent = `${utils.escapeHtml(data.symbol.toUpperCase())} (${currentPrice.toFixed(2)})`;
         if (sellAssetSymbolInput) sellAssetSymbolInput.value = data.symbol.toUpperCase();
         if (sellAssetNameDisplay) sellAssetNameDisplay.textContent = `${utils.escapeHtml(data.symbol.toUpperCase())} (${currentPrice.toFixed(2)})`;

        // Hent og vis antal ejede aktier til Sælg form
         updateAvailableSharesForSymbol(data.symbol.toUpperCase());

         // Opdater købs-estimat
         updateBuyCostEstimate();
     }

    // Opdater kun "Tilgængelige Aktier" for et symbol i Sælg formen
     async function updateAvailableSharesForSymbol(symbol) {
        if (!sellAvailableSharesSpan || !symbol) return;
        // Denne funktion er svær uden en lokal state af portfolio.
        // Kræver enten at søge API'et *igen* eller have `currentPortfolioData` globalt.
        // Vi lader den være placeholder - DEN SKAL integreres med portfolio data
         let ownedShares = '?'; // Default værdi
        // Example using API call (potentially slow if called often)
         try {
            // Maybe use a more lightweight endpoint if available
             const portfolioData = await utils.getData('/stocks/api/portfolio');
             const holdings = portfolioData?.portfolio || {};
             ownedShares = holdings[symbol]?.shares ?? 0; // Default to 0 if not found
         } catch (e) {
             console.error(`Error fetching shares count for ${symbol}:`, e);
             ownedShares = 'Fejl';
             // Avoid showing 'Fejl' to user, perhaps just show '?' or '0'
             sellAvailableSharesSpan.textContent = '?';
             return; // Exit early on error
         }
         sellAvailableSharesSpan.textContent = ownedShares;
     }


    // Opdater købsomkostnings-estimat
     function updateBuyCostEstimate() {
        if (!buySharesInput || !buyCostEstimateSpan || !assetPriceSpan) return;
         const shares = parseFloat(buySharesInput.value.replace(',', '.')) || 0;
        const priceText = assetPriceSpan.textContent.split(' ')[0].replace(',', '.'); // Hent KUN tallet
        const price = parseFloat(priceText) || 0;
        let estimate = 0;

        if (shares > 0 && price > 0) {
            estimate = shares * price;
            // TODO: Hent/beregn kurtage
            // const commission = calculateCommission(estimate); // Eksempel
            // estimate += commission;
        }
         buyCostEstimateSpan.textContent = formatCurrency(estimate); // Use corrected helper
     }

    // Funktion til at hente portfolio data OG opdatere HELE UI
     async function fetchAndUpdatePortfolioUI() {
         console.log("Aktiedyst: Fetching portfolio data and updating UI...");
         // Vis evt. loading state for hele sektionen?
         try {
             const data = await utils.getData('/stocks/api/portfolio'); // Kald API endpoint

             if (!data) throw new Error("No data received from portfolio API.");

             // 1. Opdater Balance Display
            if (balanceDisplayEl) {
                 balanceDisplayEl.textContent = formatCurrency(data.balance); // Use corrected helper
            }
             // Gem/Opdater global balance via app.js funktion HVIS den har ændret sig
             if (typeof window.updateGlobalSidebar === 'function' && data.balance !== window.userBalance) {
                console.log(`Aktiedyst: Portfolio balance updated. Calling global sidebar update. New: ${data.balance}`);
                window.updateGlobalSidebar(data.balance);
                window.userBalance = data.balance; // Update global state if it exists
             } else {
                // Balance er den samme, ingen grund til at opdatere sidebar
             }


            // 2. Beregn Porteføljeværdi og Profit/Loss
            let calculatedPortfolioValue = 0;
             // BRUG de `currentStockPrices` vi har fået fra Socket.IO
             if (data.portfolio && typeof data.portfolio === 'object') {
                 for (const symbol in data.portfolio) {
                     const holding = data.portfolio[symbol];
                    const shares = holding.shares || 0;
                    const currentPrice = currentStockPrices[symbol]; // Hent fra vores state

                    if (shares > 0 && typeof currentPrice === 'number' && !isNaN(currentPrice)) {
                         calculatedPortfolioValue += shares * currentPrice;
                    } else if (shares > 0) {
                         // Prisen mangler for en aktie vi ejer!
                        console.warn(`Cannot calculate value for ${symbol} - Price not found in currentStockPrices state.`);
                         // Use average purchase price as fallback? Or show N/A?
                         // For now, add cost basis to total value if price is missing
                         calculatedPortfolioValue += shares * (holding.avg_purchase_price || 0);
                     }
                 }
            }

             if (portfolioValueDisplayEl) {
                 portfolioValueDisplayEl.textContent = formatCurrency(calculatedPortfolioValue); // Use corrected helper
            }

            // 3. Beregn Profit/Loss (kræver START balance eller info om totalt investeret)
            const currentTotalValue = calculatedPortfolioValue + (data.balance || 0);
            const profitLoss = currentTotalValue - INITIAL_BALANCE; // Brug konstanten

             if (profitLossDisplayEl) {
                 profitLossDisplayEl.textContent = formatCurrency(profitLoss); // Use corrected helper
                 // Sæt farve
                 profitLossDisplayEl.classList.remove("text-success", "text-danger", "text-muted");
                if (profitLoss > 0.01) profitLossDisplayEl.classList.add("text-success");
                else if (profitLoss < -0.01) profitLossDisplayEl.classList.add("text-danger");
                 else profitLossDisplayEl.classList.add("text-muted");
             }

            // 4. Opdater den detaljerede beholdningstabel
            renderDetailedHoldings(data.portfolio || {}, currentStockPrices);

            // TODO: Opdater evt. portfolio <select> filter dropdown

         } catch (error) {
             console.error("Fejl ved hentning/opdatering af portefølje:", error);
            utils.showToast(`Fejl: Kunne ikke hente portefølje data. ${error.message}`, "danger");
        } finally {
            // Skjul evt. loading state
         }
     }


    // Funktion til at rendre den DETALJEREDE beholdningstabel
    function renderDetailedHoldings(portfolioObj, prices) {
         if (!holdingsTableBody) {
            console.warn("Detailed holdings table body (#detailed-holdings-body) not found.");
             return;
        }
        holdingsTableBody.innerHTML = ""; // Ryd tabel FØR loop

         const symbols = portfolioObj ? Object.keys(portfolioObj) : [];

        if (symbols.length === 0) {
            holdingsTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted fst-italic py-3">Du ejer ingen aktiver endnu.</td></tr>'; // Updated colspan to 9
             filterDetailedHoldings(); // Kør filter for at vise 'no results' hvis relevant
             return;
         }

         symbols.forEach(symbol => {
            const info = portfolioObj[symbol];
            if (!info || typeof info.shares !== 'number' || typeof info.avg_purchase_price !== 'number') {
                 console.warn(`Skipping invalid holding data for symbol ${symbol}:`, info);
                 return;
             }

            const shares = info.shares;
            if (shares <= 0) return; // Vis ikke hvis antal er nul eller negativt

            const currentPrice = prices[symbol]; // Hent fra vores socket-opdaterede state
            const marketValue = (typeof currentPrice === 'number' && !isNaN(currentPrice)) ? shares * currentPrice : null;
             const averagePrice = info.avg_purchase_price;
            const totalCost = shares * averagePrice;

             let gainLoss = null;
            let gainLossPercent = null;
             if (marketValue !== null) { // Calculate even if cost is 0 (e.g., free shares)
                 gainLoss = marketValue - totalCost;
                 gainLossPercent = totalCost !== 0 ? (gainLoss / totalCost) * 100 : (marketValue > 0 ? Infinity : 0); // Handle zero cost
             }

             const gainLossClass = gainLoss === null ? 'text-muted' : (gainLoss >= 0 ? 'text-success' : 'text-danger');
             const priceClass = typeof currentPrice === 'number' ? '' : 'text-muted fst-italic'; // Stil hvis pris mangler

            const type = info.type || "Aktie";
            const portfolioName = info.portfolio || "Standard";

            const tr = document.createElement("tr");
             // Sæt data-attributter til filtrering
            tr.setAttribute("data-symbol", symbol);
            tr.setAttribute("data-type", type);
            tr.setAttribute("data-portfolio", portfolioName);

             tr.innerHTML = `
                 <td>${utils.escapeHtml(type)}</td>
                 <td><strong>${utils.escapeHtml(symbol)}</strong></td>
                 <td>${utils.escapeHtml(info.name || 'Ukendt Firma')}</td>
                 <td class="text-end shares-held-cell">${shares}</td> {# Tilføjet klasse #}
                 <td class="text-end">${averagePrice.toFixed(2)}</td>
                 <td class="text-end fw-bold stock-price-cell ${priceClass}" id="stockPrice-${symbol}"> {# Tilføjet klasse og unikt ID #}
                    ${typeof currentPrice === 'number' ? currentPrice.toFixed(2) : 'Opdaterer...'}
                </td>
                 <td class="text-end">${marketValue !== null ? formatCurrency(marketValue) : '-'}</td> {# Use corrected helper #}
                <td class="text-end ${gainLossClass}">
                    ${gainLoss !== null ? formatCurrency(gainLoss) : '-'} {# Use corrected helper #}
                    ${gainLossPercent !== null && isFinite(gainLossPercent) ? ` (${gainLossPercent.toFixed(1)}%)` : (gainLossPercent === Infinity ? ' (+∞%)' : '')}
                 </td>
                 <td class="text-center"> {# Handlinger #}
                     <button class="btn btn-sm btn-success quick-buy-btn" data-symbol="${symbol}" data-bs-toggle="tooltip" title="Køb ${symbol}"><i class="bi bi-plus-lg"></i></button>
                     <button class="btn btn-sm btn-danger quick-sell-btn" data-symbol="${symbol}" data-bs-toggle="tooltip" title="Sælg ${symbol}"><i class="bi bi-dash-lg"></i></button>
                     <button class="btn btn-sm btn-info view-chart-btn" data-symbol="${symbol}" data-bs-toggle="tooltip" title="Se Graf for ${symbol}"><i class="bi bi-graph-up"></i></button>
                 </td>
            `;
            holdingsTableBody.appendChild(tr);
         });

        // Kør filterfunktionen EFTER tabellen er bygget færdig
        filterDetailedHoldings();
        // Initialiser tooltips for de nye knapper
        utils.initializeTooltips(holdingsTableBody); // Use scope for better performance
    }


    // Funktion til at HÅNDTERE modtagne aktiekursopdateringer fra Socket.IO
    function handleStockUpdate(stocks) {
        // console.log("Stock update received:", stocks); // Can be noisy
        if (!Array.isArray(stocks)) {
            console.warn("Received non-array stock update:", stocks);
             return;
        }

        let pricesChanged = false;
        let ownedSymbolsUpdated = new Set(); // Track which owned symbols changed price

        stocks.forEach(stock => {
            if (!stock || !stock.symbol || stock.price === undefined || stock.price === null) return; // Kræver symbol og pris

            const symbol = stock.symbol.toUpperCase();
            const newPrice = parseFloat(stock.price);
             if (isNaN(newPrice)) return;

            const oldPrice = currentStockPrices[symbol]; // Get old price before updating
             // Opdater den globale pris-state
             if (oldPrice !== newPrice) {
                 currentStockPrices[symbol] = newPrice;
                 pricesChanged = true;

                // Opdater direkte i beholdningstabellen hvis rækken findes
                const tableRow = holdingsTableBody?.querySelector(`tr[data-symbol="${symbol}"]`);
                 if (tableRow) {
                     ownedSymbolsUpdated.add(symbol); // Mark this symbol as changed
                    const priceCell = tableRow.querySelector(`#stockPrice-${symbol}`);
                    const marketValueCell = tableRow.querySelector('td:nth-child(7)'); // 7th cell for Market Value
                    const gainLossCell = tableRow.querySelector('td:nth-child(8)');    // 8th cell for Gain/Loss
                    const sharesCell = tableRow.querySelector('.shares-held-cell');
                    const avgPriceCell = tableRow.querySelector('td:nth-child(5)'); // 5th cell for Avg Price

                    if (priceCell) {
                        priceCell.textContent = newPrice.toFixed(2);
                        priceCell.classList.remove('text-muted', 'fst-italic');
                        // Optional: Flash animation
                         const flashClass = newPrice > oldPrice ? 'price-up-flash' : 'price-down-flash';
                         priceCell.classList.add(flashClass);
                         setTimeout(() => priceCell.classList.remove(flashClass), 750);
                     }

                    // Recalculate and update Market Value and Gain/Loss directly in the row
                    const shares = parseFloat(sharesCell?.textContent) || 0;
                    const avgPrice = parseFloat(avgPriceCell?.textContent) || 0;
                     if (shares > 0 && marketValueCell && gainLossCell) {
                         const marketValue = shares * newPrice;
                         const totalCost = shares * avgPrice;
                         const gainLoss = marketValue - totalCost;
                         const gainLossPercent = totalCost !== 0 ? (gainLoss / totalCost) * 100 : (marketValue > 0 ? Infinity : 0);

                         marketValueCell.textContent = formatCurrency(marketValue); // Use corrected helper

                         gainLossCell.textContent = `
                            ${formatCurrency(gainLoss)} ${gainLossPercent !== null && isFinite(gainLossPercent) ? ` (${gainLossPercent.toFixed(1)}%)` : (gainLossPercent === Infinity ? ' (+∞%)' : '')}
                        `;
                         gainLossCell.className = `text-end ${gainLoss >= 0 ? 'text-success' : 'text-danger'}`; // Update color class
                     }
                 }


                // Opdater også i asset info display, HVIS det er det viste symbol
                 if (assetSymbolSpan && assetSymbolSpan.textContent === symbol && assetPriceSpan) {
                     assetPriceSpan.textContent = newPrice.toFixed(2);
                     // Opdater change også? Kræver 'previous close' eller 'change' data fra socket
                     // If socket sends change data: update assetChangeSpan here too
                     updateBuyCostEstimate(); // Opdater estimat da prisen ændrede sig
                }
             }
        });

        // Hvis priser for EJEDE aktiver har ændret sig, genberegn KUN porteføljeværdi/PnL totaler
        if (ownedSymbolsUpdated.size > 0) {
            console.log("Owned stock prices changed, recalculating portfolio totals...");
            recalculatePortfolioTotals(); // Use a more lightweight function than full fetch
        }
     }

     // Lightweight function to recalculate totals without a full API fetch
     function recalculatePortfolioTotals() {
         if (!portfolioValueDisplayEl && !profitLossDisplayEl) return; // No need if elements aren't there

        let calculatedPortfolioValue = 0;
        const rows = holdingsTableBody?.querySelectorAll('tr[data-symbol]');

        if (rows) {
            rows.forEach(row => {
                const symbol = row.dataset.symbol;
                const sharesCell = row.querySelector('.shares-held-cell');
                const priceCell = row.querySelector(`#stockPrice-${symbol}`);
                const shares = parseFloat(sharesCell?.textContent) || 0;
                // Use the current price from the cell text content if available and valid
                let currentPrice = parseFloat(priceCell?.textContent) || currentStockPrices[symbol]; // Fallback to state

                 if (shares > 0 && typeof currentPrice === 'number' && !isNaN(currentPrice)) {
                     calculatedPortfolioValue += shares * currentPrice;
                 } else if (shares > 0) {
                     console.warn(`Cannot recalculate value for ${symbol} - Price missing or invalid in cell/state.`);
                     // Fallback using avg price?
                     const avgPriceCell = row.querySelector('td:nth-child(5)');
                     const avgPrice = parseFloat(avgPriceCell?.textContent) || 0;
                     calculatedPortfolioValue += shares * avgPrice;
                 }
             });
        }

        if (portfolioValueDisplayEl) {
            portfolioValueDisplayEl.textContent = formatCurrency(calculatedPortfolioValue); // Use corrected helper
        }

         // Recalculate P/L (requires current balance - fetch only balance? Or use window.userBalance?)
         const currentBalance = typeof window.userBalance === 'number' ? window.userBalance : 0; // Use global balance if available
         if (profitLossDisplayEl && currentBalance !== 0) { // Avoid P/L calc if balance unknown
             const currentTotalValue = calculatedPortfolioValue + currentBalance;
             const profitLoss = currentTotalValue - INITIAL_BALANCE;

            profitLossDisplayEl.textContent = formatCurrency(profitLoss); // Use corrected helper
            profitLossDisplayEl.className = 'd-inline-block '; // Reset classes before adding color
            if (profitLoss > 0.01) profitLossDisplayEl.classList.add("text-success");
             else if (profitLoss < -0.01) profitLossDisplayEl.classList.add("text-danger");
             else profitLossDisplayEl.classList.add("text-muted");
        } else if (profitLossDisplayEl) {
            profitLossDisplayEl.textContent = 'N/A'; // Indicate balance is needed
            profitLossDisplayEl.className = 'd-inline-block text-muted';
         }
     }

    // Funktion til periodisk at anmode om aktieopdateringer
     function requestStockUpdates() {
        if (socket && socket.connected) {
             // Request updates only for symbols currently held in the portfolio + maybe watchlist
             const ownedSymbols = Array.from(holdingsTableBody?.querySelectorAll('tr[data-symbol]') || []).map(tr => tr.dataset.symbol);
             // TODO: Add symbols from watchlist
             const interestedSymbols = [...new Set(ownedSymbols)]; // Combine and ensure unique

            if (interestedSymbols.length > 0) {
                 console.log("Requesting stock updates for symbols:", interestedSymbols);
                 socket.emit("request_stock_updates", { symbols: interestedSymbols }); // Send specific symbols
             } else {
                 console.log("Requesting general stock updates (no owned symbols detected).");
                 socket.emit("request_stock_updates", {}); // Fallback or general update request
             }
         }
     }

    // --- FORM HANDLERS ---
     const handleApiFormSubmit = async (form, apiUrl, successMessageBase) => {
        const button = form.querySelector('button[type="submit"]');
        if (utils.toggleButtonLoading && button) utils.toggleButtonLoading(button, true);

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Konvertering og validering (tilpas efter behov)
        if (data.shares) data.shares = parseInt(data.shares, 10);
         // if (data.price) data.price = parseFloat(data.price.replace(',', '.')); // Not typical for buy/sell
         if (data.symbol) data.symbol = data.symbol.toUpperCase();

        // --- Specifik Validering for Køb/Sælg ---
        if (form.id === 'buy-stock-form' || form.id === 'sell-stock-form') {
            if (!data.symbol) {
                 utils.showToast("Symbol mangler.", "warning");
                 if (utils.toggleButtonLoading && button) utils.toggleButtonLoading(button, false);
                return;
             }
            if (isNaN(data.shares) || data.shares <= 0) {
                utils.showToast("Ugyldigt antal aktier angivet.", "warning");
                if (utils.toggleButtonLoading && button) utils.toggleButtonLoading(button, false);
                document.getElementById(form.id === 'buy-stock-form' ? 'buy-shares' : 'sell-shares')?.focus();
                return;
            }
             // Check against available shares for selling
             if (form.id === 'sell-stock-form' && sellAvailableSharesSpan) {
                const maxSell = parseFloat(sellAvailableSharesSpan.textContent) || 0;
                 if (!isNaN(maxSell) && data.shares > maxSell) {
                     utils.showToast(`Du kan højst sælge ${maxSell} aktier af ${data.symbol}.`, "warning");
                     if (utils.toggleButtonLoading && button) utils.toggleButtonLoading(button, false);
                     document.getElementById('sell-shares')?.focus();
                    return;
                 }
             }
         }
         // --- Slut validering ---

        try {
            const result = await utils.postData(apiUrl, data); // Brug helper til POST (inkl CSRF)

             // Succes fra API
             if (!result || !result.success) { // Check om API'et returnerede en succes-markør
                 throw new Error(result?.error || result?.message || 'API anmodning fejlede uden specifik fejl.');
             }

             utils.showToast(result.message || `${successMessageBase}: ${data.shares} stk ${data.symbol}`, "success");
             form.reset(); // Nulstil form ved succes

             // VIGTIGT: Opdater HELE portefølje UI'et efter succesfuld transaktion
            await fetchAndUpdatePortfolioUI();

             // Ryd Asset Info Display hvis symbolet matcher
             if (assetSymbolSpan && assetSymbolSpan.textContent === data.symbol) {
                assetInfoDisplay.style.display = 'none';
                assetSymbolInput.value = ''; // Clear search input too
             }
             // Clear buy/sell forms completely
             if (buyCostEstimateSpan) buyCostEstimateSpan.textContent = formatCurrency(0);
             if (sellAvailableSharesSpan) sellAvailableSharesSpan.textContent = '?';
             if (buyAssetNameDisplay) buyAssetNameDisplay.textContent = '-';
             if (sellAssetNameDisplay) sellAssetNameDisplay.textContent = '-';


        } catch (error) {
             console.error(`Error submitting ${form.id}:`, error);
            utils.showToast(`Fejl ved ${successMessageBase}: ${error.message}`, "danger");
        } finally {
             if (utils.toggleButtonLoading && button) utils.toggleButtonLoading(button, false);
        }
    };


    // --- EVENT LISTENERS SETUP ---

    // Socket.IO Listeners (Kun hvis socket er tilgængelig)
    const socket = window.globalSocket;
    if (socket) {
         console.log("Aktiedyst: Setting up socket listeners using global socket.");
         socket.off("stock_update"); // Remove previous listener if any (for hot-reloading safety)
         socket.on("stock_update", handleStockUpdate);
         socket.off('connect_error');
         socket.on('connect_error', (err) => console.error('Aktiedyst Socket connection error:', err));
         socket.off('disconnect');
         socket.on('disconnect', (reason) => console.warn(`Aktiedyst Socket disconnected: ${reason}`));

         // Start interval for at bede om opdateringer
         if (stockUpdateIntervalId) clearInterval(stockUpdateIntervalId); // Ryd gammelt interval først
         stockUpdateIntervalId = setInterval(requestStockUpdates, STOCK_UPDATE_INTERVAL_MS);
         // requestStockUpdates(); // Delay initial request until portfolio is loaded? Or let first portfolio load trigger it?

        // Cleanup interval on page unload
        window.addEventListener('beforeunload', () => {
            if (stockUpdateIntervalId) clearInterval(stockUpdateIntervalId);
            // Optionally disconnect socket or leave room?
            // if (socket && socket.connected) { socket.emit("leave_room", { room: "stocks_page" }); }
         });
     } else {
        console.warn("Aktiedyst: Global socket not available, real-time stock updates disabled.");
         // Show message to user?
    }

    // Søge Formular
    if (assetSearchForm) {
        assetSearchForm.addEventListener('submit', async (event) => {
            event.preventDefault();
             const symbol = assetSymbolInput.value.trim().toUpperCase();
            if (!symbol) return;

            console.log("Searching for asset:", symbol);
            if (searchButton && utils.toggleButtonLoading) utils.toggleButtonLoading(searchButton, true);
             if(assetInfoDisplay) assetInfoDisplay.style.display = 'none'; // Skjul gammel info

             try {
                 // Brug utils.getData til at hente data
                const data = await utils.getData(`/stocks/api/stocks/${symbol}`); // Tjek endpoint
                 if (!data || !data.symbol) throw new Error("Data ikke fundet for symbol."); // Tjek API response
                updateAssetInfoDisplay(data); // Update display which also calls updateBuyCostEstimate
             } catch (error) {
                 console.error("Asset search failed:", error);
                utils.showToast(`Fejl ved søgning på '${symbol}': ${error.message}`, 'warning');
            } finally {
                if (searchButton && utils.toggleButtonLoading) utils.toggleButtonLoading(searchButton, false);
            }
        });
    }

    // Input i Købsformular (opdater estimat)
    if (buySharesInput) {
        buySharesInput.addEventListener('input', updateBuyCostEstimate);
    }

    // Køb Formular Submit
    if (buyForm) {
         buyForm.addEventListener('submit', (e) => {
             e.preventDefault();
             handleApiFormSubmit(buyForm, '/stocks/buy_stock', 'Køb af aktie'); // Tjek API endpoint
         });
     } else { console.warn("Buy form (#buy-stock-form) not found."); }

    // Sælg Formular Submit
    if (sellForm) {
         sellForm.addEventListener('submit', (e) => {
             e.preventDefault();
             handleApiFormSubmit(sellForm, '/stocks/sell_stock', 'Salg af aktie'); // Tjek API endpoint
         });
    } else { console.warn("Sell form (#sell-stock-form) not found."); }


    // Slet Portefølje Knap (Modal Bekræft)
    if (confirmDeletePortfolioBtn) {
        confirmDeletePortfolioBtn.addEventListener('click', async function() { // Brug 'function' for at 'this' virker
            const portfolioId = portfolioIdToDeleteInput.value;
            if (!portfolioId) return;
            console.log("Confirming deletion of portfolio:", portfolioId);
            if (utils.toggleButtonLoading) utils.toggleButtonLoading(this, true);

            try {
                // Use DELETE method via utils.deleteData if available, otherwise POST
                let result;
                if (utils.deleteData) {
                    result = await utils.deleteData(`/stocks/api/portfolio/${portfolioId}`);
                } else {
                    // Fallback to POST if deleteData helper doesn't exist
                    console.warn("utils.deleteData not found, using POST for deletion.");
                    result = await utils.postData(`/stocks/api/portfolio/delete`, { portfolio_id: portfolioId });
                }

                 if (!result || !result.success) {
                    throw new Error(result?.error || 'Kunne ikke slette portefølje.');
                }

                 // Fjern fra UI (Liste + Select filter)
                 portfolioListContainer?.querySelector(`[data-portfolio-id="${portfolioId}"]`)?.remove();
                 filterPortfolioSelect?.querySelector(`option[value="${portfolioId}"]`)?.remove();

                 const modalInstance = bootstrap.Modal.getInstance(deletePortfolioModalEl);
                if (modalInstance) modalInstance.hide();
                utils.showToast(result.message || `Portefølje slettet.`, 'success');

                // Opdater hovedvisning hvis den slettede portefølje var aktivt valgt?
                 fetchAndUpdatePortfolioUI(); // Kald igen for at refreshe med 'alle'

             } catch (error) {
                console.error("Error deleting portfolio:", error);
                utils.showToast(`Fejl: Kunne ikke slette portefølje (${error.message})`, 'danger');
             } finally {
                 if (utils.toggleButtonLoading) utils.toggleButtonLoading(this, false);
            }
         });
     }


    // --- Event Delegation for dynamiske knapper ---
    // Beholdningstabel Knapper
    if (holdingsTableBody) {
        holdingsTableBody.addEventListener('click', (event) => {
             // Mønster: Find knappen, hent symbol, kald handler
            const quickBuyBtn = event.target.closest('.quick-buy-btn');
             if (quickBuyBtn) {
                const symbol = quickBuyBtn.dataset.symbol;
                if (symbol) {
                    event.stopPropagation(); // Undgå at klik på række også trigges
                    handleQuickBuy(symbol);
                }
                return;
             }
             const quickSellBtn = event.target.closest('.quick-sell-btn');
            if (quickSellBtn) {
                const symbol = quickSellBtn.dataset.symbol;
                 if (symbol) {
                    event.stopPropagation();
                    handleQuickSell(symbol);
                 }
                return;
            }
             const viewChartBtn = event.target.closest('.view-chart-btn');
            if (viewChartBtn) {
                const symbol = viewChartBtn.dataset.symbol;
                if (symbol) {
                     event.stopPropagation();
                    handleViewChart(symbol);
                }
             }
         });
     } else { console.warn("Holdings table body (#detailed-holdings-body) not found for event delegation."); }

    // Portfolio Liste Knapper
    if (portfolioListContainer) {
         portfolioListContainer.addEventListener('click', (event) => {
             const editBtn = event.target.closest('button[data-action="editPortfolio"]');
             if (editBtn) {
                const portfolioId = editBtn.dataset.portfolioId;
                 if (portfolioId) handleEditPortfolio(portfolioId); // Implementer denne
                 return;
            }
             const deleteBtn = event.target.closest('button[data-action="deletePortfolio"]');
            if (deleteBtn) {
                 const portfolioId = deleteBtn.dataset.portfolioId;
                if (portfolioId) showDeletePortfolioModal(portfolioId);
            }
        });
    } else { console.warn("Portfolio list container (#portfolio-list-container) not found for event delegation."); }


    // --- FILTERING LOGIC (Fra gl. app.js) ---
    // Funktion til at udføre filtreringen af beholdningstabellen
    function filterDetailedHoldings() {
         if (!holdingsTableBody) return; // Stop hvis tabellen ikke er der

        const activeButton = filterContainer ? filterContainer.querySelector('.btn-group button.active') : null;
        const selectedType = activeButton ? activeButton.getAttribute('data-filter') : 'all';
        const selectedPortfolio = filterPortfolioSelect ? filterPortfolioSelect.value : 'all';
        console.log(`Filtering holdings by: Type=${selectedType}, Portfolio=${selectedPortfolio}`);

        let hasVisibleRows = false;
        const allRows = holdingsTableBody.querySelectorAll('tr');

         allRows.forEach(row => {
            // Spring over "tom tabel" eller "ingen resultat" besked-rækker
            if (row === noResultsRow || row.querySelector('td[colspan]')) {
                 // Keep noResultsRow hidden initially during filtering pass
                 if(row === noResultsRow) row.style.display = 'none';
                 return;
            }

            // Tjek om rækken matcher de valgte filtre
            const rowType = row.getAttribute('data-type') || 'all';
            const rowPortfolio = row.getAttribute('data-portfolio') || 'all';
            const typeMatches = (selectedType === 'all' || rowType === selectedType);
            const portfolioMatches = (selectedPortfolio === 'all' || rowPortfolio === selectedPortfolio);

            if (typeMatches && portfolioMatches) {
                 row.style.display = ''; // Tom streng = default (typisk 'table-row')
                 hasVisibleRows = true;
            } else {
                 row.style.display = 'none'; // Skjul rækken
            }
        });

        // Vis 'ingen resultater'-rækken hvis relevant AFTER checking all rows
        if (noResultsRow) {
            noResultsRow.style.display = hasVisibleRows ? 'none' : 'table-row';
        }
    }

    // Tilføj event listeners til filter controls
     if (filterAssetTypeButtons) {
        filterAssetTypeButtons.forEach(button => {
             button.addEventListener('click', () => {
                 filterAssetTypeButtons.forEach(btn => btn.classList.remove('active')); // Fjern fra alle
                 button.classList.add('active'); // Tilføj til den klikkede
                filterDetailedHoldings();
            });
         });
     }
     if (filterPortfolioSelect) {
         filterPortfolioSelect.addEventListener('change', filterDetailedHoldings);
     }


    // --- ACTION FUNCTIONS (Fra ny aktiedyst.js, tilpasset) ---
    async function handleQuickBuy(symbol) {
        console.log(`Quick Buy requested for: ${symbol}`);
        // Scroll to top or specific section?
         window.scrollTo({ top: 0, behavior: 'smooth' });
        // Gå til købs-sektion/vis info om aktivet
        if (assetSymbolInput) assetSymbolInput.value = symbol;
        // Trigger søgning for at få seneste data VIST i købsformularen
        if (assetSearchForm) {
             // Show loading on search button while quick buy prefills
             if (searchButton && utils.toggleButtonLoading) utils.toggleButtonLoading(searchButton, true);
             // Dispatch and AWAIT the submit event completion to ensure data is populated
             await assetSearchForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
             if (searchButton && utils.toggleButtonLoading) utils.toggleButtonLoading(searchButton, false); // Hide loading after search
         }
        // Fokus på antal-feltet
        if (buySharesInput) {
            buySharesInput.focus();
             buySharesInput.select(); // Markér evt. eksisterende tekst
        }
    }

    async function handleQuickSell(symbol) {
        console.log(`Quick Sell requested for: ${symbol}`);
        // Scroll to top or specific section?
         window.scrollTo({ top: 0, behavior: 'smooth' });
        // Gå til salgs-sektion/vis info
         if (assetSymbolInput) assetSymbolInput.value = symbol;
        // Trigger søgning for at vise data i salgsformularen
        if (assetSearchForm) {
             if (searchButton && utils.toggleButtonLoading) utils.toggleButtonLoading(searchButton, true);
             await assetSearchForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
             if (searchButton && utils.toggleButtonLoading) utils.toggleButtonLoading(searchButton, false);
        }

         // Fokus på antal-feltet i SÆLG
         if (sellSharesInput) {
             // Prøv at forudfylde med max antal fra tabellen ELLER den lille span
             let maxShares = 0;
             const row = holdingsTableBody?.querySelector(`tr[data-symbol="${symbol}"] .shares-held-cell`);
            if(row) maxShares = parseFloat(row.textContent) || 0;
            // Fallback using the span which might be updated by the search dispatch above
            else maxShares = parseFloat(sellAvailableSharesSpan?.textContent) || 0;

             sellSharesInput.value = maxShares > 0 ? maxShares : '';
            sellSharesInput.focus();
             sellSharesInput.select();
         }
     }

    function handleViewChart(symbol) {
        console.log(`View Chart requested for: ${symbol}`);
        // TODO: Implementer visning af graf, f.eks. i en modal eller separat sektion
         utils.showToast(`Visning af graf for ${symbol} er ikke implementeret.`, 'info');
         // Example: Redirect or open modal
         // window.location.href = `/stocks/chart/${symbol}`;
         // const chartModal = new bootstrap.Modal(document.getElementById('stockChartModal'));
         // document.getElementById('chartModalSymbol').textContent = symbol;
         // loadChartData(symbol); // Function to fetch and render chart
         // chartModal.show();
     }

    function handleEditPortfolio(portfolioId) {
        console.warn(`Edit Portfolio ${portfolioId} not implemented.`);
        utils.showToast(`Redigering af portefølje ${portfolioId} er ikke implementeret endnu.`, 'info');
     }

     function showDeletePortfolioModal(portfolioId) {
        if (!deletePortfolioModalEl || !portfolioNameToDeleteSpan || !portfolioIdToDeleteInput) return;
         // Find navn (mere robust - BØR have navn i data attribute på knap eller list item)
         let portfolioName = `Portefølje ${portfolioId}`; // Fallback
         const triggerElement = portfolioListContainer?.querySelector(`button[data-portfolio-id="${portfolioId}"]`) || portfolioListContainer?.querySelector(`li[data-portfolio-id="${portfolioId}"]`);
        if (triggerElement) {
             portfolioName = triggerElement.dataset.portfolioName || // Prioriter data-portfolio-name="..."
                           triggerElement.querySelector('.portfolio-name-span')?.textContent || // Prøv at finde span indeni
                           portfolioName; // Ellers fallback
         }
        portfolioNameToDeleteSpan.textContent = utils.escapeHtml(portfolioName);
        portfolioIdToDeleteInput.value = portfolioId;
         const modalInstance = bootstrap.Modal.getOrCreateInstance(deletePortfolioModalEl);
         modalInstance.show();
     }


    // ----- Tooltip Initialization -----
     // Already checked for utils.initializeTooltips in dependency check
     console.log("Aktiedyst: Initializing tooltips...");
     utils.initializeTooltips(); // Kald den globale tooltip initializer fra utils.js


    // ----- Initial Data Loading & Setup -----
     (async () => {
         console.log("Aktiedyst: Running initial data fetches...");
         await fetchAndUpdatePortfolioUI(); // Hent portfolio data ved start (wait for it)
         // After portfolio is loaded, make the first request for stock updates for owned symbols
         requestStockUpdates();
         console.log("Aktiedyst page fully initialized.");
     })();

}); // End DOMContentLoaded





   // Initialiser data-hentning for de forskellige sektioner når siden loader
  // document.addEventListener('DOMContentLoaded', () => {
    // console.log("DOM Loaded - Initialiserer Aktiedyst Dashboard...");
     // Kald dine funktioner for at hente:
     // fetchAccountSummary();
      // fetchPortfolios(); // Skal også opdatere portfolio dropdowns
      // fetchHoldings('all'); // Hent for alle porteføljer initialt
     // fetchWatchlist();
     // fetchActiveOrders();
      // fetchDividends();
     // fetchTransactions(); // Hent uden filter først
     // loadSettings();

     // Fjern data-placeholder rækker hvis data hentes successfuldt
     // Ellers vis fejlmeddelelse
  // });
