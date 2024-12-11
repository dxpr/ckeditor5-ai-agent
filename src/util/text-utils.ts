import type { Editor } from 'ckeditor5/src/core.js';
import { getAllowedHtmlTags } from './html-utils.js';
import sbd from 'sbd';

// Disable camelcase for external library types
/* eslint-disable camelcase */
type SbdOptions = {
    preserve_whitespace?: boolean;
    html_boundaries?: boolean;
    allowed_tags?: Array<string>;
    newline_boundaries?: boolean;
    html_boundaries_tags?: Array<string>;
    sanitize?: boolean;
    clean?: boolean;
};
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
export function removeLeadingSpaces( text: string ): string {
	return text.split( '\n' )
		.map( line => line.trimStart() )
		.join( '\n' );
}

/**
 * Removes leading & trailing spaces from each line while preserving empty lines and content indentation.
 *
 * @param text - The text to process
 * @returns The processed text with leading spaces removed
 */
export function trimMultilineString( text: string ): string {
	return text.split( '\n' )
		.map( line => line.trim() )
		.join( '\n' );
}

/**
 * Extracts a portion of text from the editor content based on sentence boundaries.
 *
 * @param contentAfterPrompt - The text to extract from
 * @param contextSize - Maximum size of the context to extract
 * @param reverse - Whether to extract from the end of the text
 * @returns The extracted text portion
 */
export function extractEditorContent(
	contentAfterPrompt: string,
	contextSize: number,
	reverse: boolean = false,
	editor: Editor
): string {
	let trimmedContent = '';
	let charCount = 0;

	const options: SbdOptions = {
		preserve_whitespace: true,
		html_boundaries: true,
		allowed_tags: getAllowedHtmlTags( editor )
	};

	const sentences = sbd.sentences( contentAfterPrompt, options );
	const iterator = reverse ? sentences.reverse() : sentences;

	for ( const sentence of iterator ) {
		const sentenceLength = sentence.length;
		if ( ( charCount + sentenceLength ) / 4 <= contextSize ) {
			trimmedContent = reverse ?
				sentence + trimmedContent :
				trimmedContent + sentence;
			charCount += sentenceLength;
		} else {
			break;
		}
	}

	return trimmedContent.trim();
}
