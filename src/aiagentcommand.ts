import { Command } from 'ckeditor5/src/core.js';
import type AiAgentService from './aiagentservice.js';
import type { Editor } from 'ckeditor5';
export default class AiAgentCommand extends Command {
	private aiAgentService: AiAgentService;

	/**
	 * Creates an instance of the AiAgentCommand.
	 *
	 * @param editor - The editor instance to which this command belongs.
	 * @param aiAgentService - The service instance that handles AI assist functionality.
	 */
	constructor( editor: Editor, aiAgentService: AiAgentService ) {
		super( editor );
		this.aiAgentService = aiAgentService;
	}

	/**
	 * Checks whether the command can be executed based on the current selection.
	 *
	 * @returns A boolean indicating if the command can be executed.
	 */
	public override refresh(): void {
		// Enable the command when the selection is in an empty block or at the beginning of a block
		this.isEnabled = true;
	}

	/**
	 * Executes the AI assist command, processing the user's input and interacting with the AI service.
	 *
	 * @param options - An optional parameter for additional execution options.
	 */
	public override async execute(): Promise<void> {
		await this.aiAgentService.handleSlashCommand();
	}
}
