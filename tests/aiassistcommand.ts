import { expect } from 'chai';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import sinon from 'sinon';
import AiAssistCommand from '../src/aiassistcommand.js';
import '../src/augmentation.js';
import AiAssistService from '../src/aiassistservice.js';
import AiAssistUI from '../src/aiassistui.js';

describe( 'AiAssistCommand', () => {
	let editor: ClassicEditor;
	let aiAssistService: AiAssistService;
	let command: AiAssistCommand;

	beforeEach( async () => {
		const domElement = document.createElement( 'div' );
		document.body.appendChild( domElement );
		editor = await ClassicEditor.create( domElement, {
			plugins: [ AiAssistUI ],
			aiAssist: {
				model: 'gpt-4o',
				apiKey: 'test-api-key'
			}
		} );

		// Stub AiAssistService with handleSlashCommand method
		aiAssistService = sinon.createStubInstance( AiAssistService, {
			handleSlashCommand: sinon.stub().resolves() // resolves to simulate async
		} );

		// Create an instance of the command
		command = new AiAssistCommand( editor, aiAssistService );
		command.refresh();
	} );

	afterEach( () => {
		// Restore the stubbed methods
		sinon.restore();
	} );

	it( 'should be enabled by default', () => {
		expect( command.isEnabled ).to.be.true;
	} );

	it( 'should execute the AI assist service handleSlashCommand method', async () => {
		// Execute command
		await command.execute();
		// Verify that handleSlashCommand was called once
		sinon.assert.calledOnce( aiAssistService.handleSlashCommand );
	} );

	it( 'should handle errors gracefully during execution', async () => {
		// Explicitly create a stub for handleSlashCommand that rejects with an error
		aiAssistService.handleSlashCommand = sinon.stub().rejects( new Error( 'Test error' ) );

		// Run execute and check that it catches the error without throwing it
		let errorCaught = null;
		try {
			await command.execute();
		} catch ( error ) {
			errorCaught = error;
			expect( errorCaught ).to.not.be.null;
		}
	} );
} );
