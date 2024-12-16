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
];
export const SHOW_ERROR_DURATION = 5000;
export const AI_AGENT_DROPDOWN_MENU = [
    {
        title: 'Edit or review',
        items: [
            {
                title: 'Improve Writing',
                command: `Fix spelling mistakes, use proper grammar and apply good writing practices.
					Do not lose the original meaning.\nYou must keep the text formatting.`
            },
            {
                title: 'Make Shorter',
                command: `Remove any repetitive, redundant, or non-essential writing in this
					content without changing the meaning or losing any key information.`
            },
            {
                title: 'Make Longer',
                command: `Improve this content by using descriptive language and inserting
					more information and more detailed explanations.\nYou must keep the text formatting.`
            },
            {
                title: 'Simplify Language',
                command: `Simplify the writing style of this content and reduce the complexity,
					so that the content is easy to understand.\nYou must keep the text formatting`
            }
        ]
    },
    {
        title: 'Generate from selection',
        items: [
            {
                title: 'Summarize',
                command: `Summarize this content into one paragraph of text. Include only the key ideas and conclusions.
					Keep it short. Do not keep original text formatting`
            },
            {
                title: 'Continue',
                command: `Start with the provided content and write at the end of it continuing this topic.
					Keep the added part short.\nYou must keep the text formatting`
            }
        ]
    }
];
