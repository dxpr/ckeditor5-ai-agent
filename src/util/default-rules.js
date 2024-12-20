import { getAllowedHtmlTags } from './html-utils.js';
import defaultRulesJson from '../config/default-rules.json';
export function getDefaultRules(editor) {
    // Replace the placeholder in htmlFormatting with actual allowed tags
    const rules = { ...defaultRulesJson };
    rules.htmlFormatting = rules.htmlFormatting.replace('${getAllowedHtmlTags(editor).join(\', \')}', getAllowedHtmlTags(editor).join(', '));
    return rules;
}
