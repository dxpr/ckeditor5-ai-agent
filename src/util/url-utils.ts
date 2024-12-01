import { aiAgentContext } from '../aiagentcontext.js';

/**
 * Fetches content from a URL and formats it as markdown.
 *
 * @param url - The URL to fetch content from
 * @returns Promise resolving to the fetched content
 * @throws Error if fetch fails or content is empty
 */
export async function fetchUrlContent( url: string ): Promise<string> {
	try {
		const trimmedUrl = url.trim();
		if ( !trimmedUrl ) {
			throw new Error( 'Empty URL provided' );
		}

		const response = await fetch( trimmedUrl );
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

		return content
			.replace( /\(https?:\/\/[^\s]+\)/g, '' )
			.replace( /^\s*$/gm, '' )
			.trim();
	} catch ( error ) {
		console.error( `Failed to fetch content: ${ url }`, error );
		aiAgentContext.showError( 'Failed to fetch URL content' );
		return '';
	}
}
