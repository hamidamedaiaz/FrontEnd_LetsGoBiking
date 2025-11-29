/**
 * Main Application Entry Point
 * 
 * Initializes the home page with header, footer, burger menu,
 * address autocomplete and search functionality.
 * 
 * @module main
 */

import { initHeader } from './components/header.js';
import { initFooter } from './components/footer.js';
import AddressAutocomplete from './autocomplete.js';

/**
 * Initialize page components
 */
function initializeComponents() {
    initHeader('accueil');
    initFooter();
}

/**
 * Initialize burger menu for mobile navigation
 */
function initializeBurgerMenu() {
    setTimeout(() => {
        const burgerMenu = document.querySelector('.burger-menu');
        const mobileSidebar = document.querySelector('.mobile-sidebar');
        const overlay = document.querySelector('.overlay');
        
        if (!burgerMenu || !mobileSidebar || !overlay) {
            console.warn('[Main] Burger menu elements not found');
            return;
        }

        let menuOpen = false;

        const openMenu = () => {
            burgerMenu.classList.add('active');
            mobileSidebar.classList.add('active');
            overlay.classList.add('active');
            menuOpen = true;
        };

        const closeMenu = () => {
            burgerMenu.classList.remove('active');
            mobileSidebar.classList.remove('active');
            overlay.classList.remove('active');
            menuOpen = false;
        };

        burgerMenu.addEventListener('click', () => {
            menuOpen ? closeMenu() : openMenu();
        });

        overlay.addEventListener('click', closeMenu);

        mobileSidebar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (menuOpen) closeMenu();
            });
        });
    }, 0);
}

/**
 * Initialize autocomplete for origin and destination inputs
 * 
 * @returns {Object} Autocomplete instances
 */
function initializeAutocomplete() {
    const originAutocomplete = new AddressAutocomplete('origin', 'origin-results');
    const destinationAutocomplete = new AddressAutocomplete('destination', 'destination-results');

    document.getElementById('origin').addEventListener('addressSelected', (e) => {
        console.info('[Main] Origin address selected:', e.detail.label);
    });

    document.getElementById('destination').addEventListener('addressSelected', (e) => {
        console.info('[Main] Destination address selected:', e.detail.label);
    });

    return { originAutocomplete, destinationAutocomplete };
}

/**
 * Initialize search button functionality
 * 
 * @param {Object} autocomplete - Autocomplete instances
 */
function initializeSearchButton({ originAutocomplete, destinationAutocomplete }) {
    const searchButton = document.getElementById('search-btn');
    
    if (!searchButton) {
        console.error('[Main] Search button not found');
        return;
    }

    searchButton.addEventListener('click', () => {
        const origin = originAutocomplete.getSelectedAddress();
        const destination = destinationAutocomplete.getSelectedAddress();

        if (!origin || !destination) {
            alert('Veuillez sélectionner une origine et une destination');
            return;
        }

        showLoader();

        localStorage.setItem('itinerary', JSON.stringify({
            origin,
            destination
        }));

        console.info('[Main] Redirecting to itinerary page');
        setTimeout(() => {
            window.location.href = 'itinerary.html';
        }, 2000);
    });
}

/**
 * Show loading overlay
 */
function showLoader() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
        loader.classList.add('active');
    }
}

/**
 * Hide loading overlay
 */
function hideLoader() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
        loader.classList.remove('active');
    }
}

/**
 * Application initialization
 */
(function init() {
    console.info('[Main] Application initialized');
    
    initializeComponents();
    initializeBurgerMenu();
    
    const autocomplete = initializeAutocomplete();
    initializeSearchButton(autocomplete);
})();
