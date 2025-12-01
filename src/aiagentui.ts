import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import { aiAgentContext } from './aiagentcontext.js';
import { SUPPORTED_LANGUAGES, SHOW_ERROR_DURATION } from './const.js';
import { Widget } from 'ckeditor5/src/widget.js';
import { env } from 'ckeditor5/src/utils.js';

import { addAiAgentButton } from './util/ai-agent-button.js';
import { addAiAgentToneButton } from './util/ai-agent-tone-button.js';

import {
	registerInlineSlashSchema,
	registerAiTagSchema,
	registerAiAnimateStatusSchema
} from './util/ai-agent-ui-schema.js';

export default class AiAgentUI extends Plugin {
	public PLACEHOLDER_TEXT_ID = 'slash-placeholder';
	public GPT_RESPONSE_LOADER_ID = 'gpt-response-loader';
	public GPT_RESPONSE_ERROR_ID = 'gpt-error';
	private showErrorDuration: number = SHOW_ERROR_DURATION;

	constructor( editor: Editor ) {
		super( editor );

		const config = editor.config.get( 'aiAgent' );
		this.showErrorDuration = config?.showErrorDuration ?? SHOW_ERROR_DURATION;
	}

	public static get pluginName() {
		return 'AiAgentUI' as const;
	}

	public static get requires() {
		return [ Widget ] as const;
	}

	/**
	 * Initializes the AI Agent UI plugin, setting up UI components and event listeners.
	 * This method is called when the plugin is loaded.
	 */
	public init(): void {
		try {
			const aiAgentPlugin = this.editor.plugins.get( 'AiAgent' );
			if ( !aiAgentPlugin.isEnabled ) {
				return;
			}

			aiAgentContext.uiComponent = this;
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
		registerInlineSlashSchema( editor );
		registerAiTagSchema( editor );
		registerAiAnimateStatusSchema( editor );

		this.addGptErrorToolTip();
		addAiAgentButton( editor );
		addAiAgentToneButton( editor );

		editor.accessibility.addKeystrokeInfoGroup( {
			id: 'ai-agent',
			categoryId: 'navigation',
			label: t( 'AI Agent' ),
			keystrokes: [
				{
					label: t( 'Type / to Start Inline AI Prompt' ),
					keystroke: '/'
				},
				{
					label: t( 'Insert / to Start AI Prompt Within Existing Text' ),
					keystroke: env.isMac ? 'Cmd + /' : 'Ctrl + /'
				},
				{
					label: t( 'Submit Command from "Ask AI to Edit" Field in Dropdown' ),
					keystroke: env.isMac ? 'Cmd + Enter' : 'Ctrl + Enter'
				},
				{
					label: t( 'Cancel AI Generation' ),
					keystroke: env.isMac ? 'Cmd + Backspace' : 'Ctrl + Backspace'
				}
			]
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

		model.document.selection.on( 'change:range', () => {
			setTimeout( () => {
				this.applyPlaceholderToCurrentLine();
			}, 10 );
			const modelRoot = editor.model.document.getRoot();
			if ( modelRoot ) {
				const modelRange = editor.model.createRangeIn( modelRoot );
				const itemsToRemove: Array<any> = [];
				for ( const item of modelRange.getItems() ) {
					if ( item.is( 'element', 'inline-slash' ) && item.isEmpty ) {
						itemsToRemove.push( item ); // Collect empty items
					}
				}

				// Remove collected empty inline-slash elements
				editor.model.change( writer => {
					for ( const item of itemsToRemove ) {
						writer.remove( item );
					}
				} );
			}
		} );

		editor.editing.view.document.on( 'change:isFocused', ( evt, data, isFocused ) => {
			if (isFocused) {
				setTimeout( () => {
					this.applyPlaceholderToCurrentLine();
				}, 10 );
			}
		} );

		editor.editing.view.document.on( 'scroll', () => {
			this.hidePlaceHolder();
		} );

		document.addEventListener( 'scroll', () => {
			this.hidePlaceHolder();
		} );

		editor.editing.view.document.on( 'blur', () => {
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
	): Promise<{ top: number; left: number } | null> {
		const editor = this.editor;
		const mapper = editor.editing.mapper;
		const view = editor.editing.view;

		const equivalentView = mapper.toViewElement( element );

		if ( equivalentView ) {
			const domElement = view.domConverter.mapViewToDom( equivalentView );
			if ( domElement ) {
				const childPos = domElement.getBoundingClientRect();
				const parentPos = editor.ui.view.editable.element?.parentElement?.getBoundingClientRect();

				const topRelative = childPos.top - ( parentPos?.top ?? 0 );
				const leftRelative = childPos.left - ( parentPos?.left ?? 0 );

				return {
					top: topRelative,
					left: leftRelative
				};
			}
		}
		return null;
	}

	/**
	 * Adds a placeholder element to the document body for user interaction.
	 */
	private addPlaceholder(): void {
		const editor = this.editor;
		const ele = editor.ui.view.editable.element?.parentElement?.querySelector( `#${ this.PLACEHOLDER_TEXT_ID }` ) as HTMLElement;
		if ( !ele ) {
			const t = editor.t;
			const placeholder = document.createElement( 'p' );
			placeholder.id = this.PLACEHOLDER_TEXT_ID;
			placeholder.onclick = () => {
				editor.focus();
			};
			placeholder.classList.add( 'place-holder' );
			placeholder.textContent = t( 'Type / to request AI content' );

			const parentPanelContent = editor.ui.view.editable.element?.parentElement;
			if ( parentPanelContent ) {
				if (parentPanelContent.style.position !== 'absolute'){
					parentPanelContent.style.position = 'relative';
				}
			}

			const panelContent = editor.ui.view.editable.element;
			if ( panelContent ) {
				panelContent.insertAdjacentElement( 'afterend', placeholder );
			}
		}
	}

	/**
	 * Shows the placeholder at the specified position.
	 *
	 * @param rect - The DOMRect object defining the position to show the placeholder.
	 */
	private showPlaceHolder( rect: { top: number; left: number } ): void {
		this.addPlaceholder();
		const editor = this.editor;
		const ele = editor.ui.view.editable.element?.parentElement?.querySelector( `#${ this.PLACEHOLDER_TEXT_ID }` ) as HTMLElement;
		const isReadOnlyMode = this.editor.isReadOnly;
		if ( ele && rect && !isReadOnlyMode ) {
			ele.classList.add( 'show-place-holder' );
			ele.style.top = `${ rect.top }px`;
			ele.style.left = `${ rect.left }px`;
		} else if ( ele ) {
			ele.remove();
		}
	}

	/**
	 * Hides the placeholder element from the document.
	 */
	private hidePlaceHolder(): void {
		const editor = this.editor;
		const ele = editor.ui.view.editable.element?.parentElement?.querySelector( `#${ this.PLACEHOLDER_TEXT_ID }` );
		if ( ele ) {
			ele.remove();
		}
	}

	/**
	 * Adds a loader element to the document body for indicating processing.
	 */
	private addLoader( editor: Editor ): void {
		const ele = editor.ui.view.editable.element?.parentElement?.querySelector( `#${ this.GPT_RESPONSE_LOADER_ID }` ) as HTMLElement;
		if ( !ele ) {
			const loaderElement = document.createElement( 'div' );
			loaderElement.id = this.GPT_RESPONSE_LOADER_ID;
			loaderElement.classList.add( 'gpt-loader' );

			const parentPanelContent = editor.ui.view.editable.element?.parentElement;
			if ( parentPanelContent ) {
				parentPanelContent.style.position = 'relative';
			}

			const panelContent = editor.ui.view.editable.element;
			if ( panelContent ) {
				panelContent.insertAdjacentElement( 'afterend', loaderElement );
			}
		}
	}

	/**
	 * Shows the loader at the specified position.
	 *
	 * @param rect - The DOMRect object defining the position to show the loader.
	 */
	public showLoader( editor: Editor ): void {
		this.addLoader( editor );
		const ele = editor.ui.view.editable.element?.parentElement?.querySelector( `#${ this.GPT_RESPONSE_LOADER_ID }` ) as HTMLElement;

		const domSelection = window.getSelection();
		const domRange: any = domSelection?.getRangeAt( 0 );
		const childPos = domRange.getBoundingClientRect();

		const parentPos = editor.ui.view.editable.element?.parentElement?.getBoundingClientRect();
		const top = childPos.top - ( parentPos?.top ?? 0 );
		const left = childPos.left - ( parentPos?.left ?? 0 );

		if ( ele ) {
			ele.style.left = `${ left + 10 }px`;
			ele.style.top = `${ top + 10 }px`;
			ele.classList.add( 'show-gpt-loader' );
		}
	}

	/**
	 * Hides the loader element from the document.
	 */
	public hideLoader( editor: Editor ): void {
		const ele = editor.ui.view.editable.element?.parentElement?.querySelector( `#${ this.GPT_RESPONSE_LOADER_ID }` ) as HTMLElement;
		if ( ele ) {
			ele.remove();
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
			}, this.showErrorDuration );
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

	/**
	 * Displays a warning message when URLs are blocked by the security filter.
	 *
	 * @param blockedUrls - Object containing arrays of blocked image and link URLs.
	 */
	public showBlockedUrlsWarning( blockedUrls: { images: string[]; links: string[] } ): void {
		const t = this.editor.t;
		const imageCount = blockedUrls.images.length;
		const linkCount = blockedUrls.links.length;

		const parts: string[] = [];
		if ( imageCount > 0 ) {
			parts.push( `${ imageCount } image${ imageCount > 1 ? 's' : '' }` );
		}
		if ( linkCount > 0 ) {
			parts.push( `${ linkCount } link${ linkCount > 1 ? 's' : '' }` );
		}

		if ( parts.length > 0 ) {
			const message = t( 'Security filter blocked' ) + ' ' + parts.join( ' and ' );
			this.showGptErrorToolTip( message );
		}
	}
}
