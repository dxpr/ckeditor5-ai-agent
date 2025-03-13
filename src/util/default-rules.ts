import { getAllowedHtmlTags, getAllowedHtmlClasses, getAllowedHtmlStyles, getAllowedHtmlAttributes } from './html-utils.js';
// Import the JSON file directly
// We're using a simple import without assertions to avoid compatibility issues
import defaultRulesJson from '../config/default-rules.json';

export function getDefaultRules( editor: any ): { [key: string]: string } {
	const rules = { ...defaultRulesJson };

	// Replace the placeholder in htmlFormatting with actual allowed tags
	if ( rules.htmlFormatting?.includes( '{{ALLOWED_HTML_TAGS}}' ) ) {
		const allowedTags = getAllowedHtmlTags( editor );
		const tagsText = allowedTags.length > 0 ?
			`Use only these tags: ${ allowedTags.join( ', ' ) }.` :
			'No HTML tags are allowed.';

		rules.htmlFormatting = rules.htmlFormatting.replace(
			'<ALLOWED_TAGS>{{ALLOWED_HTML_TAGS}}</ALLOWED_TAGS>',
			tagsText
		);
	}

	// Replace the placeholder in htmlFormatting with actual allowed classes
	if ( rules.htmlFormatting?.includes( '{{ALLOWED_HTML_CLASSES}}' ) ) {
		const { classes: allowedClasses, allowsAllClasses } = getAllowedHtmlClasses( editor );

		let classesText;
		if ( allowsAllClasses ) {
			if ( allowedClasses.length > 0 ) {
				// If we have both all classes allowed and specific classes defined
				classesText = `Any CSS classes are allowed. Suggested classes: ${ allowedClasses.join( ', ' ) }.`;
			} else {
				// If all classes are allowed but no specific classes are defined
				classesText = 'Any CSS classes are allowed.';
			}
		} else if ( allowedClasses.length > 0 ) {
			// If only specific classes are allowed
			classesText = `Use only these classes: ${ allowedClasses.join( ', ' ) }.`;
		} else {
			// If no classes are allowed
			classesText = 'Do not use any CSS classes.';
		}

		rules.htmlFormatting = rules.htmlFormatting.replace(
			'<ALLOWED_CLASSES>{{ALLOWED_HTML_CLASSES}}</ALLOWED_CLASSES>',
			classesText
		);
	}

	// Replace the placeholder in htmlFormatting with actual allowed styles
	if ( rules.htmlFormatting?.includes( '{{ALLOWED_HTML_STYLES}}' ) ) {
		const { styles: allowedStyles, allowsAllStyles } = getAllowedHtmlStyles( editor );

		let stylesText;
		if ( allowsAllStyles ) {
			if ( allowedStyles.length > 0 ) {
				// If we have both all styles allowed and specific styles defined
				stylesText = `Any inline styles are allowed. Suggested styles: ${ allowedStyles.join( ', ' ) }.`;
			} else {
				// If all styles are allowed but no specific styles are defined
				stylesText = 'Any inline styles are allowed.';
			}
		} else if ( allowedStyles.length > 0 ) {
			// If only specific styles are allowed
			stylesText = `Use only these inline styles: ${ allowedStyles.join( ', ' ) }.`;
		} else {
			// If no styles are allowed
			stylesText = 'Do not use any inline styles.';
		}

		rules.htmlFormatting = rules.htmlFormatting.replace(
			'<ALLOWED_STYLES>{{ALLOWED_HTML_STYLES}}</ALLOWED_STYLES>',
			stylesText
		);
	}

	// Replace the placeholder in htmlFormatting with actual allowed attributes
	if ( rules.htmlFormatting?.includes( '{{ALLOWED_HTML_ATTRIBUTES}}' ) ) {
		const { attributes: allowedAttributes, allowsAllAttributes } = getAllowedHtmlAttributes( editor );

		let attributesText;
		if ( allowsAllAttributes ) {
			if ( allowedAttributes.length > 0 ) {
				// If we have both all attributes allowed and specific attributes defined
				attributesText = `Any HTML attributes are allowed. Suggested attributes: ${ allowedAttributes.join( ', ' ) }.`;
			} else {
				// If all attributes are allowed but no specific attributes are defined
				attributesText = 'Any HTML attributes are allowed.';
			}
		} else if ( allowedAttributes.length > 0 ) {
			// If only specific attributes are allowed
			attributesText = `Use only these HTML attributes: ${ allowedAttributes.join( ', ' ) }.`;
		} else {
			// If no attributes are allowed
			attributesText = 'Do not use any HTML attributes except standard ones like href for links and src/alt for images.';
		}

		rules.htmlFormatting = rules.htmlFormatting.replace(
			'<ALLOWED_ATTRIBUTES>{{ALLOWED_HTML_ATTRIBUTES}}</ALLOWED_ATTRIBUTES>',
			attributesText
		);
	}

	return rules;
}
