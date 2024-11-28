import sbd from 'sbd';
import type { Editor } from 'ckeditor5/src/core.js';
import type { MarkdownContent } from '../type-identifiers.js';
import { aiAgentContext } from '../aiagentcontext.js';
export class PromptHelper {
	private editor: Editor;
	private contextSize: number;
	private responseOutputFormat: Array<string>;
	private responseContextData: Array<any>;
	private responseFilters: Array<any>;
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
		corpus.push(
			`You will be provided with a partially written article with """@@@cursor@@@""" somewhere 
			under a CONTEXT section, user input under a TASK section, and sometimes there will be articles 
			(delimited with marked-up language) separated by Starting Markdown Content \${ number } and 
			Ending Markdown Content \${ index } with certain instructions to follow while generating a response 
			under an INSTRUCTION section`
		);
		corpus.push(
			`If there is an article with """Stating Markdown Content""", your task is to 
			use that provided information solely to respond to the user request in the TASK section.`
		);
		corpus.push( 'Follow these step-by-step instructions to respond to user inputs:' );
		corpus.push(
			`Step 1 - Summarize information under the CONTEXT section, set a tone for the article, and 
			later use that summarized information to generate a response`
		);
		corpus.push(
			`Step 2: If there is an article with """Stating Markdown Content""", 
			break it into derived sections and eliminate unnecessary information 
			that does not relate to the context and user prompt.`
		);
		corpus.push(
			'Final Step - use all summarized information to respond to user input under the TASK section'
		);
		corpus.push( 'While generating the response, adhere to the following rules:' );
		corpus.push(
			`1. Provide only the new text content that should replace "@@@cursor@@@" based on the context above, 
			ensuring that the response must primarily based on the request.`
		);
		corpus.push(
			`2. Avoid including any part of the context in the output at any cost, 
			except for necessary glimpses that enhance the response.`
		);
		corpus.push(
			`3. Ensure response adheres to the specified tone or style, such as 
			formal, informal, or technical, as appropriate for the context.`
		);
		corpus.push( '4. Do not use any markdown formatting in your response. (e.g., **, ##, ###, ---, ===, ____).' );
		corpus.push(
			`5. Use a relaxed, formal or informal tone based on the summary of context with lots of personal touches. 
			Feel free to include spontaneous thoughts, offhand comments, or quirky observations.`
		);
		corpus.push(
			`6. Vary sentence lengths and styles—include fragments, casual interjections, 
			and minor grammar slips, but avoid spelling mistakes.`
		);
		corpus.push(
			'7. Add in personal anecdotes or emotional reactions to make it sound like a genuine conversation.'
		);
		corpus.push(
			'8. Avoid overly polished language or structured sentences, aim for a natural and solely human-like tone.'
		);
		if ( isInlineResponse ) {
			corpus.push(
				`9: Determine from the context, task, and the position of the @@@cursor@@@ whether the request 
				involves list items, table cells, or inline content.
				- List items: Format each item as <li> within an <ol> or <ul> as appropriate.
				- Table cells: Present each item in plain text, wrapping it within <p> tags.
				- Inline content: Wrap entire response in a single <p> tag, ensuring it fits seamlessly within the existing paragraph or 
				sentence structure where the @@@cursor@@@ is located.
				Strictly adherence to these rules is mandatory to avoid errors, based on where the @@@cursor@@@ is placed within content.`
			);
		}

		corpus.push( 'Above are the rules apply every time, but below will only be applied if markdown content is present' );
		corpus.push(
			'1. Extract each content as plain text without any special formatting, emphasis, or markdown'
		);
		corpus.push(
			'2. The response should synthesize information from both the editor content ' +
			'and the fetched sources, maintaining a balance between them.'
		);
		corpus.push(
			'3. Highlight key points from the fetched sources while ensuring that ' +
			'the context from the editor is acknowledged and integrated where relevant.'
		);
		corpus.push(
			'4. Clearly differentiate between the information derived from the editor ' +
			'content and that from the fetched sources to avoid confusion.'
		);

		corpus.push( 'When generating content, adhere to the following HTML-specific rules:' );
		corpus.push( '1. Generate an HTML snippet, not a full HTML document.' );
		corpus.push( '2. You are an HTML generator. When providing HTML code, ensure it follows standard HTML norms and best practices.' );
		corpus.push( '4. Block-level elements (e.g., <p>, <div>, <section>) must not contain other block-level elements.' );
		corpus.push( '5. Ensure valid nesting of elements.' );
		corpus.push( '6. Use the following allowed HTML tags:' );
		corpus.push( `${ this.getAllowedHtmlTags().join( ', ' ) }` );
		corpus.push( '7. Do not include any HTML, HEAD, or BODY tags.' );
		corpus.push( '8. Ensure all HTML tags are properly closed and nested.' );
		corpus.push( '9. Do not include any HTML, HEAD, or BODY tags.' );
		corpus.push( '10. Avoid using inline styles or class attributes unless specifically requested.' );
		corpus.push( '11. Provide clean, valid HTML that adheres to best practices and is ready for use in web development.' );
		corpus.push( '12. Beginning word of response must be a valid html tag' );

		if ( this.getAllowedHtmlTags().includes( 'img' ) ) {
			corpus.push( '13. For image elements, follow these strict formatting rules:' );
			corpus.push( '    a. Every <img> tag MUST include both src and alt attributes' );
			corpus.push( '    b. Format the src URL exactly as: https://placehold.co/600x400?text=[alt_text]' );
			corpus.push( '    c. The [alt_text] in the src URL must:' );
			corpus.push( '       - Be identical to the alt attribute value' );
			corpus.push( '       - Replace spaces with + characters' );
			corpus.push( '       - Exclude any special characters' );
			corpus.push( '    d. Example:' );
			corpus.push( '       <img src="https://placehold.co/600x400?text=Beautiful+Sunset" alt="Beautiful Sunset">' );
		}

		// Join all instructions into a single formatted string.
		const systemPrompt = corpus.join( '\n' );

		// Log the system prompt if debug mode is enabled
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
		const editor = this.editor;
		const contentLanguageCode = editor.locale.contentLanguage;
		const corpus = [];

		// Context and Task
		corpus.push( 'CONTEXT:' );
		corpus.push( `\n"""\n${ context }\n"""\n` );
		corpus.push( '\n\nTASK:\n\n' );
		corpus.push( `"""\n${ request }\n"""\n` );

		// Markdown Content
		if ( markDownContents.length ) {
			corpus.push(
				'Refer to following markdown content as a source of information, but generate new text that fits the given context & task.'
			);
			markDownContents.forEach( ( markdown, index ) => {
				corpus.push(
					`\n\n------------ Stating Markdown Content ${ index + 1 } ------------\n\n`
				);
				corpus.push( markdown.content );
				corpus.push(
					`\n\n------------ Ending Markdown Content ${ index + 1 } ------------\n\n`
				);
			} );
		}

		// Instructions
		corpus.push( '\n\nINSTRUCTIONS:\n\n' );
		corpus.push( `The response must follow the language code - ${ contentLanguageCode }.` );

		// Response Output Format
		if ( this.responseOutputFormat.length ) {
			corpus.push( ...this.responseOutputFormat );
		}

		// Markdown Content Usage
		if ( markDownContents.length ) {
			corpus.push(
				'Use information from provided markdown content to generate new text, but do not copy it verbatim.'
			);
			corpus.push(
				'Ensure the new text flows naturally with the existing context and integrates smoothly.'
			);
			corpus.push(
				'Do not use any markdown formatting in your response. ' +
				'specially for title and list item like """**Performance**""" is not acceptable where as """performance""" is.'
			);
			corpus.push(
				'consider whole markdown of single source as content and then generate % content requested'
			);
		}

		// Response Filters
		if ( this.responseFilters.length ) {
			corpus.push( ...this.responseFilters );
		} else {
			const defaultFilterInstructions = [
				'The response should directly follow the context, avoiding any awkward transitions or noticeable gaps.'
			];
			corpus.push( ...defaultFilterInstructions );
		}

		// Context-Specific Instructions
		if ( !isEditorEmpty ) {
			const defaultContextInstructions = [
				'Ensure the inserted content maintains a seamless connection with the surrounding text,',
				'making the transition smooth and natural.',
				'Do not modify the original text except to replace the "@@@cursor@@@" placeholder with the generated content.'
			];
			corpus.push( ...defaultContextInstructions );
		}
		if ( this.responseContextData.length ) {
			corpus.push( ...this.responseContextData );
		}

		// Debugging Information
		if ( this.debugMode ) {
			console.group( 'AiAgent Prompt Debug' );
			console.log( 'User Prompt:', request );
			console.log( 'Generated GPT Prompt:' );
			console.log( corpus.join( '\n' ) );
			console.groupEnd();
		}

		// Join all instructions into a single formatted string.
		return corpus.join( '\n' );
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
	public trimContext( prompt: string, promptContainerText: string = '' ): string {
		let contentBeforePrompt = '';
		let contentAfterPrompt = '';
		const splitText = promptContainerText ?? prompt;
		const editor = this.editor;
		const view = editor?.editing?.view?.domRoots?.get( 'main' );
		const context = view?.innerText ?? '';

		const matchIndex = context.indexOf( splitText );
		const nextEnterIndex = context.indexOf( '\n', matchIndex );
		const firstNewlineIndex = nextEnterIndex !== -1 ? nextEnterIndex : matchIndex + splitText.length;
		const beforeNewline = context.substring( 0, firstNewlineIndex );
		const afterNewline = context.substring( firstNewlineIndex + 1 );
		const contextParts = [ beforeNewline, afterNewline ];

		const allocatedEditorContextToken = Math.floor( this.contextSize * 0.3 );
		if ( contextParts.length > 1 ) {
			if ( contextParts[ 0 ].length < contextParts[ 1 ].length ) {
				contentBeforePrompt = this.extractEditorContent(
					contextParts[ 0 ],
					allocatedEditorContextToken / 2,
					true
				);
				contentAfterPrompt = this.extractEditorContent(
					contextParts[ 1 ],
					allocatedEditorContextToken - contentBeforePrompt.length / 4
				);
			} else {
				contentAfterPrompt = this.extractEditorContent(
					contextParts[ 1 ],
					allocatedEditorContextToken / 2
				);
				contentBeforePrompt = this.extractEditorContent(
					contextParts[ 0 ],
					allocatedEditorContextToken - contentAfterPrompt.length / 4,
					true
				);
			}
		}

		// Combine the trimmed context with the cursor placeholder
		const escapedPrompt = prompt.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ); // Escapes special characters
		contentBeforePrompt = contentBeforePrompt.trim().replace( new RegExp( escapedPrompt.slice( 1 ) ), '@@@cursor@@@' );
		const trimmedContext = `${ contentBeforePrompt }\n${ contentAfterPrompt }`;
		return trimmedContext.trim();
	}

	/**
	 * Allocates tokens to the fetched content based on the available limit and the user's prompt.
	 *
	 * @param prompt - The user's prompt string.
	 * @param fetchedContent - An array of MarkdownContent objects containing fetched content.
	 * @returns An array of MarkdownContent objects with calculated tokenToRequest values.
	 */
	public allocateTokensToFetchedContent(
		prompt: string,
		fetchedContent: Array<MarkdownContent>
	): Array<MarkdownContent> {
		const editorContent =
			this.editor?.editing?.view?.domRoots?.get( 'main' )?.innerText ?? '';
		const editorToken = Math.min( Math.floor( this.contextSize * 0.3 ), this.countTokens( editorContent ) );
		let availableLimit = this.contextSize - editorToken;

		fetchedContent = fetchedContent
			.map( content => ( {
				...content,
				availableToken: this.countTokens( content.content )
			} ) )
			.sort( ( a, b ) => ( a.availableToken ?? 0 ) - ( b.availableToken ?? 0 ) );

		let maxTokenFromEachURL = availableLimit / fetchedContent.length;

		return fetchedContent.map( ( content, index ) => {
			if (
				content.availableToken &&
				content.availableToken <= maxTokenFromEachURL
			) {
				content.tokenToRequest = content.availableToken;
				availableLimit -= content.availableToken;
			} else if ( content.availableToken ) {
				content.tokenToRequest = maxTokenFromEachURL;
				availableLimit -= maxTokenFromEachURL;
			}
			maxTokenFromEachURL =
				availableLimit / ( fetchedContent.length - ( index + 1 ) );
			if ( content.tokenToRequest ) {
				content.content = this.trimLLMContentByTokens( content.content, content.tokenToRequest );
			}
			return content;
		} );
	}

	/**
	 * Generates Markdown content for an array of URLs by fetching their content.
	 *
	 * @param urls - An array of URLs to fetch content from.
	 * @returns A promise that resolves to an array of MarkdownContent objects.
	 */
	public async generateMarkDownForUrls(
		urls: Array<string>
	): Promise<Array<MarkdownContent>> {
		const editor = this.editor;
		const t = editor.t;
		let errorMsg: string | undefined;
		const markDownContents = await Promise.all(
			urls.map( async url => {
				const content = await this.fetchUrlContent( url );
				return { content, url };
			} )
		);

		const emptyContent = markDownContents.filter(
			( content ): content is MarkdownContent => !content?.content
		);
		if ( emptyContent.length ) {
			const urlStr = emptyContent?.map( content => content?.url ).join( ',' );
			errorMsg = t( 'Failed to fetch content of : %0', urlStr );
			if ( errorMsg ) {
				aiAgentContext.showError( errorMsg );
			}
			throw new Error( 'Unable to fetch content for few urls' );
		}
		return markDownContents.filter(
			( content ): content is MarkdownContent => content !== null
		);
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

	/**
	 * Extracts a portion of content based on the specified context size and direction.
	 *
	 * @param contentAfterPrompt - The content string to extract from.
	 * @param contextSize - The maximum size of the context to extract.
	 * @param reverse - A boolean indicating whether to extract in reverse order (default is false).
	 * @returns The extracted content string.
	 */
	public extractEditorContent(
		contentAfterPrompt: string,
		contextSize: number,
		reverse: boolean = false
	): string {
		let trimmedContent = '';
		let charCount = 0;
		// Tokenize the content into sentences using the sbd library
		const sentences = sbd.sentences( contentAfterPrompt, {
			preserve_whitespace: true,
			html_boundaries: true,
			allowed_tags: [ 'blockquote', 'figcaption', 'pre', 'h2', 'h1', 'h3', 'img', 'p', 'table', 'td', 'tr', 'li', 'hr', 'br' ]
		} );

		// Iterate over the sentences based on the direction
		const iterator = reverse ? sentences.reverse() : sentences;

		for ( const sentence of iterator ) {
			const sentenceLength = sentence.length;
			// Check if adding this sentence would exceed the context size
			if ( ( charCount + sentenceLength ) / 4 <= contextSize ) {
				trimmedContent = reverse ?
					sentence + trimmedContent :
					trimmedContent + sentence;
				charCount += sentenceLength;
			} else {
				break; // Stop if adding the next sentence would exceed the context size
			}
		}

		// Trim to remove any trailing whitespace and return the final trimmed content
		return trimmedContent.trim();
	}
}
