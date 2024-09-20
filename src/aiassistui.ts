import { Plugin } from 'ckeditor5/src/core.js';
import { ButtonView } from 'ckeditor5/src/ui.js';
import ckeditor5Icon from '../theme/icons/ckeditor.svg';
import { aiAssistContext } from './aiassistcontext.js';
import { SUPPORTED_LANGUAGES } from './const.js';

export default class AiAssistUI extends Plugin {
	public PLACEHOLDER_TEXT_ID = 'slash-placeholder';
	public GPT_RESPONSE_LOADER_ID = 'gpt-response-loader';
	public GPT_RESPONSE_ERROR_ID = 'gpt-error';

	public static get pluginName() {
		return 'AiAssistUI' as const;
	}

	/**
	 * Initializes the AI Assist UI plugin, setting up UI components and event listeners.
	 * This method is called when the plugin is loaded.
	 */
	public init(): void {
		try {
			aiAssistContext.uiComponent = this;
			// Initialize UI components like buttons, placeholders, loaders, etc.
			this.initializeUIComponents();

			// Set displays content in the appropriate language.
			this.initializeUILanguage();

			// Attach event listeners for handling editor events and user interactions
			this.attachListener();
		} catch ( error: any ) {
			console.error( error.message );
		}
	}

	/**
	 * Initializes UI components such as placeholders, loaders, and buttons for the editor.
	 */
	private initializeUIComponents(): void {
		const editor = this.editor;
		const t = editor.t;

		this.addPlaceholder();
		this.addLoader();
		this.addGptErrorToolTip();

		editor.ui.componentFactory.add( 'aiAssistButton', locale => {
			const view = new ButtonView( locale );
			view.set( {
				label: t( 'Ai assist' ),
				icon: ckeditor5Icon,
				tooltip: true
			} );
			view.on( 'execute', () => {
				editor.execute( 'aiAssist' );
			} );
			return view;
		} );
	}

	/**
	 * Initializes the UI language settings based on the editor's locale.
	 * Displays an error tooltip if the current language is unsupported.
	 */
	private initializeUILanguage(): void {
		const editor = this.editor;
		const t = editor.t;
		const contentLanguageCode = editor.locale.contentLanguage;
		const supportedLanguages = SUPPORTED_LANGUAGES;
		if ( !supportedLanguages.includes( contentLanguageCode ) ) {
			this.showGptErrorToolTip( t( 'Unsupported language code' ) );
		}
	}

	/**
	 * Attaches event listeners to the editor for handling user interactions and content changes.
	 */
	private attachListener(): void {
		const editor = this.editor;
		const model = editor.model;

		model.document.on( 'change:data', () => {
			setTimeout( () => {
				this.applyPlaceholderToCurrentLine();
			}, 10 );
		} );

		model.document.selection.on( 'change:range', () => {
			setTimeout( () => {
				this.applyPlaceholderToCurrentLine();
			}, 10 );
		} );

		editor.editing.view.document.on( 'scroll', () => {
			this.hidePlaceHolder();
		} );

		document.addEventListener( 'scroll', () => {
			this.hidePlaceHolder();
		} );
	}

	/**
	 * Applies the placeholder to the current line in the editor if it is empty.
	 * Hides the placeholder if the line is not empty.
	 */
	public applyPlaceholderToCurrentLine(): void {
		const editor = this.editor;
		const model = editor.model;
		const modelSelection = model.document.selection;

		const block = modelSelection.getFirstPosition()?.parent;
		if ( block && block.isEmpty ) {
			this.hidePlaceHolder();

			setTimeout( async () => {
				if ( block.is( 'element' ) ) {
					const rect = await this.getRectDomOfGivenModelElement(
						block
					);
					if ( rect ) {
						this.showPlaceHolder( rect );
					}
				}
			}, 100 );
		} else {
			this.hidePlaceHolder();
		}
	}

	/**
	 * Retrieves the DOM rectangle of a given model element.
	 *
	 * @param element - The model element for which to get the DOM rectangle.
	 * @returns A promise that resolves to the DOMRect of the element, or null if not found.
	 */
	private async getRectDomOfGivenModelElement(
		element: any
	): Promise<DOMRect | null | undefined> {
		const editor = this.editor;
		const mapper = editor.editing.mapper;
		const view = editor.editing.view;

		const equivalentView = mapper.toViewElement( element );

		if ( equivalentView ) {
			const domElement = view.domConverter.mapViewToDom( equivalentView );
			if ( domElement ) {
				return domElement.getBoundingClientRect();
			}
		}

		return null;
	}

	/**
	 * Adds a placeholder element to the document body for user interaction.
	 */
	private addPlaceholder(): void {
		const editor = this.editor;
		const t = editor.t;
		const placeholder = document.createElement( 'p' );
		placeholder.id = this.PLACEHOLDER_TEXT_ID;
		placeholder.onclick = () => {
			editor.focus();
		};
		placeholder.classList.add( 'place-holder' );
		placeholder.textContent = t( 'Type / to request AI content' );
		document.body.appendChild( placeholder );
	}

	/**
	 * Shows the placeholder at the specified position.
	 *
	 * @param rect - The DOMRect object defining the position to show the placeholder.
	 */
	private showPlaceHolder( rect?: DOMRect ): void {
		const ele = document.getElementById( this.PLACEHOLDER_TEXT_ID );
		if ( ele && rect ) {
			ele.classList.add( 'show-place-holder' );
			ele.style.left = `${ rect.left }px`;
			ele.style.top = `${ rect.top }px`;
		} else if ( ele ) {
			ele.classList.remove( 'show-place-holder' );
		}
	}

	/**
	 * Hides the placeholder element from the document.
	 */
	private hidePlaceHolder(): void {
		const ele = document.getElementById( this.PLACEHOLDER_TEXT_ID );
		if ( ele ) {
			ele.classList.remove( 'show-place-holder' );
		}
	}

	/**
	 * Adds a loader element to the document body for indicating processing.
	 */
	private addLoader(): void {
		const loaderElement = document.createElement( 'div' );
		loaderElement.id = this.GPT_RESPONSE_LOADER_ID;
		loaderElement.classList.add( 'gpt-loader' );
		document.body.appendChild( loaderElement );
	}

	/**
	 * Shows the loader at the specified position.
	 *
	 * @param rect - The DOMRect object defining the position to show the loader.
	 */
	public showLoader( rect?: DOMRect ): void {
		const ele = document.getElementById( this.GPT_RESPONSE_LOADER_ID );
		if ( ele && rect ) {
			ele.style.left = `${ rect.left + 10 }px`;
			ele.style.top = `${ rect.top + 10 }px`;
			ele.classList.add( 'show-gpt-loader' );
		} else if ( ele ) {
			ele.classList.remove( 'show-gpt-loader' );
		}
	}

	/**
	 * Hides the loader element from the document.
	 */
	public hideLoader(): void {
		const ele = document.getElementById( this.GPT_RESPONSE_LOADER_ID );
		if ( ele ) {
			ele.classList.remove( 'show-gpt-loader' );
		}
	}

	/**
	 * Adds an error tooltip element to the document body for displaying error messages.
	 */
	private addGptErrorToolTip(): void {
		const tooltipElement = document.createElement( 'p' );
		tooltipElement.id = this.GPT_RESPONSE_ERROR_ID;
		tooltipElement.classList.add( 'response-error' );
		document.body.appendChild( tooltipElement );
	}

	/**
	 * Displays an error tooltip with the specified message.
	 *
	 * @param message - The error message to display in the tooltip.
	 */
	public showGptErrorToolTip( message: string ): void {
		console.log( 'Showing error message...', message );
		const editor = this.editor;
		const view = editor?.editing?.view?.domRoots?.get( 'main' );
		const tooltipElement = document.getElementById(
			this.GPT_RESPONSE_ERROR_ID
		);

		const editorRect = view?.getBoundingClientRect();
		if ( tooltipElement && editorRect ) {
			tooltipElement.classList.add( 'show-response-error' );
			tooltipElement.textContent = message;
			setTimeout( () => {
				this.hideGptErrorToolTip();
			}, 2000 );
		}
	}

	/**
	 * Hides the error tooltip element from the document.
	 */
	private hideGptErrorToolTip(): void {
		const tooltipElement = document.getElementById(
			this.GPT_RESPONSE_ERROR_ID
		);
		if ( tooltipElement ) {
			tooltipElement.classList.remove( 'show-response-error' );
		}
	}
}
