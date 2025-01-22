import { getAllowedHtmlTags } from './html-utils.js';
import defaultRulesJson from '../config/default-rules.json';

export function getDefaultRules( editor: any ): { [key: string]: string } {
	const rules = { ...defaultRulesJson };

	// Replace the placeholder in htmlFormatting with actual allowed tags
	if ( rules.htmlFormatting?.includes( '{{ALLOWED_HTML_TAGS}}' ) ) {
		rules.htmlFormatting = rules.htmlFormatting.replace(
			'{{ALLOWED_HTML_TAGS}}',
			getAllowedHtmlTags( editor ).join( ', ' )
		);
	}

	return rules;
}
