<template>
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
</template>

<script setup>
</script>

<style scoped lang="scss">
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

    .description {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.6;
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
