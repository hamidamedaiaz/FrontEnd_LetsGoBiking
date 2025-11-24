import AddressAutocomplete from '../autocomplete.js';
import APIService from '../services/apiService.js';
import MapService from '../services/mapService.js';

class ItineraryPage {

    constructor() {
        this.mapService = null;
        this.originAutocomplete = null;
        this.destinationAutocomplete = null;

        this.init();
    }

    async init() {

        this.mapService = new MapService();
        this.mapService.initMap();

        this.originAutocomplete = new AddressAutocomplete('originInput', 'origin-results');
        this.destinationAutocomplete = new AddressAutocomplete('destinationInput', 'destination-results');

        this.initEvents();
    }

    initEvents() {

        document.getElementById('calculateBtn')
            .addEventListener('click', () => this.calculateRoute());

        document.getElementById('originInput')
            .addEventListener('addressSelected', (e) => {
                const c = e.detail.coordinates;
                this.mapService.addOriginMarker(c[1], c[0], e.detail.label);
            });

        document.getElementById('destinationInput')
            .addEventListener('addressSelected', (e) => {
                const c = e.detail.coordinates;
                this.mapService.addDestinationMarker(c[1], c[0], e.detail.label);
            });
    }

    async calculateRoute() {
        const origin = this.originAutocomplete.getSelectedAddress();
        const destination = this.destinationAutocomplete.getSelectedAddress();

        if (!origin || !destination) {
            alert("Choisir une origine et une destination.");
            return;
        }

        // Afficher loading
        document.getElementById('loading').style.display = 'block';
        document.getElementById('resultsContainer').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'none';

        try {
            const result = await APIService.calculateItinerary(
                origin.coordinates[1],
                origin.coordinates[0],
                destination.coordinates[1],
                destination.coordinates[0]
            );

            console.log("📊 Résultat reçu:", result);

            // Masquer loading
            document.getElementById('loading').style.display = 'none';

            this.displayResults(result);
            this.mapService.displayItinerary(result);

        } catch (err) {
            console.error("❌ Erreur:", err);
            
            // Afficher erreur
            document.getElementById('loading').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorText').textContent = err.message;
        }
    }

    displayResults(data) {

        const summaryDiv = document.getElementById('summary');
        const stepsDiv = document.getElementById('steps');

        // Construire le texte du mode
        const types = Array.from(new Set((data.Steps || []).map(s => (s.type || '').toLowerCase())));
        const mapLabel = {
            'bike': '🚴 Vélo',
            'walk': '🚶 Marche'
        };
        const modeText = types.length > 0
            ? types.map(t => mapLabel[t] || t).join(' + ')
            : '—';

        // Afficher résumé
        summaryDiv.innerHTML = `
            <div class="summary-item">
                <i class="fas fa-route"></i>
                <span><strong>Distance :</strong> ${(data.TotalDistance / 1000).toFixed(2)} km</span>
            </div>
            <div class="summary-item">
                <i class="fas fa-clock"></i>
                <span><strong>Durée :</strong> ${Math.round(data.TotalDuration / 60)} min</span>
            </div>
            <div class="summary-item">
                <i class="fas fa-bicycle"></i>
                <span><strong>Mode :</strong> ${modeText}</span>
            </div>
        `;

        // Afficher steps
        stepsDiv.innerHTML = "";
        data.Steps.forEach((step) => {

            const isWalk = step.type.toLowerCase() === "walk";
            const icon = isWalk ? "fa-walking" : "fa-bicycle";
            const stepClass = isWalk ? "walk" : "bike";

            const div = document.createElement('div');
            div.className = 'step-item';

            div.innerHTML = `
                <div class="step-icon ${stepClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="step-content">
                    <p>${step.instruction}</p>
                    <small>
                        ${Math.round(step.distance)} m · ${Math.round(step.duration / 60)} min
                    </small>
                </div>
            `;

            stepsDiv.appendChild(div);
        });

        document.getElementById('resultsContainer').style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", () => new ItineraryPage());

export default ItineraryPage;
