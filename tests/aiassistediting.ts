import { expect } from 'chai';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import AiAssistEditing from '../src/aiassistediting.js';
import AiAssistCommand from '../src/aiassistcommand.js';
import '../src/augmentation.js';
import { keyCodes } from '@ckeditor/ckeditor5-utils';

describe( 'AiAssistEditing', () => {
	let editor: ClassicEditor;

	beforeEach( async () => {
		const domElement = document.createElement( 'div' );
		document.body.appendChild( domElement );
		editor = await ClassicEditor.create( domElement, {
			plugins: [ AiAssistEditing ],
			aiAssist: {
				model: 'gpt-4o',
				apiKey: 'test-api-key'
			}
		} );
	} );

	afterEach( async () => {
		await editor.destroy();
	} );

	it( 'should be loaded', async () => {
		expect( editor.plugins.get( AiAssistEditing ) ).to.be.instanceOf( AiAssistEditing );
	} );

	it( 'should register the aiAssist command', () => {
		const command = editor.commands.get( 'aiAssist' );
		expect( command ).to.be.instanceOf( AiAssistCommand );
	} );

	it( 'should set up enter key handling', () => {
		const wasHandled = editor.keystrokes.press( {
			keyCode: keyCodes.enter,
			altKey: false,
			ctrlKey: false,
			metaKey: false,
			shiftKey: false
		} );

		expect( wasHandled ).to.be.true;
	} );
} );
