
// Variable globale stockant l'année sélectionnée dans le curseur
// Par défaut on positionne sur 2025 (slider value 0 → 2025)
window.timelineYear = 2026;

// Event listener pour le slider timeline
document.addEventListener('DOMContentLoaded', function() {
    const timelineSlider = document.getElementById('timeline-slider');

    if (timelineSlider) {
        // Mapping: slider value 0..4 -> end of year 2025..2029 (year = 2025 + value)
        // Adjust visual offset per value as requested:
        // value 0 -> +5px, 1 -> +10px, 2 -> +5px, 3 -> 0, 4 -> -5px
        const adjustSliderOffset = (el, val) => {
            if (!el) return;
            let x = 0;
            switch (val) {
                case 0: x = 20; break;
                case 1: x = 12; break;
                case 2: x = 5; break;
                case 3: x = 0; break;
                case 4: x = -9; break;
                default: x = 0;
            }
            // base translate centers the thumb; then apply horizontal offset
            el.style.transform = `translate(-50%,-50%) translateX(${x}px)`;
        };

        // initialize visual offset based on current value and set timelineYear accordingly
        try {
            const initialV = parseInt(timelineSlider.value, 10);
            const numericInit = isNaN(initialV) ? 0 : initialV;
            adjustSliderOffset(timelineSlider, numericInit);
            window.timelineYear = 2025 + numericInit;
        } catch (e) { /* ignore */ }

        timelineSlider.addEventListener('input', function(e) {
            const v = parseInt(e.target.value, 10);
            const numericV = isNaN(v) ? 0 : v;
            window.timelineYear = 2025 + numericV;
            adjustSliderOffset(timelineSlider, numericV);

            // Réappliquer tous les filtres
            if (typeof filterAndShowApplications === 'function') {
                filterAndShowApplications();
            }
        });
    }
});

// Affiche les détails d'une application (popup capabilities)
function displayApplicationCapabilities(appName, appData) {
    const infoPanel = document.getElementById('info-panel');
    if (!infoPanel) {
        console.error('❌ Élément info-panel introuvable !');
        return;
    }
    // Do not overwrite existing sidebar classes (keep dual-panel-active); add expanded marker
    document.getElementById('sidebar').classList.add('l2-expanded');

    // Track last displayed app for Back button behavior
    window._lastDisplayedAppName = appName;
    console.debug('[displayApplicationCapabilities] appName=', appName, 'selectedCountryName=', window.selectedCountryName, '_currentMatrixViewCountry=', window._currentMatrixViewCountry);

    // Affichage spécifique pour Matrix : lister les variantes (toutes ou celles présentes dans le pays sélectionné)
    if (appName === 'Matrix') {
        let variants = [];
        if (window.HiddenApps && typeof window.HiddenApps.getVariantsForMainApp === 'function') {
            variants = window.HiddenApps.getVariantsForMainApp('Matrix', window.selectedCountryName || null, window.allApplications);
        } else {
            if (window.selectedCountryName) {
                variants = window.allApplications.filter(app => app.parent === 'Matrix' && Array.isArray(app.countries) && app.countries.includes(window.selectedCountryName));
            } else {
                variants = window.allApplications.filter(app => app.parent === 'Matrix');
            }
        }
        if (variants.length > 0) {
            let html = `
                <div style="margin-bottom: 15px;">
                    <button onclick="showBackFromApp()" class="back-button" style="margin-bottom: 8px;">← Back</button>
                    <h3 class="app-title">Matrix${window.selectedCountryName ? ' ' + window.selectedCountryName : ''} (${variants.length})</h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 15px;">
            `;
            variants.forEach(variant => {
                html += `
                    <div style="background: white; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="background: #f5f5f5; padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #1976d2; display: flex; justify-content: space-between; align-items: center;">
                            <span>${variant.name}</span>
                            <span style="font-size: 0.85em; color: #666; font-weight: normal;">${variant.category || ''}</span>
                        </div>
                        <div style="padding: 12px; font-size: 14px; line-height: 1.5;">
                            ${variant.application_code ? `<div style="margin-bottom: 4px;"><strong style="color: #555;">Code:</strong> ${variant.application_code}</div>` : ''}
                            ${variant["7R_analysis"] ? `<div style="margin-bottom: 4px;"><strong style="color: #555;">7R:</strong> ${variant["7R_analysis"]}</div>` : ''}
                            ${variant.it_owner ? `<div style="margin-bottom: 4px;"><strong style="color: #555;">IT Owner:</strong> ${variant.it_owner}</div>` : ''}
                            ${variant.description ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; color: #444;">${variant.description}</div>` : ''}
                        </div>
                    </div>`;
            });
            html += `</div>`;
            infoPanel.innerHTML = html;
            return;
        }
    }

    const appCapabilities = [];
    let allL3 = appData?.l3 || [];
    let allL2 = appData?.l2 || [];
    let appL4List = appData?.l4 || [];
    if ((allL3.length === 0 && allL2.length === 0) && window.appCapabilitiesUnified) {
        let unifiedData = null;
        if (window.appCapabilitiesUnified[appName]) {
            unifiedData = window.appCapabilitiesUnified[appName];
        } else {
            // Recherche générique d'un parent à variantes
            for (const parent in window.appCapabilitiesUnified) {
                if (window.appCapabilitiesUnified[parent]?.variants?.[appName]) {
                    unifiedData = window.appCapabilitiesUnified[parent].variants[appName];
                    break;
                }
            }
        }
        if (unifiedData) {
            allL3 = unifiedData.l3 || [];
            allL2 = unifiedData.l2 || [];
            appL4List = unifiedData.l4 || [];
        }
    }
    currentDisplayedApp = { 
        name: appName, 
        data: {
            ...appData,
            l3: allL3,
            l2: allL2,
            l4: appL4List
        }
    };
    allL3.forEach(l3Id => {
        if (capabilities?.L3?.[l3Id]) {
            appCapabilities.push({ 
                id: l3Id, 
                l3_name: capabilities.L3[l3Id],
                l2_name: findL2ForL3(l3Id),
                l1_name: findL1ForL2(findL2ForL3(l3Id))
            });
        } else {
            console.warn(`⚠️ Capability L3 "${l3Id}" non trouvée dans les définitions`);
        }
    });
    if (allL3.length === 0 && allL2.length > 0) {
        allL2.forEach(l2Id => {
            if (capabilities?.L2?.[l2Id]) {
                appCapabilities.push({
                    id: l2Id,
                    l3_name: capabilities.L2[l2Id],
                    l2_name: capabilities.L2[l2Id],
                    l1_name: findL1ForL2(l2Id)
                });
            } else {
                console.warn(`⚠️ Capability L2 "${l2Id}" non trouvée dans les définitions`);
            }
        });
    }
    let appTitle = appName;
    // Code spécifique à Matrix pour afficher le pays ou la région sélectionnée
    if (appName === 'Matrix') {
        let selectedCountry = window.selectedCountryName;
        let selectedRegion = window.selectedRegionName;
        if (selectedCountry && appData.countries && appData.countries.includes(selectedCountry)) {
            appTitle = `Matrix ${selectedCountry}`;
        } else if (selectedRegion && appData.regions && appData.regions.includes(selectedRegion)) {
            appTitle = `Matrix ${selectedRegion}`;
        }
    }
    let itOwnerHTML = '';
    // Générer le bouton BIA pour les applications spécifiques
    const appsWithBIA = [
        'Orion Brazil',
        'OMS 3PL (PFS)',
        'Matrix',
        'INES',
        'MSN 2.0',
        'Parts',
        'DAGITIM',
        'Chronotruck',
        'CEVA SPOT MODULE',
        'CADIS (R4)',
        'Samsara MyFleet',
        'Fleetwave',
        'Project 44 (Ground)',
        'My-Fleet'
    ];
    let biaButtonHTML = '';
    if (appsWithBIA.includes(appName)) {
        biaButtonHTML = `<button id="bia-btn" style="
                        background: #FF9800;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 6px 12px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: bold;
                        display: inline-block;
                        transition: all 0.2s ease;
                    " title="BIA">BIA</button>`;
    }
    let capabilitiesHTML = `
        <div style="margin-bottom: 15px;">
            <button onclick="showBackFromApp()" class="back-button" style="margin-bottom: 8px;">← Back</button>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                
            </div>
        </div>
    `;

    // Ajout des informations détaillées de l'application
    capabilitiesHTML += `<div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 14px; line-height: 1.5; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">`;
    
            capabilitiesHTML += `
                <div style="background: #f5f5f5; padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #1976d2; display:flex; justify-content: space-between; align-items:center; margin-bottom:8px;">
                    <span class="app-title">${appTitle}</span>
                    <span style="font-size:0.85em;color:#666;font-weight:normal;">${appData.category || ''}</span>
                </div>
            `;
    if (appData.application_code) {
        capabilitiesHTML += `<div style="margin-bottom: 8px;"><strong style="color: #555;">Code:</strong> <span style="color: #333;">${appData.application_code}</span></div>`;
    }
    if (appData["7R_analysis"]) {
        capabilitiesHTML += `<div style="margin-bottom: 8px;"><strong style="color: #555;">7R Analysis:</strong> <span style="color: #333;">${appData["7R_analysis"]}</span></div>`;
    }
    if (appData["7R_action_year"]) {
        let action = appData["7R_action_year"];
        if (appData["7R_action_month"]) action += ` (${appData["7R_action_month"]})`;
        capabilitiesHTML += `<div style="margin-bottom: 8px;"><strong style="color: #555;">7R Action:</strong> <span style="color: #333;">${action}</span></div>`;
    }
    if (appData.replace_by) {
        capabilitiesHTML += `<div style="margin-bottom: 8px;"><strong style="color: #555;">Replace by:</strong> <span style="color: #333;">${appData.replace_by}</span></div>`;
    }
    if (appData.it_owner) {
        capabilitiesHTML += `<div style="margin-bottom: 8px;"><strong style="color: #555;">IT Owner:</strong> <span style="color: #333;">${appData.it_owner}</span></div>`;
    }
    if (appData.description) {
        capabilitiesHTML += `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;"><strong style="color: #555; display: block; margin-bottom: 4px;">Description:</strong><span style="color: #333;">${appData.description}</span></div>`;
    }
    
    capabilitiesHTML += `</div>`;

    infoPanel.innerHTML = capabilitiesHTML;
    // Ajouter l'événement pour le bouton BIA si présent
    const biaBtn = document.getElementById('bia-btn');
    if (biaBtn) {
        biaBtn.onclick = function() {
            // Ouvrir BIA.html avec le nom de l'application en paramètre
            const url = `BIA.html?app=${encodeURIComponent(appName)}`;
            window.open(url, '_blank');
        };
    }
    attachL4BlockEventListeners();
    
    // Ajouter le bouton Extract s'il n'existe pas déjà
}

window.displayApplicationCapabilities = displayApplicationCapabilities;
// Ajoute une fonction globale pour revenir à la liste et recolorer
function showAllApplicationsAndRecolor() {
    window.selectedCountryName = null;
    if (typeof showAllApplications === 'function') showAllApplications();
    if (typeof filterAndShowApplications === 'function') filterAndShowApplications();
    // Masquer le container Matrix (robuste)
    var matrixContainer = document.getElementById('matrix-variants-container');
    if (matrixContainer) matrixContainer.style.display = 'none';
    if (window.hideMatrixFloatingButtons) window.hideMatrixFloatingButtons();
    // Masquer aussi le bouton flottant de sélection d'application
    if (typeof hideSelectedAppButton === 'function') hideSelectedAppButton();
}
window.showAllApplicationsAndRecolor = showAllApplicationsAndRecolor;
// Affiche la liste des variantes Matrix (clear selected country and call display)
window.showMatrixVariants = function(country) {
    if (country) {
        window.selectedCountryName = country;
        window._currentMatrixViewCountry = country;
    } else {
        window.selectedCountryName = null;
        window._currentMatrixViewCountry = null;
    }
    console.debug('[showMatrixVariants] country=', country, 'selectedCountryName=', window.selectedCountryName, '_currentMatrixViewCountry=', window._currentMatrixViewCountry);
    if (typeof window.displayApplicationCapabilities === 'function') {
        window.displayApplicationCapabilities('Matrix', {});
    }
    // Ensure the floating Matrix variant buttons/container are visible and up-to-date
    try {
        if (window.HiddenApps && typeof window.HiddenApps.renderFloatingButtons === 'function') {
            window.HiddenApps.renderFloatingButtons('Matrix', window.selectedCountryName || null, window.allApplications, 'matrix-variants-container');
            const mc = document.getElementById('matrix-variants-container');
            if (mc) mc.style.display = 'flex';
        }
    } catch (e) { /* ignore */ }
};

// Back handler that returns to the appropriate view depending on context
window.showBackFromApp = function() {
    const last = window._lastDisplayedAppName;
    console.debug('[showBackFromApp] last=', last, 'selectedCountryName=', window.selectedCountryName, '_currentMatrixViewCountry=', window._currentMatrixViewCountry);
    // If currently viewing matrix variants for a country, go to the full Matrix variants list
    if (window._currentMatrixViewCountry) {
        window.showMatrixVariants();
        return;
    }
    // If we came from a Matrix variant and a country is selected, show variants for that country
    if (last && last.startsWith && last.startsWith('Matrix') && window.selectedCountryName) {
        window.showMatrixVariants(window.selectedCountryName);
        return;
    }
    // Otherwise fallback to global apps list
    if (typeof window.showAllApplicationsAndRecolor === 'function') {
        window.showAllApplicationsAndRecolor();
    } else if (typeof window.showAllApplications === 'function') {
        window.showAllApplications();
    }
};
// Backwards-compatible alias: certains boutons appellent `showAllApplications()`
// Définit une fonction globale qui affiche la liste complète via `filterAndShowApplications`.
window.showAllApplications = function() {
    if (typeof filterAndShowApplications === 'function') {
        // clear any selected country and refresh
        window.selectedCountryName = null;
        filterAndShowApplications();
    }
};
// Fonction pour filtrer les applications selon les catégories sélectionnées
// Fonction pour afficher les applications filtrées par catégories dans la sidebar
function displayCategoryFilteredApplications(apps, selectedCategories) {
    // Si un pays est sélectionné, ne pas écraser le panneau info (la vue pays gère son affichage)
    if (window.selectedCountryName) return;
    const infoPanel = document.getElementById('info-panel');
    if (apps.length === 0) {
        infoPanel.innerHTML = `
            <div style="padding: 10px; text-align: center; color: #666;">
                Aucune application trouvée pour les catégories sélectionnées
            </div>
        `;
        return;
    }
    // Grouper par catégorie (support string ou array) - n'affiche que dans les catégories sélectionnées si filtre actif
    const groupedSidebar = {};
    apps.forEach(item => {
        let cats = Array.isArray(item.category) ? item.category : [item.category || "Autre"];
        // Si filtre actif, ne garder que les catégories sélectionnées
        if (selectedCategories && selectedCategories.length > 0) {
            cats = cats.filter(cat => selectedCategories.includes(cat));
        }
        cats.forEach(cat => {
            if (!groupedSidebar[cat]) groupedSidebar[cat] = [];
            groupedSidebar[cat].push(item.name);
        });
    });
    // Trie alphabétique des applications dans chaque catégorie
    Object.keys(groupedSidebar).forEach(cat => {
        groupedSidebar[cat].sort((a, b) => a.localeCompare(b, 'fr', {sensitivity: 'base'}));
    });
    let html = ``;
    const categoryOrder = [
        "TMS", "Asset & Fleet Management", "Track & Trace", "Integration & Middleware", "Financial & Settlement Systems",
        "Reporting & BI", "Route & Planning Optimization", "Customs",
        "Freight Marketplace", "Customer Portal", "Documents & Collaboration",
        "Digital Forwarding", "YMS", "WMS", "CRM", "OMS", "Last Mile Distribution",
        "Claims & Damages", "Carriers Portal", "Control & Quality",
        "Mobile App", "Legal Compliance"
    ];
    categoryOrder.forEach(cat => {
        if (!groupedSidebar[cat]) return;
        const appNames = groupedSidebar[cat].filter(Boolean);
        if (appNames.length === 0) return;
        html += `<div style="margin-bottom:10px;">
            <span style="font-weight:bold;">${cat} (${appNames.length})</span><br>
            ${appNames.map(name =>
                `<div class="sidebar-item" data-name="${name}" style="margin-left:10px; cursor:pointer; text-decoration:underline;">${name}</div>`
            ).join('')}
        </div>`;
    });
    // Afficher les catégories non listées dans categoryOrder à la fin
    Object.keys(groupedSidebar).forEach(cat => {
        if (categoryOrder.includes(cat)) return;
        const appNames = groupedSidebar[cat].filter(Boolean);
        if (appNames.length === 0) return;
        html += `<div style="margin-bottom:10px;">
            <span style="font-weight:bold;">${cat}</span><br>
            ${appNames.map(name =>
                `<div class="sidebar-item" data-name="${name}" style="margin-left:10px; cursor:pointer; text-decoration:underline;">${name}</div>`
            ).join('')}
        </div>`
    });
    infoPanel.innerHTML = html;
    // Ajouter les événements de clic
    if (typeof window.addAppClickEvents === 'function') {
        window.addAppClickEvents(infoPanel, allApplications);
    }
}

window.displayCategoryFilteredApplications = displayCategoryFilteredApplications;
// filters.js
// Extraction progressive : export de la fonction principale de filtrage

// Nouvelle fonction commune pour filtrer et afficher les applications selon catégories et capabilities
function filterAndShowApplications() {
    // Masquer le bouton flottant d'application sélectionnée
    if (typeof window.hideSelectedAppButton === 'function') {
        window.hideSelectedAppButton();
    }
    
    // 1. Récupérer les catégories sélectionnées
    const checkedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(checkbox => checkbox.value);
    // 2. Récupérer les capabilities sélectionnées (L2/L3/L4) - version stricte
    let allActiveCapabilities = [];
    window.allActiveCapabilities = [];
    // L3 checkboxes cochées
    const checkedL3Checkboxes = Array.from(document.querySelectorAll('.l3-checkbox:checked'));
    if (checkedL3Checkboxes.length > 0) {
        // Si au moins un L3 est coché, on ne prend QUE ces L3 (et les L4 cochés)
        checkedL3Checkboxes.forEach(checkbox => {
            const capability = checkbox.getAttribute('data-capability');
            if (capability) {
                allActiveCapabilities.push(capability);
            }
        });
        // L4 checkboxes cochées
        const checkedL4Checkboxes = Array.from(document.querySelectorAll('.l4-checkbox:checked'));
        checkedL4Checkboxes.forEach(checkbox => {
            const capability = checkbox.getAttribute('data-capability');
            if (capability) {
                allActiveCapabilities.push(capability);
            }
        });
    } else {
        // Sinon, on prend les tags/slider L2 actifs (et les L4 cochés)
        const activeL2Tags = Array.from(document.querySelectorAll('.capability-tag.active, .l2-tag.active'));
        activeL2Tags.forEach(tag => {
            const capabilities = tag.getAttribute('data-capabilities');
            if (capabilities) {
                allActiveCapabilities.push(...capabilities.split(','));
            }
        });
        // L4 checkboxes cochées
        const checkedL4Checkboxes = Array.from(document.querySelectorAll('.l4-checkbox:checked'));
        checkedL4Checkboxes.forEach(checkbox => {
            const capability = checkbox.getAttribute('data-capability');
            if (capability) {
                allActiveCapabilities.push(capability);
            }
        });
    }
    // Supprimer les doublons
    allActiveCapabilities = [...new Set(allActiveCapabilities)];
    window.allActiveCapabilities = allActiveCapabilities;

    // 3. Appliquer la logique de filtrage (par défaut OU, à adapter si besoin)
    let filteredApps = [];
    if (checkedCategories.length === 0 && allActiveCapabilities.length === 0) {
        // Aucun filtre : afficher toutes les apps non-hidden
        let matrixDuplicates = [];
        filteredApps = window.allApplications.filter(app => {
            if (app.hidden === true) return false;
            // Cas spécial Matrix : dupliquer par catégorie selon les variantes
            if (app.name === "Matrix") {
                // Récupérer toutes les variantes Matrix (même hidden)
                const variants = window.allApplications.filter(v => v.parent === "Matrix");
                // Grouper par catégorie
                const categoriesMap = {};
                variants.forEach(variant => {
                    const category = variant.category;
                    if (!categoriesMap[category]) categoriesMap[category] = new Set();
                    (variant.countries || []).forEach(c => categoriesMap[category].add(c));
                });
                // Créer une "copie" Matrix pour chaque catégorie trouvée
                Object.keys(categoriesMap).forEach(category => {
                    matrixDuplicates.push({
                        ...app,
                        countries: Array.from(categoriesMap[category]),
                        category: category
                    });
                });
                return false; // Ne pas garder Matrix dans le filtre principal
            }
            return true; // Garder toutes les autres apps non-hidden
        });
        filteredApps = [...filteredApps, ...matrixDuplicates];
    } else if (checkedCategories.length > 0 && allActiveCapabilities.length > 0) {
        // Filtre ET : apps qui correspondent à la catégorie ET à la capability
        let matrixDuplicates = [];
        filteredApps = window.allApplications.filter(app => {
            if (app.hidden === true) return false;
            // Cas spécial Matrix (parent)
            if (app.name === "Matrix") {
                // Récupérer toutes les variantes (même hidden)
                const variants = window.allApplications.filter(v => v.parent === "Matrix");
                // Pour chaque catégorie sélectionnée, créer une "copie" de Matrix si au moins une variante correspond à cette catégorie ET à la capability
                checkedCategories.forEach(category => {
                    let countriesWithCategoryAndCapability = new Set();
                    variants.forEach(variant => {
                        const matchesCategory = Array.isArray(variant.category)
                            ? variant.category.includes(category)
                            : variant.category === category;
                        const matchesCapabilities =
                            (variant.l2 && variant.l2.some(l2 => allActiveCapabilities.includes(l2))) ||
                            (variant.l3 && variant.l3.some(l3 => allActiveCapabilities.includes(l3))) ||
                            (variant.l4 && variant.l4.some(l4 => allActiveCapabilities.includes(l4)));
                        if (matchesCategory && matchesCapabilities) {
                            (variant.countries || []).forEach(c => countriesWithCategoryAndCapability.add(c));
                        }
                    });
                    if (countriesWithCategoryAndCapability.size > 0) {
                        // Créer une "copie" Matrix pour cette catégorie
                        matrixDuplicates.push({
                            ...app,
                            countries: Array.from(countriesWithCategoryAndCapability),
                            category: category
                        });
                    }
                });
                // On ne garde pas Matrix dans le filter principal (on ajoute les duplicatas après)
                return false;
            }
            // Cas général
            const matchesCategory = Array.isArray(app.category)
                ? app.category.some(cat => checkedCategories.includes(cat))
                : checkedCategories.includes(app.category);
            const matchesCapabilities =
                (app.l2 && app.l2.some(l2 => allActiveCapabilities.includes(l2))) ||
                (app.l3 && app.l3.some(l3 => allActiveCapabilities.includes(l3))) ||
                (app.l4 && app.l4.some(l4 => allActiveCapabilities.includes(l4)));
            return matchesCategory && matchesCapabilities;
        });
        // Ajouter les duplicatas Matrix pour chaque catégorie concernée
        filteredApps = [...filteredApps, ...matrixDuplicates];
    } else if (checkedCategories.length > 0) {
        // Catégorie seule
        let matrixDuplicates = [];
        filteredApps = window.allApplications.filter(app => {
            if (app.hidden === true) return false;
            // Cas spécial Matrix (parent)
            if (app.name === "Matrix") {
                // Récupérer toutes les variantes (même hidden)
                const variants = window.allApplications.filter(v => v.parent === "Matrix");
                checkedCategories.forEach(category => {
                    let countriesWithCategory = new Set();
                    variants.forEach(variant => {
                        const matchesCategory = Array.isArray(variant.category)
                            ? variant.category.includes(category)
                            : variant.category === category;
                        if (matchesCategory) {
                            (variant.countries || []).forEach(c => countriesWithCategory.add(c));
                        }
                    });
                    if (countriesWithCategory.size > 0) {
                        matrixDuplicates.push({
                            ...app,
                            countries: Array.from(countriesWithCategory),
                            category: category
                        });
                    }
                });
                return false;
            }
            return Array.isArray(app.category)
                ? app.category.some(cat => checkedCategories.includes(cat))
                : checkedCategories.includes(app.category);
        });
        filteredApps = [...filteredApps, ...matrixDuplicates];
    } else {
        // Capability seule
        let matrixDuplicates = [];
        filteredApps = window.allApplications.filter(app => {
            if (app.hidden === true) return false;
            // Cas Matrix (parent) : dupliqué par catégorie selon les variantes
            if (app.name === "Matrix") {
                // Récupérer toutes les variantes (même hidden)
                const variants = window.allApplications.filter(v => v.parent === "Matrix");
                // Grouper les variantes par catégorie qui couvrent la capability
                const categoriesMap = {};
                variants.forEach(variant => {
                    const matchesCapabilities =
                        (variant.l2 && variant.l2.some(l2 => allActiveCapabilities.includes(l2))) ||
                        (variant.l3 && variant.l3.some(l3 => allActiveCapabilities.includes(l3))) ||
                        (variant.l4 && variant.l4.some(l4 => allActiveCapabilities.includes(l4)));
                    if (matchesCapabilities) {
                        const category = variant.category;
                        if (!categoriesMap[category]) categoriesMap[category] = new Set();
                        (variant.countries || []).forEach(c => categoriesMap[category].add(c));
                    }
                });
                // Créer une "copie" Matrix pour chaque catégorie
                Object.keys(categoriesMap).forEach(category => {
                    if (categoriesMap[category].size > 0) {
                        matrixDuplicates.push({
                            ...app,
                            countries: Array.from(categoriesMap[category]),
                            category: category
                        });
                    }
                });
                return false;
            }
            // Cas général
            // Correction : correspondance stricte sur les codes L2/L3/L4
            // Comparaison stricte : pas de préfixe, pas de confusion (ex : MTTFO1 ≠ MTTFO3)
            const hasCapability = (
                (app.l2 && app.l2.some(l2 => allActiveCapabilities.some(cap => cap === l2))) ||
                (app.l3 && app.l3.some(l3 => allActiveCapabilities.some(cap => cap === l3))) ||
                (app.l4 && app.l4.some(l4 => allActiveCapabilities.some(cap => cap === l4)))
            );
            if (!hasCapability) return false;
            // Si c'est un parent (a des variantes), vérifier qu'au moins une variante non-hidden couvre la capability
            const hasVariants = window.allApplications.some(a => a.parent === app.name);
            if (hasVariants && !app.parent) {
                const variantsWithCapability = window.allApplications.filter(variant => {
                    if (variant.parent !== app.name || variant.hidden === true) return false;
                    return (
                        (variant.l2 && variant.l2.some(l2 => allActiveCapabilities.includes(l2))) ||
                        (variant.l3 && variant.l3.some(l3 => allActiveCapabilities.includes(l3))) ||
                        (variant.l4 && variant.l4.some(l4 => allActiveCapabilities.includes(l4)))
                    );
                });
                if (variantsWithCapability.length === 0) return false;
            }
            return true;
        });
        filteredApps = [...filteredApps, ...matrixDuplicates];
    }
    
    // Dédupliquer Matrix par catégorie (garantir un seul Matrix par catégorie unique)
    const matrixByCategory = {};
    const nonMatrixApps = [];
    filteredApps.forEach(app => {
        if (app.name === "Matrix") {
            const key = app.category || "Autre";
            if (!matrixByCategory[key]) {
                matrixByCategory[key] = app;
            }
        } else {
            nonMatrixApps.push(app);
        }
    });
    filteredApps = [...nonMatrixApps, ...Object.values(matrixByCategory)];
    
    // ============================================
    // FILTRE TIMELINE : S'applique uniformément à toutes les années (2025-2029)
    // ============================================
    if (window.timelineYear) {
        filteredApps = filteredApps.filter(app => 
            !app.active_years || app.active_years.includes(window.timelineYear.toString())
        );
    }
    
    window.currentFilteredApps = filteredApps;

    // Mettre à jour le compteur d'applications par année (suivant le slider Rationalization Roadmap)
    const yearCounterElement = document.getElementById('year-app-count');
    const yearDisplayElement = document.getElementById('year-display');
    const yearLabelElement = document.getElementById('year-app-label');
    const fixedYear = window.timelineYear ? String(window.timelineYear) : '2026';
    if (yearCounterElement) {
        // Compter directement depuis allApplications pour l'année sélectionnée
        const totalCount = window.allApplications.filter(app => {
            if (app.name === 'Matrix') return false;
            if (!app.active_years || !app.active_years.includes(fixedYear)) return false;
            const matchesCategory = checkedCategories.length === 0 || checkedCategories.includes(app.category);
            const matchesCapability = allActiveCapabilities.length === 0 || 
                (app.l2 && app.l2.some(l2 => allActiveCapabilities.includes(l2))) ||
                (app.l3 && app.l3.some(l3 => allActiveCapabilities.includes(l3))) ||
                (app.l4 && app.l4.some(l4 => allActiveCapabilities.includes(l4)));
            return matchesCategory && matchesCapability;
        }).length;
        yearCounterElement.textContent = totalCount;
    }
    // Afficher l'année sélectionnée dans le petit label si présent
    if (yearLabelElement) {
        yearLabelElement.textContent = 'Active Applications ' + (window.timelineYear ? window.timelineYear : '');
    }

    // 4. Reset les couleurs
    if (typeof window.resetCountryColors === 'function') {
        window.resetCountryColors();
    }

    // 5. Coloriage capability si au moins une capability cochée
    if (allActiveCapabilities.length > 0) {
        // --- Coloration parent/variante généralisée (copié de filterAndShowMarkersByCapabilities) ---
        const selectedCapabilities = allActiveCapabilities;
        const parentNames = window.allApplications
            .filter(app => !app.parent)
            .map(app => app.name)
            .filter(parentName => window.allApplications.some(a => a.parent === parentName));
        parentNames.forEach(parentName => {
            const parentApp = window.allApplications.find(app => app.name === parentName);
            const parentCountries = parentApp && parentApp.countries ? parentApp.countries.map(c => c.trim()) : [];
            // Pour Matrix, on prend toutes les variantes (même hidden)
            let variants;
            if (parentName === "Matrix") {
                variants = window.allApplications.filter(app => app.parent === parentName && app.countries);
            } else {
                variants = window.allApplications.filter(app => app.parent === parentName && app.countries && app.hidden !== true);
            }
            // Pays où une variante (même hidden pour Matrix) couvre la capability (bleu)
            const countriesWithVariant = new Set();
            variants.forEach(variant => {
                const covers =
                    (variant.l2 && variant.l2.some(l2 => selectedCapabilities.includes(l2))) ||
                    (variant.l3 && variant.l3.some(l3 => selectedCapabilities.includes(l3))) ||
                    (variant.l4 && variant.l4.some(l4 => selectedCapabilities.includes(l4)));
                if (covers) {
                    variant.countries.forEach(c => countriesWithVariant.add(c.trim()));
                }
            });
            // Pays où le parent global couvre la capability (mais aucune variante ne couvre) => orange
            const parentGlobalCovers =
                (parentApp && (
                    (parentApp.l2 && parentApp.l2.some(l2 => selectedCapabilities.includes(l2))) ||
                    (parentApp.l3 && parentApp.l3.some(l3 => selectedCapabilities.includes(l3))) ||
                    (parentApp.l4 && parentApp.l4.some(l4 => selectedCapabilities.includes(l4)))
                ));
            // Vérifier si le parent est dans filteredApps
            const parentInFilteredApps = filteredApps.some(app => app.name === parentName);
            let countriesOrange = [];
            if (parentGlobalCovers && parentInFilteredApps) {
                countriesOrange = parentCountries.filter(c => !countriesWithVariant.has(c));
            }
            // Exclure les pays où une autre app (hors ce parent/variante) couvre la capability
            const selectedApps = window.allApplications.filter(app => {
                if (app.hidden === true) return false;
                if (app.name === parentName || app.parent === parentName) return false;
                return (
                    (app.l2 && app.l2.some(l2 => selectedCapabilities.includes(l2))) ||
                    (app.l3 && app.l3.some(l3 => selectedCapabilities.includes(l3))) ||
                    (app.l4 && app.l4.some(l4 => selectedCapabilities.includes(l4)))
                );
            });
            countriesOrange = countriesOrange.filter(countryName => {
                return !selectedApps.some(app => app.countries && app.countries.map(c => c.trim()).includes(countryName));
            });
            // Pays couverts par d'autres apps (bleu)
            const paysAvecCapability = new Set();
            countriesWithVariant.forEach(countryName => paysAvecCapability.add(countryName));
            selectedApps.forEach(app => {
                if (app.countries) app.countries.map(c => c.trim()).forEach(c => paysAvecCapability.add(c));
            });
            // Bleu : pays où une variante couvre la capability
            countriesWithVariant.forEach(countryName => {
                if (window.countryLayers && window.countryLayers[countryName]) {
                    window.countryLayers[countryName].setStyle({
                        fillColor: "#1976d2",
                        fillOpacity: 0.5,
                        color: "#1976d2",
                        weight: 2
                    });
                }
            });
            // Bleu : pays où une autre application couvre la capability
            selectedApps.forEach(app => {
                if (app.countries) {
                    app.countries.map(c => c.trim()).forEach(countryName => {
                        if (window.countryLayers && window.countryLayers[countryName]) {
                            window.countryLayers[countryName].setStyle({
                                fillColor: "#1976d2",
                                fillOpacity: 0.5,
                                color: "#1976d2",
                                weight: 2
                            });
                        }
                    });
                }
            });
            // Orange : pays où le parent global couvre mais aucune variante ne couvre
            // Désactivé : ne pas colorier ces pays
            /*
            countriesOrange.forEach(countryName => {
                if (window.countryLayers && window.countryLayers[countryName]) {
                    window.countryLayers[countryName].setStyle({
                        fillColor: "orange",
                        fillOpacity: 0.5,
                        color: "orange",
                        weight: 2
                    });
                }
            });
            */
        });
    }

    // 6. Afficher les markers sur la carte
    if (typeof window.showCountryMarkers === 'function') {
        let appsForMap = filteredApps;
        if (window.markerDisplayMode === 2) {
            // Mode 2: IT Owner: markers région + un marker centré sur Marseille
            if (typeof window.getRegionMarkers === 'function') {
                appsForMap = window.getRegionMarkers(filteredApps, window.allApplications);
            } else {
                appsForMap = [];
            }
        }
        window.showCountryMarkers(appsForMap, window.allApplications);
    }

    // Fonction pour changer le mode marker depuis le slider
    window.updateMarkerMode = function(mode) {
        window.markerDisplayMode = mode;
        if (typeof window.filterAndShowApplications === 'function') {
            window.filterAndShowApplications();
        }
    }

    // Table IT Owner -> Region (extrait de Decomm.html)
    const itOwnerToRegion = {
        'PEREIRA BRUNO': 'LATAM',
        'DEBERT, Julien': 'EUROPE',
        'BIERNACKI Scott': 'NORTAM',
        'RAUCH, Nancy, DEBERT, Julien': 'EUROPE',
        'DEBERT, Julien, Santoni Paolo': 'EUROPE',
        'Santoni Paolo': 'EUROPE',
        'BERNICOT, Marc': 'GHO',
        'Santoni Paolo, DEBERT, Julien, Rubini, Marco': 'EUROPE',
        'Habara Rudy': 'NORTAM',
        'Santoni Paolo, DEBERT, Julien, Seemann, Marco': 'EUROPE',
        'Agir Dilek, RAUCH, Nancy, DEBERT, Julien': 'EUROPE',
        'Cano Adolfo, Santoni Paolo, DEBERT, Julien': 'EUROPE',
        'VERRECCHIA, Matthieu, DEBERT, Julien': 'EUROPE',
        'Kelly Shawn': 'NORTAM',
        'POUYE Fatou, RAUCH, Nancy, DEBERT, Julien': 'EUROPE',
        'Agir Dilek, Santoni Paolo, DEBERT, Julien': 'EUROPE',
        'Rubini, Marco, Santoni Paolo, DEBERT, Julien': 'EUROPE',
        'Santoni Paolo, DEBERT, Julien, Agir Dilek': 'EUROPE',
        'Rogers, Jeff (Houston)': 'NORTAM',
        'VERRECCHIA, Matthieu': 'EUROPE',
        'Bayram, Kaan': 'EUROPE',
        'Kamal, Mohammed Maher': 'IMECA',
        'DEBERT, Julien, RAUCH, Nancy': 'EUROPE',
        'Pereira, Alex': 'LATAM',
        'Ramasamy Velu': 'APAC',
        'Seemann, Marco, Santoni Paolo, DEBERT, Julien': 'EUROPE',
        'Muro, Juan Manuel': 'GHO',
        'Wang, Bo': 'APAC',
        'Agir Dilek': 'EUROPE',
        'Santoni Paolo, DEBERT, Julien': 'EUROPE',
        'Garcia Leiser': 'NORTAM',
        'WENDLING, Patrice': 'EUROPE',
        'DEBERT, Julien, RAUCH, Nancy, PAPIN Anne': 'EUROPE',
        'Kopara Stacey': 'APAC',
        'DERRE Gael': 'GHO',
        'Heilmann Pat': 'NORTAM',
        'Pasmanik Gena': 'NORTAM',
        'PENEAUD Cyril (ADM)': 'EUROPE',
        'Yusuf Koc': 'EUROPE',
        'Yousef, Yousef Kamal': 'IMECA',
        'Rodriguez, Guillermo Gomez, Santoni Paolo, DEBERT, Julien': 'EUROPE',
        'RAUCH, Nancy, DEBERT, Julien, Forget Paul': 'EUROPE',
        'BIHR, Gerald': 'GHO',
        'POUYE Fatou, DEBERT, Julien, RAUCH, Nancy': 'EUROPE',
        'Gatiganti Ram': 'NORTAM',
        'Saruva, Sundaramoorthy': 'APAC',
        'RAUCH, Nancy': 'EUROPE',
        'Hossen Sayeed': 'IMECA',
        'Li Ye': 'NORTAM',
        'Seemann, Marco': 'EUROPE',
        'Laat Angelo de': 'GHO',
        'van Doornmalen Alois': 'EUROPE',
        'RAUCH Nancy, DEBERT, Julien': 'EUROPE',
        'Rubini, MarcoSantoni PaoloDEBERT, Julien': 'EUROPE'
    };

    function getITOwnerRegion(itOwner) {
        if (!itOwner) return null;
        return itOwnerToRegion[itOwner] || null;
    }

    // Fonction pour retourner les markers région avec counts calculés depuis filteredApps
    window.getRegionMarkers = function(filteredApps, allApps) {
        const centers = window.regionCenters || {
            nortam: [45.0, -100.0],
            europe: [55.6761, 12.5683], // Copenhagen
            apac: [15.0, 120.0],
            latam: [-15.0, -60.0],
            imeca: [24.7136, 46.6753], // Riyad
            gho: [43.2965, 5.3698] // Marseille
        };

        // Afficher la liste des applications pour une région IT Owner
        window.showAppListForRegion = function(regionName, latlng) {
            const infoPanel = document.getElementById('info-panel');
            const year = window.timelineYear ? String(window.timelineYear) : null;
            // Source: utiliser la liste complète `window.allApplications` pour inclure les apps cachées (hidden)
            let source = [];
            if (window.allApplications) {
                source = Object.values(window.allApplications).flat();
            } else if (Array.isArray(window.currentFilteredApps) && window.currentFilteredApps.length > 0) {
                // fallback si allApplications non disponible
                source = window.currentFilteredApps;
            }

            // Normaliser la région cible (ex: 'EUROPE')
            const target = String(regionName || '').toUpperCase();

            // Helper: obtenir la région à partir des champs app.it_owner ou app.regions
            function regionForApp(app) {
                if (!app) return null;
                // Priorité: mapping IT Owner
                if (typeof getITOwnerRegion === 'function') {
                    const r = getITOwnerRegion(app.it_owner);
                    if (r) return String(r).toUpperCase();
                }
                // Fallback: utiliser app.regions
                if (Array.isArray(app.regions) && app.regions.length > 0) {
                    const r = String(app.regions[0]).toLowerCase();
                    if (r.includes('nortam') || r.includes('north') || r.includes('usa') || r.includes('canada') || r.includes('mexico')) return 'NORTAM';
                    if (r.includes('latam') || r.includes('latin')) return 'LATAM';
                    if (r.includes('apac') || r.includes('asia') || r.includes('china') || r.includes('india')) return 'APAC';
                    if (r.includes('imeca') || r.includes('middle') || r.includes('africa') || r.includes('saudi')) return 'IMECA';
                    if (r.includes('gho') || r.includes('marseille')) return 'GHO';
                    return 'EUROPE';
                }
                return null;
            }

            const apps = (source || []).filter(app => {
                if (!app || !app.name) return false;
                if (app.name === 'Matrix' || app.parent === 'Matrix') return false;
                if (year && app.active_years && !app.active_years.includes(year)) return false;
                const r = regionForApp(app);
                if (!r) return false;
                return r === target;
            });

            if (!infoPanel) {
                // Fallback: open a Leaflet popup at the clicked location
                const mapInstance = window.map || null;
                if (mapInstance) {
                    const popupHtml = apps.length === 0 ? '<div>No apps</div>' : '<div><strong>' + target + '</strong><ul>' + apps.map(a => '<li>' + (a.name || '') + '</li>').join('') + '</ul></div>';
                    L.popup({ maxWidth: 400 }).setLatLng(latlng).setContent(popupHtml).openOn(mapInstance);
                }
                return;
            }

            if (apps.length === 0) {
                infoPanel.innerHTML = `<div style="padding:12px; color:#666;">Aucune application trouvée pour ${target}</div>`;
                return;
            }

            // Grouper par catégorie pour affichage similaire à showCountryApps
            const grouped = {};
            apps.forEach(a => {
                const cat = a.category || 'Autre';
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(a);
            });

            let html = `<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                <div style="font-weight:bold; font-size:1.1em;">${target} — ${apps.length} applications</div>
                <div></div>
            </div>`;

            Object.keys(grouped).sort().forEach(cat => {
                html += `<div style="margin-bottom:10px;"><span style="font-weight:bold;">${cat} (${grouped[cat].length})</span><br>`;
                html += grouped[cat].map(a => `<div class="sidebar-item" data-name="${a.name}" style="margin-left:10px; cursor:pointer; text-decoration:underline;">${a.name}</div>`).join('');
                html += `</div>`;
            });

            infoPanel.innerHTML = html;
            // Attacher les événements de clic pour afficher les détails d'une application
            setTimeout(() => {
                const items = infoPanel.querySelectorAll('.sidebar-item');
                items.forEach(el => {
                    el.onclick = function() {
                        const name = this.getAttribute('data-name');
                        const appData = (window.allApplications ? Object.values(window.allApplications).flat() : []).find(x => x.name === name) || {};
                        if (typeof window.displayApplicationCapabilities === 'function') {
                            window.displayApplicationCapabilities(name, appData);
                        }
                    };
                });
            }, 20);
        };

        const keys = ['NORTAM','EUROPE','APAC','LATAM','IMECA','GHO'];
        const counts = { NORTAM:0, EUROPE:0, APAC:0, LATAM:0, IMECA:0, GHO:0 };
        const year = window.timelineYear ? String(window.timelineYear) : null;

        // Use a set to avoid double-counting app variants
        const counted = new Set();

        // First count items present in filteredApps (excluding Matrix parent itself)
        (filteredApps || []).forEach(app => {
            if (!app || !app.name) return;
            if (year && app.active_years && !app.active_years.includes(year)) return;
            if (app.name === 'Matrix') {
                // We'll handle Matrix variants from the global list later
                return;
            }

            // If this is a Matrix variant, still count it (it may be visible in filteredApps)
            const name = app.name;
            if (counted.has(name)) return;

            const regionFromOwner = getITOwnerRegion(app.it_owner);
            if (regionFromOwner && counts.hasOwnProperty(regionFromOwner)) {
                counts[regionFromOwner]++;
                counted.add(name);
                return;
            }

            if (Array.isArray(app.regions) && app.regions.length > 0) {
                const r = String(app.regions[0]).toLowerCase();
                if (r.includes('nortam') || r.includes('north') || r.includes('usa') || r.includes('canada') || r.includes('mexico')) counts.NORTAM++;
                else if (r.includes('latam') || r.includes('latin')) counts.LATAM++;
                else if (r.includes('apac') || r.includes('asia') || r.includes('china') || r.includes('india')) counts.APAC++;
                else if (r.includes('imeca') || r.includes('middle') || r.includes('africa') || r.includes('saudi') ) counts.IMECA++;
                else counts.EUROPE++;
                counted.add(name);
                return;
            }

            counts.EUROPE++;
            counted.add(name);
        });

        // Ensure Matrix variants (including hidden) are counted: scan global allApplications for parent === 'Matrix'
        const allAppsFlat = window.allApplications ? Object.values(window.allApplications).flat() : [];
        const matrixVariants = allAppsFlat.filter(a => a && a.parent === 'Matrix');
        matrixVariants.forEach(v => {
            if (!v || !v.name) return;
            if (counted.has(v.name)) return; // already counted above
            if (year && v.active_years && !v.active_years.includes(year)) return;

            const regionFromOwner = getITOwnerRegion(v.it_owner);
            if (regionFromOwner && counts.hasOwnProperty(regionFromOwner)) {
                counts[regionFromOwner]++;
                counted.add(v.name);
                return;
            }
            if (Array.isArray(v.regions) && v.regions.length > 0) {
                const r = String(v.regions[0]).toLowerCase();
                if (r.includes('nortam') || r.includes('north') || r.includes('usa') || r.includes('canada') || r.includes('mexico')) counts.NORTAM++;
                else if (r.includes('latam') || r.includes('latin')) counts.LATAM++;
                else if (r.includes('apac') || r.includes('asia') || r.includes('china') || r.includes('india')) counts.APAC++;
                else if (r.includes('imeca') || r.includes('middle') || r.includes('africa') || r.includes('saudi') ) counts.IMECA++;
                else counts.EUROPE++;
                counted.add(v.name);
                return;
            }
            counts.EUROPE++;
            counted.add(v.name);
        });

        const markers = keys.map(k => {
            const keyLower = k.toLowerCase();
            const c = centers[keyLower] || [0,0];
            return { name: k, lat: c[0], lng: c[1], count: counts[k], icon: 'red' };
        });
        return markers;
    }
    // 7. Afficher la liste dans la sidebar
    if (typeof window.displayCategoryFilteredApplications === 'function') {
        window.displayCategoryFilteredApplications(filteredApps, checkedCategories);
    }

    // Synchroniser le panneau info pays si un marker est sélectionné
    if (window.selectedCountryName && typeof window.showCountryApps === 'function') {
        const filteredCountryApps = filteredApps.filter(app =>
            app.countries && app.countries.includes(window.selectedCountryName)
        );
        window.showCountryApps(window.selectedCountryName, filteredCountryApps, window.allApplications);
    }
}
window.filterAndShowApplications = filterAndShowApplications;
