import { aiAgentContext } from '../aiagentcontext.js';
import { removeLeadingSpaces, extractEditorContent, trimMultilineString } from './text-utils.js';
import { countTokens, trimLLMContentByTokens } from './token-utils.js';
import { fetchUrlContent } from './url-utils.js';
import { getDefaultRules } from './default-rules.js';
import { getAllowedHtmlTags } from './html-utils.js';
export class PromptHelper {
    constructor(editor, options = {}) {
        var _a, _b, _c, _d;
        this.editor = editor;
        const config = editor.config.get('aiAgent');
        this.contextSize = (_a = config.contextSize) !== null && _a !== void 0 ? _a : 4000;
        this.promptSettings = (_b = config.promptSettings) !== null && _b !== void 0 ? _b : {};
        this.debugMode = (_c = config.debugMode) !== null && _c !== void 0 ? _c : false;
        this.editorContextRatio = (_d = options.editorContextRatio) !== null && _d !== void 0 ? _d : 0.3;
    }
    getSystemPrompt(isInlineResponse = false) {
        var _a, _b;
        const defaultComponents = getDefaultRules(this.editor);
        let systemPrompt = '';
        // Process each component
        for (const [id, defaultContent] of Object.entries(defaultComponents)) {
            // Skip components that are not allowed in the editor and not inline response
            if ((id === 'imageHandling' && !getAllowedHtmlTags(this.editor).includes('img')) ||
                (id === 'inlineContent' && !isInlineResponse)) {
                continue;
            }
            const componentId = id;
            let content = defaultContent;
            // If there is """Selected Content""" I'll use only that content to answer
            // the user's request in the TASK section, ignoring any additional CONTEXT
            // or prior knowledge.
            // Apply overrides if they exist
            if ((_a = this.promptSettings.overrides) === null || _a === void 0 ? void 0 : _a[componentId]) {
                content = this.promptSettings.overrides[componentId];
            }
            // Apply additions if they exist
            if ((_b = this.promptSettings.additions) === null || _b === void 0 ? void 0 : _b[componentId]) {
                content += '\n' + this.promptSettings.additions[componentId];
            }
            // Add the component to the system prompt
            systemPrompt += trimMultilineString(content) + ('\n\n');
        }
        if (this.debugMode) {
            console.group('AiAgent System Prompt Debug');
            console.log('System Prompt:', systemPrompt);
            console.groupEnd();
        }
        return systemPrompt;
    }
    trimContext(prompt, promptContainerText = '') {
        var _a, _b, _c, _d, _e;
        let contentBeforePrompt = '';
        let contentAfterPrompt = '';
        const splitText = promptContainerText !== null && promptContainerText !== void 0 ? promptContainerText : prompt;
        const view = (_d = (_c = (_b = (_a = this.editor) === null || _a === void 0 ? void 0 : _a.editing) === null || _b === void 0 ? void 0 : _b.view) === null || _c === void 0 ? void 0 : _c.domRoots) === null || _d === void 0 ? void 0 : _d.get('main');
        const context = (_e = view === null || view === void 0 ? void 0 : view.innerText) !== null && _e !== void 0 ? _e : '';
        const matchIndex = context.indexOf(splitText);
        const nextEnterIndex = context.indexOf('\n', matchIndex);
        const firstNewlineIndex = nextEnterIndex !== -1 ? nextEnterIndex : matchIndex + splitText.length;
        const beforeNewline = context.substring(0, firstNewlineIndex);
        const afterNewline = context.substring(firstNewlineIndex + 1);
        const contextParts = [beforeNewline, afterNewline];
        const allocatedEditorContextToken = Math.floor(this.contextSize * this.editorContextRatio);
        if (contextParts.length > 1) {
            if (contextParts[0].length < contextParts[1].length) {
                contentBeforePrompt = extractEditorContent(contextParts[0], allocatedEditorContextToken / 2, true, this.editor);
                contentAfterPrompt = extractEditorContent(contextParts[1], allocatedEditorContextToken - contentBeforePrompt.length / 4, false, this.editor);
            }
            else {
                contentAfterPrompt = extractEditorContent(contextParts[1], allocatedEditorContextToken / 2, false, this.editor);
                contentBeforePrompt = extractEditorContent(contextParts[0], allocatedEditorContextToken - contentAfterPrompt.length / 4, true, this.editor);
            }
        }
        // Combine the trimmed context with the cursor placeholder
        const escapedPrompt = prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
        contentBeforePrompt = contentBeforePrompt.trim()
            .replace(new RegExp(escapedPrompt.slice(1)), '@@@cursor@@@')
            .replace('/@@@cursor@@@', '@@@cursor@@@'); // Remove forward slash if present
        const trimmedContext = `${contentBeforePrompt}\n${contentAfterPrompt}`;
        return trimmedContext.trim();
    }
    formatFinalPrompt(request, context, markDownContents, isEditorEmpty, selectedContent) {
        if (this.debugMode) {
            console.group('formatFinalPrompt Debug');
            console.log('Request:', request);
            console.log('Context:', context);
            console.log('MarkDownContents:', markDownContents);
            console.log('IsEditorEmpty:', isEditorEmpty);
        }
        const contentLanguageCode = this.editor.locale.contentLanguage;
        const corpus = [];
        // Task Section
        corpus.push('<TASK>');
        corpus.push(request);
        corpus.push('</TASK>');
        // Context Section
        if (context === null || context === void 0 ? void 0 : context.length) {
            corpus.push('\n<CONTEXT>');
            corpus.push(context);
            corpus.push('</CONTEXT>');
        }
        // if ( selectedContent ) {
        // 	corpus.push( `Selected Content:\n"""\n${ selectedContent }\n"""\n` );
        // }
        // Markdown Content Section
        if (markDownContents === null || markDownContents === void 0 ? void 0 : markDownContents.length) {
            corpus.push('\n<REFERENCE_CONTENT>');
            for (const content of markDownContents) {
                corpus.push(`<SOURCE url="${content.url}">\n${content.content}\n</SOURCE>`);
            }
            corpus.push('</REFERENCE_CONTENT>');
            corpus.push('\n<REFERENCE_GUIDELINES>');
            corpus.push(trimMultilineString(`
				Use information from provided markdown to generate new text.
				Do not copy content verbatim.
				Ensure natural flow with existing context.
				Avoid markdown formatting in response.
				Consider whole markdown as single source.
				Generate requested percentage of content.
			`));
            corpus.push('</REFERENCE_GUIDELINES>');
        }
        // Instructions Section
        corpus.push('\n<INSTRUCTIONS>');
        corpus.push(`The response must follow the language code - ${contentLanguageCode}.`);
        corpus.push('</INSTRUCTIONS>');
        // Context-Specific Instructions
        if (!isEditorEmpty) {
            corpus.push('\n<CONTEXT_REQUIREMENTS>');
            corpus.push(trimMultilineString(`
				Replace "@@@cursor@@@" with contextually appropriate content.
				Replace ONLY @@@cursor@@@ - surrounding text is READ-ONLY.
				NEVER copy or paraphrase context text.
				Verify zero phrase duplication.
				Analyze the CONTEXT section thoroughly 
				to understand the existing content and its style.
				Generate a response that seamlessly integrates 
				with the existing content.
				Determine the appropriate tone and style based
				on the context. Ensure the response flows 
				naturally with the existing content.

			`));
            corpus.push('</CONTEXT_REQUIREMENTS>');
        }
        // Debug Output
        if (this.debugMode) {
            console.group('AiAgent Final Prompt Debug');
            console.log('Final Prompt:', corpus.join('\n'));
            console.groupEnd();
        }
        return corpus.map(text => removeLeadingSpaces(text)).join('\n');
    }
    async generateMarkDownForUrls(urls) {
        try {
            const markdownContents = [];
            for (const url of urls) {
                try {
                    const content = await fetchUrlContent(url);
                    if (content) {
                        markdownContents.push({
                            content,
                            url,
                            tokenCount: countTokens(content)
                        });
                    }
                }
                catch (error) {
                    if (this.debugMode) {
                        console.error(`Failed to fetch content from ${url}:`, error);
                    }
                    aiAgentContext.showError(`Failed to fetch content from ${url}`);
                }
            }
            return this.allocateTokensToFetchedContent(this.getSystemPrompt(), markdownContents);
        }
        catch (error) {
            if (this.debugMode) {
                console.error('Error generating markdown content:', error);
            }
            aiAgentContext.showError('Failed to generate markdown content');
            return [];
        }
    }
    allocateTokensToFetchedContent(prompt, fetchedContent) {
        var _a, _b, _c, _d, _e, _f;
        const editorContent = (_f = (_e = (_d = (_c = (_b = (_a = this.editor) === null || _a === void 0 ? void 0 : _a.editing) === null || _b === void 0 ? void 0 : _b.view) === null || _c === void 0 ? void 0 : _c.domRoots) === null || _d === void 0 ? void 0 : _d.get('main')) === null || _e === void 0 ? void 0 : _e.innerText) !== null && _f !== void 0 ? _f : '';
        const editorToken = Math.min(Math.floor(this.contextSize * this.editorContextRatio), countTokens(editorContent));
        const availableLimit = this.contextSize - editorToken;
        if (availableLimit === 0 || !fetchedContent.length) {
            return fetchedContent;
        }
        const tokensPerContent = Math.floor(availableLimit / fetchedContent.length);
        return fetchedContent.map(content => ({
            ...content,
            content: trimLLMContentByTokens(content.content, tokensPerContent)
        }));
    }
}
