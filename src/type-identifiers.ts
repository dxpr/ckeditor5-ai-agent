import type { ALL_MODERATION_FLAGS, AI_ENGINE, AI_CUSTOM_ENGINE, AI_CUSTOM_MODEL } from './const.js';
import type { Editor } from 'ckeditor5/src/core.js';

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

type WritesPerSecond = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

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

    // Provider Fallbacks
    providers?: string;

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

    // AI Output Security - mitigates prompt injection data exfiltration (CVE-2025-32711)
    aiOutputSecurity?: {
        /** Enable/disable the entire security filter. Default: true */
        enabled?: boolean;
        /** Allowed domains for external resources. Supports wildcards (*.example.com). Default includes stock photo sites + promptahuman.com */
        allowedDomains?: string[];
        /** Block ALL external resources regardless of whitelist (images→gray pixel, links→neutralized). Default: false */
        strictMode?: boolean;
        /** Enable image filtering. Default: true */
        filterImages?: boolean;
        /** Enable link filtering. Default: true */
        filterLinks?: boolean;
    };

    commandsDropdown?: Array<{
        title: string;
        items: Array<{
            title: string;
            command: string;
        }>;
    }>;

    tonesDropdown?: Array<{
        label: string;
        tone: string;
    }>;
    contentScope?: string;
    writesPerSecond?: WritesPerSecond;
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

export interface AIApiConfig {
	apiKey: string | undefined;
	baseURL: string;
	engine: AiEngine;
	editor: Editor;
	providers?: string;
}
