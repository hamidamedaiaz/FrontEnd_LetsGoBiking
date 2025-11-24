/**
 * ✨ Service API - VERSION FINALE CORRECTE
 * Communication avec backend C# WCF REST
 */

const API_CONFIG = {
    BASE_URL: 'http://localhost:8733/RoutingService',
    TIMEOUT: 30000
};

class APIService {

    static async calculateItinerary(originLat, originLon, destLat, destLon) {
        try {
            const originCity = await this.getCityFromCoords(originLat, originLon);
            const destCity = await this.getCityFromCoords(destLat, destLon);

            const url =
                `${API_CONFIG.BASE_URL}/itinerary?originLat=${originLat}` +
                `&originLon=${originLon}` +
                `&originCity=${encodeURIComponent(originCity)}` +
                `&destLat=${destLat}` +
                `&destLon=${destLon}` +
                `&destCity=${encodeURIComponent(destCity)}`;

            console.log('➡️ API request URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('❌ API response not OK', response.status, text);
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const raw = await response.json();

            console.log('═══════════════════════════════════════');
            console.log('📦 Réponse backend reçue');
            
            if (!raw.Success) {
                throw new Error(raw.Message);
            }

            return this.transformWCFResponse(raw, originLat, originLon, destLat, destLon);

        } catch (err) {
            console.error("❌ API error:", err);
            throw err;
        }
    }

    /**
     * ✅ TRANSFORMATION CORRECTE - Conserve les Coordinates
     */
    static transformWCFResponse(raw, originLat, originLon, destLat, destLon) {
        
        const data = raw.Data;

        console.log('🔄 Transformation...');
        console.log('Steps reçus:', data.Steps?.length || 0);

        // ✅ IMPORTANT : Conserver les Coordinates de chaque step !
        const transformedSteps = data.Steps.map((s, index) => {
            const step = {
                type: s.Type,
                instruction: s.Instructions,
                distance: s.Distance,
                duration: s.Duration,
                Coordinates: s.Coordinates || []  // ✅ CRITIQUE !
            };

            if (index < 3) {
                console.log(`  Step ${index + 1}: ${step.type} - ${step.Coordinates.length} coords`);
            }

            return step;
        });

        const withCoords = transformedSteps.filter(s => s.Coordinates && s.Coordinates.length > 0).length;
        console.log(`✅ ${withCoords}/${transformedSteps.length} steps ont des coordonnées`);
        console.log('═══════════════════════════════════════');

        return {
            Success: true,
            UseBike: raw.Message === "bike",
            TotalDistance: data.TotalDistance,
            TotalDuration: data.TotalDuration,

            Geometry: data.Geometry,
            Steps: transformedSteps,  // ✅ Avec Coordinates !

            Origin: { Latitude: originLat, Longitude: originLon },
            Destination: { Latitude: destLat, Longitude: destLon }
        };
    }

    /**
     * Reverse geocoding
     */
    static async getCityFromCoords(lat, lon) {
        try {
            const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`);
            const data = await res.json();

            if (data.features?.length > 0) {
                return data.features[0].properties.city || "Unknown";
            }
        } catch { }

        return "Unknown";
    }

    static async testConnection() {
        try {
            const testUrl =
                `${API_CONFIG.BASE_URL}/itinerary?originLat=43.7102&originLon=7.2620&originCity=Nice` +
                `&destLat=43.7150&destLon=7.2700&destCity=Nice`;

            const res = await fetch(testUrl);
            return res.ok;

        } catch {
            return false;
        }
    }
}

export default APIService;
