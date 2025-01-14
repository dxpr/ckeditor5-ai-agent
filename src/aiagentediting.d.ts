import { Plugin } from 'ckeditor5/src/core.js';
export default class AiAgentEditing extends Plugin {
    static get pluginName(): "AiAgentEditing";
    /**
     * Initializes the AI Agent editing plugin, setting up commands and key handling.
     */
    init(): void;
    /**
     * Sets up handling for the Enter key to trigger AI assist functionality.
     * If the content starts with a slash, it cancels the default action and executes the AI assist command.
     */
    private setupEnterKeyHandling;
}
