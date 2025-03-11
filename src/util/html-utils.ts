import type { Editor } from 'ckeditor5/src/core.js';

// Map of CKEditor nodes to HTML tags
const nodeToHtmlMap: Record<string, string> = {
	blockQuote: 'blockquote',
	caption: 'figcaption',
	codeBlock: 'pre',
	heading1: 'h1',
	heading2: 'h2',
	heading3: 'h3',
	imageBlock: 'img',
	imageInline: 'img',
	paragraph: 'p',
	table: 'table',
	tableCell: 'td',
	tableRow: 'tr',
	$listItem: 'li',
	horizontalLine: 'hr'
};

// Map text attributes to HTML tags
const textAttributeToHtmlMap: Record<string, string> = {
	bold: 'strong',
	italic: 'em',
	code: 'code',
	strikethrough: 's',
	subscript: 'sub',
	superscript: 'sup',
	underline: 'u',
	linkHref: 'a'
};

/**
 * Gets the allowed HTML tags from the editor schema and GeneralHtmlSupport configuration.
 *
 * @param editor - The CKEditor instance
 * @returns Array of allowed HTML tag names
 */
export function getAllowedHtmlTags( editor: Editor ): Array<string> {
	const schema = editor.model.schema;
	const definitions = schema.getDefinitions();
	const schemaNodes = Object.keys( definitions ).sort();
	const allowedTags = new Set<string>();

	// Add tags from node mappings
	schemaNodes.forEach( node => {
		if ( node in nodeToHtmlMap ) {
			allowedTags.add( nodeToHtmlMap[ node ] );
		}
	} );

	// Add tags from text attributes
	const textDefinition = definitions.$text;
	if ( textDefinition && textDefinition.allowAttributes ) {
		textDefinition.allowAttributes.forEach( ( attr: string ) => {
			if ( attr in textAttributeToHtmlMap ) {
				allowedTags.add( textAttributeToHtmlMap[ attr ] );
			}
		} );
	}

	// If listItem is present, add ul and ol
	if ( allowedTags.has( 'li' ) ) {
		allowedTags.add( 'ul' );
		allowedTags.add( 'ol' );
	}

	// Add tags from GeneralHtmlSupport configuration if available
	const htmlSupportConfig = editor.config.get( 'htmlSupport' );
	if ( htmlSupportConfig && htmlSupportConfig.allow ) {
		htmlSupportConfig.allow.forEach( ( rule: any ) => {
			if ( rule.name ) {
				// Handle string names
				if ( typeof rule.name === 'string' ) {
					allowedTags.add( rule.name );
				}
				// Handle regex patterns
				else if ( rule.name instanceof RegExp ) {
					// Extract tag names from regex pattern if possible
					const regexStr = rule.name.toString();
					const match = regexStr.match( /\^?\(?([a-zA-Z0-9\-|]+)\)?\$?/ );
					if ( match && match[ 1 ] ) {
						match[ 1 ].split( '|' ).forEach( ( tag: string ) => {
							allowedTags.add( tag );
						} );
					}
				}
			}
		} );
	}

	return Array.from( allowedTags ).sort();
}

/**
 * Gets the allowed HTML classes from the GeneralHtmlSupport configuration.
 *
 * @param editor - The CKEditor instance
 * @returns Array of allowed HTML class names
 */
export function getAllowedHtmlClasses( editor: Editor ): Array<string> {
	const allowedClasses = new Set<string>();

	// Add classes from GeneralHtmlSupport configuration if available
	const htmlSupportConfig = editor.config.get( 'htmlSupport' );
	if ( htmlSupportConfig && htmlSupportConfig.allow ) {
		htmlSupportConfig.allow.forEach( ( rule: any ) => {
			if ( rule.classes ) {
				// Handle array of classes
				if ( Array.isArray( rule.classes ) ) {
					rule.classes.forEach( ( className: string | RegExp ) => {
						if ( typeof className === 'string' ) {
							allowedClasses.add( className );
						}
					} );
				}
				// Handle true value (all classes allowed for this element)
				// We don't add anything in this case as we can't enumerate all possible classes
			}
		} );
	}

	return Array.from( allowedClasses ).sort();
}
