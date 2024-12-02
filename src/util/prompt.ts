import type { Editor } from 'ckeditor5/src/core.js';
import type { MarkdownContent } from '../type-identifiers.js';
import { aiAgentContext } from '../aiagentcontext.js';
import { removeLeadingSpaces, extractEditorContent } from './text-utils.js';
import { countTokens, trimLLMContentByTokens } from './token-utils.js';
import { getAllowedHtmlTags } from './html-utils.js';
import { fetchUrlContent } from './url-utils.js';
import type { PromptSettings, PromptComponentKey } from '../types/prompt-settings.js';

export class PromptHelper {
	private editor: Editor;
	private contextSize: number;
	private promptSettings: PromptSettings;
	private debugMode: boolean;
	private editorContextRatio: number;

	constructor(editor: Editor, options: { editorContextRatio?: number } = {}) {
		this.editor = editor;
		const config = editor.config.get('aiAgent')!;

		this.contextSize = config.contextSize ?? 4000;
		this.promptSettings = {
			overrides: {},
			additions: {},
			...config.promptSettings
		};
		this.debugMode = config.debugMode ?? false;
		this.editorContextRatio = options.editorContextRatio ?? 0.3;
	}

	private getDefaultPromptComponents(): Record<PromptComponentKey, string> {
		return {
			'response-rules': `Core Response Generation Rules:
				1. Replace "@@@cursor@@@" with contextually appropriate content
				2. Maintain consistency with the surrounding text's tone and style
				3. Ensure the response flows naturally with the existing content
				4. Avoid repeating context verbatim
				5. Generate original content that adds value
				6. Follow the specified language requirements
				7. Adhere to all HTML formatting rules`,
			'tone': `Language and Tone Guidelines:
				1. Match the formality level of the surrounding content
				2. Maintain consistent voice throughout the response
				3. Use appropriate technical terminology when relevant
				4. Ensure proper grammar and punctuation
				5. Avoid overly complex sentence structures
				6. Keep the tone engaging and reader-friendly
				7. Adapt style based on content type`,
			'content-structure': `Content Structure Rules:
				1. Organize information logically
				2. Use appropriate paragraph breaks
				3. Maintain consistent formatting
				4. Follow document hierarchy
				5. Use appropriate list structures when needed
				6. Ensure proper content flow
				7. Respect existing document structure`,
			'html-formatting': `HTML Formatting Requirements:
				1. Generate valid HTML snippets only
				2. Use only allowed HTML tags
				3. Ensure proper tag nesting
				4. Avoid empty elements
				5. Use semantic HTML where appropriate
				6. First word must be a valid HTML tag`,
			'inline-content': `Inline Content Specific Rules:
				1. Determine content type (list, table, or inline)
				2. Format according to content type
				3. Ensure seamless integration
				4. Maintain proper nesting`,
			'image-handling': `Image Element Requirements:
				1. Every <img> must have src and alt attributes
				2. Format src URLs as: https://placehold.co/600x400?text=[alt_text]
				3. Alt text must be descriptive and meaningful`
		};
	}

	public getSystemPrompt(isInlineResponse: boolean = false): string {
		const defaultComponents = this.getDefaultPromptComponents();
		const corpus: Array<string> = [];

		// Process each component
		for (const [id, defaultContent] of Object.entries(defaultComponents)) {
			const componentId = id as PromptComponentKey;
			let content = defaultContent;

			// Apply overrides if they exist
			if (this.promptSettings.overrides?.[componentId]) {
				content = this.promptSettings.overrides[componentId]!;
			}

			// Apply additions if they exist
			if (this.promptSettings.additions?.[componentId]) {
				content += '\n' + this.promptSettings.additions[componentId];
			}

			corpus.push(content);
		}

		// Only include inline-content rules if isInlineResponse is true
		if (!isInlineResponse) {
			corpus.splice(corpus.indexOf(defaultComponents['inline-content']), 1);
		}

		const systemPrompt = corpus.join('\n\n');

		if (this.debugMode) {
			console.group('AiAgent System Prompt Debug');
			console.log('System Prompt:', systemPrompt);
			console.groupEnd();
		}

		return systemPrompt;
	}

	public trimContext(prompt: string, promptContainerText: string = ''): string {
		let contentBeforePrompt = '';
		let contentAfterPrompt = '';
		const splitText = promptContainerText ?? prompt;
		const view = this.editor?.editing?.view?.domRoots?.get('main');
		const context = view?.innerText ?? '';

		const matchIndex = context.indexOf(splitText);
		const nextEnterIndex = context.indexOf('\n', matchIndex);
		const firstNewlineIndex = nextEnterIndex !== -1 ? nextEnterIndex : matchIndex + splitText.length;
		const beforeNewline = context.substring(0, firstNewlineIndex);
		const afterNewline = context.substring(firstNewlineIndex + 1);
		const contextParts = [beforeNewline, afterNewline];

		const allocatedEditorContextToken = Math.floor(this.contextSize * this.editorContextRatio);
		if (contextParts.length > 1) {
			if (contextParts[0].length < contextParts[1].length) {
				contentBeforePrompt = extractEditorContent(
					contextParts[0],
					allocatedEditorContextToken / 2,
					true,
					this.editor
				);
				contentAfterPrompt = extractEditorContent(
					contextParts[1],
					allocatedEditorContextToken - contentBeforePrompt.length / 4,
					false,
					this.editor
				);
			} else {
				contentAfterPrompt = extractEditorContent(
					contextParts[1],
					allocatedEditorContextToken / 2,
					false,
					this.editor
				);
				contentBeforePrompt = extractEditorContent(
					contextParts[0],
					allocatedEditorContextToken - contentAfterPrompt.length / 4,
					true,
					this.editor
				);
			}
		}

		// Combine the trimmed context with the cursor placeholder
		const escapedPrompt = prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
		contentBeforePrompt = contentBeforePrompt.trim().replace(new RegExp(escapedPrompt.slice(1)), '@@@cursor@@@');
		const trimmedContext = `${contentBeforePrompt}\n${contentAfterPrompt}`;
		return trimmedContext.trim();
	}

	public formatFinalPrompt(
		request: string,
		context: string,
		markDownContents: Array<MarkdownContent>,
		isEditorEmpty: boolean
	): string {
		const corpus: Array<string> = [];
		const contentLanguageCode = this.editor.locale.contentLanguage;

		// Task Section
		corpus.push('TASK:\n');
		corpus.push(request);

		// Context Section
		if (context?.length) {
			corpus.push('\nCONTEXT:\n');
			corpus.push(context);
		}

		// Markdown Content Section
		if (markDownContents?.length) {
			corpus.push('\nREFERENCE CONTENT:\n');
			for (const content of markDownContents) {
				corpus.push(`Source: ${content.url}\n${content.content}\n`);
			}
		}

		// Instructions Section
		corpus.push('\nINSTRUCTIONS:\n');
		corpus.push(`The response must follow the language code - ${contentLanguageCode}.`);

		// Context-Specific Instructions
		if (!isEditorEmpty) {
			corpus.push(`
				Context Integration Requirements:
				1. Maintain seamless connection with surrounding text
				2. Ensure smooth and natural transitions
				3. Do not modify original text except @@@cursor@@@ replacement
				4. Match existing style and tone
				5. Preserve document structure
			`);
		}

		// Debug Output
		if (this.debugMode) {
			console.group('AiAgent Final Prompt Debug');
			console.log('Final Prompt:', corpus.join('\n'));
			console.groupEnd();
		}

		return corpus.map(text => removeLeadingSpaces(text)).join('\n');
	}

	public async generateMarkDownForUrls(urls: Array<string>): Promise<Array<MarkdownContent>> {
		try {
			const markdownContents: Array<MarkdownContent> = [];

			for (const url of urls) {
				try {
					const content = await fetchUrlContent(url);
					if (content) {
						markdownContents.push({
							content,
							url,
							tokenCount: countTokens(content)
						});
					}
				} catch (error) {
					if (this.debugMode) {
						console.error(`Failed to fetch content from ${url}:`, error);
					}
					aiAgentContext.showError(`Failed to fetch content from ${url}`);
				}
			}

			return this.allocateTokensToFetchedContent(
				this.getSystemPrompt(),
				markdownContents
			);
		} catch (error) {
			if (this.debugMode) {
				console.error('Error generating markdown content:', error);
			}
			aiAgentContext.showError('Failed to generate markdown content');
			return [];
		}
	}

	public allocateTokensToFetchedContent(
		prompt: string,
		fetchedContent: Array<MarkdownContent>
	): Array<MarkdownContent> {
		const editorContent = this.editor?.editing?.view?.domRoots?.get('main')?.innerText ?? '';
		const editorToken = Math.min(
			Math.floor(this.contextSize * this.editorContextRatio),
			countTokens(editorContent)
		);
		const availableLimit = this.contextSize - editorToken;

		if (availableLimit === 0 || !fetchedContent.length) {
			return fetchedContent;
		}

		const tokensPerContent = Math.floor(availableLimit / fetchedContent.length);

		return fetchedContent.map(content => ( {
			...content,
			content: trimLLMContentByTokens(content.content, tokensPerContent)
		} ) );
	}
}
