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

		if ( this.debugMode ) {
			console.log( '[TONE DEBUG] Debug mode enabled:', this.debugMode );
		}

		const defaultTones = this._getDefaultTones();
		this.availableTones = config?.tonesDropdown ?
			[ defaultTones[ 0 ], ...config.tonesDropdown ] :
			defaultTones;

		if ( this.debugMode ) {
			console.log( '[TONE DEBUG] Available tones:', this.availableTones );
		}

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
		if ( this.debugMode ) {
			console.log( '[TONE DEBUG] Execute method called with value:', value );
		}

		// Set the value directly, replacing any previous tone
		this.value = value;
		this.fire( 'change:value', { value } );

		if ( this.debugMode ) {
			console.log( '[TONE DEBUG] Tone selected:', value );
		}

		// Find the label for the selected tone value and persist it to localStorage
		const selectedTone = this.availableTones.find( item => item.tone === value );

		if ( this.debugMode ) {
			console.log( '[TONE DEBUG] Selected tone found:', !!selectedTone, selectedTone );
		}

		if ( selectedTone ) {
			if ( this.debugMode ) {
				console.log( '[TONE DEBUG] About to save tone selection:', selectedTone.label );
			}
			this.saveToneSelection( selectedTone.label );
		} else if ( this.debugMode ) {
			console.log( '[TONE DEBUG] No matching tone found for value:', value );
			console.log( '[TONE DEBUG] Available tones:', this.availableTones );
		}
	}

	/**
	 * Saves the tone selection label to localStorage with the plugin's namespace.
	 * Only the label is stored, not the full tone description, as descriptions may change.
	 *
	 * @param toneLabel - The label of the selected tone to save.
	 */
	private saveToneSelection( toneLabel: string ): void {
		if ( this.debugMode ) {
			console.log( '[TONE DEBUG] saveToneSelection called with label:', toneLabel );
		}

		try {
			const key = `${ this.STORAGE_PREFIX }:${ this.STORAGE_KEY }`;

			// Compare with models endpoint cache key format
			const modelsKey = `${ this.STORAGE_PREFIX }:openai_models`;
			const hasModelsCache = localStorage.getItem( modelsKey ) !== null;

			if ( this.debugMode ) {
				console.log( '[TONE DEBUG] About to write to localStorage:', { key, toneLabel } );
			}

			localStorage.setItem( key, toneLabel );

			if ( this.debugMode ) {
				const savedValue = localStorage.getItem( key );
				console.log( '[TONE DEBUG] localStorage write:', {
					key,
					value: toneLabel,
					savedValue,
					modelsKey,
					hasModelsCache
				} );
			}
		} catch ( error ) {
			// Log errors only in debug mode, otherwise fail silently
			if ( this.debugMode ) {
				console.warn( '[TONE DEBUG] localStorage error:', error );
			} else {
				console.warn( 'Could not save tone to localStorage', error );
			}
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

			if ( this.debugMode ) {
				console.log( '[TONE DEBUG] localStorage read:', {
					key,
					value: storedToneLabel
				} );
			}

			if ( !storedToneLabel ) {
				return null;
			}

			// Find the tone description that matches the stored label
			if ( this.availableTones.length ) {
				const matchingTone = this.availableTones.find( item => item.label === storedToneLabel );

				if ( this.debugMode ) {
					console.log( '[TONE DEBUG] Matching tone:', {
						storedLabel: storedToneLabel,
						found: !!matchingTone,
						availableTones: this.availableTones.map( t => t.label )
					} );
				}

				return matchingTone ? matchingTone.tone : null;
			}

			return null;
		} catch ( error ) {
			// Log errors only in debug mode, otherwise fail silently
			if ( this.debugMode ) {
				console.warn( '[TONE DEBUG] localStorage read error:', error );
			} else {
				console.warn( 'Could not load tone from localStorage', error );
			}
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
