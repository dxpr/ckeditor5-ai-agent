export class HtmlParser {
    constructor(editor) {
        var _a;
        this.editor = editor;
        this.model = editor.model;
        this.debugMode = (_a = editor.config.get('aiAgent.debugMode')) !== null && _a !== void 0 ? _a : false;
    }
    /**
     * Inserts simple HTML content into the editor.
     *
     * @param html - The HTML string to be inserted into the editor.
     * @returns A promise that resolves when the HTML has been inserted.
     */
    async insertSimpleHtml(html) {
        var _a;
        if (this.debugMode) {
            console.log('Attempting to insert simple HTML:', html);
        }
        const viewFragment = this.editor.data.processor.toView(html);
        const modelFragment = this.editor.data.toModel(viewFragment, '$root');
        const selection = this.model.document.selection;
        const root = this.model.document.getRoot();
        let insertionPosition = selection.getLastPosition();
        const lastInsertedChild = modelFragment.getChild(modelFragment.childCount - 1);
        const currentChildIndex = (_a = selection.getLastPosition()) === null || _a === void 0 ? void 0 : _a.path[0];
        const lastUpdatedElementInRoot = root === null || root === void 0 ? void 0 : root.getChild(currentChildIndex !== null && currentChildIndex !== void 0 ? currentChildIndex : 0);
        this.model.change(writer => {
            if (lastUpdatedElementInRoot === null || lastUpdatedElementInRoot === void 0 ? void 0 : lastUpdatedElementInRoot.is('element')) {
                insertionPosition = lastUpdatedElementInRoot.isEmpty ?
                    writer.createPositionAt(lastUpdatedElementInRoot, 'end') :
                    writer.createPositionAfter(lastUpdatedElementInRoot);
            }
            if (insertionPosition && root) {
                // Insert element to current selection
                writer.setSelection(insertionPosition);
                this.model.insertContent(modelFragment, insertionPosition);
                // Check if it required to add break to current context of list etc.
                // More to will be added during testing any edge case
                let isBreakElementReq = lastInsertedChild === null || lastInsertedChild === void 0 ? void 0 : lastInsertedChild.getAttribute('listItemId');
                if (lastInsertedChild === null || lastInsertedChild === void 0 ? void 0 : lastInsertedChild.is('element')) {
                    isBreakElementReq = isBreakElementReq || lastInsertedChild.name === 'table';
                }
                if (isBreakElementReq && lastInsertedChild) {
                    const paragraph = writer.createElement('paragraph');
                    writer.insert(paragraph, writer.createPositionAfter(lastInsertedChild));
                    writer.setSelection(paragraph, 'in');
                }
                else if (lastInsertedChild) {
                    writer.setSelection(writer.createPositionAfter(lastInsertedChild));
                }
            }
        });
        // Maintain a delay to simulate asynchronous behavior
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    /**
     * Inserts HTML content as text into the editor.
     *
     * @param content - The HTML element containing the text to be inserted.
     * @param position - The position at which to insert the text (optional).
     * @param stream - Indicates whether to insert text in a streaming manner (default is false).
     * @param shouldAddBreakAtEnd - Indicates whether to add a paragraph break at the end of the inserted content (default is false).
     * @returns A promise that resolves when the text has been inserted.
     *
     * This method processes the provided HTML element, converting it to a model fragment,
     * and inserts it into the editor at the specified position. If streaming is enabled,
     * elements are inserted one at a time, allowing for a more dynamic insertion experience.
     * An optional paragraph break can be added at the end of the inserted content.
    */
    async insertAsText(content, position, stream = false, shouldAddBreakAtEnd = false) {
        const viewFragment = this.editor.data.processor.toView(content.outerHTML);
        const modelFragment = this.editor.data.toModel(viewFragment, '$root');
        const childrenToInsert = Array.from(modelFragment.getChildren());
        const root = this.model.document.getRoot();
        for (const [index, element] of childrenToInsert.entries()) {
            if (element.is('element')) {
                const insertPosition = index === 0 ? position : undefined; // Determine position for insertion
                if (stream) {
                    await this.insertElementAsStream(element, insertPosition);
                }
                else {
                    await this.batchInsertOfElement(element, insertPosition);
                }
            }
        }
        if (shouldAddBreakAtEnd) {
            this.model.change(writer => {
                const lastPosition = this.model.document.selection.getLastPosition();
                const currentChildIndex = lastPosition === null || lastPosition === void 0 ? void 0 : lastPosition.path[0];
                if (root && currentChildIndex != undefined) {
                    const paragraph = writer.createElement('paragraph');
                    writer.insert(paragraph, root, currentChildIndex + 1);
                    writer.setSelection(paragraph, 'in');
                }
            });
        }
    }
    /**
     * Inserts a given element into the editor at the specified position.
     *
     * @param element - The element to be inserted into the editor.
     * @param position - The position at which to insert the element.
     * If not provided, the element will be inserted at the current selection position.
     * @returns A promise that resolves when the element has been inserted.
     */
    async batchInsertOfElement(element, position) {
        var _a;
        const selection = this.model.document.selection;
        const root = this.model.document.getRoot();
        let insertionPosition = position;
        if (!position) {
            const currentChildIndex = (_a = selection.getFirstPosition()) === null || _a === void 0 ? void 0 : _a.path[0];
            const lastUpdatedElementInRoot = root === null || root === void 0 ? void 0 : root.getChild(currentChildIndex !== null && currentChildIndex !== void 0 ? currentChildIndex : 0);
            if (lastUpdatedElementInRoot === null || lastUpdatedElementInRoot === void 0 ? void 0 : lastUpdatedElementInRoot.is('element')) {
                insertionPosition = lastUpdatedElementInRoot.isEmpty ?
                    this.model.createPositionAt(lastUpdatedElementInRoot, 'end') :
                    this.model.createPositionAfter(lastUpdatedElementInRoot);
            }
        }
        // insert content at current identified position
        this.model.change(writer => {
            this.model.insertContent(element, insertionPosition);
            writer.setSelection(element, 'end');
        });
    }
    /**
     * Inserts a given element into the editor at the specified position in a streaming manner.
     *
     * @param element - The element to be inserted into the editor.
     * @param position - The position at which to insert the element.
     * If not provided, the element will be inserted at the current selection position.
     * @returns A promise that resolves when the element has been inserted and all text has been streamed in.
     */
    async insertElementAsStream(element, position) {
        const selection = this.model.document.selection;
        const root = this.model.document.getRoot();
        const lastRecognizedPosition = selection.getLastPosition();
        let insertionPosition = position;
        let targetElement;
        // Determine insertion position
        if (!position) {
            const currentChildIndex = lastRecognizedPosition === null || lastRecognizedPosition === void 0 ? void 0 : lastRecognizedPosition.path[0];
            const lastUpdatedElement = root === null || root === void 0 ? void 0 : root.getChild(currentChildIndex !== null && currentChildIndex !== void 0 ? currentChildIndex : 0);
            if (lastUpdatedElement === null || lastUpdatedElement === void 0 ? void 0 : lastUpdatedElement.is('element')) {
                insertionPosition = lastUpdatedElement.isEmpty ?
                    this.model.createPositionAt(lastUpdatedElement, 'end') :
                    this.model.createPositionAfter(lastUpdatedElement);
            }
            this.model.change(writer => {
                targetElement = writer.createElement(element.name);
                // Set attributes in a more concise way
                for (const [key, value] of element.getAttributes()) {
                    targetElement._setAttribute(key, value);
                }
                this.model.insertContent(targetElement, insertionPosition);
                if (insertionPosition) {
                    writer.setSelection(targetElement, 'end');
                }
            });
        }
        else {
            // current element from the offset
            const currentElement = lastRecognizedPosition === null || lastRecognizedPosition === void 0 ? void 0 : lastRecognizedPosition.parent;
            if (currentElement === null || currentElement === void 0 ? void 0 : currentElement.is('element')) {
                targetElement = currentElement;
            }
        }
        const textChildren = Array.from(element.getChildren()).filter(child => child.is('$text'));
        for (const textNode of textChildren) {
            if (!textNode.is('$text')) {
                continue;
            }
            const textAttributes = Array.from(textNode.getAttributes());
            const textContent = textNode._data;
            for (const char of textContent) {
                await new Promise(resolve => {
                    this.model.change(writer => {
                        const currentPosition = this.editor.model.document.selection.getLastPosition();
                        const newPosition = currentPosition.getShiftedBy(1);
                        const shouldAppendAtEnd = newPosition.offset === (currentPosition === null || currentPosition === void 0 ? void 0 : currentPosition.parent.maxOffset);
                        writer.insertText(char, textAttributes, targetElement, shouldAppendAtEnd ? 'end' : currentPosition === null || currentPosition === void 0 ? void 0 : currentPosition.offset);
                        writer.setSelection(this.editor.model.document.selection.getLastPosition());
                    });
                    setTimeout(resolve, 5); // Maintain the streaming effect
                });
            }
        }
        // Set selection
        if (!position) {
            this.model.change(writer => {
                writer.setSelection(targetElement, 'end');
            });
        }
    }
    /**
     * Validate given string as a HTML content
     * @param content string containing html content
     * @returns A boolean value as result of validation
     */
    isCompleteHtmlChunk(html) {
        const openingTags = (html.match(/<[^/][^>]*>/g) || []).length;
        const closingTags = (html.match(/<\/[^>]+>/g) || []).length;
        // Check if all opening tags have corresponding closing tags
        if (openingTags !== closingTags) {
            return false;
        }
        // Check for incomplete tags
        if (html.includes('<') && !html.includes('>')) {
            return false;
        }
        // Check if the HTML starts with an opening tag and ends with a closing tag
        const trimmedHtml = html.trim();
        if (!trimmedHtml.startsWith('<') || !trimmedHtml.endsWith('>')) {
            return false;
        }
        return true;
    }
}
