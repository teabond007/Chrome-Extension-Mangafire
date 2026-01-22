/**
 * CrystalSelect
 * A premium, glassmorphism-styled custom dropdown component.
 * Replaces native <select> elements while maintaining their functionality.
 */
export class CrystalSelect {
    constructor(selectElement) {
        if (!selectElement || selectElement.tagName !== 'SELECT') return;
        
        this.select = selectElement;
        this.container = null;
        this.trigger = null;
        this.dropdown = null;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        this.buildUI();
        this.addEventListeners();
        this.observeChanges();
    }

    buildUI() {
        // 1. Create Container
        this.container = document.createElement('div');
        this.container.className = 'custom-select-container';
        if (this.select.id) this.container.id = `${this.select.id}-crystal`;
        
        // 2. Insert Container after select
        // Ensure we don't lose the reference position
        const parent = this.select.parentNode;
        const nextSibling = this.select.nextSibling;
        
        // Hide original select (JS fallback)
        this.select.style.position = 'absolute';
        this.select.style.opacity = '0';
        this.select.style.pointerEvents = 'none';
        this.select.style.width = '1px';
        this.select.style.height = '1px';

        parent.insertBefore(this.container, nextSibling);
        this.container.appendChild(this.select);

        // 3. Create Trigger (the visible box)
        this.trigger = document.createElement('div');
        this.trigger.className = 'crystal-select-trigger';
        
        const triggerText = document.createElement('span');
        triggerText.className = 'trigger-text';
        this.trigger.appendChild(triggerText);
        
        const arrow = document.createElement('div');
        arrow.className = 'select-arrow';
        arrow.innerHTML = `<svg viewBox="0 0 10 6"><path d="M1 1L5 5L9 1" fill="none" stroke="currentColor"/></svg>`;
        this.trigger.appendChild(arrow);
        
        this.container.appendChild(this.trigger);

        // 4. Create Dropdown List
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'crystal-dropdown';
        
        const optionsList = document.createElement('div');
        optionsList.className = 'crystal-options-list';
        this.dropdown.appendChild(optionsList);
        
        this.container.appendChild(this.dropdown);
        
        // 5. Initial Populate
        this.syncOptions();
    }

    syncOptions() {
        const optionsList = this.dropdown.querySelector('.crystal-options-list');
        const triggerText = this.trigger.querySelector('.trigger-text');
        
        optionsList.innerHTML = '';
        
        // Update Trigger Text
        const selectedOption = this.select.options[this.select.selectedIndex];
        triggerText.textContent = selectedOption ? selectedOption.textContent : 'Select...';

        // Build Custom Options
        Array.from(this.select.options).forEach((opt, index) => {
            const customOpt = document.createElement('div');
            customOpt.className = 'crystal-option';
            if (opt.selected) customOpt.classList.add('is-selected');
            if (opt.disabled) customOpt.classList.add('is-disabled');
            
            // Check for color markers (used in status filter)
            if (opt.style.color) {
                const indicator = document.createElement('span');
                indicator.className = 'marker-indicator';
                indicator.style.backgroundColor = opt.style.color;
                customOpt.appendChild(indicator);
                
                // If selected, maybe sync color to trigger? 
                // Let's keep it simple for now as per "basic" request
            }

            const text = document.createElement('span');
            text.textContent = opt.textContent;
            customOpt.appendChild(text);

            if (!opt.disabled) {
                customOpt.onclick = (e) => {
                    e.stopPropagation();
                    this.setValue(opt.value);
                };
            }

            optionsList.appendChild(customOpt);
        });
    }

    setValue(value) {
        this.select.value = value;
        this.select.dispatchEvent(new Event('change', { bubbles: true }));
        this.syncOptions();
        this.close();
    }

    addEventListeners() {
        // Toggle Open/Close
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target)) {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        // Close all other instances first
        document.querySelectorAll('.custom-select-container.is-open').forEach(el => {
            if (el !== this.container) el.classList.remove('is-open');
        });

        this.isOpen = true;
        this.container.classList.add('is-open');
        
        // Premium touch: anime.js stagger if available
        if (window.anime) {
            window.anime({
                targets: this.dropdown.querySelectorAll('.crystal-option'),
                opacity: [0, 1],
                translateX: [-10, 0],
                delay: window.anime.stagger(20),
                duration: 400,
                easing: 'easeOutQuart'
            });
        }
    }

    close() {
        this.isOpen = false;
        this.container.classList.remove('is-open');
    }

    observeChanges() {
        const observer = new MutationObserver(() => this.syncOptions());
        observer.observe(this.select, { childList: true, subtree: true, attributes: true });
    }

    /**
     * Automatically initializes CrystalSelect for all selects in the document
     * and watches for new ones.
     */
    static autoInit() {
        const init = (root) => {
            root.querySelectorAll('select').forEach(sel => {
                if (!sel.closest('.custom-select-container') && !sel.classList.contains('no-crystal')) {
                    new CrystalSelect(sel);
                }
            });
        };

        // Init existing
        init(document);

        // Watch for new
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'SELECT') {
                            init(node.parentNode);
                        } else {
                            init(node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}
