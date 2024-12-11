import type AiAgentCommand from './aiagentcommand.js';
import type AiAgentEditing from './aiagentediting.js';
import type AiAgentUI from './aiagentui.js';
import type { AiAgent } from './index.js';
import type { AiModel, PromptSettings, ModerationFlagsTypes } from './type-identifiers.js';

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
            model?: AiModel;
            apiKey: string;

            // Temperature Setting
            temperature?: number;

            // Token Configuration
            maxOutputTokens?: number;
            maxInputTokens?: number;
            maxTokens?: number;

            // Sequence Control
            stopSequences?: Array<string>;
            retryAttempts?: number;

            // Context Configuration
            contextSize?: number;
            timeOutDuration?: number;
            endpointUrl?: string;

            // Prompt Settings
            promptSettings?: PromptSettings;

            // Behavior Settings
            streamContent?: boolean;
            debugMode?: boolean;
            showErrorDuration?: number;
            moderation?: {
                key: string;
                enable: boolean;
                disableFlags?: Array<ModerationFlagsTypes>;
            };
        };
    }
}
