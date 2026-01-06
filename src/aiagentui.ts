import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import type { ModelElement as Element } from 'ckeditor5/src/engine.js';
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

/** Maximum number of blocked URLs to display in the warning notification */
const MAX_BLOCKED_URLS_DISPLAYED = 5;

/** Maximum URL length before truncation in the warning notification */
const MAX_URL_DISPLAY_LENGTH = 50;

/** Duration in ms to show blocked URL warning (longer than errors for user to read URL list) */
const BLOCKED_URL_WARNING_DURATION = 15000;

/** Delay in ms before updating placeholder after selection change */
const SELECTION_CHANGE_DELAY = 10;

/** Delay in ms before showing placeholder after position calculation */
const PLACEHOLDER_SHOW_DELAY = 100;

/** Offset in pixels for loader positioning relative to cursor */
const LOADER_POSITION_OFFSET = 10;

export default class AiAgentUI extends Plugin {
	public readonly PLACEHOLDER_TEXT_ID = 'ck-ai-agent-placeholder';
	public readonly LOADER_ID = 'ck-ai-agent-loader';
	public readonly ERROR_TOOLTIP_ID = 'ck-ai-agent-error';

	private showErrorDuration: number = SHOW_ERROR_DURATION;
	private readonly abortController = new AbortController();
	private readonly pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
	private errorTooltipElement: HTMLElement | null = null;

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
	 * Creates a tracked timeout that will be automatically cleared on destroy.
	 */
	private setTimeout( callback: () => void, delay: number ): ReturnType<typeof setTimeout> {
		const timeoutId = setTimeout( () => {
			this.pendingTimeouts.delete( timeoutId );
			callback();
		}, delay );
		this.pendingTimeouts.add( timeoutId );
		return timeoutId;
	}

	/**
	 * Clears all pending timeouts.
	 */
	private clearAllTimeouts(): void {
		for ( const timeoutId of this.pendingTimeouts ) {
			clearTimeout( timeoutId );
		}
		this.pendingTimeouts.clear();
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

		this.createErrorTooltip();
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
			this.showErrorTooltip( t( 'Unsupported language code' ) );
		}
	}

	/**
	 * Attaches event listeners to the editor for handling user interactions and content changes.
	 */
	private attachListener(): void {
		const editor = this.editor;
		const model = editor.model;

		model.document.selection.on( 'change:range', () => {
			this.setTimeout( () => {
				this.applyPlaceholderToCurrentLine();
			}, SELECTION_CHANGE_DELAY );
			this.removeEmptyInlineSlashElements();
		} );

		editor.editing.view.document.on( 'change:isFocused', ( evt, data, isFocused ) => {
			if ( isFocused ) {
				this.setTimeout( () => {
					this.applyPlaceholderToCurrentLine();
				}, SELECTION_CHANGE_DELAY );
			}
		} );

		editor.editing.view.document.on( 'scroll', () => {
			this.hidePlaceHolder();
		} );

		document.addEventListener( 'scroll', () => {
			this.hidePlaceHolder();
		}, { signal: this.abortController.signal } );

		editor.editing.view.document.on( 'blur', () => {
			this.hidePlaceHolder();
		} );
	}

	/**
	 * Removes empty inline-slash elements from the document.
	 */
	private removeEmptyInlineSlashElements(): void {
		const editor = this.editor;
		const modelRoot = editor.model.document.getRoot();

		if ( !modelRoot ) {
			return;
		}

		const modelRange = editor.model.createRangeIn( modelRoot );
		const itemsToRemove: Element[] = [];

		for ( const item of modelRange.getItems() ) {
			if ( item.is( 'element', 'inline-slash' ) && item.isEmpty ) {
				itemsToRemove.push( item );
			}
		}

		if ( itemsToRemove.length > 0 ) {
			editor.model.change( writer => {
				for ( const item of itemsToRemove ) {
					writer.remove( item );
				}
			} );
		}
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

			this.setTimeout( () => {
				if ( block.is( 'element' ) ) {
					const rect = this.getRectDomOfGivenModelElement( block );
					if ( rect ) {
						this.showPlaceHolder( rect );
					}
				}
			}, PLACEHOLDER_SHOW_DELAY );
		} else {
			this.hidePlaceHolder();
		}
	}

	/**
	 * Retrieves the DOM rectangle of a given model element.
	 *
	 * @param element - The model element for which to get the DOM rectangle.
	 * @returns The position of the element relative to the editor container, or null if not found.
	 */
	private getRectDomOfGivenModelElement(
		element: Element
	): { top: number; left: number } | null {
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
			placeholder.classList.add( 'ck-ai-agent-placeholder' );
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
			ele.classList.add( 'ck-ai-agent-placeholder--visible' );
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
		const ele = editor.ui.view.editable.element?.parentElement?.querySelector( `#${ this.LOADER_ID }` ) as HTMLElement;
		if ( !ele ) {
			const loaderElement = document.createElement( 'div' );
			loaderElement.id = this.LOADER_ID;
			loaderElement.classList.add( 'ck-ai-agent-loader' );

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
	 * Shows the loader at the current cursor position.
	 *
	 * @param editor - The editor instance.
	 */
	public showLoader( editor: Editor ): void {
		this.addLoader( editor );
		const ele = editor.ui.view.editable.element?.parentElement?.querySelector(
			`#${ this.LOADER_ID }`
		) as HTMLElement | null;

		const domSelection = window.getSelection();
		if ( !domSelection || domSelection.rangeCount === 0 ) {
			return;
		}

		const domRange = domSelection.getRangeAt( 0 );
		const childPos = domRange.getBoundingClientRect();

		const parentPos = editor.ui.view.editable.element?.parentElement?.getBoundingClientRect();
		const top = childPos.top - ( parentPos?.top ?? 0 );
		const left = childPos.left - ( parentPos?.left ?? 0 );

		if ( ele ) {
			ele.style.left = `${ left + LOADER_POSITION_OFFSET }px`;
			ele.style.top = `${ top + LOADER_POSITION_OFFSET }px`;
			ele.classList.add( 'ck-ai-agent-loader--visible' );
		}
	}

	/**
	 * Hides the loader element from the document.
	 */
	public hideLoader( editor: Editor ): void {
		const ele = editor.ui.view.editable.element?.parentElement?.querySelector( `#${ this.LOADER_ID }` ) as HTMLElement;
		if ( ele ) {
			ele.remove();
		}
	}

	/**
	 * Creates an error tooltip element in the document body for displaying error messages.
	 */
	private createErrorTooltip(): void {
		const existingElement = document.getElementById( this.ERROR_TOOLTIP_ID );
		if ( existingElement ) {
			this.errorTooltipElement = existingElement;
			return;
		}
		const tooltipElement = document.createElement( 'p' );
		tooltipElement.id = this.ERROR_TOOLTIP_ID;
		tooltipElement.classList.add( 'ck-ai-agent-error' );
		document.body.appendChild( tooltipElement );
		this.errorTooltipElement = tooltipElement;
	}

	/**
	 * Displays an error tooltip with the specified message.
	 *
	 * @param message - The error message to display in the tooltip.
	 * @param options - Optional configuration for the tooltip.
	 */
	public showErrorTooltip(
		message: string,
		options?: { type?: 'error' | 'warning'; html?: boolean; duration?: number }
	): void {
		const editor = this.editor;
		const view = editor?.editing?.view?.domRoots?.get( 'main' );
		const tooltipElement = this.errorTooltipElement;

		const editorRect = view?.getBoundingClientRect();
		if ( tooltipElement && editorRect ) {
			tooltipElement.classList.remove( 'ck-ai-agent-error--warning' );
			if ( options?.type === 'warning' ) {
				tooltipElement.classList.add( 'ck-ai-agent-error--warning' );
			}

			tooltipElement.classList.add( 'ck-ai-agent-error--visible' );

			if ( options?.html ) {
				tooltipElement.innerHTML = message;
			} else {
				tooltipElement.textContent = message;
			}

			const duration = options?.duration ?? this.showErrorDuration;
			this.setTimeout( () => {
				this.hideErrorTooltip();
			}, duration );
		}
	}

	/**
	 * Displays a warning notification for blocked URLs.
	 *
	 * @param blockedUrls - Array of blocked URL strings.
	 */
	public showBlockedUrlsWarning( blockedUrls: string[] ): void {
		if ( blockedUrls.length === 0 ) return;

		const t = this.editor.t;
		const displayUrls = blockedUrls.slice( 0, MAX_BLOCKED_URLS_DISPLAYED );
		const remainingCount = blockedUrls.length - displayUrls.length;

		const urlListItems = displayUrls.map( url => {
			const truncated = url.length > MAX_URL_DISPLAY_LENGTH
				? `${ url.substring( 0, MAX_URL_DISPLAY_LENGTH ) }...`
				: url;
			return `<li>${ this.escapeHtml( truncated ) }</li>`;
		} );

		if ( remainingCount > 0 ) {
			urlListItems.push( `<li>...${ t( 'and %0 more', [ remainingCount ] ) }</li>` );
		}

		const urlWord = blockedUrls.length === 1 ? t( 'URL' ) : t( 'URLs' );
		const message =
			`<strong>${ t( 'External URLs filtered' ) }</strong><br>` +
			`${ blockedUrls.length } ${ urlWord } ${ t( 'blocked for security.' ) }<br>` +
			`<ul class="blocked-urls-list">${ urlListItems.join( '' ) }</ul>`;

		this.showErrorTooltip( message, { type: 'warning', html: true, duration: BLOCKED_URL_WARNING_DURATION } );
	}

	/**
	 * Escapes HTML special characters to prevent XSS.
	 */
	private escapeHtml( text: string ): string {
		const div = document.createElement( 'div' );
		div.textContent = text;
		return div.innerHTML;
	}

	/**
	 * Hides the error tooltip element from the document.
	 */
	private hideErrorTooltip(): void {
		if ( this.errorTooltipElement ) {
			this.errorTooltipElement.classList.remove( 'ck-ai-agent-error--visible' );
		}
	}

	/**
	 * Cleans up resources when the plugin is destroyed.
	 * Removes event listeners, clears timeouts, and removes created DOM elements.
	 */
	public override destroy(): void {
		// Abort all document-level event listeners
		this.abortController.abort();

		// Clear all pending timeouts
		this.clearAllTimeouts();

		// Remove error tooltip if we created it
		if ( this.errorTooltipElement ) {
			this.errorTooltipElement.remove();
			this.errorTooltipElement = null;
		}

		// Clean up placeholder and loader elements
		this.hidePlaceHolder();
		this.hideLoader( this.editor );

		super.destroy();
	}
}
