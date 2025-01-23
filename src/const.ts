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

