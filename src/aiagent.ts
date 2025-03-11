import { Plugin } from 'ckeditor5/src/core.js';
import AiAgentUI from './aiagentui.js';
import AiAgentEditing from './aiagentediting.js';
import type { Editor } from 'ckeditor5';
import type { AiEngine, AiModel, AiAgentConfig } from './type-identifiers.js';
import { AI_CUSTOM_ENGINE, AI_CUSTOM_MODEL } from './const.js';
import { getModelTokenLimits } from './util/prompt.js';
import '../theme/style.css';

export default class AiAgent extends Plugin {
	public DEFAULT_GPT_ENGINE = 'openai' as AiEngine;
	public DEFAULT_GPT_MODEL = 'gpt-4o' as AiModel;
	public override isEnabled: boolean = false;

	constructor( editor: Editor ) {
		super( editor );

		const config = editor.config.get( 'aiAgent' ) as AiAgentConfig || {};

		// Check if plugin is enabled based on presence of API key
		this.isEnabled = Boolean( config.apiKey );

		// Set default values and merge with provided config
		const defaultConfig = {
			engine: this.DEFAULT_GPT_ENGINE, // Default AI model
			model: this.DEFAULT_GPT_MODEL, // Default AI model
			apiKey: '', // Default OpenAI key
			endpointUrl: '', // Default endpoint URL
			timeOutDuration: 120000, // Default timeout duration
			retryAttempts: 1, // Default retry attempts
			stopSequences: [], // Default stop sequences
			promptSettings: {},
			debugMode: false, // Default debug mode
			streamContent: true // Default streaming mode
		};

		// Set default endpoint URL for DXAI engine
		if ( config.engine === 'dxai' ) {
			if ( !config.endpointUrl ) {
				config.endpointUrl = 'https://kavya.dxpr.com/v1/chat/completions';
			}
			if ( !config.model ) {
				config.model = 'kavya-m1';
			}
		}

		let tokenLimits = {};
		const model = config.model ?? defaultConfig.model;
		if ( model && AI_CUSTOM_ENGINE.includes( config.engine as any ) && config.engine !== 'dxai' ) {
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

		// Only validate configuration if plugin is enabled
		if ( this.isEnabled ) {
			this.validateConfiguration( updatedConfig );
		}
	}

	public static get requires() {
		return [ AiAgentUI, AiAgentEditing ] as const;
	}

	public static get pluginName() {
		return 'AiAgent' as const;
	}

	private async validateConfiguration( config: AiAgentConfig ): Promise<void> {
		// Skip validation if plugin is disabled
		if ( !this.isEnabled ) {
			return;
		}

		// Only validate engine-specific requirements and other settings
		// since API key presence was already validated in constructor
		if ( AI_CUSTOM_ENGINE.includes( config.engine as any ) ) {
			// TODO: Chooses models to support in production
			if ( !AI_CUSTOM_MODEL.includes( config.model as any ) ) {
			// 	throw new Error( `AiAgent: model is not allowed for ${ config.engine }` );
			}

			if ( !config.endpointUrl ) {
				throw new Error( 'AiAgent: endpointUrl is required for custom engine.' );
			}

			// Validate providers is only used with dxai engine
			if ( config.providers && config.engine !== 'dxai' ) {
				throw new Error( 'AiAgent: providers is only supported with the dxai engine.' );
			}
		} else if ( config.providers ) {
			// If engine is not dxai but providers is set, throw an error
			throw new Error( 'AiAgent: providers is only supported with the dxai engine.' );
		}

		// Validate common settings
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
