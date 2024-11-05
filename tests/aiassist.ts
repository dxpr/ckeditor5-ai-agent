import { expect } from 'chai';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import AiAssist from '../src/aiassist.js';
import '../src/augmentation.js';
import { TOKEN_LIMITS } from '../src/const.js';

describe( 'AiAssist', () => {
	it( 'should be named as AiAssist', () => {
		expect( AiAssist.pluginName ).to.equal( 'AiAssist' );
	} );

	describe( 'AiAssist Configuration', () => {
		let domElement: HTMLElement;
		let editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );
		} );

		afterEach( async () => {
			domElement.remove();
			try {
				await editor.destroy();
			} catch ( destroyError ) {
				console.warn( 'Error during editor destruction' );
			}
		} );

		it( 'should throw an error if apiKey is not provided', async () => {
			try {
				editor = await ClassicEditor.create( domElement, {
					plugins: [ AiAssist ],
					aiAssist: {} as any
				} );
			} catch ( error ) {
				expect( error.message ).to.equal( 'AiAssist: apiKey is required.' );
			}
		} );

		it( 'should initialize with default configuration', async () => {
			editor = await ClassicEditor.create( domElement, {
				plugins: [ AiAssist ],
				aiAssist: {
					apiKey: 'test-api-key'
				}
			} );

			const config = editor.config.get( 'aiAssist' );
			expect( config?.model ).to.equal( 'gpt-4o' );
			expect( config?.endpointUrl ).to.equal( 'https://api.openai.com/v1/chat/completions' );
			expect( config?.retryAttempts ).to.equal( 1 );
			expect( config?.maxTokens ).to.equal( TOKEN_LIMITS[ 'gpt-4o' ].max );
		} );

		it( 'should throw an error if temperature is out of range', async () => {
			try {
				editor = await ClassicEditor.create( domElement, {
					plugins: [ AiAssist ],
					aiAssist: {
						apiKey: 'test-api-key',
						temperature: 3
					}
				} );
			} catch ( error ) {
				expect( ( error as Error ).message ).to.equal( 'AiAssist: Temperature must be a number between 0 and 2.' );
			}
		} );
	} );
} );
