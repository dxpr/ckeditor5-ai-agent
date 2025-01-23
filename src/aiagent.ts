import { Plugin } from 'ckeditor5/src/core.js';
import AiAgentUI from './aiagentui.js';
import AiAgentEditing from './aiagentediting.js';
import type { Editor } from 'ckeditor5';
import type { AiModel } from './type-ai-model.js';
import type { AiAgentConfig } from './type-identifiers.js';
import tokenLimits from './config/ai-model.json';

import '../theme/style.css';
export default class AiAgent extends Plugin {
	public DEFAULT_GPT_MODEL: AiModel = 'gpt-4o';
	public DEFAULT_AI_END_POINT = 'https://api.openai.com/v1/chat/completions';
	private tokenLimits: Record<AiModel, { minOutputTokens: number; maxOutputTokens: number; maxInputContextTokens: number }>;

	constructor( editor: Editor ) {
		super( editor );

		this.tokenLimits = { ...tokenLimits };
		const config = editor.config.get( 'aiAgent' ) || {};
		// Set default values and merge with provided config
		const defaultConfig = {
			model: this.DEFAULT_GPT_MODEL, // Default AI model
			apiKey: '', // Default OpenAI key
			endpointUrl: this.DEFAULT_AI_END_POINT, // Default endpoint URL
			temperature: 0.7, // Add default temperature
			timeOutDuration: 45000, // Default timeout duration
			maxOutputTokens: tokenLimits[ this.DEFAULT_GPT_MODEL ].maxOutputTokens,
			maxInputTokens: tokenLimits[ this.DEFAULT_GPT_MODEL ].maxInputContextTokens,
			retryAttempts: 1, // Default retry attempts
			contextSize: tokenLimits[ this.DEFAULT_GPT_MODEL ].maxInputContextTokens * 0.75, // Default context size
			stopSequences: [], // Default stop sequences
			promptSettings: {},
			debugMode: false, // Default debug mode
			streamContent: true // Default streaming mode
		};

		const updatedConfig = { ...defaultConfig, ...config };

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
		if ( !config.apiKey ) {
			throw new Error( 'AiAgent: apiKey is required.' );
		}

		if ( config.temperature && ( config.temperature < 0 || config.temperature > 2 ) ) {
			throw new Error( 'AiAgent: Temperature must be a number between 0 and 2.' );
		}

		const limits = this.tokenLimits[ config.model as AiModel ];

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
