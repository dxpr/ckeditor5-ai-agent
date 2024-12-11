import { getAllowedHtmlTags } from './html-utils.js';
export function getDefaultRules(editor) {
    return {
        responseRules: `
			Generate high-quality, relevant content
			Follow all formatting requirements
			Maintain professional tone
		`,
        htmlFormatting: `
			Use only these HTML tags: ${getAllowedHtmlTags(editor).join(', ')}
			Must start with valid HTML tag
			No empty elements
			Close all tags
		`,
        contentStructure: `
			Use appropriate formatting
			Match document structure
		`,
        tone: `
			Use professional terminology
			Keep grammar natural
		`,
        imageHandling: `
			<img> requires src and alt
			Use: https://placehold.co/600x400?text=[alt_text]
		`
    };
}
