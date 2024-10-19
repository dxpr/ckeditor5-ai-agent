import { Command } from 'ckeditor5/src/core.js';
import type AiAssistService from './aiassistservice.js';
import type { Editor } from 'ckeditor5';
export default class AiAssistCommand extends Command {
    private aiAssistService;
    /**
     * Creates an instance of the AiAssistCommand.
     *
     * @param editor - The editor instance to which this command belongs.
     * @param aiAssistService - The service instance that handles AI assist functionality.
     */
    constructor(editor: Editor, aiAssistService: AiAssistService);
    /**
     * Checks whether the command can be executed based on the current selection.
     *
     * @returns A boolean indicating if the command can be executed.
     */
    refresh(): void;
    /**
     * Executes the AI assist command, processing the user's input and interacting with the AI service.
     *
     * @param options - An optional parameter for additional execution options.
     */
    execute(): Promise<void>;
}
