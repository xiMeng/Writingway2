/**
 * Watchers Module
 * Sets up Alpine.js watchers for reactive state changes
 */

function setupWatchers(app) {
    // Watch for preview mode changes and stop TTS when switching to edit mode
    app.$watch('showMarkdownPreview', (isPreview) => {
        if (!isPreview && app.isReading) {
            // Switched from preview to edit mode while reading - stop TTS
            if (window.TTS && typeof window.TTS.stop === 'function') {
                window.TTS.stop();
            }
            app.isReading = false;
        }
    });

    // Watch AI settings and auto-save when they change (but not during initialization)
    app.$watch('aiMode', () => {
        if (!app.isInitializing && window.AISettings && typeof window.AISettings.saveGenerationParams === 'function') {
            window.AISettings.saveGenerationParams(app);
        }
    });

    app.$watch('aiProvider', () => {
        if (!app.isInitializing && window.AISettings && typeof window.AISettings.saveGenerationParams === 'function') {
            window.AISettings.saveGenerationParams(app);
        }
    });

    app.$watch('aiModel', () => {
        if (!app.isInitializing && window.AISettings && typeof window.AISettings.saveGenerationParams === 'function') {
            window.AISettings.saveGenerationParams(app);
        }
    });

    app.$watch('aiApiKey', () => {
        if (!app.isInitializing && window.AISettings && typeof window.AISettings.saveGenerationParams === 'function') {
            window.AISettings.saveGenerationParams(app);
        }
    });

    app.$watch('aiEndpoint', () => {
        if (!app.isInitializing && window.AISettings && typeof window.AISettings.saveGenerationParams === 'function') {
            window.AISettings.saveGenerationParams(app);
        }
    });

    app.$watch('temperature', () => {
        if (!app.isInitializing && window.AISettings && typeof window.AISettings.saveGenerationParams === 'function') {
            window.AISettings.saveGenerationParams(app);
        }
    });

    app.$watch('maxTokens', () => {
        if (!app.isInitializing && window.AISettings && typeof window.AISettings.saveGenerationParams === 'function') {
            window.AISettings.saveGenerationParams(app);
        }
    });

    app.$watch('forceNonStreaming', () => {
        if (!app.isInitializing && window.AISettings && typeof window.AISettings.saveGenerationParams === 'function') {
            window.AISettings.saveGenerationParams(app);
        }
    });
}

// Expose globally for Alpine.js
window.setupWatchers = setupWatchers;
