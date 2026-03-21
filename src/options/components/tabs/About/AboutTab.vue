<template>
    <div id="tab-about" class="tab-pane fade-in" :class="{ active: settingsStore.activeTab === 'about' }">
        <header class="header">
            <div class="header-text">
                <h1>About</h1>
                <p class="subtitle">Information, usage guide, and extension architecture.</p>
            </div>
        </header>

        <div class="content-grid">
            <AboutProjectInfo />
            <AboutUserGuide />

            <!-- Support Developer Section -->
            <div class="support-dev-card standard-card">
                <div class="card-body">
                    <div class="support-header">
                        <div class="support-icon">☕</div>
                        <h2>Support the Development</h2>
                    </div>
                    <p class="description">If you enjoy using this extension and want to support its further
                        development, consider buying me a coffee! Your support helps keep the project alive,
                        ad-free, and always evolving with new requested features.</p>
                    <div class="support-links-group">
                        <a href="https://www.buymeacoffee.com" target="_blank"
                            class="btn btn-primary support-btn">
                            <span class="btn-icon">☕</span> Buy me a Coffee
                        </a>
                        <a href="https://github.com/sponsors/yourprofile" target="_blank"
                            class="btn btn-ghost support-btn">
                            <span class="btn-icon">💖</span> GitHub Sponsor
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import AboutProjectInfo from './AboutProjectInfo.vue';
import AboutUserGuide from './AboutUserGuide.vue';
import { useSettingsStore } from '../../../scripts/store/settings.store.js';

const settingsStore = useSettingsStore();
</script>

<style scoped lang="scss">
/* Support Dev Card */
.support-dev-card {
    margin-top: 40px;
    background: linear-gradient(135deg, rgba(117, 81, 255, 0.1) 0%, rgba(67, 24, 255, 0.05) 100%);
    border: 1px solid rgba(117, 81, 255, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-lg, 16px);

    .support-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;

        h2 {
            margin: 0 !important;
            font-size: 22px !important;
            background: linear-gradient(45deg, var(--accent-primary), #6AD2FF);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .support-icon {
            font-size: 28px;
            width: 50px;
            height: 50px;
            background: rgba(117, 81, 255, 0.15);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .support-links-group {
        display: flex;
        gap: 15px;
        margin-top: 25px;

        .support-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            height: 48px;
            font-weight: 600;
        }
    }
}
</style>
