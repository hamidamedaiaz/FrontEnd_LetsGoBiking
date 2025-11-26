/**
 * Footer Component - Réutilisable sur toutes les pages
 */

export function createFooter() {
    return `
<!-- ========================================
     FOOTER SECTION
     ======================================== -->
<footer class="site-footer">
    <div class="footer-content">
        <p class="footer-text">&copy; 2025 Let's Go Biking - Projet SOC/Middleware</p>
    </div>
</footer>
    `;
}

/**
 * Initialise le footer sur la page
 */
export function initFooter() {
    const footerHTML = createFooter();
    document.body.insertAdjacentHTML('beforeend', footerHTML);
}
