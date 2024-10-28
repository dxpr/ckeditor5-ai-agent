import { Command } from 'ckeditor5/src/core.js';
import type AiAssistService from './aiassistservice.js';
import type { Editor } from 'ckeditor5';
export default class AiAssistCommand extends Command {
	private aiAssistService: AiAssistService;
	private abortController?: AbortController;

	/**
	 * Creates an instance of the AiAssistCommand.
	 *
	 * @param editor - The editor instance to which this command belongs.
	 * @param aiAssistService - The service instance that handles AI assist functionality.
	 */
	constructor( editor: Editor, aiAssistService: AiAssistService ) {
		super( editor );
		this.aiAssistService = aiAssistService;

		// Listen for the custom event from Command A
		this.listenTo( editor, 'CancelGeneration', ( evt, data ) => {
			console.log( this.abortController );
			this.aiAssistService.cancelResponseGeneration();
		} );
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
		this.abortController = new AbortController();
		await this.aiAssistService.handleSlashCommand();
	}
}
