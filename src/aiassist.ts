import { Plugin } from 'ckeditor5/src/core.js';
import { ButtonView } from 'ckeditor5/src/ui.js';
import ckeditor5Icon from '../theme/icons/ckeditor.svg';
// eslint-disable-next-line
import { add } from '@ckeditor/ckeditor5-utils/src/translation-service.js';
import translations from '../lang/contexts.json';
import '../theme/style.css';
import type { Element } from 'ckeditor5';

export default class AiAssist extends Plugin {
	public PLACEHOLDER_TEXT_ID = 'slash-placeholder';
	public GPT_RESPONSE_LOADER_ID = 'gpt-response-loader';
	public GPT_RESPONSE_ERROR_ID = 'gpt-error';

	// UI Texts
	public ICON_TOOLTIP = 'Ai assist';
	public PLACEHOLDER_TEXT = 'Place holder';
	public ERROR_UNSUPPORTED_LANGUAGE = 'Error unsupported language';
	public ERROR_PROCESSING_COMMAND = 'Error processing command';
	public ERROR_READABLE_STREAM_NOT_SUPPORT = 'Error readableStream not supported';
	public ERROR_STREAM_LOCKED = 'Error stream locked';
	public ERROR_PARSING_RESPONSE = 'Error parsing response';
	public ERROR_FETCH_FAILED = 'Error fetch failed';

	public isInteractingWithGpt: boolean = false;

	public static get pluginName() {
		return 'AiAssist' as const;
	}

	public init(): void {
		// Initialize UI components like buttons, placeholders, loaders, etc.
		this.initializeUIComponents();
		// Attach event listeners for handling editor events and user interactions
		this.attachListener();
		// Set displays content in the appropriate language.
		this.initializeUILanguage();
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
				label: t( this.ICON_TOOLTIP ),
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
		const contentLanguageCode = editor.locale.contentLanguage;
		if ( contentLanguageCode in translations ) {
			add( contentLanguageCode, translations[ contentLanguageCode as keyof typeof translations ] );
		} else {
			this.showGptErrorToolTip( this.ERROR_UNSUPPORTED_LANGUAGE );
			console.error( 'Unsupported language code' );
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
		try {
			if ( !prompt || this.isInteractingWithGpt ) {
				return;
			}

			cancel(); // cancel the bubbling
			await this.fetchAndProcessGptResponse( prompt, parent );
		} catch ( error ) {
			this.showGptErrorToolTip( this.ERROR_PROCESSING_COMMAND );
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
	public async fetchAndProcessGptResponse( prompt: string, parent: any ): Promise<void> {
		try {
			const filteredPrompt = prompt?.substring( prompt?.lastIndexOf( '/' ) + 1 );
			const inputBeforePrompt = prompt?.substring( 0, prompt?.lastIndexOf( '/' ) );
			const domSelection = window.getSelection();
			const domRange: any = domSelection?.getRangeAt( 0 );
			const rect = domRange.getBoundingClientRect();

			// make api call
			this.showLoader( rect );
			this.isInteractingWithGpt = true;

			// Make API call to OpenAI GPT
			const response = await fetch( 'https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					// eslint-disable-next-line max-len
					'Authorization': 'Bearer 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',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify( {
					model: 'gpt-4o',
					messages: [
						{
							role: 'user',
							content: this.generateGptPromptBasedOnUserPrompt( filteredPrompt )
						}
					],
					stream: true
				} )
			} );

			if ( !response.body ) {
				this.showGptErrorToolTip( this.ERROR_READABLE_STREAM_NOT_SUPPORT );
				return;
			}

			if ( response.body.locked ) {
				console.error( 'Stream is already locked.' );
				this.showGptErrorToolTip( this.ERROR_STREAM_LOCKED );
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
				writer.insertText( `${ inputBeforePrompt }`, parent );
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
						this.showGptErrorToolTip( this.ERROR_PARSING_RESPONSE );
					}
				}
			}
		} catch ( error ) {
			console.error( 'Error during GPT response fetch:', error );
			this.showGptErrorToolTip( this.ERROR_FETCH_FAILED );
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
		const view = editor?.editing?.view?.domRoots?.get( 'main' );
		let context = view?.innerText ?? '';
		context = context.replace( prompt, '@@@cursor@@@' );
		const contentLanguageCode = editor.locale.contentLanguage;

		let finalPrompt = `"${ context }"`;
		finalPrompt += '\nConsider the above content as context.';
		finalPrompt += ` Replace '@@@cursor@@@' with the response for the following request: "${ prompt }"`;
		finalPrompt += '\n\nInstructions:';
		finalPrompt += `\n1. The response must follow the language code - ${ contentLanguageCode }.`;
		finalPrompt += '\n2. Insert the generated content at the precise location of the "@@@cursor@@@" placeholder.';
		finalPrompt += ' The response should only contain the required text,';
		finalPrompt += ' without any additional context or introductory phrases.';
		finalPrompt += '\n3. Ensure the inserted content maintains a seamless connection with the surrounding text,';
		finalPrompt += ' making the transition smooth and natural.';
		finalPrompt += '\n4. If the response involves adding an item to a list,';
		finalPrompt += '  only generate the item itself, matching the format of the existing items in the list.';
		finalPrompt += '\n5. Respond in a format that aligns with the surrounding content. ';
		finalPrompt += 'If the response includes a list, maintain the existing list structure.';
		finalPrompt += '   For example, number the items starting from "1" and use letters for sub-lists.';
		finalPrompt += '\n6. Avoid any introductory phrases or context explanations in the response.';
		finalPrompt += '\n7. Ensure that the content is free of grammar errors and correctly formatted to avoid parsing errors.';
		finalPrompt += '\n8. The response should directly follow the context, avoiding any awkward transitions or noticeable gaps.';
		finalPrompt += '\n9. Do not modify the original text except to replace the "@@@cursor@@@" placeholder with the generated content.';

		return finalPrompt;
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
		placeholder.textContent = t( 'Type / to request AI content' );

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
		const t = editor.t;
		const view = editor?.editing?.view?.domRoots?.get( 'main' );
		const tooltipElement = document.getElementById( this.GPT_RESPONSE_ERROR_ID );

		const editorRect = view?.getBoundingClientRect();
		// Proceed if both the tooltip element and editor rectangle are available
		if ( tooltipElement && editorRect ) {
			// Set tooltip styles for positioning and visibility
			tooltipElement.classList.add( 'show-response-error' );
			tooltipElement.textContent = t( message ); // Set the tooltip text content
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
