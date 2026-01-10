/**
 * UI Navigation logic (Tabs and Info Redirects)
 */

export function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const targetTab = item.getAttribute('data-tab');
            if (!targetTab) return;

            // Update Nav State
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Tab Content
            tabPanes.forEach(pane => {
                if (pane.id === `tab-${targetTab}`) {
                    pane.style.display = 'block';
                    setTimeout(() => pane.classList.add('active'), 10);
                } else {
                    pane.style.display = 'none';
                    pane.classList.remove('active');
                }
            });
        });
    });
}

export function initInfoRedirects() {
    document.querySelectorAll('.info-redirect-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const targetId = btn.getAttribute('data-target');

            // Switch to About Tab
            const aboutNavItem = document.querySelector('.nav-item[data-tab="about"]');
            if (aboutNavItem) {
                aboutNavItem.click();

                // Scroll to specific guide card
                if (targetId) {
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        setTimeout(() => {
                            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Visual highlight
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
 * Initialize Scroll to Top functionality
 */
export function initScrollToTop() {
    const btn = document.getElementById("scrollToTopBtn");
    const container = document.querySelector(".main-content");
    if (!btn || !container) return;

    container.addEventListener("scroll", () => {
        if (container.scrollTop > 300) {
            btn.classList.add("visible");
        } else {
            btn.classList.remove("visible");
        }
    });

    btn.addEventListener("click", () => {
        container.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}
