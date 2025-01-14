// Map of CKEditor nodes to HTML tags
const nodeToHtmlMap = {
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
const textAttributeToHtmlMap = {
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
 * Gets the allowed HTML tags from the editor schema.
 *
 * @param editor - The CKEditor instance
 * @returns Array of allowed HTML tag names
 */
export function getAllowedHtmlTags(editor) {
    const schema = editor.model.schema;
    const definitions = schema.getDefinitions();
    const schemaNodes = Object.keys(definitions).sort();
    const allowedTags = new Set();
    // Add tags from node mappings
    schemaNodes.forEach(node => {
        if (node in nodeToHtmlMap) {
            allowedTags.add(nodeToHtmlMap[node]);
        }
    });
    // Add tags from text attributes
    const textDefinition = definitions.$text;
    if (textDefinition && textDefinition.allowAttributes) {
        textDefinition.allowAttributes.forEach((attr) => {
            if (attr in textAttributeToHtmlMap) {
                allowedTags.add(textAttributeToHtmlMap[attr]);
            }
        });
    }
    // If listItem is present, add ul and ol
    if (allowedTags.has('li')) {
        allowedTags.add('ul');
        allowedTags.add('ol');
    }
    return Array.from(allowedTags).sort();
}
