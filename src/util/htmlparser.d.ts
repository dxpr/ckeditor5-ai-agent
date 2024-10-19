import type { Editor } from 'ckeditor5/src/core.js';
import type { Element, Position } from 'ckeditor5/src/engine.js';
export declare class HtmlParser {
    private editor;
    private model;
    constructor(editor: Editor);
    /**
     * Inserts simple HTML content into the editor.
     *
     * @param html - The HTML string to be inserted into the editor.
     * @returns A promise that resolves when the HTML has been inserted.
     */
    insertSimpleHtml(html: string): Promise<void>;
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
    insertAsText(content: HTMLElement, position?: Position, stream?: boolean, shouldAddBreakAtEnd?: boolean): Promise<void>;
    /**
     * Inserts a given element into the editor at the specified position.
     *
     * @param element - The element to be inserted into the editor.
     * @param position - The position at which to insert the element.
     * If not provided, the element will be inserted at the current selection position.
     * @returns A promise that resolves when the element has been inserted.
     */
    batchInsertOfElement(element: Element, position?: Position): Promise<void>;
    /**
     * Inserts a given element into the editor at the specified position in a streaming manner.
     *
     * @param element - The element to be inserted into the editor.
     * @param position - The position at which to insert the element.
     * If not provided, the element will be inserted at the current selection position.
     * @returns A promise that resolves when the element has been inserted and all text has been streamed in.
     */
    private insertElementAsStream;
    /**
     * Validate given string as a HTML content
     * @param content string containing html content
     * @returns A boolean value as result of validation
     */
    isCompleteHtmlChunk(html: string): boolean;
}
