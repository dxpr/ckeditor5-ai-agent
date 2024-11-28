// const
export const TOKEN_LIMITS = {
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
export const SUPPORTED_LANGUAGES = ['en', 'es', 'hi', 'nl'];
