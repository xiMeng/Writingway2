// src/modules/generation.js
// Extracted generation logic from app.js

const Generation = {
    // Build the prompt for AI generation
    buildPrompt(beatInput, sceneContent, opts) {
        // This is a placeholder. Actual logic should be copied from app.js
        // and may use opts: { povCharacter, pov, tense, prosePrompt, compendiumEntries, sceneSummaries }
        // For now, just concatenate for demonstration:
        let prompt = '';
        if (opts && opts.prosePrompt) prompt += opts.prosePrompt + '\n';
        if (beatInput) prompt += 'Beat: ' + beatInput + '\n';
        if (sceneContent) prompt += 'Scene: ' + sceneContent + '\n';
        // Add compendium and scene summaries if present
        if (opts && opts.compendiumEntries && opts.compendiumEntries.length) {
            prompt += '\nCompendium:\n';
            opts.compendiumEntries.forEach(e => {
                prompt += `- ${e.title || e.id}: ${e.content || ''}\n`;
            });
        }
        if (opts && opts.sceneSummaries && opts.sceneSummaries.length) {
            prompt += '\nScene Summaries:\n';
            opts.sceneSummaries.forEach(s => {
                prompt += `- ${s.title}: ${s.summary || ''}\n`;
            });
        }
        // Add POV and tense
        if (opts && opts.povCharacter) prompt += `POV Character: ${opts.povCharacter}\n`;
        if (opts && opts.pov) prompt += `POV: ${opts.pov}\n`;
        if (opts && opts.tense) prompt += `Tense: ${opts.tense}\n`;
        return prompt;
    },

    // Stream generation tokens from the AI server
    async streamGeneration(prompt, onToken, appContext) {
        // This is a placeholder for actual streaming logic.
        // In production, this would call the backend (e.g., llama-server) and stream tokens.
        // For now, simulate streaming with a timeout.
        const fakeResponse = 'This is a generated response from the AI model.';
        for (let i = 0; i < fakeResponse.length; i++) {
            await new Promise(res => setTimeout(res, 10));
            onToken(fakeResponse[i]);
        }
    }
};

window.Generation = Generation;
export default Generation;
