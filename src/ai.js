// AI initialization helper
// Exposes window.AI.init(app) which performs the model health check and updates the app state
(function () {
    async function init(app) {
        try {
            // Check what mode the user has configured
            const aiMode = app.aiMode || 'api'; // Default to API mode
            const hasApiKey = app.aiApiKey && app.aiApiKey.length > 0;

            // If using API mode and has API key, mark as ready immediately
            if (aiMode === 'api' && hasApiKey) {
                app.aiStatus = 'ready';
                app.aiStatusText = `AI Ready (${app.aiProvider || 'API'})`;
                console.log('✓ AI configured with API provider');
                return;
            }

            // If using local mode, try to connect to llama-server
            if (aiMode === 'local') {
                app.showModelLoading = true;
                app.loadingMessage = 'Connecting to local AI server...';
                app.loadingProgress = 30;

                const endpoint = app.aiEndpoint || 'http://localhost:8080';
                const response = await fetch(endpoint + '/health', {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000) // 3 second timeout
                });

                if (response.ok) {
                    app.loadingProgress = 100;
                    app.loadingMessage = 'Connected to AI!';

                    await new Promise(resolve => setTimeout(resolve, 500));

                    app.aiStatus = 'ready';
                    app.aiStatusText = 'AI Ready (Local Server)';
                    app.showModelLoading = false;

                    console.log('✓ Connected to llama-server successfully');
                    return;
                }
            }

            // If we get here, no AI is configured
            app.aiStatus = 'not-configured';
            app.aiStatusText = 'Configure AI';
            app.showModelLoading = false;
            console.log('ℹ️ AI not configured. Click "Configure AI" to set up.');

        } catch (error) {
            // Connection failed or timeout - gracefully handle
            console.log('AI connection attempt failed (this is OK for first-time users):', error.message);

            if (app.aiMode === 'local') {
                app.aiStatus = 'error';
                app.aiStatusText = 'Local server offline';
                console.log('💡 To use local AI: Run start.bat or configure an API provider');
            } else {
                app.aiStatus = 'not-configured';
                app.aiStatusText = 'Configure AI';
                console.log('💡 Click "Configure AI" to set up an API provider');
            }

            app.showModelLoading = false;
        }
    }

    window.AI = window.AI || {};
    window.AI.init = init;
})();
