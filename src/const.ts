import type { AiModel, ModelTokenLimits } from './type-identifiers.js';

// const
export const TOKEN_LIMITS: Record<AiModel, ModelTokenLimits> = {
	'gpt-3.5-turbo': {
		minOutputTokens: 1,
		maxOutputTokens: 4096,
		maxInputContextTokens: 16385
	},
	'gpt-4o': {
		minOutputTokens: 0,
		maxOutputTokens: 16384,
		maxInputContextTokens: 128000
	},
	'gpt-4o-mini': {
		minOutputTokens: 1,
		maxOutputTokens: 16384,
		maxInputContextTokens: 128000
	},
	'kavya-m1': {
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
