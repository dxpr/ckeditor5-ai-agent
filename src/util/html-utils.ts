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
 * Gets the allowed HTML classes from the GeneralHtmlSupport configuration and Style plugin.
 *
 * @param editor - The CKEditor instance
 * @returns Object containing allowed classes and a flag indicating if any element allows all classes
 */
export function getAllowedHtmlClasses( editor: Editor ): { classes: Array<string>; allowsAllClasses: boolean } {
	const allowedClasses = new Set<string>();
	let allowsAllClasses = false;

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
				else if ( rule.classes === true ) {
					allowsAllClasses = true;
				}
			}
		} );
	}

	// Add classes from Style plugin definitions if available
	const styleConfig = editor.config.get( 'style' );
	if ( styleConfig && styleConfig.definitions ) {
		styleConfig.definitions.forEach( ( definition: any ) => {
			if ( definition.classes && Array.isArray( definition.classes ) ) {
				definition.classes.forEach( ( className: string ) => {
					if ( typeof className === 'string' ) {
						allowedClasses.add( className );
					}
				} );
			}
		} );
	}

	return {
		classes: Array.from( allowedClasses ).sort(),
		allowsAllClasses
	};
}

/**
 * Gets the allowed HTML styles from the GeneralHtmlSupport configuration.
 *
 * @param editor - The CKEditor instance
 * @returns Object containing allowed styles and a flag indicating if any element allows all styles
 */
export function getAllowedHtmlStyles( editor: Editor ): { styles: Array<string>; allowsAllStyles: boolean } {
	const allowedStyles = new Set<string>();
	let allowsAllStyles = false;

	// Add styles from GeneralHtmlSupport configuration if available
	const htmlSupportConfig = editor.config.get( 'htmlSupport' );
	if ( htmlSupportConfig && htmlSupportConfig.allow ) {
		htmlSupportConfig.allow.forEach( ( rule: any ) => {
			if ( rule.styles ) {
				// Handle object with specific styles
				if ( typeof rule.styles === 'object' && rule.styles !== null && !Array.isArray( rule.styles ) ) {
					Object.entries( rule.styles ).forEach( ( [ styleName, styleValue ] ) => {
						// If the style value is true (meaning any value is allowed) or a specific value
						if ( styleValue === true ) {
							allowedStyles.add( `${ styleName }: *` );
						} else if ( typeof styleValue === 'string' ) {
							allowedStyles.add( `${ styleName }: ${ styleValue }` );
						}
					} );
				}
				// Handle true value (all styles allowed for this element)
				else if ( rule.styles === true ) {
					allowsAllStyles = true;
				}
			}
		} );
	}

	return {
		styles: Array.from( allowedStyles ).sort(),
		allowsAllStyles
	};
}

/**
 * Gets the allowed HTML attributes from the GeneralHtmlSupport configuration.
 *
 * @param editor - The CKEditor instance
 * @returns Object containing allowed attributes and a flag indicating if any element allows all attributes
 */
export function getAllowedHtmlAttributes( editor: Editor ): { attributes: Array<string>; allowsAllAttributes: boolean } {
	const allowedAttributes = new Set<string>();
	let allowsAllAttributes = false;

	// Add attributes from GeneralHtmlSupport configuration if available
	const htmlSupportConfig = editor.config.get( 'htmlSupport' );
	if ( htmlSupportConfig && htmlSupportConfig.allow ) {
		htmlSupportConfig.allow.forEach( ( rule: any ) => {
			if ( rule.attributes ) {
				// Handle object with specific attributes
				if ( typeof rule.attributes === 'object' && rule.attributes !== null && !Array.isArray( rule.attributes ) ) {
					Object.entries( rule.attributes ).forEach( ( [ attrName, attrValue ] ) => {
						// If the attribute value is true (meaning any value is allowed) or a specific value
						if ( attrValue === true ) {
							allowedAttributes.add( `${ attrName }="*"` );
						} else if ( typeof attrValue === 'string' ) {
							allowedAttributes.add( `${ attrName }="${ attrValue }"` );
						}
					} );
				}
				// Handle true value (all attributes allowed for this element)
				else if ( rule.attributes === true ) {
					allowsAllAttributes = true;
				}
			}
		} );
	}

	return {
		attributes: Array.from( allowedAttributes ).sort(),
		allowsAllAttributes
	};
}
