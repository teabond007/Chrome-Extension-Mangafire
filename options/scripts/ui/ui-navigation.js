/**
 * @fileoverview Manages high-level UI navigation, including tab switching, 
 * page-linking redirects, and scrolling features.
 */

/**
 * Initializes the primary sidebar tab system.
 * Attaches listeners to sidebar items and manages tab-pane visibility and animation classes.
 * 
 * @returns {void}
 */
export function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const targetTab = item.getAttribute('data-tab');
            if (!targetTab) return;

            // Reflect the active state in the sidebar navigation
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Toggle visibility of the target tab-pane content
            tabPanes.forEach(pane => {
                if (pane.id === `tab-${targetTab}`) {
                    pane.style.display = 'block';
                    // Delay adding the 'active' class slightly to trigger CSS transition animations
                    setTimeout(() => pane.classList.add('active'), 10);
                } else {
                    pane.style.display = 'none';
                    pane.classList.remove('active');
                }
            });
        });
    });
}

/**
 * Initializes special "Info Redirect" buttons that link across tabs.
 * Typically used for "How to" labels that redirect the user to a specific guide on the About page.
 * 
 * @returns {void}
 */
export function initInfoRedirects() {
    document.querySelectorAll('.info-redirect-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const targetId = btn.getAttribute('data-target');

            // Automatically switch context to the 'About' tab
            const aboutNavItem = document.querySelector('.nav-item[data-tab="about"]');
            if (aboutNavItem) {
                aboutNavItem.click();

                // Scroll to the specific guide card or section element
                if (targetId) {
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        setTimeout(() => {
                            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Apply a visual highlight pulse to draw user attention
                            targetElement.classList.add('highlight-pulse');
                            setTimeout(() => targetElement.classList.remove('highlight-pulse'), 2000);
                        }, 300);
                    }
                }
            }
        });
    });
}

/**
 * Initializes the "Scroll to Top" floating button functionality.
 * Monitors the main content container's scroll position to show/hide the button dynamically.
 * 
 * @returns {void}
 */
export function initScrollToTop() {
    const btn = document.getElementById("scrollToTopBtn");
    const container = document.querySelector(".main-content");
    if (!btn || !container) return;

    // Show button only after user has scrolled down significantly
    container.addEventListener("scroll", () => {
        if (container.scrollTop > 300) {
            btn.classList.add("visible");
        } else {
            btn.classList.remove("visible");
        }
    });

    // Handle smooth scrolling back to the top of the container
    btn.addEventListener("click", () => {
        container.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

