import { expect } from 'chai';
import '../src/augmentation.js';
import { TOKEN_LIMITS } from '../src/const.js';
import AiAssist from '../src/aiassist.js';
import { ClassicEditor, Paragraph } from 'ckeditor5/src/index.js';

describe( 'AiAssist', () => {
	it( 'should be named AiAssist', () => {
		expect( AiAssist.pluginName ).to.equal( 'AiAssist' );
	} );

	describe( 'init()', () => {
		let domElement: HTMLElement, editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				plugins: [
					Paragraph,
					AiAssist
				],
				toolbar: [
					'aiAssistButton'
				],
				aiAssist: {
					apiKey: 'test-api-key'
				}
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should load AiAssist', () => {
			const myPlugin = editor.plugins.get( 'AiAssist' );

			expect( myPlugin ).to.be.an.instanceof( AiAssist );
		} );

		it( 'should add an icon to the toolbar', () => {
			expect( editor.ui.componentFactory.has( 'aiAssistButton' ) ).to.equal( true );
		} );

		it( 'should initialize with default configuration', async () => {
			const config = editor.config.get( 'aiAssist' );
			expect( config?.model ).to.equal( 'gpt-4o' );
			expect( config?.endpointUrl ).to.equal( 'https://api.openai.com/v1/chat/completions' );
			expect( config?.retryAttempts ).to.equal( 1 );
			expect( config?.maxTokens ).to.equal( TOKEN_LIMITS[ 'gpt-4o' ].max );
			expect( config?.contextSize ).to.equal( TOKEN_LIMITS[ 'gpt-4o' ].context * 0.75 );
		} );
	} );

	describe( 'AiAssist - Successful Initialization Tests', () => {
		let domElement: HTMLElement, editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				plugins: [
					Paragraph,
					Heading,
					Essentials,
					AiAssist
				],
				toolbar: [
					'aiAssistButton'
				],
				aiAssist: {
					apiKey: 'api-key',
					model: 'gpt-4o',
					temperature: 1,
					maxTokens: TOKEN_LIMITS[ 'gpt-4o' ].max,
					contextSize: TOKEN_LIMITS[ 'gpt-4o' ].context * 0.75,
					stopSequences: [],
					promptSettings: {
						outputFormat: [],
						contextData: [],
						filters: []
					},
					debugMode: false,
					streamContent: true
				}
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should initialize with provided configuration', () => {
			const expectedConfig = {
				model: 'gpt-4o',
				apiKey: 'api-key',
				endpointUrl: 'https://api.openai.com/v1/chat/completions',
				temperature: 1,
				timeOutDuration: 45000,
				maxTokens: TOKEN_LIMITS[ 'gpt-4o' ].max,
				retryAttempts: 1,
				contextSize: TOKEN_LIMITS[ 'gpt-4o' ].context * 0.75,
				stopSequences: [],
				promptSettings: {
					outputFormat: [],
					contextData: [],
					filters: []
				},
				debugMode: false,
				streamContent: true
			};

			expect( editor.config.get( 'aiAssist' ) ).to.deep.equal( expectedConfig );
		} );
	} );

	describe( 'AiAssist Configuration', () => {
		let domElement: HTMLElement;
		let editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );
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
