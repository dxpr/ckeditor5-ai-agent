import type { Editor } from 'ckeditor5/src/core.js';
import type { MarkdownContent } from '../type-identifiers.js';
import { aiAgentContext } from '../aiagentcontext.js';
import { removeLeadingSpaces, extractEditorContent } from './text-utils.js';
import { countTokens, trimLLMContentByTokens } from './token-utils.js';
import { getAllowedHtmlTags } from './html-utils.js';
import { fetchUrlContent } from './url-utils.js';

export class PromptHelper {
	private editor: Editor;
	private contextSize: number;
	private responseOutputFormat: Array<string>;
	private responseContextData: Array<string>;
	private responseFilters: Array<string>;
	private debugMode: boolean;

	constructor( editor: Editor ) {
		this.editor = editor;
		const config = editor.config.get( 'aiAgent' )!;

		this.contextSize = config.contextSize!;
		this.responseOutputFormat = config.promptSettings?.outputFormat ?? [];
		this.responseContextData = config.promptSettings?.contextData ?? [];
		this.responseFilters = config.promptSettings?.filters ?? [];
		this.debugMode = config.debugMode ?? false;
	}

	/**
	 * Constructs the system prompt that guides the AI in generating responses.
	 *
	 * This method assembles a comprehensive set of instructions and context
	 * that the AI will utilize to formulate responses based on user input
	 * and the provided content, ensuring adherence to specified rules and formats.
	 *
	 * @param isInlineResponse - A boolean indicating whether the response should be inline.
	 * @returns A string containing the formatted system prompt for the AI.
	*/
	public getSystemPrompt( isInlineResponse: boolean = false ): string {
		const corpus: Array<string> = [];

		// Core system instructions
		corpus.push( `
			You will be provided with a partially written article with 
			"""@@@cursor@@@""" somewhere under a CONTEXT section, user input under a 
			TASK section, and sometimes there will be articles (delimited with 
			marked-up language) separated by Starting Markdown Content \${number}
			and Ending Markdown Content \${index} with certain instructions to follow 
			while generating a response under an INSTRUCTION section.

			If there is an article with """Stating Markdown Content""", your task is 
			to use that provided information solely to respond to the user request in 
			the TASK section.

			Follow these step-by-step instructions to respond to user inputs:
			1. Analyze the CONTEXT section thoroughly to understand the existing
			content and its style
			2. Identify the specific requirements from the TASK section
			3. If markdown content is present, extract relevant information that
			aligns with the task
			4. Determine the appropriate tone and style based on the context
			5. Generate a response that seamlessly integrates with the existing content
			6. Format the response according to the HTML and structural requirements
			7. Verify that the response meets all formatting and content guidelines

			Core Response Generation Rules:
			1. Replace "@@@cursor@@@" with contextually appropriate content
			2. Maintain consistency with the surrounding text's tone and style
			3. Ensure the response flows naturally with the existing content
			4. Avoid repeating context verbatim
			5. Generate original content that adds value
			6. Follow the specified language requirements
			7. Adhere to all HTML formatting rules

			Language and Tone Guidelines:
			1. Match the formality level of the surrounding content
			2. Maintain consistent voice throughout the response
			3. Use appropriate technical terminology when relevant
			4. Ensure proper grammar and punctuation
			5. Avoid overly complex sentence structures
			6. Keep the tone engaging and reader-friendly
			7. Adapt style based on content type (academic, casual, technical, etc.)

			Content Structure Rules:
			1. Organize information logically
			2. Use appropriate paragraph breaks
			3. Maintain consistent formatting
			4. Follow document hierarchy
			5. Use appropriate list structures when needed
			6. Ensure proper content flow
			7. Respect existing document structure

			HTML Formatting Requirements:
			1. Generate valid HTML snippets only
			2. Use only the following allowed tags: ${ getAllowedHtmlTags( this.editor ).join( ', ' ) }
			3. Ensure proper tag nesting
			4. Avoid empty elements
			5. Use semantic HTML where appropriate
			6. Maintain clean, readable HTML structure
			7. Follow block-level element rules
			8. Properly close all tags
			9. No inline styles unless specified
			10. No script or style tags
			11. First word must be a valid HTML tag
			12. Block elements must not contain other block elements

			Markdown Content Processing:
			1. Convert markdown to plain text
			2. Preserve essential formatting
			3. Maintain content hierarchy
			4. Keep list structures intact
			5. Preserve links and references
			6. Handle code blocks appropriately
			7. Maintain table structures
		` );

		// Inline response handling
		if ( isInlineResponse ) {
			corpus.push( `
				Inline Content Specific Rules:
				1. Determine content type (list, table, or inline)
				2. Format according to content type:
				   - List items: <li> within <ol> or <ul>
				   - Table cells: Plain text with <p> tags
				   - Inline content: Single <p> tag
				3. Ensure seamless integration with existing structure
				4. Maintain proper nesting
				5. Follow context-specific formatting
				6. Preserve existing content flow
				7. Match surrounding content style
			` );
		}

		// Image handling
		if ( getAllowedHtmlTags( this.editor ).includes( 'img' ) ) {
			corpus.push( `
				Image Element Requirements:
				1. Every <img> must have src and alt attributes
				2. Format src URLs as: https://placehold.co/600x400?text=[alt_text]
				3. Alt text requirements:
				   - Descriptive and meaningful
				   - Matches src URL text (spaces as +)
				   - No special characters
				4. Example: <img src="https://placehold.co/600x400?text=Beautiful+Sunset" alt="Beautiful Sunset">
				5. Proper image placement
				6. Contextually relevant images
				7. Appropriate image descriptions
			` );
		}

		// Response format handling
		if ( this.responseOutputFormat.length ) {
			corpus.push( `
				Output Format Requirements:
				${ this.responseOutputFormat.join( '\n' ) }
			` );
		}

		// Debug mode handling
		const systemPrompt = corpus.map( text => removeLeadingSpaces( text ) ).join( '\n\n' );

		if ( this.debugMode ) {
			console.group( 'AiAgent System Prompt Debug' );
			console.log( 'System Prompt:' );
			console.log( systemPrompt );
			console.groupEnd();
		}

		return systemPrompt;
	}

	/**
	 * Formats the final prompt to be sent to the GPT model, including context and instructions.
	 *
	 * @param request - The user's request string.
	 * @param context - The trimmed context string.
	 * @param markDownContents - An array of MarkdownContent objects for additional context.
	 * @param isEditorEmpty - A boolean indicating if the editor is empty.
	 * @returns The formatted prompt string.
	 */
	public formatFinalPrompt(
		request: string,
		context: string,
		markDownContents: Array<MarkdownContent>,
		isEditorEmpty: boolean
	): string {
		console.group( 'formatFinalPrompt Debug' );
		console.log( 'Request:', request );
		console.log( 'Context:', context );
		console.log( 'MarkDownContents:', markDownContents );
		console.log( 'IsEditorEmpty:', isEditorEmpty );

		const contentLanguageCode = this.editor.locale.contentLanguage;
		let prompt = '';

		// Context section
		prompt += `CONTEXT:\n\n"""\n${ context }\n"""\n\n`;

		// Task section
		prompt += `TASK:\n\n"""\n${ request }\n"""\n`;

		// Markdown content section
		if ( markDownContents.length ) {
			prompt += `
				\nRefer to following markdown content as a source of information, 
				but generate new text that fits the given context & task.\n
			`;

			markDownContents.forEach( ( markdown, index ) => {
				prompt += `
					\n------------ Starting Markdown Content ${ index + 1 } ------------\n
					${ markdown.content }
					\n------------ Ending Markdown Content ${ index + 1 } ------------\n
				`;
			} );
		}

		// Response format section
		if ( this.responseOutputFormat.length ) {
			prompt += '\n\nOUTPUT FORMAT:\n\n';
			prompt += this.responseOutputFormat.join( '\n' );
		}

		// Context data section
		if ( this.responseContextData.length ) {
			prompt += '\n\nADDITIONAL CONTEXT:\n\n';
			prompt += this.responseContextData.join( '\n' );
		}

		// Filters section
		if ( this.responseFilters.length ) {
			prompt += '\n\nCONTENT FILTERS:\n\n';
			prompt += this.responseFilters.join( '\n' );
		}

		// Language section
		if ( contentLanguageCode ) {
			prompt += `\n\nLANGUAGE: ${ contentLanguageCode }`;
		}

		// Empty editor note
		if ( isEditorEmpty ) {
			prompt += '\n\nNOTE: The editor is empty. Feel free to start fresh.';
		}

		// Debug logging
		if ( this.debugMode ) {
			console.group( 'AiAgent Final Prompt Debug' );
			console.log( 'Final Prompt:', prompt );
			console.groupEnd();
		}

		console.log( 'Final formatted prompt:', prompt );
		console.groupEnd();
		return prompt;
	}

	/**
	 * Trims the context around the user's prompt to create a suitable context for the AI model.
	 * This method identifies the position of the user's prompt within the provided text and extracts
	 * the surrounding context, placing a cursor placeholder where the prompt is located.
	 *
	 * @param prompt - The user's prompt string to locate within the context.
	 * @param promptContainerText - The text container in which the prompt is located (optional).
	 * @returns The trimmed context string with a cursor placeholder indicating the prompt's position.
	*/
	public trimContext( prompt: string, promptContainerText?: string ): string {
		// Get the editor content if promptContainerText is not provided
		if ( !promptContainerText ) {
			promptContainerText = this.editor.getData();
		}

		const cursorPosition = promptContainerText.indexOf( '@@@cursor@@@' );
		let contentBeforePrompt = '';
		let contentAfterPrompt = '';

		if ( cursorPosition !== -1 ) {
			contentBeforePrompt = extractEditorContent(
				promptContainerText.substring( 0, cursorPosition ),
				this.contextSize,
				true
			);

			contentAfterPrompt = extractEditorContent(
				promptContainerText.substring( cursorPosition + 13 ),
				this.contextSize
			);
		} else {
			// If no cursor found, use the editor content
			const editorContent = this.editor.getData();
			contentAfterPrompt = extractEditorContent( editorContent, this.contextSize );
			contentBeforePrompt = extractEditorContent( editorContent, this.contextSize, true );
		}

		return `${ contentBeforePrompt }@@@cursor@@@${ contentAfterPrompt }`;
	}

	/**
	 * Allocates tokens to fetched content based on available limits.
	 */
	public allocateTokensToFetchedContent(
		prompt: string,
		fetchedContent: Array<MarkdownContent>
	): Array<MarkdownContent> {
		const promptTokens = countTokens( prompt );
		const maxTokens = this.contextSize;
		const availableTokens = Math.max( 0, maxTokens - promptTokens );

		if ( availableTokens === 0 || !fetchedContent.length ) {
			return fetchedContent;
		}

		const tokensPerContent = Math.floor( availableTokens / fetchedContent.length );

		return fetchedContent.map( content => ( {
			...content,
			content: trimLLMContentByTokens( content.content, tokensPerContent )
		} ) );
	}

	/**
	 * Generates markdown content from URLs with proper error handling.
	 */
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
					console.error( `Failed to fetch content from ${ url }:`, error );
					aiAgentContext.showError( `Failed to fetch content from ${ url }` );
				}
			}

			return this.allocateTokensToFetchedContent(
				this.getSystemPrompt(),
				markdownContents
			);
		} catch ( error ) {
			console.error( 'Error generating markdown content:', error );
			aiAgentContext.showError( 'Failed to generate markdown content' );
			return [];
		}
	}

	/**
	 * Fetches the content of a given URL and returns it as a string.
	 *
	 * @param url - The URL to fetch content from.
	 * @returns A promise that resolves to the fetched content as a string.
	 * @throws Will throw an error if the URL is invalid or if the fetch fails.
	 */
	public async fetchUrlContent( url: string ): Promise<string> {
		const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
		const trimmedUrl = url.trim();

		if ( !urlRegex.test( trimmedUrl ) ) {
			throw new Error( 'Invalid URL' );
		}

		try {
			// Use a regular expression to remove hidden characters
			const cleanedUrl = trimmedUrl.replace( /[^\x20-\x7E]/g, '' );
			const requestURL = `https://r.jina.ai/${ cleanedUrl.trim() }`;
			const response = await fetch( requestURL.trim(), {
				headers: {
					'X-With-Generated-Alt': 'true'
				}
			} );
			if ( !response.ok ) {
				throw new Error( `HTTP error! status: ${ response.status }` );
			}
			const content = await response.text();

			// Updated error matching
			if ( content.includes( 'Warning: Target URL returned error' ) ) {
				throw new Error( `Target URL (${ trimmedUrl }) returned an error` );
			}

			if ( content.trim().length === 0 ) {
				throw new Error( 'Empty content received' );
			}

			return content.replace( /\(https?:\/\/[^\s]+\)/g, '' ).replace( /^\s*$/gm, '' ).trim();
		} catch ( error ) {
			console.error( `Failed to fetch content: ${ url }`, error );
			return '';
		}
	}

	/**
	 * Counts the number of tokens in the provided content string.
	 *
	 * @param content - The content string to count tokens in.
	 * @returns The number of tokens in the content.
	 */
	public countTokens( content: string ): number {
		if ( !content || typeof content !== 'string' ) {
			return 0;
		}
		// Normalize the content by trimming and reducing multiple whitespaces.
		const normalizedContent = content
			.trim()
			.replace( /\s+/g, ' ' );
		// Approximate tokens by breaking words, contractions, and common punctuation marks.
		const tokens = normalizedContent.match( /\b\w+('\w+)?\b|[.,!?;:"(){}[\]]/g ) || [];

		// Heuristic: Long words (over 10 characters) are likely to be split into multiple tokens.
		// GPT often breaks down long words into smaller subword chunks.
		let approxTokenCount = 0;
		tokens.forEach( token => {
			// Break long words into chunks to approximate GPT subword tokenization.
			if ( token.length > 10 ) {
				approxTokenCount += Math.ceil( token.length / 4 ); // Approximation: 4 characters per token.
			} else {
				approxTokenCount += 1;
			}
		} );

		return approxTokenCount;
	}

	/**
	 * Trims the LLM content by tokens while ensuring that sentences or other structures (e.g., bullet points, paragraphs)
	 * are not clipped mid-way.
	 *
	 * @param content - The LLM-generated content string to trim.
	 * @param maxTokens - The maximum number of tokens allowed.
	 * @returns The trimmed content string.
	 */
	public trimLLMContentByTokens( content: string, maxTokens: number ): string {
		const elements = content.split( '\n' );
		let accumulatedTokens = 0;
		let trimmedContent = '';

		for ( const element of elements ) {
			const elementTokenCount = this.countTokens( element );
			if ( accumulatedTokens + elementTokenCount > maxTokens ) {
				break; // Stop if adding this element would exceed the token limit.
			}
			accumulatedTokens += elementTokenCount;
			trimmedContent += element + '\n'; // Add the whole structural element.
		}

		return trimmedContent;
	}

	/**
	 * Retrieves the allowed HTML tags based on the CKEditor schema.
	 *
	 * @returns An array of allowed HTML tags.
	 */
	public getAllowedHtmlTags(): Array<string> {
		const editor = this.editor;
		const schema = editor.model.schema;
		const definitions = schema.getDefinitions();
		const schemaNodes = Object.keys( definitions ).sort();

		// Map of CKEditor nodes to HTML tags
		const nodeToHtmlMap: Record<string, string> = {
			blockQuote: 'blockquote',
			caption: 'figcaption',
			codeBlock: 'pre',
			heading1: 'h1',
			heading2: 'h2',
			heading3: 'h3',
			imageBlock: 'img',
			imageInline: 'img',
			paragraph: 'p',
			table: 'table',
			tableCell: 'td',
			tableRow: 'tr',
			$listItem: 'li',
			horizontalLine: 'hr'
		};

		// Map text attributes to HTML tags
		const textAttributeToHtmlMap: Record<string, string> = {
			bold: 'strong',
			italic: 'em',
			code: 'code',
			strikethrough: 's',
			subscript: 'sub',
			superscript: 'sup',
			underline: 'u',
			linkHref: 'a'
		};

		// Collect allowed tags
		const allowedTags = new Set<string>();

		// Add tags from node mappings
		schemaNodes.forEach( node => {
			if ( node in nodeToHtmlMap ) {
				allowedTags.add( nodeToHtmlMap[ node ] );
			}
		} );

		// Add tags from text attributes
		const textDefinition = definitions.$text;
		if ( textDefinition && textDefinition.allowAttributes ) {
			textDefinition.allowAttributes.forEach( ( attr: string ) => {
				if ( attr in textAttributeToHtmlMap ) {
					allowedTags.add( textAttributeToHtmlMap[ attr ] );
				}
			} );
		}

		// If listItem is present, add ul and ol
		if ( allowedTags.has( 'li' ) ) {
			allowedTags.add( 'ul' );
			allowedTags.add( 'ol' );
		}

		// Sort and return the unique allowed tags
		return Array.from( allowedTags ).sort();
	}
}
