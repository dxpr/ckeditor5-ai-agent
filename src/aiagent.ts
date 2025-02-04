import { Plugin } from 'ckeditor5/src/core.js';
import AiAgentUI from './aiagentui.js';
import AiAgentEditing from './aiagentediting.js';
import type { Editor } from 'ckeditor5';
import type { AiEngine, AiModel, AiAgentConfig } from './type-identifiers.js';
import { AI_CUSTOM_ENGINE, AI_CUSTOM_MODEL } from './const.js';
import { getModelTokenLimits } from './util/prompt.js';
import '../theme/style.css';
import { loadModels } from 'multi-llm-ts/dist/index.js';

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
			timeOutDuration: 45000, // Default timeout duration
			retryAttempts: 1, // Default retry attempts
			stopSequences: [], // Default stop sequences
			promptSettings: {},
			debugMode: false, // Default debug mode
			streamContent: true // Default streaming mode
		};

		let tokenLimits = {};
		const model = config.model ?? defaultConfig.model;
		if ( model && AI_CUSTOM_ENGINE.includes( config.engine as any ) ) {
			const { maxInputContextTokens } = getModelTokenLimits( model );
			tokenLimits = {
				maxOutputTokens: 16384, // Default max output tokens
				maxInputTokens: maxInputContextTokens,
				contextSize: maxInputContextTokens * 0.75
			};
		}

		// First merge defaults with user config to preserve user settings
		const mergedConfig = {
			...defaultConfig,
			...config
		};

		// Then add token limits if needed
		const updatedConfig = {
			...mergedConfig,
			...tokenLimits
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

	private async validateConfiguration( config: AiAgentConfig ): Promise<void> {
		// 1. First check if API key exists since it's required for all engines
		if ( !config.apiKey ) {
			throw new Error( 'AiAgent: apiKey is required.' );
		}

		// 2. Check engine-specific requirements
		if ( AI_CUSTOM_ENGINE.includes( config.engine as any ) ) {
			if ( !AI_CUSTOM_MODEL.includes( config.model as any ) ) {
				throw new Error( `AiAgent: model is not allowed for ${ config.engine }` );
			}

			if ( !config.endpointUrl ) {
				throw new Error( 'AiAgent: endpointUrl is required for custom engine.' );
			}
		} else if ( config.engine ) {
			try {
				const models = await loadModels( config.engine, { apiKey: config.apiKey } );
				// If models fails to load, it's likely an API key issue
				if ( !models?.chat?.length ) {
					throw new Error( `Unable to load models - please verify your ${ config.engine } API key` );
				}

				const model = models.chat.find( ( model: any ) => model.id === config.model );
				if ( !model ) {
					const modelsList = models.chat.map( model => model.id ).join( ' | ' );
					throw new Error(
						`Invalid AI model specified. Available models: ${ modelsList }`
					);
				}
			} catch ( error: any ) {
				// Prioritize API key errors
				if ( error.status === 401 || error.code === 'invalid_api_key' ||
					error.message?.toLowerCase().includes( 'api key' ) ) {
					throw new Error( `Invalid ${ config.engine } API key - please check your configuration` );
				}
				throw error; // Let other errors propagate normally
			}
		}

		// 3. Validate common settings
		if ( config.temperature && ( config.temperature < 0 || config.temperature > 2 ) ) {
			throw new Error( 'AiAgent: Temperature must be a number between 0 and 2.' );
		}

		const model = config.model ?? this.DEFAULT_GPT_MODEL;
		const { maxInputContextTokens } = getModelTokenLimits( model );
		const DEFAULT_MAX_OUTPUT_TOKENS = 16384;
		const DEFAULT_MIN_OUTPUT_TOKENS = 0;

		// Validate output tokens
		if ( config.maxOutputTokens !== undefined ) {
			if ( config.maxOutputTokens < DEFAULT_MIN_OUTPUT_TOKENS ||
				config.maxOutputTokens > DEFAULT_MAX_OUTPUT_TOKENS ) {
				throw new Error(
					`AiAgent: maxOutputTokens must be between ${ DEFAULT_MIN_OUTPUT_TOKENS } ` +
					`and ${ DEFAULT_MAX_OUTPUT_TOKENS } for ${ config.model }`
				);
			}
		}

		// Validate input tokens
		if ( config.maxInputTokens !== undefined &&
			config.maxInputTokens > maxInputContextTokens ) {
			throw new Error(
				`AiAgent: maxInputTokens cannot exceed ${ maxInputContextTokens } ` +
				`for ${ config.model }`
			);
		}
	}

	public init(): void {
		// Any additional initialization if needed
	}
}
