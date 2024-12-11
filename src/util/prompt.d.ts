import type { Editor } from 'ckeditor5/src/core.js';
import type { MarkdownContent } from '../type-identifiers.js';
export declare class PromptHelper {
    private editor;
    private contextSize;
    private promptSettings;
    private debugMode;
    private editorContextRatio;
    constructor(editor: Editor, options?: {
        editorContextRatio?: number;
    });
    getSystemPrompt(isInlineResponse?: boolean): string;
    trimContext(prompt: string, promptContainerText?: string): string;
    formatFinalPrompt(request: string, context: string, markDownContents: Array<MarkdownContent>, isEditorEmpty: boolean): string;
    generateMarkDownForUrls(urls: Array<string>): Promise<Array<MarkdownContent>>;
    allocateTokensToFetchedContent(prompt: string, fetchedContent: Array<MarkdownContent>): Array<MarkdownContent>;
}
