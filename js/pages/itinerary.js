import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import AddressAutocomplete from '../autocomplete.js';
import APIService from '../services/apiService.js';
import MapService from '../services/mapService.js';
import NotificationService from '../services/notificationService.js';

// === INITIALISATION DES COMPOSANTS ===
initHeader('itinerary');
initFooter();

// === SERVICE DE NOTIFICATIONS ===
const notificationService = new NotificationService();
notificationService.connect();

// Initialiser l'UI des notifications
initNotificationsUI();

// === BURGER MENU ===
setTimeout(() => {
    const burgerMenu = document.querySelector('.burger-menu');
    const mobileSidebar = document.querySelector('.mobile-sidebar');
    const overlay = document.querySelector('.overlay');
    let menuOpen = false;

    function openMenu() {
        burgerMenu.classList.add('active');
        mobileSidebar.classList.add('active');
        overlay.classList.add('active');
        menuOpen = true;
    }

    function closeMenu() {
        burgerMenu.classList.remove('active');
        mobileSidebar.classList.remove('active');
        overlay.classList.remove('active');
        menuOpen = false;
    }

    if (burgerMenu) {
        burgerMenu.addEventListener('click', () => {
            menuOpen ? closeMenu() : openMenu();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    if (mobileSidebar) {
        document.querySelectorAll('.mobile-sidebar a').forEach(link => {
            link.addEventListener('click', () => {
                if (menuOpen) closeMenu();
            });
        });
    }
}, 0);

// === SIDEBAR TOGGLE ===
const sidebar = document.getElementById('searchSidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const openBtn = document.getElementById('openSidebar');

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.add('hidden');
        openBtn.classList.add('visible');
    });
}

if (openBtn) {
    openBtn.addEventListener('click', () => {
        sidebar.classList.remove('hidden');
        openBtn.classList.remove('visible');
    });
}

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
        
        // Charger les données depuis localStorage si disponibles
        this.loadFromLocalStorage();
    }

    loadFromLocalStorage() {
        const savedItinerary = localStorage.getItem('itinerary');
        if (savedItinerary) {
            try {
                const { origin, destination } = JSON.parse(savedItinerary);
                
                // Remplir les champs
                if (origin) {
                    document.getElementById('originInput').value = origin.label;
                    this.originAutocomplete.selectedAddress = origin;
                    this.mapService.addOriginMarker(origin.coordinates[1], origin.coordinates[0], origin.label);
                }
                
                if (destination) {
                    document.getElementById('destinationInput').value = destination.label;
                    this.destinationAutocomplete.selectedAddress = destination;
                    this.mapService.addDestinationMarker(destination.coordinates[1], destination.coordinates[0], destination.label);
                }
                
                // Calculer automatiquement l'itinéraire
                if (origin && destination) {
                    setTimeout(() => {
                        this.calculateRoute();
                    }, 500);
                }
                
                // Nettoyer le localStorage après utilisation
                localStorage.removeItem('itinerary');
                
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            }
        }
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

        // Afficher l'animation de chargement (overlay)
        this.showLoadingOverlay();
        
        // Masquer les résultats et erreurs précédents
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

            // Masquer l'animation de chargement
            this.hideLoadingOverlay();

            this.displayResults(result);
            this.mapService.displayItinerary(result);

        } catch (err) {
            console.error("❌ Erreur:", err);
            
            // Masquer l'animation de chargement
            this.hideLoadingOverlay();
            
            // Afficher erreur
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorText').textContent = err.message;
        }
    }
    
    showLoadingOverlay() {
        const loader = document.querySelector('.loading-overlay');
        if (loader) {
            loader.classList.add('active');
        }
    }
    
    hideLoadingOverlay() {
        const loader = document.querySelector('.loading-overlay');
        if (loader) {
            loader.classList.remove('active');
        }
    }

    displayResults(data) {

        const summaryDiv = document.getElementById('summary');
        const stepsDiv = document.getElementById('steps');

        // Construire le texte du mode
        const types = Array.from(new Set((data.Steps || []).map(s => (s.type || '').toLowerCase())));
        const mapLabel = {
            'bike': 'Vélo',
            'walk': 'Marche'
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

// === GESTION DE L'UI DES NOTIFICATIONS ===
function initNotificationsUI() {
    const panel = document.getElementById('notificationsPanel');
    const toggleBtn = document.getElementById('notificationsToggleBtn');
    const closeBtn = document.getElementById('closeNotificationsBtn');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const badge = document.getElementById('notificationBadge');
    const body = document.getElementById('notificationsBody');

    // Ouvrir/fermer le panneau
    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('open');
    });

    closeBtn.addEventListener('click', () => {
        panel.classList.remove('open');
    });

    // Marquer toutes comme lues
    markAllReadBtn.addEventListener('click', () => {
        notificationService.markAllAsRead();
        updateNotificationsUI();
    });

    // Écouter les nouvelles notifications
    notificationService.addListener((notification) => {
        updateNotificationsUI();
        // Animation du badge
        badge.style.transform = 'scale(1.3)';
        setTimeout(() => {
            badge.style.transform = 'scale(1)';
        }, 200);
    });

    // Mettre à jour l'UI périodiquement
    setInterval(updateNotificationsUI, 1000);
}

function updateNotificationsUI() {
    const body = document.getElementById('notificationsBody');
    const badge = document.getElementById('notificationBadge');
    const notifications = notificationService.getNotifications();
    const unreadCount = notificationService.getUnreadCount();

    // Mettre à jour le badge
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    // Afficher les notifications
    if (notifications.length === 0) {
        body.innerHTML = `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>Aucune notification</p>
            </div>
        `;
        return;
    }

    body.innerHTML = notifications.map(n => {
        const timeAgo = getTimeAgo(n.timestamp);
        const icon = notificationService.getIconForEventType(n.eventType);
        
        return `
            <div class="notification-item ${n.read ? '' : 'unread'} severity-${n.severity}" 
                 data-id="${n.id}">
                <div class="notification-header">
                    <div class="notification-icon severity-${n.severity}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-message">${n.message}</p>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Ajouter les événements de clic
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseFloat(item.dataset.id);
            notificationService.markAsRead(id);
            item.classList.remove('unread');
            updateNotificationsUI();
        });
    });
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `il y a ${days}j`;
    if (hours > 0) return `il y a ${hours}h`;
    if (minutes > 0) return `il y a ${minutes}min`;
    return 'À l\'instant';
}

export default ItineraryPage;
