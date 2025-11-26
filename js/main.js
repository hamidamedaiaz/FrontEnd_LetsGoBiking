import { initHeader } from './components/header.js';
import { initFooter } from './components/footer.js';
import AddressAutocomplete from './autocomplete.js';

// === INITIALISATION DES COMPOSANTS ===
// Injecter le header et footer
initHeader('accueil'); // Page active : 'accueil'
initFooter();

// === BURGER MENU ===
// Attendre que le DOM soit prêt après injection
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

// === AUTOCOMPLETE ===
const originAutocomplete = new AddressAutocomplete('origin', 'origin-results');
const destinationAutocomplete = new AddressAutocomplete('destination', 'destination-results');

// Écouter la sélection des adresses
document.getElementById('origin').addEventListener('addressSelected', (e) => {
    console.log('Origine sélectionnée:', e.detail);
});

document.getElementById('destination').addEventListener('addressSelected', (e) => {
    console.log('Destination sélectionnée:', e.detail);
});

// === BOUTON RECHERCHER ===
document.getElementById('search-btn').addEventListener('click', () => {
    const origin = originAutocomplete.getSelectedAddress();
    const destination = destinationAutocomplete.getSelectedAddress();

    if (!origin || !destination) {
        alert('Veuillez sélectionner une origine et une destination');
        return;
    }

    // Afficher le loader
    showLoader();

    // Sauvegarder dans localStorage
    localStorage.setItem('itinerary', JSON.stringify({
        origin,
        destination
    }));

    // Rediriger après 2 secondes
    setTimeout(() => {
        window.location.href = 'itinerary.html';
    }, 2000);
});

// Fonctions loader
function showLoader() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
        loader.classList.add('active');
    }
}

function hideLoader() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
        loader.classList.remove('active');
    }
}
