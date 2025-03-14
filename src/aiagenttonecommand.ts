import { Command, type Editor } from 'ckeditor5/src/core.js';

export default class AiAgentToneCommand extends Command {
	private readonly STORAGE_PREFIX = 'ck5-ai-agent';
	private readonly STORAGE_KEY = 'tone';
	private availableTones: Array<{ label: string; tone: string }> = [];
	private debugMode: boolean = false;

	/**
	 * @inheritDoc
	 */
	constructor( editor: Editor ) {
		super( editor );

		// Store available tones for validation when loading from storage
		const config = editor.config.get( 'aiAgent' );
		this.debugMode = !!config?.debugMode;
		const defaultTones = this._getDefaultTones();
		this.availableTones = config?.tonesDropdown ?
			[ defaultTones[ 0 ], ...config.tonesDropdown ] :
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
			this.saveToneSelection( selectedTone.label );
		}
	}

	/**
	 * Saves the tone selection label to localStorage with the plugin's namespace.
	 * Only the label is stored, not the full tone description, as descriptions may change.
	 *
	 * @param toneLabel - The label of the selected tone to save.
	 */
	private saveToneSelection( toneLabel: string ): void {
		try {
			const key = `${ this.STORAGE_PREFIX }:${ this.STORAGE_KEY }`;

			// Compare with models endpoint cache key format
			const modelsKey = `${ this.STORAGE_PREFIX }:openai_models`;
			const hasModelsCache = localStorage.getItem( modelsKey ) !== null;

			localStorage.setItem( key, toneLabel );

			if ( this.debugMode ) {
				const savedValue = localStorage.getItem( key );
				console.log( '[DEBUG] Tone localStorage:', {
					key,
					value: toneLabel,
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
	 * Loads the tone selection from localStorage.
	 * Retrieves the stored label and finds the corresponding tone description
	 * from the current configuration.
	 *
	 * @returns The current tone description string or null if not found or invalid.
	 */
	private loadToneSelection(): string | null {
		try {
			const key = `${ this.STORAGE_PREFIX }:${ this.STORAGE_KEY }`;
			const storedToneLabel = localStorage.getItem( key );

			if ( !storedToneLabel ) {
				return null;
			}

			// Find the tone description that matches the stored label
			if ( this.availableTones.length ) {
				const matchingTone = this.availableTones.find( item => item.label === storedToneLabel );
				return matchingTone ? matchingTone.tone : null;
			}

			return null;
		} catch ( error ) {
			// Fail silently if localStorage is not available
			console.warn( 'Could not load tone from localStorage', error );
			return null;
		}
	}

	/**
	 * Gets the default tones for validation purposes.
	 * This is a simplified version of getDefaultAiAgentToneDropdownMenu.
	 *
	 * @returns An array of default tone options.
	 */
	private _getDefaultTones(): Array<{ label: string; tone: string }> {
		const t = this.editor.t;
		return [
			{
				label: t( 'Default tone' ),
				tone: ''
			}
		];
	}
}
