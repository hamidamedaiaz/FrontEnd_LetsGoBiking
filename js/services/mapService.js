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
        const color = type === 'start' ? '#10b981' : '#f59e0b';
        const label = type === 'start' ? '🚲 Prendre vélo' : '🅿️ Déposer vélo';

        const icon = L.divIcon({
            className: 'station-marker',
            html: `<div style="background: ${color}; color: white; width: 28px; height: 28px; 
                   border-radius: 50%; display: flex; align-items: center; justify-content: center;
                   border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 14px;">
                   <i class="fas fa-bicycle"></i>
                   </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28]
        });

        const marker = L.marker([lat, lon], { icon })
            .addTo(this.map)
            .bindPopup(`
                <div style="font-family: Arial; padding: 10px; min-width: 200px;">
                    <strong style="color: ${color};">${label}</strong><br>
                    <strong>${stationData.name}</strong><br>
                    <hr style="margin: 8px 0;">
                    <div style="display: flex; gap: 15px; font-size: 0.9em;">
                        <div>
                            <i class="fas fa-bicycle" style="color: #10b981;"></i>
                            <strong>${stationData.bikes}</strong> vélos
                        </div>
                        <div>
                            <i class="fas fa-parking" style="color: #3498db;"></i>
                            <strong>${stationData.stands}</strong> places
                        </div>
                    </div>
                </div>
            `);

        this.markers.stations.push(marker);
        console.log(`🚲 Station ${type} ajoutée:`, stationData.name);
    }

    /**
     * ✅ MÉTHODE PRINCIPALE - Affiche l'itinéraire avec COORDONNÉES PAR STEP
     */
    displayItinerary(data) {
        console.log('🗺️ === AFFICHAGE ITINÉRAIRE ===');
        console.log('Data reçue:', data);

        this.clearRoutes();
        this.clearStations();

        if (!data.Steps || data.Steps.length === 0) {
            console.error('❌ Aucun step reçu');
            return;
        }

        // ✅ TRACER CHAQUE STEP AVEC SES PROPRES COORDONNÉES
        data.Steps.forEach((step, index) => {
            console.log(`📍 Step ${index + 1}/${data.Steps.length}: ${step.type}`);

            if (!step.Coordinates || step.Coordinates.length < 2) {
                console.warn(`⚠️ Step ${index + 1} n'a pas assez de coordonnées`);
                return;
            }

            // Convertir [lon, lat] → [lat, lon] pour Leaflet
            const coords = step.Coordinates.map(c => [c[1], c[0]]);

            console.log(`  → ${coords.length} points pour ce segment`);

            // ✅ TRACER SELON LE TYPE AVEC LES BONNES COULEURS
            if (step.type.toLowerCase() === 'bike') {
                // 🚴 VÉLO = VERT PLEIN
                this.drawRoute(coords, '#10b981', 6, null, `🚴 ${step.instruction}`);
            } else {
                // 🚶 MARCHE = ORANGE POINTILLÉ
                this.drawRoute(coords, '#f59e0b', 5, '10, 5', `🚶 ${step.instruction}`);
            }

            // ✅ Ajouter marker de station si transition
            if (index > 0) {
                const prevType = data.Steps[index - 1].type.toLowerCase();
                const currType = step.type.toLowerCase();

                // Transition walk → bike = prendre vélo
                if (prevType === 'walk' && currType === 'bike') {
                    const [lat, lon] = coords[0];
                    this.addStationMarker(lat, lon, {
                        name: 'Station de départ',
                        bikes: '?',
                        stands: '?'
                    }, 'start');
                }

                // Transition bike → walk = déposer vélo
                if (prevType === 'bike' && currType === 'walk') {
                    const [lat, lon] = coords[0];
                    this.addStationMarker(lat, lon, {
                        name: 'Station d\'arrivée',
                        bikes: '?',
                        stands: '?'
                    }, 'end');
                }
            }
        });

        this.fitBounds();
        console.log('✅ Affichage terminé');
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
