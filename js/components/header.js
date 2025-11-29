/**
 * Header Component - Réutilisable sur toutes les pages
 */

export function createHeader(activePage = 'accueil') {
    return `
<!-- ========================================
     HEADER SECTION
     ======================================== -->
<header class="site-header">
    <div class="header-container">
        <div class="logo">
            <h1><i class="fas fa-bicycle"></i> Let's Go Biking</h1>
        </div>
        <nav class="nav-links">
            <a href="html/index.html" class="${activePage === 'accueil' ? 'active' : ''}">Accueil</a>
            <a href="html/itinerary.html" class="${activePage === 'itinerary' ? 'active' : ''}">Itinéraire</a>
            <a href="html/about.html" class="${activePage === 'about' ? 'active' : ''}">À propos</a>
        </nav>
    </div>
</header>

<!-- ========================================
     MOBILE NAVIGATION
     ======================================== -->
<div class="mobile-nav">
    <div class="burger-menu">
        <span></span>
        <span></span>
        <span></span>
    </div>
    
    <aside class="mobile-sidebar">
        <h2>Menu</h2>
        <ul>
            <li><a href="index.html"><i class="fas fa-home"></i> Accueil</a></li>
            <li><a href="itinerary.html"><i class="fas fa-route"></i> Itinéraire</a></li>
            <li><a href="about.html"><i class="fas fa-info-circle"></i> À propos</a></li>
        </ul>
    </aside>
</div>
    `;
}

/**
 * Initialise le header sur la page
 * @param {string} activePage - Page active ('accueil', 'itinerary', 'about')
 */
export function initHeader(activePage = 'accueil') {
    const headerHTML = createHeader(activePage);
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
}
