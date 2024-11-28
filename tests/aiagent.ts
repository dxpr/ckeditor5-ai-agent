// import { expect } from 'chai';
// import { Essentials } from '@ckeditor/ckeditor5-essentials';
// import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
// import { Heading } from '@ckeditor/ckeditor5-heading';
// import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
// import AiAgent from '../src/aiagent.js';

// describe( 'AiAgent', () => {
// 	it( 'should be named', () => {
// 		expect( AiAgent.pluginName ).to.equal( 'AiAgent' );
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
// 					AiAgent
// 				],
// 				toolbar: [
// 					'aiAgentButton'
// 				]
// 			} );
// 		} );

// 		afterEach( () => {
// 			domElement.remove();
// 			return editor.destroy();
// 		} );

// 		it( 'should load AiAgent', () => {
// 			const myPlugin = editor.plugins.get( 'AiAgent' );

// 			expect( myPlugin ).to.be.an.instanceof( AiAgent );
// 		} );

// 		it( 'should add an icon to the toolbar', () => {
// 			expect( editor.ui.componentFactory.has( 'aiAgentButton' ) ).to.equal( true );
// 		} );

// 		it( 'should add a text into the editor after clicking the icon', () => {
// 			const icon = editor.ui.componentFactory.create( 'aiAgentButton' );

// 			expect( editor.getData() ).to.equal( '' );

// 			icon.fire( 'execute' );

// 			expect( editor.getData() ).to.equal( '<p>Hello CKEditor 5!</p>' );
// 		} );
// 	} );
// } );
