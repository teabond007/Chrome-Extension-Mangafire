<template>
    <aside class="sidebar" :class="{ 'collapsed': !isOpen }" ref="sidebarRef">
        <div class="brand">
            <div class="brand-icon" @click="toggleSidebar" title="Toggle Sidebar">
                <span class="icon-svg icon-brand"></span>
            </div>
            <span class="brand-name header-text-gradient" ref="brandNameRef">Color Marker</span>
        </div>

        <nav class="nav-menu" ref="navMenuRef">
            <a href="#" class="nav-item" :class="{ active: activeTab === 'settings' }" @click="setActiveTab('settings')" data-tab="settings">
                <span class="nav-icon">⚙️</span>
                <span class="nav-text">General Settings</span>
            </a>
            <a href="#" class="nav-item" :class="{ active: activeTab === 'saved-entries' }" @click="setActiveTab('saved-entries')" data-tab="saved-entries">
                <span class="nav-icon">&#128218;</span>
                <span class="nav-text">Saved Entries</span>
            </a>
            <a href="#" class="nav-item" :class="{ active: activeTab === 'import-export' }" @click="setActiveTab('import-export')" data-tab="import-export">
                <span class="nav-icon">&#128194;</span>
                <span class="nav-text">Import & Export</span>
            </a>
            <a href="#" class="nav-item" :class="{ active: activeTab === 'appearance' }" @click="setActiveTab('appearance')" data-tab="appearance">
                <span class="nav-icon">🎨</span>
                <span class="nav-text">Appearance</span>
            </a>
            <a href="#" class="nav-item" :class="{ active: activeTab === 'about' }" @click="setActiveTab('about')" data-tab="about">
                <span class="nav-icon">ℹ️</span>
                <span class="nav-text">About</span>
            </a>
            <div class="nav-indicator" ref="indicatorRef"></div>
        </nav>

        <div class="sidebar-footer" ref="footerRef">
            <a href="https://www.buymeacoffee.com" target="_blank" class="sidebar-btn support-sidebar-btn"
                title="Support Developer">
                <span class="icon">☕</span>
                <span class="label nav-text">Support Dev</span>
            </a>
            <div class="version-info nav-text">Version 3.8.0</div>
            
            <button class="collapse-toggle" @click="toggleSidebar">
                <span class="arrow-icon">{{ isOpen ? '❮' : '❯' }}</span>
            </button>
        </div>
    </aside>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import anime from 'animejs';

const isOpen = ref(true);
const activeTab = ref('settings');
const sidebarRef = ref(null);
const navMenuRef = ref(null);
const brandNameRef = ref(null);
const footerRef = ref(null);
const indicatorRef = ref(null);

const toggleSidebar = () => {
    isOpen.value = !isOpen.value;
};

const setActiveTab = (tab) => {
    activeTab.value = tab;
};

// Animation logic
const animateSidebar = (open) => {
    // Animate Text Opacity & Transform
    const textTargets = sidebarRef.value.querySelectorAll('.nav-text, .brand-name, .version-info, .sidebar-footer .label');
    
    if (open) {
        // Open Animation
        anime({
            targets: textTargets,
            opacity: [0, 1],
            translateX: [-10, 0],
            duration: 600,
            easing: 'easeOutExpo',
            delay: anime.stagger(50, { start: 100 })
        });
    } else {
        // Close Animation - Quick fade out
        anime({
            targets: textTargets,
            opacity: 0,
            duration: 200,
            easing: 'easeOutQuad'
        });
    }
};

watch(isOpen, (newVal) => {
    animateSidebar(newVal);
});

onMounted(() => {
    // Initial Entrance Animation
    const navItems = navMenuRef.value.querySelectorAll('.nav-item');
    
    // Reset initial state for animation
    anime.set(navItems, { opacity: 0, translateY: 20 });
    anime.set([brandNameRef.value, footerRef.value], { opacity: 0 });

    const timeline = anime.timeline({
        easing: 'easeOutExpo',
    });

    timeline
    .add({
        targets: sidebarRef.value,
        translateX: [-50, 0],
        opacity: [0, 1],
        duration: 800,
    })
    .add({
        targets: brandNameRef.value,
        opacity: [0, 1],
        translateY: [-10, 0],
        duration: 800,
    }, '-=600')
    .add({
        targets: navItems,
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100), // Staggering: 100ms between each item
        duration: 1000,
    }, '-=700')
    .add({
        targets: footerRef.value,
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 800
    }, '-=800');
});
</script>

<style scoped lang="scss">
.sidebar {
    width: var(--nav-width, 260px); 
    background-color: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    
    /* Premium Glassmorphism */
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    
    color: var(--text-on-dark);
    display: flex;
    flex-direction: column;
    padding: 30px 20px;
    flex-shrink: 0;
    transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.3s ease;
    position: relative;
    z-index: 100;
    overflow: hidden;
}

/* Collapsed State Overrides */
.sidebar.collapsed {
    width: 80px !important;
    padding: 30px 0 !important;
}

.sidebar.collapsed .brand {
    justify-content: center;
    padding: 0;
}

.sidebar.collapsed .nav-item {
    justify-content: center;
    padding: 12px 0; /* Remove horizontal padding */
}

.sidebar.collapsed .nav-icon {
    margin-right: 0;
    font-size: 24px; /* Larger icons when collapsed */
}

/* Hide text elements aggressively in collapsed state */
.sidebar.collapsed .nav-text, 
.sidebar.collapsed .brand-name, 
.sidebar.collapsed .version-info, 
.sidebar.collapsed .sidebar-footer .label {
    display: none !important;
}

.sidebar.collapsed .nav-indicator {
    display: none;
}

.sidebar.collapsed .support-sidebar-btn {
    padding: 12px;
    justify-content: center;
}

.sidebar.collapsed .support-sidebar-btn .icon {
    margin: 0;
}

/* Standard Styles */
.brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 50px;
    padding: 0 10px;
    white-space: nowrap;
    overflow: hidden;
}

.brand-icon {
    cursor: pointer;
    transition: transform 0.3s ease;
    flex-shrink: 0;
}
.brand-icon:hover {
    transform: scale(1.1);
}

.brand-name {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.5px;
    display: inline-block;
}

.nav-menu {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    overflow-x: hidden;
}

.nav-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    text-decoration: none;
    color: var(--text-muted-on-dark);
    border-radius: var(--radius-sm);
    transition: all 0.2s;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
}

.nav-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-on-dark);
}

.nav-item.active {
    color: var(--text-on-dark);
    background-color: rgba(255, 255, 255, 0.08);
}

.nav-icon {
    margin-right: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    flex-shrink: 0;
}

.nav-indicator {
    position: absolute;
    left: -20px;
    width: 4px;
    height: 30px;
    background: var(--accent-primary);
    border-radius: 0 4px 4px 0;
    pointer-events: none;
    box-shadow: 0 0 15px var(--accent-primary);
    transition: top 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.sidebar-footer {
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 15px;
    white-space: nowrap;
    overflow: hidden;
}

.sidebar-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-on-dark);
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 14px;
    transition: all 0.2s;
    text-decoration: none;
    font-weight: 500;
}

.sidebar-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.version-info {
    font-size: 12px;
    color: var(--text-muted-on-dark);
    text-align: center;
}

.collapse-toggle {
    background: transparent;
    border: none;
    color: var(--text-muted-on-dark);
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 5px;
    transition: color 0.2s;
}

.collapse-toggle:hover {
    color: var(--text-on-dark);
}

.header-text-gradient {
    color: #82BDF5;
    background-image: linear-gradient(45deg, #82BDF5 27%, #3299D1 44%, #8861FF 83%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
</style>
