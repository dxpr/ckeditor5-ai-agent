import { Plugin } from 'ckeditor5/src/core.js';
import AiAssistUI from './aiassistui.js';
import AiAssistEditing from './aiassistediting.js';
import type { Editor } from 'ckeditor5';
import type { AiModel } from './type-identifiers.js';
import { TOKEN_LIMITS } from './const.js';
import '../theme/style.css';
export default class AiAssist extends Plugin {
	public DEFAULT_GPT_MODEL = 'gpt-4o' as AiModel;
	public DEFAULT_AI_END_POINT = 'https://api.openai.com/v1/chat/completions';

	constructor( editor: Editor ) {
		super( editor );

		const config = editor.config.get( 'aiAssist' ) || {};
		// Set default values and merge with provided config
		const defaultConfig = {
			model: this.DEFAULT_GPT_MODEL, // Default AI model
			openAIKey: '', // Default OpenAI key
			endpointUrl: this.DEFAULT_AI_END_POINT, // Default endpoint URL
			temperature: undefined, // Default temperature
			timeOutDuration: 20000, // Default timeout duration
			maxTokens: TOKEN_LIMITS[ this.DEFAULT_GPT_MODEL ].max, // Default max tokens
			retryAttempts: 1, // Default retry attempts
			contextSize: TOKEN_LIMITS[ this.DEFAULT_GPT_MODEL ].context * 0.75, // Default context size
			stopSequences: [], // Default stop sequences
			promptSettings: {
				outputFormat: [], // Default output format
				contextData: [], // Default context data
				filters: [] // Default filters
			},
			debugMode: false // Default debug mode
		};

		const updatedConfig = { ...defaultConfig, ...config };

		// Set the merged config back to the editor
		editor.config.set( 'aiAssist', updatedConfig );

		// Validate configuration
		this.validateConfiguration( updatedConfig );
	}

	public static get requires() {
		return [ AiAssistUI, AiAssistEditing ] as const;
	}

	public static get pluginName() {
		return 'AiAssist' as const;
	}

	private validateConfiguration( config: any ): void {
		if ( !config.openAIKey ) {
			throw new Error( 'AiAssist: openAIKey is required.' );
		}

		if ( config.temperature && ( config.temperature < 0 || config.temperature > 2 ) ) {
			throw new Error( 'AiAssist: Temperature must be a number between 0 and 2.' );
		}

		// Validate maxTokens based on the model's token limits
		const { min, max } = TOKEN_LIMITS[ config.model as AiModel ];
		if ( config.maxTokens < min || config.maxTokens > max ) {
			throw new Error( `AiAssist: maxTokens must be a number between ${ min } and ${ max }.` );
		}
	}

	public init(): void {
		// Any additional initialization if needed
	}
}
