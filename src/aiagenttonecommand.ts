import { Command } from 'ckeditor5/src/core.js';
export default class AiAgentToneCommand extends Command {
	/**
	 * Executes the AI agent tone command, setting the tone value to be used in prompts.
	 * When a new tone is selected, it completely replaces any previous tone setting.
	 *
	 * @param options - An object containing the tone value to set.
	 */
	public override async execute( { value }: { value: string } ): Promise<void> {
		// Set the value directly, replacing any previous tone
		this.value = value;
		this.fire( 'change:value', { value } );
	}
}
