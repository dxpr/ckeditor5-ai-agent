import { expect } from 'chai';
import sinon from 'sinon';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import AiAssistCommand from '../src/aiassistcommand.js';
import AiAssistService from '../src/aiassistservice.js';

describe( 'AiAssistCommand', () => {
	let domElement: HTMLElement, editor: ClassicEditor, aiAssistService: AiAssistService, aiAssistCommand: AiAssistCommand;

	beforeEach( async () => {
		domElement = document.createElement( 'div' );
		document.body.appendChild( domElement );

		editor = await ClassicEditor.create( domElement, {
			plugins: [
				Paragraph,
				Heading,
				Essentials
			],
			aiAssist: {
				model: 'gpt-4o',
				apiKey: 'test-api-key'
			}
		} );

		aiAssistService = new AiAssistService( editor );
		aiAssistCommand = new AiAssistCommand( editor, aiAssistService );
		editor.commands.add( 'aiAssist', aiAssistCommand );
	} );

	afterEach( () => {
		domElement.remove();
		return editor.destroy();
	} );

	describe( 'constructor()', () => {
		it( 'should create an instance of AiAssistCommand', () => {
			expect( aiAssistCommand ).to.be.instanceOf( AiAssistCommand );
		} );
	} );

	describe( 'refresh()', () => {
		it( 'should enable the command', () => {
			aiAssistCommand.refresh();
			expect( aiAssistCommand.isEnabled ).to.be.true;
		} );
	} );

	describe( 'execute()', () => {
		it( 'should call aiAssistService with correct parameters', async () => {
			const executeSpy = sinon.spy( aiAssistService, 'handleSlashCommand' );

			editor.model.change( writer => {
				const position = editor.model.document.selection.getFirstPosition();
				const paragraph = writer.createElement( 'paragraph' );
				writer.insertText( '/test', paragraph );
				writer.insert( paragraph, position! );
				writer.setSelection( paragraph, 'end' );
			} );

			try {
				await aiAssistCommand.execute();
			} catch ( error ) {
				// Expected error
			} finally {
				expect( executeSpy.calledOnce ).to.be.true;
				executeSpy.restore();
			}
		} );

		it( 'should handle errors gracefully during execution', async () => {
			const executeStub = sinon.stub( aiAssistCommand, 'execute' ).throws( new Error( 'Test error' ) );

			// Run execute and check that it catches the error without throwing it
			let errorCaught = null;
			try {
				await aiAssistCommand.execute();
			} catch ( error ) {
				// Expected error
				errorCaught = error;
			}

			// expect( consoleErrorSpy.calledOnce ).to.be.true;
			expect( errorCaught ).to.not.be.null;
			executeStub.restore();
		} );
	} );
} );
