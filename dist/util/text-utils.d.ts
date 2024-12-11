import type { Editor } from 'ckeditor5/src/core.js';
/**
 * Utility functions for text processing operations.
 */
/**
 * Removes leading spaces from each line while preserving empty lines and content indentation.
 *
 * @param text - The text to process
 * @returns The processed text with leading spaces removed
 */
export declare function removeLeadingSpaces(text: string): string;
/**
 * Removes leading & trailing spaces from each line while preserving empty lines and content indentation.
 *
 * @param text - The text to process
 * @returns The processed text with leading spaces removed
 */
export declare function trimMultilineString(text: string): string;
/**
 * Extracts a portion of text from the editor content based on sentence boundaries.
 *
 * @param contentAfterPrompt - The text to extract from
 * @param contextSize - Maximum size of the context to extract
 * @param reverse - Whether to extract from the end of the text
 * @returns The extracted text portion
 */
export declare function extractEditorContent(contentAfterPrompt: string, contextSize: number, reverse: boolean | undefined, editor: Editor): string;
