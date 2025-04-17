import type { Editor } from 'ckeditor5/src/core.js';
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
	TextareaView
} from 'ckeditor5/src/ui.js';
import AiAgentService from '../aiagentservice.js';
import aiAgentIcon from '../../theme/icons/ai-agent.svg';
import arrowIcon from '../../theme/icons/arrow.svg';
import { getDefaultAiAgentDropdownMenu } from './translations.js';

export function addAiAgentButton( editor: Editor ): void {
	const t = editor.t;

	const config = editor.config.get( 'aiAgent' );
	const commandsDropdown = config?.commandsDropdown ?? getDefaultAiAgentDropdownMenu( editor );
	const viewDocument = editor.editing.view.document;

	const manageDropdown = (
		labeledFieldView: LabeledFieldView<TextareaView>,
		listView: MenuBarMenuListView
	) => {
		const editorData = editor.getData();
		const isTextSelected = ( labeledFieldView.fieldView.element?.value || editorData ) ? true : false;
		labeledFieldView.isEnabled = isTextSelected;

		listView.items.map( itemView => {
			const element = itemView as any;
			if ( element.children?.first ) {
				const button = element.children.first;
				if ( button.class ) {
					const isTitle = button.class.includes( 'ck-menu-group-title' );
					if ( !isTitle ) {
						element.isEnabled = isTextSelected;
						button.isEnabled = isTextSelected;
					}
				}
			}
		} );
	};

	const executeAiAgentCommand = (
		command: string,
		labeledFieldView: LabeledFieldView<TextareaView>,
		listView: MenuBarMenuListView
	): void => {
		if ( ( labeledFieldView.fieldView as TextareaView ).element && command ) {
			const aiAgentService = new AiAgentService( editor );
			editor.editing.view.focus();

			const selection = editor.model.document.selection;
			const selectedContentFragment = editor.model.getSelectedContent( selection );
			const viewFragment = editor.data.toView( selectedContentFragment );
			const html = editor.data.processor.toData( viewFragment );

			if ( !html ) {
				editor.execute( 'selectAll' );
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
		editor.model.change( writer => {
			const position = editor.model.document.selection.getLastPosition();
			if ( position ) {
				const inlineSlashContainer = writer.createElement( 'inline-slash', { class: 'ck-slash' } );
				writer.insertText( '/', inlineSlashContainer );
				writer.insert( inlineSlashContainer, position );
				const newPosition = writer.createPositionAt( inlineSlashContainer, 'end' );
				writer.setSelection( newPosition );
			}
		} );
		editor.editing.view.focus();
	};

	editor.ui.componentFactory.add( 'aiAgentButton', locale => {
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
					insertEmptySpace( editor );
					executeAiAgentCommand( command, labeledFieldView as LabeledFieldView<TextareaView>, listView );
				}
			} );

			return textareaView;
		} );
		labeledFieldView.label = '';

		// Execute a command when the button is clicked
		button.on( 'execute', () => {
			const command = ( labeledFieldView.fieldView as TextareaView ).element?.value || '';
			insertEmptySpace( editor );
			executeAiAgentCommand( command, labeledFieldView as LabeledFieldView<TextareaView>, listView );
		} );

		searchContainer.children.add( labeledFieldView );
		searchContainer.children.add( button );
		listView.items.add( searchContainer );

		for ( const group of commandsDropdown ) {
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
					insertEmptySpace( editor );
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

function insertEmptySpace( editor: Editor ): void {
	editor.model.change( writer => {
		const insertPosition = editor.model.document.selection.getFirstPosition();
		if ( insertPosition ) {
			writer.insertText( '\u00A0', insertPosition );
		}
	} );
}
