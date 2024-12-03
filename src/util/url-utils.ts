import { aiAgentContext } from '../aiagentcontext.js';

/**
 * Fetches the content of a given URL and returns it as a string.
 *
 * @param url - The URL to fetch content from.
 * @returns A promise that resolves to the fetched content as a string.
 * @throws Will throw an error if the URL is invalid or if the fetch fails.
 */
export async function fetchUrlContent( url: string ): Promise<string> {
	const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
	const trimmedUrl = url.trim();

	if ( !urlRegex.test( trimmedUrl ) ) {
		throw new Error( 'Invalid URL' );
	}

	try {
		// Use a regular expression to remove hidden characters
		const cleanedUrl = trimmedUrl.replace( /[^\x20-\x7E]/g, '' );
		const requestURL = `https://r.jina.ai/${ cleanedUrl.trim() }`;
		const response = await fetch( requestURL.trim(), {
			headers: {
				'X-With-Generated-Alt': 'true'
			}
		} );
		if ( !response.ok ) {
			throw new Error( `HTTP error! status: ${ response.status }` );
		}
		const content = await response.text();

		// Updated error matching
		if ( content.includes( 'Warning: Target URL returned error' ) ) {
			throw new Error( `Target URL (${ trimmedUrl }) returned an error` );
		}

		if ( content.trim().length === 0 ) {
			throw new Error( 'Empty content received' );
		}

		return content.replace( /\(https?:\/\/[^\s]+\)/g, '' ).replace( /^\s*$/gm, '' ).trim();
	} catch ( error ) {
		console.error( `Failed to fetch content: ${ url }`, error );
		aiAgentContext.showError( 'Failed to fetch URL content' );
		return '';
	}
}
