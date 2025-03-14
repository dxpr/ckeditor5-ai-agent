import { Command, type Editor } from 'ckeditor5/src/core.js';
import { getDefaultAiAgentToneDropdownMenu } from './util/translations.js';

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

		// Get default tones from the shared utility function
		const defaultTones = getDefaultAiAgentToneDropdownMenu( editor );

		// Initialize with default tones
		this.availableTones = config?.tonesDropdown ?
			[ defaultTones[ 0 ], ...config.tonesDropdown ] :
			defaultTones;

		if ( this.debugMode ) {
			// CRITICAL DEBUG: Show what tones are available at initialization
			console.log( '[TONE DEBUG] Available tones at init:', {
				defaultTones,
				configTones: config?.tonesDropdown || [],
				mergedTones: this.availableTones.map( t => t.label )
			} );
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
		// Set the value directly, replacing any previous tone
		this.value = value;
		this.fire( 'change:value', { value } );

		// First try to find an exact match for the tone value
		let selectedTone = this.availableTones.find( item => item.tone === value );

		// If no exact match, try to find a match by label (for backward compatibility)
		if ( !selectedTone ) {
			selectedTone = this.availableTones.find( item => item.label === value );
		}

		// If still no match, try to find a tone where the value contains the label
		if ( !selectedTone ) {
			selectedTone = this.availableTones.find( item =>
				item.label && value.includes( item.label )
			);
		}

		// If we still don't have a match, check if we're dealing with a hardcoded tone description
		if ( !selectedTone ) {
			// Map of known tone descriptions to their labels
			const toneDescriptions: Record<string, string> = {
				'Use compelling language to convince readers and support arguments with strong reasoning.': 'Persuasive',
				'Use clear, concise language with a business-appropriate tone suitable for formal contexts.': 'Professional',
				'Explain concepts clearly with an informative approach that helps readers understand complex topics.': 'Educational',
				'Write in a friendly and accessible manner while maintaining professionalism.': 'Approachable',
				'Employ precise, structured language appropriate for official documentation and communications.': 'Formal',
				'Use motivational language that encourages action and creates a sense of possibility.': 'Inspirational'
			};

			const matchedLabel = toneDescriptions[ value ];
			if ( matchedLabel ) {
				selectedTone = this.availableTones.find( item => item.label === matchedLabel );
			}
		}

		// Last resort: if the value is the actual tone description, try to match by position in dropdown
		if ( !selectedTone && this.availableTones.length > 0 ) {
			// This is a fallback for when the tone value is the description instead of the identifier
			const selectedLabel = 'Persuasive'; // Default fallback

			// If we can't find a match, create a temporary tone object
			selectedTone = {
				label: selectedLabel,
				tone: value // Use the full description as the tone value
			};
		}

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
			localStorage.setItem( key, toneLabel );

			if ( this.debugMode ) {
				// CRITICAL DEBUG: Verify the tone was actually saved
				const savedValue = localStorage.getItem( key );
				console.log( '[TONE DEBUG] Tone saved to localStorage:', {
					key,
					toneLabel,
					savedValue,
					success: savedValue === toneLabel
				} );
			}
		} catch ( error ) {
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

			if ( !storedToneLabel ) {
				return null;
			}

			// Find the tone description that matches the stored label
			if ( this.availableTones.length ) {
				const matchingTone = this.availableTones.find( item => item.label === storedToneLabel );

				if ( this.debugMode ) {
					// CRITICAL DEBUG: Show if we found a matching tone for the stored label
					console.log( '[TONE DEBUG] Loading tone from localStorage:', {
						storedLabel: storedToneLabel,
						availableToneLabels: this.availableTones.map( t => t.label ),
						found: !!matchingTone,
						loadedValue: matchingTone ? matchingTone.tone : null
					} );
				}

				return matchingTone ? matchingTone.tone : null;
			}

			return null;
		} catch ( error ) {
			if ( this.debugMode ) {
				console.warn( '[TONE DEBUG] localStorage read error:', error );
			} else {
				console.warn( 'Could not load tone from localStorage', error );
			}
			return null;
		}
	}
}
