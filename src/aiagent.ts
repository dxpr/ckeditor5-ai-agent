import { Plugin } from 'ckeditor5/src/core.js';
import AiAgentUI from './aiagentui.js';
import AiAgentEditing from './aiagentediting.js';
import type { Editor } from 'ckeditor5';
import type { AiEngine, AiModel, AiAgentConfig } from './type-identifiers.js';
import { TOKEN_LIMITS, AI_CUSTOM_ENGINE, AI_CUSTOM_MODEL } from './const.js';
import '../theme/style.css';
export default class AiAgent extends Plugin {
	public DEFAULT_GPT_ENGINE = 'openai' as AiEngine;
	public DEFAULT_GPT_MODEL = 'gpt-4o' as AiModel;

	constructor( editor: Editor ) {
		super( editor );

		const config = editor.config.get( 'aiAgent' ) as AiAgentConfig || {};
		// Set default values and merge with provided config
		const defaultConfig = {
			engine: this.DEFAULT_GPT_ENGINE, // Default AI model
			model: this.DEFAULT_GPT_MODEL, // Default AI model
			apiKey: '', // Default OpenAI key
			endpointUrl: '', // Default endpoint URL
			temperature: 0.7, // Add default temperature
			timeOutDuration: 45000, // Default timeout duration
			retryAttempts: 1, // Default retry attempts
			stopSequences: [], // Default stop sequences
			promptSettings: {},
			debugMode: false, // Default debug mode
			streamContent: true // Default streaming mode
		};

		let tokenLimits = {};
		if ( config.model && AI_CUSTOM_ENGINE.includes( config.engine as any ) ) {
			const maxOutputTokens = TOKEN_LIMITS[ config.model as keyof typeof TOKEN_LIMITS ]?.maxOutputTokens ?? 0;
			const maxInputTokens = TOKEN_LIMITS[ config.model as keyof typeof TOKEN_LIMITS ]?.maxOutputTokens ?? 0;
			tokenLimits = {
				maxOutputTokens,
				maxInputTokens,
				contextSize: maxInputTokens * 0.75
			};
		}
		const updatedConfig = {
			...defaultConfig,
			...tokenLimits,
			...config
		};

		// Set the merged config back to the editor
		editor.config.set( 'aiAgent', updatedConfig );

		// Validate configuration
		this.validateConfiguration( updatedConfig );
	}

	public static get requires() {
		return [ AiAgentUI, AiAgentEditing ] as const;
	}

	public static get pluginName() {
		return 'AiAgent' as const;
	}

	private validateConfiguration( config: AiAgentConfig ): void {
		if ( AI_CUSTOM_ENGINE.includes( config.engine as any ) ) {
			if ( !AI_CUSTOM_MODEL.includes( config.model as any ) ) {
				throw new Error( `AiAgent: model is not allowed for ${ config.engine }` );
			}

			if ( !config.endpointUrl ) {
				throw new Error( 'AiAgent: endpointUrl is required for custom engine.' );
			}
		}

		if ( !config.apiKey ) {
			throw new Error( 'AiAgent: apiKey is required.' );
		}

		if ( config.temperature && ( config.temperature < 0 || config.temperature > 2 ) ) {
			throw new Error( 'AiAgent: Temperature must be a number between 0 and 2.' );
		}

		const limits = TOKEN_LIMITS[ config.model as AiModel ];

		// Validate output tokens
		if ( config.maxOutputTokens !== undefined ) {
			if ( config.maxOutputTokens < limits.minOutputTokens ||
				config.maxOutputTokens > limits.maxOutputTokens ) {
				throw new Error(
					`AiAgent: maxOutputTokens must be between ${ limits.minOutputTokens } ` +
					`and ${ limits.maxOutputTokens } for ${ config.model }`
				);
			}
		}

		// Validate input tokens
		if ( config.maxInputTokens !== undefined &&
			config.maxInputTokens > limits.maxInputContextTokens ) {
			throw new Error(
				`AiAgent: maxInputTokens cannot exceed ${ limits.maxInputContextTokens } ` +
				`for ${ config.model }`
			);
		}
	}

	public init(): void {
		// Any additional initialization if needed
	}
}
