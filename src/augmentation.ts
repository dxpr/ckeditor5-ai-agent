import type AiAssistCommand from './aiassistcommand.js';
import type AiAssistEditing from './aiassistediting.js';
import type AiAssistUI from './aiassistui.js';
import type { AiAssist } from './index.js';
import type { AiModel } from './type-identifiers.js';

declare module '@ckeditor/ckeditor5-core' {
	interface CommandsMap {
        aiAssist: AiAssistCommand;
    }

    interface PluginsMap {
        AiAssist: AiAssist;
        AiAssistUI: AiAssistUI;
        AiAssistEditing: AiAssistEditing;
    }

	interface Plugins {
        AiAssist: AiAssist;
    }

	interface EditorConfig {
        aiAssist?: {
            model?: AiModel; // AI Model Selection
            openAIKey: string; // OPEN AI Key
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
            streamingEnabled?: boolean;
            debugMode?: boolean;
        };
    }
}
