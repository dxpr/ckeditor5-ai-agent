import type { Editor } from 'ckeditor5/src/core.js';
export default class AiAssistService {
    private editor;
    private aiModel;
    private apiKey;
    private endpointUrl;
    private temperature;
    private timeOutDuration;
    private maxTokens;
    private retryAttempts;
    private streamContent;
    private stopSequences;
    private aiAssistFeatureLockId;
    private promptHelper;
    private htmlParser;
    private buffer;
    private openTags;
    private isInlineInsertion;
    /**
     * Initializes the AiAssistService with the provided editor and configuration settings.
     *
     * @param editor - The CKEditor instance to be used with the AI assist service.
     */
    constructor(editor: Editor);
    /**
     * Handles the slash command input from the user, processes it, and interacts with the AI model.
     *
     * @returns A promise that resolves when the command has been processed.
     */
    handleSlashCommand(): Promise<void>;
    /**
     * Fetches and processes the GPT response based on the provided prompt and parent element.
     *
     * @param prompt - The prompt to send to the GPT model.
     * @param parent - The parent element in the editor where the response will be inserted.
     * @param retries - The number of retry attempts for the API call (default is the configured retry attempts).
     * @returns A promise that resolves when the response has been processed.
     */
    private fetchAndProcessGptResponse;
    /**
     * Processes the provided content and inserts it into the specified parent element.
     * Depending on the feature flag, it either uses a simple HTML insertion method
     * or processes the content as HTML.
     *
     * @param content - The content to be processed and inserted.
     * @param parent - The parent element in the editor where the content will be inserted.
     */
    private processContent;
    /**
     * Processes the provided HTML string and inserts its content into the editor.
     * It creates a temporary div to parse the HTML and handles different types of
     * elements (lists, tables, headings, etc.) accordingly.
     *
     * @param html - The HTML string to be processed and inserted into the editor.
     */
    private proceedHtmlResponse;
    /**
     * Clears the content of the specified parent element in the editor.
     *
     * @param parent - The parent element whose content will be cleared.
     */
    private clearParentContent;
    /**
     * Generates a GPT prompt based on the user's input and the current context in the editor.
     * This method processes the input prompt, extracts any URLs, and formats the final prompt
     * to be sent to the GPT model. It also handles the case where the editor is empty.
     *
     * @param prompt - The user's input prompt, typically starting with a slash.
     * @param promptContainerText - Optional text from the container that may provide additional context.
     * @returns A promise that resolves to the generated GPT prompt string or null if an error occurs.
    */
    private generateGptPromptBasedOnUserPrompt;
}
