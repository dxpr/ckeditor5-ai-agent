import { expect } from 'chai';
import sinon from 'sinon';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import AiAssistEditing from '../src/aiassistediting.js';
import { keyCodes } from '@ckeditor/ckeditor5-utils';
import AiAssistCommand from '../src/aiassistcommand.js';
import AiAssistUI from '../src/aiassistui.js';
import '../src/augmentation.js';
import '../theme/style.css';

describe( 'AiAssistEditing', () => {
	let domElement: HTMLElement, editor: ClassicEditor;

	beforeEach( async () => {
		domElement = document.createElement( 'div' );
		document.body.appendChild( domElement );

		editor = await ClassicEditor.create( domElement, {
			plugins: [
				Paragraph,
				AiAssistEditing,
				AiAssistUI
			],
			aiAssist: {
				model: 'gpt-4o',
				apiKey: 'test-api-key'
			}
		} );
	} );

	afterEach( () => {
		domElement.remove();
		return editor.destroy();
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

	describe( 'setupEnterKeyHandling()', () => {
		it( 'should execute aiAssist command when content starts with /', async () => {
			const executeSpy = sinon.spy( editor, 'execute' );

			editor.model.change( writer => {
				const position = editor.model.document.selection.getFirstPosition();
				const paragraph = writer.createElement( 'paragraph' );
				writer.insert( paragraph, position! );
				writer.insertText( '/test', paragraph );
				const newPosition = writer.createPositionAt( paragraph, 'end' );
				writer.setSelection( newPosition );
			} );

			// Maintain a delay to simulate asynchronous behavior
			await new Promise( resolve => setTimeout( resolve, 1000 ) );

			editor.keystrokes.press( {
				keyCode: keyCodes.enter,
				altKey: false,
				ctrlKey: false,
				metaKey: false,
				shiftKey: false
			} );
			expect( executeSpy.calledOnceWith( 'aiAssist' ) ).to.be.true;
		} );

		it( 'should not execute aiAssist command when content does not start with / and inline-slash is not present', async () => {
			const executeSpy = sinon.spy( editor, 'execute' );

			editor.model.change( writer => {
				const position = editor.model.document.selection.getFirstPosition();
				const paragraph = writer.createElement( 'paragraph' );
				writer.insert( paragraph, position! );
				writer.insertText( 'test', paragraph );
				const newPosition = writer.createPositionAt( paragraph, 'end' );
				writer.setSelection( newPosition );
			} );

			// Maintain a delay to simulate asynchronous behavior
			await new Promise( resolve => setTimeout( resolve, 1000 ) );

			editor.keystrokes.press( {
				keyCode: keyCodes.enter,
				altKey: false,
				ctrlKey: false,
				metaKey: false,
				shiftKey: false
			} );
			expect( executeSpy.calledOnceWith( 'aiAssist' ) ).to.be.false;
		} );

		it( 'should execute aiAssist command when inline-slash is present', async () => {
			const model = editor.model;
			const doc = model.document;
			const executeSpy = sinon.spy( editor, 'execute' );

			editor.model.change( writer => {
				const position = doc.selection.getFirstPosition();
				const inlineSlashContainer = writer.createElement( 'inline-slash', { class: 'ck-slash' } );
				writer.insertText( '/', inlineSlashContainer );
				writer.insert( inlineSlashContainer, position! );
				const newPosition = writer.createPositionAt( inlineSlashContainer, 'end' );
				writer.setSelection( newPosition );

				writer.insertText( 'test', doc.selection.getLastPosition()! );
			} );

			// Maintain a delay to simulate asynchronous behavior
			await new Promise( resolve => setTimeout( resolve, 1000 ) );

			editor.keystrokes.press( {
				keyCode: keyCodes.enter,
				altKey: false,
				ctrlKey: false,
				metaKey: false,
				shiftKey: false
			} );

			expect( executeSpy.calledOnceWith( 'aiAssist' ) ).to.be.true;
		} );
	} );
} );
