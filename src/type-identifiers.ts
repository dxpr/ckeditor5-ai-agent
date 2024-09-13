// types
export type AiModel =
    'gpt-3' |
    'gpt-3.5-turbo' |
    'gpt-4' |
    'gpt-4-turbo' |
    'gpt-4o' |
    'gpt-4o-mini';

export interface MarkdownContent {
    content: string;
    url: string;
    tokenInResponse?: number;
    availableToken?: number;
}
