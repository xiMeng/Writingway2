// Save utilities for scenes. Exposes window.Save.saveScene(app)
(function () {
    async function saveScene(app, opts) {
        if (!app) return false;
        opts = opts || {};
        try {
            app.isSaving = true;
            app.saveStatus = 'Saving...';

            const scene = app.currentScene;
            if (!scene) {
                app.saveStatus = 'No scene';
                app.isSaving = false;
                return false;
            }
            // compute word count from scene content
            const contentText = (scene.content || '').trim();
            const wordCount = contentText ? contentText.split(/\s+/).filter(w => w.length > 0).length : 0;

            // read previous content and scene record to detect changes and mark summary stale if needed
            let prevContent = null;
            let prevScene = null;
            try {
                prevContent = await db.content.get(scene.id);
            } catch (e) { /* ignore */ }
            try {
                prevScene = await db.scenes.get(scene.id);
            } catch (e) { /* ignore */ }

            // persist content and scene metadata using the global `db` instance
            const contentRecord = {
                sceneId: scene.id,
                text: scene.content || '',
                wordCount: wordCount,
                modified: new Date()
            };

            await db.content.put(contentRecord);

            const scenePatch = {
                id: scene.id,
                projectId: scene.projectId || (app.currentProject && app.currentProject.id) || null,
                title: scene.title || '',
                order: typeof scene.order === 'number' ? scene.order : 0,
                chapterId: scene.chapterId || null,
                // prefer app-level UI values if present (the POV inputs are bound to app props),
                // fallback to currentScene fields when available
                povCharacter: (app.povCharacter !== undefined ? app.povCharacter : (scene.povCharacter || '')),
                pov: (app.pov !== undefined ? app.pov : (scene.pov || '')),
                tense: (app.tense !== undefined ? app.tense : (scene.tense || '')),
                modified: new Date(),
                wordCount
            };

            // Track mentioned compendium entries from beat field
            if (app.beatCompendiumMap && Object.keys(app.beatCompendiumMap).length > 0) {
                scenePatch.mentionedEntries = Object.values(app.beatCompendiumMap);
            }

            // If the content changed and there was an existing summary, mark the summary stale
            try {
                const contentChanged = prevContent && (prevContent.text || '') !== (scene.content || '');
                // Only mark stale automatically during autosave events (not manual saves)
                const willMarkStale = !!(contentChanged && prevScene && prevScene.summary && opts.autosave);
                if (willMarkStale) {
                    scenePatch.summaryStale = true;
                }
                // (debug logs removed)
            } catch (e) { /* ignore */ }

            // Use a safe merge update to avoid accidentally removing fields like `summary`.
            async function safeMergeUpdate(id, patch) {
                try {
                    const cur = await db.scenes.get(id) || {};
                    const merged = Object.assign({}, cur, patch, { id: id });
                    await db.scenes.put(merged);
                    return merged;
                } catch (e) {
                    // If put fails, try update as a fallback
                    try { await db.scenes.update(id, patch); } catch (err) { throw err; }
                    return await db.scenes.get(id);
                }
            }

            let mergedScene = null;
            try {
                mergedScene = await safeMergeUpdate(scene.id, scenePatch);
            } catch (e) {
                // If safe merge fails, fallback to update/put already handled inside helper
                try { mergedScene = await db.scenes.get(scene.id); } catch (err) { /* ignore */ }
            }
            // Debug: read back the scene from DB to ensure fields persisted
            try {
                // readback retained for optional error diagnostics (no log)
                const dbScene = mergedScene || await db.scenes.get(scene.id);
            } catch (e) { /* ignore */ }

            // Update in-memory lists
            try {
                const ch = app.chapters && app.chapters.find((c) => c.id === scene.chapterId);
                if (ch && Array.isArray(ch.scenes)) {
                    const s = ch.scenes.find((x) => x.id === scene.id);
                    if (s) Object.assign(s, scenePatch);
                }

                if (Array.isArray(app.scenes)) {
                    const ss = app.scenes.find((x) => x.id === scene.id);
                    if (ss) Object.assign(ss, scenePatch);
                }

                // If we marked the summary stale, update in-memory summary flags so the UI reflects immediately
                if (scenePatch.summaryStale) {
                    try {
                        if (ch && Array.isArray(ch.scenes)) {
                            const s2 = ch.scenes.find((x) => x.id === scene.id);
                            if (s2) s2.summaryStale = true;
                        }
                        if (Array.isArray(app.scenes)) {
                            const ss2 = app.scenes.find((x) => x.id === scene.id);
                            if (ss2) ss2.summaryStale = true;
                        }
                        if (app.currentScene && app.currentScene.id === scene.id) app.currentScene.summaryStale = true;
                    } catch (e) { /* ignore */ }
                }
                // (debug logs removed)
            } catch (e) { /* ignore */ }

            app.saveStatus = 'Saved';
            return true;
        } catch (err) {
            console.error('saveScene error', err);
            app.saveStatus = 'Error';
            return false;
        } finally {
            app.isSaving = false;
        }
    }

    window.Save = window.Save || {};
    window.Save.saveScene = saveScene;
})();
