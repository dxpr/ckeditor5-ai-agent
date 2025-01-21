import { aiAgentContext } from './aiagentcontext.js';
import { PromptHelper } from './util/prompt.js';
import { HtmlParser } from './util/htmlparser.js';
import { ButtonView } from 'ckeditor5/src/ui.js';
import { env } from 'ckeditor5/src/utils.js';
import { ALL_MODERATION_FLAGS, MODERATION_URL } from './const.js';
import { getErrorMessages } from './util/translations.js';
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
    async handleSlashCommand(command) {
        const editor = this.editor;
        const model = editor.model;
        const mapper = editor.editing.mapper;
        const view = editor.editing.view;
        const root = model.document.getRoot();
        let content;
        let selectedContent;
        let parentEquivalentHTML;
        let parent;
        const position = model.document.selection.getLastPosition();
        if (position && root) {
            parent = position.parent;
            const inlineSlash = parent.name === 'inline-slash' ? parent : undefined;
            const equivalentView = mapper.toViewElement(parent);
            parentEquivalentHTML = equivalentView ? view.domConverter.mapViewToDom(equivalentView) : undefined;
            if (inlineSlash) {
                editor.model.change(writer => {
                    const endPosition = writer.createPositionAt(inlineSlash, 'end');
                    writer.setSelection(endPosition);
                });
                this.isInlineInsertion = true;
                const startPosition = editor.model.createPositionAt(inlineSlash, 0);
                const endPosition = editor.model.createPositionAt(inlineSlash, 'end');
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
        if (command) {
            const selection = model.document.selection;
            const selectedContentFragment = model.getSelectedContent(selection);
            const viewFragment = editor.data.toView(selectedContentFragment);
            const html = editor.data.processor.toData(viewFragment);
            content = command;
            selectedContent = html;
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
            const gptPrompt = await this.generateGptPromptBasedOnUserPrompt(content !== null && content !== void 0 ? content : '', parentEquivalentHTML === null || parentEquivalentHTML === void 0 ? void 0 : parentEquivalentHTML.innerText, selectedContent);
            if (parent && gptPrompt) {
                await this.fetchAndProcessGptResponse(!!command, gptPrompt, parent);
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
        var _a, _b;
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
                const error = await this.getError(response);
                throw new Error(error);
            }
            const data = await response.json();
            if (!((_a = data === null || data === void 0 ? void 0 : data.results) === null || _a === void 0 ? void 0 : _a[0])) {
                throw new Error(t('Invalid moderation response format'));
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
            let errorMessage = t('We couldn\'t connect to the AI. Please check your internet');
            const jsonMessage = this.isValidJSON(error === null || error === void 0 ? void 0 : error.message);
            if (jsonMessage) {
                const errorObj = JSON.parse(error === null || error === void 0 ? void 0 : error.message);
                const status = errorObj.status;
                errorMessage = getErrorMessages(status, editor);
            }
            else {
                errorMessage = (_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.trim();
                if (errorMessage === 'ReadableStream not supported') {
                    errorMessage = t('Browser does not support readable streams');
                }
            }
            aiAgentContext.showError(errorMessage);
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
    async fetchAndProcessGptResponse(command, prompt, parent, retries = this.retryAttempts) {
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
                const error = await this.getError(response);
                throw new Error(error);
            }
            aiAgentContext.hideLoader();
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            // this.editor.enableReadOnlyMode( this.aiAgentFeatureLockId );
            this.cancelGenerationButton(blockID, controller);
            const undoCommand = editor.commands.get('undo');
            if (undoCommand) {
                undoCommand.on('execute', () => {
                    const editorData = editor.getData();
                    if (editorData.indexOf('ai-tag') > -1) {
                        editor.execute('undo');
                    }
                });
            }
            const redoCommand = editor.commands.get('redo');
            if (redoCommand) {
                redoCommand.on('execute', () => {
                    const editorData = editor.getData();
                    if (editorData.indexOf('ai-tag') > -1) {
                        editor.execute('redo');
                    }
                });
            }
            editor.model.change(writer => {
                var _a, _b, _c;
                const position = this.editor.model.document.selection.getLastPosition();
                let newPosition;
                if (position) {
                    if ((position === null || position === void 0 ? void 0 : position.parent.name) === 'inline-slash') {
                        if ((_a = position === null || position === void 0 ? void 0 : position.parent) === null || _a === void 0 ? void 0 : _a.parent) {
                            newPosition = writer.createPositionAt(position.parent.parent, 'after');
                        }
                        if (position === null || position === void 0 ? void 0 : position.parent) {
                            const parentJson = (_c = (_b = position === null || position === void 0 ? void 0 : position.parent) === null || _b === void 0 ? void 0 : _b.parent) === null || _c === void 0 ? void 0 : _c.toJSON();
                            if (parentJson.children.length > 1) {
                                const positionInline = writer.createPositionAt(position.parent, 'after');
                                const aiTagInline = writer.createElement('ai-tag', {
                                    id: `${blockID}-inline`
                                });
                                writer.insert(aiTagInline, positionInline);
                            }
                        }
                    }
                    else {
                        const aiTagInline = writer.createElement('ai-tag', {
                            id: `${blockID}-inline`
                        });
                        writer.insert(aiTagInline, position);
                        newPosition = writer.createPositionAt(position.parent, 'after');
                    }
                    if (newPosition) {
                        const aiTag = writer.createElement('ai-tag', {
                            id: blockID
                        });
                        writer.insert(aiTag, newPosition);
                    }
                }
            });
            this.clearParentContent(parent, command);
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
                            if (data.method === 'agent/status') {
                                await this.animatedStatusMessages(data.params.status, blockID);
                            }
                            else {
                                const content = (_b = (_a = data.choices[0]) === null || _a === void 0 ? void 0 : _a.delta) === null || _b === void 0 ? void 0 : _b.content;
                                if (content !== null && content !== undefined) {
                                    contentBuffer += content;
                                }
                                await this.updateContent(contentBuffer, blockID);
                            }
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
            let errorMessage = t('We couldn\'t connect to the AI. Please check your internet');
            const jsonMessage = this.isValidJSON(error === null || error === void 0 ? void 0 : error.message);
            if (jsonMessage) {
                const errorObj = JSON.parse(error === null || error === void 0 ? void 0 : error.message);
                const status = errorObj.status;
                errorMessage = getErrorMessages(status, editor);
                if (retries > 0) {
                    console.warn(`Retrying... (${retries} attempts left)`);
                    return await this.fetchAndProcessGptResponse(command, prompt, parent, retries - 1);
                }
            }
            else {
                errorMessage = (_c = error === null || error === void 0 ? void 0 : error.message) === null || _c === void 0 ? void 0 : _c.trim();
            }
            aiAgentContext.showError(errorMessage);
        }
        finally {
            this.editor.disableReadOnlyMode(this.aiAgentFeatureLockId);
        }
    }
    /**
     * Checks if a given string is a valid JSON format.
     *
     * @param str - The string to be validated as JSON.
     * @returns True if the string is valid JSON, otherwise false.
     */
    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        }
        catch (error) {
            return false;
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
            label = `\u2318 + \u232B ${t('Cancel Generation')}`;
        }
        if (env.isWindows) {
            label = `Ctrl + \u232B ${t('Cancel Generation')}`;
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
        const toolbarElement = editor.ui.view.toolbar.element;
        if (toolbarElement && view.element) {
            const panelContent = toolbarElement.querySelector('.ck-toolbar__items');
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
        const modelRoot = editor.model.document.getRoot();
        if (modelRoot) {
            const modelRange = editor.model.createRangeIn(modelRoot);
            for (const item of modelRange.getItems()) {
                if (item.is('element', 'ai-animated-status')) {
                    editor.model.change(writer => {
                        writer.remove(item);
                    });
                }
            }
        }
        const editorData = editor.getData();
        let editorContent = editorData.replace(new RegExp(`<ai-tag id="${blockID}-inline">&nbsp;</ai-tag>`, 'g'), '');
        editorContent = editorContent.replace(new RegExp(`<ai-tag id="${blockID}">&nbsp;</ai-tag>`, 'g'), '');
        editorContent = editorContent.replace(/<\/ai-tag>\s*<[^>]+>\s*&nbsp;\s*<\/[^>]+>/g, '');
        editorContent = editorContent.replace(`<ai-tag id="${blockID}-inline">`, '');
        editorContent = editorContent.replace(`<ai-tag id="${blockID}">`, '');
        editor.execute('selectAll');
        const viewFragment = editor.data.processor.toView(editorContent);
        const modelFragment = editor.data.toModel(viewFragment);
        editor.model.insertContent(modelFragment);
    }
    /**
     * Recursively retrieves all child elements of a given view element that match the specified block ID.
     *
     * @param viewElement - The parent view element from which to retrieve children.
     * @param blockID - The unique identifier of the AI block to search for.
     * @returns An array of matching child elements.
     */
    getViewChildrens(viewElement, blockID) {
        const results = [];
        for (const child of viewElement.getChildren()) {
            if (child.is('element')) {
                if (child.is('element', 'ai-tag') && child.getAttribute('id') === blockID) {
                    results.push(child);
                }
                else {
                    const nestedResults = this.getViewChildrens(child, blockID);
                    results.push(...nestedResults);
                }
            }
        }
        return results;
    }
    async animatedStatusMessages(status, blockID) {
        const editor = this.editor;
        const root = editor.model.document.getRoot();
        let targetElement;
        if (root) {
            const inlineChildrens = this.getViewChildrens(root, `${blockID}-inline`);
            const childrens = this.getViewChildrens(root, blockID);
            if (inlineChildrens.length) {
                targetElement = inlineChildrens.length ? inlineChildrens[0] : null;
            }
            else if (childrens.length) {
                targetElement = childrens.length ? childrens[0] : null;
            }
            if (targetElement) {
                editor.model.enqueueChange({ isUndoable: false }, writer => {
                    const range = editor.model.createRangeIn(targetElement);
                    writer.remove(range);
                    const aiAnimatedStatus = writer.createElement('ai-animated-status', {
                        class: 'ck-loading-shimmer'
                    });
                    writer.insert(aiAnimatedStatus, targetElement);
                    writer.insertText(`${status}...`, aiAnimatedStatus, 'end');
                });
            }
        }
        await new Promise(resolve => setTimeout(resolve));
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
    async updateContent(newHtml, blockID) {
        var _a;
        const editor = this.editor;
        const tempParagraph = document.createElement('div');
        tempParagraph.innerHTML = newHtml;
        let textContent = '';
        const root = editor.model.document.getRoot();
        if (root) {
            const childrens = this.getViewChildrens(root, `${blockID}-inline`);
            if (childrens.length) {
                if (tempParagraph.querySelector('ul') === null && tempParagraph.querySelector('li') === null) {
                    textContent = (_a = tempParagraph.textContent) !== null && _a !== void 0 ? _a : '';
                    tempParagraph.innerHTML = '';
                }
            }
        }
        if (textContent) {
            editor.model.enqueueChange({ isUndoable: false }, writer => {
                const root = editor.model.document.getRoot();
                if (root) {
                    const childrens = this.getViewChildrens(root, `${blockID}-inline`);
                    const targetElement = childrens.length ? childrens[0] : null;
                    if (targetElement) {
                        const range = editor.model.createRangeIn(targetElement);
                        writer.remove(range);
                        writer.insertText(textContent, targetElement, 'end');
                    }
                }
            });
        }
        if (tempParagraph.innerHTML) {
            editor.model.enqueueChange({ isUndoable: false }, writer => {
                const root = editor.model.document.getRoot();
                if (root) {
                    const childrens = this.getViewChildrens(root, blockID);
                    const targetElement = childrens.length ? childrens[0] : null;
                    if (targetElement) {
                        const range = editor.model.createRangeIn(targetElement);
                        writer.remove(range);
                        const viewFragment = editor.data.processor.toView(tempParagraph.innerHTML);
                        const modelFragment = editor.data.toModel(viewFragment);
                        writer.insert(modelFragment, targetElement, 'end');
                    }
                }
            });
        }
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
    clearParentContent(parent, command) {
        const editor = this.editor;
        const model = editor.model;
        const root = model.document.getRoot();
        const positionFirst = model.document.selection.getFirstPosition();
        const positionLast = model.document.selection.getLastPosition();
        if (root && positionFirst && positionLast) {
            editor.model.change(writer => {
                var _a, _b, _c;
                if (command) {
                    const range = model.createRange(model.createPositionFromPath(root, positionFirst.path), model.createPositionFromPath(root, positionLast.path));
                    writer.remove(range);
                    const positionFirstAfterRemove = model.document.selection.getFirstPosition();
                    if (positionFirstAfterRemove) {
                        const positionParentFirst = positionFirstAfterRemove.parent;
                        if (positionFirstAfterRemove.parent.childCount === 0) {
                            writer.remove(positionParentFirst);
                        }
                        else if (positionFirstAfterRemove.parent.childCount === 1) {
                            const tag = (_a = positionFirstAfterRemove.parent) === null || _a === void 0 ? void 0 : _a.getChild(0);
                            if (tag.name === 'ai-tag' && positionFirstAfterRemove.parent.name !== '$root') {
                                writer.remove(positionParentFirst);
                            }
                        }
                    }
                    const positionLastAfterRemove = model.document.selection.getLastPosition();
                    if (positionLastAfterRemove) {
                        const positionParentLast = positionLastAfterRemove.parent;
                        if (positionLastAfterRemove.parent.childCount === 0) {
                            writer.remove(positionParentLast);
                        }
                        else if (positionLastAfterRemove.parent.childCount === 1) {
                            const tag = (_b = positionLastAfterRemove.parent) === null || _b === void 0 ? void 0 : _b.getChild(0);
                            if (tag.name === 'ai-tag' && positionLastAfterRemove.parent.name !== '$root') {
                                writer.remove(positionParentLast);
                            }
                        }
                    }
                }
                else {
                    const startingPath = parent.getPath();
                    const range = model.createRange(model.createPositionFromPath(root, startingPath), model.createPositionFromPath(root, positionLast.path));
                    writer.remove(range);
                    if (parent.getPath()) {
                        if (parent.name === 'inline-slash') {
                            const position = model.document.selection.getLastPosition();
                            const positionParent = position === null || position === void 0 ? void 0 : position.parent;
                            let lineEmpty = true;
                            if (position === null || position === void 0 ? void 0 : position.parent) {
                                if ((_c = position === null || position === void 0 ? void 0 : position.parent) === null || _c === void 0 ? void 0 : _c.getChildren().next().value) {
                                    lineEmpty = false;
                                }
                            }
                            if (lineEmpty) {
                                writer.remove(positionParent);
                            }
                        }
                        else {
                            const positionParent = parent;
                            writer.remove(positionParent);
                        }
                    }
                }
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
    async generateGptPromptBasedOnUserPrompt(prompt, promptContainerText, selectedContent) {
        try {
            const context = this.promptHelper.trimContext(prompt, promptContainerText);
            const request = selectedContent ? prompt : prompt.slice(1);
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
            return this.promptHelper.formatFinalPrompt(request, context, selectedContent, markDownContents, isEditorEmpty);
        }
        catch (error) {
            console.error(error);
            return null;
        }
    }
    /**
     * Retrieves and formats the error message from the response object.
     *
     * @param response - The response object from the fetch request.
     * @returns A promise that resolves to a JSON string containing the status and error message.
     * The error message is extracted based on the content type of the response, which can be
     * in JSON, HTML, or plain text format.
     */
    async getError(response) {
        let errorData = '';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            errorData = JSON.stringify(await response.json());
        }
        else if (contentType && contentType.includes('text/html')) {
            errorData = await response.text();
        }
        else if (contentType && contentType.includes('text/plain')) {
            errorData = await response.text();
        }
        const error = {
            status: response.status,
            error: errorData
        };
        return JSON.stringify(error);
    }
}
