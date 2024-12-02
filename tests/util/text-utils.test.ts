import { expect } from 'chai';
import {
	removeLeadingSpaces,
	extractEditorContent
} from '../../src/util/text-utils.js';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';

describe( 'text-utils', () => {
	describe( 'removeLeadingSpaces', () => {
		it( 'should remove leading spaces from text', () => {
			const input = '    test text';
			expect( removeLeadingSpaces( input ) ).to.equal( 'test text' );
		} );
	} );

	describe( 'extractEditorContent', () => {
		let domElement: HTMLElement, editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				plugins: [
					Paragraph
				]
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should extract content with correct size', () => {
			const input = 'This is a test sentence. Another sentence here.';
			const result = extractEditorContent( input, 20, undefined, editor );
			expect( result.length ).to.be.lessThanOrEqual( 20 * 4 );
		} );
	} );
} );
