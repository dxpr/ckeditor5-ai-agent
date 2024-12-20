import { getAllowedHtmlTags } from './html-utils.js';
import sbd from 'sbd';
/* eslint-enable camelcase */
/**
 * Utility functions for text processing operations.
 */
/**
 * Removes leading spaces from each line while preserving empty lines and content indentation.
 *
 * @param text - The text to process
 * @returns The processed text with leading spaces removed
 */
export function removeLeadingSpaces(text) {
    return text.split('\n')
        .map(line => line.trimStart())
        .join('\n');
}
/**
 * Removes leading & trailing spaces from each line while preserving empty lines and content indentation.
 *
 * @param text - The text to process
 * @returns The processed text with leading spaces removed
 */
export function trimMultilineString(text) {
    return text.split('\n')
        .map(line => line.trim())
        .join('\n');
}
/**
 * Extracts a portion of text from the editor content based on sentence boundaries.
 *
 * @param contentAfterPrompt - The text to extract from
 * @param contextSize - Maximum size of the context to extract
 * @param reverse - Whether to extract from the end of the text
 * @returns The extracted text portion
 */
export function extractEditorContent(contentAfterPrompt, contextSize, reverse = false, editor) {
    let trimmedContent = '';
    let charCount = 0;
    const options = {
        preserve_whitespace: true,
        html_boundaries: true,
        allowed_tags: getAllowedHtmlTags(editor)
    };
    const sentences = sbd.sentences(contentAfterPrompt, options);
    const iterator = reverse ? sentences.reverse() : sentences;
    for (const sentence of iterator) {
        const sentenceLength = sentence.length;
        if ((charCount + sentenceLength) / 4 <= contextSize) {
            trimmedContent = reverse ?
                sentence + trimmedContent :
                trimmedContent + sentence;
            charCount += sentenceLength;
        }
        else {
            break;
        }
    }
    return trimmedContent.trim();
}
