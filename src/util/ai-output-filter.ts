/**
 * AI Output Security Filter
 *
 * Mitigates prompt injection attacks that attempt to exfiltrate data via
 * malicious URLs in AI-generated content (CVE-2025-32711 / EchoLeak style attacks).
 *
 * Uses UNIVERSAL URL detection - scans ALL content for URLs regardless of context.
 * No more whack-a-mole with specific tags/attributes.
 *
 * @see https://nvd.nist.gov/vuln/detail/CVE-2025-32711
 */

import { PLACEHOLDER_SERVICE_DOMAIN } from '../const.js';

const PLACEHOLDER_IMAGE_URL = `https://${ PLACEHOLDER_SERVICE_DOMAIN }/900x160@x2?prompt=`;
const GRAY_PIXEL_BASE64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
const REDACTED_URL_TEXT = '#EXTERNAL_URL_REDACTED#';

// Whitelist of safe HTML tags - everything else is stripped (content preserved)
const ALLOWED_TAGS = new Set( [
	'p', 'br', 'hr', 'div', 'span',
	'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
	'ul', 'ol', 'li', 'dl', 'dt', 'dd',
	'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
	'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
	'blockquote', 'pre', 'code', 'q', 'cite', 'abbr', 'dfn', 'kbd', 'samp', 'var', 'time',
	'a', 'img', 'figure', 'figcaption', 'picture', 'source', 'details', 'summary'
] );

// Universal URL pattern - catches http://, https://, and protocol-relative //
const URL_PATTERN = /(?:https?:)?\/\/[^\s"'<>)\]]+/gi;

export interface AiFilterConfig {
	allowedDomains?: string[];
	onUrlBlocked?: ( blockedUrls: string[] ) => void;
}

const isUrlAllowed = ( url: string, allowedDomains: string[] ): boolean => {
	if ( !url ) return true;
	if ( url.startsWith( '#' ) || url.startsWith( 'mailto:' ) || url.startsWith( 'tel:' ) ) return true;

	const lowerUrl = url.toLowerCase().trim();
	if ( lowerUrl.startsWith( 'javascript:' ) || lowerUrl.startsWith( 'vbscript:' ) || lowerUrl.startsWith( 'data:' ) ) {
		return false;
	}

	if ( allowedDomains.includes( '*' ) ) return true;

	try {
		const urlObj = new URL( url, typeof window !== 'undefined' ? window.location.href : undefined );
		const { hostname } = urlObj;

		// Skip incomplete URLs (likely from streaming) - must have dot or be localhost/IP
		if ( !hostname.includes( '.' ) && hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test( hostname ) ) {
			return true; // Don't block, likely incomplete
		}

		if ( typeof window !== 'undefined' && hostname === window.location.hostname ) return true;

		return allowedDomains.some( pattern => {
			if ( pattern === hostname ) return true;
			if ( pattern.startsWith( '*.' ) ) {
				const base = pattern.slice( 2 );
				return hostname.endsWith( `.${ base }` ) || hostname === base;
			}
			return false;
		} );
	} catch {
		return false;
	}
};

const getImageReplacement = ( allowedDomains: string[] ): string => {
	const placeholderAllowed = allowedDomains.some( d =>
		d === PLACEHOLDER_SERVICE_DOMAIN || ( d.startsWith( '*.' ) && PLACEHOLDER_SERVICE_DOMAIN.endsWith( d.slice( 1 ) ) )
	);
	return placeholderAllowed ? PLACEHOLDER_IMAGE_URL + 'blocked' : GRAY_PIXEL_BASE64;
};

/**
 * Universal URL replacement - replaces ALL blocked URLs in any string.
 * This is the core of the security filter - no tag-specific logic needed.
 */
const replaceBlockedUrls = (
	content: string,
	allowedDomains: string[],
	blockedUrls: string[],
	isImageContext: boolean = false
): string => {
	return content.replace( URL_PATTERN, url => {
		if ( isUrlAllowed( url, allowedDomains ) ) return url;
		if ( !blockedUrls.includes( url ) ) blockedUrls.push( url );
		return isImageContext ? getImageReplacement( allowedDomains ) : REDACTED_URL_TEXT;
	} );
};

const filterHtml = ( html: string, allowedDomains: string[], blockedUrls: string[] ): string => {
	const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
	if ( !parser ) return replaceBlockedUrls( html, allowedDomains, blockedUrls );

	const doc = parser.parseFromString( html, 'text/html' );

	// 1. Strip disallowed tags (keep content)
	for ( const el of Array.from( doc.body.querySelectorAll( '*' ) ) ) {
		if ( !ALLOWED_TAGS.has( el.tagName.toLowerCase() ) ) {
			el.replaceWith( ...Array.from( el.childNodes ) );
		}
	}

	// 2. Universal URL filtering - scan ALL attributes of ALL elements
	for ( const el of Array.from( doc.body.querySelectorAll( '*' ) ) ) {
		const isImg = el.tagName.toLowerCase() === 'img';
		for ( const attr of Array.from( el.attributes ) ) {
			const filtered = replaceBlockedUrls( attr.value, allowedDomains, blockedUrls, isImg && attr.name === 'src' );
			if ( filtered !== attr.value ) {
				el.setAttribute( attr.name, filtered );
				// Set dimensions for blocked images
				if ( isImg && attr.name === 'src' && filtered === GRAY_PIXEL_BASE64 ) {
					el.setAttribute( 'width', '900' );
					el.setAttribute( 'height', '160' );
					el.removeAttribute( 'srcset' );
				}
			}
		}
	}

	// 3. Filter URLs in text nodes
	const walker = doc.createTreeWalker( doc.body, NodeFilter.SHOW_TEXT );
	const textNodes: Text[] = [];
	let node: Text | null;
	while ( ( node = walker.nextNode() as Text | null ) ) textNodes.push( node );

	for ( const textNode of textNodes ) {
		const text = textNode.textContent || '';
		const filtered = replaceBlockedUrls( text, allowedDomains, blockedUrls );
		if ( filtered !== text ) textNode.textContent = filtered;
	}

	return doc.body.innerHTML;
};

const filterMarkdown = ( md: string, allowedDomains: string[], blockedUrls: string[] ): string => {
	// For markdown images, use image replacement
	let result = md.replace( /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, ( m, alt, url ) => {
		if ( isUrlAllowed( url, allowedDomains ) ) return m;
		if ( !blockedUrls.includes( url ) ) blockedUrls.push( url );
		return `![${ alt }](${ getImageReplacement( allowedDomains ) })`;
	} );

	// For everything else, use universal URL replacement
	return replaceBlockedUrls( result, allowedDomains, blockedUrls );
};

export const filterAiImages = ( content: string, config?: AiFilterConfig ): string => {
	if ( !content ) return content;

	const allowedDomains = config?.allowedDomains ?? [ PLACEHOLDER_SERVICE_DOMAIN ];
	const blockedUrls: string[] = [];

	const filtered = /<[^>]+>/.test( content )
		? filterHtml( content, allowedDomains, blockedUrls )
		: filterMarkdown( content, allowedDomains, blockedUrls );

	if ( blockedUrls.length > 0 && config?.onUrlBlocked ) {
		config.onUrlBlocked( blockedUrls );
	}

	return filtered;
};
