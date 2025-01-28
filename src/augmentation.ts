import type AiAgentCommand from './aiagentcommand.js';
import type AiAgentEditing from './aiagentediting.js';
import type AiAgentUI from './aiagentui.js';
import type { AiAgent } from './index.js';
import type { AiAgentConfig } from './type-identifiers.js';

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
        aiAgent?: AiAgentConfig;
    }
}
