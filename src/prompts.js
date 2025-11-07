// Prompts module — exposes window.Prompts with functions that operate on the shared `db` instance
(function () {
    async function loadPrompts(app) {
        if (!app.currentProject) {
            app.prompts = [];
            return;
        }
        try {
            app.prompts = await db.prompts.where('projectId').equals(app.currentProject.id).sortBy('modified');
            // ensure collapsed map has entries
            for (let c of app.promptCategories) {
                if (app.promptCollapsed[c] === undefined) app.promptCollapsed[c] = false;
            }
        } catch (e) {
            console.error('Failed to load prompts:', e);
            app.prompts = [];
        }
    }

    async function createPrompt(app, category) {
        if (!app.currentProject) return;
        const title = app.newPromptTitle && app.newPromptTitle.trim() ? app.newPromptTitle.trim() : 'New Prompt';
        const id = Date.now().toString();
        const now = new Date();
        const prompt = { id, projectId: app.currentProject.id, category, title, content: '', created: now, modified: now };
        await db.prompts.add(prompt);
        app.newPromptTitle = '';
        await loadPrompts(app);
        openPrompt(app, id);
    }

    function openPrompt(app, id) {
        const p = app.prompts.find(x => x.id === id);
        if (!p) return;
        app.currentPrompt = { ...p };
        app.promptEditorContent = p.content || '';
    }

    async function savePrompt(app) {
        if (!app.currentPrompt) return;
        try {
            const now = new Date();
            await db.prompts.update(app.currentPrompt.id, { title: app.currentPrompt.title, content: app.promptEditorContent, modified: now });
            await loadPrompts(app);
            // refresh currentPrompt reference
            app.currentPrompt = await db.prompts.get(app.currentPrompt.id);
            app.promptEditorContent = app.currentPrompt.content || '';
        } catch (e) {
            console.error('Failed to save prompt:', e);
        }
    }

    async function deletePrompt(app, id) {
        if (!id) return;
        if (!confirm('Delete this prompt?')) return;
        try {
            await db.prompts.delete(id);
            if (app.currentPrompt && app.currentPrompt.id === id) app.currentPrompt = null;
            await loadPrompts(app);
        } catch (e) {
            console.error('Failed to delete prompt:', e);
        }
    }

    window.Prompts = {
        loadPrompts,
        createPrompt,
        openPrompt,
        savePrompt,
        deletePrompt
    };
})();
