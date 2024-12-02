export type PromptComponentKey =
	'response-rules' |
	'tone' |
	'content-structure' |
	'html-formatting' |
	'inline-content' |
	'image-handling';

export interface PromptSettings {
	overrides?: Partial<Record<PromptComponentKey, string>>;
	additions?: Partial<Record<PromptComponentKey, string>>;
}
