import { Plugin } from 'ckeditor5/src/core.js';
import AiAgentCommand from './aiagentcommand.js';
import type { Element } from 'ckeditor5';
import AiAgentService from './aiagentservice.js';

export default class AiAgentEditing extends Plugin {
	public static get pluginName() {
		return 'AiAgentEditing' as const;
	}

	/**
	 * Initializes the AI Agent editing plugin, setting up commands and key handling.
	 */
	public init(): void {
		const editor = this.editor;
		const aiAgentService = new AiAgentService( editor );
		editor.commands.add(
			'aiAgent',
			new AiAgentCommand( editor, aiAgentService )
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
					await editor.execute( 'aiAgent' );
				}
			}
		} );
	}
}
