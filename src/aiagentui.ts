import {
	MenuBarMenuView,
	MenuBarMenuListView,
	MenuBarMenuListItemView,
	MenuBarMenuListItemButtonView,
	createDropdown,
	SplitButtonView,
	LabeledFieldView,
	ListSeparatorView,
	ButtonView,
	TextareaView,
	IconView,
	View
} from 'ckeditor5/src/ui.js';
import { Plugin, type Editor } from 'ckeditor5/src/core.js';
import aiAgentIcon from '../theme/icons/ai-agent.svg';
import aiAgentToneIcon from '../theme/icons/ai-agent-tone.svg';
import arrowIcon from '../theme/icons/arrow.svg';
import checkIcon from '../theme/icons/check.svg';
import { aiAgentContext } from './aiagentcontext.js';
import { SUPPORTED_LANGUAGES, SHOW_ERROR_DURATION } from './const.js';
import { Widget, toWidget } from 'ckeditor5/src/widget.js';
import { env } from 'ckeditor5/src/utils.js';
import AiAgentService from './aiagentservice.js';
import { getDefaultAiAgentDropdownMenu, getDefaultAiAgentToneDropdownMenu } from './util/translations.js';

export default class AiAgentUI extends Plugin {
	public PLACEHOLDER_TEXT_ID = 'slash-placeholder';
	public GPT_RESPONSE_LOADER_ID = 'gpt-response-loader';
	public GPT_RESPONSE_ERROR_ID = 'gpt-error';
	private showErrorDuration: number = SHOW_ERROR_DURATION;
	private commandsDropdown = getDefaultAiAgentDropdownMenu( this.editor );
	private tonesDropdown = getDefaultAiAgentToneDropdownMenu( this.editor );

	constructor( editor: Editor ) {
		super( editor );

		const config = editor.config.get( 'aiAgent' );
		this.showErrorDuration = config?.showErrorDuration ?? SHOW_ERROR_DURATION;
		this.commandsDropdown = config?.commandsDropdown ?? getDefaultAiAgentDropdownMenu( editor );
		const defaultTones = getDefaultAiAgentToneDropdownMenu( editor );
		this.tonesDropdown = config?.tonesDropdown ?
			[ defaultTones[ 0 ], ...config?.tonesDropdown ] :
			defaultTones;
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

		// Register the inline-slash schema
		editor.model.schema.register( 'inline-slash', {
			inheritAllFrom: '$block',
			isInline: true,
			isObject: true,
			allowWhere: '$text',
			allowAttributes: [ 'class' ]
		} );

		// Allow the inline-slash element to have text inside it
		editor.model.schema.extend( '$text', {
			allowIn: 'inline-slash'
		} );

		// Set up upcast conversion for inline-slash
		editor.conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'inline-slash',
				attributes: [ 'class' ]
			},
			model: ( viewElement, { writer } ) => {
				return writer.createElement( 'inline-slash', {
					class: viewElement.getAttribute( 'class' )
				} );
			},
			converterPriority: 'high'
		} );

		editor.conversion.for( 'downcast' ).elementToElement( {
			model: {
				name: 'inline-slash',
				attributes: [ 'class' ]
			},
			view: ( modelElement, { writer } ) => {
				return writer.createContainerElement( 'inline-slash', {
					class: modelElement.getAttribute( 'class' )
				} );
			}
		} );

		this.addPlaceholder();
		this.addLoader();
		this.addGptErrorToolTip();
		this.addAiAgentButton();
		this.addAiAgentToneButton();

		editor.accessibility.addKeystrokeInfoGroup( {
			id: 'ai-agent',
			categoryId: 'navigation',
			label: t( 'AI Agent' ),
			keystrokes: [
				{
					label: t( 'Slash Command: Open the AI Command Menu in an Empty Field' ),
					keystroke: '/'
				},
				{
					// eslint-disable-next-line max-len
					label: t( 'Force Insert Slash Command: Add a Slash Command Within Existing Text' ),
					keystroke: env.isMac ? 'Cmd + /' : 'Ctrl + /'
				},
				{
					label: t( 'Cancel AI Generation' ),
					keystroke: env.isMac ? 'Cmd + Backspace' : 'Ctrl + Backspace'
				}
			]
		} );

		editor.model.schema.register( 'ai-tag', {
			inheritAllFrom: '$block',
			isInline: true,
			isObject: true,
			allowWhere: '$block',
			allowAttributes: [ 'id' ]
		} );

		editor.model.schema.extend( '$block', { allowIn: 'ai-tag' } );

		this.addCustomTagConversions();
		this.addCustomTagAiAnimatedStatus();
	}

	private addCustomTagConversions(): void {
		const editor = this.editor;

		editor.conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'ai-tag',
				attributes: [ 'id', 'class' ]
			},
			model: ( viewElement, { writer } ) => {
				return writer.createElement( 'ai-tag', {
					id: viewElement.getAttribute( 'id' )
				} );
			}
		} );

		editor.conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'ai-tag',
			view: ( modelElement, { writer } ) => {
				return writer.createContainerElement( 'ai-tag', {
					id: modelElement.getAttribute( 'id' )
				} );
			}
		} );

		editor.conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'ai-tag',
			view: ( modelElement, { writer } ) => {
				const customTag = writer.createContainerElement( 'ai-tag', {
					id: modelElement.getAttribute( 'id' ),
					class: modelElement.getAttribute( 'class' )
				} );

				return toWidget( customTag, writer );
			}
		} );
	}

	private addCustomTagAiAnimatedStatus(): void {
		const editor = this.editor;

		editor.model.schema.register( 'ai-animated-status', {
			inheritAllFrom: '$block',
			isInline: true,
			isObject: true,
			allowWhere: '$block',
			allowAttributes: [ 'class' ]
		} );

		editor.model.schema.extend( '$block', { allowIn: 'ai-animated-status' } );

		editor.conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'ai-animated-status',
				attributes: [ 'class' ]
			},
			model: ( viewElement, { writer } ) => {
				return writer.createElement( 'ai-animated-status', {
					class: viewElement.getAttribute( 'class' )
				} );
			}
		} );

		editor.conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'ai-animated-status',
			view: ( modelElement, { writer } ) => {
				return writer.createContainerElement( 'ai-animated-status', {
					class: modelElement.getAttribute( 'class' )
				} );
			}
		} );

		editor.conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'ai-animated-status',
			view: ( modelElement, { writer } ) => {
				const customTag = writer.createContainerElement( 'ai-animated-status', {
					class: modelElement.getAttribute( 'class' )
				} );

				return toWidget( customTag, writer );
			}
		} );
	}

	/**
	 * Adds the AI Agent button to the editor's UI, which includes a dropdown menu
	 * for various AI commands. The button allows users to insert slash commands
	 * and provides a search functionality for available commands.
	 *
	 * This method sets up the button's execute event, handles user input for
	 * searching commands, and organizes the command menu into groups for better
	 * usability.
	 */
	private addAiAgentButton(): void {
		const editor = this.editor;
		const t = this.editor.t;
		const viewDocument = this.editor.editing.view.document;

		const manageDropdown = (
			labeledFieldView: LabeledFieldView<TextareaView>,
			listView: MenuBarMenuListView
		) => {
			const editorData = editor.getData();
			const isTextSelected = ( labeledFieldView.fieldView.element?.value || editorData ) ? true : false;
			labeledFieldView.isEnabled = isTextSelected;
			this.aiAgentListItemUpdate( listView, isTextSelected );
		};

		const executeAiAgentCommand = (
			command: string,
			labeledFieldView: LabeledFieldView<TextareaView>,
			listView: MenuBarMenuListView
		): void => {
			if ( ( labeledFieldView.fieldView as TextareaView ).element && command ) {
				const aiAgentService = new AiAgentService( this.editor );
				this.editor.editing.view.focus();

				const selection = this.editor.model.document.selection;
				const selectedContentFragment = this.editor.model.getSelectedContent( selection );
				const viewFragment = this.editor.data.toView( selectedContentFragment );
				const html = this.editor.data.processor.toData( viewFragment );

				if ( !html ) {
					this.editor.execute( 'selectAll' );
				}
				let updatedCommand = command;
				if ( labeledFieldView.fieldView.element?.value ) {
					updatedCommand = `${ command } \n ${ labeledFieldView.fieldView.element?.value }`;
				}

				aiAgentService.handleSlashCommand( updatedCommand );
				labeledFieldView.isEnabled = false;
				manageDropdown( labeledFieldView, listView );
				if ( labeledFieldView.fieldView ) {
					labeledFieldView.fieldView.value = '';
				}
			}
		};

		const executeCommand = () => {
			this.editor.model.change( writer => {
				const position = this.editor.model.document.selection.getLastPosition();
				if ( position ) {
					const inlineSlashContainer = writer.createElement( 'inline-slash', { class: 'ck-slash' } );
					writer.insertText( '/', inlineSlashContainer );
					writer.insert( inlineSlashContainer, position );
					const newPosition = writer.createPositionAt( inlineSlashContainer, 'end' );
					writer.setSelection( newPosition );
				}
			} );
			this.editor.editing.view.focus();
		};

		this.editor.ui.componentFactory.add( 'aiAgentButton', locale => {
			const dropdownView = createDropdown( locale, SplitButtonView );
			dropdownView.class = 'ck-ai-commands-list';
			const buttonView = dropdownView.buttonView;
			buttonView.set( {
				label: t( 'AI Agent' ),
				icon: aiAgentIcon,
				tooltip: true
			} );

			buttonView.on( 'execute', executeCommand );

			const menuView = new MenuBarMenuView( locale );
			const listView = new MenuBarMenuListView( locale );

			const searchContainer = new MenuBarMenuListItemView( locale, menuView );

			const button = new ButtonView( locale );
			button.set( {
				label: t( 'Submit' ),
				icon: arrowIcon,
				tooltip: true,
				class: 'ck-ask-ai-to-edit-button',
				isEnabled: false
			} );

			const labeledFieldView = new LabeledFieldView<TextareaView>( locale, ( labeledFieldView, viewUid, statusUid ) => {
				const textareaView = new TextareaView( locale );
				textareaView.set( {
					id: viewUid,
					ariaDescribedById: statusUid,
					minRows: 1,
					maxRows: 10,
					resize: 'vertical',
					placeholder: t( 'Ask AI to edit' )
				} );

				textareaView.on( 'input', () => {
					button.isEnabled = !!textareaView.element?.value;
				} );

				textareaView.on( 'keydown', ( evt: any, data: any ) => {
					if ( data.keyCode === 13 && !data.shiftKey && button.isEnabled ) {
						data.preventDefault();
						const command = textareaView.element?.value || '';
						this.insertEmptySpace();
						executeAiAgentCommand( command, labeledFieldView as LabeledFieldView<TextareaView>, listView );
					}
				} );

				return textareaView;
			} );
			labeledFieldView.label = '';

			// Execute a command when the button is clicked
			button.on( 'execute', () => {
				const command = ( labeledFieldView.fieldView as TextareaView ).element?.value || '';
				this.insertEmptySpace();
				executeAiAgentCommand( command, labeledFieldView as LabeledFieldView<TextareaView>, listView );
			} );

			searchContainer.children.add( labeledFieldView );
			searchContainer.children.add( button );
			listView.items.add( searchContainer );

			for ( const group of this.commandsDropdown ) {
				const separatorView = new ListSeparatorView( locale );
				listView.items.add( separatorView );
				// Add group title if needed
				const titleView = new MenuBarMenuListItemView( locale, menuView );
				const titleButton = new MenuBarMenuListItemButtonView( locale );
				titleButton.set( {
					label: group.title,
					class: 'ck-menu-group-title ck-list-item-button',
					isEnabled: false
				} );
				titleView.children.add( titleButton );
				listView.items.add( titleView );
				// Add group items
				for ( const item of group.items ) {
					const listItemView = new MenuBarMenuListItemView( locale, menuView );
					const buttonView = new MenuBarMenuListItemButtonView( locale );
					buttonView.set( {
						label: item.title,
						class: 'ck-menu-item'
					} );
					buttonView.delegate( 'execute' ).to( menuView );
					buttonView.on( 'execute', () => {
						this.insertEmptySpace();
						executeAiAgentCommand( item.command, labeledFieldView, listView );
					} );
					listItemView.children.add( buttonView );
					listView.items.add( listItemView );
				}
			}
			dropdownView.panelView.children.add( listView );

			viewDocument.on( 'keyup', () => {
				manageDropdown( labeledFieldView, listView );
			} );
			labeledFieldView.fieldView.on( 'input', () => {
				manageDropdown( labeledFieldView, listView );
			} );

			setTimeout( function() {
				manageDropdown( labeledFieldView, listView );
			} );
			return dropdownView;
		} );

		editor.editing.view.document.on( 'keydown', ( event, data ) => {
			if ( ( data.ctrlKey || data.metaKey ) && data.keyCode === 191 ) {
				executeCommand();
			}
		} );
	}

	/**
	 * Adds the AI Agent Tone button to the editor's UI, which includes a dropdown menu
	 * for selecting various AI tones. The button allows users to apply different tones
	 * to the AI-generated content and provides visual feedback for the selected tone.
	 *
	 * This method sets up the button's execute event, handles user input for selecting
	 * tones, and organizes the tone menu into a list for better usability.
	 */
	private addAiAgentToneButton(): void {
		const editor = this.editor;
		const t = editor.t;

		editor.ui.componentFactory.add( 'aiAgentToneButton', locale => {
			const dropdownView = createDropdown( locale );
			dropdownView.class = 'ck-ai-tone-list';
			const buttonView = dropdownView.buttonView;
			buttonView.set( {
				label: t( 'Tone of voice' ),
				icon: aiAgentToneIcon,
				tooltip: true
			} );

			const menuView = new MenuBarMenuView( locale );
			const listView = new MenuBarMenuListView( locale );
			const checkIcons: Array<IconView> = [];

			// Add group title for Tone
			const titleView = new MenuBarMenuListItemView( locale, menuView );
			const titleButton = new MenuBarMenuListItemButtonView( locale );
			titleButton.set( {
				label: t( 'Tone' ),
				class: 'ck-menu-group-title ck-list-item-button',
				isEnabled: false
			} );
			titleView.children.add( titleButton );
			listView.items.add( titleView );

			for ( const item of this.tonesDropdown ) {
				const listItemView = new MenuBarMenuListItemView( locale, menuView );
				const buttonView = new MenuBarMenuListItemButtonView( locale );
				const checkIconView = new IconView();
				checkIconView.set( {
					content: checkIcon
				} );
				checkIconView.isVisible = item.command === '' ? true : false;
				checkIcons.push( checkIconView );

				const spanView = new View( locale );
				spanView.setTemplate( {
					tag: 'span',
					attributes: {
						class: 'ck ck-list-item-button__check-holder ck-tone-of-voice'
					},
					children: [ checkIconView ]
				} );
				spanView.render();

				buttonView.children.add( spanView );
				buttonView.set( {
					label: item.title,
					class: 'ck-menu-item'
				} );
				buttonView.delegate( 'execute' ).to( menuView );

				listItemView.children.add( buttonView );
				listView.items.add( listItemView );
				buttonView.on( 'execute', () => {
					checkIcons.forEach( iconView => {
						iconView.isVisible = false;
					} );
					checkIconView.isVisible = true;
					editor.execute( 'aiAgentTone', {
						value: item.command
					} );
					editor.editing.view.focus();
				} );
			}

			dropdownView.panelView.children.add( listView );
			return dropdownView;
		} );
	}

	/**
	 * Updates the enabled state of items in the AI Agent command list based on the provided type and data.
	 *
	 * This method iterates through the list of items in the provided listView and enables or disables them
	 * based on the search input or selection state. It checks if the item is a title, separator, or search input
	 * and updates the isEnabled property accordingly.
	 *
	 * @param listView - The MenuBarMenuListView containing the items to update.
	 * @param type - The type of update to perform, either 'search' to filter items based on input or 'enable'
	 *               to enable/disable items based on selection state.
	 * @param data - The search string for filtering items when type is 'search', or a boolean indicating
	 *               whether to enable or disable items when type is 'enable'.
	 */
	private aiAgentListItemUpdate( listView: MenuBarMenuListView, isEnabled: boolean ) {
		listView.items.map( itemView => {
			const element = itemView as any;
			if ( element.children?.first ) {
				const button = element.children.first;
				if ( button.class ) {
					const isTitle = button.class.includes( 'ck-menu-group-title' );
					if ( !isTitle ) {
						element.isEnabled = isEnabled;
						button.isEnabled = isEnabled;
					}
				}
			}
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
		setTimeout( async () => {
			const panelContent = editor.ui.view.element;
			if ( panelContent ) {
				panelContent.append( placeholder );
			}
		} );
	}

	/**
	 * Shows the placeholder at the specified position.
	 *
	 * @param rect - The DOMRect object defining the position to show the placeholder.
	 */
	private showPlaceHolder( rect?: DOMRect ): void {
		const editor = this.editor;
		const ele = editor.ui.view.element?.querySelector( `#${ this.PLACEHOLDER_TEXT_ID }` ) as HTMLElement;
		const isReadOnlyMode = this.editor.isReadOnly;
		if ( ele && rect && !isReadOnlyMode ) {
			ele.classList.add( 'show-place-holder' );
			ele.style.top = `${ rect.top }px`;
		} else if ( ele ) {
			ele.classList.remove( 'show-place-holder' );
		}
	}

	/**
	 * Hides the placeholder element from the document.
	 */
	private hidePlaceHolder(): void {
		const editor = this.editor;
		const ele = editor.ui.view.element?.querySelector( `#${ this.PLACEHOLDER_TEXT_ID }` );
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
	 * Inserts an empty non-breaking space at the current selection position in the editor.
	 * This method modifies the editor's model to add a non-breaking space character (`\u00A0`),
	 * ensuring that the space is preserved in the content and does not collapse.
	 *
	 * @returns {void} This function does not return a value.
	 *
	 * @example
	 * // Usage: Call this method to insert an empty space in the editor.
	 * this.insertEmptySpace();
	 */
	private insertEmptySpace(): void {
		this.editor.model.change( writer => {
			const insertPosition = this.editor.model.document.selection.getFirstPosition();
			if ( insertPosition ) {
				writer.insertText( '\u00A0', insertPosition );
			}
		} );
	}
}
