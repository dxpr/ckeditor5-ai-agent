import type { Editor } from 'ckeditor5/src/core.js';
import type { MarkdownContent } from '../type-identifiers.js';
export declare class PromptHelper {
    private editor;
    private contextSize;
    private responseOutputFormat;
    private responseContextData;
    private responseFilters;
    private debugMode;
    constructor(editor: Editor);
    /**
     * Constructs the system prompt that guides the AI in generating responses.
     *
     * This method assembles a comprehensive set of instructions and context
     * that the AI will utilize to formulate responses based on user input
     * and the provided content, ensuring adherence to specified rules and formats.
     *
     * @param isInlineResponse - A boolean indicating whether the response should be inline.
     * @returns A string containing the formatted system prompt for the AI.
    */
    getSystemPrompt(isInlineResponse?: boolean): string;
    /**
     * Formats the final prompt to be sent to the GPT model, including context and instructions.
     *
     * @param request - The user's request string.
     * @param context - The trimmed context string.
     * @param markDownContents - An array of MarkdownContent objects for additional context.
     * @param isEditorEmpty - A boolean indicating if the editor is empty.
     * @returns The formatted prompt string.
     */
    formatFinalPrompt(request: string, context: string, markDownContents: Array<MarkdownContent>, isEditorEmpty: boolean): string;
    /**
     * Trims the context around the user's prompt to create a suitable context for the AI model.
     * This method identifies the position of the user's prompt within the provided text and extracts
     * the surrounding context, placing a cursor placeholder where the prompt is located.
     *
     * @param prompt - The user's prompt string to locate within the context.
     * @param promptContainerText - The text container in which the prompt is located (optional).
     * @returns The trimmed context string with a cursor placeholder indicating the prompt's position.
    */
    trimContext(prompt: string, promptContainerText?: string): string;
    /**
     * Allocates tokens to the fetched content based on the available limit and the user's prompt.
     *
     * @param prompt - The user's prompt string.
     * @param fetchedContent - An array of MarkdownContent objects containing fetched content.
     * @returns An array of MarkdownContent objects with calculated tokenToRequest values.
     */
    allocateTokensToFetchedContent(prompt: string, fetchedContent: Array<MarkdownContent>): Array<MarkdownContent>;
    /**
     * Generates Markdown content for an array of URLs by fetching their content.
     *
     * @param urls - An array of URLs to fetch content from.
     * @returns A promise that resolves to an array of MarkdownContent objects.
     */
    generateMarkDownForUrls(urls: Array<string>): Promise<Array<MarkdownContent>>;
    /**
     * Fetches the content of a given URL and returns it as a string.
     *
     * @param url - The URL to fetch content from.
     * @returns A promise that resolves to the fetched content as a string.
     * @throws Will throw an error if the URL is invalid or if the fetch fails.
     */
    fetchUrlContent(url: string): Promise<string>;
    /**
     * Counts the number of tokens in the provided content string.
     *
     * @param content - The content string to count tokens in.
     * @returns The number of tokens in the content.
     */
    countTokens(content: string): number;
    /**
     * Trims the LLM content by tokens while ensuring that sentences or other structures (e.g., bullet points, paragraphs)
     * are not clipped mid-way.
     *
     * @param content - The LLM-generated content string to trim.
     * @param maxTokens - The maximum number of tokens allowed.
     * @returns The trimmed content string.
     */
    trimLLMContentByTokens(content: string, maxTokens: number): string;
    /**
     * Retrieves the allowed HTML tags based on the CKEditor schema.
     *
     * @returns An array of allowed HTML tags.
     */
    getAllowedHtmlTags(): Array<string>;
    /**
     * Extracts a portion of content based on the specified context size and direction.
     *
     * @param contentAfterPrompt - The content string to extract from.
     * @param contextSize - The maximum size of the context to extract.
     * @param reverse - A boolean indicating whether to extract in reverse order (default is false).
     * @returns The extracted content string.
     */
    extractEditorContent(contentAfterPrompt: string, contextSize: number, reverse?: boolean): string;
}
