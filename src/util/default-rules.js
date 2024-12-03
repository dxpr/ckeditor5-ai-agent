import { getAllowedHtmlTags } from './html-utils.js';
export function getDefaultRules(editor) {
    return {
        responseRules: `
            Follow these step-by-step instructions to respond to user inputs:
            Analyze the CONTEXT section thoroughly to understand the existing content and its style.
            Identify the specific requirements from the TASK section.
            If markdown content is present, extract relevant information that aligns with the task.
            Determine the appropriate tone and style based on the context.
            Generate a response that seamlessly integrates with the existing content.
            Format the response according to the HTML and structural requirements.
            Verify that the response meets all formatting and content guidelines.

            Core Response Generation Rules:
            Replace "@@@cursor@@@" with contextually appropriate content.
            Maintain consistency with the surrounding text's tone and style.
            Ensure the response flows naturally with the existing content.
            Avoid repeating context verbatim.
            Generate original content that adds value.
            Follow the specified language requirements.
            Adhere to all HTML formatting rules.
        `,
        htmlFormatting: `
            HTML Formatting Requirements:
            Generate valid HTML snippets only.
            Use only the following allowed tags: ${getAllowedHtmlTags(editor).join(', ')}.
            Ensure proper tag nesting.
            Avoid empty elements.
            Use semantic HTML where appropriate.
            Maintain clean, readable HTML structure.
            Follow block-level element rules.
            Properly close all tags.
            No inline styles unless specified.
            No script or style tags.
            The first word must be a valid HTML tag.
            Block elements must not contain other block elements.
        `,
        contentStructure: `
            Content Structure Rules:
            Organize information logically.
            Use appropriate paragraph breaks.
            Maintain consistent formatting.
            Follow document hierarchy.
            Use appropriate list structures when needed.
            Ensure proper content flow.
            Respect existing document structure.
        `,
        tone: `
            Language and Tone Guidelines:
            Match the formality level of the surrounding content.
            Maintain a consistent voice throughout the response.
            Use appropriate technical terminology when relevant.
            Ensure proper grammar and punctuation.
            Avoid overly complex sentence structures.
            Keep the tone engaging and reader-friendly.
            Adapt style based on content type.
        `,
        inlineContent: `
            Inline Content Specific Rules:
            Determine content type (list, table, or inline).
            Format according to content type.
            Ensure seamless integration.
            Preserve existing content flow.
            Maintain proper nesting.
        `,
        imageHandling: `
            Image Element Requirements:
            Every <img> must have src and alt attributes.
            Format src URLs as: https://placehold.co/600x400?text=[alt_text].
            Alt text must be descriptive and meaningful.
        `
    };
}
