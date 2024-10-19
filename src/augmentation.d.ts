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
            model?: AiModel;
            apiKey: string;
            temperature?: number;
            maxTokens?: number;
            stopSequences?: Array<string>;
            retryAttempts?: number;
            contextSize?: number;
            timeOutDuration?: number;
            endpointUrl?: string;
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
