import type AiAgentCommand from './aiagentcommand.js';
import type AiAgentEditing from './aiagentediting.js';
import type AiAgentUI from './aiagentui.js';
import type { AiAgent } from './index.js';
import type { AiModel } from './type-identifiers.js';

declare module '@ckeditor/ckeditor5-core' {
	interface CommandsMap {
        aiAgent: AiAgentCommand;
    }

    interface PluginsMap {
        AiAgent: AiAgent;
        AiAgentUI: AiAgentUI;
        AiAgentEditing: AiAgentEditing;
    }

	interface Plugins {
        AiAgent: AiAgent;
    }

	interface EditorConfig {
        aiAgent?: {
            model?: AiModel; // AI Model Selection
            apiKey: string; // OPEN AI Key
            temperature?: number; // Temperature Setting
            maxTokens?: number; // Max Tokens
            stopSequences?: Array<string>; // Stop Sequences
            retryAttempts?: number; // Retry Attempts
            contextSize?: number; // max content to includes as content
            timeOutDuration?: number; // Time-Out Duration in milliseconds
            endpointUrl?: string; // Endpoint URL
            promptSettings?: {
                outputFormat?: Array<string>;
                contextData?: Array<string>;
                filters?: Array<string>;
            };
            streamContent?: boolean;
            debugMode?: boolean;
        };
    }
}
