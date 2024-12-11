import { aiAgentContext } from './aiagentcontext.js';
import { PromptHelper } from './util/prompt.js';
import { HtmlParser } from './util/htmlparser.js';
import { ButtonView } from 'ckeditor5/src/ui.js';
import { env } from 'ckeditor5/src/utils.js';
import { ALL_MODERATION_FLAGS, MODERATION_URL } from './const.js';
export default class AiAgentService {
    /**
     * Initializes the AiAgentService with the provided editor and configuration settings.
     *
     * @param editor - The CKEditor instance to be used with the AI assist service.
     */
    constructor(editor) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this.aiAgentFeatureLockId = Symbol('ai-agent-feature');
        this.buffer = '';
        this.openTags = [];
        this.isInlineInsertion = false;
        this.abortGeneration = false;
        this.disableFlags = [];
        this.editor = editor;
        this.promptHelper = new PromptHelper(editor);
        this.htmlParser = new HtmlParser(editor);
        const config = editor.config.get('aiAgent');
        this.aiModel = config.model;
        this.apiKey = config.apiKey;
        this.endpointUrl = config.endpointUrl;
        this.temperature = config.temperature;
        this.timeOutDuration = (_a = config.timeOutDuration) !== null && _a !== void 0 ? _a : 45000;
        this.maxTokens = (_b = config.maxOutputTokens) !== null && _b !== void 0 ? _b : config.maxTokens;
        this.retryAttempts = config.retryAttempts;
        this.stopSequences = config.stopSequences;
        this.streamContent = (_c = config.streamContent) !== null && _c !== void 0 ? _c : true;
        this.moderationKey = (_e = (_d = config.moderation) === null || _d === void 0 ? void 0 : _d.key) !== null && _e !== void 0 ? _e : '';
        this.moderationEnable = (_g = (_f = config.moderation) === null || _f === void 0 ? void 0 : _f.enable) !== null && _g !== void 0 ? _g : false;
        this.disableFlags = (_j = (_h = config.moderation) === null || _h === void 0 ? void 0 : _h.disableFlags) !== null && _j !== void 0 ? _j : [];
    }
    /**
     * Handles the slash command input from the user, processes it, and interacts with the AI model.
     *
     * @returns A promise that resolves when the command has been processed.
     */
    async handleSlashCommand() {
        const editor = this.editor;
        const model = editor.model;
        const mapper = editor.editing.mapper;
        const view = editor.editing.view;
        const root = model.document.getRoot();
        let content;
        let parentEquivalentHTML;
        let parent;
        const position = model.document.selection.getLastPosition();
        if (position && root) {
            parent = position.parent;
            const inlineSlash = parent.name === 'inline-slash' ? parent : undefined;
            const equivalentView = mapper.toViewElement(parent);
            parentEquivalentHTML = equivalentView ? view.domConverter.mapViewToDom(equivalentView) : undefined;
            if (inlineSlash) {
                this.isInlineInsertion = true;
                const startingPath = inlineSlash.getPath();
                const endingPath = position === null || position === void 0 ? void 0 : position.path;
                const startPosition = model.createPositionFromPath(root, startingPath); // Example path
                const endPosition = model.createPositionFromPath(root, endingPath); // Example path
                const range = model.createRange(startPosition, endPosition);
                parentEquivalentHTML = (equivalentView === null || equivalentView === void 0 ? void 0 : equivalentView.parent) ?
                    view.domConverter.mapViewToDom(equivalentView.parent) :
                    undefined;
                content = '';
                for (const item of range.getItems()) {
                    if (item.is('$textProxy')) {
                        content += item.data.trim(); // Add text data
                    }
                }
            }
            else if (parentEquivalentHTML) {
                content = parentEquivalentHTML === null || parentEquivalentHTML === void 0 ? void 0 : parentEquivalentHTML.innerText;
            }
        }
        if (this.moderationEnable) {
            const moderateContent = await this.moderateContent(content !== null && content !== void 0 ? content : '');
            if (!moderateContent) {
                return;
            }
        }
        try {
            const domSelection = window.getSelection();
            const domRange = domSelection === null || domSelection === void 0 ? void 0 : domSelection.getRangeAt(0);
            const rect = domRange.getBoundingClientRect();
            aiAgentContext.showLoader(rect);
            const gptPrompt = await this.generateGptPromptBasedOnUserPrompt(content !== null && content !== void 0 ? content : '', parentEquivalentHTML === null || parentEquivalentHTML === void 0 ? void 0 : parentEquivalentHTML.innerText);
            if (parent && gptPrompt) {
                await this.fetchAndProcessGptResponse(gptPrompt, parent);
            }
        }
        catch (error) {
            console.error('Error handling slash command:', error);
            throw error;
        }
        finally {
            this.isInlineInsertion = false;
            aiAgentContext.hideLoader();
        }
    }
    /**
     * Moderates the input content using OpenAI's moderation API to check for inappropriate content.
     *
     * @param input - The text content to be moderated
     * @returns A promise that resolves to:
     * - `true` if content is acceptable or if moderation fails (fail-open)
     * - `false` if content is flagged as inappropriate
     *
     * @throws Shows user-friendly error messages via aiAgentContext for:
     * - Flagged content ("Cannot process your query...")
     * - API errors ("Error in content moderation")
     */
    async moderateContent(input) {
        var _a;
        if (!this.moderationKey) {
            return true;
        }
        const editor = this.editor;
        const t = editor.t;
        const controller = new AbortController();
        // Set timeout for moderation request
        const timeoutId = setTimeout(() => controller.abort(), this.timeOutDuration);
        try {
            const response = await fetch(MODERATION_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.moderationKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ input }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!((_a = data === null || data === void 0 ? void 0 : data.results) === null || _a === void 0 ? void 0 : _a[0])) {
                throw new Error('Invalid moderation response format');
            }
            const flags = ALL_MODERATION_FLAGS.filter(flag => !this.disableFlags.includes(flag));
            if (data.results[0].flagged) {
                let error = false;
                const categories = data.results[0].categories;
                for (let index = 0; index < flags.length; index++) {
                    const flag = flags[index];
                    if (flags.includes(flag)) {
                        if (categories[flag]) {
                            error = true;
                            break;
                        }
                    }
                }
                if (error) {
                    aiAgentContext.showError(t('I\'m sorry, but I cannot assist with that request.'));
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            console.error('Moderation error:', error);
            // Handle specific error cases
            if (error instanceof TypeError) {
                aiAgentContext.showError(t('Network error during content moderation'));
            }
            else if (error instanceof DOMException && error.name === 'AbortError') {
                aiAgentContext.showError(t('Content moderation timed out'));
            }
            else {
                aiAgentContext.showError(t('Error in content moderation'));
            }
            // Fail open for moderation errors
            return true;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Fetches and processes the GPT response based on the provided prompt and parent element.
     *
     * @param prompt - The prompt to send to the GPT model.
     * @param parent - The parent element in the editor where the response will be inserted.
     * @param retries - The number of retry attempts for the API call (default is the configured retry attempts).
     * @returns A promise that resolves when the response has been processed.
     */
    async fetchAndProcessGptResponse(prompt, parent, retries = this.retryAttempts) {
        var _a, _b, _c;
        console.log('Starting fetchAndProcessGptResponse');
        const editor = this.editor;
        const t = editor.t;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeOutDuration);
        let buffer = '';
        let contentBuffer = '';
        const blockID = `ai-${new Date().getTime()}`;
        try {
            const response = await fetch(this.endpointUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.aiModel,
                    messages: [
                        { role: 'system', content: this.promptHelper.getSystemPrompt(this.isInlineInsertion) },
                        { role: 'user', content: prompt }
                    ],
                    temperature: this.temperature,
                    max_tokens: this.maxTokens,
                    stop: this.stopSequences,
                    stream: true
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error('Fetch failed');
            }
            aiAgentContext.hideLoader();
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            this.clearParentContent(parent);
            // this.editor.enableReadOnlyMode( this.aiAgentFeatureLockId );
            let insertParent = true;
            this.cancelGenerationButton(blockID, controller);
            editor.model.change(writer => {
                var _a;
                const position = editor.model.document.selection.getLastPosition();
                if (position) {
                    const aiTag = writer.createElement('ai-tag', {
                        id: blockID
                    });
                    const parent = position.parent;
                    if (parent) {
                        if (((_a = parent.parent) === null || _a === void 0 ? void 0 : _a.name) === 'tableCell') {
                            insertParent = false;
                        }
                        else if (parent.getAttribute('listType') === 'bulleted') {
                            insertParent = false;
                        }
                    }
                    let parentContent = '';
                    for (const child of parent.getChildren()) {
                        if (child.is('$text')) {
                            parentContent += child.data;
                        }
                    }
                    const parentPosition = parentContent ? writer.createPositionAfter(parent) : writer.createPositionBefore(parent);
                    writer.insert(aiTag, insertParent ? parentPosition : position);
                    const newPosition = writer.createPositionAt(aiTag, 'end');
                    writer.setSelection(newPosition);
                }
            });
            console.log('Starting to process response');
            for (;;) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('Finished reading response');
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                let newlineIndex;
                while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.slice(0, newlineIndex).trim();
                    buffer = buffer.slice(newlineIndex + 1);
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(5).trim();
                        if (jsonStr === '[DONE]') {
                            console.log('Received [DONE] signal');
                            break;
                        }
                        try {
                            const data = JSON.parse(jsonStr);
                            const content = (_b = (_a = data.choices[0]) === null || _a === void 0 ? void 0 : _a.delta) === null || _b === void 0 ? void 0 : _b.content;
                            if (content !== null && content !== undefined) {
                                contentBuffer += content;
                            }
                            await this.updateContent(contentBuffer, blockID, insertParent);
                        }
                        catch (parseError) {
                            console.warn('Error parsing JSON:', parseError);
                        }
                    }
                }
            }
            this.processCompleted(blockID);
        }
        catch (error) {
            if (this.abortGeneration) {
                return;
            }
            console.error('Error in fetchAndProcessGptResponse:', error);
            const errorIdentifier = ((error === null || error === void 0 ? void 0 : error.message) || '').trim() || ((error === null || error === void 0 ? void 0 : error.name) || '').trim();
            const isRetryableError = [
                'AbortError',
                'ReadableStream not supported',
                'AiAgent: Fetch failed'
            ].includes(errorIdentifier);
            if (retries > 0 && isRetryableError) {
                console.warn(`Retrying... (${retries} attempts left)`);
                return await this.fetchAndProcessGptResponse(prompt, parent, retries - 1);
            }
            let errorMessage;
            switch ((error === null || error === void 0 ? void 0 : error.name) || ((_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.trim())) {
                case 'ReadableStream not supported':
                    errorMessage = t('Browser does not support readable streams');
                    break;
                case 'AiAgent: Fetch failed':
                    errorMessage = t('We couldn\'t connect to the AI. Please check your internet');
                    break;
                default:
                    errorMessage = t('We couldn\'t connect to the AI. Please check your internet');
            }
            aiAgentContext.showError(errorMessage);
        }
        finally {
            this.editor.disableReadOnlyMode(this.aiAgentFeatureLockId);
        }
    }
    /**
     * Creates and configures a cancel generation button with keyboard shortcut support.
     *
     * @param blockID - Unique identifier for the AI generation block
     * @param controller - AbortController to cancel the ongoing AI generation
     * @private
     */
    cancelGenerationButton(blockID, controller) {
        const editor = this.editor;
        const t = editor.t;
        const view = new ButtonView();
        let label = t('Cancel Generation');
        if (env.isMac) {
            label = t('\u2318 + \u232B Cancel Generation');
        }
        if (env.isWindows) {
            label = t('Ctrl + \u232B Cancel Generation');
        }
        view.set({
            label,
            withText: true,
            class: 'ck-cancel-request-button'
        });
        view.on('execute', () => {
            this.abortGeneration = true;
            controller.abort();
            this.processCompleted(blockID);
        });
        view.render();
        editor.keystrokes.set('Ctrl+Backspace', (keyEvtData, cancel) => {
            if (keyEvtData.ctrlKey || keyEvtData.metaKey) {
                this.abortGeneration = true;
                controller.abort();
                this.processCompleted(blockID);
            }
            cancel();
        });
        if (editor.ui.view.element && view.element) {
            const panelContent = editor.ui.view.element.querySelector('.ck-sticky-panel__content .ck-toolbar__items');
            if (panelContent) {
                panelContent.append(view.element);
            }
        }
        setTimeout(() => view.set({ class: 'ck-cancel-request-button visible' }), 2000);
    }
    /**
     * Handles cleanup after AI generation is completed or cancelled.
     * Removes the cancel button from the UI and cleans up the temporary AI tag from editor content.
     *
     * @param blockID - Unique identifier for the AI generation block to be cleaned up
     * @private
     */
    processCompleted(blockID) {
        const editor = this.editor;
        if (editor.ui.view.element) {
            const cancelButton = editor.ui.view.element.querySelector('.ck-cancel-request-button');
            if (cancelButton) {
                cancelButton.remove();
            }
        }
        const editorData = editor.getData();
        let editorContent = editorData.replace(`<ai-tag id="${blockID}">`, '');
        editorContent = editorContent.replace('</ai-tag>', '');
        editor.setData(editorContent);
    }
    /**
     * Updates the content of an AI-generated block in the editor.
     *
     * @param newHtml - The new HTML content to insert
     * @param blockID - The unique identifier of the AI block to update
     * @param insertParent - Whether to insert at parent level or child level
     * @returns Promise that resolves when the update is complete
     * @private
     */
    async updateContent(newHtml, blockID, insertParent) {
        const editor = this.editor;
        editor.model.change(writer => {
            const root = editor.model.document.getRoot();
            let targetElement = null;
            if (root) {
                for (const child of root.getChildren()) {
                    const childElement = child;
                    if (insertParent) {
                        if (childElement.is('element', 'ai-tag') && childElement.getAttribute('id') === blockID) {
                            targetElement = childElement;
                            break;
                        }
                    }
                    else {
                        for (const innerChild of childElement.getChildren()) {
                            if (innerChild.is('element', 'ai-tag') && innerChild.getAttribute('id') === blockID) {
                                targetElement = innerChild;
                                break;
                            }
                        }
                    }
                }
                if (targetElement) {
                    const range = editor.model.createRangeIn(targetElement);
                    writer.remove(range);
                    const viewFragment = editor.data.processor.toView(newHtml);
                    const modelFragment = editor.data.toModel(viewFragment);
                    writer.insert(modelFragment, targetElement, 'end');
                }
            }
        });
        await new Promise(resolve => setTimeout(resolve));
    }
    /**
     * Processes the provided content and inserts it into the specified parent element.
     * Depending on the feature flag, it either uses a simple HTML insertion method
     * or processes the content as HTML.
     *
     * @param content - The content to be processed and inserted.
     * @param parent - The parent element in the editor where the content will be inserted.
     */
    async processContent(content) {
        try {
            console.log('--- Start of processContent ---');
            console.log('Processing content:', content, this.isInlineInsertion);
            if (this.isInlineInsertion) {
                const position = this.editor.model.document.selection.getLastPosition();
                const tempParagraph = document.createElement('div');
                tempParagraph.innerHTML = content;
                await this.htmlParser.insertAsText(tempParagraph || '', position !== null && position !== void 0 ? position : undefined, this.streamContent);
            }
            else {
                if (this.streamContent) {
                    // Existing complex content processing logic
                    await this.proceedHtmlResponse(content);
                }
                else {
                    // Use the simple HTML insertion method
                    await this.htmlParser.insertSimpleHtml(content);
                }
            }
            console.log('--- End of processContent ---');
        }
        catch (error) {
            console.error(error);
        }
    }
    /**
     * Processes the provided HTML string and inserts its content into the editor.
     * It creates a temporary div to parse the HTML and handles different types of
     * elements (lists, tables, headings, etc.) accordingly.
     *
     * @param html - The HTML string to be processed and inserted into the editor.
     */
    async proceedHtmlResponse(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        for (const child of Array.from(tempDiv.childNodes)) {
            const element = child;
            if (element.nodeType === Node.ELEMENT_NODE) {
                const elementName = element.tagName.toLowerCase();
                const isStreamingNotAllow = [
                    'table', 'blockquote', 'pre', 'img', 'form', 'figure'
                ].includes(elementName);
                if (isStreamingNotAllow) {
                    await this.htmlParser.insertSimpleHtml(element.outerHTML);
                }
                else if (elementName === 'ul' || elementName === 'ol') {
                    await this.htmlParser.insertAsText(element, undefined, true, true);
                }
                else {
                    await this.htmlParser.insertAsText(element, undefined, true);
                }
            }
            else if (element.nodeType === Node.TEXT_NODE && element.textContent) {
                const tempParagraph = document.createElement('div');
                tempParagraph.innerText = element.textContent;
                await this.htmlParser.insertAsText(tempParagraph, undefined, true);
            }
        }
    }
    /**
     * Clears the content of the specified parent element in the editor.
     *
     * @param parent - The parent element whose content will be cleared.
     */
    clearParentContent(parent) {
        const editor = this.editor;
        const model = editor.model;
        const root = model.document.getRoot();
        const position = model.document.selection.getLastPosition();
        const inlineSlash = Array.from(parent.getChildren()).find((child) => child.name === 'inline-slash');
        if (root && position) {
            editor.model.change(writer => {
                const startingPath = (inlineSlash === null || inlineSlash === void 0 ? void 0 : inlineSlash.getPath()) || parent.getPath();
                const range = model.createRange(model.createPositionFromPath(root, startingPath), model.createPositionFromPath(root, position.path));
                writer.remove(range);
                writer.setSelection(model.createPositionFromPath(root, startingPath));
            });
        }
    }
    /**
     * Generates a GPT prompt based on the user's input and the current context in the editor.
     * This method processes the input prompt, extracts any URLs, and formats the final prompt
     * to be sent to the GPT model. It also handles the case where the editor is empty.
     *
     * @param prompt - The user's input prompt, typically starting with a slash.
     * @param promptContainerText - Optional text from the container that may provide additional context.
     * @returns A promise that resolves to the generated GPT prompt string or null if an error occurs.
    */
    async generateGptPromptBasedOnUserPrompt(prompt, promptContainerText) {
        try {
            const context = this.promptHelper.trimContext(prompt, promptContainerText);
            const request = prompt.slice(1); // Remove the leading slash
            let markDownContents = [];
            const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
            const urls = prompt.match(urlRegex);
            if (Array.isArray(urls) && urls.length) {
                const formattedUrl = urls.map(url => {
                    return url.replace(/[,.]$/, '');
                });
                markDownContents = await this.promptHelper.generateMarkDownForUrls(formattedUrl);
                markDownContents = this.promptHelper.allocateTokensToFetchedContent(prompt, markDownContents);
            }
            const isEditorEmpty = context === '@@@cursor@@@';
            return this.promptHelper.formatFinalPrompt(request, context, markDownContents, isEditorEmpty);
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }
}
