import { expect } from 'chai';
import {
	removeLeadingSpaces,
	extractEditorContent
} from '../../src/util/text-utils.js';

describe( 'text-utils', () => {
	describe( 'removeLeadingSpaces', () => {
		it( 'should remove leading spaces from text', () => {
			const input = '    test text';
			expect( removeLeadingSpaces( input ) ).to.equal( 'test text' );
		} );
	} );

	describe( 'extractEditorContent', () => {
		it( 'should extract content with correct size', () => {
			const input = 'This is a test sentence. Another sentence here.';
			const result = extractEditorContent( input, 20 );
			expect( result.length ).to.be.lessThanOrEqual( 20 * 4 );
		} );
	} );
} );
