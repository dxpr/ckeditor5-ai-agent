import { Command, type Editor } from 'ckeditor5/src/core.js';
import { getDefaultAiAgentToneDropdownMenu } from './util/translations.js';

export default class AiAgentToneCommand extends Command {
	private readonly STORAGE_PREFIX = 'ck5-ai-agent';
	private readonly STORAGE_KEY = 'tone';
	private availableTones: Array<{ label: string; key: string; tone: string }> = [];
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
			key: item.label,
			tone: item.tone
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

	/**
	 * Saves the selected tone to localStorage for future use.
	 *
	 * This method stores the specified tone under a unique key in localStorage,
	 * allowing the application to remember the user's tone preference across sessions.
	 * It also logs the saved value for debugging purposes if debug mode is enabled.
	 *
	 * @param toneKey - The toneKey string to be saved in localStorage.
	 * @returns {void} This function does not return a value.
	 *
	 * @throws {Error} If localStorage is not available, a warning is logged to the console.
	 */
	private saveToneSelection( toneKey: string ): void {
		try {
			const key = `${ this.STORAGE_PREFIX }:${ this.STORAGE_KEY }`;

			// Compare with models endpoint cache key format
			const modelsKey = `${ this.STORAGE_PREFIX }:openai_models`;
			const hasModelsCache = localStorage.getItem( modelsKey ) !== null;

			localStorage.setItem( key, toneKey );

			if ( this.debugMode ) {
				const savedValue = localStorage.getItem( key );
				console.log( '[DEBUG] Tone localStorage:', {
					key,
					toneKey,
					savedValue,
					modelsKey,
					hasModelsCache
				} );
			}
		} catch ( error ) {
			// Fail silently if localStorage is not available
			console.warn( 'Could not save tone to localStorage', error );
		}
	}

	/**
	 * Loads the selected tone from localStorage.
	 *
	 * This method retrieves the tone string stored under a unique key in localStorage,
	 * allowing the application to remember the user's tone preference across sessions.
	 * If no tone is found, it returns null.
	 *
	 * @returns {string | null} The stored tone string if found, or null if no tone is stored.
	 *
	 * @throws {Error} If localStorage is not available, a warning is logged to the console.
	 */
	private loadToneSelection(): string | null {
		try {
			const key = `${ this.STORAGE_PREFIX }:${ this.STORAGE_KEY }`;
			const storedToneKey = localStorage.getItem( key );

			if ( !storedToneKey ) {
				return null;
			}
			const matchingTone = this.availableTones.find( item => item.key === storedToneKey );
			return matchingTone ? matchingTone.tone : null;
		} catch ( error ) {
			// Fail silently if localStorage is not available
			console.warn( 'Could not load tone from localStorage', error );
			return null;
		}
	}
}
