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
            model?: AiModel;
            apiKey: string;
            temperature?: number;
            /**
             * Maximum number of tokens the AI can generate in its response.
             * Must be within the model's output token limits.
             */
            maxOutputTokens?: number;
            /**
             * Maximum number of tokens allowed in the combined prompt and context.
             * Cannot exceed the model's context window size.
             */
            maxInputTokens?: number;
            /**
             * @deprecated Use maxOutputTokens instead.
             * Will be removed in the next major version.
             */
            maxTokens?: number;
            stopSequences?: Array<string>;
            retryAttempts?: number;
            /**
             * Controls how much context is included around the cursor position.
             * Default is 75% of the model's maxInputContextTokens.
             */
            contextSize?: number;
            timeOutDuration?: number;
            endpointUrl?: string;
            promptSettings?: {
                outputFormat?: Array<string>;
                contextData?: Array<string>;
                filters?: Array<string>;
            };
            /**
             * Whether to stream the AI's response in real-time.
             * Default is true.
             */
            streamContent?: boolean;
            /**
             * Enables detailed logging of prompts and API interactions.
             * Default is false.
             */
            debugMode?: boolean;
        };
    }
}
