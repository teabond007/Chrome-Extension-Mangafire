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
    const indicator = document.querySelector('.nav-indicator');

    // Initial positioning
    const activeItem = document.querySelector('.nav-item.active');
    if (activeItem && indicator) {
        moveIndicator(activeItem, indicator, false);
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const targetTab = item.getAttribute('data-tab');
            if (!targetTab) return;

            // Reflect the active state in the sidebar navigation
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Move Indicator
            if (indicator) moveIndicator(item, indicator);

            // Find current active pane
            const currentPane = document.querySelector('.tab-pane.active');
            const targetPane = document.getElementById(`tab-${targetTab}`);

            if (currentPane === targetPane) return;


            // Anime.js Transition
            if (typeof window.anime !== 'undefined') {
                if (currentPane) {
                    window.anime({
                        targets: currentPane,
                        opacity: 0,
                        translateY: -10,
                        duration: 200,
                        easing: 'easeInQuad',
                        complete: () => {
                            currentPane.style.display = 'none';
                            currentPane.classList.remove('active');
                            
                            // Show target
                            showTargetTab(targetPane);
                        }
                    });
                } else {
                    showTargetTab(targetPane);
                }
            } else {
                // Fallback if anime is missing
                tabPanes.forEach(pane => {
                    if (pane.id === `tab-${targetTab}`) {
                        pane.style.display = 'block';
                        setTimeout(() => pane.classList.add('active'), 10);
                    } else {
                        pane.style.display = 'none';
                        pane.classList.remove('active');
                    }
                });
            }
        });
    });
}

/**
 * Animates the sidebar selection indicator to the target item.
 */
function moveIndicator(target, indicator, animate = true) {
    const container = document.querySelector('.nav-menu');
    if (!container) return;

    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const top = targetRect.top - containerRect.top;
    const height = targetRect.height;

    if (!animate) {
        indicator.style.top = `${top + (height / 2) - 15}px`;
        return;
    }

    if (typeof window.anime !== 'undefined') {
        window.anime({
            targets: indicator,
            top: top + (height / 2) - 15, // center it (height of indicator is 30px)
            height: [30, 45, 30], // Elastic squash/stretch effect
            duration: 500,
            easing: 'easeOutElastic(1, .5)'
        });
    } else {
        indicator.style.top = `${top + (height / 2) - 15}px`;
    }
}

function showTargetTab(pane) {
    if (!pane) return;
    pane.style.display = 'block';
    pane.style.opacity = '0';
    pane.style.transform = 'translateY(10px)';
    pane.classList.add('active');

    if (typeof window.anime !== 'undefined') {
        window.anime({
            targets: pane,
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 400,
            easing: 'easeOutQuad',
            delay: 50 // Slight delay for smoothness
        });

        // Stagger cards inside if any
        const cards = pane.querySelectorAll('.card');
        if (cards.length > 0) {
            window.anime({
                targets: cards,
                opacity: [0, 1],
                translateY: [20, 0],
                delay: window.anime.stagger(100, {start: 100}),
                duration: 500,
                easing: 'easeOutCubic'
            });
        }
    } else {
        pane.style.opacity = '1';
        pane.style.transform = 'translateY(0)';
    }
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

