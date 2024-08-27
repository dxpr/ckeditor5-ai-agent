import type { AiAssist } from './index.js';
import type { AiModel } from './type-identifiers.js';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ AiAssist.pluginName ]: AiAssist;
	}

	interface Plugins {
        AiAssist: AiAssist;
    }

	interface EditorConfig {
        aiAssist?: {
            model?: AiModel; // AI Model Selection
            temperature?: number; // Temperature Setting
            maxTokens?: number; // Max Tokens
            stopSequences?: Array<string>; // Stop Sequences
            retryAttempts?: number; // Retry Attempts
            timeOutDuration?: number; // Time-Out Duration in milliseconds
            endpointUrl?: string; // Endpoint URL
            prompt?: Array<string>;
        };
    }
}
