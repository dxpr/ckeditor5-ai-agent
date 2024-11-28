// const
export const TOKEN_LIMITS = {
    'gpt-3.5-turbo': { min: 1, max: 4096, context: 16385 },
    'gpt-4o': { min: 0, max: 16384, context: 128000 },
    'gpt-4o-mini': { min: 1, max: 16384, context: 128000 },
    'kavya-m1': { min: 0, max: 16384, context: 128000 }
};
export const SUPPORTED_LANGUAGES = ['en', 'es', 'hi', 'nl'];
