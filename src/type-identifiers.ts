import type { ALL_MODERATION_FLAGS } from './const.js';

// types
export type AiModel =
    'gpt-3.5-turbo' |
    'gpt-4o' |
    'gpt-4o-mini' |
    'kavya-m1';

export interface ModelTokenLimits {
    minOutputTokens: number;
    maxOutputTokens: number;
    maxInputContextTokens: number;
}

export interface AiAgentConfig {
    model?: AiModel;
    apiKey: string;
    temperature?: number;
    maxOutputTokens?: number;
    maxInputTokens?: number;
    maxTokens?: number; // deprecated
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
