import { Plugin } from 'ckeditor5/src/core.js';
import { ButtonView } from 'ckeditor5/src/ui.js';

import ckeditor5Icon from '../theme/icons/ckeditor.svg';

export default class AiAssist extends Plugin {
	public static get pluginName() {
		return 'AiAssist' as const;
	}

	public init(): void {
		const editor = this.editor;
		const t = editor.t;
		const model = editor.model;

		// Add the "aiAssistButton" to feature components.
		editor.ui.componentFactory.add( 'aiAssistButton', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: t( 'Ai assist' ),
				icon: ckeditor5Icon,
				tooltip: true
			} );

			// Insert a text into the editor after clicking the button.
			this.listenTo( view, 'execute', () => {
				model.change( writer => {
					const textNode = writer.createText( 'Hello CKEditor 5!' );

					model.insertContent( textNode );
				} );

				editor.editing.view.focus();
			} );

			return view;
		} );
	}
}
