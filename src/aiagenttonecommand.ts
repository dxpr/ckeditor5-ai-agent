import { Command, type Editor } from 'ckeditor5/src/core.js';
import { STORAGE_PREFIX } from './const.js';
import { getToneForKey } from './util/tones.js';
export default class AiAgentToneCommand extends Command {
	private readonly STORAGE_KEY = 'tone';
	private debugMode: boolean = false;

	/**
	 * @inheritDoc
	 */
	constructor( editor: Editor ) {
		super( editor );

		const config = editor.config.get( 'aiAgent' );
		this.debugMode = !!config?.debugMode;

		// Initialize with the stored tone, else the default tone
		this.value = this.loadToneSelection() || '';
	}

	/**
	 * Executes the AI agent tone command, setting the tone value to be used in prompts.
	 * When a new tone is selected, it completely replaces any previous tone setting
	 * and persists the selection to localStorage.
	 *
	 * @param options - An object containing the tone value to set.
	 */
	public override async execute( { value, key }: { value: string; key: string } ): Promise<void> {
		this.value = value;
		this.fire( 'change:value', { value } );
		this.saveToneSelection( key );
	}

	private saveToneSelection( toneKey: string ): void {
		const key = `${ STORAGE_PREFIX }:${ this.STORAGE_KEY }`;
		localStorage.setItem( key, toneKey );
	}

	private loadToneSelection(): string | null {
		const key = `${ STORAGE_PREFIX }:${ this.STORAGE_KEY }`;
		return getToneForKey( this.editor, localStorage.getItem( key ) );
	}
}
