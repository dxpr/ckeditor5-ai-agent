import type { ModelTokenLimits, AiModel } from './type-identifiers.js';

export const AI_ENGINE = [
	'anthropic',
	'cerebras',
	'deepseek',
	'google',
	'groq',
	'mistralai',
	'ollama',
	'openai',
	'openrouter',
	'xai'
] as const;

export const AI_CUSTOM_ENGINE = [ 'kavya' ] as const;

export const AI_CUSTOM_MODEL = [ 'gpt-4o' ] as const;

export const TOKEN_LIMITS: Record<AiModel, ModelTokenLimits> = {
	'gpt-4o': {
		minOutputTokens: 0,
		maxOutputTokens: 16384,
		maxInputContextTokens: 128000
	}
};

export const SUPPORTED_LANGUAGES = [ 'en', 'es', 'hi', 'nl' ];

export const MODERATION_URL = 'https://api.openai.com/v1/moderations';

export const ALL_MODERATION_FLAGS = [
	'harassment',
	'harassment/threatening',
	'hate',
	'hate/threatening',
	'self-harm',
	'self-harm/instructions',
	'self-harm/intent',
	'sexual',
	'sexual/minors',
	'violence',
	'violence/graphic'
] as const;

export const SHOW_ERROR_DURATION = 5000;

