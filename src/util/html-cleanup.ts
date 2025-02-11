import type { Editor } from 'ckeditor5/src/core.js';
import { DEFAULT_HTML_CLEANUP_CONFIG, type HtmlCleanupConfig, type HtmlCleanupOptions } from '../types/html-cleanup.js';

/**
 * Service for cleaning up HTML content based on configurable rules
 */
export class HtmlCleanupService {
	private config: HtmlCleanupConfig;
	private editor: Editor;

	constructor( options: HtmlCleanupOptions ) {
		this.editor = options.editor;

		// Merge default config with user config
		const userConfig = this.editor.config.get( 'aiAgent.htmlCleanup' ) ?? {};
		this.config = this.mergeConfigs( DEFAULT_HTML_CLEANUP_CONFIG, userConfig );
	}

	/**
	 * Clean HTML content based on configuration
	 *
	 * @param html - HTML content to clean
	 * @returns Cleaned HTML content
	 */
	public clean( html: string ): string {
		if ( this.editor.config.get( 'aiAgent.debugMode' ) ) {
			console.log( '[HTML Cleanup] Initial HTML:', html );
		}

		// Simple string replacement for inline-slash
		const slashCommand = '<inline-slash class="ck-slash">/test</inline-slash>';
		html = html.split( slashCommand ).join( '@@@cursor@@@' );

		// Simple string replacement for cursor marker in span
		const spanWrappedCursor = '<span class="ck-list-bogus-paragraph">@@@cursor@@@</span>';
		html = html.split( spanWrappedCursor ).join( '@@@cursor@@@' );

		if ( this.editor.config.get( 'aiAgent.debugMode' ) ) {
			console.log( '[HTML Cleanup] After cursor cleanup:', html );
		}

		const parser = new DOMParser();
		const doc = parser.parseFromString( html, 'text/html' );

		// Remove blacklisted elements
		this.removeBlacklistedElements( doc.body );

		// Clean remaining elements
		this.cleanNode( doc.body );

		const result = doc.body.innerHTML;

		if ( this.editor.config.get( 'aiAgent.debugMode' ) ) {
			console.log( '[HTML Cleanup] Final result:', result );
		}

		return result;
	}

	/**
	 * Remove elements matching blacklisted selectors
	 *
	 * @param node - Root node to process
	 */
	private removeBlacklistedElements( node: Element ): void {
		// Process all blacklisted selectors
		for ( const selector of this.config.blacklist ) {
			const elements = node.querySelectorAll( selector );
			elements.forEach( element => element.remove() );
		}
	}

	/**
	 * Recursively clean a DOM node and its children
	 *
	 * @param node - DOM node to clean
	 */
	private cleanNode( node: Element ): void {
		// Process attributes on current node
		if ( node.hasAttributes() ) {
			const attributes = Array.from( node.attributes );
			for ( const attr of attributes ) {
				const attrConfig = this.config.attributes[ attr.name ];

				if ( !attrConfig ) {
					// Remove attributes not in config
					node.removeAttribute( attr.name );
					continue;
				}

				if ( attrConfig.preserveAll ) {
					// Keep attribute as is
					continue;
				}

				if ( attrConfig.allowedSelectors && attr.name === 'class' ) {
					// For class attributes, check each class against selectors
					const classNames = attr.value.split( ' ' );
					const allowedClasses = classNames.filter( className => {
						// Create a temporary element to test selectors against
						const testElement = document.createElement( 'div' );
						testElement.className = className;

						// Check if the class matches any of our selectors
						return attrConfig.allowedSelectors!.some( selector => {
							try {
								return testElement.matches( selector ) ||
									// Handle direct class name comparison for backward compatibility
									selector.replace( /^\./, '' ) === className;
							} catch ( e ) {
								// If selector is invalid, try as a RegExp pattern
								try {
									const pattern = new RegExp( selector.replace( /\./g, '\\.' ) );
									return pattern.test( className );
								} catch {
									return false;
								}
							}
						} );
					} );

					if ( allowedClasses.length ) {
						node.setAttribute( attr.name, allowedClasses.join( ' ' ) );
					} else {
						node.removeAttribute( attr.name );
					}
				}
			}
		}

		// Process child nodes
		const children = Array.from( node.children );
		for ( const child of children ) {
			this.cleanNode( child );
		}
	}

	/**
	 * Deep merge two configurations
	 *
	 * @param defaultConfig - Default configuration
	 * @param userConfig - User provided configuration
	 * @returns Merged configuration
	 */
	private mergeConfigs( defaultConfig: HtmlCleanupConfig, userConfig: Partial<HtmlCleanupConfig> ): HtmlCleanupConfig {
		const merged: HtmlCleanupConfig = {
			attributes: { ...defaultConfig.attributes },
			blacklist: [ ...defaultConfig.blacklist ]
		};

		if ( userConfig.attributes ) {
			for ( const [ key, value ] of Object.entries( userConfig.attributes ) ) {
				if ( merged.attributes[ key ] ) {
					// Merge attribute configs
					merged.attributes[ key ] = {
						...merged.attributes[ key ],
						...value
					};
				} else {
					// Add new attribute config
					merged.attributes[ key ] = value;
				}
			}
		}

		if ( userConfig.blacklist ) {
			merged.blacklist = [ ...merged.blacklist, ...userConfig.blacklist ];
		}

		return merged;
	}
}
