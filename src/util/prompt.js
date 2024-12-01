import { aiAgentContext } from '../aiagentcontext.js';
import { removeLeadingSpaces, extractEditorContent } from './text-utils.js';
import { countTokens, trimLLMContentByTokens } from './token-utils.js';
import { getAllowedHtmlTags } from './html-utils.js';
import { fetchUrlContent } from './url-utils.js';
export class PromptHelper {
    constructor(editor, options = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this.editor = editor;
        const config = editor.config.get('aiAgent');
        this.contextSize = (_a = config.contextSize) !== null && _a !== void 0 ? _a : 4000;
        this.responseOutputFormat = (_c = (_b = config.promptSettings) === null || _b === void 0 ? void 0 : _b.outputFormat) !== null && _c !== void 0 ? _c : [];
        this.responseContextData = (_e = (_d = config.promptSettings) === null || _d === void 0 ? void 0 : _d.contextData) !== null && _e !== void 0 ? _e : [];
        this.responseFilters = (_g = (_f = config.promptSettings) === null || _f === void 0 ? void 0 : _f.filters) !== null && _g !== void 0 ? _g : [];
        this.debugMode = (_h = config.debugMode) !== null && _h !== void 0 ? _h : false;
        this.editorContextRatio = (_j = options.editorContextRatio) !== null && _j !== void 0 ? _j : 0.3;
    }
    getSystemPrompt(isInlineResponse = false) {
        const corpus = [];
        // Core system instructions
        corpus.push(`
			You will be provided with a partially written article with 
			"""@@@cursor@@@""" somewhere under a CONTEXT section, user input under a 
			TASK section, and sometimes there will be articles (delimited with 
			marked-up language) separated by Starting Markdown Content \${number}
			and Ending Markdown Content \${index} with certain instructions to follow 
			while generating a response under an INSTRUCTION section.

			If there is an article with """Starting Markdown Content""", your task is 
			to use that provided information solely to respond to the user request in 
			the TASK section.

			Follow these step-by-step instructions to respond to user inputs:
			1. Analyze the CONTEXT section thoroughly to understand the existing
			content and its style
			2. Identify the specific requirements from the TASK section
			3. If markdown content is present, extract relevant information that
			aligns with the task
			4. Determine the appropriate tone and style based on the context
			5. Generate a response that seamlessly integrates with the existing content
			6. Format the response according to the HTML and structural requirements
			7. Verify that the response meets all formatting and content guidelines

			Core Response Generation Rules:
			1. Replace "@@@cursor@@@" with contextually appropriate content
			2. Maintain consistency with the surrounding text's tone and style
			3. Ensure the response flows naturally with the existing content
			4. Avoid repeating context verbatim
			5. Generate original content that adds value
			6. Follow the specified language requirements
			7. Adhere to all HTML formatting rules

			Language and Tone Guidelines:
			1. Match the formality level of the surrounding content
			2. Maintain consistent voice throughout the response
			3. Use appropriate technical terminology when relevant
			4. Ensure proper grammar and punctuation
			5. Avoid overly complex sentence structures
			6. Keep the tone engaging and reader-friendly
			7. Adapt style based on content type (academic, casual, technical, etc.)

			Content Structure Rules:
			1. Organize information logically
			2. Use appropriate paragraph breaks
			3. Maintain consistent formatting
			4. Follow document hierarchy
			5. Use appropriate list structures when needed
			6. Ensure proper content flow
			7. Respect existing document structure

			HTML Formatting Requirements:
			1. Generate valid HTML snippets only
			2. Use only the following allowed tags: ${getAllowedHtmlTags(this.editor).join(', ')}
			3. Ensure proper tag nesting
			4. Avoid empty elements
			5. Use semantic HTML where appropriate
			6. Maintain clean, readable HTML structure
			7. Follow block-level element rules
			8. Properly close all tags
			9. No inline styles unless specified
			10. No script or style tags
			11. First word must be a valid HTML tag
			12. Block elements must not contain other block elements
		`);
        // Inline response handling
        if (isInlineResponse) {
            corpus.push(`
				Inline Content Specific Rules:
				1. Determine content type (list, table, or inline)
				2. Format according to content type:
				   - List items: <li> within <ol> or <ul>
				   - Table cells: Plain text with <p> tags
				   - Inline content: Single <p> tag
				3. Ensure seamless integration with existing structure
				4. Maintain proper nesting
				5. Follow context-specific formatting
				6. Preserve existing content flow
				7. Match surrounding content style
			`);
        }
        // Image handling
        if (getAllowedHtmlTags(this.editor).includes('img')) {
            corpus.push(`
				Image Element Requirements:
				1. Every <img> must have src and alt attributes
				2. Format src URLs as: https://placehold.co/600x400?text=[alt_text]
				3. Alt text requirements:
				   - Descriptive and meaningful
				   - Matches src URL text (spaces as +)
				   - No special characters
				4. Example: <img src="https://placehold.co/600x400?text=Beautiful+Sunset" alt="Beautiful Sunset">
				5. Proper image placement
				6. Contextually relevant images
				7. Appropriate image descriptions
			`);
        }
        // Response format handling
        if (this.responseOutputFormat.length) {
            corpus.push(`
				Output Format Requirements:
				${this.responseOutputFormat.join('\n')}
			`);
        }
        const systemPrompt = corpus.map(text => removeLeadingSpaces(text)).join('\n\n');
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
        contentBeforePrompt = contentBeforePrompt.trim().replace(new RegExp(escapedPrompt.slice(1)), '@@@cursor@@@');
        const trimmedContext = `${contentBeforePrompt}\n${contentAfterPrompt}`;
        return trimmedContext.trim();
    }
    formatFinalPrompt(request, context, markDownContents, isEditorEmpty) {
        if (this.debugMode) {
            console.group('formatFinalPrompt Debug');
            console.log('Request:', request);
            console.log('Context:', context);
            console.log('MarkDownContents:', markDownContents);
            console.log('IsEditorEmpty:', isEditorEmpty);
        }
        const contentLanguageCode = this.editor.locale.contentLanguage;
        const corpus = [];
        // Context and Task
        if (!isEditorEmpty) {
            corpus.push(`CONTEXT:\n"""\n${context}\n"""\n`);
        }
        corpus.push(`TASK:\n"""\n${request}\n"""\n`);
        // Markdown Content Section
        if (markDownContents.length) {
            corpus.push(`
				Refer to following markdown content as a source of information, 
				but generate new text that fits the given context & task.

				${markDownContents.map((markdown, index) => `
					------------ Starting Markdown Content ${index + 1} ------------
					${markdown.content}
					------------ Ending Markdown Content ${index + 1} ------------
				`).join('\n')}
			`);
            // Markdown Usage Instructions
            corpus.push(`
				Markdown Content Guidelines:
				1. Use information from provided markdown to generate new text
				2. Do not copy content verbatim
				3. Ensure natural flow with existing context
				4. Avoid markdown formatting in response
				5. Consider whole markdown as single source
				6. Generate requested percentage of content
			`);
        }
        // Instructions Section
        corpus.push('\nINSTRUCTIONS:\n');
        corpus.push(`The response must follow the language code - ${contentLanguageCode}.`);
        // Response Output Format
        if (this.responseOutputFormat.length) {
            corpus.push(`
				Output Format Requirements:
				${this.responseOutputFormat.join('\n')}
			`);
        }
        // Response Filters
        if (this.responseFilters.length) {
            corpus.push(...this.responseFilters);
        }
        else {
            corpus.push('The response should directly follow the context, avoiding any awkward transitions or noticeable gaps.');
        }
        // Context-Specific Instructions
        if (!isEditorEmpty) {
            corpus.push(`
				Context Integration Requirements:
				1. Maintain seamless connection with surrounding text
				2. Ensure smooth and natural transitions
				3. Do not modify original text except @@@cursor@@@ replacement
				4. Match existing style and tone
				5. Preserve document structure
			`);
        }
        // Additional Context Data
        if (this.responseContextData.length) {
            corpus.push(...this.responseContextData);
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
