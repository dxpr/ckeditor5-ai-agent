import type { Editor } from 'ckeditor5/src/core.js';
import type { MarkdownContent, PromptComponentKey, PromptSettings, AiModel } from '../type-identifiers.js';
import { aiAgentContext } from '../aiagentcontext.js';
import { removeLeadingSpaces, extractEditorContent, trimMultilineString } from './text-utils.js';
import { countTokens, trimLLMContentByTokens } from './token-utils.js';
import { fetchMultipleUrls } from './url-utils.js';
import { getDefaultRules } from './default-rules.js';
import { getAllowedHtmlTags } from './html-utils.js';
import { DEFAULT_HTML_CLEANUP_CONFIG } from '../types/html-cleanup.js';
import { HtmlCleanupService } from './html-cleanup.js';

// Default token limits if no specific match is found
const DEFAULT_MAX_INPUT_TOKENS = 1000000;

export interface ModelTokenLimits {
	maxInputContextTokens: number;
}

export function getModelTokenLimits( model: string ): ModelTokenLimits {
	// OpenAI models
	if ( model.includes( 'o1' ) ) {
		return { maxInputContextTokens: 200000 };
	}
	if ( model.includes( 'o3-mini' ) ) {
		return { maxInputContextTokens: 200000 };
	}
	if ( model.includes( 'gpt-4o' ) ) {
		return { maxInputContextTokens: 128000 };
	}

	// Anthropic models
	if ( model.includes( 'claude-2.0' ) ) {
		return { maxInputContextTokens: 100000 };
	}
	if ( model.includes( 'claude' ) ) {
		return { maxInputContextTokens: 200000 };
	}

	// Google models
	if ( model.includes( 'gemini-1.5-pro' ) ) {
		return { maxInputContextTokens: 2000000 };
	}
	if ( model.includes( 'gemini' ) && model.includes( 'flash' ) ) {
		return { maxInputContextTokens: 1000000 };
	}
	if ( model.includes( 'gemma' ) ) {
		return { maxInputContextTokens: 8192 };
	}

	// Mistral models
	if ( model.includes( 'codestral-mamba' ) ) {
		return { maxInputContextTokens: 256000 };
	}
	if ( model.includes( 'mixtral-8x22b' ) ) {
		return { maxInputContextTokens: 65000 };
	}
	if ( model.includes( 'mixtral-8x7b-32768' ) ) {
		return { maxInputContextTokens: 32768 };
	}
	if ( model.includes( 'mixtral' ) ||
		model.includes( 'mistral-medium' ) ||
		model.includes( 'mistral-small' ) ||
		model.includes( 'mistral-tiny' )
	) {
		return { maxInputContextTokens: 33000 };
	}
	if ( model.includes( 'mistral-large' ) || model.includes( 'ministral' ) ) {
		return { maxInputContextTokens: 128000 };
	}

	// Default for all other models
	return { maxInputContextTokens: DEFAULT_MAX_INPUT_TOKENS };
}

export class PromptHelper {
	private editor: Editor;
	private contextSize: number;
	private promptSettings: PromptSettings;
	private debugMode: boolean;
	private editorContextRatio: number;
	private contentScope: string;
	private htmlCleanup: HtmlCleanupService;

	constructor( editor: Editor, options: { editorContextRatio?: number } = {} ) {
		this.editor = editor;
		const config = editor.config.get( 'aiAgent' )!;
		const model = ( config.model ?? 'gpt-4o' ) as AiModel;

		// Get model's maxInputContextTokens based on pattern matching
		const { maxInputContextTokens } = getModelTokenLimits( model );

		this.contextSize = config.contextSize ?? Math.floor( maxInputContextTokens * 0.75 );
		this.promptSettings = config.promptSettings ?? {};
		this.debugMode = config.debugMode ?? false;
		this.editorContextRatio = options.editorContextRatio ?? 0.3;
		this.contentScope = config?.contentScope ?? '';

		if ( this.debugMode ) {
			console.log( '[Context Init]', {
				model,
				maxInputContextTokens,
				defaultContextSize: Math.floor( maxInputContextTokens * 0.75 ),
				configuredContextSize: config.contextSize,
				finalContextSize: this.contextSize
			} );
		}

		this.htmlCleanup = new HtmlCleanupService( { editor, config: DEFAULT_HTML_CLEANUP_CONFIG } );
	}

	public getSystemPrompt( isInlineResponse: boolean = false ): string {
		const defaultComponents = getDefaultRules( this.editor );
		let systemPrompt = '';

		// Process each component
		for ( const [ id, defaultContent ] of Object.entries( defaultComponents ) ) {
			// Skip components that are not allowed in the editor and not inline response
			if (
				( id === 'imageHandling' && !getAllowedHtmlTags( this.editor ).includes( 'img' ) ) ||
				( id === 'inlineContent' && !isInlineResponse )
			) {
				continue;
			}

			const componentId = id as PromptComponentKey;
			let content = defaultContent;

			// Apply overrides if they exist
			if ( this.promptSettings.overrides?.[ componentId ] ) {
				content = this.promptSettings.overrides[ componentId ]!;
			}

			// Apply additions if they exist
			if ( this.promptSettings.additions?.[ componentId ] ) {
				content += '\n' + this.promptSettings.additions[ componentId ];
			}

			// Convert componentId to uppercase for XML tag
			const xmlTag = componentId.replace( /([A-Z])/g, '_$1' ).toUpperCase();

			// Add the component to the system prompt with XML tags
			systemPrompt += `<${ xmlTag }>\n${ trimMultilineString( content ) }\n</${ xmlTag }>\n\n`;
		}

		if ( this.debugMode ) {
			console.group( 'AiAgent System Prompt Debug' );
			console.log( 'System Prompt:', systemPrompt );
			console.groupEnd();
		}

		return systemPrompt;
	}

	public trimContext( prompt: string, promptContainerText: string = '' ): string {
		let contentBeforePrompt = '';
		let contentAfterPrompt = '';
		const splitText = promptContainerText ?? prompt;
		let context = '';

		if ( this.debugMode ) {
			console.group( 'HTML Content Debug' );
			console.log( '1. Initial context:', context );
		}

		// Get raw HTML content based on configuration
		if ( this.contentScope ) {
			// Use contentScope if configured
			const activeEditorElement = this.editor.editing.view.getDomRoot();
			const targetElement = activeEditorElement?.closest( this.contentScope );
			if ( targetElement ) {
				context = this.htmlCleanup.clean( targetElement.innerHTML );
			}
		} else {
			// Otherwise get content directly from editor
			const editorElement = this.editor.editing.view.getDomRoot();
			if ( editorElement ) {
				context = this.htmlCleanup.clean( editorElement.innerHTML );
			}
		}

		if ( this.debugMode ) {
			console.log( '2. Editor HTML (cleaned):', context );
			console.log( '3. Character count before splitting:', context.length );
		}

		// Ensure we don't exceed limits from the start
		const maxChars = Math.floor( this.contextSize * this.editorContextRatio ) * 4;
		if ( context.length > maxChars ) {
			context = context.substring( 0, maxChars );
			if ( this.debugMode ) {
				console.log( '3a. Content trimmed to length limit:', context );
			}
		}

		const matchIndex = context.indexOf( splitText );
		const nextEnterIndex = context.indexOf( '\n', matchIndex );
		const firstNewlineIndex = nextEnterIndex !== -1 ? nextEnterIndex : matchIndex + splitText.length;
		const beforeNewline = context.substring( 0, firstNewlineIndex );
		const afterNewline = context.substring( firstNewlineIndex + 1 );
		const contextParts = [ beforeNewline, afterNewline ];

		if ( this.debugMode ) {
			console.log( '4. Split context parts:', {
				beforeNewline,
				afterNewline,
				beforeLength: beforeNewline.length,
				afterLength: afterNewline.length
			} );
		}

		const allocatedEditorContextToken = Math.floor( this.contextSize * this.editorContextRatio );

		if ( contextParts.length > 1 ) {
			if ( contextParts[ 0 ].length < contextParts[ 1 ].length ) {
				contentBeforePrompt = extractEditorContent(
					contextParts[ 0 ],
					allocatedEditorContextToken / 2,
					true,
					this.editor
				);
				contentAfterPrompt = extractEditorContent(
					contextParts[ 1 ],
					allocatedEditorContextToken - contentBeforePrompt.length / 4,
					false,
					this.editor
				);
			} else {
				contentAfterPrompt = extractEditorContent(
					contextParts[ 1 ],
					allocatedEditorContextToken / 2,
					false,
					this.editor
				);
				contentBeforePrompt = extractEditorContent(
					contextParts[ 0 ],
					allocatedEditorContextToken - contentAfterPrompt.length / 4,
					true,
					this.editor
				);
			}
		}

		if ( this.debugMode ) {
			console.log( '5. After extractEditorContent:', {
				contentBeforePrompt,
				contentAfterPrompt,
				beforeLength: contentBeforePrompt.length,
				afterLength: contentAfterPrompt.length,
				totalLength: contentBeforePrompt.length + contentAfterPrompt.length
			} );
		}

		// Combine the trimmed context with the cursor placeholder
		const escapedPrompt = prompt.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ); // Escapes special characters
		contentBeforePrompt = contentBeforePrompt.trim()
			.replace( new RegExp( escapedPrompt.slice( 1 ) ), '@@@cursor@@@' )
			.replace( '/@@@cursor@@@', '@@@cursor@@@' ); // Remove forward slash if present
		const trimmedContext = `${ contentBeforePrompt }\n${ contentAfterPrompt }`;

		if ( this.debugMode ) {
			console.log( '6. Final trimmed context:', trimmedContext );
			console.log( 'Final character count:', trimmedContext.length );
			console.groupEnd();
		}

		return trimmedContext.trim();
	}

	public formatFinalPrompt(
		request: string,
		context?: string,
		selectedContent?: string,
		markDownContents?: Array<MarkdownContent>,
		isEditorEmpty: boolean = false
	): string {
		if ( this.debugMode ) {
			console.group( 'formatFinalPrompt Debug' );
			console.log( 'Request:', request );
			console.log( 'Context received:', context );
			console.log( 'MarkDownContents:', markDownContents );
			console.log( 'IsEditorEmpty:', isEditorEmpty );
		}

		const contentLanguageCode = this.editor.locale.contentLanguage;
		const corpus: Array<string> = [];

		// Task Section
		corpus.push( '<TASK>' );
		corpus.push( request );
		corpus.push( '</TASK>' );

		// Context Section
		if ( context?.length && !selectedContent ) {
			corpus.push( '\n<CONTEXT>' );
			corpus.push( context );
			corpus.push( '</CONTEXT>' );
		}

		if ( selectedContent ) {
			corpus.push( '<SELECTED_CONTENT>' );
			corpus.push( selectedContent );
			corpus.push( '</SELECTED_CONTENT>' );
		}

		// Markdown Content Section
		if ( markDownContents?.length ) {
			corpus.push( '\n<REFERENCE_CONTENT>' );
			for ( const content of markDownContents ) {
				corpus.push( `<SOURCE url="${ content.url }">\n${ content.content }\n</SOURCE>` );
			}
			corpus.push( '</REFERENCE_CONTENT>' );

			// Use default referenceGuidelines
			corpus.push( '\n<REFERENCE_GUIDELINES>' );
			corpus.push( this.getComponentContent( 'referenceGuidelines' ) );
			corpus.push( '</REFERENCE_GUIDELINES>' );
		}

		// Context-Specific Instructions
		if ( !isEditorEmpty && !selectedContent ) {
			corpus.push( '\n<CONTEXT_REQUIREMENTS>' );
			corpus.push( this.getComponentContent( 'contextRequirements' ) );
			corpus.push( '</CONTEXT_REQUIREMENTS>' );
		}

		// Add language instructions back
		corpus.push( '\n<INSTRUCTIONS>' );
		corpus.push( `The response must follow the language code - ${ contentLanguageCode }.` );
		corpus.push( '</INSTRUCTIONS>' );

		// Debug Output
		if ( this.debugMode ) {
			console.group( 'AiAgent Final Prompt Debug' );
			console.log( 'Final Prompt:', corpus.join( '\n' ) );
			console.groupEnd();
		}

		return corpus.map( text => removeLeadingSpaces( text ) ).join( '\n' );
	}

	private getComponentContent( componentId: PromptComponentKey ): string {
		const defaultComponents = getDefaultRules( this.editor );
		let content = defaultComponents[ componentId ];

		if ( this.promptSettings.overrides?.[ componentId ] ) {
			content = this.promptSettings.overrides[ componentId ]!;
		}

		if ( this.promptSettings.additions?.[ componentId ] ) {
			content += '\n' + this.promptSettings.additions[ componentId ];
		}

		return trimMultilineString( content );
	}

	public async generateMarkDownForUrls( urls: Array<string> ): Promise<Array<MarkdownContent>> {
		try {
			const results = await fetchMultipleUrls( urls );
			const markdownContents: Array<MarkdownContent> = [];

			for ( const result of results ) {
				if ( result.content && !result.error ) {
					markdownContents.push( {
						content: result.content,
						url: result.url,
						tokenCount: countTokens( result.content )
					} );
				} else if ( this.debugMode ) {
					console.error( `Failed to fetch content from ${ result.url }:`, result.error );
				}
			}

			return this.allocateTokensToFetchedContent(
				this.getSystemPrompt(),
				markdownContents
			);
		} catch ( error ) {
			if ( this.debugMode ) {
				console.error( 'Error generating markdown content:', error );
			}
			aiAgentContext.showError( 'Failed to generate markdown content' );
			return [];
		}
	}

	public allocateTokensToFetchedContent(
		prompt: string,
		fetchedContent: Array<MarkdownContent>
	): Array<MarkdownContent> {
		const editorContent = this.editor?.editing?.view?.domRoots?.get( 'main' )?.innerText ?? '';
		const editorToken = Math.min(
			Math.floor( this.contextSize * this.editorContextRatio ),
			countTokens( editorContent )
		);
		const availableLimit = this.contextSize - editorToken;

		if ( availableLimit === 0 || !fetchedContent.length ) {
			return fetchedContent;
		}

		const tokensPerContent = Math.floor( availableLimit / fetchedContent.length );

		return fetchedContent.map( content => ( {
			...content,
			content: trimLLMContentByTokens( content.content, tokensPerContent )
		} ) );
	}
}
