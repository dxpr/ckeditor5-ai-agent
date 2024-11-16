import { expect } from 'chai';
import AiAssistUI from '../src/aiassistui.js';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import type { Element } from 'ckeditor5';
import sinon from 'sinon';
import '../src/augmentation.js';
import '../theme/style.css';

describe( 'AiAssistUI', () => {
	let editor: ClassicEditor;
	let aiAssistUI: AiAssistUI;

	beforeEach( async () => {
		const domElement = document.createElement( 'div' );
		document.body.appendChild( domElement );
		editor = await ClassicEditor.create( domElement, {
			plugins: [ AiAssistUI, Paragraph ],
			aiAssist: {
				model: 'gpt-4o',
				apiKey: 'test-api-key'
			}

		} );
		aiAssistUI = editor.plugins.get( 'AiAssistUI' );
		aiAssistUI.hidePlaceHolder();
	} );

	afterEach( async () => {
		await editor.destroy();
	} );

	it( 'should be loaded', () => {
		expect( aiAssistUI ).to.be.instanceOf( AiAssistUI );
	} );

	describe( 'initializeUIComponents()', () => {
		it( 'should register inline-slash schema and conversions', () => {
			const schema = editor.model.schema;
			const conversion = editor.conversion;

			expect( schema.isRegistered( 'inline-slash' ) ).to.be.true;

			const upcastConversion = conversion.for( 'upcast' ).elementToElement;
			const downcastConversion = conversion.for( 'downcast' ).elementToElement;

			expect( upcastConversion ).to.exist;
			expect( downcastConversion ).to.exist;
		} );

		it( 'should initialize UI components', () => {
			const placeholder = document.getElementById( aiAssistUI.PLACEHOLDER_TEXT_ID );
			const loader = document.getElementById( aiAssistUI.GPT_RESPONSE_LOADER_ID );
			const errorTooltip = document.getElementById( aiAssistUI.GPT_RESPONSE_ERROR_ID );

			expect( placeholder ).to.exist;
			expect( loader ).to.exist;
			expect( errorTooltip ).to.exist;
		} );

		it( 'should add aiAssistButton to the toolbar', () => {
			const componentFactory = editor.ui.componentFactory;
			expect( componentFactory.has( 'aiAssistButton' ) ).to.be.true;
		} );
	} );

	describe( 'attachListener()', () => {
		it( 'should attach event listeners to the editor', () => {
			const model = editor.model;
			const document = model.document;

			const changeDataSpy = sinon.spy( document, 'on' );
			const changeRangeSpy = sinon.spy( document.selection, 'on' );
			const scrollSpy = sinon.spy( editor.editing.view.document, 'on' );

			aiAssistUI.attachListener();

			expect( changeDataSpy.calledWith( 'change:data' ) ).to.be.true;
			expect( changeRangeSpy.calledWith( 'change:range' ) ).to.be.true;
			expect( scrollSpy.calledWith( 'scroll' ) ).to.be.true;
		} );
	} );

	describe( 'PlaceHolder For AI prompt', () => {
		it( 'should show placeholder at the specified position', () => {
			const rect = new DOMRect( 100, 200, 100, 20 );
			const placeholderElement = document.getElementById( aiAssistUI.PLACEHOLDER_TEXT_ID );

			aiAssistUI.showPlaceHolder( rect );

			expect( placeholderElement!.classList.contains( 'show-place-holder' ) ).to.be.true;
			expect( placeholderElement!.style.left ).to.equal( '100px' );
			expect( placeholderElement!.style.top ).to.equal( '200px' );

			aiAssistUI.hidePlaceHolder();
		} );

		it( 'should hide placeholder if no position is specified', () => {
			const placeholderElement = document.getElementById( aiAssistUI.PLACEHOLDER_TEXT_ID );

			aiAssistUI.showPlaceHolder();
			expect( placeholderElement!.classList.contains( 'show-place-holder' ) ).to.be.false;

			aiAssistUI.hidePlaceHolder();
		} );

		it( 'should hide the placeholder element', () => {
			const placeholderElement = document.getElementById( aiAssistUI.PLACEHOLDER_TEXT_ID )!;

			aiAssistUI.hidePlaceHolder();

			expect( placeholderElement.classList.contains( 'show-place-holder' ) ).to.be.false;
		} );
	} );

	describe( 'AI request loader', () => {
		it( 'should show loader at the specified position', () => {
			const rect = new DOMRect( 110, 210, 100, 20 );
			const loaderElement = document.getElementById( aiAssistUI.GPT_RESPONSE_LOADER_ID )!;

			aiAssistUI.showLoader( rect );
			expect( loaderElement.classList.contains( 'show-gpt-loader' ) ).to.be.true;
			expect( loaderElement.style.left ).to.equal( '120px' );
			expect( loaderElement.style.top ).to.equal( '220px' );
		} );

		it( 'should hide loader if no position is specified', () => {
			const loaderElement = document.getElementById( aiAssistUI.GPT_RESPONSE_LOADER_ID )!;

			aiAssistUI.showLoader();
			expect( loaderElement.classList.contains( 'show-gpt-loader' ) ).to.be.false;
		} );

		it( 'should hide the loader element', () => {
			const loaderElement = document.getElementById( aiAssistUI.GPT_RESPONSE_LOADER_ID )!;

			aiAssistUI.hideLoader();
			expect( loaderElement.classList.contains( 'show-gpt-loader' ) ).to.be.false;
		} );
	} );

	describe( 'AI request error', () => {
		it( 'should show error tooltip with the specified message', () => {
			const tooltipElement = document.getElementById( aiAssistUI.GPT_RESPONSE_ERROR_ID )!;

			const message = 'Test error message';
			aiAssistUI.showGptErrorToolTip( message );

			expect( tooltipElement.classList.contains( 'show-response-error' ) ).to.be.true;
			expect( tooltipElement.textContent ).to.equal( message );
		} );

		it( 'should hide the error tooltip element', () => {
			const tooltipElement = document.getElementById( aiAssistUI.GPT_RESPONSE_ERROR_ID )!;

			aiAssistUI.hideGptErrorToolTip();
			expect( tooltipElement.classList.contains( 'show-response-error' ) ).to.be.false;
		} );
	} );

	describe( 'applyPlaceholderToCurrentLine()', () => {
		it( 'should show placeholder for empty lines', async () => {
			editor.model.change( writer => {
				const position = editor.model.document.selection.getFirstPosition();
				const block = writer.createElement( 'paragraph' );
				writer.insertText( 'Test Element', block );
				writer.insert( block, position! );
				writer.setSelection( block, 'in' );
			} );

			await new Promise( resolve => setTimeout( resolve, 100 ) );

			editor.model.change( writer => {
				const position = editor.model.document.selection.getFirstPosition()?.parent as Element;
				writer.remove( position );
			} );

			await new Promise( resolve => setTimeout( resolve, 200 ) );
			const placeholderElement = document.getElementById( aiAssistUI.PLACEHOLDER_TEXT_ID );
			expect( placeholderElement!.classList.contains( 'show-place-holder' ) ).to.be.true;

			await new Promise( resolve => setTimeout( resolve, 500 ) );
		} );

		it( 'should hide placeholder for non-empty lines', async () => {
			editor.model.change( writer => {
				const position = editor.model.document.selection.getFirstPosition();
				const block = writer.createElement( 'paragraph' );
				writer.insertText( 'Test', block );
				writer.insert( block, position! );
				writer.setSelection( block, 'in' );
			} );

			aiAssistUI.applyPlaceholderToCurrentLine();

			await new Promise( resolve => setTimeout( resolve, 200 ) );
			const placeholderElement = document.getElementById( aiAssistUI.PLACEHOLDER_TEXT_ID );
			expect( placeholderElement!.classList.contains( 'show-place-holder' ) ).to.be.false;
		} );
	} );

	it( 'should handle inline-slash element correctly', async () => {
		const model = editor.model;
		const doc = model.document;

		// Insert an inline-slash element
		model.change( writer => {
			const position = doc.selection.getFirstPosition();
			const inlineSlashContainer = writer.createElement( 'inline-slash', { class: 'ck-slash' } );
			writer.insertText( '/', inlineSlashContainer );
			writer.insert( inlineSlashContainer, position! );
			const newPosition = writer.createPositionAt( inlineSlashContainer, 'end' );
			writer.setSelection( newPosition );
		} );

		await new Promise( resolve => setTimeout( resolve, 500 ) );

		// Check if the inline-slash element is inserted
		const inlineSlashElement = editor.model.document.selection.getFirstPosition()?.parent as Element;
		expect( inlineSlashElement.is( 'element' ) ).to.be.true;
		expect( inlineSlashElement.getAttribute( 'class' ) ).to.equal( 'ck-slash' );

		// Remove the inline-slash element
		model.change( writer => {
			if ( inlineSlashElement ) {
				writer.remove( inlineSlashElement );
			}
		} );

		await new Promise( resolve => setTimeout( resolve, 500 ) );
		// Check if the inline-slash element is removed
		expect( doc.selection.getFirstPosition()?.parent?.childCount ).to.equal( 0 );
	} );
} );
