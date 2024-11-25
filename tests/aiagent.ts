// import { expect } from 'chai';
// import { Essentials } from '@ckeditor/ckeditor5-essentials';
// import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
// import { Heading } from '@ckeditor/ckeditor5-heading';
// import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
// import AiAssist from '../src/aiassist.js';

// describe( 'AiAssist', () => {
// 	it( 'should be named', () => {
// 		expect( AiAssist.pluginName ).to.equal( 'AiAssist' );
// 	} );

// 	describe( 'init()', () => {
// 		let domElement: HTMLElement, editor: ClassicEditor;

// 		beforeEach( async () => {
// 			domElement = document.createElement( 'div' );
// 			document.body.appendChild( domElement );

// 			editor = await ClassicEditor.create( domElement, {
// 				plugins: [
// 					Paragraph,
// 					Heading,
// 					Essentials,
// 					AiAssist
// 				],
// 				toolbar: [
// 					'aiAssistButton'
// 				]
// 			} );
// 		} );

// 		afterEach( () => {
// 			domElement.remove();
// 			return editor.destroy();
// 		} );

// 		it( 'should load AiAssist', () => {
// 			const myPlugin = editor.plugins.get( 'AiAssist' );

// 			expect( myPlugin ).to.be.an.instanceof( AiAssist );
// 		} );

// 		it( 'should add an icon to the toolbar', () => {
// 			expect( editor.ui.componentFactory.has( 'aiAssistButton' ) ).to.equal( true );
// 		} );

// 		it( 'should add a text into the editor after clicking the icon', () => {
// 			const icon = editor.ui.componentFactory.create( 'aiAssistButton' );

// 			expect( editor.getData() ).to.equal( '' );

// 			icon.fire( 'execute' );

// 			expect( editor.getData() ).to.equal( '<p>Hello CKEditor 5!</p>' );
// 		} );
// 	} );
// } );
