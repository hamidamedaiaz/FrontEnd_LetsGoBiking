import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';

// === INITIALISATION DES COMPOSANTS ===
initHeader('about');
initFooter();

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
