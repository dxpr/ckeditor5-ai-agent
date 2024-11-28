// types
export type AiModel =
    'gpt-3.5-turbo' |
    'gpt-4o' |
    'gpt-4o-mini' |
    'kavya-m1';

export interface MarkdownContent {
    content: string;
    url: string;
    tokenToRequest?: number;
    availableToken?: number;
}
