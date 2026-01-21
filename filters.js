
// Variable globale stockant l'année sélectionnée dans le curseur
// Par défaut on positionne sur 2025 (slider value 0 → 2025)
window.timelineYear = 2025;

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

        // initialize visual offset based on current value
        try {
            const initialV = parseInt(timelineSlider.value, 10);
            adjustSliderOffset(timelineSlider, isNaN(initialV) ? 0 : initialV);
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
    let appTitle = `📋 Capabilities of ${appName}`;
    // Code spécifique à Matrix pour afficher le pays ou la région sélectionnée
    if (appName === 'Matrix') {
        let selectedCountry = window.selectedCountryName;
        let selectedRegion = window.selectedRegionName;
        if (selectedCountry && appData.countries && appData.countries.includes(selectedCountry)) {
            appTitle = `📋 Capabilities of Matrix ${selectedCountry}`;
        } else if (selectedRegion && appData.regions && appData.regions.includes(selectedRegion)) {
            appTitle = `📋 Capabilities of Matrix ${selectedRegion}`;
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
        <!-- Search bar (permanent) -->
        <div style="margin-bottom: 10px;">
            <input type="text" id="search-input" placeholder="🔍 Search for an application..." style="width: 100%; padding: 10px 12px; border: 2px solid #ff6f00; border-radius: 6px; font-size: 14px; box-sizing: border-box; background: white; transition: border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='#ef6c00'; this.style.boxShadow='0 0 0 3px rgba(255,111,0,0.1)'" onblur="this.style.borderColor='#ff6f00'; this.style.boxShadow='none'">
        </div>
        <div style="margin-bottom: 15px;">
            <button onclick="showAllApplicationsAndRecolor()" class="back-button" style="margin-bottom: 8px;">← Back</button>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 class="app-title">${appTitle}</h3>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${biaButtonHTML}
                    <button id="open-comparator-btn" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 6px 12px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: bold;
                        display: inline-block;
                        transition: all 0.2s ease;
                    " title="Assessment">⚖️ Assessment</button>
                </div>
            </div>
        </div>
    `;
    if (appCapabilities.length > 0) {
        const l1Groups = {};
        appCapabilities.forEach(cap => {
            if (!l1Groups[cap.l1_name]) l1Groups[cap.l1_name] = {};
            if (!l1Groups[cap.l1_name][cap.l2_name]) l1Groups[cap.l1_name][cap.l2_name] = [];
            l1Groups[cap.l1_name][cap.l2_name].push(cap);
        });
        Object.keys(l1Groups).forEach(l1Id => {
            let l1Display = (typeof bcL4Definitions !== 'undefined' && bcL4Definitions.L1 && bcL4Definitions.L1[l1Id])
                ? bcL4Definitions.L1[l1Id]
                : (capabilities?.L1?.[l1Id] || l1Id);
            capabilitiesHTML += `<div><h3 class="l1-capability">${l1Display}</h3>`;
            Object.keys(l1Groups[l1Id]).forEach(l2Id => {
                let l2Display = (typeof bcL4Definitions !== 'undefined' && bcL4Definitions.L2 && bcL4Definitions.L2[l2Id])
                    ? bcL4Definitions.L2[l2Id]
                    : (capabilities?.L2?.[l2Id] || l2Id);
                capabilitiesHTML += `<h4 class="l2-title">${l2Display}</h4><ul class="l3-list">`;
                l1Groups[l1Id][l2Id].forEach(cap => {
                    if (cap.l3_name) {
                        const l4Blocks = createL4BlocksFromUnified(cap.id, appL4List, appName);
                        capabilitiesHTML += `
                            <li class="l3-item">
                                <span class="l3-name">${cap.l3_name}</span>
                                <span class="l4-blocks">${l4Blocks}</span>
                            </li>
                        `;
                    }
                });
                capabilitiesHTML += `</ul>`;
            });
            capabilitiesHTML += `</div>`;
        });
    } else {
        capabilitiesHTML += `<p>Aucune capability trouvée pour cette application.</p>`;
    }
    infoPanel.innerHTML = capabilitiesHTML;
    // Adapter le comportement du bouton pour ouvrir comparateur.html avec l'application sélectionnée pré-remplie
    const assessmentBtn = document.getElementById('open-comparator-btn');
    if (assessmentBtn) {
        assessmentBtn.onclick = function() {
            // Ouvre le comparateur avec l'application sélectionnée en app1 et app2 vide (mode remove)
            const url = `comparateur.html?app1=${encodeURIComponent(appName)}&app2=`;
            window.open(url, '_blank');
        };
    }
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
        "Digital Forwarding", "YMS", "Warehouse Management Systems (WMS)", "Customer Relationship Management (CRM)", "Order Management System (OMS)", "Last Mile Distribution",
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

    // Mettre à jour le compteur d'applications par année (INCLUANT les hidden)
    const yearCounterElement = document.getElementById('year-app-count');
    const yearDisplayElement = document.getElementById('year-display');
    const yearLabelElement = document.getElementById('year-app-label');
    if (yearCounterElement) {
        // Compter directement depuis allApplications pour avoir un compte précis
        let totalCount = 0;
        if (window.timelineYear) {
            totalCount = window.allApplications.filter(app => {
                // Exclure Matrix (car c'est la fusion de ses variantes)
                if (app.name === 'Matrix') return false;
                
                // Filtre par année
                if (!app.active_years || !app.active_years.includes(window.timelineYear.toString())) return false;
                
                // Vérifier si l'app correspond aux filtres (catégories et capabilities)
                const matchesCategory = checkedCategories.length === 0 || checkedCategories.includes(app.category);
                const matchesCapability = allActiveCapabilities.length === 0 || 
                    (app.l2 && app.l2.some(l2 => allActiveCapabilities.includes(l2))) ||
                    (app.l3 && app.l3.some(l3 => allActiveCapabilities.includes(l3))) ||
                    (app.l4 && app.l4.some(l4 => allActiveCapabilities.includes(l4)));
                
                return matchesCategory && matchesCapability;
            }).length;
        }
        yearCounterElement.textContent = totalCount;
    }
    if (yearDisplayElement && window.timelineYear) {
        yearDisplayElement.textContent = `Year ${window.timelineYear}`;
    }
    if (yearLabelElement && window.timelineYear) {
        // Changer le label selon l'année
        if (window.timelineYear >= 2027) {
            yearLabelElement.textContent = 'Planned Applications';
        } else {
            yearLabelElement.textContent = 'Active Applications';
        }
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
        window.showCountryMarkers(filteredApps, window.allApplications);
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
