/**
 * AI Output Security Filter
 *
 * Mitigates prompt injection attacks that attempt to exfiltrate data via
 * malicious URLs in AI-generated content (CVE-2025-32711 / EchoLeak style attacks).
 *
 * Filters:
 * - Images: <img> tags and Markdown ![alt](url) syntax including reference-style (enabled by default)
 * - Links: <a> tags and Markdown [text](url) syntax including reference-style (enabled by default)
 * - Iframes: All <iframe> tags are unconditionally removed (always enabled)
 * - Dangerous elements: <object>, <embed>, <applet>, SVG <image> (always enabled)
 *
 * @see https://nvd.nist.gov/vuln/detail/CVE-2025-32711
 */

import { PLACEHOLDER_SERVICE_DOMAIN } from '../const.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default allowed domains for external images.
 * Only allows the placeholder image service by default for maximum security.
 * Users can extend this list via allowedImageDomains config option.
 */
const DEFAULT_ALLOWED_IMAGE_DOMAINS = [
	PLACEHOLDER_SERVICE_DOMAIN
] as const;

/**
 * Default allowed domains for external links.
 * Empty by default for maximum security - all external links are blocked.
 * Users can extend this list via allowedLinkDomains config option.
 */
const DEFAULT_ALLOWED_LINK_DOMAINS: readonly string[] = [] as const;

/** Placeholder image service URL for blocked images */
const PLACEHOLDER_IMAGE_URL = `https://${ PLACEHOLDER_SERVICE_DOMAIN }/900x160@x2?prompt=`;

/** 1x1 gray pixel as base64 - used when external placeholder not allowed */
const GRAY_PIXEL_BASE64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

/** Default dimensions for blocked image placeholder (matches promptahuman.com default) */
const BLOCKED_IMAGE_WIDTH = 900;
const BLOCKED_IMAGE_HEIGHT = 160;

/** URL prefixes that are always considered safe (no network request or same-origin) */
const SAFE_URL_PREFIXES = [ '/', '../', './', '#', 'mailto:', 'tel:', 'data:' ] as const;

/** Wildcard prefix for domain matching */
const WILDCARD_PREFIX = '*.';

/** HTML elements that are always removed (can load external resources dangerously) */
const DANGEROUS_ELEMENTS_SELECTOR = 'iframe, object, embed, applet';

/** SVG image element selector */
const SVG_IMAGE_SELECTOR = 'svg image';

/** XLink namespace for SVG href attributes */
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';

/** Data attribute added to blocked links */
const BLOCKED_LINK_ATTR = 'data-blocked-href';

/** Maximum filename length for placeholders */
const MAX_FILENAME_LENGTH = 50;

/** Default filename when extraction fails */
const DEFAULT_FILENAME = 'image';

// Regex patterns
const PATTERNS = {
	/** Matches [refname]: url or [refname]: url "title" */
	markdownReference: /^\[([^\]]+)\]:\s*(\S+)(?:\s+"[^"]*")?$/gm,
	/** Matches ![alt](url) or ![alt](url "title") */
	markdownInlineImage: /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
	/** Matches ![alt][ref] or ![alt][] */
	markdownRefImage: /!\[([^\]]*)\]\[([^\]]*)\]/g,
	/** Matches [text](url) or [text](url "title") - with negative lookbehind to exclude images */
	markdownInlineLink: /(?<!!)\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
	/** Matches [text][ref] or [text][] - with negative lookbehind to exclude images */
	markdownRefLink: /(?<!!)\[([^\]]+)\]\[([^\]]*)\]/g,
	/** Matches reference definitions with trailing newlines */
	markdownRefDefinition: /^\[([^\]]+)\]:\s*(\S+)(?:\s+"[^"]*")?[\r\n]*/gm,
	/** Detects HTML content */
	htmlDetection: /<[^>]+>/,
	/** Escapes regex special characters */
	regexEscape: /[.*+?^${}()|[\]\\]/g,
	/** HTML tags that are always filtered (dangerous elements) */
	streamingDangerousTags: /^<(iframe|object|embed|applet)[\s>]/i,
	/** Image tag detection for streaming */
	streamingImgTag: /^<img[\s>]/i,
	/** Anchor tag detection for streaming */
	streamingAnchorTag: /^<a[\s>]/i
} as const;

// ============================================================================
// Types
// ============================================================================

export interface AiFilterConfig {
	/** Enable/disable the entire security filter. Default: true */
	enabled?: boolean;
	/**
	 * Allowed domains for external resources. Supports wildcards (*.example.com).
	 * @deprecated Use `allowedImageDomains` and `allowedLinkDomains` for granular control.
	 */
	allowedDomains?: string[];
	/** Allowed domains for images. Supports wildcards (*.example.com). */
	allowedImageDomains?: string[];
	/** Allowed domains for links. Supports wildcards (*.example.com). */
	allowedLinkDomains?: string[];
	/** Block ALL external resources regardless of whitelist. Default: false */
	strictMode?: boolean;
	/** Enable image filtering. Default: true */
	filterImages?: boolean;
	/** Enable link filtering. Default: true */
	filterLinks?: boolean;
	/** Callback to notify about blocked URLs. Called with blocked URL info after filtering. */
	onUrlBlocked?: ( blockedUrls: BlockedUrlInfo ) => void;
}

export interface BlockedUrlInfo {
	images: string[];
	links: string[];
}

interface ResolvedConfig {
	enabled: boolean;
	allowedImageDomains: string[];
	allowedLinkDomains: string[];
	strictMode: boolean;
	filterImages: boolean;
	filterLinks: boolean;
	onUrlBlocked?: ( blockedUrls: BlockedUrlInfo ) => void;
}

export interface FilterState {
	buffer: string;
	inTag: boolean;
	tagType: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Resolves partial config into complete config with defaults.
 * Supports legacy `allowedDomains` for backwards compatibility.
 */
const resolveConfig = ( config?: AiFilterConfig ): ResolvedConfig => {
	// Support legacy allowedDomains for backwards compatibility
	// If legacy allowedDomains is set, use it for both; otherwise use separate defaults
	const hasLegacyDomains = config?.allowedDomains !== undefined;

	return {
		enabled: config?.enabled !== false,
		allowedImageDomains: config?.allowedImageDomains ||
			( hasLegacyDomains ? config!.allowedDomains! : [ ...DEFAULT_ALLOWED_IMAGE_DOMAINS ] ),
		allowedLinkDomains: config?.allowedLinkDomains ||
			( hasLegacyDomains ? config!.allowedDomains! : [ ...DEFAULT_ALLOWED_LINK_DOMAINS ] ),
		strictMode: config?.strictMode === true,
		filterImages: config?.filterImages !== false,
		filterLinks: config?.filterLinks !== false,
		onUrlBlocked: config?.onUrlBlocked
	};
};

/**
 * Escapes special regex characters in a string.
 */
const escapeRegExp = ( str: string ): string =>
	str.replace( PATTERNS.regexEscape, '\\$&' );

/**
 * Extracts a safe filename from a URL for placeholder display.
 */
const extractFilename = ( url: string ): string => {
	try {
		const pathPart = url.split( '?' )[ 0 ].split( '#' )[ 0 ];
		const filename = pathPart.split( '/' ).pop() || DEFAULT_FILENAME;
		return filename.substring( 0, MAX_FILENAME_LENGTH );
	} catch {
		return DEFAULT_FILENAME;
	}
};

/**
 * Checks if a URL starts with any of the safe prefixes.
 */
const hasSafePrefix = ( url: string ): boolean =>
	SAFE_URL_PREFIXES.some( prefix => url.startsWith( prefix ) );

/**
 * Checks if a hostname matches an allowed domain pattern.
 */
const matchesDomainPattern = ( hostname: string, pattern: string ): boolean => {
	if ( pattern === hostname ) return true;

	if ( pattern.startsWith( WILDCARD_PREFIX ) ) {
		const baseDomain = pattern.substring( WILDCARD_PREFIX.length );
		return hostname.endsWith( `.${ baseDomain }` ) || hostname === baseDomain;
	}

	return false;
};

/**
 * Validates whether a URL is allowed based on the whitelist.
 */
const isUrlAllowed = ( url: string, allowedDomains: string[] ): boolean => {
	if ( !url ) return false;

	try {
		if ( hasSafePrefix( url ) ) return true;

		const urlObj = new URL( url, typeof window !== 'undefined' ? window.location.href : undefined );
		const { hostname } = urlObj;

		// Allow same-origin URLs
		if ( typeof window !== 'undefined' && hostname === window.location.hostname ) {
			return true;
		}

		return allowedDomains.some( pattern => matchesDomainPattern( hostname, pattern ) );
	} catch {
		return false; // Invalid URL - block it
	}
};

/**
 * Determines if an image URL should be blocked based on config.
 */
const shouldBlockImageUrl = ( url: string, config: ResolvedConfig ): boolean =>
	config.strictMode || !isUrlAllowed( url, config.allowedImageDomains );

/**
 * Determines if a link URL should be blocked based on config.
 */
const shouldBlockLinkUrl = ( url: string, config: ResolvedConfig ): boolean =>
	config.strictMode || !isUrlAllowed( url, config.allowedLinkDomains );

/**
 * Creates a blocked URL tracker for collecting blocked URLs during filtering.
 */
const createBlockedUrlTracker = (): BlockedUrlInfo => ( {
	images: [],
	links: []
} );

/**
 * Records a blocked URL in the tracker.
 */
const recordBlockedUrl = (
	tracker: BlockedUrlInfo,
	url: string,
	type: 'image' | 'link'
): void => {
	if ( !url ) return;
	const list = type === 'image' ? tracker.images : tracker.links;
	if ( !list.includes( url ) ) {
		list.push( url );
	}
};

/**
 * Checks if the placeholder image service is allowed by the config.
 */
const isPlaceholderServiceAllowed = ( config: ResolvedConfig ): boolean =>
	config.allowedImageDomains.some( domain => matchesDomainPattern( PLACEHOLDER_SERVICE_DOMAIN, domain ) );

/**
 * Gets the replacement image source.
 * Uses BASE64 gray pixel if strict mode is enabled OR if promptahuman.com is not whitelisted.
 * This ensures we don't violate the user's security config by replacing blocked images
 * with another external URL they haven't explicitly allowed.
 */
const getReplacementImageSrc = ( originalUrl: string, config: ResolvedConfig ): string => {
	if ( config.strictMode || !isPlaceholderServiceAllowed( config ) ) {
		return GRAY_PIXEL_BASE64;
	}
	return PLACEHOLDER_IMAGE_URL + encodeURIComponent( extractFilename( originalUrl ) );
};

/**
 * Parses reference-style definitions from Markdown content.
 */
const parseMarkdownReferences = ( markdown: string ): Map<string, string> => {
	const refs = new Map<string, string>();
	const pattern = new RegExp( PATTERNS.markdownReference.source, 'gm' );
	let match;
	while ( ( match = pattern.exec( markdown ) ) !== null ) {
		refs.set( match[ 1 ].toLowerCase(), match[ 2 ] );
	}
	return refs;
};

/**
 * Creates a regex pattern to find reference usage in markdown.
 */
const createRefUsagePattern = ( refName: string, isImage: boolean ): RegExp => {
	const escaped = escapeRegExp( refName );
	return isImage
		? new RegExp( `!\\[[^\\]]*\\]\\[${ escaped }\\]`, 'i' )
		: new RegExp( `(?<!!)\\[[^\\]]+\\]\\[${ escaped }\\]`, 'i' );
};

// ============================================================================
// HTML Filtering
// ============================================================================

/**
 * Filters HTML content for dangerous elements, images, and links.
 */
const filterHtmlContent = (
	html: string,
	config: ResolvedConfig,
	blockedUrls: BlockedUrlInfo
): string => {
	if ( !config.enabled ) return html;

	const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
	if ( !parser ) return html;

	const doc = parser.parseFromString( html, 'text/html' );

	// Always remove dangerous elements
	doc.querySelectorAll( DANGEROUS_ELEMENTS_SELECTOR ).forEach( el => el.remove() );

	// Filter images
	if ( config.filterImages ) {
		doc.querySelectorAll( 'img' ).forEach( img => {
			const src = img.getAttribute( 'src' ) || '';
			if ( shouldBlockImageUrl( src, config ) ) {
				recordBlockedUrl( blockedUrls, src, 'image' );
				const replacementSrc = getReplacementImageSrc( src, config );
				img.setAttribute( 'src', replacementSrc );
				img.removeAttribute( 'srcset' );

				// Set visible dimensions when using the BASE64 placeholder
				if ( replacementSrc === GRAY_PIXEL_BASE64 ) {
					img.setAttribute( 'width', String( BLOCKED_IMAGE_WIDTH ) );
					img.setAttribute( 'height', String( BLOCKED_IMAGE_HEIGHT ) );
				}
			}
		} );

		// Filter SVG images
		doc.querySelectorAll( SVG_IMAGE_SELECTOR ).forEach( svgImg => {
			const href = svgImg.getAttribute( 'href' ) || svgImg.getAttributeNS( XLINK_NAMESPACE, 'href' ) || '';
			if ( shouldBlockImageUrl( href, config ) ) {
				recordBlockedUrl( blockedUrls, href, 'image' );
				svgImg.remove();
			}
		} );
	}

	// Filter links
	if ( config.filterLinks ) {
		doc.querySelectorAll( 'a' ).forEach( anchor => {
			const href = anchor.getAttribute( 'href' ) || '';
			if ( href && shouldBlockLinkUrl( href, config ) ) {
				recordBlockedUrl( blockedUrls, href, 'link' );
				anchor.removeAttribute( 'href' );
				anchor.setAttribute( BLOCKED_LINK_ATTR, 'true' );
			}
		} );
	}

	return doc.body.innerHTML;
};

// ============================================================================
// Markdown Filtering
// ============================================================================

/**
 * Filters inline markdown resources (images or links).
 */
const filterMarkdownInline = (
	content: string,
	pattern: RegExp,
	config: ResolvedConfig,
	isImage: boolean,
	blockedUrls: BlockedUrlInfo
): string => {
	const regex = new RegExp( pattern.source, pattern.flags );
	const shouldBlock = isImage ? shouldBlockImageUrl : shouldBlockLinkUrl;

	return content.replace( regex, ( match, textOrAlt, url ) => {
		if ( shouldBlock( url, config ) ) {
			recordBlockedUrl( blockedUrls, url, isImage ? 'image' : 'link' );
			return isImage
				? `![${ textOrAlt }](${ getReplacementImageSrc( url, config ) })`
				: textOrAlt; // For links, return just the text
		}
		return match;
	} );
};

/**
 * Filters reference-style markdown resources (images or links).
 */
const filterMarkdownReference = (
	content: string,
	pattern: RegExp,
	references: Map<string, string>,
	config: ResolvedConfig,
	isImage: boolean,
	blockedUrls: BlockedUrlInfo
): string => {
	const regex = new RegExp( pattern.source, pattern.flags );
	const shouldBlock = isImage ? shouldBlockImageUrl : shouldBlockLinkUrl;

	return content.replace( regex, ( match, textOrAlt, ref ) => {
		const refKey = ( ref || textOrAlt ).toLowerCase();
		const url = references.get( refKey );
		if ( url && shouldBlock( url, config ) ) {
			recordBlockedUrl( blockedUrls, url, isImage ? 'image' : 'link' );
			return isImage
				? `![${ textOrAlt }](${ getReplacementImageSrc( url, config ) })`
				: textOrAlt; // For links, return just the text
		}
		return match;
	} );
};

/**
 * Removes orphaned reference definitions for blocked URLs.
 */
const cleanupMarkdownReferences = (
	content: string,
	originalMarkdown: string,
	config: ResolvedConfig
): string => {
	const regex = new RegExp( PATTERNS.markdownRefDefinition.source, 'gm' );
	return content.replace( regex, ( match, refName, url ) => {
		// Check image references
		if ( config.filterImages ) {
			const imagePattern = createRefUsagePattern( refName, true );
			if ( imagePattern.test( originalMarkdown ) && shouldBlockImageUrl( url, config ) ) {
				return '';
			}
		}

		// Check link references
		if ( config.filterLinks ) {
			const linkPattern = createRefUsagePattern( refName, false );
			if ( linkPattern.test( originalMarkdown ) && shouldBlockLinkUrl( url, config ) ) {
				return '';
			}
		}

		return match;
	} );
};

/**
 * Filters Markdown content for images and links.
 */
const filterMarkdownContent = (
	markdown: string,
	config: ResolvedConfig,
	blockedUrls: BlockedUrlInfo
): string => {
	if ( !config.enabled ) return markdown;

	let filtered = markdown;
	const references = parseMarkdownReferences( markdown );

	// Filter images
	if ( config.filterImages ) {
		filtered = filterMarkdownInline( filtered, PATTERNS.markdownInlineImage, config, true, blockedUrls );
		filtered = filterMarkdownReference( filtered, PATTERNS.markdownRefImage, references, config, true, blockedUrls );
	}

	// Filter links
	if ( config.filterLinks ) {
		filtered = filterMarkdownInline( filtered, PATTERNS.markdownInlineLink, config, false, blockedUrls );
		filtered = filterMarkdownReference( filtered, PATTERNS.markdownRefLink, references, config, false, blockedUrls );
	}

	// Clean up orphaned reference definitions
	filtered = cleanupMarkdownReferences( filtered, markdown, config );

	return filtered;
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Main filter function for AI-generated content.
 * Automatically detects HTML vs Markdown content.
 * Calls onUrlBlocked callback if any URLs were blocked.
 */
export const filterAiImages = ( content: string, config?: AiFilterConfig ): string => {
	if ( !content ) return content;

	const resolvedConfig = resolveConfig( config );
	const blockedUrls = createBlockedUrlTracker();
	const isHtml = PATTERNS.htmlDetection.test( content );

	const filtered = isHtml
		? filterHtmlContent( content, resolvedConfig, blockedUrls )
		: filterMarkdownContent( content, resolvedConfig, blockedUrls );

	// Notify about blocked URLs if any were found
	const hasBlockedUrls = blockedUrls.images.length > 0 || blockedUrls.links.length > 0;
	if ( hasBlockedUrls && resolvedConfig.onUrlBlocked ) {
		resolvedConfig.onUrlBlocked( blockedUrls );
	}

	return filtered;
};

/**
 * Filters streaming content chunks in real-time.
 * Buffers potentially dangerous tags until complete, then filters them.
 */
export const filterAiStreamingChunk = (
	chunk: string,
	state?: FilterState,
	config?: AiFilterConfig
): string => {
	const filterState: FilterState = state || { buffer: '', inTag: false, tagType: null };
	const resolvedConfig = resolveConfig( config );

	if ( !resolvedConfig.enabled ) return chunk;

	let output = '';

	for ( let i = 0; i < chunk.length; i++ ) {
		const char = chunk[ i ];

		if ( !filterState.inTag && char === '<' ) {
			const remaining = chunk.substring( i );

			// Always filter dangerous elements
			const dangerousMatch = remaining.match( PATTERNS.streamingDangerousTags );
			if ( dangerousMatch ) {
				filterState.inTag = true;
				filterState.buffer = char;
				filterState.tagType = dangerousMatch[ 1 ].toLowerCase();
				continue;
			}

			// Filter images if enabled
			if ( resolvedConfig.filterImages && PATTERNS.streamingImgTag.test( remaining ) ) {
				filterState.inTag = true;
				filterState.buffer = char;
				filterState.tagType = 'img';
				continue;
			}

			// Filter links if enabled
			if ( resolvedConfig.filterLinks && PATTERNS.streamingAnchorTag.test( remaining ) ) {
				filterState.inTag = true;
				filterState.buffer = char;
				filterState.tagType = 'a';
				continue;
			}
		}

		if ( filterState.inTag ) {
			filterState.buffer += char;

			if ( char === '>' ) {
				output += filterAiImages( filterState.buffer, config );
				filterState.inTag = false;
				filterState.buffer = '';
				filterState.tagType = null;
			}
		} else {
			output += char;
		}
	}

	return output;
};
