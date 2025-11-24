/**
 * Context Panel Module
 * Handles context building for AI generation including compendium entries, scenes, and prose prompts
 */

(function () {
    const ContextPanel = {
        /**
         * Resolve prose prompt information from selected prompt ID
         * @param {Object} app - Alpine app instance
         * @returns {Promise<Object>} Prompt info {id, text, source}
         */
        async resolveProsePromptInfo(app) {
            try {
                if (app.selectedProsePromptId) {
                    let p = (app.prompts || []).find(x => x.id === app.selectedProsePromptId && x.category === 'prose');
                    if (p) return { id: p.id, text: p.content || null, source: 'memory' };
                    try {
                        p = await db.prompts.get(app.selectedProsePromptId);
                    } catch (e) { p = null; }
                    if (p) return { id: p.id, text: p.content || null, source: 'db' };
                    return { id: app.selectedProsePromptId, text: null, source: 'missing' };
                }
            } catch (e) {
                // fallthrough
            }

            if (app.currentPrompt && app.currentPrompt.content) {
                return { id: app.currentPrompt.id || null, text: app.currentPrompt.content, source: 'currentPrompt' };
            }
            return { id: null, text: null, source: 'none' };
        },

        /**
         * Build context from context panel settings
         * @param {Object} app - Alpine app instance
         * @returns {Promise<Object>} Context object {compendiumEntries, sceneSummaries}
         */
        async buildContextFromPanel(app) {
            const context = {
                compendiumEntries: [],
                sceneSummaries: []
            };

            if (!app.currentProject) return context;

            // 1. Add compendium entries from context panel
            for (const entryId of app.contextPanel.compendiumIds) {
                try {
                    const entry = await db.compendium.get(entryId);
                    if (entry) {
                        context.compendiumEntries.push(entry);
                    }
                } catch (e) {
                    console.warn('Failed to load compendium entry:', entryId, e);
                }
            }

            // 2. Add scenes based on chapter/scene selections
            const processedScenes = new Set();

            // Process chapter-level selections
            for (const [chapterId, mode] of Object.entries(app.contextPanel.chapters)) {
                if (!mode) continue; // skip if no mode selected

                const chapter = app.chapters.find(c => c.id === chapterId);
                if (!chapter || !chapter.scenes) continue;

                for (const scene of chapter.scenes) {
                    if (processedScenes.has(scene.id)) continue;
                    processedScenes.add(scene.id);

                    if (mode === 'full') {
                        // Load full scene content
                        try {
                            const fullScene = await db.scenes.get(scene.id);
                            const content = await db.content.get(scene.id);
                            if (fullScene && content) {
                                context.sceneSummaries.push({
                                    title: fullScene.title,
                                    summary: content.text || ''
                                });
                            }
                        } catch (e) {
                            console.warn('Failed to load scene content:', scene.id, e);
                        }
                    } else if (mode === 'summary' && scene.summary) {
                        context.sceneSummaries.push({
                            title: scene.title,
                            summary: scene.summary
                        });
                    }
                }
            }

            // Process individual scene selections (only if chapter doesn't have a mode)
            for (const [sceneId, mode] of Object.entries(app.contextPanel.scenes)) {
                if (!mode || processedScenes.has(sceneId)) continue;

                // Check if this scene's chapter has a mode set
                const scene = app.scenes.find(s => s.id === sceneId);
                if (!scene) continue;

                if (app.contextPanel.chapters[scene.chapterId]) {
                    // Chapter mode takes precedence, skip individual scene
                    continue;
                }

                processedScenes.add(sceneId);

                if (mode === 'full') {
                    // Load full scene content
                    try {
                        const fullScene = await db.scenes.get(sceneId);
                        const content = await db.content.get(sceneId);
                        if (fullScene && content) {
                            context.sceneSummaries.push({
                                title: fullScene.title,
                                summary: content.text || ''
                            });
                        }
                    } catch (e) {
                        console.warn('Failed to load scene content:', sceneId, e);
                    }
                } else if (mode === 'summary' && scene.summary) {
                    context.sceneSummaries.push({
                        title: scene.title,
                        summary: scene.summary
                    });
                }
            }

            // 3. Add scenes by tags
            for (const tag of app.contextPanel.tags) {
                const taggedScenes = app.scenes.filter(s =>
                    s.tags && Array.isArray(s.tags) && s.tags.includes(tag)
                );

                for (const scene of taggedScenes) {
                    if (processedScenes.has(scene.id)) continue;
                    processedScenes.add(scene.id);

                    // Use summary if available, otherwise skip
                    if (scene.summary) {
                        context.sceneSummaries.push({
                            title: scene.title,
                            summary: scene.summary
                        });
                    }
                }
            }

            return context;
        },

        /**
         * Resolve compendium entries from beat mentions (@[Title])
         * @param {Object} app - Alpine app instance
         * @param {string} beatText - The beat input text
         * @returns {Promise<Array>} Array of compendium entries
         */
        async resolveCompendiumEntriesFromBeat(app, beatText) {
            if (window.BeatMentions && typeof window.BeatMentions.resolveCompendiumEntriesFromBeat === 'function') {
                return await window.BeatMentions.resolveCompendiumEntriesFromBeat(app, beatText);
            }
            return [];
        },

        /**
         * Resolve scene summaries from beat mentions (#[Title])
         * @param {Object} app - Alpine app instance
         * @param {string} beatText - The beat input text
         * @returns {Promise<Array>} Array of scene summaries
         */
        async resolveSceneSummariesFromBeat(app, beatText) {
            if (window.BeatMentions && typeof window.BeatMentions.resolveSceneSummariesFromBeat === 'function') {
                return await window.BeatMentions.resolveSceneSummariesFromBeat(app, beatText);
            }
            return [];
        }
    };

    // Expose globally for Alpine.js
    window.ContextPanel = ContextPanel;
})();
