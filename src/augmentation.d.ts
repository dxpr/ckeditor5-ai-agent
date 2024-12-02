import type AiAgentCommand from './aiagentcommand.js';
import type AiAgentEditing from './aiagentediting.js';
import type AiAgentUI from './aiagentui.js';
import type { AiAgent } from './index.js';
import type { AiModel } from './type-identifiers.js';
import type { PromptSettings } from './types/prompt-settings.js';
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
            temperature?: number;
            maxOutputTokens?: number;
            maxInputTokens?: number;
            maxTokens?: number;
            stopSequences?: Array<string>;
            retryAttempts?: number;
            contextSize?: number;
            timeOutDuration?: number;
            endpointUrl?: string;
            promptSettings?: PromptSettings;
            streamContent?: boolean;
            debugMode?: boolean;
        };
    }
}
