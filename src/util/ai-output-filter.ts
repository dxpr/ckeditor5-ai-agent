/**
 * AI Output Security Filter
 * Filters images and inline frames in AI-generated content.
 */

const AI_FILTER_DEFAULT_DOMAINS = [ 'unsplash.com', 'pexels.com', 'pixabay.com' ];
const AI_FILTER_BYPASS_DOMAIN = 'promptahuman.com';
const AI_FILTER_PLACEHOLDER_IMAGE_URL = 'https://promptahuman.com/900x160@x2?prompt=';
const AI_FILTER_GRAY_PIXEL_BASE64 =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGD4DwABBAEAW9TREES5CYII=';

export interface AiFilterConfig {
	enabled?: boolean;
	allowedDomains?: string[];
	strictMode?: boolean;
}

const getAiFilterConfig = function( config?: AiFilterConfig ): Required<AiFilterConfig> {
	return {
		enabled: config?.enabled !== false,
		allowedDomains: config?.allowedDomains || AI_FILTER_DEFAULT_DOMAINS,
		strictMode: config?.strictMode === true
	};
};

const isAiImageUrlAllowed = function( url: string, allowedDomains: string[] = [] ): boolean {
	if ( !url ) return false;

	try {
		if ( url.includes( AI_FILTER_BYPASS_DOMAIN ) ) return true;

		if (
			url.startsWith( '/' ) ||
			url.startsWith( '../' ) ||
			url.startsWith( './' ) ||
			url.startsWith( '#' ) ||
			url.startsWith( 'mailto:' ) ||
			url.startsWith( 'tel:' ) ||
			url.startsWith( 'data:' )
		) {
			return true;
		}

		const urlObj = new URL( url, typeof window !== 'undefined' ? window.location.href : undefined );
		const { hostname } = urlObj;

		if ( typeof window !== 'undefined' && hostname === window.location.hostname ) return true;

		return allowedDomains.some( ( pattern ) => {
			if ( pattern === hostname ) return true;

			if ( pattern.startsWith( '*.' ) ) {
				const baseDomain = pattern.substring( 2 );
				return hostname.endsWith( `.${ baseDomain }` ) || hostname === baseDomain;
			}

			return false;
		} );
	} catch ( e ) {
		return false;
	}
};

const filterAiHtmlImages = function( html: string, config: Required<AiFilterConfig> ): string {
	if ( !config.enabled ) return html;

	const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
	if ( !parser ) return html;

	const doc = parser.parseFromString( html, 'text/html' );

	doc.querySelectorAll( 'iframe' ).forEach( ( iframe ) => iframe.remove() );

	doc.querySelectorAll( 'img' ).forEach( ( img ) => {
		const src = img.getAttribute( 'src' );
		if ( config.strictMode || !isAiImageUrlAllowed( src || '', config.allowedDomains ) ) {
			if ( config.strictMode ) {
				img.setAttribute( 'src', AI_FILTER_GRAY_PIXEL_BASE64 );
			} else {
				const filename = src ? src.split( '/' ).pop()!.split( '?' )[ 0 ] : 'image';
				img.setAttribute( 'src', AI_FILTER_PLACEHOLDER_IMAGE_URL + encodeURIComponent( filename ) );
			}
		}
	} );

	return doc.body.innerHTML;
};

const filterAiMarkdownImages = function( markdown: string, config: Required<AiFilterConfig> ): string {
	if ( !config.enabled ) return markdown;

	let filtered = markdown;

	filtered = filtered.replace(
		/!\[([^\]]*)\]\(([^)]+)\)/g,
		( match, alt, url ) => {
			if ( config.strictMode || !isAiImageUrlAllowed( url, config.allowedDomains ) ) {
				if ( config.strictMode ) {
					return `![${ alt }](${ AI_FILTER_GRAY_PIXEL_BASE64 })`;
				}

				const filename = url ? url.split( '/' ).pop().split( '?' )[ 0 ] : 'image';
				return `![${ alt }](${ AI_FILTER_PLACEHOLDER_IMAGE_URL }${ encodeURIComponent( filename ) })`;
			}

			return match;
		}
	);

	return filtered;
};

export const filterAiImages = function( content: string, config?: AiFilterConfig ): string {
	if ( !content ) return content;

	const filterConfig = getAiFilterConfig( config );
	const isHtml = /<[^>]+>/.test( content );

	return isHtml
		? filterAiHtmlImages( content, filterConfig )
		: filterAiMarkdownImages( content, filterConfig );
};

interface FilterState {
	buffer: string;
	inTag: boolean;
	tagType: string | null;
}

export const filterAiStreamingChunk = function( chunk: string, state?: FilterState, config?: AiFilterConfig ): string {
	const filterState: FilterState = state || { buffer: '', inTag: false, tagType: null };
	const filterConfig = getAiFilterConfig( config );

	if ( !filterConfig.enabled ) return chunk;

	let output = '';
	let i = 0;

	while ( i < chunk.length ) {
		const char = chunk[ i ];

		if ( !filterState.inTag && char === '<' ) {
			const remaining = chunk.substring( i );
			if ( remaining.match( /^<img[\s>]/i ) || remaining.match( /^<iframe[\s>]/i ) ) {
				filterState.inTag = true;
				filterState.buffer = char;
				filterState.tagType = remaining.match( /^<(\w+)/i )![ 1 ].toLowerCase();
				i++;
				continue;
			}
		}

		if ( filterState.inTag ) {
			filterState.buffer += char;

			if ( char === '>' ) {
				const filteredTag = filterAiImages( filterState.buffer, config );

				if ( filteredTag === filterState.buffer ) {
					output += filteredTag;
				}

				filterState.inTag = false;
				filterState.buffer = '';
				filterState.tagType = null;
			}
		} else {
			output += char;
		}

		i++;
	}

	return output;
};
