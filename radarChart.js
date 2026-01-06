// radarChart.js
// Utilitaire pour afficher un radar chart (graphe en toile d'araignée) pour le comparateur d'applications
// Utilise Chart.js (https://www.chartjs.org/)

// Nécessite d'inclure Chart.js dans index.html :
// <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

/**
 * Affiche un radar chart dans un conteneur donné
 * @param {string} containerId - id du canvas ou div où afficher le graphe
 * @param {string[]} labels - Labels des axes (ex: capabilities)
 * @param {Array<{label: string, data: number[], color: string}>} datasets - Données à comparer
 * @param {string} [title] - Titre du graphe
 */
function renderRadarChart(containerId, labels, datasets, title) {
    const ctx = document.getElementById(containerId).getContext('2d');
    if (!ctx) return;
    // Détruire l'ancien graphe si présent
    if (window._radarChartInstance) {
        window._radarChartInstance.destroy();
    }
    window._radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: datasets.map(ds => ({
                label: ds.label,
                data: ds.data,
                fill: true,
                backgroundColor: ds.color + '33', // transparence
                borderColor: ds.color,
                pointBackgroundColor: ds.color,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: ds.color
            }))
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: !!title, text: title || '' }
            },
            scales: {
                r: {
                    angleLines: { display: true },
                    suggestedMin: 0,
                    suggestedMax: 5
                }
            }
        }
    });
}

/**
 * Récupère l'index de l'axe cliqué sur le radar chart
 * @param {MouseEvent} evt - L'événement de clic
 * @returns {number|null} - L'index de l'axe cliqué ou null si aucun
 */
function getRadarAxisIndexFromClick(evt) {
    if (!window._radarChartInstance) return null;
    const points = window._radarChartInstance.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    if (points.length) {
        return points[0].index;
    }
    return null;
}

// Export global
window.renderRadarChart = renderRadarChart;
window.getRadarAxisIndexFromClick = getRadarAxisIndexFromClick;
