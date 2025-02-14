import type { Editor } from 'ckeditor5/src/core.js';

export interface AttributeConfig {

	/**
	 * Whether to preserve all values for this attribute
	 */
	preserveAll?: boolean;

	/**
	 * List of allowed selectors. Can include:
	 * - Simple class names: '.btn'
	 * - Complex selectors: '[class^="col-"]'
	 * - Multiple patterns: '[class*="col-"],[class*="cols-"]'
	 */
	allowedSelectors?: Array<string>;
}

export interface HtmlCleanupConfig {

	/**
	 * Map of attribute names to their configuration
	 */
	attributes: Record<string, AttributeConfig>;

	/**
	 * CSS selectors for elements that should be removed before cleanup
	 */
	blacklist: Array<string>;
}

export interface HtmlCleanupOptions {

	/**
	 * Configuration for HTML cleanup
	 */
	config: HtmlCleanupConfig;

	/**
	 * CKEditor instance for extensibility
	 */
	editor: Editor;
}

/**
 * Default configuration that can be extended
 */
export const DEFAULT_HTML_CLEANUP_CONFIG: HtmlCleanupConfig = {
	attributes: {
		'id': {
			preserveAll: true
		},
		'alt': {
			preserveAll: true
		},
		'title': {
			preserveAll: true
		},
		'href': {
			preserveAll: true // Preserves link destinations
		},
		'type': {
			preserveAll: true // Preserves input types for better form understanding
		},
		'name': {
			preserveAll: true // Preserves form field names
		},
		'placeholder': {
			preserveAll: true
		},
		'class': {
			allowedSelectors: [
				// Layout classes
				'[class*="col-"]',
				'.col',
				'[class*="row"]',
				'[class*="container"]',

				// UI elements
				'.btn',
				'.button',
				'.card',
				'.panel',
				'.list',
				'.grid',

				// Media
				'[class*="image"]',
				'[class*="video"]',

				// Navigation
				'.nav',
				'.header',
				'.footer',
				'.sidebar'
			]
		}
	},
	blacklist: [
		// UI Controls - only essential ones
		'.controls',
		'.dxpr-builder-ui',

		// Resource tags - only essential ones
		'style',
		'script',
		'link[rel="stylesheet"]',
		'meta',
		'noscript'
	]
};
