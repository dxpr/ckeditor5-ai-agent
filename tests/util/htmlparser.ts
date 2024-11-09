import { expect } from 'chai';
import sinon from 'sinon';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import { HtmlParser } from '../../src/util/htmlparser.js';
import '../../src/augmentation.js';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import AiAssist from '../../src/aiassist.js';

describe( 'HtmlParser', () => {
	let editor: ClassicEditor;
	let htmlParser: HtmlParser;

	beforeEach( async () => {
		const domElement = document.createElement( 'div' );
		document.body.appendChild( domElement );
		editor = await ClassicEditor.create( domElement, {
			plugins: [ AiAssist, Paragraph ],
			aiAssist: {
				apiKey: 'test-api-key'
			}
		} );
		htmlParser = new HtmlParser( editor );
	} );

	afterEach( async () => {
		await editor.destroy();
	} );

	it( 'should insert simple HTML', async () => {
		const html = '<p>Test</p>';
		const spy = sinon.spy( editor.model, 'change' );

		await htmlParser.insertSimpleHtml( html );

		expect( spy.called ).to.be.true;
		expect( editor.getData() ).to.include( 'Test' );
		spy.restore();
	} );

	it( 'should batch insert an element', async () => {
		const spy = sinon.spy( editor.model, 'change' );

		editor.model.change( writer => {
			const element = writer.createElement( 'paragraph' );
			writer.insertText( 'Batch inserted text', element );
			htmlParser.batchInsertOfElement( element );
		} );

		// Log the editor data for debugging
		expect( spy.called ).to.be.true;
		expect( editor.getData() ).to.include( '<p>Batch inserted text</p>' );
		spy.restore();
	} );

	it( 'should insert HTML as text', async () => {
		const content = document.createElement( 'div' );
		content.innerHTML = '<p>Text</p>';
		const spy = sinon.spy( editor.model, 'change' );

		await htmlParser.insertAsText( content );

		expect( spy.called ).to.be.true;
		expect( editor.getData() ).to.include( 'Text' );
		spy.restore();
	} );

	it( 'should validate complete HTML chunk', () => {
		const validHtml = '<div><p>Content</p></div>';
		const invalidHtml = '<div><p>Content</div>';

		expect( htmlParser.isCompleteHtmlChunk( validHtml ) ).to.be.true;
		expect( htmlParser.isCompleteHtmlChunk( invalidHtml ) ).to.be.false;
	} );

	it( 'should insert HTML with streaming', async () => {
		const content = document.createElement( 'div' );
		content.innerHTML = '<p>Streaming text</p>';
		const spy = sinon.spy( editor.model, 'change' );

		await htmlParser.insertAsText( content, undefined, true );

		expect( spy.called ).to.be.true;
		expect( editor.getData() ).to.include( 'Streaming text' );
		spy.restore();
	} );

	it( 'should insert element as stream', async () => {
		let element;
		editor.model.change( writer => {
			element = writer.createElement( 'paragraph' );
			writer.insertText( 'Streamed text', element );
		} );

		await new Promise( resolve => setTimeout( resolve, 100 ) );
		const spy = sinon.spy( editor.model, 'change' );

		await htmlParser.insertElementAsStream( element );

		expect( spy.called ).to.be.true;
		expect( editor.getData() ).to.include( 'Streamed text' );
		spy.restore();
	} );
} );
