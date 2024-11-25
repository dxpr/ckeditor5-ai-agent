import { expect } from 'chai';
import AiAssistUI from '../src/aiassistui.js';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import '../src/augmentation.js';

describe( 'AiAssistUI', () => {
	let editor: ClassicEditor;
	let aiAssistUI: AiAssistUI;

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
		aiAssistUI = editor.plugins.get( 'AiAssistUI' );
	} );

	afterEach( async () => {
		await editor.destroy();
	} );

	it( 'should be loaded', () => {
		expect( aiAssistUI ).to.be.instanceOf( AiAssistUI );
	} );

	it( 'should initialize UI components', () => {
		const placeholder = document.getElementById( aiAssistUI.PLACEHOLDER_TEXT_ID );
		const loader = document.getElementById( aiAssistUI.GPT_RESPONSE_LOADER_ID );
		const errorTooltip = document.getElementById( aiAssistUI.GPT_RESPONSE_ERROR_ID );

		expect( placeholder ).to.exist;
		expect( loader ).to.exist;
		expect( errorTooltip ).to.exist;
	} );

	it( 'should show and hide the placeholder correctly', () => {
		const placeholder = document.getElementById( aiAssistUI.PLACEHOLDER_TEXT_ID );

		aiAssistUI.showPlaceHolder( new DOMRect( 0, 0, 100, 20 ) );
		expect( placeholder?.classList.contains( 'show-place-holder' ) ).to.be.true;

		aiAssistUI.hidePlaceHolder();
		expect( placeholder?.classList.contains( 'show-place-holder' ) ).to.be.false;
	} );

	it( 'should show and hide the loader correctly', () => {
		const loader = document.getElementById( aiAssistUI.GPT_RESPONSE_LOADER_ID );

		aiAssistUI.showLoader( new DOMRect( 0, 0, 100, 20 ) );
		expect( loader?.classList.contains( 'show-gpt-loader' ) ).to.be.true;

		aiAssistUI.hideLoader();
		expect( loader?.classList.contains( 'show-gpt-loader' ) ).to.be.false;
	} );

	it( 'should show and hide the error tooltip correctly', () => {
		const errorTooltip = document.getElementById( aiAssistUI.GPT_RESPONSE_ERROR_ID );

		aiAssistUI.showGptErrorToolTip( 'Test error message' );
		expect( errorTooltip?.classList.contains( 'show-response-error' ) ).to.be.true;
		expect( errorTooltip?.textContent ).to.equal( 'Test error message' );

		setTimeout( () => {
			expect( errorTooltip?.classList.contains( 'show-response-error' ) ).to.be.false;
		}, 500 );
	} );

	it( 'should handle inline-slash element correctly', () => {
		const model = editor.model;
		const doc = model.document;

		// Insert an inline-slash element
		model.change( writer => {
			const position = doc.selection.getFirstPosition();
			const inlineSlash = writer.createElement( 'inline-slash', { class: 'ck-slash' } );
			writer.insertText( '/', inlineSlash );
			writer.insert( inlineSlash, position! );
		} );

		// Check if the inline-slash element is inserted
		const inlineSlashElement = doc?.getRoot()?.getChild( 0 );
		expect( inlineSlashElement?.getAttribute( 'class' ) ).to.equal( 'ck-slash' );

		// Remove the inline-slash element
		model.change( writer => {
			if ( inlineSlashElement ) {
				writer.remove( inlineSlashElement );
			}
		} );

		// Check if the inline-slash element is removed
		expect( doc?.getRoot()?.childCount ).to.equal( 0 );
	} );
} );
