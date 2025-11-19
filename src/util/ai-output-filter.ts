import DOMPurify from 'dompurify';

export interface AiOutputSecurityConfig {
	allowedDomains?: string[];
	strictMode?: boolean;
	alwaysAllowedDomains?: string[];
}

const DEFAULT_CONFIG: Required<AiOutputSecurityConfig> = {
	allowedDomains: [
		'unsplash.com',
		'pexels.com',
		'pixabay.com',
		'githubusercontent.com',
		'github.com'
	],
	strictMode: false,
	alwaysAllowedDomains: [ 'promptahuman.com' ]
};

export class AiOutputFilter {
	private config: Required<AiOutputSecurityConfig>;

	constructor( config: AiOutputSecurityConfig = {} ) {
		this.config = {
			...DEFAULT_CONFIG,
			...config,
			allowedDomains: config.allowedDomains || DEFAULT_CONFIG.allowedDomains,
			alwaysAllowedDomains: config.alwaysAllowedDomains || DEFAULT_CONFIG.alwaysAllowedDomains
		};
	}

	public filter( html: string ): string {
		const cleaned = DOMPurify.sanitize( html, {
			ALLOWED_TAGS: [
				'p', 'br', 'strong', 'em', 'u', 's', 'i', 'b',
				'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
				'ul', 'ol', 'li',
				'a', 'img',
				'table', 'thead', 'tbody', 'tr', 'th', 'td',
				'blockquote', 'pre', 'code',
				'div', 'span'
			],
			ALLOWED_ATTR: [ 'href', 'src', 'alt', 'title', 'class', 'id' ],
			FORBID_TAGS: [ 'iframe', 'script', 'form', 'input', 'button', 'object', 'embed' ],
			FORBID_ATTR: [ 'onclick', 'onerror', 'onload', 'onmouseover', 'onmouseout', 'onfocus', 'onblur' ],
			KEEP_CONTENT: true,
			ALLOW_DATA_ATTR: false,
			ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
		} );

		return this.validateUrls( cleaned );
	}

	private validateUrls( html: string ): string {
		const div = document.createElement( 'div' );
		div.innerHTML = html;

		const images = div.querySelectorAll( 'img' );
		images.forEach( img => {
			const src = img.getAttribute( 'src' );
			if ( src && !this.isUrlAllowed( src ) ) {
				img.setAttribute( 'src', '' );
				img.setAttribute( 'data-filtered', 'true' );
			}
		} );

		return div.innerHTML;
	}

	private isUrlAllowed( url: string ): boolean {
		if ( !url || url.trim() === '' ) {
			return false;
		}

		if ( url.startsWith( '/' ) || url.startsWith( './' ) || url.startsWith( '../' ) ) {
			return true;
		}

		if ( url.startsWith( '#' ) ) {
			return true;
		}

		if ( url.startsWith( 'data:' ) ) {
			return true;
		}

		if ( url.startsWith( 'mailto:' ) || url.startsWith( 'tel:' ) ) {
			return true;
		}

		let urlObj: URL;
		try {
			urlObj = new URL( url );
		} catch ( e ) {
			return false;
		}

		const hostname = urlObj.hostname.toLowerCase();

		if ( this.isDomainMatch( hostname, this.config.alwaysAllowedDomains ) ) {
			return true;
		}

		if ( this.config.strictMode ) {
			return false;
		}

		return this.isDomainMatch( hostname, this.config.allowedDomains );
	}

	private isDomainMatch( hostname: string, domains: string[] ): boolean {
		for ( const domain of domains ) {
			const domainLower = domain.toLowerCase();

			if ( domainLower.startsWith( '*.' ) ) {
				const baseDomain = domainLower.substring( 2 );
				if ( hostname === baseDomain || hostname.endsWith( '.' + baseDomain ) ) {
					return true;
				}
			} else {
				if ( hostname === domainLower ) {
					return true;
				}
			}
		}

		return false;
	}

	public updateConfig( config: Partial<AiOutputSecurityConfig> ): void {
		this.config = {
			...this.config,
			...config,
			allowedDomains: config.allowedDomains || this.config.allowedDomains,
			alwaysAllowedDomains: config.alwaysAllowedDomains || this.config.alwaysAllowedDomains
		};
	}

	public getConfig(): Required<AiOutputSecurityConfig> {
		return { ...this.config };
	}
}

export const defaultAiOutputFilter = new AiOutputFilter();
