import { expect } from 'chai';
import { getAvailableTones, getToneForKey } from '../../src/util/tones.js';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';

describe( 'tones', () => {
	let domElement: HTMLElement, editor: ClassicEditor;

	const tonesDropdown = [
		{ label: 'Brand Voice', tone: 'Write like our brand.', tid: 18 },
		{ label: 'Professional', tone: 'Use clear, concise language.', tid: 10 }
	];

	async function createEditor( aiAgent: Record<string, unknown> ): Promise<void> {
		editor = await ClassicEditor.create( domElement, {
			plugins: [ Paragraph ],
			aiAgent
		} as any );
	}

	beforeEach( () => {
		domElement = document.createElement( 'div' );
		document.body.appendChild( domElement );
	} );

	afterEach( () => {
		domElement.remove();
		return editor.destroy();
	} );

	describe( 'getAvailableTones', () => {
		it( 'should keep a plain "Default tone" entry without a default tone', async () => {
			await createEditor( { tonesDropdown } );
			const tones = getAvailableTones( editor );

			expect( tones.map( item => item.key ) ).to.deep.equal( [ 'default_tone', '18', '10' ] );
			expect( tones[ 0 ].label ).to.equal( 'Default tone' );
			expect( tones[ 0 ].tone ).to.equal( '' );
		} );

		it( 'should name and use the default tone matched by term ID', async () => {
			await createEditor( { tonesDropdown, defaultToneOfVoice: 18 } );
			const tones = getAvailableTones( editor );

			expect( tones[ 0 ].key ).to.equal( 'default_tone' );
			expect( tones[ 0 ].label ).to.equal( 'Default tone (Brand Voice)' );
			expect( tones[ 0 ].tone ).to.equal( 'Write like our brand.' );
		} );

		it( 'should match a default tone by label key without term IDs', async () => {
			await createEditor( {
				tonesDropdown: [ { label: 'Brand Voice', tone: 'Write like our brand.' } ],
				defaultToneOfVoice: 'brand_voice'
			} );

			expect( getAvailableTones( editor )[ 0 ].tone ).to.equal( 'Write like our brand.' );
		} );

		it( 'should match a built-in tone without tonesDropdown', async () => {
			await createEditor( { defaultToneOfVoice: 'professional' } );

			expect( getAvailableTones( editor )[ 0 ].label ).to.equal( 'Default tone (Professional)' );
		} );

		it( 'should ignore a default tone that is not in the menu', async () => {
			await createEditor( { tonesDropdown, defaultToneOfVoice: 999 } );
			const tones = getAvailableTones( editor );

			expect( tones[ 0 ].label ).to.equal( 'Default tone' );
			expect( tones[ 0 ].tone ).to.equal( '' );
		} );
	} );

	describe( 'getToneForKey', () => {
		it( 'should use the default tone when no tone was picked', async () => {
			await createEditor( { tonesDropdown, defaultToneOfVoice: '18' } );

			expect( getToneForKey( editor, null ) ).to.equal( 'Write like our brand.' );
			expect( getToneForKey( editor, 'default_tone' ) ).to.equal( 'Write like our brand.' );
		} );

		it( 'should prefer the tone the user picked', async () => {
			await createEditor( { tonesDropdown, defaultToneOfVoice: 18 } );

			expect( getToneForKey( editor, '10' ) ).to.equal( 'Use clear, concise language.' );
		} );

		it( 'should return an empty tone without a default tone and null for unknown keys', async () => {
			await createEditor( { tonesDropdown } );

			expect( getToneForKey( editor, null ) ).to.equal( '' );
			expect( getToneForKey( editor, 'removed_tone' ) ).to.equal( null );
		} );
	} );
} );
