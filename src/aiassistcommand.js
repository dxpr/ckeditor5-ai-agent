import { Command } from 'ckeditor5/src/core.js';
export default class AiAssistCommand extends Command {
    /**
     * Creates an instance of the AiAssistCommand.
     *
     * @param editor - The editor instance to which this command belongs.
     * @param aiAssistService - The service instance that handles AI assist functionality.
     */
    constructor(editor, aiAssistService) {
        super(editor);
        this.aiAssistService = aiAssistService;
    }
    /**
     * Checks whether the command can be executed based on the current selection.
     *
     * @returns A boolean indicating if the command can be executed.
     */
    refresh() {
        // Enable the command when the selection is in an empty block or at the beginning of a block
        this.isEnabled = true;
    }
    /**
     * Executes the AI assist command, processing the user's input and interacting with the AI service.
     *
     * @param options - An optional parameter for additional execution options.
     */
    async execute() {
        await this.aiAssistService.handleSlashCommand();
    }
}
