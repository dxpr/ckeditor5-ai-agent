import { Command } from 'ckeditor5/src/core.js';
export default class AiAgentToneCommand extends Command {
	/**
	 * Executes the AI assist command, processing the user's input and interacting with the AI service.
	 *
	 * @param options - An optional parameter for additional execution options.
	 */
	public override async execute( { value }: { value: string } ): Promise<void> {
		this.value = value;
		this.fire( 'change:value', { value } );
	}
}
