// types
import type { Command } from 'ckeditor5';
import type { PromptSettings } from './types/prompt-settings.js';

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
    promptSettings?: PromptSettings;
    streamContent?: boolean;
    debugMode?: boolean;
}

export interface MarkdownContent {
    content: string;
    url: string;
    tokenCount?: number;
}

export interface AiAgentEditingPlugin extends Plugin {
    getCommand(): Command;
}
