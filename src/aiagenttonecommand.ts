import { Command, type Editor } from 'ckeditor5/src/core.js';
import { STORAGE_PREFIX } from './const.js';
import { getDefaultAiAgentToneDropdownMenu } from './util/translations.js';
export default class AiAgentToneCommand extends Command {
	private readonly STORAGE_KEY = 'tone';
	private availableTones: Array<{ label: string; key: string; tone: string; tid?: number }> = [];
	private debugMode: boolean = false;

	/**
	 * @inheritDoc
	 */
	constructor( editor: Editor ) {
		super( editor );

		// Store available tones for validation when loading from storage
		const config = editor.config.get( 'aiAgent' );
		this.debugMode = !!config?.debugMode;
		const defaultTones = getDefaultAiAgentToneDropdownMenu( editor );
		const configTonesDropdown = config?.tonesDropdown?.map( item => ( {
			label: item.label,
			key: item.tid ? String( item.tid ) : item.label.toLowerCase().replace( / /g, '_' ),
			tone: item.tone,
			tid: item.tid
		} ) );
		this.availableTones = configTonesDropdown ?
			[ defaultTones[ 0 ], ...configTonesDropdown ] :
			defaultTones;

		// Initialize with the stored tone or default to empty string
		this.value = this.loadToneSelection() || '';
	}

	/**
	 * Executes the AI agent tone command, setting the tone value to be used in prompts.
	 * When a new tone is selected, it completely replaces any previous tone setting
	 * and persists the selection to localStorage.
	 *
	 * @param options - An object containing the tone value to set.
	 */
	public override async execute( { value }: { value: string } ): Promise<void> {
		// Set the value directly, replacing any previous tone
		this.value = value;
		this.fire( 'change:value', { value } );

		// Find the label for the selected tone value and persist it to localStorage
		const selectedTone = this.availableTones.find( item => item.tone === value );
		if ( selectedTone ) {
			this.saveToneSelection( selectedTone.key );
		}
	}

	private saveToneSelection( toneKey: string ): void {
		const key = `${ STORAGE_PREFIX }:${ this.STORAGE_KEY }`;
		localStorage.setItem( key, toneKey );
	}

	private loadToneSelection(): string | null {
		const key = `${ STORAGE_PREFIX }:${ this.STORAGE_KEY }`;
		const storedToneKey = localStorage.getItem( key );

		if ( !storedToneKey ) {
			return null;
		}
		const matchingTone = this.availableTones.find( item => item.key === storedToneKey );
		return matchingTone ? matchingTone.tone : null;
	}
}
