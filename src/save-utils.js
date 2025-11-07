// Save utilities for scenes. Exposes window.Save.saveScene(app)
(function () {
    async function saveScene(app) {
        if (!app || !app.db) return;
        try {
            app.isSaving = true;
            app.saveStatus = 'saving';

            const scene = app.currentScene;
            if (!scene) {
                app.saveStatus = 'no-scene';
                app.isSaving = false;
                return;
            }

            // compute word count from scene content (simple split)
            const contentText = (scene.content || '').trim();
            const wordCount = contentText ? contentText.split(/\s+/).length : 0;

            // persist content and scene metadata
            const contentRecord = {
                sceneId: scene.id,
                text: scene.content || '',
                updatedAt: Date.now(),
            };

            await app.db.content.put(contentRecord);

            // persist scene fields we keep in scenes table (title, order, chapterId, pov options)
            const scenePatch = {
                id: scene.id,
                title: scene.title || '',
                order: typeof scene.order === 'number' ? scene.order : 0,
                chapterId: scene.chapterId || null,
                povCharacter: scene.povCharacter || '',
                pov: scene.pov || '',
                tense: scene.tense || '',
                updatedAt: Date.now(),
                wordCount,
            };

            await app.db.scenes.put(scenePatch);

            // update in-memory lists so UI reflects new counts
            const ch = app.chapters.find((c) => c.id === scene.chapterId);
            if (ch && Array.isArray(ch.scenes)) {
                const s = ch.scenes.find((x) => x.id === scene.id);
                if (s) Object.assign(s, scenePatch);
            }

            // ensure app.scenes (flat) gets updated if present
            if (Array.isArray(app.scenes)) {
                const ss = app.scenes.find((x) => x.id === scene.id);
                if (ss) Object.assign(ss, scenePatch);
            }

            app.saveStatus = 'saved';
        } catch (err) {
            console.error('saveScene error', err);
            app.saveStatus = 'error';
            throw err;
        } finally {
            app.isSaving = false;
        }
    }

    window.Save = window.Save || {};
    window.Save.saveScene = saveScene;
})();
