// These are just examples of model names - actual model names come from SUPPORTED_MODELS.json
// The token limits are determined by pattern matching in prompt.ts
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

export const AI_CUSTOM_MODEL = [
	'gpt-4o',
	'o1',
	'claude-3',
	'gemini-1.5',
	'mistral-large',
	'deepseek-r1',
	'grok-beta'
] as const;

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

