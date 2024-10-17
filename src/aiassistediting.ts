import { Plugin } from 'ckeditor5/src/core.js';
import AiAssistCommand from './aiassistcommand.js';
import type { Element } from 'ckeditor5';
import AiAssistService from './aiassistservice.js';

export default class AiAssistEditing extends Plugin {
	public static get pluginName() {
		return 'AiAssistEditing' as const;
	}

	/**
	 * Initializes the AI Assist editing plugin, setting up commands and key handling.
	 */
	public init(): void {
		const editor = this.editor;
		const aiAssistService = new AiAssistService( editor );
		editor.commands.add(
			'aiAssist',
			new AiAssistCommand( editor, aiAssistService )
		);

		this.setupEnterKeyHandling();
	}

	/**
	 * Sets up handling for the Enter key to trigger AI assist functionality.
	 * If the content starts with a slash, it cancels the default action and executes the AI assist command.
	 */
	private setupEnterKeyHandling(): void {
		const editor = this.editor;
		const model = editor.model;
		const mapper = editor.editing.mapper;
		const view = editor.editing.view;

		editor.keystrokes.set( 'enter', async ( _, cancel ) => {
			const position = model.document.selection.getFirstPosition();
			if ( position ) {
				const paragraph = position.parent as Element;
				const inlineSlash = Array.from( paragraph.getChildren() ).find( ( child: any ) => child.name === 'inline-slash' );
				const equivalentView = mapper.toViewElement( paragraph );
				let content;
				if ( equivalentView ) {
					content =
						view.domConverter.mapViewToDom(
							equivalentView
						)?.innerText;
				}
				if ( ( typeof content === 'string' && content.startsWith( '/' ) ) || inlineSlash ) {
					cancel();
					await editor.execute( 'aiAssist' );
				}
			}
		} );
	}
}
