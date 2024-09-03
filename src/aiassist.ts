import { Plugin } from 'ckeditor5/src/core.js';
import { ButtonView } from 'ckeditor5/src/ui.js';
import ckeditor5Icon from '../theme/icons/ckeditor.svg';
// eslint-disable-next-line
import '../theme/style.css';
import type { Editor, Element } from 'ckeditor5';
import type { AiModel } from './type-identifiers.js';
import { TOKEN_LIMITS } from './const.js';
import sbd from 'sbd';

export default class AiAssist extends Plugin {
	public PLACEHOLDER_TEXT_ID = 'slash-placeholder';
	public GPT_RESPONSE_LOADER_ID = 'gpt-response-loader';
	public GPT_RESPONSE_ERROR_ID = 'gpt-error';
	public DEFAULT_GPT_MODEL = 'gpt-4o' as AiModel;
	public DEFAULT_AI_END_POINT = 'https://api.openai.com/v1/chat/completions';

	public isInteractingWithGpt: boolean = false;
	public readonly supportedLanguages = [ 'hi', 'en', 'es', 'nl' ];

	// modal - configuration
	public aiModal: AiModel;
	public openAIKey: string | undefined;
	public endpointUrl: string;
	public temperature: number | undefined | null;
	public timeOutDuration: number | undefined | null;
	public maxTokens: number;
	public retryAttempts: number;
	public contextSize: number;
	public stopSequences: Array<string>;
	public promptsOverride: Array<string>;

	constructor( editor: Editor ) {
		super( editor );

		this.aiModal = editor.config.get( 'aiAssist.model' ) ?? this.DEFAULT_GPT_MODEL;
		this.openAIKey = editor.config.get( 'aiAssist.openAIKey' );
		this.temperature = editor.config.get( 'aiAssist.temperature' );
		this.timeOutDuration = editor.config.get( 'aiAssist.timeOutDuration' );
		this.stopSequences = editor.config.get( 'aiAssist.stopSequences' ) ?? [];
		this.promptsOverride = editor.config.get( 'aiAssist.prompt' ) ?? [];
		this.endpointUrl = editor.config.get( 'aiAssist.endpointUrl' ) ?? '';
		this.maxTokens = editor.config.get( 'aiAssist.maxTokens' ) ?? 0;
		this.contextSize = editor.config.get( 'aiAssist.contextSize' ) ?? 0;
		this.retryAttempts = editor.config.get( 'aiAssist.retryAttempts' ) ?? 1;
		if ( !this.endpointUrl ) {
			this.endpointUrl = this.DEFAULT_AI_END_POINT;
		}
		if ( !this.maxTokens ) {
			this.maxTokens = TOKEN_LIMITS[ this.aiModal ].max;
		}
		if ( !this.contextSize ) {
			this.contextSize = TOKEN_LIMITS[ this.aiModal ].context / 2;
		}
	}

	public static get pluginName() {
		return 'AiAssist' as const;
	}

	public init(): void {
		try {
			// Initialize UI components like buttons, placeholders, loaders, etc.
			this.initializeUIComponents();
			// Set displays content in the appropriate language.
			this.initializeUILanguage();

			// Validate the configuration
			this.validateAssistConfiguration();

			// Attach event listeners for handling editor events and user interactions
			this.attachListener();
		} catch ( error: any ) {
			console.error( error.message );
		}
	}

	/**
	 * Validates the AI Assist configuration parameters to ensure they fall within acceptable ranges.
	 * This includes validating the temperature and max tokens based on the model's limits.
	 *
	 * @throws Will throw an error if the temperature is not between 0 and 2,
	 *         or if maxTokens is outside the allowed range for the selected AI model.
	 */
	public validateAssistConfiguration(): void {
		// Validate temperature
		if ( this.temperature && ( this.temperature < 0 || this.temperature > 2 ) ) {
			throw new Error( 'AiAssist: Temperature must be a number between 0 and 2.' );
		}

		// Validate maxTokens based on the model's token limits
		const { min, max } = TOKEN_LIMITS[ this.aiModal ];
		if ( this.maxTokens < min || this.maxTokens > max ) {
			throw new Error( `AiAssist: maxTokens must be a number between ${ min } and ${ max }.` );
		}
	}

	/**
	 * Initializes the UI components for the editor, such as buttons, placeholders, and loaders.
	 * This method should be called during the editor's setup phase to ensure all necessary UI components are added.
	 */
	public initializeUIComponents(): void {
		const editor = this.editor;
		const t = editor.t;

		// Add necessary elements to the DOM
		this.addPlaceholder();
		this.addLoader();
		this.addGptErrorToolTip();

		// Add the "aiAssistButton" to feature components.
		editor.ui.componentFactory.add( 'aiAssistButton', locale => {
			const view = new ButtonView( locale );
			view.set( {
				label: t( 'Ai assist' ),
				icon: ckeditor5Icon,
				tooltip: true
			} );
			return view;
		} );
	}

	/**
	 * Attaches event listeners to the editor for handling user interactions and editor state changes.
	 * This method sets up listeners for content changes, cursor movements, and key presses.
	 */
	public attachListener(): void {
		const editor = this.editor;
		const model = editor.model;

		// Listen for changes in the document's data and apply the placeholder if needed
		model.document.on( 'change:data', () => {
			this.applyPlaceholderToCurrentLine();
		} );

		// Listen for changes in the selection range and apply the placeholder if needed
		model.document.selection.on( 'change:range', () => {
			this.applyPlaceholderToCurrentLine();
		} );

		// Handle the 'enter' key press and simplify slash command detection
		editor.keystrokes.set( 'enter', async ( _, cancel ) => {
			const position = model.document.selection.getFirstPosition();
			if ( position ) {
				const paragraph = position.parent;
				const textNode = paragraph.getChild( 0 );
				let lastContentBeforeEnter: string | undefined;

				if ( textNode?.is( 'model:$text' ) ) {
					lastContentBeforeEnter = textNode.data;
				}

				// Check if the last content starts with '/'
				if ( typeof lastContentBeforeEnter === 'string' && lastContentBeforeEnter.startsWith( '/' ) ) {
					await this.handleSlashCommand( lastContentBeforeEnter, paragraph, cancel );
				}
			}
		} );

		// Hide the placeholder on scroll events
		editor.editing.view.document.on( 'scroll', () => {
			this.hidePlaceHolder();
		} );
		document.addEventListener( 'scroll', () => {
			this.hidePlaceHolder();
		} );
	}

	/**
	 * Initializes the UI language settings for the editor based on the current content language.
	 * This method retrieves the language code from the editor's locale settings and applies the corresponding
	 * translations if available. If the language code is not supported, an error tooltip is displayed.
	 *
	 * This method should be called during the editor's setup phase to ensure that the UI displays content in the
	 * correct language based on user preferences or system settings.
	 */
	public initializeUILanguage(): void {
		const editor = this.editor;
		const t = editor.t;
		const contentLanguageCode = editor.locale.contentLanguage;
		if ( !this.supportedLanguages.includes( contentLanguageCode ) ) {
			this.showGptErrorToolTip( t( 'Error unsupported language' ) );
		}
	}

	/**
	 * Handles the slash command by interacting with GPT and updating the editor content.
	 *
	 * @param prompt - The command prompt to send to GPT.
	 * @param parent - The parent element where the response will be inserted.
	 * @param cancel - Function to cancel the current operation.
	 */
	public async handleSlashCommand( prompt: string, parent: any, cancel: any ): Promise<void> {
		const editor = this.editor;
		const t = editor.t;
		try {
			if ( !prompt || this.isInteractingWithGpt ) {
				return;
			}

			cancel(); // cancel the bubbling
			await this.fetchAndProcessGptResponse( prompt, parent );
		} catch ( error ) {
			this.showGptErrorToolTip( t( 'Error processing command' ) );
			console.error( 'Error processing command', error );
		}
	}

	/**
	 * Fetches a GPT-4 response based on the provided prompt, processes the response, and inserts it into the editor.
	 * This method handles API interaction, error handling, and updates the editor's content based on the GPT-4 output.
	 *
	 * @param prompt - The user input that is used to generate a GPT-4 prompt.
	 * @param parent - The parent editor node where the response will be inserted.
	 * @returns A promise that resolves when the processing is complete.
	 */
	public async fetchAndProcessGptResponse( prompt: string, parent: any, maxRetries: number = this.retryAttempts ): Promise<void> {
		const editor = this.editor;
		const t = editor.t;

		try {
			const domSelection = window.getSelection();
			const domRange: any = domSelection?.getRangeAt( 0 );
			const rect = domRange.getBoundingClientRect();

			// make api call
			this.showLoader( rect );
			this.isInteractingWithGpt = true;

			// Make API call to OpenAI GPT
			const response = await fetch( this.endpointUrl, {
				method: 'POST',
				headers: {
					// eslint-disable-next-line max-len
					'Authorization': `Bearer ${ this.openAIKey }`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					model: this.aiModal,
					messages: [
						{
							role: 'user',
							content: this.generateGptPromptBasedOnUserPrompt( prompt )
						}
					],
					...( this.temperature != null && { temperature: this.temperature } ),
					max_tokens: this.maxTokens,
					stop: this.stopSequences,
					stream: true
				} )
			} );

			if ( !response.ok ) {
				if ( maxRetries > 0 ) {
					return this.fetchAndProcessGptResponse( prompt, parent, maxRetries - 1 );
				} else {
					throw new Error( 'AiAssist: Fetch failed' );
				}
			}

			if ( !response.body ) {
				this.showGptErrorToolTip( t( 'Error readableStream not supported' ) );
				return;
			}

			if ( response.body.locked ) {
				console.error( 'Stream is already locked.' );
				this.showGptErrorToolTip( t( 'Error stream locked' ) );
				return;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder( 'utf-8' );

			this.hideLoader(); // Hide the loader after receiving the response

			// empty a prompt
			this.editor.model.change( writer => {
				while ( Array.isArray( parent?._children?._nodes ) && parent?._children?._nodes.length ) {
					writer.remove( parent?._children?._nodes[ 0 ] );
				}
			} );

			for ( ; ; ) {
				const { done, value } = await reader.read();
				if ( done ) {
					break;
				}
				const chunk = decoder.decode( value );
				const lines = chunk?.split( '\n' );
				const parsedLines = lines.map( line => line.replace( /^data: /, '' ).trim() )
					.filter( line => line !== '' && line !== 'DONE' && line !== '[DONE]' );
				for ( const parsedLine of parsedLines ) {
					try {
						const { choices } = JSON.parse( parsedLine );
						const { delta, finish_reason: finishReason } = choices[ 0 ];
						const { content } = delta ?? null;

						if ( `${ finishReason }`.trim() == 'stop' ) {
							continue;
						}

						// Handle newlines and insert content into the editor
						if ( content.includes( '\n' ) ) {
							const contentToWrite = ( content as string ).replace( /(\n)+/g, '\n' ).split( '\n' );
							for ( const info of contentToWrite ) {
								this.editor.model.change( writer => {
									writer.insertText( info, parent, 'end' );
								} );
								this.editor.execute( 'shiftEnter' );
							}
						} else {
							this.editor.model.change( writer => {
								writer.insertText( content, parent, 'end' );
							} );
						}
					} catch ( parseError ) {
						console.error( 'Error while parsing line:', parsedLine, parseError );
						this.showGptErrorToolTip( t( 'Error parsing response' ) );
					}
				}
			}
		} catch ( error ) {
			console.error( 'Error during GPT response fetch:', error );
			this.showGptErrorToolTip( t( 'Error fetch failed' ) );
		} finally {
			// safe side to not-to-show place holder as we are clearing the parentNode
			await new Promise( resolve => setTimeout( resolve, 500 ) );
			this.isInteractingWithGpt = false;
			this.hideLoader();
		}
	}

	/**
	 * Generates a structured GPT prompt based on the user's input and the current content of a text editor.
	 *
	 * @param prompt - The user's input request that will be appended to the generated GPT prompt.
	 * @returns A formatted string that includes the existing editor content as context, the user's request,
	 *          and specific instructions to ensure the generated content follows proper formatting,
	 *          grammar, and continuity rules.
	 */
	public generateGptPromptBasedOnUserPrompt( prompt: string ): string {
		const editor = this.editor;
		const context = this.trimContext( prompt );
		const contentLanguageCode = editor.locale.contentLanguage;
		const request = prompt;

		const finalPrompt = `Context:
"""
${ context }
"""

Task:
"${ request }"

Output:
Provide only the text for "@@@cursor@@@" that fits seamlessly with the context:
{insert generated text here}

Instruction:
The response must follow the language code - ${ contentLanguageCode }.
${ this.promptsOverride.length ? this.promptsOverride.join( '\n' ) :
		`Ensure the inserted content maintains a seamless connection with the surrounding text, making the transition smooth and natural.
If the response involves adding an item to a list, only generate the item itself, 
matching the format of the existing items in the list.
Ensure that the content is free of grammar errors and correctly formatted to avoid parsing errors.
The response should directly follow the context, avoiding any awkward transitions or noticeable gaps.
Do not modify the original text except to replace the "@@@cursor@@@" placeholder with the generated content.`
}`;

		return finalPrompt.trim();
	}

	/**
	 * Trims the context around a given prompt from the editor's content.
	 *
	 * This method extracts the content before and after the provided prompt within the editor.
	 * It ensures that the surrounding context does not exceed a specified size (defined by `contextSize`).
	 * The trimmed content is then formatted with a placeholder `@@@cursor@@@` to indicate the prompt's location.
	 *
	 * @param {string} prompt - The prompt around which the context needs to be trimmed.
	 * @returns {string} The trimmed context with the prompt surrounded by relevant content.
	 */
	public trimContext( prompt: string ): string {
		let contentBeforePrompt = '';
		let contentAfterPrompt = '';

		const editor = this.editor;
		const view = editor?.editing?.view?.domRoots?.get( 'main' );
		const context = view?.innerText ?? '';
		const contextParts = context.split( prompt );

		if ( contextParts.length > 1 ) {
			contentBeforePrompt = this.extractContent( contextParts[ 0 ], this.contextSize );
			contentAfterPrompt = this.extractContent( contextParts[ 1 ], this.contextSize, true );
		}

		// Combine the trimmed context with the cursor placeholder
		const trimmedContext = `${ contentBeforePrompt }\n"@@@cursor@@@"\n${ contentAfterPrompt }`;

		return trimmedContext;
	}

	/**
	 * Efficiently extracts content after the prompt within a specified context size.
	 *
	 * @param contentAfterPrompt - The content after the prompt that needs to be trimmed.
	 * @param contextSize - The maximum number of characters to include in the extracted context.
	 * @param reverse - If true, it trims from the beginning to the end; otherwise, from the end to the beginning.
	 * @returns The trimmed content that fits within the context size.
	 */
	public extractContent( contentAfterPrompt: string, contextSize: number, reverse: boolean = false ): string {
		let trimmedContent = '';
		let charCount = 0;

		// Tokenize the content into sentences using the sbd library
		const sentences = sbd.sentences( contentAfterPrompt, { preserve_whitespace: true } );

		// Iterate over the sentences based on the direction
		const iterator = reverse ? sentences : sentences.reverse();

		for ( const sentence of iterator ) {
			const sentenceLength = sentence.length;

			// Check if adding this sentence would exceed the context size
			if ( ( charCount + sentenceLength ) / 4 <= contextSize ) {
				trimmedContent = reverse ? trimmedContent + sentence : sentence + trimmedContent;
				charCount += sentenceLength;
			} else {
				break; // Stop if adding the next sentence would exceed the context size
			}
		}

		// Trim to remove any trailing whitespace and return the final trimmed content
		return trimmedContent.trim();
	}

	/**
	 * Applies or hides the placeholder text for the current line in the editor.
	 * The placeholder is shown if the current line is empty and not interacting with GPT,
	 * and hidden otherwise. The placeholder visibility is delayed to account for content changes.
	 */
	public applyPlaceholderToCurrentLine(): void {
		const editor = this.editor;
		const model = editor.model;
		const modelSelection = model.document.selection;

		let rect: DOMRect | null | undefined = null;

		// Get index and text node of the current block
		const block = modelSelection.getFirstPosition()?.parent;

		// Determine whether to show or hide placeholder text
		if ( !!block && block.isEmpty && !this.isInteractingWithGpt ) {
			// Hide the placeholder text immediately
			this.hidePlaceHolder();

			// Delay showing the placeholder text to allow for potential content changes
			setTimeout( async () => {
				if ( block.is( 'element' ) ) {
					rect = await this.getRectDomOfGivenModelElement( block );
					if ( rect ) {
						this.showPlaceHolder( rect );
					}
				}
			}, 100 );
		} else {
			// Hide the placeholder text if there's content or if interacting with GPT
			this.hidePlaceHolder();
		}
	}

	/**
 * Retrieves the bounding rectangle of the DOM element that corresponds to the given model element.
 *
 * @param {Element} element - The model element for which to find the corresponding DOM element's bounding rectangle.
 * @returns {Promise<DOMRect | null | undefined>} A promise that resolves to the bounding rectangle of the DOM element,
 * or null/undefined if the corresponding DOM element is not found.
 */
	public async getRectDomOfGivenModelElement( element: Element ): Promise<DOMRect | null | undefined> {
		let rect: DOMRect | null | undefined = null;
		const editor = this.editor;
		const mapper = editor.editing.mapper;
		const view = editor.editing.view;

		const equivalentView = mapper.toViewElement( element );

		if ( equivalentView ) {
			const domElement = view.domConverter.mapViewToDom( equivalentView );
			if ( domElement ) {
				rect = domElement.getBoundingClientRect();
			}
		}

		return rect;
	}

	/**
	 * Adds a placeholder element to the DOM, which displays a prompt text and can focus the editor when clicked.
	 */
	public addPlaceholder(): void {
		const editor = this.editor;
		const t = editor.t;
		// Create a new paragraph element for the placeholder
		const placeholder = document.createElement( 'p' );
		placeholder.id = this.PLACEHOLDER_TEXT_ID; // Set the ID for styling and identification

		// Define the click behavior to focus the editor
		placeholder.onclick = () => {
			this.editor.focus();
		};
		// Set initial styles for the placeholder element
		placeholder.classList.add( 'place-holder' );

		// Set the text content of the placeholder
		placeholder.textContent = t( 'Place holder' );

		// Append the placeholder to the document body
		document.body.appendChild( placeholder );
	}

	/**
	 * Displays the placeholder text at a right side of given rectangle position on the page.
	 *
	 * @param rect - The DOMRect object specifying the position and size for the placeholder.
	 * If not provided, the placeholder remains hidden.
	 */
	public showPlaceHolder( rect?: DOMRect ): void {
		// Retrieve the placeholder element by its ID
		const ele = document.getElementById( this.PLACEHOLDER_TEXT_ID );

		// Only proceed if the element exists and a valid rectangle is provided
		if ( ele && rect ) {
			// Set the position of the placeholder element
			ele.classList.add( 'show-place-holder' );
			ele.style.left = `${ rect.left }px`; // Set horizontal position
			ele.style.top = `${ rect.top }px`; // Set vertical position
		} else if ( ele ) {
			// Optionally, hide the placeholder if no rectangle is provided
			ele.classList.remove( 'show-place-holder' );
		}
	}

	/**
	 * Hides the placeholder text by setting its opacity to 0.
	 */
	public hidePlaceHolder(): void {
		// Retrieve the placeholder element by its ID
		const ele = document.getElementById( this.PLACEHOLDER_TEXT_ID );

		// Check if the element exists before modifying its style
		if ( ele ) {
			ele.classList.remove( 'show-place-holder' ); // Set opacity to 0 to hide the placeholder
		}
	}

	/**
	 * Adds the GPT response loader element to the DOM.
	 * The loader is initially hidden and styled using a CSS class.
	 */
	public addLoader(): void {
		// Create a new div element for the GPT response loader
		const loaderElement = document.createElement( 'div' );

		// Assign an ID for styling and identification
		loaderElement.id = this.GPT_RESPONSE_LOADER_ID;

		// Add a CSS class for additional styling
		loaderElement.classList.add( 'gpt-loader' );

		// Append the loader element to the document body
		document.body.appendChild( loaderElement );
	}

	/**
	 * Displays the GPT response loader at a specified rectangle position on the page.
	 *
	 * @param rect - The DOMRect object specifying the position and size for the loader. If not provided, the loader remains hidden.
	 */
	public showLoader( rect?: DOMRect ): void {
		// Retrieve the GPT response loader element by its ID
		const ele = document.getElementById( this.GPT_RESPONSE_LOADER_ID );

		// Only proceed if the element exists and a valid rectangle is provided
		if ( ele && rect ) {
			// Set the position of the loader element
			ele.style.left = `${ rect.left + 10 }px`; // Set horizontal position with a 10px offset
			ele.style.top = `${ rect.top + 10 }px`; // Set vertical position with a 10px offset
			ele.classList.add( 'show-gpt-loader' );
		} else if ( ele ) {
			// Optionally, hide the placeholder if no rectangle is provided
			ele.classList.remove( 'show-gpt-loader' );
		}
	}

	/**
	 * Hides the GPT response loader by setting its opacity to 0.
	 */
	public hideLoader(): void {
		// Retrieve the GPT response loader element by its ID
		const ele = document.getElementById( this.GPT_RESPONSE_LOADER_ID );

		// Check if the loader element exists before modifying its style
		if ( ele ) {
			ele.classList.remove( 'show-gpt-loader' ); // Set opacity to 0 to hide the loader
		}
	}

	/**
	 * Adds an error tooltip element to the DOM for displaying GPT-related errors.
	 * The tooltip is initially hidden and styled for visibility and positioning.
	 */
	public addGptErrorToolTip(): void {
		// Create a new paragraph element for the error tooltip
		const tooltipElement = document.createElement( 'p' );

		// Assign an ID for styling and identification
		tooltipElement.id = this.GPT_RESPONSE_ERROR_ID;

		// Set initial styles for the tooltip
		tooltipElement.classList.add( 'response-error' );

		// Append the tooltip element to the document body
		document.body.appendChild( tooltipElement );
	}

	/**
	 * Displays the GPT error tooltip at the bottom of the editor area with a specified message.
	 * The tooltip is positioned at the bottom of the editor and fades out after 2 seconds.
	 *
	 * @param message - The message to be displayed in the tooltip.
	 */
	public showGptErrorToolTip( message: string ): void {
		// Retrieve the editor's content area and the tooltip element
		const editor = this.editor;
		const view = editor?.editing?.view?.domRoots?.get( 'main' );
		const tooltipElement = document.getElementById( this.GPT_RESPONSE_ERROR_ID );

		const editorRect = view?.getBoundingClientRect();
		// Proceed if both the tooltip element and editor rectangle are available
		if ( tooltipElement && editorRect ) {
			// Set tooltip styles for positioning and visibility
			tooltipElement.classList.add( 'show-response-error' );
			tooltipElement.textContent = message; // Set the tooltip text content
			// Hide the tooltip after 2 seconds
			setTimeout( () => {
				this.hideGptErrorToolTip();
			}, 2000 );
		}
	}

	/**
	 * Hides the GPT error tooltip by setting its opacity to zero.
	 * This method effectively makes the tooltip invisible without removing it from the DOM.
	 */
	public hideGptErrorToolTip(): void {
		// Retrieve the tooltip element by its ID
		const tooltipElement = document.getElementById( this.GPT_RESPONSE_ERROR_ID );

		// Proceed if the tooltip element is found
		if ( tooltipElement ) {
			// Set opacity to zero to hide the tooltip
			tooltipElement.classList.remove( 'show-response-error' ); // Make the tooltip invisible
		}
	}
}
