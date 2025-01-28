import type { ALL_MODERATION_FLAGS, AI_ENGINE, AI_CUSTOM_ENGINE, AI_CUSTOM_MODEL } from './const.js';

export type AiEngine = typeof AI_ENGINE[number] | typeof AI_CUSTOM_ENGINE[number];
export type AiModel = typeof AI_CUSTOM_MODEL[number];

export type PromptComponentKey =
    | 'responseRules'
    | 'htmlFormatting'
    | 'contentStructure'
    | 'tone'
    | 'inlineContent'
    | 'imageHandling'
    | 'referenceGuidelines'
    | 'contextRequirements';

export interface PromptSettings {
    overrides?: Partial<Record<PromptComponentKey, string>>;
    additions?: Partial<Record<PromptComponentKey, string>>;
}
export interface ModelTokenLimits {
    minOutputTokens: number;
    maxOutputTokens: number;
    maxInputContextTokens: number;
}

export interface AiAgentConfig {
    engine?: AiEngine;
    model?: string;
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

    // Moderation Settings
    moderationKey?: string;
    moderationEnable?: boolean;
    moderationDisableFlags?: Array<ModerationFlagsTypes>;

    commandsDropdown?: Array<{
        title: string;
        items: Array<{
            title: string;
            command: string;
        }>;
    }>;
    contentScope?: string;
}

export interface MarkdownContent {
    content: string;
    url: string;
    tokenCount?: number;
}

export type ModerationFlagsTypes = typeof ALL_MODERATION_FLAGS[number];

export interface ModerationResponse {
	results: Array<{
		flagged: boolean;
		categories: Record<ModerationFlagsTypes, boolean>;
		// eslint-disable-next-line camelcase
		category_scores: Record<ModerationFlagsTypes, number>;
	}>;
}
