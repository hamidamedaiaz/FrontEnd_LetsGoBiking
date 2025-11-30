/**
 * ✨ MapService - Style Google Maps avec segments COLORÉS précis
 */
class MapService {
    constructor() {
        this.map = null;
        this.markers = {
            origin: null,
            destination: null,
            stations: []
        };
        this.polylines = [];
    }

    /**
     * Initialise la carte
     */
    initMap(lat = 43.7102, lon = 7.2620, zoom = 13) {
        this.map = L.map('map', {
            attributionControl: true
        }).setView([lat, lon], zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OSM',
            maxZoom: 19
        }).addTo(this.map);

        // Repositionner et styliser l'attribution
        this.map.attributionControl.setPrefix('');

        console.log('🗺️ Carte initialisée');
    }

    /**
     * ✅ Ajoute marker origine (style Google Maps)
     */
    addOriginMarker(lat, lon, name) {
        if (this.markers.origin) {
            this.map.removeLayer(this.markers.origin);
        }

        const icon = L.divIcon({
            className: 'custom-marker-origin',
            html: `<div style="background: #4285F4; color: white; width: 32px; height: 32px; 
                   border-radius: 50% 50% 50% 0; transform: rotate(-45deg); 
                   display: flex; align-items: center; justify-content: center;
                   border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                   <span style="transform: rotate(45deg); font-weight: bold;">A</span>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        this.markers.origin = L.marker([lat, lon], { icon })
            .addTo(this.map)
            .bindPopup(`<div style="font-family: Arial; padding: 8px;">
                <strong style="color: #4285F4;">🏁 Départ</strong><br>
                <span style="font-size: 0.9em; color: #666;">${name}</span>
            </div>`);

        console.log('📍 Marker origine ajouté:', lat, lon);
    }

    /**
     * ✅ Ajoute marker destination (style Google Maps)
     */
    addDestinationMarker(lat, lon, name) {
        if (this.markers.destination) {
            this.map.removeLayer(this.markers.destination);
        }

        const icon = L.divIcon({
            className: 'custom-marker-dest',
            html: `<div style="background: #EA4335; color: white; width: 32px; height: 32px; 
                   border-radius: 50% 50% 50% 0; transform: rotate(-45deg); 
                   display: flex; align-items: center; justify-content: center;
                   border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                   <span style="transform: rotate(45deg); font-weight: bold;">B</span>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        this.markers.destination = L.marker([lat, lon], { icon })
            .addTo(this.map)
            .bindPopup(`<div style="font-family: Arial; padding: 8px;">
                <strong style="color: #EA4335;">🎯 Arrivée</strong><br>
                <span style="font-size: 0.9em; color: #666;">${name}</span>
            </div>`);

        console.log('📍 Marker destination ajouté:', lat, lon);
    }

    /**
     * ✅ Ajoute marker station avec infos
     */
    addStationMarker(lat, lon, stationData, type) {
        const isStart = type === 'start';
        const color = isStart ? '#10b981' : '#f59e0b';
        const emoji = isStart ? '🚲' : '🚲';
        const label = isStart ? '🚲 Prendre vélo' : '🚲 Déposer vélo';

        console.log(`   🎯 Création marker ${type} à [${lat}, ${lon}]`);

        const icon = L.divIcon({
            className: `station-marker-${type}`,
            html: `<div style="
                background: ${color}; 
                color: white; 
                width: 36px; 
                height: 36px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                border: 4px solid white; 
                box-shadow: 0 3px 10px rgba(0,0,0,0.4); 
                font-size: 18px;
                font-weight: bold;
                z-index: 1000;
            ">${emoji}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
        });

        const marker = L.marker([lat, lon], {
            icon: icon,
            zIndexOffset: 1000
        })
        .addTo(this.map)
        .bindPopup(`
            <div style="font-family: Arial, sans-serif; padding: 10px; min-width: 200px;">
                <strong style="color: ${color}; font-size: 1.1em;">${label}</strong><br>
                <div style="margin-top: 8px; color: #666;">
                    ${stationData.name}
                </div>
            </div>
        `);

        this.markers.stations.push(marker);
        console.log(`   ✅ Marker ${type} ajouté avec succès à la carte`);

        return marker;
    }


    displayItinerary(data) {
        console.log('🗺️ === AFFICHAGE ITINÉRAIRE ===');
        console.log('Data reçue:', data);

        this.clearRoutes();
        this.clearStations();

        if (!data.Steps || data.Steps.length === 0) {
            console.error('❌ Aucun step reçu');
            return;
        }

        let previousEndPoint = null;

        // ✅ NOUVELLE LOGIQUE : Analyser TOUS les steps pour identifier les stations
        const stationMarkers = this.identifyStationPositions(data.Steps);

        // ✅ Afficher les marqueurs de stations AVANT de tracer les routes
        stationMarkers.forEach(marker => {
            this.addStationMarker(
                marker.lat,
                marker.lon,
                {
                    name: marker.label,
                    bikes: '?',
                    stands: '?'
                },
                marker.type
            );
        });

        // ✅ TRACER CHAQUE STEP AVEC SES PROPRES COORDONNÉES
        data.Steps.forEach((step, index) => {
            console.log(`📍 Step ${index + 1}/${data.Steps.length}: ${step.type}`);

            if (!step.Coordinates || step.Coordinates.length < 2) {
                console.warn(`⚠️ Step ${index + 1} n'a pas assez de coordonnées`);
                return;
            }

            // Convertir [lon, lat] → [lat, lon] pour Leaflet
            let coords = step.Coordinates.map(c => [c[1], c[0]]);

            const currType = step.type.toLowerCase();
            const prevType = index > 0 ? data.Steps[index - 1].type.toLowerCase() : null;

            // ✅ CONNECTER au segment précédent SEULEMENT si pas de transition bike→walk ou walk→bike
            const isTransition = (prevType === 'bike' && currType === 'walk') ||
                (prevType === 'walk' && currType === 'bike');

            if (previousEndPoint && index > 0 && !isTransition) {
                const firstPoint = coords[0];
                const distance = Math.sqrt(
                    Math.pow(firstPoint[0] - previousEndPoint[0], 2) +
                    Math.pow(firstPoint[1] - previousEndPoint[1], 2)
                );

                if (distance < 0.001) {
                    coords[0] = previousEndPoint;
                    console.log(`  🔗 Segment connecté au précédent`);
                }
            }

            console.log(`  → ${coords.length} points pour ce segment`);

            // ✅ TRACER SELON LE TYPE
            if (currType === 'bike') {
                this.drawRoute(coords, '#10b981', 6, null, `🚴 ${step.instruction}`);
            } else {
                this.drawRoute(coords, '#f59e0b', 5, '10, 5', `🚶 ${step.instruction}`);
            }

            previousEndPoint = coords[coords.length - 1];
        });

        this.fitBounds();
        console.log('✅ Affichage terminé');
    }

    /**
     * ✅ NOUVELLE MÉTHODE : Identifie toutes les positions de stations à marquer
     */
    identifyStationPositions(steps) {
        const markers = [];

        for (let i = 0; i < steps.length; i++) {
            const currStep = steps[i];
            const prevStep = i > 0 ? steps[i - 1] : null;
            const nextStep = i < steps.length - 1 ? steps[i + 1] : null;

            const currType = currStep.type.toLowerCase();
            const prevType = prevStep ? prevStep.type.toLowerCase() : null;
            const nextType = nextStep ? nextStep.type.toLowerCase() : null;

            // ✅ CAS 1 : Transition WALK → BIKE (prendre vélo)
            if (prevType === 'walk' && currType === 'bike') {
                const [lon, lat] = currStep.Coordinates[0];
                markers.push({
                    lat: lat,
                    lon: lon,
                    type: 'start',
                    label: `Prendre vélo - Étape ${i + 1}`,
                    stepIndex: i
                });
                console.log(`  🚲 Station PRENDRE VÉLO détectée à l'étape ${i + 1}`);
            }

            // ✅ CAS 2 : Transition BIKE → WALK (déposer vélo)
            if (currType === 'bike' && nextType === 'walk') {
                const coords = currStep.Coordinates;
                const [lon, lat] = coords[coords.length - 1];
                markers.push({
                    lat: lat,
                    lon: lon,
                    type: 'end',
                    label: `Déposer vélo - Étape ${i + 1}`,
                    stepIndex: i
                });
                console.log(`  🅿️ Station DÉPOSER VÉLO détectée à l'étape ${i + 1}`);
            }

            // ✅ CAS 3 : Premier segment est BIKE (cas rare mais possible)
            if (i === 0 && currType === 'bike') {
                const [lon, lat] = currStep.Coordinates[0];
                markers.push({
                    lat: lat,
                    lon: lon,
                    type: 'start',
                    label: `Départ à vélo`,
                    stepIndex: i
                });
                console.log(`  🚲 Départ direct à vélo détecté`);
            }

            // ✅ CAS 4 : Dernier segment est BIKE (déposer à la fin)
            if (i === steps.length - 1 && currType === 'bike') {
                const coords = currStep.Coordinates;
                const [lon, lat] = coords[coords.length - 1];
                markers.push({
                    lat: lat,
                    lon: lon,
                    type: 'end',
                    label: `Arrivée à vélo`,
                    stepIndex: i
                });
                console.log(`  🅿️ Arrivée directe à vélo détectée`);
            }
        }

        // ✅ Dédupliquer les marqueurs proches (< 10m)
        const deduplicated = [];
        markers.forEach(marker => {
            const isDuplicate = deduplicated.some(existing => {
                const dist = Math.sqrt(
                    Math.pow(existing.lat - marker.lat, 2) +
                    Math.pow(existing.lon - marker.lon, 2)
                ) * 111000; // Approximation en mètres

                return dist < 10;
            });

            if (!isDuplicate) {
                deduplicated.push(marker);
            } else {
                console.log(`  ⚠️ Marqueur dupliqué ignoré: ${marker.label}`);
            }
        });

        console.log(`✅ ${deduplicated.length} marqueurs de stations identifiés`);
        return deduplicated;
    }
    /**
     * ✅ Dessine une route COLORÉE avec tooltip
     */
    drawRoute(coordinates, color, weight, dashArray = null, tooltip = null) {
        if (!coordinates || coordinates.length < 2) {
            console.warn('⚠️ Pas assez de coordonnées');
            return null;
        }

        const polyline = L.polyline(coordinates, {
            color: color,           // ← COULEUR APPLIQUÉE ICI !
            weight: weight,
            opacity: 0.85,
            dashArray: dashArray,   // ← POINTILLÉ ICI !
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(this.map);

        if (tooltip) {
            polyline.bindTooltip(tooltip, {
                permanent: false,
                direction: 'top',
                offset: [0, -10]
            });
        }

        this.polylines.push(polyline);
        console.log(`🛣️ Route tracée: ${color}, ${coordinates.length} points`);
        return polyline;
    }

    /**
     * ✅ Ajuste la vue
     */
    fitBounds() {
        const bounds = L.latLngBounds();

        if (this.markers.origin) bounds.extend(this.markers.origin.getLatLng());
        if (this.markers.destination) bounds.extend(this.markers.destination.getLatLng());

        this.markers.stations.forEach(marker => {
            if (marker) bounds.extend(marker.getLatLng());
        });

        this.polylines.forEach(polyline => {
            if (polyline && polyline.getBounds) {
                bounds.extend(polyline.getBounds());
            }
        });

        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [80, 80] });
            console.log('🎯 Vue ajustée');
        }
    }

    /**
     * Nettoie les routes
     */
    clearRoutes() {
        this.polylines.forEach(p => this.map.removeLayer(p));
        this.polylines = [];
    }

    /**
     * Nettoie les stations
     */
    clearStations() {
        this.markers.stations.forEach(m => this.map.removeLayer(m));
        this.markers.stations = [];
    }

    /**
     * Nettoie tout
     */
    clearAll() {
        if (this.markers.origin) {
            this.map.removeLayer(this.markers.origin);
            this.markers.origin = null;
        }
        if (this.markers.destination) {
            this.map.removeLayer(this.markers.destination);
            this.markers.destination = null;
        }
        this.clearRoutes();
        this.clearStations();
        console.log('🧹 Carte nettoyée');
    }

    /**
     * Centre la carte
     */
    centerMap(lat, lon, zoom = 13) {
        this.map.setView([lat, lon], zoom);
    }
}

export default MapService;
