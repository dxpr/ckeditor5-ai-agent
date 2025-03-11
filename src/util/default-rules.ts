import { getAllowedHtmlTags, getAllowedHtmlClasses } from './html-utils.js';
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
		const allowedClasses = getAllowedHtmlClasses( editor );
		const classesText = allowedClasses.length > 0 ?
			`Use only these classes: ${ allowedClasses.join( ', ' ) }.` :
			'Do not use any CSS classes.';

		rules.htmlFormatting = rules.htmlFormatting.replace(
			'<ALLOWED_CLASSES>{{ALLOWED_HTML_CLASSES}}</ALLOWED_CLASSES>',
			classesText
		);
	}

	return rules;
}
