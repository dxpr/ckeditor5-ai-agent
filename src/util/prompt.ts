import type { Editor } from 'ckeditor5/src/core.js';
import type { MarkdownContent, PromptComponentKey, PromptSettings } from '../type-identifiers.js';
import { aiAgentContext } from '../aiagentcontext.js';
import { removeLeadingSpaces, extractEditorContent, trimMultilineString } from './text-utils.js';
import { countTokens, trimLLMContentByTokens } from './token-utils.js';
import { fetchUrlContent } from './url-utils.js';
import { getDefaultRules } from './default-rules.js';
import { getAllowedHtmlTags } from './html-utils.js';

export class PromptHelper {
	private editor: Editor;
	private contextSize: number;
	private promptSettings: PromptSettings;
	private debugMode: boolean;
	private editorContextRatio: number;

	constructor( editor: Editor, options: { editorContextRatio?: number } = {} ) {
		this.editor = editor;
		const config = editor.config.get( 'aiAgent' )!;

		this.contextSize = config.contextSize ?? 4000;
		this.promptSettings = config.promptSettings ?? {};
		this.debugMode = config.debugMode ?? false;
		this.editorContextRatio = options.editorContextRatio ?? 0.3;
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

			// Add the component to the system prompt
			systemPrompt += trimMultilineString( content ) + ( '\n\n' );
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
		const view = this.editor?.editing?.view?.domRoots?.get( 'main' );
		const context = view?.innerText ?? '';

		const matchIndex = context.indexOf( splitText );
		const nextEnterIndex = context.indexOf( '\n', matchIndex );
		const firstNewlineIndex = nextEnterIndex !== -1 ? nextEnterIndex : matchIndex + splitText.length;
		const beforeNewline = context.substring( 0, firstNewlineIndex );
		const afterNewline = context.substring( firstNewlineIndex + 1 );
		const contextParts = [ beforeNewline, afterNewline ];

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

		// Combine the trimmed context with the cursor placeholder
		const escapedPrompt = prompt.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ); // Escapes special characters
		contentBeforePrompt = contentBeforePrompt.trim()
			.replace( new RegExp( escapedPrompt.slice( 1 ) ), '@@@cursor@@@' )
			.replace( '/@@@cursor@@@', '@@@cursor@@@' ); // Remove forward slash if present
		const trimmedContext = `${ contentBeforePrompt }\n${ contentAfterPrompt }`;
		return trimmedContext.trim();
	}

	public formatFinalPrompt(
		request: string,
		context: string,
		markDownContents: Array<MarkdownContent>,
		isEditorEmpty: boolean
	): string {
		if ( this.debugMode ) {
			console.group( 'formatFinalPrompt Debug' );
			console.log( 'Request:', request );
			console.log( 'Context:', context );
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
		if ( context?.length ) {
			corpus.push( '\n<CONTEXT>' );
			corpus.push( context );
			corpus.push( '</CONTEXT>' );
		}

		// Markdown Content Section
		if ( markDownContents?.length ) {
			corpus.push( '\n<REFERENCE_CONTENT>' );
			for ( const content of markDownContents ) {
				corpus.push( `<SOURCE url="${ content.url }">\n${ content.content }\n</SOURCE>` );
			}
			corpus.push( '</REFERENCE_CONTENT>' );

			corpus.push( '\n<REFERENCE_GUIDELINES>' );
			corpus.push( trimMultilineString( `
				Use information from provided markdown to generate new text.
				Do not copy content verbatim.
				Ensure natural flow with existing context.
				Avoid markdown formatting in response.
				Consider whole markdown as single source.
				Generate requested percentage of content.
			` ) );
			corpus.push( '</REFERENCE_GUIDELINES>' );
		}

		// Instructions Section
		corpus.push( '\n<INSTRUCTIONS>' );
		corpus.push( `The response must follow the language code - ${ contentLanguageCode }.` );
		corpus.push( '</INSTRUCTIONS>' );

		// Context-Specific Instructions
		if ( !isEditorEmpty ) {
			corpus.push( '\n<CONTEXT_REQUIREMENTS>' );
			corpus.push( trimMultilineString( `
				Replace "@@@cursor@@@" with contextually appropriate content.
				Replace ONLY @@@cursor@@@ - surrounding text is READ-ONLY.
				NEVER copy or paraphrase context text.
				Verify zero phrase duplication.
				Analyze the CONTEXT section thoroughly 
				to understand the existing content and its style.
				Generate a response that seamlessly integrates 
				with the existing content.
				Determine the appropriate tone and style based
				on the context. Ensure the response flows 
				naturally with the existing content.

			` ) );
			corpus.push( '</CONTEXT_REQUIREMENTS>' );
		}

		// Debug Output
		if ( this.debugMode ) {
			console.group( 'AiAgent Final Prompt Debug' );
			console.log( 'Final Prompt:', corpus.join( '\n' ) );
			console.groupEnd();
		}

		return corpus.map( text => removeLeadingSpaces( text ) ).join( '\n' );
	}

	public async generateMarkDownForUrls( urls: Array<string> ): Promise<Array<MarkdownContent>> {
		try {
			const markdownContents: Array<MarkdownContent> = [];

			for ( const url of urls ) {
				try {
					const content = await fetchUrlContent( url );
					if ( content ) {
						markdownContents.push( {
							content,
							url,
							tokenCount: countTokens( content )
						} );
					}
				} catch ( error ) {
					if ( this.debugMode ) {
						console.error( `Failed to fetch content from ${ url }:`, error );
					}
					aiAgentContext.showError( `Failed to fetch content from ${ url }` );
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
